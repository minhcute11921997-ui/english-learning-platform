---
name: graphics-tools
description: >-
  Công cụ đồ họa cho dự án. Sử dụng khi cần tối ưu hóa ảnh, tạo favicon các kích thước,
  tạo ảnh Open Graph cho sharing, hoặc tạo ảnh placeholder SVG cho từ vựng khi chưa
  có ảnh minh họa thật.
---

# 🖼️ Graphics Tools Skill

Công cụ đồ họa và tối ưu hóa hình ảnh.

## Các công cụ có sẵn

### 1. Tối ưu hóa ảnh (Image Optimizer)
```bash
cd E:\doan\tools
node graphics/image-optimizer.js ../client/public/images
node graphics/image-optimizer.js ../client/public/images --quality 80 --max-width 800
```
- Chuyển ảnh sang WebP (tiết kiệm 40-60% dung lượng)
- Resize ảnh lớn
- Giữ chất lượng tốt

### 2. Tạo Favicon
```bash
node graphics/favicon-generator.js logo.png
```
Tạo: 16x16, 32x32, 48x48, 180x180 (Apple), 192x192, 512x512 (Android)
Output: `tools/output/favicons/` + `site.webmanifest` + HTML snippet

### 3. Tạo ảnh Open Graph
```bash
node graphics/og-image-generator.js --title "My English Lesson" --author "Teacher Lan"
```
Tạo ảnh 1200x630 cho Facebook/Twitter sharing

### 4. Tạo Placeholder cho từ vựng
```bash
node graphics/placeholder-gen.js --word "apple" --topic food
node graphics/placeholder-gen.js --batch vocabulary.json --output ./images/
```
- Tạo SVG placeholder với chữ cái đầu + tên từ
- Màu sắc theo chủ đề
- Dùng khi chưa có ảnh minh họa thật

## Lưu ý
- Ảnh từ vựng nên ≤ 200KB
- Dùng WebP cho web, PNG cho favicon
- Kích thước ảnh từ vựng: 400x400px
- Kích thước OG image: 1200x630px
