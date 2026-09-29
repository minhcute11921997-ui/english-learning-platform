"""
Script 05: Đánh giá model với BLEU-4 và chrF++ trên test set
Chạy: python tools/training/scripts/05_evaluate.py
"""

import json
import torch
import evaluate
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel

MODEL_DIR = Path(__file__).parent.parent / "models" / "vi-en-translator-v1" / "final"
TEST_FILE = Path(__file__).parent.parent / "data" / "processed" / "test.jsonl"

# Bộ test thủ công (từ vựng thông dụng trong app học tiếng Anh)
MANUAL_TEST_CASES = [
    # EN → VI
    {"direction": "EN→VI", "input": "apple", "expected": "quả táo"},
    {"direction": "EN→VI", "input": "beautiful", "expected": "đẹp"},
    {"direction": "EN→VI", "input": "I love learning English", "expected": "Tôi thích học tiếng Anh"},
    {"direction": "EN→VI", "input": "bank", "expected": "ngân hàng"},
    {"direction": "EN→VI", "input": "He runs every morning", "expected": "Anh ấy chạy bộ mỗi sáng"},
    # VI → EN
    {"direction": "VI→EN", "input": "chó", "expected": "dog"},
    {"direction": "VI→EN", "input": "Cô ấy đang học bài", "expected": "She is studying"},
    {"direction": "VI→EN", "input": "tốt nghiệp", "expected": "graduate"},
    {"direction": "VI→EN", "input": "Trời hôm nay đẹp lắm", "expected": "The weather is very nice today"},
]

SYSTEM_PROMPT = (
    "You are an expert English-Vietnamese translator for an English learning application. "
    "Return ONLY valid JSON with no markdown, no extra text."
)


def build_translate_prompt(text: str, direction: str) -> str:
    if direction == "EN→VI":
        return f"Translate from English to Vietnamese:\n\n{text}"
    else:
        return f"Dịch từ tiếng Việt sang tiếng Anh:\n\n{text}"


def load_model():
    print(f"📥 Load model từ {MODEL_DIR}...")

    if not MODEL_DIR.exists():
        raise FileNotFoundError(f"Không tìm thấy model tại {MODEL_DIR}\nChạy script 04 trước.")

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
    )

    tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR))

    # Thử load như LoRA model trước, nếu không thì load merged
    try:
        from peft import PeftConfig
        config = PeftConfig.from_pretrained(str(MODEL_DIR))
        base_model = AutoModelForCausalLM.from_pretrained(
            config.base_model_name_or_path,
            quantization_config=bnb_config,
            device_map="auto",
        )
        model = PeftModel.from_pretrained(base_model, str(MODEL_DIR))
        print("✅ Load LoRA model thành công")
    except Exception:
        model = AutoModelForCausalLM.from_pretrained(
            str(MODEL_DIR),
            quantization_config=bnb_config,
            device_map="auto",
        )
        print("✅ Load merged model thành công")

    model.eval()
    return model, tokenizer


def generate_translation(model, tokenizer, text: str, direction: str) -> str:
    """Sinh bản dịch từ model."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": build_translate_prompt(text, direction)},
    ]

    input_ids = tokenizer.apply_chat_template(
        messages,
        add_generation_prompt=True,
        return_tensors="pt"
    ).to(model.device)

    with torch.no_grad():
        output = model.generate(
            input_ids,
            max_new_tokens=128,
            temperature=0.1,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )

    # Chỉ lấy phần generated (bỏ phần input)
    generated = output[0][input_ids.shape[1]:]
    raw = tokenizer.decode(generated, skip_special_tokens=True).strip()

    # Parse JSON để lấy "translated"
    try:
        result = json.loads(raw)
        return result.get("translated", raw)
    except json.JSONDecodeError:
        return raw  # Fallback: trả về text thô


def evaluate_on_test_set(model, tokenizer):
    """Đánh giá BLEU + chrF++ trên test set tự động."""
    if not TEST_FILE.exists():
        print("⚠️  Không tìm thấy test set, bỏ qua đánh giá tự động")
        return

    print("\n📊 Đánh giá trên test set tự động (tối đa 500 mẫu)...")
    bleu_metric = evaluate.load("sacrebleu")
    chrf_metric = evaluate.load("chrf")

    predictions, references = [], []
    test_data = []
    with open(TEST_FILE, encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= 500:
                break
            test_data.append(json.loads(line))

    for i, item in enumerate(test_data):
        if i % 50 == 0:
            print(f"  [{i}/{len(test_data)}] Đang đánh giá...")

        messages = item["messages"]
        user_msg = next(m["content"] for m in messages if m["role"] == "user")
        expected_json = next(m["content"] for m in messages if m["role"] == "assistant")

        # Xác định chiều dịch
        direction = "EN→VI" if "English to Vietnamese" in user_msg else "VI→EN"
        input_text = user_msg.split("\n\n", 1)[-1].strip().strip('"')

        # Lấy expected
        try:
            expected = json.loads(expected_json)["translated"]
        except Exception:
            continue

        # Sinh dự đoán
        predicted = generate_translation(model, tokenizer, input_text, direction)

        predictions.append(predicted)
        references.append([expected])

    bleu = bleu_metric.compute(predictions=predictions, references=references)
    chrf = chrf_metric.compute(predictions=predictions, references=[[r[0]] for r in references])

    print(f"\n{'='*40}")
    print("📊 KẾT QUẢ ĐÁNH GIÁ TỰ ĐỘNG:")
    print(f"  BLEU-4:  {bleu['score']:.2f}  (target: > 30)")
    print(f"  chrF++:  {chrf['score']:.2f}  (target: > 55)")
    print(f"  Số mẫu: {len(predictions)}")


def evaluate_manual(model, tokenizer):
    """Đánh giá thủ công với các câu cố định."""
    print("\n📋 Đánh giá thủ công:")
    print(f"{'─'*60}")

    correct = 0
    for case in MANUAL_TEST_CASES:
        predicted = generate_translation(model, tokenizer, case["input"], case["direction"])
        # Kiểm tra đơn giản: expected có trong predicted không?
        ok = case["expected"].lower() in predicted.lower()
        status = "✅" if ok else "⚠️ "
        if ok:
            correct += 1

        print(f"{status} [{case['direction']}] \"{case['input']}\"")
        print(f"   Expected: {case['expected']}")
        print(f"   Got:      {predicted}")
        print()

    print(f"Kết quả thủ công: {correct}/{len(MANUAL_TEST_CASES)} ({100*correct/len(MANUAL_TEST_CASES):.0f}%)")


def main():
    print("=" * 60)
    print("BƯỚC 5: ĐÁNH GIÁ MODEL")
    print("=" * 60)

    model, tokenizer = load_model()

    evaluate_manual(model, tokenizer)
    evaluate_on_test_set(model, tokenizer)

    print("\n✅ Đánh giá hoàn thành!")
    print("Nếu kết quả tốt: chạy python scripts/06_merge_and_export.py")
    print("Nếu chưa đủ tốt: điều chỉnh config và train thêm epoch")


if __name__ == "__main__":
    main()
