---
name: content-builder
description: >-
  Tạo và quản lý nội dung học tập (từ vựng, bài đọc, câu hỏi, seed data) cho hệ thống.
  Sử dụng khi cần tạo dữ liệu mẫu, import CSV, validate nội dung, hoặc generate quiz
  tự động. Chạy các tool trong thư mục tools/content/.
---

# 📝 Content Builder Skill

Tạo và quản lý nội dung học tập cho hệ thống.

## Các công cụ có sẵn

### 1. Tạo dữ liệu từ vựng
```bash
cd E:\doan\tools
node content/vocab-generator.js --all                    # Tất cả chủ đề
node content/vocab-generator.js --topic family --count 30 # Theo chủ đề
```

### 2. Tạo bài đọc mẫu
```bash
node content/reading-generator.js --all
node content/reading-generator.js --topic school --difficulty easy
```

### 3. Tạo câu hỏi quiz tự động từ từ vựng
```bash
node content/quiz-generator.js output/seed-data/vocabulary-all.json
```
Tự động tạo 3 dạng quiz: choose_meaning, choose_word, fill_blank

### 4. Import từ vựng từ CSV
```bash
node content/csv-importer.js vocabulary.csv
```
Format CSV: `word,word_type,meaning_vi,example_sentence,topic,difficulty`

### 5. Validate chất lượng nội dung
```bash
node content/content-validator.js data.json
```
Kiểm tra: word length, meaning, word_type hợp lệ, example quality, question count

### 6. Build toàn bộ seed data
```bash
node content/seed-data-builder.js --all
```
Tạo: vocabulary, readings, topics, users, placement questions

## Output
Tất cả output được lưu tại `tools/output/seed-data/`

## Lưu ý
- Mỗi chủ đề nên có 30-40 từ vựng
- Mỗi bài đọc cần 4-6 câu hỏi trắc nghiệm
- Giải thích đáp án bằng tiếng Việt
- Ví dụ câu ngắn gọn, phù hợp trình độ beginner
