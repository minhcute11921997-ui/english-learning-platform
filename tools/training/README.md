# Hướng dẫn Fine-tune Model Dịch Tiếng Anh ↔ Tiếng Việt

> Tài liệu này hướng dẫn toàn bộ quá trình từ A→Z để fine-tune một AI model chuyên dịch EN↔VI  
> và tích hợp vào hệ thống web học tiếng Anh.

---

## Yêu cầu phần cứng (đã kiểm tra)

| Thành phần | Tối thiểu | Khuyến nghị |
|---|---|---|
| GPU | NVIDIA RTX 8GB VRAM | RTX 3060 12GB ✅ |
| RAM | 16GB | 16GB DDR4 ✅ |
| Ổ cứng | 50GB trống | 100GB (model + dataset) |
| CUDA | ≥ 12.1 | 12.1+ |

---

## Tổng quan quy trình

```
Bước 1: Cài môi trường
    ↓
Bước 2: Chuẩn bị dữ liệu (dataset + DB export)
    ↓
Bước 3: Fine-tune model (QLoRA, chạy qua đêm)
    ↓
Bước 4: Đánh giá & chọn checkpoint tốt nhất
    ↓
Bước 5: Export → GGUF → chạy với Ollama
    ↓
Bước 6: Test API + tích hợp vào web app
```

---

## Bước 1: Cài đặt môi trường

### 1.1 Kiểm tra GPU

```bash
nvidia-smi
# Cần thấy: CUDA Version >= 12.1
# Cần thấy: RTX 3060 với ~12GB VRAM
```

### 1.2 Cài Miniconda (nếu chưa có)

Tải tại: https://docs.conda.io/en/latest/miniconda.html  
Chạy installer → tick "Add to PATH" → Restart terminal

### 1.3 Tạo môi trường Python riêng

```bash
conda create -n vi-en-translate python=3.11 -y
conda activate vi-en-translate
```

> ⚠️ Luôn activate môi trường này trước khi chạy bất kỳ script nào!

### 1.4 Cài PyTorch với CUDA

```bash
# Với CUDA 12.1
pip install torch==2.3.0 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### 1.5 Cài các thư viện training

```bash
pip install transformers==4.45.0
pip install peft==0.13.0
pip install trl==0.11.0
pip install bitsandbytes==0.44.0
pip install datasets==3.0.0
pip install accelerate==1.0.0
pip install evaluate sacrebleu
pip install huggingface_hub
pip install sentencepiece protobuf
```

### 1.6 Kiểm tra cài đặt

```bash
python -c "import torch; print('CUDA:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0)); print('VRAM:', round(torch.cuda.get_device_properties(0).total_memory/1e9, 1), 'GB')"
# Phải in ra: CUDA: True, GPU: NVIDIA GeForce RTX 3060, VRAM: 12.0 GB
```

### 1.7 Cài Ollama (để chạy model sau khi train)

Tải tại: https://ollama.com/download → Cài bình thường

### 1.8 Đăng ký Hugging Face & chấp nhận license Gemma

1. Tạo tài khoản tại: https://huggingface.co
2. Chấp nhận license Gemma 3 tại: https://huggingface.co/google/gemma-3-4b-it
3. Lấy token tại: https://huggingface.co/settings/tokens
4. Đăng nhập:
```bash
huggingface-cli login
# Dán token vào khi được hỏi
```

---

## Bước 2: Chuẩn bị dữ liệu

### 2.1 Cấu trúc thư mục

```
tools/training/
├── README.md                  ← File này
├── data/
│   ├── raw/                   ← Dataset gốc tải về
│   ├── db_export/             ← Export từ MySQL
│   └── processed/             ← Dữ liệu đã format xong
├── scripts/
│   ├── 01_download_datasets.py
│   ├── 02_export_db.js            ← Chạy trên máy có MySQL
│   ├── 03_format_dataset.py
│   ├── 04_train.py
│   ├── 05_evaluate.py             ← Đánh giá BLEU + chrF++
│   ├── 05b_llm_judge.py           ← Đánh giá bằng Gemini AI (khuyến nghị)
│   └── 06_merge_and_export.py
└── configs/
    └── training_config.yaml
```

### 2.2 Tải dataset sẵn có

```bash
conda activate vi-en-translate
python tools/training/scripts/01_download_datasets.py
```

Script này tải:
- **OPUS-100 (en-vi)**: ~690K cặp câu song ngữ chất lượng cao
- **IWSLT17 (en-vi)**: ~133K cặp câu học thuật
- Tự động lưu vào `tools/training/data/raw/`

### 2.3 Export dữ liệu từ database dự án

> Chạy script này trên máy có kết nối MySQL của dự án:

```bash
# Cần đặt biến môi trường trước
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=english_learning
export DB_USER=root
export DB_PASS=your_password

node tools/training/scripts/02_export_db.js
# Tạo ra: tools/training/data/db_export/vocabulary_pairs.json
```

### 2.4 Format và gộp dữ liệu

```bash
conda activate vi-en-translate
python tools/training/scripts/03_format_dataset.py
```

Script này:
- Gộp tất cả nguồn data
- Convert sang format instruction tuning (chat template)
- Tạo cả 2 chiều: EN→VI và VI→EN
- Split: 90% train / 5% validation / 5% test
- Lưu vào `tools/training/data/processed/`

---

## Bước 3: Fine-tune Model (QLoRA)

### 3.1 Cấu hình training

Xem và chỉnh sửa nếu cần: [`configs/training_config.yaml`](configs/training_config.yaml)

Các thông số quan trọng:
| Tham số | Giá trị mặc định | Ý nghĩa |
|---|---|---|
| `base_model` | `google/gemma-3-4b-it` | Model nền (Gemma 3 4B) |
| `lora_r` | `16` | LoRA rank (cao hơn = chất lượng tốt hơn, cần nhiều VRAM hơn) |
| `num_train_epochs` | `3` | Số epoch training |
| `per_device_train_batch_size` | `4` | Batch size trên GPU |
| `max_seq_length` | `256` | Độ dài tối đa mỗi cặp câu |

### 3.2 Chạy training

```bash
conda activate vi-en-translate
python tools/training/scripts/04_train.py

# Nên chạy qua đêm, ước tính:
# - 50K cặp: ~6 giờ
# - 100K cặp: ~12 giờ
# - 200K cặp: ~24 giờ
```

> **Theo dõi tiến trình**: Script sẽ in loss mỗi 50 bước.  
> Nếu `train/loss` giảm đều → đang học tốt.  
> Nếu `eval/loss` bắt đầu tăng khi `train/loss` vẫn giảm → đang overfit, dừng lại.

### 3.3 Các checkpoint được lưu tại

```
tools/training/models/vi-en-translator-v1/
├── checkpoint-500/
├── checkpoint-1000/
├── checkpoint-1500/
└── final/                 ← Checkpoint cuối
```

---

## Bước 4: Đánh giá Model

### 4.1 Đánh giá tự động (BLEU + chrF++)

```bash
conda activate vi-en-translate
python tools/training/scripts/05_evaluate.py
```

Output mẫu:
```
=== Evaluation Results ===
Checkpoint: final
BLEU-4:  32.5  (target: > 30)
chrF++:  57.8  (target: > 55)

=== Sample Translations ===
EN→VI:
  Input:    "apple"
  Expected: "quả táo"
  Got:      "quả táo / trái táo"  ✓

VI→EN:
  Input:    "Tôi thích học tiếng Anh"
  Expected: "I like learning English"
  Got:      "I like learning English"  ✓
```

### 4.2 Đánh giá bằng AI — LLM-as-a-Judge ⭐ Khuyến nghị

> Thay vì ngồi chấm điểm thủ công từng câu, dùng **Gemini API chấm điểm tự động**
> cho hàng trăm bản dịch — nhanh, nhất quán, không tốn công người.

**Cách hoạt động:**
1. Script cho model fine-tune dịch ~200 câu test
2. Gửi từng cặp `(câu gốc + bản dịch)` cho Gemini API
3. Gemini chấm điểm 1–5 và giải thích lý do
4. Tổng hợp báo cáo tự động

**Lấy Gemini API key (miễn phí):**
1. Vào https://aistudio.google.com
2. Nhấn **"Get API key"** → tạo key mới
3. Copy key

**Cài thư viện & chạy:**
```bash
conda activate vi-en-translate
pip install google-generativeai

# Đặt API key
set GEMINI_API_KEY=your-api-key-here        # Windows CMD
# $env:GEMINI_API_KEY="your-api-key-here"   # Windows PowerShell
# export GEMINI_API_KEY=your-api-key         # Linux/Mac

python tools/training/scripts/05b_llm_judge.py
```

**Output mẫu:**
```
=== LLM-as-a-Judge Report ===
Chấm 200 câu test bằng Gemini gemini-2.0-flash...

📊 Kết quả tổng hợp:
  Điểm trung bình:   4.1 / 5.0
  Đạt điểm >= 4:     78%  (156/200 câu)
  Cần cải thiện:     22%  (44/200 câu)

🔴 Lỗi phổ biến nhất:
  - Thành ngữ / idiom:  12 câu sai
  - Từ đa nghĩa:         8 câu sai
  - Sắc thái trang trọng: 5 câu sai

🔴 Ví dụ câu kém nhất:
  [EN→VI] "kick the bucket" → "đá cái xô"  (☆1)
           Lý do: Sai thành ngữ, phải dịch là "qua đời / mất"

  [VI→EN] "cậu bé" → "boy"  (☆2)
           Lý do: Đúng nhưng thiếu sắc thái, "young boy" tự nhiên hơn

✅ Ví dụ câu tốt nhất:
  [EN→VI] "apple" → "quả táo / trái táo"  (☆5)
  [VI→EN] "Tôi yêu Việt Nam" → "I love Vietnam"  (☆5)

💾 Báo cáo đầy đủ: tools/training/data/eval_report.json
```

**Đọc kết quả & quyết định:**

| Điểm TB | Hành động |
|---|---|
| < 3.0 / 5 | ❌ Cần train thêm epoch hoặc cải thiện data |
| 3.0 – 3.5 / 5 | ⚠️ Xem phần "Lỗi phổ biến" → bổ sung data cho các lỗi đó |
| 3.5 – 4.0 / 5 | ✅ Tốt, có thể deploy thử nghiệm |
| > 4.0 / 5 | 🎉 Rất tốt — deploy chính thức |

---

## Bước 5: Export và Chạy với Ollama

### 5.1 Merge LoRA weights vào model gốc

```bash
conda activate vi-en-translate
python tools/training/scripts/06_merge_and_export.py
# Tạo ra: tools/training/models/vi-en-merged/
```

### 5.2 Cài llama.cpp để convert sang GGUF

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
pip install -r requirements.txt

python convert_hf_to_gguf.py ../tools/training/models/vi-en-merged \
  --outtype q4_k_m \
  --outfile ../tools/training/models/vi-en-translator-q4.gguf
```

### 5.3 Tạo Ollama model

```bash
# Tạo Modelfile
cat > tools/training/Modelfile << 'EOF'
FROM ./models/vi-en-translator-q4.gguf

SYSTEM """You are an expert English-Vietnamese translator embedded in an English learning app.
Translate accurately and return ONLY valid JSON with no extra text."""

PARAMETER temperature 0.1
PARAMETER top_p 0.9
PARAMETER num_predict 256
EOF

# Đăng ký với Ollama
ollama create vi-en-translator -f tools/training/Modelfile

# Chạy Ollama server (cổng 11434)
ollama serve
```

### 5.4 Test nhanh

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "vi-en-translator",
  "prompt": "Translate from English to Vietnamese:\n\napple\n\nReturn JSON: {\"translated\": ..., \"dictionary\": [...]}",
  "stream": false
}'
```

---

## Bước 6: Tích hợp vào Web App

Sau khi Ollama đang chạy tại `localhost:11434`:

1. Trên máy server của web app, đặt biến môi trường:
```env
TRANSLATE_AI_ENABLED=true
TRANSLATE_AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://<IP_MAY_RTX_3060>:11434
OLLAMA_MODEL=vi-en-translator
```

2. File `server/src/services/translate/aiTranslateProvider.js` đã được chuẩn bị sẵn  
   để gọi Ollama API — **chỉ cần set env là hoạt động**.

3. Khởi động lại server web:
```bash
npm run dev   # hoặc pm2 restart all
```

---

## Kế hoạch thu thập dữ liệu tương lai

Khi người dùng đăng tải bài học lên web:

1. Hệ thống hỏi **opt-in**: *"Bạn có đồng ý chia sẻ nội dung này để cải thiện AI không?"*
2. Nếu đồng ý → lưu vào bảng `TrainingData` (trạng thái `pending`)
3. Admin review → phê duyệt
4. Định kỳ (mỗi quý/khi có đủ data mới) → chạy lại pipeline training từ Bước 3
5. Model mới sẽ tốt hơn vì có thêm data đặc thù của ứng dụng

---

## Troubleshooting thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `CUDA out of memory` | Batch quá lớn | Giảm `per_device_train_batch_size` xuống 2, tăng `gradient_accumulation_steps` lên 8 |
| `RuntimeError: Expected all tensors to be on the same device` | Mixed device | Thêm `device_map="auto"` |
| Model trả về không phải JSON | Prompt chưa đủ chặt | Xem `promptBuilder.js`, thêm ví dụ JSON vào prompt |
| BLEU quá thấp (< 20) | Thiếu data hoặc data kém | Lọc bỏ các cặp câu quá ngắn (< 3 từ) hoặc chất lượng thấp |
| Ollama không nhận GGUF | File corrupt | Chạy lại bước convert, kiểm tra checksum |

---

## Liên hệ

Dự án: [English Learning Platform](https://github.com/minhcute11921997-ui/english-learning-platform)  
Nhánh: `feature/ai-translate`  
File tích hợp: `server/src/services/translate/aiTranslateProvider.js`
