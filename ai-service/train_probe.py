"""
Train Dual-Backbone (SigLIP + DINOv2) calibrated Global + Per-Facet LogisticRegression
heads, Hybrid Facet Gates, Per-Facet MoE Expert Routing, and 3-Fold Out-of-Fold GBDT
Decision Stacker (exported as pure NumPy arrays inside probe.npz).
"""

import argparse
import json
from pathlib import Path

import numpy as np
from scipy.special import expit, log_softmax, softmax
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold

GBDT_MAX_NODES = 15  # 2^(depth=3 + 1) - 1


def export_gbdt_trees_np(clf: GradientBoostingClassifier, n_features: int) -> dict[str, np.ndarray]:
    n_t = len(clf.estimators_)
    feat = np.full((n_t, GBDT_MAX_NODES), -2, dtype=np.int32)
    thresh = np.zeros((n_t, GBDT_MAX_NODES), dtype=np.float32)
    left = np.zeros((n_t, GBDT_MAX_NODES), dtype=np.int32)
    right = np.zeros((n_t, GBDT_MAX_NODES), dtype=np.int32)
    val = np.zeros((n_t, GBDT_MAX_NODES), dtype=np.float32)
    for ti, est in enumerate(clf.estimators_[:, 0]):
        tr = est.tree_
        k = int(tr.node_count)
        feat[ti, :k] = tr.feature
        thresh[ti, :k] = tr.threshold.astype(np.float32)
        left[ti, :k] = np.maximum(0, tr.children_left)
        right[ti, :k] = np.maximum(0, tr.children_right)
        val[ti, :k] = tr.value[:, 0, 0].astype(np.float32)
    init_v = float(clf._raw_predict_init(np.zeros((1, n_features), dtype=np.float32))[0, 0])
    return {
        "gbdt_feature": feat,
        "gbdt_threshold": thresh,
        "gbdt_left": left,
        "gbdt_right": right,
        "gbdt_value": val,
        "gbdt_init": np.array([init_v], dtype=np.float32),
        "gbdt_lr": np.array([float(clf.learning_rate)], dtype=np.float32),
    }


def eval_gbdt_trees_np(X_in: np.ndarray, trees: dict[str, np.ndarray]) -> np.ndarray:
    """Pure vectorized NumPy evaluation of depth<=3 GBDT trees matching sklearn.decision_function."""
    feat = trees["gbdt_feature"]
    thresh = trees["gbdt_threshold"]
    left = trees["gbdt_left"]
    right = trees["gbdt_right"]
    val = trees["gbdt_value"]
    init_v = float(np.asarray(trees["gbdt_init"]).reshape(-1)[0])
    lr = float(np.asarray(trees["gbdt_lr"]).reshape(-1)[0])

    m = X_in.shape[0]
    t_cnt = feat.shape[0]
    nodes = np.zeros((m, t_cnt), dtype=np.int32)
    t_idx = np.arange(t_cnt)[None, :]
    m_idx = np.arange(m)[:, None]
    for _ in range(4):
        f_idx = feat[t_idx, nodes]
        is_internal = f_idx >= 0
        x_vals = X_in[m_idx, np.maximum(0, f_idx)]
        nxt = np.where(x_vals <= thresh[t_idx, nodes], left[t_idx, nodes], right[t_idx, nodes])
        nodes = np.where(is_internal, nxt, nodes)
    return (init_v + lr * val[t_idx, nodes].sum(axis=1)).astype(np.float32)


def unpack_gbdt_trees(container) -> dict[str, np.ndarray] | None:
    keys = ("gbdt_feature", "gbdt_threshold", "gbdt_left", "gbdt_right", "gbdt_value", "gbdt_init", "gbdt_lr")
    if all(k in container for k in keys):
        return {k: np.asarray(container[k]) for k in keys}
    return None


def compute_hybrid_gate_and_intra(
    sig_embs: np.ndarray,
    base_art_logits: np.ndarray,
    gate_coef: np.ndarray,
    gate_intercept: np.ndarray,
    facet_coef: np.ndarray,
    facet_intercept: np.ndarray,
    word_facet_idx: np.ndarray,
    dino_embs: np.ndarray | None = None,
    dino_gate_coef: np.ndarray | None = None,
    dino_gate_intercept: np.ndarray | None = None,
    dino_facet_coef: np.ndarray | None = None,
    dino_facet_intercept: np.ndarray | None = None,
    dino_gate_weight: float = 0.0,
    dino_intra_weight: float = 0.0,
) -> tuple[np.ndarray, np.ndarray]:
    """Compute Hybrid multi-backbone Facet Gate (N, F) and intra-facet probs (N, C)."""
    n_samples, n_art = base_art_logits.shape
    sig_gate = expit(sig_embs @ gate_coef.T + gate_intercept)
    if (
        dino_embs is not None
        and dino_gate_coef is not None
        and dino_gate_intercept is not None
        and dino_gate_weight > 0
    ):
        dino_gate = expit(dino_embs @ dino_gate_coef.T + dino_gate_intercept)
        ovr_gate = (1.0 - dino_gate_weight) * sig_gate + dino_gate_weight * dino_gate
    else:
        ovr_gate = sig_gate

    max_f = np.zeros_like(ovr_gate)
    for f_i in range(ovr_gate.shape[1]):
        f_mask = np.where(word_facet_idx[:n_art] == f_i)[0]
        if len(f_mask) > 0:
            max_f[:, f_i] = np.max(base_art_logits[:, f_mask], axis=1)
    gate_probs = 0.5 * ovr_gate + 0.5 * softmax(max_f / 2.5, axis=1)

    sig_fl = sig_embs @ facet_coef[:n_art].T + facet_intercept[:n_art]
    if (
        dino_embs is not None
        and dino_facet_coef is not None
        and dino_facet_intercept is not None
        and dino_intra_weight > 0
    ):
        dino_fl = dino_embs @ dino_facet_coef[:n_art].T + dino_facet_intercept[:n_art]
        comb_fl = sig_fl + dino_intra_weight * dino_fl
    else:
        comb_fl = sig_fl

    intra_probs = np.zeros((n_samples, n_art), dtype=np.float32)
    for f_i in range(ovr_gate.shape[1]):
        f_mask = np.where(word_facet_idx[:n_art] == f_i)[0]
        if len(f_mask) > 0:
            intra_probs[:, f_mask] = softmax(comb_fl[:, f_mask], axis=1)

    return gate_probs.astype(np.float32), intra_probs


def build_candidate_decision_features(
    sig_probe_logits: np.ndarray,
    zs_logits: np.ndarray,
    dino_probe_logits: np.ndarray | None,
    gate_probs: np.ndarray,
    intra_probs: np.ndarray,
    word_facet_idx: np.ndarray,
) -> np.ndarray:
    """Build (N, C, 14) candidate-level decision features shared identically by train and inference."""
    n_samples, n_art = sig_probe_logits.shape
    feat = np.zeros((n_samples, n_art, 14), dtype=np.float32)

    sig_norm = sig_probe_logits - sig_probe_logits.max(axis=1, keepdims=True)
    sig_p = softmax(sig_probe_logits / 1.5, axis=1)
    zs_norm = zs_logits - zs_logits.max(axis=1, keepdims=True)
    zs_p = softmax(zs_logits / 1.5, axis=1)

    feat[:, :, 0] = sig_norm
    feat[:, :, 1] = sig_p
    feat[:, :, 2] = zs_norm
    feat[:, :, 3] = zs_p

    if dino_probe_logits is not None:
        dino_norm = dino_probe_logits - dino_probe_logits.max(axis=1, keepdims=True)
        dino_p = softmax(dino_probe_logits / 1.5, axis=1)
        dino_ent = -np.sum(dino_p * np.log(np.clip(dino_p, 1e-8, 1.0)), axis=1, keepdims=True) / max(1e-6, np.log(n_art))
        feat[:, :, 4] = dino_norm
        feat[:, :, 5] = dino_p
        feat[:, :, 10] = dino_ent
        feat[:, :, 11] = sig_p * dino_p
    else:
        feat[:, :, 10] = 1.0

    wf = word_facet_idx[:n_art]
    gate_per_cls = gate_probs[:, wf]
    feat[:, :, 6] = gate_per_cls
    feat[:, :, 7] = intra_probs
    feat[:, :, 8] = np.log(np.clip(gate_per_cls * intra_probs, 1e-4, 1.0))

    sig_ent = -np.sum(sig_p * np.log(np.clip(sig_p, 1e-8, 1.0)), axis=1, keepdims=True) / max(1e-6, np.log(n_art))
    feat[:, :, 9] = sig_ent
    feat[:, :, 12] = (wf == 3).astype(np.float32)[None, :]  # tool
    feat[:, :, 13] = (wf == 5).astype(np.float32)[None, :]  # artisan
    return feat


def compute_blended_logits(
    embs: np.ndarray,
    text_embs: np.ndarray,
    probe_coef: np.ndarray,
    probe_intercept: np.ndarray,
    alpha_zs: float,
    beta_probe: float,
    zs_temp: float = 75.0,
    facet_coef: np.ndarray | None = None,
    facet_intercept: np.ndarray | None = None,
    gamma_facet: float = 0.0,
    gate_coef: np.ndarray | None = None,
    gate_intercept: np.ndarray | None = None,
    word_facet_idx: np.ndarray | None = None,
    dino_embs: np.ndarray | None = None,
    dino_coef: np.ndarray | None = None,
    dino_intercept: np.ndarray | None = None,
    dino_facet_coef: np.ndarray | None = None,
    dino_facet_intercept: np.ndarray | None = None,
    dino_gate_coef: np.ndarray | None = None,
    dino_gate_intercept: np.ndarray | None = None,
    beta_dino: float = 0.0,
    gbdt_trees: dict[str, np.ndarray] | None = None,
    gamma_gbdt: float = 0.0,
    moe_facet_weights: np.ndarray | None = None,
    dino_gate_weight: float = 0.0,
    dino_intra_weight: float = 0.0,
) -> np.ndarray:
    """
    Returns (N, C + 1) logits fusing SigLIP ZS, SigLIP Probe, optional DINOv2 Probe,
    Hybrid Chain-Rule hierarchical facets, per-facet MoE weights, and OOF GBDT stacker.
    """
    n_samples = embs.shape[0]
    n_art = text_embs.shape[0]
    probe_logits = embs @ probe_coef.T + probe_intercept  # (N, n_art + 1)
    zs_logits = (embs @ text_embs.T) * zs_temp            # (N, n_art)

    has_dino = dino_embs is not None and dino_coef is not None and dino_intercept is not None
    if has_dino:
        dino_art = (dino_embs @ dino_coef.T + dino_intercept)[:, :n_art]
    else:
        dino_art = None

    blended = np.zeros_like(probe_logits)
    if n_art < 30 and moe_facet_weights is not None and word_facet_idx is not None:
        for f_i in range(moe_facet_weights.shape[0]):
            f_mask = np.where(word_facet_idx[:n_art] == f_i)[0]
            if len(f_mask) == 0:
                continue
            w_zs, w_sig, w_dn, _ = moe_facet_weights[f_i]
            blended[:, f_mask] = w_zs * zs_logits[:, f_mask] + w_sig * probe_logits[:, f_mask]
            if dino_art is not None:
                blended[:, f_mask] += w_dn * dino_art[:, f_mask]
    else:
        blended[:, :n_art] = alpha_zs * zs_logits + beta_probe * probe_logits[:, :n_art]
        if n_art < 30 and dino_art is not None and beta_dino > 0:
            blended[:, :n_art] += beta_dino * dino_art

    if facet_coef is not None and facet_intercept is not None:
        if gate_coef is not None and gate_intercept is not None and word_facet_idx is not None:
            gate_probs, intra_probs = compute_hybrid_gate_and_intra(
                embs,
                blended[:, :n_art],
                gate_coef,
                gate_intercept,
                facet_coef,
                facet_intercept,
                word_facet_idx,
                dino_embs=dino_embs,
                dino_gate_coef=dino_gate_coef,
                dino_gate_intercept=dino_gate_intercept,
                dino_facet_coef=dino_facet_coef,
                dino_facet_intercept=dino_facet_intercept,
                dino_gate_weight=dino_gate_weight,
                dino_intra_weight=dino_intra_weight,
            )
            chain_logp = np.log(np.clip(gate_probs[:, word_facet_idx[:n_art]] * intra_probs, 1e-4, 1.0))

            if gamma_facet > 0:
                if n_art < 30 and moe_facet_weights is not None:
                    for f_i in range(moe_facet_weights.shape[0]):
                        f_mask = np.where(word_facet_idx[:n_art] == f_i)[0]
                        if len(f_mask) > 0:
                            blended[:, f_mask] += moe_facet_weights[f_i, 3] * chain_logp[:, f_mask]
                else:
                    blended[:, :n_art] += gamma_facet * chain_logp

                for f_i in range(gate_coef.shape[0]):
                    f_mask = np.where(word_facet_idx[:n_art] == f_i)[0]
                    if n_art >= 30 and 0 < len(f_mask) <= 4:
                        blended[:, f_mask] += 0.95

                if n_art >= 30:
                    for f_i in range(gate_coef.shape[0]):
                        f_mask = np.where(word_facet_idx[:n_art] == f_i)[0]
                        if len(f_mask) in (4, 8):
                            intra_cur = softmax(blended[:, f_mask] / 1.5, axis=1)
                            for r in range(n_samples):
                                b_loc = int(np.argmax(intra_cur[r]))
                                b_idx = int(f_mask[b_loc])
                                if gate_probs[r, f_i] >= 0.45 and intra_cur[r, b_loc] >= 0.60:
                                    sec_max = float(np.partition(blended[r, :n_art], -2)[-2])
                                    if blended[r, b_idx] < sec_max:
                                        blended[r, b_idx] = sec_max + 0.05

            if gamma_gbdt > 0 and gbdt_trees is not None:
                if n_art < 30:
                    c_feats = build_candidate_decision_features(
                        probe_logits[:, :n_art], zs_logits, dino_art, gate_probs, intra_probs, word_facet_idx
                    )
                    gbdt_raw = eval_gbdt_trees_np(c_feats.reshape(-1, c_feats.shape[-1]), gbdt_trees).reshape(n_samples, n_art)
                    blended[:, :n_art] += gamma_gbdt * (gbdt_raw - np.mean(gbdt_raw, axis=1, keepdims=True))
                elif dino_art is not None:
                    w_dino_cls = (
                        moe_facet_weights[word_facet_idx[:n_art], 2]
                        if moe_facet_weights is not None
                        else np.full((n_art,), beta_dino, dtype=np.float32)
                    )
                    if np.any(w_dino_cls > 0):
                        c_feats = build_candidate_decision_features(
                            probe_logits[:, :n_art], zs_logits, dino_art, gate_probs, intra_probs, word_facet_idx
                        )
                        gbdt_raw = eval_gbdt_trees_np(c_feats.reshape(-1, c_feats.shape[-1]), gbdt_trees).reshape(n_samples, n_art)
                        top2_idx = np.argsort(-blended[:, :n_art], axis=1)[:, :2]
                        for r in range(n_samples):
                            c1, c2 = int(top2_idx[r, 0]), int(top2_idx[r, 1])
                            gap = float(blended[r, c1] - blended[r, c2])
                            if 0.0 <= gap < 0.60:
                                d_diff = float(dino_art[r, c2] - dino_art[r, c1])
                                g_diff = float(gbdt_raw[r, c2] - gbdt_raw[r, c1])
                                w_d = float(0.5 * (w_dino_cls[c1] + w_dino_cls[c2]))
                                if d_diff > 0.0 and g_diff > 0.0 and (w_d * d_diff + gamma_gbdt * g_diff) > gap:
                                    blended[r, c2] = blended[r, c1] + 0.05
        elif gamma_facet > 0:
            blended[:, :n_art] += gamma_facet * (embs @ facet_coef.T + facet_intercept)

    blended[:, n_art] = beta_probe * probe_logits[:, n_art] + alpha_zs * np.mean(zs_logits, axis=1)
    return blended


def fit_temperature(logits: np.ndarray, y_true: np.ndarray) -> float:
    best_t = 1.0
    best_nll = float("inf")
    for t in np.linspace(0.4, 3.0, 53):
        lsm = log_softmax(logits / t, axis=1)
        nll = -float(np.mean(lsm[np.arange(len(y_true)), y_true]))
        if nll < best_nll:
            best_nll = nll
            best_t = float(t)
    return round(best_t, 3)


def fit_global_lr(X: np.ndarray, y: np.ndarray, sample_weight: np.ndarray, C: float, num_classes: int = 61):
    clf = LogisticRegression(
        C=C,
        max_iter=1200,
        class_weight="balanced",
        random_state=42,
    )
    clf.fit(X, y, sample_weight=sample_weight)
    coef = np.zeros((num_classes, X.shape[1]), dtype=np.float32)
    intercept = np.zeros((num_classes,), dtype=np.float32)
    for row_idx, cls_id in enumerate(clf.classes_):
        coef[int(cls_id)] = clf.coef_[row_idx]
        intercept[int(cls_id)] = clf.intercept_[row_idx]
    return coef, intercept


def fit_facet_gates_and_heads(
    X_in: np.ndarray,
    y_in: np.ndarray,
    w_in: np.ndarray,
    X_val: np.ndarray | None,
    y_val: np.ndarray | None,
    facet_names: list[str],
    facets_data: dict,
    class_to_idx: dict[str, int],
    num_art: int = 60,
):
    dim = X_in.shape[1]
    gate_coef = np.zeros((len(facet_names), dim), dtype=np.float32)
    gate_intercept = np.zeros((len(facet_names),), dtype=np.float32)
    facet_coef = np.zeros((num_art, dim), dtype=np.float32)
    facet_intercept = np.zeros((num_art,), dtype=np.float32)

    for f_i, fname in enumerate(facet_names):
        f_idxs = sorted(class_to_idx[w] for w in facets_data[fname]["words"] if w in class_to_idx)
        f_set = set(f_idxs)

        y_gate = np.array([1 if int(cls) in f_set else 0 for cls in y_in], dtype=np.int64)
        if np.any(y_gate == 1) and np.any(y_gate == 0):
            g_clf = LogisticRegression(C=10.0, max_iter=1000, class_weight="balanced", random_state=42)
            g_clf.fit(X_in, y_gate, sample_weight=w_in)
            sign = 1.0 if int(g_clf.classes_[-1]) == 1 else -1.0
            gate_coef[f_i] = sign * g_clf.coef_[0]
            gate_intercept[f_i] = sign * g_clf.intercept_[0]

        sub_mask = np.isin(y_in, f_idxs)
        if np.sum(sub_mask) >= len(f_idxs):
            sub_X, sub_y, sub_w = X_in[sub_mask], y_in[sub_mask], w_in[sub_mask]
            val_sub_mask = np.isin(y_val, f_idxs) if (X_val is not None and y_val is not None) else np.zeros((0,), dtype=bool)
            cand_Cs = [0.5, 1.0, 3.0, 10.0, 25.0] if int(np.sum(val_sub_mask)) >= 4 else [3.0]
            best_sub_clf = None
            best_sub_acc = -1.0
            f_pos = {ci: k for k, ci in enumerate(f_idxs)}
            for sub_C in cand_Cs:
                sub_clf = LogisticRegression(C=sub_C, max_iter=1000, class_weight="balanced", random_state=42)
                sub_clf.fit(sub_X, sub_y, sample_weight=sub_w)
                if len(cand_Cs) == 1:
                    best_sub_clf = sub_clf
                    break
                tmp_coef = np.zeros((len(f_idxs), dim), dtype=np.float32)
                tmp_int = np.zeros((len(f_idxs),), dtype=np.float32)
                for r_idx, cls_id in enumerate(sub_clf.classes_):
                    pos = f_pos[int(cls_id)]
                    tmp_coef[pos] = sub_clf.coef_[r_idx]
                    tmp_int[pos] = sub_clf.intercept_[r_idx]
                preds = np.array([f_idxs[k] for k in np.argmax(X_val[val_sub_mask] @ tmp_coef.T + tmp_int, axis=1)], dtype=np.int64)
                acc = float(np.mean(preds == y_val[val_sub_mask]))
                if acc > best_sub_acc:
                    best_sub_acc = acc
                    best_sub_clf = sub_clf
            for r_idx, cls_id in enumerate(best_sub_clf.classes_):
                facet_coef[int(cls_id)] = (
                    -best_sub_clf.coef_[0]
                    if best_sub_clf.coef_.shape[0] == 1 and r_idx == 0
                    else best_sub_clf.coef_[0]
                    if best_sub_clf.coef_.shape[0] == 1
                    else best_sub_clf.coef_[r_idx]
                )
                facet_intercept[int(cls_id)] = (
                    -best_sub_clf.intercept_[0]
                    if best_sub_clf.intercept_.shape[0] == 1 and r_idx == 0
                    else best_sub_clf.intercept_[0]
                    if best_sub_clf.intercept_.shape[0] == 1
                    else best_sub_clf.intercept_[r_idx]
                )

    return gate_coef, gate_intercept, facet_coef, facet_intercept


def train_oof_gbdt_stacker(
    X_tr_base: np.ndarray,
    y_tr_base: np.ndarray,
    X_dino_tr_base: np.ndarray | None,
    text_embs: np.ndarray,
    facet_names: list[str],
    facets_data: dict,
    class_to_idx: dict[str, int],
    word_facet_idx: np.ndarray,
) -> dict[str, np.ndarray] | None:
    """Train 3-Fold Out-of-Fold GBDT Decision Stacker strictly inside train split."""
    n_art = int(text_embs.shape[0])
    in_mask = y_tr_base < n_art
    X_in = X_tr_base[in_mask]
    y_in = y_tr_base[in_mask]
    D_in = X_dino_tr_base[in_mask] if X_dino_tr_base is not None else None
    _, counts = np.unique(y_in, return_counts=True)
    if np.min(counts) < 3:
        return None

    n_in = len(X_in)
    oof_sig = np.zeros((n_in, n_art), dtype=np.float32)
    oof_dino = np.zeros((n_in, n_art), dtype=np.float32) if D_in is not None else None
    oof_gate = np.zeros((n_in, len(facet_names)), dtype=np.float32)
    oof_intra = np.zeros((n_in, n_art), dtype=np.float32)

    skf = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    for f_tr, f_va in skf.split(X_in, y_in):
        ones_w = np.ones((len(f_tr),), dtype=np.float32)
        s_coef, s_int = fit_global_lr(X_in[f_tr], y_in[f_tr], ones_w, C=10.0, num_classes=n_art)
        sig_v = X_in[f_va] @ s_coef.T + s_int
        oof_sig[f_va] = sig_v

        sg_c, sg_i, sf_c, sf_i = fit_facet_gates_and_heads(
            X_in[f_tr], y_in[f_tr], ones_w, None, None, facet_names, facets_data, class_to_idx, num_art=n_art
        )
        if D_in is not None:
            d_coef, d_int = fit_global_lr(D_in[f_tr], y_in[f_tr], ones_w, C=3.0, num_classes=n_art)
            dino_v = D_in[f_va] @ d_coef.T + d_int
            oof_dino[f_va] = dino_v
            dg_c, dg_i, df_c, df_i = fit_facet_gates_and_heads(
                D_in[f_tr], y_in[f_tr], ones_w, None, None, facet_names, facets_data, class_to_idx, num_art=n_art
            )
            base_v = 0.25 * (X_in[f_va] @ text_embs.T) * 75.0 + 1.2 * sig_v + 0.6 * dino_v
            g_v, i_v = compute_hybrid_gate_and_intra(
                X_in[f_va], base_v, sg_c, sg_i, sf_c, sf_i, word_facet_idx,
                dino_embs=D_in[f_va], dino_gate_coef=dg_c, dino_gate_intercept=dg_i,
                dino_facet_coef=df_c, dino_facet_intercept=df_i,
                dino_gate_weight=0.0, dino_intra_weight=0.10,
            )
        else:
            base_v = 0.25 * (X_in[f_va] @ text_embs.T) * 75.0 + 1.2 * sig_v
            g_v, i_v = compute_hybrid_gate_and_intra(
                X_in[f_va], base_v, sg_c, sg_i, sf_c, sf_i, word_facet_idx
            )
        oof_gate[f_va] = g_v
        oof_intra[f_va] = i_v

    zs_oof = (X_in @ text_embs.T) * 75.0
    cand_feats_all = build_candidate_decision_features(
        oof_sig, zs_oof, oof_dino, oof_gate, oof_intra, word_facet_idx
    )
    rank_score = 0.25 * zs_oof + oof_sig + (0.6 * oof_dino if oof_dino is not None else 0.0)

    meta_X, meta_y = [], []
    for i in range(n_in):
        top8 = list(np.argsort(-rank_score[i])[:8])
        true_c = int(y_in[i])
        if true_c not in top8:
            top8[-1] = true_c
        for c in top8:
            meta_X.append(cand_feats_all[i, int(c)])
            meta_y.append(1 if int(c) == true_c else 0)

    meta_X_arr = np.stack(meta_X).astype(np.float32)
    meta_y_arr = np.array(meta_y, dtype=np.int64)
    gbdt = GradientBoostingClassifier(
        n_estimators=40, max_depth=3, learning_rate=0.08, subsample=0.85, random_state=42
    )
    gbdt.fit(meta_X_arr, meta_y_arr)
    print(f"Trained OOF GBDT stacker on {len(meta_X_arr)} candidate pairs ({int(meta_y_arr.sum())} positives).", flush=True)
    return export_gbdt_trees_np(gbdt, meta_X_arr.shape[1])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", default=str(Path(__file__).parent / "data" / "embeddings_cache.npz"))
    parser.add_argument("--prototypes", default=str(Path(__file__).parent / "prototypes.npz"))
    parser.add_argument("--facets", default=str(Path(__file__).parent / "facets.json"))
    parser.add_argument("--feedback", default=str(Path(__file__).parent / "data" / "feedback_vectors.npz"))
    parser.add_argument("--out-probe", default=str(Path(__file__).parent / "probe.npz"))
    parser.add_argument("--out-cal", default=str(Path(__file__).parent / "calibration.json"))
    args = parser.parse_args()

    cache = np.load(args.cache, allow_pickle=False)
    proto = np.load(args.prototypes, allow_pickle=False)
    facets_data = json.loads(Path(args.facets).read_text(encoding="utf-8"))["facets"]

    words = [str(w) for w in proto["words"]]
    classes = words + ["out_of_scope"]
    class_to_idx = {c: i for i, c in enumerate(classes)}

    text_embs = proto["text_embs"]
    img_embs_db = proto["img_embs"]
    ood_embs = proto["ood_embs"]

    embs = cache["embeddings"]
    labels = [str(x) for x in cache["labels"]]
    is_ood = cache["is_ood"]
    splits = np.array([str(x) for x in cache["splits"]])
    n_art = len(words)
    y = np.array([n_art if ood else class_to_idx[lbl] for lbl, ood in zip(labels, is_ood)], dtype=np.int64)

    tr_mask = splits == "train"
    va_mask = splits == "val"
    te_mask = splits == "test"

    if "train_aug_embs" in cache and "train_aug_y" in cache:
        X_train = cache["train_aug_embs"].astype(np.float32)
        y_train = cache["train_aug_y"].astype(np.int64)
        sample_weights = (
            cache["train_aug_weights"].astype(np.float32)
            if "train_aug_weights" in cache and len(cache["train_aug_weights"]) == len(X_train)
            else np.ones((len(X_train),), dtype=np.float32)
        )
    else:
        X_train = np.concatenate([embs[tr_mask], img_embs_db], axis=0).astype(np.float32)
        y_train = np.concatenate([y[tr_mask], np.arange(n_art, dtype=np.int64)], axis=0)
        sample_weights = np.ones((len(X_train),), dtype=np.float32)

    has_dino = "dino_embeddings" in cache and "dino_train_aug_embs" in cache
    if has_dino:
        dino_embs_all = cache["dino_embeddings"].astype(np.float32)
        D_train = cache["dino_train_aug_embs"].astype(np.float32)
        y_dino_train = cache["train_aug_y"].astype(np.int64)
        w_dino_train = sample_weights[: len(D_train)].copy()
        D_val = dino_embs_all[va_mask]
        D_tr_base = dino_embs_all[tr_mask]
    else:
        D_train = y_dino_train = w_dino_train = D_val = D_tr_base = None

    fb_count = 0
    fb_path = Path(args.feedback)
    if fb_path.exists():
        fb = np.load(fb_path, allow_pickle=False)
        fb_embs = fb["embeddings"].astype(np.float32)
        fb_words = [str(w) for w in fb["words"]]
        valid_fb_x, valid_fb_y = [], []
        for vec, w in zip(fb_embs, fb_words):
            if w in class_to_idx:
                valid_fb_x.append(vec)
                valid_fb_y.append(class_to_idx[w])
        if valid_fb_x:
            fb_count = len(valid_fb_x)
            X_train = np.concatenate([X_train, np.stack(valid_fb_x)], axis=0)
            y_train = np.concatenate([y_train, np.array(valid_fb_y, dtype=np.int64)], axis=0)
            sample_weights = np.concatenate([sample_weights, np.full((fb_count,), 2.0, dtype=np.float32)])

    X_val, y_val = embs[va_mask], y[va_mask]
    X_tr_base, y_tr_base = embs[tr_mask], y[tr_mask]
    in_val = y_val < n_art
    ood_val = y_val == n_art

    print(
        f"Training probe on {len(X_train)} train vectors (dino={has_dino}, feedback={fb_count}, val={len(X_val)}, test={np.sum(te_mask)})...",
        flush=True,
    )

    # 1) Select best regularization C via Stratified 3-Fold CV on non-augmented train split
    cv_scores = {}
    uniq, counts = np.unique(y_tr_base, return_counts=True)
    if np.min(counts) >= 3:
        skf = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        for C in [0.25, 1.0, 3.0, 10.0, 30.0]:
            fold_accs = []
            for f_tr, f_va in skf.split(X_tr_base, y_tr_base):
                c_coef, c_int = fit_global_lr(X_tr_base[f_tr], y_tr_base[f_tr], np.ones(len(f_tr)), C, num_classes=n_art + 1)
                preds = np.argmax(X_tr_base[f_va] @ c_coef.T + c_int, axis=1)
                fold_accs.append(float(np.mean(preds == y_tr_base[f_va])))
            cv_scores[C] = float(np.mean(fold_accs))
        print(f"Stratified 3-Fold CV C scores: { {k: round(v, 4) for k, v in cv_scores.items()} }")

    # 2) Fit 6 OvR Facet Gates + 6 Intra-Facet Heads for SigLIP (and DINOv2 if available)
    facet_names = list(facets_data.keys())
    word_to_facet_idx = {w: f_i for f_i, fname in enumerate(facet_names) for w in facets_data[fname]["words"]}
    word_facet_idx = np.array([word_to_facet_idx.get(w, 0) for w in words], dtype=np.int64)

    in_tr = y_train < n_art
    gate_coef, gate_intercept, facet_coef, facet_intercept = fit_facet_gates_and_heads(
        X_train[in_tr], y_train[in_tr], sample_weights[in_tr], X_val, y_val, facet_names, facets_data, class_to_idx, num_art=n_art
    )

    dino_coef = dino_intercept = None
    dino_gate_coef = dino_gate_intercept = dino_facet_coef = dino_facet_intercept = None
    best_dino_C = None
    if has_dino:
        in_d_tr = y_dino_train < n_art
        dino_gate_coef, dino_gate_intercept, dino_facet_coef, dino_facet_intercept = fit_facet_gates_and_heads(
            D_train[in_d_tr], y_dino_train[in_d_tr], w_dino_train[in_d_tr],
            D_val, y_val, facet_names, facets_data, class_to_idx, num_art=n_art
        )
        best_dino_acc = -1.0
        for dc in [0.5, 1.0, 3.0, 10.0]:
            d_c, d_i = fit_global_lr(D_train, y_dino_train, w_dino_train, dc, num_classes=n_art + 1)
            d_val_preds = np.argmax((D_val[in_val] @ d_c.T + d_i)[:, :n_art], axis=1)
            d_acc = float(np.mean(d_val_preds == y_val[in_val]))
            if d_acc > best_dino_acc:
                best_dino_acc = d_acc
                best_dino_C = dc
                dino_coef, dino_intercept = d_c, d_i
        print(f"Best DINOv2 linear probe C={best_dino_C} -> val_top1={best_dino_acc:.4f}", flush=True)

    # 3) Train 3-Fold Out-of-Fold GBDT Decision Stacker on base train split
    gbdt_trees = train_oof_gbdt_stacker(
        X_tr_base, y_tr_base, D_tr_base, text_embs, facet_names, facets_data, class_to_idx, word_facet_idx
    )

    # 4) Calibrate gate_prob_thresh on val
    gate_val_probs = expit(X_val[in_val] @ gate_coef.T + gate_intercept)
    best_gate_th = 0.40
    best_gate_f1 = -1.0
    for gth in [0.30, 0.35, 0.40, 0.45, 0.50]:
        hits, pred_pos, true_pos = 0, 0, len(y_val[in_val])
        for i, cls in enumerate(y_val[in_val]):
            w_name = classes[int(cls)]
            for f_i, fname in enumerate(facet_names):
                if gate_val_probs[i, f_i] >= gth:
                    pred_pos += 1
                    if w_name in facets_data[fname]["words"]:
                        hits += 1
        prec = hits / max(1, pred_pos)
        rec = hits / max(1, true_pos)
        f1 = 2 * prec * rec / max(1e-6, prec + rec)
        if f1 > best_gate_f1:
            best_gate_f1 = f1
            best_gate_th = gth

    def score_val(val_logits: np.ndarray) -> tuple[float, float, float, float, float]:
        art_preds = np.argmax(val_logits[in_val, :n_art], axis=1)
        top1 = float(np.mean(art_preds == y_val[in_val]))
        top3_idx = np.argsort(-val_logits[in_val, :n_art], axis=1)[:, :3]
        top3 = float(np.mean([y_val[in_val][i] in top3_idx[i] for i in range(np.sum(in_val))]))
        probs_val = softmax(val_logits, axis=1)
        ood_rej = float(np.mean(probs_val[ood_val, n_art] >= 0.45)) if np.any(ood_val) else 1.0
        false_rej = float(np.mean(probs_val[in_val, n_art] >= 0.45))
        sc = round(top1 * 1.5 + top3 * 0.8 + ood_rej * 1.0 - false_rej * 1.5, 4)
        return sc, top1, top3, ood_rej, false_rej

    # Stage 5a) Exact v8 SigLIP Base Grid Search on val split
    best_cfg = None
    best_clf = None
    for C in [0.25, 0.5, 1.0, 3.0, 10.0, 30.0]:
        coef, intercept = fit_global_lr(X_train, y_train, sample_weights, C, num_classes=n_art + 1)
        for alpha_zs in [0.25, 0.35, 0.50, 0.65]:
            for beta_probe in [0.8, 1.2, 1.5]:
                for gamma_facet in [0.0, 0.20, 0.40, 0.65]:
                    val_logits = compute_blended_logits(
                        X_val, text_embs, coef, intercept, alpha_zs, beta_probe,
                        75.0, facet_coef, facet_intercept, gamma_facet,
                        gate_coef, gate_intercept, word_facet_idx,
                    )
                    score, top1, top3, ood_rej, false_rej = score_val(val_logits)
                    if best_cfg is None or score > best_cfg["score"]:
                        best_cfg = {
                            "score": score,
                            "C": C,
                            "C_dino": best_dino_C,
                            "alpha_zs": alpha_zs,
                            "beta_probe": beta_probe,
                            "beta_dino": 0.0,
                            "dino_gate_weight": 0.0,
                            "dino_intra_weight": 0.0,
                            "gamma_facet": gamma_facet,
                            "gamma_gbdt": 0.0,
                            "val_top1": round(top1, 4),
                            "val_top3": round(top3, 4),
                            "val_ood_rej": round(ood_rej, 4),
                            "val_false_rej": round(false_rej, 4),
                        }
                        best_clf = (coef, intercept)

    coef, intercept = best_clf

    # Stage 6 & 7) Unanimous Consensus Top-2 MoE + GBDT Router calibration on val
    moe_facet_weights = None
    if has_dino and gbdt_trees is not None:
        facet_scales = {"medium": 1.2, "tool": 1.2, "craft": 1.2, "subject": 1.0, "artisan": 1.0, "movement": 0.6}
        for b_d in [0.15, 0.25, 0.35]:
            cand_moe = np.zeros((len(facet_names), 4), dtype=np.float32)
            for f_i, fname in enumerate(facet_names):
                cand_moe[f_i] = [
                    best_cfg["alpha_zs"],
                    best_cfg["beta_probe"],
                    b_d * facet_scales.get(fname, 1.0),
                    best_cfg["gamma_facet"],
                ]
            for g_gbdt in [0.20, 0.35, 0.50]:
                v_l = compute_blended_logits(
                    X_val, text_embs, coef, intercept,
                    best_cfg["alpha_zs"], best_cfg["beta_probe"], 75.0,
                    facet_coef, facet_intercept, best_cfg["gamma_facet"],
                    gate_coef, gate_intercept, word_facet_idx,
                    dino_embs=D_val, dino_coef=dino_coef, dino_intercept=dino_intercept,
                    dino_facet_coef=dino_facet_coef, dino_facet_intercept=dino_facet_intercept,
                    dino_gate_coef=dino_gate_coef, dino_gate_intercept=dino_gate_intercept,
                    beta_dino=b_d, gbdt_trees=gbdt_trees, gamma_gbdt=g_gbdt,
                    moe_facet_weights=cand_moe,
                )
                sc, t1, t3, orj, frj = score_val(v_l)
                if sc > best_cfg["score"] + 1e-5:
                    moe_facet_weights = cand_moe.copy()
                    best_cfg.update({
                        "score": sc,
                        "beta_dino": b_d,
                        "gamma_gbdt": g_gbdt,
                        "val_top1": round(t1, 4),
                        "val_top3": round(t3, 4),
                        "val_ood_rej": round(orj, 4),
                        "val_false_rej": round(frj, 4),
                    })
        if moe_facet_weights is not None:
            print(
                f"Activated Unanimous Consensus MoE+GBDT router (beta_dino={best_cfg['beta_dino']}, "
                f"gamma_gbdt={best_cfg['gamma_gbdt']}, val score={best_cfg['score']:.4f})",
                flush=True,
            )

    val_logits = compute_blended_logits(
        X_val, text_embs, coef, intercept,
        best_cfg["alpha_zs"], best_cfg["beta_probe"], 75.0,
        facet_coef, facet_intercept, best_cfg["gamma_facet"],
        gate_coef, gate_intercept, word_facet_idx,
        dino_embs=D_val, dino_coef=dino_coef, dino_intercept=dino_intercept,
        dino_facet_coef=dino_facet_coef, dino_facet_intercept=dino_facet_intercept,
        dino_gate_coef=dino_gate_coef, dino_gate_intercept=dino_gate_intercept,
        beta_dino=best_cfg["beta_dino"], gbdt_trees=gbdt_trees, gamma_gbdt=best_cfg["gamma_gbdt"],
        moe_facet_weights=moe_facet_weights,
        dino_gate_weight=best_cfg["dino_gate_weight"],
        dino_intra_weight=best_cfg["dino_intra_weight"],
    )
    cal_temp = fit_temperature(val_logits, y_val)
    cal_probs_val = softmax(val_logits / cal_temp, axis=1)

    val_ood_margin = np.max(X_val @ text_embs.T, axis=1) - np.max(X_val @ ood_embs.T, axis=1)
    best_ood = None
    for p_th in [0.35, 0.45, 0.55, 0.65]:
        for m_th in [-0.04, -0.03, -0.02, -0.01, 0.0]:
            is_pred_ood_in = (cal_probs_val[in_val, n_art] >= p_th) | (val_ood_margin[in_val] < m_th)
            is_pred_ood_ood = (cal_probs_val[ood_val, n_art] >= p_th) | (val_ood_margin[ood_val] < m_th)
            tpr = float(np.mean(is_pred_ood_ood)) if np.any(ood_val) else 1.0
            fpr = float(np.mean(is_pred_ood_in))
            obj = tpr * 2.0 - fpr * 5.0
            if best_ood is None or obj > best_ood["obj"]:
                best_ood = {
                    "obj": round(obj, 4),
                    "ood_prob_thresh": p_th,
                    "ood_margin_thresh": m_th,
                    "tpr": round(tpr, 4),
                    "fpr": round(fpr, 4),
                }

    art_probs_val = softmax(val_logits[in_val, :n_art] / cal_temp, axis=1)
    true_probs = art_probs_val[np.arange(np.sum(in_val)), y_val[in_val]]
    nonconf = 1.0 - true_probs
    n_in = len(nonconf)
    q_level = min(1.0, np.ceil((n_in + 1) * 0.90) / n_in)
    conformal_q = float(np.quantile(nonconf, q_level))

    top1_art_probs = np.max(art_probs_val, axis=1)
    top1_art_preds = np.argmax(art_probs_val, axis=1)
    conf_thresh = 0.50
    for th in [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]:
        sel = top1_art_probs >= th
        if np.sum(sel) >= 10:
            prec = float(np.mean(top1_art_preds[sel] == y_val[in_val][sel]))
            if prec >= 0.85:
                conf_thresh = th
                break

    facet_prob_min = 0.45
    facet_logit_gap_max = 2.5

    save_payload = {
        "coef": coef,
        "intercept": intercept,
        "classes": np.array(classes),
        "alpha_zs": np.array(best_cfg["alpha_zs"], dtype=np.float32),
        "beta_probe": np.array(best_cfg["beta_probe"], dtype=np.float32),
        "beta_dino": np.array(best_cfg["beta_dino"], dtype=np.float32),
        "dino_gate_weight": np.array(best_cfg["dino_gate_weight"], dtype=np.float32),
        "dino_intra_weight": np.array(best_cfg["dino_intra_weight"], dtype=np.float32),
        "gamma_facet": np.array(best_cfg["gamma_facet"], dtype=np.float32),
        "gamma_gbdt": np.array(best_cfg["gamma_gbdt"], dtype=np.float32),
        "zs_temp": np.array(75.0, dtype=np.float32),
        "cal_temp": np.array(cal_temp, dtype=np.float32),
        "ood_prob_thresh": np.array(best_ood["ood_prob_thresh"], dtype=np.float32),
        "ood_margin_thresh": np.array(best_ood["ood_margin_thresh"], dtype=np.float32),
        "conformal_q": np.array(conformal_q, dtype=np.float32),
        "conf_thresh": np.array(conf_thresh, dtype=np.float32),
        "facet_prob_min": np.array(facet_prob_min, dtype=np.float32),
        "facet_logit_gap_max": np.array(facet_logit_gap_max, dtype=np.float32),
        "facet_names": np.array(facet_names),
        "word_facet_idx": word_facet_idx,
        "gate_coef": gate_coef,
        "gate_intercept": gate_intercept,
        "gate_prob_thresh": np.array(best_gate_th, dtype=np.float32),
        "facet_coef": facet_coef,
        "facet_intercept": facet_intercept,
    }
    if has_dino and dino_coef is not None:
        save_payload.update(
            {
                "dino_coef": dino_coef,
                "dino_intercept": dino_intercept,
                "dino_gate_coef": dino_gate_coef,
                "dino_gate_intercept": dino_gate_intercept,
                "dino_facet_coef": dino_facet_coef,
                "dino_facet_intercept": dino_facet_intercept,
            }
        )
    if gbdt_trees is not None:
        save_payload.update(gbdt_trees)
    if moe_facet_weights is not None:
        save_payload["moe_facet_weights"] = moe_facet_weights

    np.savez(args.out_probe, **save_payload)

    cal_summary = {
        **best_cfg,
        "dino_enabled": bool(
            has_dino
            and (
                best_cfg["beta_dino"] > 0
                or best_cfg["dino_gate_weight"] > 0
                or best_cfg["dino_intra_weight"] > 0
                or (moe_facet_weights is not None and bool(np.any(moe_facet_weights[:, 2] > 0)))
            )
        ),
        "gbdt_enabled": bool(gbdt_trees is not None and best_cfg["gamma_gbdt"] > 0),
        "moe_facet_routing": bool(moe_facet_weights is not None),
        "cal_temp": cal_temp,
        "ood_calibration": best_ood,
        "conformal_q_90": round(conformal_q, 4),
        "confident_match_prob_thresh": conf_thresh,
        "gate_prob_thresh": best_gate_th,
        "gate_val_f1": round(best_gate_f1, 4),
        "facet_prob_min": facet_prob_min,
        "facet_logit_gap_max": facet_logit_gap_max,
        "facets": facet_names,
        "feedback_vectors_used": fb_count,
    }
    Path(args.out_cal).write_text(json.dumps(cal_summary, indent=2), encoding="utf-8")
    print("Calibration summary (from val split):")
    print(json.dumps(cal_summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
