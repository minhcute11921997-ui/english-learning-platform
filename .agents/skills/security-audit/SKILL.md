---
name: security-audit
description: >-
  Chạy kiểm tra bảo mật toàn diện cho dự án. Sử dụng khi cần quét lỗ hổng dependencies,
  kiểm tra SQL injection, XSS, cấu hình JWT, và HTTP security headers. Tự động chạy
  tất cả các tool trong thư mục tools/security/.
---

# 🛡️ Security Audit Skill

Kiểm tra bảo mật toàn diện cho hệ thống học tiếng Anh.

## Các bước thực hiện

### 1. Quét lỗ hổng dependencies
```bash
cd E:\doan\tools
node security/audit.js
```

### 2. Kiểm tra SQL Injection
```bash
node security/sql-injection-check.js ../server/src
```

### 3. Kiểm tra XSS
```bash
node security/xss-check.js ../client/src
```

### 4. Kiểm tra cấu hình JWT
```bash
node security/jwt-validator.js
```

### 5. Kiểm tra Security Headers (khi server đang chạy)
```bash
node security/security-headers.js http://localhost:3000
```

## Kết quả mong đợi
- Không có vulnerabilities ở mức critical/high
- Không có SQL injection patterns trong code
- Không có XSS patterns nguy hiểm
- JWT secret đủ mạnh (≥32 ký tự)
- Security headers đầy đủ (helmet.js)

## Sau khi kiểm tra
- Báo cáo kết quả cho user
- Đề xuất cách khắc phục nếu tìm thấy vấn đề
