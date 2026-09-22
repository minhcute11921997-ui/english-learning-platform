---
name: quality-check
description: >-
  Kiểm tra chất lượng code và performance. Sử dụng khi cần phân tích bundle size,
  benchmark API performance, tìm dead code, hoặc tạo tài liệu API tự động.
---

# 📊 Quality Check Skill

Kiểm tra chất lượng code và hiệu năng hệ thống.

## Các công cụ

### 1. Phân tích Bundle Size
```bash
cd E:\doan\tools
node quality/bundle-analyzer.js
```

### 2. Benchmark API Performance
```bash
node quality/perf-benchmark.js http://localhost:3000/api
```
🟢 < 200ms  🟡 200-500ms  🔴 > 500ms

### 3. Tìm Dead Code
```bash
node quality/dead-code-finder.js ../client/src
```

### 4. Tạo tài liệu API tự động
```bash
node quality/api-doc-generator.js ../server/src/routes
```
Output: `tools/output/api-documentation.md`
