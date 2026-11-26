"""
FastAPI Micro-batched Vision Classifier (Tier 1) for EngLearn.
Runs frozen SigLIP on CUDA FP16 with 2-view (global + 70% center crop) inference,
calibrated global + per-facet Linear Probes, One-vs-Rest facet gates, dynamic
micro-batching, queue wait timeout, embedding ring buffer for closed-loop feedback,
and dynamic Admin label upsert.
"""

import asyncio
import collections
import io
import json
import os
import threading
import time
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any, List, Optional

import numpy as np
import torch
import torch.nn.functional as F
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, ImageOps
from pydantic import BaseModel
from scipy.special import softmax
from transformers import AutoImageProcessor, AutoModel, AutoProcessor

from prompts import build_prompts_for_label
from train_probe import compute_blended_logits, compute_hybrid_gate_and_intra, unpack_gbdt_trees
from vision_adapter import apply_vision_checkpoint

BASE_DIR = Path(__file__).resolve().parent
MODEL_NAME = os.environ.get("SIGLIP_MODEL", "google/siglip-so400m-patch14-384")
DINO_MODEL_NAME = os.environ.get("DINO_MODEL", "facebook/dinov2-base")
PROTOTYPES_PATH = Path(os.environ.get("PROTOTYPES_PATH", str(BASE_DIR / "prototypes.npz")))
PROBE_PATH = Path(os.environ.get("PROBE_PATH", str(BASE_DIR / "probe.npz")))
VISION_CKPT_PATH = Path(os.environ.get("VISION_CKPT_PATH", str(BASE_DIR / "vision_finetuned.pt")))
FACETS_PATH = Path(os.environ.get("FACETS_PATH", str(BASE_DIR / "facets.json")))
LABELS_PATH = Path(os.environ.get("LABELS_PATH", str(BASE_DIR / "labels.json")))
FEEDBACK_VECTORS_PATH = Path(os.environ.get("FEEDBACK_VECTORS_PATH", str(BASE_DIR / "data" / "feedback_vectors.npz")))

MAX_BATCH_SIZE = int(os.environ.get("AI_MAX_BATCH_SIZE", "16"))
BATCH_WAIT_MS = float(os.environ.get("AI_BATCH_WAIT_MS", "15"))
MAX_QUEUE_SIZE = int(os.environ.get("AI_TIER1_QUEUE_SIZE", "128"))
QUEUE_TIMEOUT_SEC = float(os.environ.get("AI_QUEUE_TIMEOUT_SEC", "4.5"))
TEMPERATURE = float(os.environ.get("AI_SOFTMAX_TEMP", "75.0"))
EMB_RING_MAX = int(os.environ.get("AI_EMB_RING_MAX", "500"))
ADAPTIVE_2VIEW_MAX_BATCH = int(os.environ.get("AI_ADAPTIVE_2VIEW_MAX_BATCH", "4"))
ADAPTIVE_2VIEW_MAX_QUEUE = int(os.environ.get("AI_ADAPTIVE_2VIEW_MAX_QUEUE", "2"))


def center_crop_70(img: Image.Image) -> Image.Image:
    w, h = img.size
    cw, ch = max(32, int(round(w * 0.70))), max(32, int(round(h * 0.70)))
    left = max(0, (w - cw) // 2)
    top = max(0, (h - ch) // 2)
    return img.crop((left, top, left + cw, top + ch))


def _decode_image(raw: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(raw))
    return ImageOps.exif_transpose(img).convert("RGB")


class FeedbackRequest(BaseModel):
    emb_id: str
    corrected_word: str
    predicted_word: Optional[str] = None
    is_correct: bool = False


class UpsertLabelRequest(BaseModel):
    word: str
    topic_id: int = 1
    topic_name: str = ""
    meaning_vi: str = ""
    image_alt: str = ""
    facet: str = "craft"


@dataclass
class BatchItem:
    image: Image.Image
    future: asyncio.Future
    enqueued_at: float


class SiglipEngine:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.float16 if self.device == "cuda" else torch.float32
        self.processor = None
        self.model = None
        self.words: List[str] = []
        self.topic_ids: List[int] = []
        self.ood_names: List[str] = []
        self.text_embs: Optional[torch.Tensor] = None
        self.combined_embs: Optional[torch.Tensor] = None
        self.ood_embs: Optional[torch.Tensor] = None

        # Trained & calibrated Dual-Backbone probes + MoE / GBDT decision router
        self.dino_processor = None
        self.dino_model = None
        self.adapter = None
        self.vision_finetuned = False
        self.has_probe = False
        self.probe_coef_np: Optional[np.ndarray] = None
        self.probe_intercept_np: Optional[np.ndarray] = None
        self.facet_coef_np: Optional[np.ndarray] = None
        self.facet_intercept_np: Optional[np.ndarray] = None
        self.gate_coef_np: Optional[np.ndarray] = None
        self.gate_intercept_np: Optional[np.ndarray] = None
        self.dino_coef_np: Optional[np.ndarray] = None
        self.dino_intercept_np: Optional[np.ndarray] = None
        self.dino_facet_coef_np: Optional[np.ndarray] = None
        self.dino_facet_intercept_np: Optional[np.ndarray] = None
        self.dino_gate_coef_np: Optional[np.ndarray] = None
        self.dino_gate_intercept_np: Optional[np.ndarray] = None
        self.gbdt_trees: Optional[dict[str, np.ndarray]] = None
        self.moe_facet_weights: Optional[np.ndarray] = None
        self.word_facet_idx: Optional[np.ndarray] = None
        self.facet_names_gate: List[str] = []
        self.gate_prob_thresh = 0.40
        self.alpha_zs = 0.35
        self.beta_probe = 1.0
        self.beta_dino = 0.0
        self.dino_gate_weight = 0.0
        self.dino_intra_weight = 0.0
        self.gamma_facet = 0.0
        self.gamma_gbdt = 0.0
        self.zs_temp = TEMPERATURE
        self.cal_temp = 1.0
        self.ood_prob_thresh = 0.45
        self.ood_margin_thresh = 0.0
        self.conformal_q = 0.85
        self.conf_thresh = 0.50
        self.facet_prob_min = 0.45
        self.facet_logit_gap_max = 2.5

        # Facet lookup structures
        self.allowed_words: Optional[set[str]] = None
        self.facets_meta: dict[str, dict] = {}
        self.word_to_facet: dict[str, str] = {}
        self.facet_indices: dict[str, List[int]] = {}

        # Privacy-safe ring buffer of recent L2-normalized float16 embeddings (max 500)
        self.emb_ring: collections.OrderedDict[str, np.ndarray] = collections.OrderedDict()
        self._ring_lock = threading.Lock()
        self._feedback_lock = threading.Lock()

        self.queue: Optional[asyncio.Queue] = None
        self.worker_task: Optional[asyncio.Task] = None
        self.ready = False
        self.total_requests = 0
        self.total_batches = 0

    def _load_allowed_words(self):
        if not LABELS_PATH.exists():
            self.allowed_words = None
            return
        raw = json.loads(LABELS_PATH.read_text(encoding="utf-8")).get("labels", [])
        words = {str(item["word"]).strip().lower() for item in raw if item.get("word")}
        self.allowed_words = words if words else None

    def _load_facets(self):
        if not FACETS_PATH.exists():
            return
        raw = json.loads(FACETS_PATH.read_text(encoding="utf-8"))["facets"]
        word_to_idx = {w: i for i, w in enumerate(self.words)}
        self.facets_meta = raw
        self.word_to_facet = {}
        self.facet_indices = {}
        for fname, fobj in raw.items():
            idxs = []
            for w in fobj.get("words", []):
                if self.allowed_words is not None and w.lower() not in self.allowed_words:
                    continue
                self.word_to_facet[w] = fname
                if w in word_to_idx:
                    idxs.append(word_to_idx[w])
            if idxs:
                self.facet_indices[fname] = idxs

    def _load_probe(self):
        if not PROBE_PATH.exists():
            self.has_probe = False
            return
        pr = np.load(PROBE_PATH, allow_pickle=False)
        self.probe_coef_np = np.asarray(pr["coef"], dtype=np.float32)
        self.probe_intercept_np = np.asarray(pr["intercept"], dtype=np.float32)
        self.alpha_zs = float(pr["alpha_zs"].item())
        self.beta_probe = float(pr["beta_probe"].item())
        self.beta_dino = float(pr["beta_dino"].item()) if "beta_dino" in pr else 0.0
        self.dino_gate_weight = float(pr["dino_gate_weight"].item()) if "dino_gate_weight" in pr else 0.0
        self.dino_intra_weight = float(pr["dino_intra_weight"].item()) if "dino_intra_weight" in pr else 0.0
        self.gamma_facet = float(pr["gamma_facet"].item()) if "gamma_facet" in pr else 0.0
        self.gamma_gbdt = float(pr["gamma_gbdt"].item()) if "gamma_gbdt" in pr else 0.0
        self.zs_temp = float(pr["zs_temp"].item())
        self.cal_temp = float(pr["cal_temp"].item())
        self.ood_prob_thresh = float(pr["ood_prob_thresh"].item())
        self.ood_margin_thresh = float(pr["ood_margin_thresh"].item())
        self.conformal_q = float(pr["conformal_q"].item())
        self.conf_thresh = float(pr["conf_thresh"].item())
        self.facet_prob_min = float(pr["facet_prob_min"].item())
        self.facet_logit_gap_max = float(pr["facet_logit_gap_max"].item())

        self.facet_coef_np = np.asarray(pr["facet_coef"], dtype=np.float32) if "facet_coef" in pr else None
        self.facet_intercept_np = np.asarray(pr["facet_intercept"], dtype=np.float32) if "facet_intercept" in pr else None
        if "gate_coef" in pr and "gate_intercept" in pr and "facet_names" in pr:
            self.gate_coef_np = np.asarray(pr["gate_coef"], dtype=np.float32)
            self.gate_intercept_np = np.asarray(pr["gate_intercept"], dtype=np.float32)
            self.facet_names_gate = [str(f) for f in pr["facet_names"]]
            self.gate_prob_thresh = float(pr["gate_prob_thresh"].item()) if "gate_prob_thresh" in pr else 0.40
        else:
            self.gate_coef_np = self.gate_intercept_np = None
            self.facet_names_gate = []

        self.dino_coef_np = np.asarray(pr["dino_coef"], dtype=np.float32) if "dino_coef" in pr else None
        self.dino_intercept_np = np.asarray(pr["dino_intercept"], dtype=np.float32) if "dino_intercept" in pr else None
        self.dino_facet_coef_np = np.asarray(pr["dino_facet_coef"], dtype=np.float32) if "dino_facet_coef" in pr else None
        self.dino_facet_intercept_np = np.asarray(pr["dino_facet_intercept"], dtype=np.float32) if "dino_facet_intercept" in pr else None
        self.dino_gate_coef_np = np.asarray(pr["dino_gate_coef"], dtype=np.float32) if "dino_gate_coef" in pr else None
        self.dino_gate_intercept_np = np.asarray(pr["dino_gate_intercept"], dtype=np.float32) if "dino_gate_intercept" in pr else None
        self.gbdt_trees = unpack_gbdt_trees(pr)
        self.moe_facet_weights = np.asarray(pr["moe_facet_weights"], dtype=np.float32) if "moe_facet_weights" in pr else None
        self.word_facet_idx = np.asarray(pr["word_facet_idx"], dtype=np.int64) if "word_facet_idx" in pr else None
        self.has_probe = True

    def _is_dino_active(self) -> bool:
        return bool(
            self.dino_coef_np is not None
            and (
                self.beta_dino > 0
                or self.gamma_gbdt > 0
                or self.dino_gate_weight > 0
                or self.dino_intra_weight > 0
                or (self.moe_facet_weights is not None and bool(np.any(self.moe_facet_weights[:, 2] > 0)))
            )
        )

    def _ensure_dino_loaded(self):
        if self.dino_model is None and self._is_dino_active():
            self.dino_processor = AutoImageProcessor.from_pretrained(DINO_MODEL_NAME)
            self.dino_model = AutoModel.from_pretrained(DINO_MODEL_NAME, torch_dtype=self.dtype).to(self.device).eval()

    def load(self):
        if not PROTOTYPES_PATH.exists():
            raise RuntimeError(f"Prototypes file not found: {PROTOTYPES_PATH}. Run build_prototypes.py first.")

        proto = np.load(PROTOTYPES_PATH, allow_pickle=False)
        proto_model = str(proto["model_name"].item()) if "model_name" in proto else MODEL_NAME
        model_id = os.environ.get("SIGLIP_MODEL", proto_model)

        self.processor = AutoProcessor.from_pretrained(model_id)
        self.model = AutoModel.from_pretrained(model_id, torch_dtype=self.dtype).to(self.device).eval()
        self.adapter = apply_vision_checkpoint(self.model, VISION_CKPT_PATH, self.device)
        self.vision_finetuned = bool(self.adapter is not None or VISION_CKPT_PATH.exists())

        self.words = [str(w) for w in proto["words"]]
        self.topic_ids = [int(t) for t in proto["topic_ids"]]
        self.ood_names = [str(n) for n in proto["ood_names"]]
        self.text_embs = torch.from_numpy(proto["text_embs"]).to(self.device, dtype=torch.float32)
        self.combined_embs = torch.from_numpy(proto["combined_embs"]).to(self.device, dtype=torch.float32)
        self.ood_embs = torch.from_numpy(proto["ood_embs"]).to(self.device, dtype=torch.float32)

        self._load_allowed_words()
        self._sync_missing_labels()
        self._load_facets()
        self._load_probe()
        self._ensure_dino_loaded()

        # Warmup once on CUDA
        dummy = Image.new("RGB", (384, 384), (128, 128, 128))
        self._infer_batch([dummy])
        self.ready = True

    def reload_artifacts(self):
        if self.model is not None:
            self.adapter = apply_vision_checkpoint(self.model, VISION_CKPT_PATH, self.device)
            self.vision_finetuned = bool(self.adapter is not None or VISION_CKPT_PATH.exists())
        self._load_allowed_words()
        self._sync_missing_labels()
        self._load_facets()
        self._load_probe()
        self._ensure_dino_loaded()

    def _store_embedding(self, vec_np: np.ndarray) -> str:
        emb_id = uuid.uuid4().hex[:16]
        vec_f16 = vec_np.astype(np.float16)
        with self._ring_lock:
            self.emb_ring[emb_id] = vec_f16
            if len(self.emb_ring) > EMB_RING_MAX:
                self.emb_ring.popitem(last=False)
        return emb_id

    def get_cached_embedding(self, emb_id: str) -> Optional[np.ndarray]:
        with self._ring_lock:
            v = self.emb_ring.get(emb_id)
            return v.astype(np.float32) if v is not None else None

    def _sync_missing_labels(self):
        if not LABELS_PATH.exists() or self.model is None or self.processor is None:
            return
        raw = json.loads(LABELS_PATH.read_text(encoding="utf-8")).get("labels", [])
        existing = {w.lower() for w in self.words}
        for item in raw:
            word = str(item.get("word") or "").strip()
            if not word or word.lower() in existing:
                continue
            topic_id = int(item.get("topic_id", 1))
            self._upsert_label_internal(
                UpsertLabelRequest(
                    word=word,
                    topic_id=topic_id,
                    topic_name=item.get("topic_name", ""),
                    meaning_vi=item.get("meaning_vi", ""),
                    image_alt=item.get("image_alt", ""),
                    facet="craft" if topic_id == 2 else "medium",
                )
            )
            existing.add(word.lower())

    def _upsert_label_internal(self, req: UpsertLabelRequest) -> dict[str, Any]:
        if self.model is None or self.processor is None:
            raise HTTPException(status_code=503, detail="AI engine not ready")

        word = req.word.strip()
        if not word:
            raise HTTPException(status_code=400, detail="Empty word")

        prompts = build_prompts_for_label(
            {
                "word": word,
                "topic_name": req.topic_name,
                "image_alt": req.image_alt,
            }
        )
        txt_inputs = self.processor(text=prompts, padding="max_length", truncation=True, return_tensors="pt").to(self.device)
        with torch.inference_mode():
            t_feat = self.model.get_text_features(**txt_inputs)
            if hasattr(t_feat, "pooler_output"):
                t_feat = t_feat.pooler_output
            t_feat = t_feat.float()
            t_feat = t_feat / t_feat.norm(dim=-1, keepdim=True).clamp(min=1e-8)
            t_feat = t_feat.mean(dim=0, keepdim=True)
            t_feat = t_feat / t_feat.norm(dim=-1, keepdim=True).clamp(min=1e-8)

        lower_words = [w.lower() for w in self.words]
        if word.lower() in lower_words:
            idx = lower_words.index(word.lower())
            self.words[idx] = word
            self.topic_ids[idx] = int(req.topic_id)
            self.text_embs[idx] = t_feat.squeeze(0)
            self.combined_embs[idx] = t_feat.squeeze(0)
        else:
            idx = len(self.words)
            self.words.append(word)
            self.topic_ids.append(int(req.topic_id))
            self.text_embs = torch.cat([self.text_embs, t_feat], dim=0)
            self.combined_embs = torch.cat([self.combined_embs, t_feat], dim=0)

        facet = req.facet if req.facet in self.facets_meta else "craft"
        if self.allowed_words is not None:
            self.allowed_words.add(word.lower())
        self.word_to_facet[word] = facet
        if facet in self.facet_indices and idx not in self.facet_indices[facet]:
            self.facet_indices[facet].append(idx)

        return {"status": "ok", "word": word, "index": idx, "num_classes": len(self.words)}

    def upsert_label(self, req: UpsertLabelRequest) -> dict[str, Any]:
        if not self.ready or self.model is None or self.processor is None:
            raise HTTPException(status_code=503, detail="AI engine not ready")
        return self._upsert_label_internal(req)

    def _extract_dino_features(self, images_sub: List[Image.Image], use_two_view: bool) -> np.ndarray:
        sub_n = len(images_sub)
        eval_sub = (list(images_sub) + [center_crop_70(im) for im in images_sub]) if use_two_view else list(images_sub)
        d_inputs = self.dino_processor(images=eval_sub, return_tensors="pt")
        for k, v in d_inputs.items():
            if torch.is_tensor(v):
                if self.dtype == torch.float16 and k == "pixel_values":
                    d_inputs[k] = v.to(self.device, dtype=torch.float16, non_blocking=True)
                else:
                    d_inputs[k] = v.to(self.device, non_blocking=True)
        with torch.inference_mode():
            d_out = self.dino_model(**d_inputs)
            cls_tok = F.normalize(d_out.last_hidden_state[:, 0].float(), dim=-1)
            patch_m = F.normalize(d_out.last_hidden_state[:, 1:].float().mean(dim=1), dim=-1)
            d_all = F.normalize(0.5 * cls_tok + 0.5 * patch_m, dim=-1)
            if use_two_view:
                d_merged = F.normalize(0.65 * d_all[:sub_n] + 0.35 * d_all[sub_n:], dim=-1)
            else:
                d_merged = d_all
        return d_merged.cpu().numpy().astype(np.float32)

    def _infer_batch(self, images: List[Image.Image], use_two_view: Optional[bool] = None) -> List[dict]:
        t0 = time.perf_counter()
        batch_size = len(images)
        if use_two_view is None:
            q_depth = self.queue.qsize() if self.queue is not None else 0
            use_two_view = (batch_size <= ADAPTIVE_2VIEW_MAX_BATCH) and (q_depth <= ADAPTIVE_2VIEW_MAX_QUEUE)
        views_used = 2 if use_two_view else 1

        # Adaptive 2-view (low load) vs 1-view (high concurrency burst) inference
        eval_imgs = (list(images) + [center_crop_70(im) for im in images]) if use_two_view else list(images)
        inputs = self.processor(images=eval_imgs, return_tensors="pt")
        for k, v in inputs.items():
            if torch.is_tensor(v):
                if self.dtype == torch.float16 and k == "pixel_values":
                    inputs[k] = v.to(self.device, dtype=torch.float16, non_blocking=True)
                else:
                    inputs[k] = v.to(self.device, non_blocking=True)

        with torch.inference_mode():
            feat_all = self.model.get_image_features(**inputs)
            if hasattr(feat_all, "pooler_output"):
                feat_all = feat_all.pooler_output
            feat_all = feat_all.float()
            feat_all = feat_all / feat_all.norm(dim=-1, keepdim=True).clamp(min=1e-8)

            if use_two_view:
                feat_global = feat_all[:batch_size]
                feat_center = feat_all[batch_size:]
                img_feat = 0.65 * feat_global + 0.35 * feat_center
                img_feat = img_feat / img_feat.norm(dim=-1, keepdim=True).clamp(min=1e-8)
            else:
                img_feat = feat_all

            if self.adapter is not None:
                img_feat = self.adapter(img_feat)

            num_classes = len(self.words)
            sim_combined = img_feat @ self.combined_embs.T  # (B, C)
            sim_text = img_feat @ self.text_embs.T          # (B, C)
            sim_ood = img_feat @ self.ood_embs.T            # (B, N_ood)

        img_feat_np = img_feat.cpu().numpy()
        sim_c_np = sim_combined.cpu().numpy()
        sim_t_np = sim_text.cpu().numpy()
        sim_o_np = sim_ood.cpu().numpy()

        gate_probs_np = None
        if self.has_probe and self.probe_coef_np is not None and self.probe_intercept_np is not None:
            n_probe_art = int(self.probe_coef_np.shape[0] - 1)
            n_shared = min(num_classes, n_probe_art)
            text_shared_np = self.text_embs[:n_shared].cpu().numpy()

            blend_common = {
                "probe_coef": self.probe_coef_np,
                "probe_intercept": self.probe_intercept_np,
                "alpha_zs": self.alpha_zs,
                "beta_probe": self.beta_probe,
                "zs_temp": self.zs_temp,
                "facet_coef": self.facet_coef_np[:n_shared] if self.facet_coef_np is not None else None,
                "facet_intercept": self.facet_intercept_np[:n_shared] if self.facet_intercept_np is not None else None,
                "gamma_facet": self.gamma_facet,
                "gate_coef": self.gate_coef_np,
                "gate_intercept": self.gate_intercept_np,
                "word_facet_idx": self.word_facet_idx[:n_shared] if self.word_facet_idx is not None else None,
                "dino_coef": self.dino_coef_np,
                "dino_intercept": self.dino_intercept_np,
                "dino_facet_coef": self.dino_facet_coef_np[:n_shared] if self.dino_facet_coef_np is not None else None,
                "dino_facet_intercept": self.dino_facet_intercept_np[:n_shared] if self.dino_facet_intercept_np is not None else None,
                "dino_gate_coef": self.dino_gate_coef_np,
                "dino_gate_intercept": self.dino_gate_intercept_np,
                "beta_dino": self.beta_dino,
                "gbdt_trees": self.gbdt_trees,
                "gamma_gbdt": self.gamma_gbdt,
                "moe_facet_weights": self.moe_facet_weights,
                "dino_gate_weight": self.dino_gate_weight,
                "dino_intra_weight": self.dino_intra_weight,
            }

            blended_shared = compute_blended_logits(img_feat_np, text_shared_np, **blend_common, dino_embs=None)

            dino_feat_np = None
            if (
                self.dino_model is not None
                and self.dino_processor is not None
                and self._is_dino_active()
            ):
                if n_shared < 30 or self.dino_gate_weight > 0 or self.dino_intra_weight > 0:
                    ambig_idxs = list(range(batch_size))
                else:
                    top2_vals = np.partition(blended_shared[:, :n_shared], -2, axis=1)[:, -2:]
                    gaps = np.abs(top2_vals[:, 1] - top2_vals[:, 0])
                    ambig_idxs = [int(r) for r in np.where(gaps < 0.60)[0]]

                if ambig_idxs:
                    dino_sub_np = self._extract_dino_features([images[r] for r in ambig_idxs], use_two_view)
                    blended_shared[ambig_idxs] = compute_blended_logits(
                        img_feat_np[ambig_idxs], text_shared_np, **blend_common, dino_embs=dino_sub_np
                    )
                    if self.dino_gate_weight > 0 or self.dino_intra_weight > 0:
                        dino_feat_np = np.zeros((batch_size, dino_sub_np.shape[1]), dtype=np.float32)
                        dino_feat_np[ambig_idxs] = dino_sub_np

            art_logits_np = np.zeros((batch_size, num_classes), dtype=np.float32)
            art_logits_np[:, :n_shared] = blended_shared[:, :n_shared]
            if num_classes > n_shared:
                art_logits_np[:, n_shared:] = sim_t_np[:, n_shared:] * self.zs_temp

            if self.allowed_words is not None:
                disallowed_mask = np.array([w.lower() not in self.allowed_words for w in self.words], dtype=bool)
                if np.any(disallowed_mask):
                    art_logits_np[:, disallowed_mask] = -1e9

            ood_logit_np = blended_shared[:, n_shared : n_shared + 1]
            logits_all_np = np.concatenate([art_logits_np, ood_logit_np], axis=1)
            probs_all_np = softmax(logits_all_np / max(0.25, self.cal_temp), axis=1)
            art_probs_np = softmax(art_logits_np / max(0.25, self.cal_temp), axis=1)

            if self.gate_coef_np is not None and self.facet_coef_np is not None and self.word_facet_idx is not None:
                gate_probs_np, _ = compute_hybrid_gate_and_intra(
                    img_feat_np,
                    art_logits_np[:, :n_shared],
                    self.gate_coef_np,
                    self.gate_intercept_np,
                    self.facet_coef_np,
                    self.facet_intercept_np,
                    self.word_facet_idx[:n_shared],
                    dino_embs=dino_feat_np,
                    dino_gate_coef=self.dino_gate_coef_np,
                    dino_gate_intercept=self.dino_gate_intercept_np,
                    dino_facet_coef=self.dino_facet_coef_np,
                    dino_facet_intercept=self.dino_facet_intercept_np,
                    dino_gate_weight=self.dino_gate_weight,
                    dino_intra_weight=self.dino_intra_weight,
                )
        else:
            art_logits_np = sim_c_np * TEMPERATURE
            if self.allowed_words is not None:
                disallowed_mask = np.array([w.lower() not in self.allowed_words for w in self.words], dtype=bool)
                if np.any(disallowed_mask):
                    art_logits_np[:, disallowed_mask] = -1e9
            art_probs_np = softmax(art_logits_np, axis=1)
            probs_all_np = None

        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        results = []
        conformal_cutoff = max(0.05, 1.0 - self.conformal_q)
        allowed_mask = (
            np.array([w.lower() in self.allowed_words for w in self.words], dtype=bool)
            if self.allowed_words is not None
            else None
        )

        for i in range(batch_size):
            emb_id = self._store_embedding(img_feat_np[i])
            order = np.argsort(-art_probs_np[i])[:5]
            top_k = [
                {
                    "word": self.words[idx],
                    "topic_id": self.topic_ids[idx],
                    "facet": self.word_to_facet.get(self.words[idx], "general"),
                    "prob": round(float(art_probs_np[i, idx]), 4),
                    "sim": round(float(sim_c_np[i, idx]), 4),
                    "text_sim": round(float(sim_t_np[i, idx]), 4),
                }
                for idx in order
            ]
            ood_idx = int(np.argmax(sim_o_np[i]))
            ood_max_sim = float(sim_o_np[i, ood_idx])
            if allowed_mask is not None and np.any(allowed_mask):
                top1_text_sim = float(np.max(sim_t_np[i, allowed_mask]))
            else:
                top1_text_sim = float(np.max(sim_t_np[i]))
            ood_margin = top1_text_sim - ood_max_sim

            if probs_all_np is not None:
                ood_prob = float(probs_all_np[i, -1])
                is_ood = bool(ood_prob >= self.ood_prob_thresh or ood_margin < self.ood_margin_thresh)
            else:
                ood_prob = 0.0
                is_ood = bool(top1_text_sim < 0.04 or ood_margin < 0.01)

            conf_order = np.argsort(-art_probs_np[i])
            conformal_set = [
                self.words[idx]
                for idx in conf_order[:4]
                if art_probs_np[i, idx] >= conformal_cutoff
            ]
            if not conformal_set:
                conformal_set = [top_k[0]["word"]]

            max_art_logit = float(np.max(art_logits_np[i]))
            facet_hits = []
            for fname, idxs in self.facet_indices.items():
                f_logits = art_logits_np[i, idxs]
                best_local = int(np.argmax(f_logits))
                best_global_idx = idxs[best_local]
                best_logit = float(f_logits[best_local])
                exp_f = np.exp((f_logits - best_logit) / max(0.25, self.cal_temp))
                within_prob = float(exp_f[best_local] / np.sum(exp_f))
                global_prob = float(art_probs_np[i, best_global_idx])

                is_primary_facet = best_global_idx == int(order[0])
                gate_ok = True
                if gate_probs_np is not None and fname in self.facet_names_gate:
                    g_idx = self.facet_names_gate.index(fname)
                    gate_ok = bool(gate_probs_np[i, g_idx] >= self.gate_prob_thresh)

                active_facet = is_primary_facet or (
                    gate_ok
                    and within_prob >= self.facet_prob_min
                    and (max_art_logit - best_logit) <= self.facet_logit_gap_max
                )
                if active_facet:
                    facet_hits.append(
                        {
                            "facet": fname,
                            "facet_label_vi": self.facets_meta[fname].get("label_vi", fname),
                            "word": self.words[best_global_idx],
                            "topic_id": self.topic_ids[best_global_idx],
                            "prob": round(global_prob, 4),
                            "within_facet_prob": round(within_prob, 4),
                            "logit": round(best_logit, 3),
                        }
                    )
            facet_hits.sort(key=lambda x: x["logit"], reverse=True)
            facet_hits = facet_hits[:3]

            results.append(
                {
                    "emb_id": emb_id,
                    "mode": "probe_blend" if self.has_probe else "zero_shot",
                    "top_k": top_k,
                    "facets": facet_hits,
                    "conformal_set": conformal_set,
                    "confident_match": bool(not is_ood and top_k[0]["prob"] >= self.conf_thresh),
                    "is_ood": is_ood,
                    "ood_prob": round(ood_prob, 4),
                    "top1_sim": round(float(top_k[0]["sim"]), 4),
                    "top1_text_sim": round(top1_text_sim, 4),
                    "top1_prob": top_k[0]["prob"],
                    "prob_margin": round(top_k[0]["prob"] - top_k[1]["prob"], 4) if len(top_k) > 1 else 1.0,
                    "ood_max_sim": round(ood_max_sim, 4),
                    "ood_label": self.ood_names[ood_idx],
                    "ood_margin": round(ood_margin, 4),
                    "inference_ms": round(elapsed_ms, 2),
                    "batch_size": batch_size,
                    "views_used": views_used,
                }
            )
        return results

    async def batch_worker(self):
        assert self.queue is not None
        while True:
            first: BatchItem = await self.queue.get()
            raw_batch = [first]
            deadline = time.perf_counter() + (BATCH_WAIT_MS / 1000.0)
            while len(raw_batch) < MAX_BATCH_SIZE:
                remaining = deadline - time.perf_counter()
                if remaining <= 0:
                    break
                try:
                    nxt = await asyncio.wait_for(self.queue.get(), timeout=remaining)
                    raw_batch.append(nxt)
                except asyncio.TimeoutError:
                    break

            active_batch = [b for b in raw_batch if not b.future.cancelled() and not b.future.done()]
            if not active_batch:
                for _ in raw_batch:
                    self.queue.task_done()
                continue

            try:
                images = [b.image for b in active_batch]
                outputs = await asyncio.to_thread(self._infer_batch, images)
                self.total_batches += 1
                self.total_requests += len(active_batch)
                for item, out in zip(active_batch, outputs):
                    if not item.future.done() and not item.future.cancelled():
                        out["queue_ms"] = round((time.perf_counter() - item.enqueued_at) * 1000.0 - out["inference_ms"], 2)
                        item.future.set_result(out)
            except Exception as exc:
                for item in active_batch:
                    if not item.future.done() and not item.future.cancelled():
                        item.future.set_exception(exc)
            finally:
                for _ in raw_batch:
                    self.queue.task_done()

    async def classify(self, image: Image.Image) -> dict:
        if not self.ready or self.queue is None:
            raise HTTPException(status_code=503, detail="AI Tier-1 engine is not ready")
        if self.queue.full():
            raise HTTPException(status_code=429, detail="AI Tier-1 queue is full, please retry shortly")

        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        self.queue.put_nowait(BatchItem(image=image, future=fut, enqueued_at=time.perf_counter()))
        try:
            return await asyncio.wait_for(fut, timeout=QUEUE_TIMEOUT_SEC)
        except asyncio.TimeoutError:
            fut.cancel()
            raise HTTPException(status_code=504, detail="AI queue wait timed out")

    def record_feedback(self, req: FeedbackRequest) -> dict[str, Any]:
        if req.is_correct:
            return {"status": "ignored", "saved_vector": False}
        corrected = req.corrected_word.strip()
        if not corrected or corrected not in self.words:
            return {"status": "ignored", "saved_vector": False}
        vec = self.get_cached_embedding(req.emb_id)
        if vec is None:
            return {"status": "ignored", "saved_vector": False}

        with self._feedback_lock:
            FEEDBACK_VECTORS_PATH.parent.mkdir(parents=True, exist_ok=True)
            if FEEDBACK_VECTORS_PATH.exists():
                old = np.load(FEEDBACK_VECTORS_PATH, allow_pickle=False)
                embs = np.concatenate([old["embeddings"].astype(np.float32), vec[None, :]], axis=0)
                words = list(old["words"]) + [corrected]
            else:
                embs = vec[None, :].astype(np.float32)
                words = [corrected]
            tmp_path = FEEDBACK_VECTORS_PATH.with_name(f"{FEEDBACK_VECTORS_PATH.stem}.tmp.npz")
            np.savez(tmp_path, embeddings=embs, words=np.array(words))
            os.replace(tmp_path, FEEDBACK_VECTORS_PATH)
        return {"status": "recorded", "saved_vector": True, "total_vectors": len(words)}


engine = SiglipEngine()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if not os.environ.get("AI_SKIP_MODEL_LOAD"):
        engine.load()
        engine.queue = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)
        engine.worker_task = asyncio.create_task(engine.batch_worker())
    try:
        yield
    finally:
        if engine.worker_task:
            engine.worker_task.cancel()


app = FastAPI(title="EngLearn Vision Classifier", version="2.1.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok" if engine.ready else "initializing",
        "device": engine.device,
        "dtype": str(engine.dtype),
        "model": MODEL_NAME,
        "mode": "probe_blend" if engine.has_probe else "zero_shot",
        "vision_finetuned": bool(engine.adapter is not None or engine.vision_finetuned),
        "dino_enabled": bool(engine.dino_model is not None),
        "gbdt_router": bool(engine.gamma_gbdt > 0 and engine.gbdt_trees is not None),
        "gpu_mem_allocated_mib": round(float(torch.cuda.max_memory_allocated() / (1024 * 1024)), 1) if torch.cuda.is_available() else 0.0,
        "num_classes": len(engine.allowed_words) if engine.allowed_words is not None else len(engine.words),
        "num_facets": len(engine.facet_indices),
        "queue_size": engine.queue.qsize() if engine.queue else 0,
        "max_queue_size": MAX_QUEUE_SIZE,
        "adaptive_2view_max_batch": ADAPTIVE_2VIEW_MAX_BATCH,
        "total_requests": engine.total_requests,
        "total_batches": engine.total_batches,
    }


@app.post("/reload")
def reload_artifacts() -> dict[str, Any]:
    engine.reload_artifacts()
    return {"status": "ok", "has_probe": engine.has_probe, "num_facets": len(engine.facet_indices)}


@app.post("/record-feedback")
def record_feedback(req: FeedbackRequest) -> dict[str, Any]:
    return engine.record_feedback(req)


@app.post("/upsert-label")
def upsert_label(req: UpsertLabelRequest) -> dict[str, Any]:
    return engine.upsert_label(req)


@app.post("/classify")
async def classify(file: UploadFile = File(...)) -> dict[str, Any]:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty image upload")
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 8MB)")

    try:
        img = await asyncio.to_thread(_decode_image, raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file")

    return await engine.classify(img)
