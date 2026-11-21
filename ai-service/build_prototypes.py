"""
Build visual + text prototype embeddings for all 60 Fine Arts & Crafts labels
plus OOD negative anchors, saving them to prototypes.npz.
"""

import argparse
import json
import os
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageOps
from transformers import AutoModel, AutoProcessor

from prompts import OOD_ANCHORS, build_prompts_for_label
from vision_adapter import apply_vision_checkpoint


def center_crop_70(img: Image.Image) -> Image.Image:
    w, h = img.size
    cw, ch = max(32, int(round(w * 0.70))), max(32, int(round(h * 0.70)))
    left = max(0, (w - cw) // 2)
    top = max(0, (h - ch) // 2)
    return img.crop((left, top, left + cw, top + ch))


def l2_normalize(x: torch.Tensor) -> torch.Tensor:
    return x / x.norm(dim=-1, keepdim=True).clamp(min=1e-8)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=os.environ.get("SIGLIP_MODEL", "google/siglip-so400m-patch14-384"))
    parser.add_argument("--labels", default=str(Path(__file__).parent / "labels.json"))
    parser.add_argument("--images-root", default=str(Path(__file__).resolve().parent.parent / "client" / "public"))
    parser.add_argument("--out", default=str(Path(__file__).parent / "prototypes.npz"))
    parser.add_argument("--vision-ckpt", default=str(Path(__file__).parent / "vision_finetuned.pt"))
    parser.add_argument("--text-weight", type=float, default=0.90)
    parser.add_argument("--img-weight", type=float, default=0.10)
    args = parser.parse_args()

    with open(args.labels, "r", encoding="utf-8") as f:
        data = json.load(f)
    labels = data["labels"]

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    print(f"Loading {args.model} on {device} ({dtype})...")

    processor = AutoProcessor.from_pretrained(args.model)
    model = AutoModel.from_pretrained(args.model, torch_dtype=dtype).to(device).eval()
    adapter = apply_vision_checkpoint(model, args.vision_ckpt, device)
    print(f"Applied vision checkpoint: {adapter is not None or Path(args.vision_ckpt).exists()}")

    words = []
    topic_ids = []
    text_embs = []
    img_embs = []
    combined_embs = []

    with torch.inference_mode():
        for item in labels:
            word = item["word"]
            words.append(word)
            topic_ids.append(int(item["topic_id"]))

            # 1) Text prompt ensemble
            prompts = build_prompts_for_label(item)
            txt_inputs = processor(text=prompts, padding="max_length", truncation=True, return_tensors="pt").to(device)
            t_feat = model.get_text_features(**txt_inputs)
            if hasattr(t_feat, "pooler_output"):
                t_feat = t_feat.pooler_output
            t_feat = l2_normalize(t_feat.float()).mean(dim=0, keepdim=True)
            t_feat = l2_normalize(t_feat).squeeze(0)
            text_embs.append(t_feat.cpu().numpy())

            # 2) 2-view reference image prototype (from web's own /images/vocab/*.jpg)
            rel_url = (item.get("image_url") or "").lstrip("/")
            img_path = Path(args.images_root) / rel_url
            if rel_url and img_path.exists():
                img = ImageOps.exif_transpose(Image.open(img_path)).convert("RGB")
                img_inputs = processor(images=[img, center_crop_70(img)], return_tensors="pt").to(device)
                if dtype == torch.float16 and "pixel_values" in img_inputs:
                    img_inputs["pixel_values"] = img_inputs["pixel_values"].half()
                i_feat = model.get_image_features(**img_inputs)
                if hasattr(i_feat, "pooler_output"):
                    i_feat = i_feat.pooler_output
                i_feat = l2_normalize(i_feat.float())
                i_feat = l2_normalize((0.65 * i_feat[0:1] + 0.35 * i_feat[1:2]))
                if adapter is not None:
                    i_feat = adapter(i_feat)
                i_feat = i_feat.squeeze(0)
                img_embs.append(i_feat.cpu().numpy())
                c_feat = l2_normalize(args.text_weight * t_feat + args.img_weight * i_feat)
            else:
                print(f"  [WARN] Missing reference image for {word}: {img_path}")
                img_embs.append(t_feat.cpu().numpy())
                c_feat = t_feat

            combined_embs.append(c_feat.cpu().numpy())

        # 3) OOD negative anchors
        ood_names = [name for name, _ in OOD_ANCHORS]
        ood_texts = [text for _, text in OOD_ANCHORS]
        ood_inputs = processor(text=ood_texts, padding="max_length", truncation=True, return_tensors="pt").to(device)
        ood_feat = model.get_text_features(**ood_inputs)
        if hasattr(ood_feat, "pooler_output"):
            ood_feat = ood_feat.pooler_output
        ood_feat = l2_normalize(ood_feat.float()).cpu().numpy()

        # Also extract SigLIP's learned logit_scale & logit_bias if present
        logit_scale = float(model.logit_scale.detach().float().cpu().item()) if hasattr(model, "logit_scale") else 4.6
        logit_bias = float(model.logit_bias.detach().float().cpu().item()) if hasattr(model, "logit_bias") else -10.0

    np.savez(
        args.out,
        model_name=np.array(args.model),
        words=np.array(words),
        topic_ids=np.array(topic_ids, dtype=np.int32),
        text_embs=np.stack(text_embs).astype(np.float32),
        img_embs=np.stack(img_embs).astype(np.float32),
        combined_embs=np.stack(combined_embs).astype(np.float32),
        ood_names=np.array(ood_names),
        ood_embs=ood_feat.astype(np.float32),
        logit_scale=np.array(logit_scale, dtype=np.float32),
        logit_bias=np.array(logit_bias, dtype=np.float32),
    )
    print(f"Saved prototypes for {len(words)} classes + {len(ood_names)} OOD anchors to {args.out}")


if __name__ == "__main__":
    main()
