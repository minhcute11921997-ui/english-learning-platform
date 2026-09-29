"""
Script 04: Fine-tune Gemma 3 4B với QLoRA cho dịch EN↔VI
Chạy: python tools/training/scripts/04_train.py

Yêu cầu: RTX 3060 12GB+ VRAM, CUDA 12.1+
Thời gian ước tính: 6-12 giờ tùy dataset size
"""

import yaml
import json
import torch
from pathlib import Path
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer

# ---- Load config ----
CONFIG_FILE = Path(__file__).parent.parent / "configs" / "training_config.yaml"
with open(CONFIG_FILE) as f:
    cfg = yaml.safe_load(f)

print("=" * 60)
print("BƯỚC 4: FINE-TUNE GEMMA 3 4B (QLoRA)")
print("=" * 60)
print(f"\n📋 Config: {CONFIG_FILE}")
print(f"🤖 Base model: {cfg['base_model']}")
print(f"💾 Output: {cfg['output_dir']}")


# ---- Kiểm tra GPU ----
def check_gpu():
    if not torch.cuda.is_available():
        raise RuntimeError("❌ Không tìm thấy GPU CUDA! Fine-tune cần GPU NVIDIA.")
    gpu_name = torch.cuda.get_device_name(0)
    vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"\n✅ GPU: {gpu_name} ({vram_gb:.1f} GB VRAM)")
    if vram_gb < 8:
        raise RuntimeError(f"❌ VRAM {vram_gb:.1f}GB không đủ. Cần ít nhất 8GB.")


# ---- Load dataset ----
def load_dataset_from_jsonl(file_path: str) -> Dataset:
    data = []
    with open(file_path, encoding="utf-8") as f:
        for line in f:
            data.append(json.loads(line))
    return Dataset.from_list(data)


# ---- Format messages → text cho tokenizer ----
def format_chat(example, tokenizer):
    """Convert messages array → tokenizer chat format."""
    text = tokenizer.apply_chat_template(
        example["messages"],
        tokenize=False,
        add_generation_prompt=False
    )
    return {"text": text}


# ---- Main ----
def main():
    check_gpu()

    # 1. Load tokenizer
    print(f"\n📥 Load tokenizer từ {cfg['base_model']}...")
    tokenizer = AutoTokenizer.from_pretrained(
        cfg["base_model"],
        trust_remote_code=True,
        padding_side="right"
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 2. Load datasets
    print("📂 Load dataset...")
    train_ds = load_dataset_from_jsonl(cfg["train_file"])
    val_ds = load_dataset_from_jsonl(cfg["val_file"])
    print(f"  Train: {len(train_ds):,} examples")
    print(f"  Val:   {len(val_ds):,} examples")

    # Apply chat template
    train_ds = train_ds.map(lambda x: format_chat(x, tokenizer))
    val_ds = val_ds.map(lambda x: format_chat(x, tokenizer))

    # 3. Quantization config (QLoRA)
    print("\n⚙️  Cấu hình QLoRA (4-bit)...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=cfg["load_in_4bit"],
        bnb_4bit_quant_type=cfg["bnb_4bit_quant_type"],
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=cfg.get("bnb_4bit_use_double_quant", True),
    )

    # 4. Load model với 4-bit quantization
    print(f"📥 Load model {cfg['base_model']} (4-bit)...")
    model = AutoModelForCausalLM.from_pretrained(
        cfg["base_model"],
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)

    # 5. LoRA config
    lora_config = LoraConfig(
        r=cfg["lora_r"],
        lora_alpha=cfg["lora_alpha"],
        target_modules=cfg["lora_target_modules"],
        lora_dropout=cfg["lora_dropout"],
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)

    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"✅ Trainable params: {trainable_params:,} / {total_params:,} ({100*trainable_params/total_params:.2f}%)")

    # 6. Training arguments
    output_dir = Path(cfg["output_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=str(output_dir),
        num_train_epochs=cfg["num_train_epochs"],
        per_device_train_batch_size=cfg["per_device_train_batch_size"],
        gradient_accumulation_steps=cfg["gradient_accumulation_steps"],
        learning_rate=cfg["learning_rate"],
        warmup_ratio=cfg["warmup_ratio"],
        lr_scheduler_type=cfg["lr_scheduler_type"],
        weight_decay=cfg.get("weight_decay", 0.001),
        max_grad_norm=cfg.get("max_grad_norm", 1.0),
        fp16=cfg.get("fp16", False),
        bf16=cfg.get("bf16", True),
        logging_steps=cfg["logging_steps"],
        eval_strategy="steps",
        eval_steps=cfg["eval_steps"],
        save_strategy="steps",
        save_steps=cfg["save_steps"],
        save_total_limit=cfg.get("save_total_limit", 3),
        load_best_model_at_end=cfg.get("load_best_model_at_end", True),
        metric_for_best_model=cfg.get("metric_for_best_model", "eval_loss"),
        greater_is_better=cfg.get("greater_is_better", False),
        optim=cfg.get("optim", "paged_adamw_8bit"),
        dataloader_num_workers=cfg.get("dataloader_num_workers", 2),
        group_by_length=cfg.get("group_by_length", True),
        seed=cfg.get("seed", 42),
        report_to=cfg.get("report_to", "none"),
    )

    # 7. Trainer
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        dataset_text_field="text",
        max_seq_length=cfg["max_seq_length"],
        packing=False,
    )

    # 8. Train!
    print("\n🚀 Bắt đầu training...")
    print(f"   Epochs: {cfg['num_train_epochs']}")
    print(f"   Batch size: {cfg['per_device_train_batch_size']} × {cfg['gradient_accumulation_steps']} steps = {cfg['per_device_train_batch_size'] * cfg['gradient_accumulation_steps']} effective")
    print(f"   Max seq length: {cfg['max_seq_length']}")
    print()

    trainer.train()

    # 9. Lưu model cuối
    final_dir = output_dir / "final"
    trainer.save_model(str(final_dir))
    tokenizer.save_pretrained(str(final_dir))

    print(f"\n✅ Training hoàn thành!")
    print(f"📂 Model lưu tại: {final_dir}")
    print("Chạy tiếp: python scripts/05_evaluate.py")


if __name__ == "__main__":
    main()
