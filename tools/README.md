# 🛠️ Tools & Scripts - Hệ thống Học Tiếng Anh

Thư mục chứa các công cụ, script hỗ trợ phát triển, kiểm tra bảo mật, cải thiện UI/UX, đồ họa và nội dung cho dự án.

## 📁 Cấu trúc

```
tools/
├── dev/                    # Công cụ phát triển
│   ├── scaffolder.js       # Tạo nhanh component, model, route
│   ├── api-tester.js       # Test API endpoints tự động
│   ├── db-reset.js         # Reset & seed database
│   └── env-checker.js      # Kiểm tra biến môi trường
├── security/               # Kiểm tra bảo mật
│   ├── audit.js            # Quét lỗ hổng dependencies
│   ├── sql-injection-check.js  # Kiểm tra SQL injection
│   ├── xss-check.js        # Kiểm tra XSS vulnerabilities
│   ├── jwt-validator.js    # Kiểm tra cấu hình JWT
│   └── security-headers.js # Kiểm tra HTTP security headers
├── ui/                     # Cải thiện UI/UX
│   ├── color-palette.js    # Tạo bảng màu nhất quán
│   ├── responsive-check.js # Kiểm tra responsive
│   ├── a11y-check.js       # Kiểm tra accessibility
│   ├── design-tokens.js    # Generate design tokens
│   └── lighthouse-audit.js # Chạy Lighthouse audit
├── graphics/               # Công cụ đồ họa
│   ├── image-optimizer.js  # Nén & tối ưu ảnh
│   ├── favicon-generator.js # Tạo favicon các kích thước
│   ├── og-image-generator.js # Tạo ảnh Open Graph
│   └── placeholder-gen.js  # Tạo ảnh placeholder cho từ vựng
├── content/                # Công cụ nội dung
│   ├── vocab-generator.js  # Tạo dữ liệu từ vựng mẫu
│   ├── reading-generator.js # Tạo bài đọc mẫu
│   ├── quiz-generator.js   # Tạo câu hỏi trắc nghiệm
│   ├── csv-importer.js     # Import từ vựng từ CSV
│   ├── content-validator.js # Kiểm tra chất lượng nội dung
│   └── seed-data-builder.js # Xây dựng dữ liệu seed hoàn chỉnh
├── quality/                # Kiểm tra chất lượng code
│   ├── bundle-analyzer.js  # Phân tích kích thước bundle
│   ├── perf-benchmark.js   # Benchmark performance API
│   ├── dead-code-finder.js # Tìm code không sử dụng
│   └── api-doc-generator.js # Tạo tài liệu API tự động
└── package.json            # Dependencies cho tools
```

## 🚀 Sử dụng

```bash
cd tools
npm install

# Dev tools
node dev/scaffolder.js component MyComponent
node dev/api-tester.js --all
node dev/db-reset.js --seed
node dev/env-checker.js

# Security
node security/audit.js
node security/sql-injection-check.js ../server/src
node security/xss-check.js ../client/src

# UI/UX
node ui/color-palette.js --theme ocean
node ui/a11y-check.js http://localhost:5173
node ui/lighthouse-audit.js http://localhost:5173

# Graphics
node graphics/image-optimizer.js ../client/public/images
node graphics/favicon-generator.js logo.png

# Content
node content/vocab-generator.js --topic family --count 30
node content/reading-generator.js --topic school --difficulty easy
node content/csv-importer.js vocabulary.csv
node content/seed-data-builder.js --all

# Quality
node quality/bundle-analyzer.js
node quality/perf-benchmark.js http://localhost:3000/api
node quality/api-doc-generator.js ../server/src/routes
```
