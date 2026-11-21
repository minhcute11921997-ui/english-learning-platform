"""
Shared Residual Bottleneck MLP Adapter & Selective SigLIP Delta Checkpoint Utilities.
Used symmetrically across finetune_siglip.py, clean_labels.py, build_prototypes.py, and app.py.
"""

from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
import torch.nn.functional as F

FINETUNED_PREFIXES = (
    "vision_model.encoder.layers.25.",
    "vision_model.encoder.layers.26.",
    "vision_model.post_layernorm.",
    "vision_model.head.",
)


class ResidualAdapter(nn.Module):
    """Lightweight near-identity residual MLP adapter over L2-normalized SigLIP embeddings."""

    def __init__(self, dim: int = 1152, bottleneck: int = 384, dropout: float = 0.20):
        super().__init__()
        self.dim = dim
        self.bottleneck = bottleneck
        self.norm = nn.LayerNorm(dim)
        self.fc1 = nn.Linear(dim, bottleneck)
        self.act = nn.GELU()
        self.drop = nn.Dropout(dropout)
        self.fc2 = nn.Linear(bottleneck, dim)
        self.res_scale = nn.Parameter(torch.tensor(0.15, dtype=torch.float32))

        nn.init.normal_(self.fc2.weight, mean=0.0, std=1e-3)
        nn.init.zeros_(self.fc2.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_f = x.float()
        delta = self.fc2(self.drop(self.act(self.fc1(self.norm(x_f)))))
        out = x_f + self.res_scale * delta
        return F.normalize(out, dim=-1)


def extract_vision_delta_state_dict(model: nn.Module, as_fp16: bool = True) -> dict[str, torch.Tensor]:
    """Extract only the fine-tuned upper SigLIP vision layers + head weights onto CPU."""
    delta: dict[str, torch.Tensor] = {}
    for k, v in model.state_dict().items():
        if k.startswith(FINETUNED_PREFIXES):
            t = v.detach().cpu()
            delta[k] = t.half() if as_fp16 else t.float()
    return delta


def apply_vision_checkpoint(
    model: Optional[nn.Module],
    ckpt_path: str | Path | None,
    device: str,
) -> Optional[ResidualAdapter]:
    """Load fine-tuned upper SigLIP delta weights onto `model` and return optional ResidualAdapter."""
    if ckpt_path is None:
        return None
    p = Path(ckpt_path)
    if not p.exists():
        return None

    ckpt = torch.load(p, map_location="cpu", weights_only=True)
    vision_sd = ckpt.get("vision_state_dict")
    if vision_sd and model is not None:
        try:
            ref_param = next(model.parameters())
            target_dev = ref_param.device
            default_dtype = ref_param.dtype
        except StopIteration:
            target_dev = torch.device(device)
            default_dtype = torch.float32
        model_sd = model.state_dict()
        casted = {
            k: v.to(device=target_dev, dtype=model_sd[k].dtype if k in model_sd else default_dtype)
            for k, v in vision_sd.items()
        }
        model.load_state_dict(casted, strict=False)

    adapter_sd = ckpt.get("adapter_state_dict")
    if adapter_sd and ckpt.get("use_adapter", True):
        adapter = ResidualAdapter(
            dim=int(ckpt.get("dim", 1152)),
            bottleneck=int(ckpt.get("bottleneck", 384)),
            dropout=0.0,
        ).to(device, dtype=torch.float32).eval()
        adapter.load_state_dict(adapter_sd)
        return adapter
    return None
