"""
Script 05b: Đánh giá model bằng LLM-as-a-Judge (Gemini API chấm điểm)
Thay thế việc ngồi chấm thủ công — nhanh, nhất quán, miễn phí.

Chạy: python tools/training/scripts/05b_llm_judge.py

Yêu cầu:
  pip install google-generativeai
  set GEMINI_API_KEY=your-key   (lấy tại aistudio.google.com)

Gemini API miễn phí: 1500 request/ngày — đủ để chấm hàng nghìn câu.
"""

import json
import time
import os
import torch
from pathlib import Path
from collections import defaultdict

# ── Cấu hình ──────────────────────────────────────────────────────
MODEL_DIR   = Path(__file__).parent.parent / "models" / "vi-en-translator-v1" / "final"
TEST_FILE   = Path(__file__).parent.parent / "data" / "processed" / "test.jsonl"
REPORT_FILE = Path(__file__).parent.parent / "data" / "eval_report.json"

GEMINI_MODEL  = "gemini-2.0-flash"   # Nhanh, miễn phí 1500 req/ngày
MAX_SAMPLES   = 200                  # Số câu test (tăng nếu muốn kỹ hơn)
DELAY_BETWEEN_CALLS = 1.0            # Giây — tránh rate limit


# ── Prompt chấm điểm ──────────────────────────────────────────────
JUDGE_PROMPT_TEMPLATE = """Bạn là chuyên gia ngôn ngữ Anh-Việt với 10 năm kinh nghiệm dịch thuật.
Hãy đánh giá bản dịch sau cho một ứng dụng học tiếng Anh.

Chiều dịch: {direction}
Văn bản gốc: "{source}"
Bản dịch cần đánh giá: "{predicted}"
Bản dịch tham chiếu (nếu có): "{reference}"

Chấm điểm theo thang 1–5:
  5 = Hoàn hảo, tự nhiên, đúng nghĩa hoàn toàn
  4 = Đúng nghĩa, đôi chỗ hơi cứng hoặc có thể tự nhiên hơn
  3 = Hiểu được nhưng không tự nhiên hoặc thiếu sắc thái
  2 = Dịch sai một phần hoặc gây hiểu nhầm
  1 = Sai hoàn toàn

Lưu ý đặc biệt:
- Thành ngữ / idiom phải dịch theo nghĩa bóng, không dịch theo nghĩa đen
- Từ đa nghĩa cần đánh giá xem có chọn đúng nghĩa phù hợp không
- Phù hợp với ngữ cảnh học tiếng Anh (A1-B2)

Trả về CHÍNH XÁC JSON sau, không có text thêm:
{{"score": <1-5>, "reason": "<giải thích ngắn bằng tiếng Việt, tối đa 50 từ>", "error_type": "<idiom|ambiguous|unnatural|wrong|none>"}}"""


# ── Load fine-tuned model ──────────────────────────────────────────
def load_finetuned_model():
    """Load model fine-tune để sinh bản dịch cần chấm."""
    print(f"📥 Load fine-tuned model từ {MODEL_DIR}...")

    if not MODEL_DIR.exists():
        raise FileNotFoundError(
            f"Không tìm thấy model tại {MODEL_DIR}\n"
            "Chạy script 04_train.py trước."
        )

    from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
    )

    tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR))

    try:
        from peft import PeftModel, PeftConfig
        config = PeftConfig.from_pretrained(str(MODEL_DIR))
        base = AutoModelForCausalLM.from_pretrained(
            config.base_model_name_or_path,
            quantization_config=bnb_config,
            device_map="auto",
        )
        model = PeftModel.from_pretrained(base, str(MODEL_DIR))
    except Exception:
        model = AutoModelForCausalLM.from_pretrained(
            str(MODEL_DIR),
            quantization_config=bnb_config,
            device_map="auto",
        )

    model.eval()
    print("✅ Fine-tuned model loaded\n")
    return model, tokenizer


SYSTEM_PROMPT = (
    "You are an expert English-Vietnamese translator. "
    "Return ONLY valid JSON with no markdown, no extra text."
)


def translate_with_model(model, tokenizer, text: str, direction: str) -> str:
    """Dùng model fine-tune để sinh bản dịch."""
    if direction == "EN→VI":
        user_content = f'Translate from English to Vietnamese:\n\n"{text}"'
    else:
        user_content = f'Dịch từ tiếng Việt sang tiếng Anh:\n\n"{text}"'

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": user_content},
    ]

    input_ids = tokenizer.apply_chat_template(
        messages, add_generation_prompt=True, return_tensors="pt"
    ).to(model.device)

    with torch.no_grad():
        output = model.generate(
            input_ids,
            max_new_tokens=128,
            temperature=0.1,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated = output[0][input_ids.shape[1]:]
    raw = tokenizer.decode(generated, skip_special_tokens=True).strip()

    try:
        parsed = json.loads(raw)
        return parsed.get("translated", raw)
    except Exception:
        # Tìm JSON trong text
        import re
        m = re.search(r'\{.*?\}', raw, re.DOTALL)
        if m:
            try:
                return json.loads(m.group())["translated"]
            except Exception:
                pass
        return raw


# ── Gemini Judge ───────────────────────────────────────────────────
def setup_gemini():
    """Khởi tạo Gemini client."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError(
            "Chưa đặt GEMINI_API_KEY!\n"
            "  Windows CMD: set GEMINI_API_KEY=your-key\n"
            "  PowerShell:  $env:GEMINI_API_KEY='your-key'\n"
            "Lấy key miễn phí tại: https://aistudio.google.com"
        )

    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)
    print(f"✅ Gemini {GEMINI_MODEL} sẵn sàng chấm điểm\n")
    return model


def judge_translation(gemini_model, source: str, predicted: str,
                       reference: str, direction: str) -> dict:
    """Gửi 1 cặp câu cho Gemini chấm điểm."""
    prompt = JUDGE_PROMPT_TEMPLATE.format(
        direction=direction,
        source=source,
        predicted=predicted,
        reference=reference or "Không có",
    )

    try:
        response = gemini_model.generate_content(
            prompt,
            generation_config={"temperature": 0.1, "max_output_tokens": 150}
        )
        raw = response.text.strip()

        # Parse JSON
        if raw.startswith("```"):
            raw = raw.strip("`").strip()
            if raw.startswith("json"):
                raw = raw[4:].strip()

        result = json.loads(raw)
        return {
            "score":      int(result.get("score", 3)),
            "reason":     result.get("reason", ""),
            "error_type": result.get("error_type", "none"),
        }
    except Exception as e:
        return {"score": 3, "reason": f"Parse error: {e}", "error_type": "none"}


# ── Load test data ─────────────────────────────────────────────────
def load_test_samples(n: int) -> list:
    """Load n mẫu từ test set."""
    if not TEST_FILE.exists():
        raise FileNotFoundError(f"Không tìm thấy {TEST_FILE}\nChạy script 03 trước.")

    samples = []
    with open(TEST_FILE, encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= n:
                break
            item = json.loads(line)
            messages = item["messages"]

            user_msg = next(m["content"] for m in messages if m["role"] == "user")
            ref_json  = next(m["content"] for m in messages if m["role"] == "assistant")

            direction = "EN→VI" if "English to Vietnamese" in user_msg else "VI→EN"
            source    = user_msg.split("\n\n", 1)[-1].strip().strip('"')

            try:
                reference = json.loads(ref_json).get("translated", "")
            except Exception:
                reference = ""

            samples.append({
                "source":    source,
                "reference": reference,
                "direction": direction,
            })
    return samples


# ── Main ───────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("BƯỚC 4.2: ĐÁNH GIÁ BẰNG LLM-AS-A-JUDGE (Gemini)")
    print("=" * 60)

    # 1. Khởi tạo Gemini
    gemini_model = setup_gemini()

    # 2. Load fine-tuned model
    ft_model, tokenizer = load_finetuned_model()

    # 3. Load test samples
    samples = load_test_samples(MAX_SAMPLES)
    print(f"📂 Test samples: {len(samples)} câu\n")

    # 4. Dịch + chấm điểm
    results = []
    error_counts = defaultdict(int)

    print(f"🔄 Đang dịch và chấm điểm {len(samples)} câu...")
    print(f"   (ước tính ~{len(samples) * (DELAY_BETWEEN_CALLS + 2):.0f} giây)\n")

    for i, sample in enumerate(samples):
        # Dịch bằng fine-tuned model
        predicted = translate_with_model(
            ft_model, tokenizer, sample["source"], sample["direction"]
        )

        # Gemini chấm điểm
        judgment = judge_translation(
            gemini_model,
            source=sample["source"],
            predicted=predicted,
            reference=sample["reference"],
            direction=sample["direction"],
        )

        result = {**sample, "predicted": predicted, **judgment}
        results.append(result)
        error_counts[judgment["error_type"]] += 1

        # Progress
        if (i + 1) % 20 == 0 or i == len(samples) - 1:
            avg = sum(r["score"] for r in results) / len(results)
            print(f"  [{i+1}/{len(samples)}] Điểm TB hiện tại: {avg:.2f}/5")

        time.sleep(DELAY_BETWEEN_CALLS)

    # 5. Tổng hợp kết quả
    scores   = [r["score"] for r in results]
    avg_score = sum(scores) / len(scores)
    pct_good  = sum(1 for s in scores if s >= 4) / len(scores) * 100
    pct_bad   = sum(1 for s in scores if s <= 2) / len(scores) * 100

    worst  = sorted(results, key=lambda x: x["score"])[:5]
    best   = sorted(results, key=lambda x: x["score"], reverse=True)[:5]

    # 6. In báo cáo
    print("\n" + "=" * 60)
    print("📊 KẾT QUẢ LLM-AS-A-JUDGE:")
    print("=" * 60)
    print(f"  Điểm trung bình:    {avg_score:.2f} / 5.0")
    print(f"  Đạt điểm >= 4:      {pct_good:.0f}%  ({sum(1 for s in scores if s >= 4)}/{len(scores)} câu)")
    print(f"  Cần cải thiện (<= 2): {pct_bad:.0f}%  ({sum(1 for s in scores if s <= 2)}/{len(scores)} câu)")

    print("\n🔴 Lỗi phổ biến nhất:")
    for err_type, count in sorted(error_counts.items(), key=lambda x: -x[1]):
        if err_type != "none" and count > 0:
            label = {
                "idiom":      "Thành ngữ / idiom",
                "ambiguous":  "Từ đa nghĩa",
                "unnatural":  "Không tự nhiên",
                "wrong":      "Sai nghĩa hoàn toàn",
            }.get(err_type, err_type)
            print(f"  - {label}: {count} câu")

    print("\n🔴 5 câu kém nhất:")
    for r in worst:
        print(f"  [☆{r['score']}] [{r['direction']}] \"{r['source'][:40]}\"")
        print(f"       Dịch: \"{r['predicted'][:60]}\"")
        print(f"       Lý do: {r['reason']}")
        print()

    print("✅ 5 câu tốt nhất:")
    for r in best:
        print(f"  [☆{r['score']}] [{r['direction']}] \"{r['source'][:40]}\" → \"{r['predicted'][:50]}\"")

    # 7. Nhận xét và gợi ý
    print("\n" + "=" * 60)
    print("💡 KẾT LUẬN:")
    if avg_score >= 4.0:
        print("  🎉 Rất tốt! Model sẵn sàng deploy chính thức.")
    elif avg_score >= 3.5:
        print("  ✅ Tốt. Có thể deploy thử nghiệm.")
        print("  → Cải thiện thêm bằng cách bổ sung data cho các lỗi phổ biến trên.")
    elif avg_score >= 3.0:
        print("  ⚠️  Tạm được. Nên train thêm 1-2 epoch.")
        print("  → Tập trung vào data thành ngữ / từ đa nghĩa.")
    else:
        print("  ❌ Cần cải thiện đáng kể.")
        print("  → Kiểm tra lại quality của dataset (chạy lại script 03).")
        print("  → Tăng số epoch hoặc điều chỉnh learning rate.")

    # 8. Lưu báo cáo đầy đủ
    report = {
        "summary": {
            "avg_score":   round(avg_score, 3),
            "pct_score_4_plus": round(pct_good, 1),
            "pct_score_2_minus": round(pct_bad, 1),
            "total_samples": len(results),
            "error_counts": dict(error_counts),
        },
        "worst_5":  worst,
        "best_5":   best,
        "all_results": results,
    }

    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Báo cáo đầy đủ lưu tại: {REPORT_FILE}")
    print("✅ Hoàn thành đánh giá LLM-as-a-Judge!")


if __name__ == "__main__":
    main()
