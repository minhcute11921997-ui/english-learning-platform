"""
Script 01: Tải dataset EN↔VI từ Hugging Face
Chạy: python tools/training/scripts/01_download_datasets.py
"""

import os
from datasets import load_dataset
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)


def download_opus100():
    """Tải OPUS-100 English-Vietnamese (~690K cặp câu)."""
    print("📥 Tải OPUS-100 (en-vi)...")
    try:
        ds = load_dataset("Helsinki-NLP/opus-100", "en-vi", trust_remote_code=True)
        pairs = []
        for split in ["train", "validation", "test"]:
            if split in ds:
                for item in ds[split]:
                    en = item.get("translation", {}).get("en", "").strip()
                    vi = item.get("translation", {}).get("vi", "").strip()
                    if en and vi and len(en) > 3 and len(vi) > 3:
                        pairs.append({"en": en, "vi": vi})

        out_file = RAW_DIR / "opus100_en_vi.jsonl"
        import json
        with open(out_file, "w", encoding="utf-8") as f:
            for p in pairs:
                f.write(json.dumps(p, ensure_ascii=False) + "\n")

        print(f"✅ OPUS-100: {len(pairs):,} cặp câu → {out_file}")
        return len(pairs)
    except Exception as e:
        print(f"❌ Lỗi OPUS-100: {e}")
        return 0


def download_iwslt():
    """Tải IWSLT 2017 English-Vietnamese (~133K cặp câu)."""
    print("📥 Tải IWSLT17 (en-vi)...")
    try:
        ds = load_dataset("iwslt2017", "iwslt2017-en-vi", trust_remote_code=True)
        pairs = []
        for split in ["train", "validation", "test"]:
            if split in ds:
                for item in ds[split]:
                    en = item.get("translation", {}).get("en", "").strip()
                    vi = item.get("translation", {}).get("vi", "").strip()
                    if en and vi and len(en) > 3 and len(vi) > 3:
                        pairs.append({"en": en, "vi": vi})

        out_file = RAW_DIR / "iwslt17_en_vi.jsonl"
        import json
        with open(out_file, "w", encoding="utf-8") as f:
            for p in pairs:
                f.write(json.dumps(p, ensure_ascii=False) + "\n")

        print(f"✅ IWSLT17: {len(pairs):,} cặp câu → {out_file}")
        return len(pairs)
    except Exception as e:
        print(f"❌ Lỗi IWSLT17: {e}")
        return 0


def main():
    print("=" * 60)
    print("BƯỚC 1: TẢI DATASET EN↔VI")
    print("=" * 60)

    total = 0
    total += download_opus100()
    total += download_iwslt()

    print(f"\n📊 Tổng số cặp câu đã tải: {total:,}")
    print(f"📂 Lưu tại: {RAW_DIR}")
    print("\n✅ Hoàn thành! Chạy tiếp: python scripts/02_export_db.js (trên máy có MySQL)")


if __name__ == "__main__":
    main()
