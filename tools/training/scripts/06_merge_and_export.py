"""
Script 06: Merge LoRA weights vào base model và export sang GGUF cho Ollama
Chạy: python tools/training/scripts/06_merge_and_export.py

Yêu cầu thêm:
  pip install llama-cpp-python  (hoặc dùng llama.cpp repo riêng)
"""

import torch
import shutil
import subprocess
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel, PeftConfig

LORA_DIR = Path(__file__).parent.parent / "models" / "vi-en-translator-v1" / "final"
MERGED_DIR = Path(__file__).parent.parent / "models" / "vi-en-merged"
GGUF_FILE = Path(__file__).parent.parent / "models" / "vi-en-translator-q4.gguf"
MODELFILE = Path(__file__).parent.parent / "Modelfile"


def merge_lora():
    """Merge LoRA adapter vào base model (full precision)."""
    print("🔀 Merge LoRA weights vào base model...")
    print("  (Cần đủ RAM ~16GB, không cần GPU cho bước này)")

    if not LORA_DIR.exists():
        raise FileNotFoundError(f"Không tìm thấy LoRA adapter tại {LORA_DIR}")

    # Load base model name từ LoRA config
    peft_config = PeftConfig.from_pretrained(str(LORA_DIR))
    base_model_name = peft_config.base_model_name_or_path
    print(f"  Base model: {base_model_name}")

    # Load base model (FP16 để tiết kiệm RAM)
    print("  📥 Load base model (FP16)...")
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.float16,
        device_map="cpu",  # CPU để tránh OOM GPU
        trust_remote_code=True,
    )

    # Load và merge LoRA
    print("  🔀 Merge LoRA...")
    model = PeftModel.from_pretrained(base_model, str(LORA_DIR))
    model = model.merge_and_unload()  # Merge adapter vào weights

    # Lưu merged model
    MERGED_DIR.mkdir(parents=True, exist_ok=True)
    print(f"  💾 Lưu merged model → {MERGED_DIR}...")
    model.save_pretrained(str(MERGED_DIR), safe_serialization=True)

    # Copy tokenizer
    tokenizer = AutoTokenizer.from_pretrained(str(LORA_DIR))
    tokenizer.save_pretrained(str(MERGED_DIR))

    print(f"✅ Merge hoàn thành: {MERGED_DIR}")
    return str(MERGED_DIR)


def convert_to_gguf():
    """Convert merged model sang GGUF format cho Ollama."""
    print("\n🔄 Convert sang GGUF (Q4_K_M quantization)...")

    # Tìm llama.cpp
    llama_cpp_paths = [
        Path("llama.cpp"),
        Path.home() / "llama.cpp",
        Path("C:/llama.cpp"),
    ]

    convert_script = None
    for p in llama_cpp_paths:
        candidate = p / "convert_hf_to_gguf.py"
        if candidate.exists():
            convert_script = candidate
            break

    if convert_script is None:
        print("\n⚠️  Không tìm thấy llama.cpp!")
        print("Cài đặt llama.cpp:")
        print("  git clone https://github.com/ggerganov/llama.cpp")
        print("  cd llama.cpp && pip install -r requirements.txt")
        print("\nSau khi cài, chạy lại script này.")
        print("\nHoặc convert thủ công:")
        print(f"  python llama.cpp/convert_hf_to_gguf.py {MERGED_DIR} \\")
        print(f"    --outtype q4_k_m \\")
        print(f"    --outfile {GGUF_FILE}")
        return None

    print(f"  Dùng: {convert_script}")
    cmd = [
        "python", str(convert_script),
        str(MERGED_DIR),
        "--outtype", "q4_k_m",
        "--outfile", str(GGUF_FILE),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Lỗi convert: {result.stderr}")
        return None

    print(f"✅ GGUF file: {GGUF_FILE} ({GGUF_FILE.stat().st_size/1e9:.1f} GB)")
    return str(GGUF_FILE)


def create_modelfile():
    """Tạo Ollama Modelfile."""
    print("\n📝 Tạo Ollama Modelfile...")

    modelfile_content = f"""FROM {GGUF_FILE}

SYSTEM \"\"\"You are an expert English-Vietnamese translator embedded in an English learning app.
Translate accurately and naturally.
Return ONLY valid JSON with no markdown, no extra text, no explanation outside JSON.
Response format:
{{
  "translated": "<bản dịch>",
  "dictionary": [{{"partOfSpeech": "noun|verb|adj|...", "terms": ["nghĩa 1", "nghĩa 2"]}}],
  "explanation": "<ghi chú ngắn bằng tiếng Việt, hoặc null>",
  "error": false
}}\"\"\"

PARAMETER temperature 0.1
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 256
PARAMETER repeat_penalty 1.1
"""

    with open(MODELFILE, "w", encoding="utf-8") as f:
        f.write(modelfile_content)

    print(f"✅ Modelfile: {MODELFILE}")
    return str(MODELFILE)


def register_with_ollama(modelfile_path: str):
    """Đăng ký model với Ollama."""
    print("\n🦙 Đăng ký với Ollama...")

    result = subprocess.run(
        ["ollama", "create", "vi-en-translator", "-f", modelfile_path],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        print("✅ Model đã được đăng ký với Ollama: vi-en-translator")
    else:
        print(f"❌ Lỗi đăng ký Ollama: {result.stderr}")
        print("\nĐăng ký thủ công:")
        print(f"  ollama create vi-en-translator -f {modelfile_path}")


def test_ollama():
    """Test nhanh với Ollama."""
    import urllib.request
    import json as jsonlib

    print("\n🧪 Test nhanh với Ollama API...")

    test_prompt = 'Translate from English to Vietnamese:\n\napple\n\nReturn JSON: {"translated": ..., "dictionary": [...], "explanation": null, "error": false}'

    data = jsonlib.dumps({
        "model": "vi-en-translator",
        "prompt": test_prompt,
        "stream": False,
        "options": {"temperature": 0.1}
    }).encode()

    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/generate",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = jsonlib.loads(resp.read())
            print(f"✅ Ollama response:")
            print(f"   {result.get('response', 'No response')[:200]}")
    except Exception as e:
        print(f"⚠️  Không kết nối được Ollama: {e}")
        print("Chạy: ollama serve  (trong terminal riêng)")


def main():
    print("=" * 60)
    print("BƯỚC 6: EXPORT → GGUF → OLLAMA")
    print("=" * 60)

    # Bước 1: Merge LoRA
    merge_lora()

    # Bước 2: Convert sang GGUF
    gguf_path = convert_to_gguf()

    # Bước 3: Tạo Modelfile
    if gguf_path:
        modelfile_path = create_modelfile()
        register_with_ollama(modelfile_path)
        test_ollama()

    print("\n" + "=" * 60)
    print("✅ HOÀN THÀNH!")
    print()
    print("Bước tiếp theo trên máy web server:")
    print("  1. Chạy: ollama serve")
    print("  2. Set trong server/.env:")
    print("     TRANSLATE_AI_ENABLED=true")
    print("     TRANSLATE_AI_PROVIDER=ollama")
    print(f"     OLLAMA_BASE_URL=http://<IP_MAY_RTX>:11434")
    print("     OLLAMA_MODEL=vi-en-translator")
    print("  3. Restart web server")


if __name__ == "__main__":
    main()
