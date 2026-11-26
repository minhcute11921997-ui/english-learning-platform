"""
Unit & API tests for Tier-1 Vision Classifier FastAPI service v2
(including Probe Blend + Multi-Facet decoder + Conformal set + OOD detection).
"""

import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pytest
import torch
from fastapi.testclient import TestClient
from PIL import Image

import app as ai_app


def _make_jpeg_bytes(color=(120, 40, 200), size=(64, 64)) -> bytes:
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def client(monkeypatch):
    def fake_load():
        ai_app.engine.ready = True
        ai_app.engine.words = ["oil painting", "portrait", "pottery", "origami", "mosaic"]
        ai_app.engine.topic_ids = [1, 1, 2, 2, 2]
        ai_app.engine.ood_names = ["everyday_photo"]
        ai_app.engine.facets_meta = {
            "medium": {"label_vi": "Chất liệu & Kỹ thuật", "words": ["oil painting"]},
            "subject": {"label_vi": "Thể loại & Đề tài", "words": ["portrait"]},
            "craft": {"label_vi": "Nghề & Sản phẩm mỹ nghệ", "words": ["pottery", "origami", "mosaic"]},
        }
        ai_app.engine.word_to_facet = {
            "oil painting": "medium",
            "portrait": "subject",
            "pottery": "craft",
            "origami": "craft",
            "mosaic": "craft",
        }
        ai_app.engine.facet_indices = {"medium": [0], "subject": [1], "craft": [2, 3, 4]}
        ai_app.engine.has_probe = True
        ai_app.engine.total_requests = 0
        ai_app.engine.total_batches = 0

    def fake_infer(images):
        return [
            {
                "emb_id": "testemb123456789",
                "mode": "probe_blend",
                "top_k": [
                    {"word": "portrait", "topic_id": 1, "facet": "subject", "prob": 0.62, "sim": 0.24, "text_sim": 0.22},
                    {"word": "oil painting", "topic_id": 1, "facet": "medium", "prob": 0.28, "sim": 0.21, "text_sim": 0.20},
                    {"word": "pottery", "topic_id": 2, "facet": "craft", "prob": 0.05, "sim": 0.10, "text_sim": 0.09},
                    {"word": "origami", "topic_id": 2, "facet": "craft", "prob": 0.03, "sim": 0.08, "text_sim": 0.07},
                    {"word": "mosaic", "topic_id": 2, "facet": "craft", "prob": 0.02, "sim": 0.06, "text_sim": 0.05},
                ],
                "facets": [
                    {"facet": "subject", "facet_label_vi": "Thể loại & Đề tài", "word": "portrait", "topic_id": 1, "prob": 0.62, "within_facet_prob": 0.94, "logit": 4.2},
                    {"facet": "medium", "facet_label_vi": "Chất liệu & Kỹ thuật", "word": "oil painting", "topic_id": 1, "prob": 0.28, "within_facet_prob": 0.89, "logit": 3.4},
                ],
                "conformal_set": ["portrait", "oil painting"],
                "confident_match": True,
                "is_ood": False,
                "ood_prob": 0.03,
                "top1_sim": 0.24,
                "top1_text_sim": 0.22,
                "top1_prob": 0.62,
                "prob_margin": 0.34,
                "ood_max_sim": 0.05,
                "ood_label": "everyday_photo",
                "ood_margin": 0.17,
                "inference_ms": 11.2,
                "batch_size": len(images),
            }
            for _ in images
        ]

    monkeypatch.setattr(ai_app.engine, "load", fake_load)
    monkeypatch.setattr(ai_app.engine, "_infer_batch", fake_infer)

    with TestClient(ai_app.app) as c:
        yield c


def test_health_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["mode"] == "probe_blend"
    assert body["num_classes"] == 5
    assert body["num_facets"] == 3


def test_classify_valid_image_with_facets(client):
    res = client.post(
        "/classify",
        files={"file": ("sample.jpg", _make_jpeg_bytes(), "image/jpeg")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "probe_blend"
    assert data["top_k"][0]["word"] == "portrait"
    assert len(data["facets"]) == 2
    assert data["facets"][0]["facet"] == "subject"
    assert data["facets"][1]["word"] == "oil painting"
    assert data["conformal_set"] == ["portrait", "oil painting"]
    assert data["is_ood"] is False


def test_classify_invalid_image_returns_400(client):
    res = client.post(
        "/classify",
        files={"file": ("bad.jpg", b"not-an-image", "image/jpeg")},
    )
    assert res.status_code == 400


def test_classify_empty_returns_400(client):
    res = client.post(
        "/classify",
        files={"file": ("empty.jpg", b"", "image/jpeg")},
    )
    assert res.status_code == 400


def test_record_feedback_saves_vector_safely(client, tmp_path, monkeypatch):
    fb_file = tmp_path / "feedback_vectors.npz"
    monkeypatch.setattr(ai_app, "FEEDBACK_VECTORS_PATH", fb_file)
    vec = np.ones((16,), dtype=np.float32)
    vec /= np.linalg.norm(vec)
    emb_id = ai_app.engine._store_embedding(vec)

    res = client.post(
        "/record-feedback",
        json={
            "emb_id": emb_id,
            "predicted_word": "oil painting",
            "corrected_word": "portrait",
            "is_correct": False,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "recorded"
    assert body["saved_vector"] is True
    assert fb_file.exists()


def test_upsert_label_updates_classes(client, monkeypatch):
    class DummyModel:
        def get_text_features(self, **_kwargs):
            return torch.ones((4, 16), dtype=torch.float32)

    class DummyProcessor:
        def __call__(self, **_kwargs):
            class Batch(dict):
                def to(self, _dev):
                    return self

            return Batch({"input_ids": torch.zeros((4, 8), dtype=torch.long)})

    ai_app.engine.device = "cpu"
    ai_app.engine.model = DummyModel()
    ai_app.engine.processor = DummyProcessor()
    ai_app.engine.text_embs = torch.zeros((5, 16), dtype=torch.float32)
    ai_app.engine.combined_embs = torch.zeros((5, 16), dtype=torch.float32)

    res = client.post(
        "/upsert-label",
        json={"word": "batik", "topic_id": 2, "topic_name": "Crafts", "facet": "craft"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["num_classes"] == 6
    assert "batik" in ai_app.engine.words


def test_evaluate_probe_gold_benchmark_metrics(tmp_path):
    import json
    from eval.report import evaluate_probe

    words = ["oil painting", "watercolor", "portrait", "landscape"]
    dim = 8
    text_embs = np.eye(4, dim, dtype=np.float32)
    ood_embs = np.zeros((1, dim), dtype=np.float32)
    ood_embs[0, 4] = 1.0

    # Synthetic test embeddings:
    # 0: oil painting (gold wikiart_hf) -> top1 hit
    # 1: portrait (gold wikiart_hf, secondary="oil painting"), leans slightly oil painting so global top1=oil painting, within-facet subject=portrait -> multi_label hit
    # 2: legacy watercolor -> top1 hit
    # 3: gold vam_london OOD -> rejected
    e0 = np.array([1, 0, 0, 0, 0, 0, 0, 0], dtype=np.float32)
    e1 = np.array([0.82, 0.0, 0.57, 0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32)
    e2 = np.array([0, 1, 0, 0, 0, 0, 0, 0], dtype=np.float32)
    e3 = np.array([0, 0, 0, 0, 1, 0, 0, 0], dtype=np.float32)
    embs = np.stack([e0, e1, e2, e3]).astype(np.float32)

    cache_p = tmp_path / "cache.npz"
    proto_p = tmp_path / "proto.npz"
    probe_p = tmp_path / "probe.npz"
    facets_p = tmp_path / "facets.json"
    out_json_p = tmp_path / "bench.json"

    np.savez(
        cache_p,
        embeddings=embs,
        labels=np.array(["oil painting", "portrait", "watercolor", "out_of_scope"]),
        is_ood=np.array([False, False, False, True], dtype=bool),
        splits=np.array(["test", "test", "test", "test"]),
        is_gold_gt=np.array([True, True, False, True], dtype=bool),
        gt_sources=np.array(["wikiart_hf", "wikiart_hf", "legacy_search", "vam_london"]),
        secondary_labels=np.array(["", "oil painting", "", ""]),
    )
    np.savez(proto_p, words=np.array(words), text_embs=text_embs, ood_embs=ood_embs)

    coef = np.zeros((5, dim), dtype=np.float32)
    coef[:4, :4] = np.eye(4, dtype=np.float32) * 5.0
    coef[4, 4] = 8.0
    np.savez(
        probe_p,
        coef=coef,
        intercept=np.zeros((5,), dtype=np.float32),
        alpha_zs=np.array(0.25, dtype=np.float32),
        beta_probe=np.array(1.0, dtype=np.float32),
        zs_temp=np.array(10.0, dtype=np.float32),
        cal_temp=np.array(1.0, dtype=np.float32),
        conformal_q=np.array(0.90, dtype=np.float32),
        ood_prob_thresh=np.array(0.5, dtype=np.float32),
        ood_margin_thresh=np.array(-0.05, dtype=np.float32),
    )
    facets_p.write_text(
        json.dumps(
            {
                "facets": {
                    "medium": {"label_vi": "M", "words": ["oil painting", "watercolor"]},
                    "subject": {"label_vi": "S", "words": ["portrait", "landscape"]},
                }
            }
        ),
        encoding="utf-8",
    )

    res = evaluate_probe(cache_p, proto_p, probe_p, facets_p, quiet=False, out_json=out_json_p)
    assert res["n_in"] == 3
    assert res["n_ood"] == 1
    assert res["top1_acc"] == pytest.approx(2 / 3, abs=1e-3)
    assert res["within_facet_acc"] == pytest.approx(1.0)
    assert res["ood_rej_rate"] == pytest.approx(1.0)

    gb = res["gold_benchmark"]
    assert gb["n_in"] == 2
    assert gb["n_ood"] == 1
    assert gb["top1_acc"] == pytest.approx(0.5)
    assert gb["within_facet_acc"] == pytest.approx(1.0)
    assert gb["multi_label_hit_rate"] == pytest.approx(1.0)
    assert gb["ood_rej_rate"] == pytest.approx(1.0)
    assert gb["by_source"]["wikiart_hf"]["n_in"] == 2
    assert gb["by_source"]["vam_london"]["ood_rej_rate"] == pytest.approx(1.0)
    assert out_json_p.exists()


def test_residual_adapter_and_checkpoint_loading(tmp_path):
    import torch.nn as nn
    from train_probe import compute_blended_logits
    from vision_adapter import FINETUNED_PREFIXES, ResidualAdapter, apply_vision_checkpoint

    adapter = ResidualAdapter(dim=16, bottleneck=8, dropout=0.0).eval()
    x = torch.randn(4, 16, dtype=torch.float32)
    x = x / x.norm(dim=-1, keepdim=True)
    with torch.inference_mode():
        y = adapter(x)
    assert y.shape == (4, 16)
    norms = y.norm(dim=-1).numpy()
    assert np.allclose(norms, 1.0, atol=1e-5)

    class DummyVisionModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.weight = nn.Parameter(torch.zeros(4, 4, dtype=torch.float32))

    dummy_model = DummyVisionModel()
    ckpt_path = tmp_path / "vision_finetuned.pt"
    torch.save(
        {
            "vision_state_dict": {"weight": torch.ones(4, 4, dtype=torch.float16) * 2.0},
            "adapter_state_dict": adapter.state_dict(),
            "use_adapter": True,
            "dim": 16,
            "bottleneck": 8,
            "prefixes": list(FINETUNED_PREFIXES),
            "val_metrics": {"top1_in": 0.8},
        },
        ckpt_path,
    )

    loaded_adapter = apply_vision_checkpoint(dummy_model, ckpt_path, "cpu")
    assert loaded_adapter is not None
    assert torch.allclose(dummy_model.weight.data, torch.ones(4, 4, dtype=torch.float32) * 2.0)

    embs = y.numpy().astype(np.float32)
    text_embs = np.eye(4, 16, dtype=np.float32)
    probe_coef = np.eye(5, 16, dtype=np.float32)
    probe_intercept = np.zeros((5,), dtype=np.float32)
    facet_coef = np.eye(4, 16, dtype=np.float32) * 2.0
    facet_intercept = np.zeros((4,), dtype=np.float32)
    gate_coef = np.zeros((2, 16), dtype=np.float32)
    gate_coef[0, 0] = 3.0
    gate_coef[1, 2] = 3.0
    gate_intercept = np.zeros((2,), dtype=np.float32)
    word_facet_idx = np.array([0, 0, 1, 1], dtype=np.int64)

    blended = compute_blended_logits(
        embs,
        text_embs,
        probe_coef,
        probe_intercept,
        alpha_zs=0.25,
        beta_probe=1.0,
        zs_temp=10.0,
        facet_coef=facet_coef,
        facet_intercept=facet_intercept,
        gamma_facet=0.4,
        gate_coef=gate_coef,
        gate_intercept=gate_intercept,
        word_facet_idx=word_facet_idx,
    )
    assert blended.shape == (4, 5)
    assert np.all(np.isfinite(blended))


def test_adaptive_views_and_tool_priority():
    eng = ai_app.SiglipEngine()
    eng.device = "cpu"
    eng.dtype = torch.float32
    eng.words = ["oil painting", "portrait", "easel", "canvas", "palette", "brushstroke"]
    eng.topic_ids = [1] * 6
    eng.ood_names = ["everyday_photo"]
    eng.text_embs = torch.eye(6, 16, dtype=torch.float32)
    eng.combined_embs = torch.eye(6, 16, dtype=torch.float32)
    eng.ood_embs = torch.zeros((1, 16), dtype=torch.float32)
    eng.ood_embs[0, 15] = 1.0
    eng.facets_meta = {
        "medium": {"label_vi": "M", "words": ["oil painting"]},
        "subject": {"label_vi": "S", "words": ["portrait"]},
        "tool": {"label_vi": "T", "words": ["easel", "canvas", "palette", "brushstroke"]},
    }
    eng.word_to_facet = {
        "oil painting": "medium",
        "portrait": "subject",
        "easel": "tool",
        "canvas": "tool",
        "palette": "tool",
        "brushstroke": "tool",
    }
    eng.facet_indices = {"medium": [0], "subject": [1], "tool": [2, 3, 4, 5]}
    eng.has_probe = False

    seen_batch_counts = []

    class DummyProcessor:
        def __call__(self, images=None, **_kwargs):
            n = len(images)
            seen_batch_counts.append(n)
            return {"pixel_values": torch.zeros((n, 3, 8, 8), dtype=torch.float32)}

    class DummyModel:
        def get_image_features(self, pixel_values=None, **_kwargs):
            n = pixel_values.shape[0]
            feats = torch.zeros((n, 16), dtype=torch.float32)
            feats[:, 2] = 1.0
            return feats

    eng.processor = DummyProcessor()
    eng.model = DummyModel()

    img = Image.new("RGB", (64, 64), (100, 100, 100))
    # Small batch (2 <= ADAPTIVE_2VIEW_MAX_BATCH=4) -> 2 views -> 4 passes through model
    res_low = eng._infer_batch([img, img], use_two_view=None)
    assert seen_batch_counts[-1] == 4
    assert all(r["views_used"] == 2 for r in res_low)

    # Burst batch (6 > ADAPTIVE_2VIEW_MAX_BATCH=4) -> automatically drops to 1 view -> 6 passes (not 12)
    res_high = eng._infer_batch([img] * 6, use_two_view=None)
    assert seen_batch_counts[-1] == 6
    assert all(r["views_used"] == 1 for r in res_high)


def test_dual_backbone_dino_and_gbdt_stacker(tmp_path):
    from sklearn.ensemble import GradientBoostingClassifier
    from train_probe import (
        build_candidate_decision_features,
        compute_blended_logits,
        eval_gbdt_trees_np,
        export_gbdt_trees_np,
        unpack_gbdt_trees,
    )

    # Fit a small GBDT on synthetic candidate decision features favoring high DINOv2 + agreement
    rng = np.random.default_rng(7)
    X_meta = rng.uniform(0.0, 0.2, size=(100, 14)).astype(np.float32)
    y_meta = np.zeros((100,), dtype=np.int64)
    X_meta[:50, 4] = 2.0
    X_meta[:50, 5] = 0.85
    X_meta[:50, 11] = 0.70
    y_meta[:50] = 1
    gbdt = GradientBoostingClassifier(n_estimators=10, max_depth=3, learning_rate=0.1, random_state=42).fit(X_meta, y_meta)
    trees = export_gbdt_trees_np(gbdt, 14)

    # Round-trip strictly via allow_pickle=False
    p = tmp_path / "gbdt_probe.npz"
    np.savez(p, **trees)
    reloaded = unpack_gbdt_trees(np.load(p, allow_pickle=False))
    assert reloaded is not None
    assert np.allclose(eval_gbdt_trees_np(X_meta[:10], reloaded), gbdt.decision_function(X_meta[:10]), atol=1e-5)

    sig_embs = np.eye(2, 8, dtype=np.float32)
    text_embs = np.eye(4, 8, dtype=np.float32)
    dino_embs = np.zeros((2, 6), dtype=np.float32)
    dino_embs[:, 2] = 1.0  # strongly points to class 2 (easel)
    dino_coef = np.eye(5, 6, dtype=np.float32) * 4.0
    dino_intercept = np.zeros((5,), dtype=np.float32)
    probe_coef = np.eye(5, 8, dtype=np.float32)
    probe_intercept = np.zeros((5,), dtype=np.float32)
    facet_coef = np.eye(4, 8, dtype=np.float32)
    facet_intercept = np.zeros((4,), dtype=np.float32)
    gate_coef = np.zeros((2, 8), dtype=np.float32)
    gate_coef[0, 0] = 1.0
    gate_coef[1, 2] = 1.0
    gate_intercept = np.zeros((2,), dtype=np.float32)
    wf_idx = np.array([0, 0, 1, 1], dtype=np.int64)

    out = compute_blended_logits(
        sig_embs,
        text_embs,
        probe_coef,
        probe_intercept,
        alpha_zs=0.25,
        beta_probe=1.0,
        zs_temp=10.0,
        facet_coef=facet_coef,
        facet_intercept=facet_intercept,
        gamma_facet=0.5,
        gate_coef=gate_coef,
        gate_intercept=gate_intercept,
        word_facet_idx=wf_idx,
        dino_embs=dino_embs,
        dino_coef=dino_coef,
        dino_intercept=dino_intercept,
        beta_dino=1.2,
        gbdt_trees=reloaded,
        gamma_gbdt=0.5,
    )
    assert out.shape == (2, 5)
    assert np.all(np.isfinite(out))
    # Sample 1 already leans class 1 in SigLIP and class 2 in DINOv2; sample 0 sees DINOv2+GBDT boost class 2 above class 3
    assert out[0, 2] > out[0, 3]




