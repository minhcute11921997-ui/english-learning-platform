"""
Script 03: Format dữ liệu → Instruction tuning format cho fine-tune
Gộp: OPUS-100 + IWSLT17 + DB export → train/val/test split

Chạy: python tools/training/scripts/03_format_dataset.py
"""

import json
import random
import hashlib
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
DB_DIR = Path(__file__).parent.parent / "data" / "db_export"
OUT_DIR = Path(__file__).parent.parent / "data" / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# System prompt cố định cho model
SYSTEM_PROMPT = (
    "You are an expert English-Vietnamese translator for an English learning application. "
    "Translate accurately and naturally. "
    "Return ONLY valid JSON with no markdown, no extra text, no explanation outside JSON."
)

# Template prompt
PROMPT_TEMPLATES = {
    "en_to_vi": "Translate from English to Vietnamese:\n\n{text}",
    "vi_to_en": "Dịch từ tiếng Việt sang tiếng Anh:\n\n{text}",
    "en_to_vi_ctx": "Translate from English to Vietnamese:\n\n\"{text}\"\n\nContext sentence: \"{context}\"",
    "vi_to_en_ctx": "Dịch từ tiếng Việt sang tiếng Anh:\n\n\"{text}\"\n\nCâu ngữ cảnh: \"{context}\"",
}

# Response format (single word/phrase)
def make_word_response(translated, pos=None):
    resp = {
        "translated": translated,
        "dictionary": [],
        "explanation": None,
        "error": False
    }
    if pos:
        resp["dictionary"] = [{"partOfSpeech": pos, "terms": [translated]}]
    return json.dumps(resp, ensure_ascii=False)

# Response format (sentence)
def make_sentence_response(translated):
    return json.dumps({
        "translated": translated,
        "dictionary": [],
        "explanation": None,
        "error": False
    }, ensure_ascii=False)


def make_chat_example(user_content, assistant_content):
    """Tạo 1 example theo format chat."""
    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
            {"role": "assistant", "content": assistant_content},
        ]
    }


def load_raw_pairs():
    """Load tất cả cặp câu từ các nguồn."""
    all_pairs = []
    seen_hashes = set()  # Dedup

    def add_pair(en, vi, pair_type="sentence", pos=None):
        key = hashlib.md5(f"{en}||{vi}".encode()).hexdigest()
        if key in seen_hashes:
            return False
        seen_hashes.add(key)

        # Lọc cặp câu kém chất lượng
        if len(en.strip()) < 2 or len(vi.strip()) < 2:
            return False
        if len(en) > 500 or len(vi) > 500:  # Quá dài
            return False
        # Loại câu có quá nhiều ký tự đặc biệt (spam/code)
        special_ratio = sum(1 for c in en if not c.isalnum() and c not in " .,!?;:'-\"()") / max(len(en), 1)
        if special_ratio > 0.3:
            return False

        all_pairs.append({"en": en.strip(), "vi": vi.strip(), "type": pair_type, "pos": pos})
        return True

    # 1. Load OPUS-100
    opus_file = RAW_DIR / "opus100_en_vi.jsonl"
    if opus_file.exists():
        count = 0
        with open(opus_file, encoding="utf-8") as f:
            for line in f:
                item = json.loads(line)
                if add_pair(item["en"], item["vi"]):
                    count += 1
        print(f"✅ OPUS-100: {count:,} cặp")
    else:
        print("⚠️  opus100_en_vi.jsonl chưa tồn tại — chạy script 01 trước")

    # 2. Load IWSLT17
    iwslt_file = RAW_DIR / "iwslt17_en_vi.jsonl"
    if iwslt_file.exists():
        count = 0
        with open(iwslt_file, encoding="utf-8") as f:
            for line in f:
                item = json.loads(line)
                if add_pair(item["en"], item["vi"]):
                    count += 1
        print(f"✅ IWSLT17: {count:,} cặp")
    else:
        print("⚠️  iwslt17_en_vi.jsonl chưa tồn tại — chạy script 01 trước")

    # 3. Load DB export
    db_file = DB_DIR / "vocabulary_pairs.jsonl"
    if db_file.exists():
        count = 0
        with open(db_file, encoding="utf-8") as f:
            for line in f:
                item = json.loads(line)
                en = item.get("en", "")
                vi = item.get("vi", "")
                pos = item.get("pos")
                if add_pair(en, vi, pair_type=item.get("type", "word"), pos=pos):
                    count += 1
        print(f"✅ DB export: {count:,} cặp")
    else:
        print("⚠️  vocabulary_pairs.jsonl chưa tồn tại — chạy script 02 trước")

    return all_pairs


def convert_to_instruction_format(pairs):
    """Convert cặp câu → instruction tuning examples."""
    examples = []

    for pair in pairs:
        en, vi = pair["en"], pair["vi"]
        pos = pair.get("pos")
        pair_type = pair.get("type", "sentence")
        is_word = pair_type in ("word", "word_reverse") or " " not in en.strip()

        # EN → VI
        user = PROMPT_TEMPLATES["en_to_vi"].format(text=en)
        assistant = make_word_response(vi, pos) if is_word else make_sentence_response(vi)
        examples.append(make_chat_example(user, assistant))

        # VI → EN (chiều ngược lại — đặc biệt quan trọng)
        user = PROMPT_TEMPLATES["vi_to_en"].format(text=vi)
        assistant = make_word_response(en, pos) if is_word else make_sentence_response(en)
        examples.append(make_chat_example(user, assistant))

    return examples


def split_and_save(examples):
    """Shuffle + split 90/5/5 và lưu file."""
    random.seed(42)
    random.shuffle(examples)

    n = len(examples)
    n_train = int(n * 0.90)
    n_val = int(n * 0.05)

    splits = {
        "train": examples[:n_train],
        "validation": examples[n_train : n_train + n_val],
        "test": examples[n_train + n_val :],
    }

    for split_name, data in splits.items():
        out_file = OUT_DIR / f"{split_name}.jsonl"
        with open(out_file, "w", encoding="utf-8") as f:
            for ex in data:
                f.write(json.dumps(ex, ensure_ascii=False) + "\n")
        print(f"✅ {split_name}: {len(data):,} examples → {out_file}")

    return splits


def show_sample(examples, n=3):
    """In vài ví dụ để kiểm tra."""
    print("\n📋 Mẫu dữ liệu sau khi format:")
    for i, ex in enumerate(random.sample(examples[:1000], min(n, len(examples[:1000])))):
        print(f"\n--- Mẫu {i+1} ---")
        for msg in ex["messages"]:
            role = msg["role"].upper()
            content = msg["content"][:200] + ("..." if len(msg["content"]) > 200 else "")
            print(f"[{role}]: {content}")


def main():
    print("=" * 60)
    print("BƯỚC 3: FORMAT DỮ LIỆU → INSTRUCTION TUNING")
    print("=" * 60)

    print("\n📂 Load dữ liệu thô...")
    pairs = load_raw_pairs()
    print(f"\n📊 Tổng cặp câu (sau dedup + filter): {len(pairs):,}")

    if len(pairs) == 0:
        print("❌ Không có dữ liệu! Chạy script 01 và 02 trước.")
        return

    print("\n🔄 Convert sang instruction format...")
    examples = convert_to_instruction_format(pairs)
    print(f"📊 Tổng examples (2x do bidirectional): {len(examples):,}")

    show_sample(examples)

    print("\n💾 Lưu file...")
    split_and_save(examples)

    print(f"\n✅ Hoàn thành! Dataset sẵn sàng tại: {OUT_DIR}")
    print("Chạy tiếp: python scripts/04_train.py")


if __name__ == "__main__":
    main()
