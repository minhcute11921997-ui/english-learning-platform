---
name: qa-verification
description: >-
  Bộ kỹ năng kiểm thử và xác minh toàn diện (Unit, Integration, Contract, Edge Cases,
  Security & E2E Interaction) cho hệ thống EngLearn v2.0 Fine Arts & Crafts Edition.
---

# 🧪 QA & Verification Skill (EngLearn v2.0)

Bộ công cụ và quy trình kiểm thử toàn diện theo chuẩn ISTQB & OWASP ASVS:
1. **Kiểm tra tính toàn vẹn dữ liệu & tài nguyên (Data & Asset Integrity)**
2. **Kiểm thử logic thuật toán (Unit Test - SM-2 SRS, Quiz Generator)**
3. **Kiểm thử hợp đồng API & biên đầu vào/đầu ra (API Contract & Edge Cases)**
4. **Kiểm tra phân quyền & sở hữu dữ liệu (RBAC & Multi-tenant Ownership)**
5. **Kiểm thử tương tác người dùng & giao diện trình duyệt (E2E Browser Interaction)**

---

## 🚀 Các lệnh thực thi nhanh

### 1. Kiểm tra tính toàn vẹn 60 thuật ngữ & 60 file SVG
```bash
cd tools
node content/content-validator.js
```
- Kiểm tra tính đầy đủ của 60 thuật ngữ nghệ thuật trong `server/src/seeders/artVocabData.js`.
- Xác minh file SVG thực tế tồn tại trong `client/public/images/vocab/`.
- Xác minh các trường bối cảnh văn hóa (`cultural_note`), nghệ sĩ/làng nghề (`related_artist`), nguồn từ điển (`source_ref`), câu ví dụ và phiên âm IPA.

### 2. Chạy Unit & Integration Tests (Jest & Supertest)
```bash
cd server
npm test
```
- Chạy toàn bộ các test suite trong `server/tests/`.
- Kiểm tra biên chất lượng SM-2 (0 đến 5, reset khi quality < 3, ease factor >= 1.3, max interval 365 ngày).
- Kiểm tra cơ chế chấm điểm Server-side, bảo mật chống lộ đáp án trước khi nộp bài.
- Kiểm tra phân quyền Admin vs Learner và quyền sở hữu sổ từ cá nhân.

### 3. Chạy API Matrix Tester (Happy Path & Negative/Edge Cases)
```bash
cd tools
node dev/api-tester.js
```
- Tự động test toàn bộ 9 nhóm endpoints của hệ thống v2.0:
  - Auth (Đăng ký, Đăng nhập, Refresh Token, Thông tin cá nhân, Đổi mật khẩu)
  - Topics & Vocabulary (Danh sách chủ đề, Lọc độ khó, Tìm kiếm 4 trường)
  - Exercises (Sinh đề 4 dạng, Chống lộ đáp án, Nộp bài chấm điểm)
  - Reviews SM-2 (Hàng đợi hôm nay, Đánh giá chất lượng 1-5, Thống kê)
  - Sổ từ cá nhân (CRUD, Đồng bộ đa sổ từ, Chống truy cập trái phép)
  - Admin (Quản lý user, Khóa/mở khóa tài khoản, Đổi vai trò)

### 4. Chạy E2E Browser Interaction Tester (Puppeteer)
```bash
cd tools
node quality/e2e-interaction-tester.js
```
- Mô phỏng tương tác thực tế của người học trên trình duyệt Chrome/Chromium:
  - Đăng ký tài khoản học viên mới, kiểm tra chuyển hướng tự động vào Dashboard.
  - Khám phá chủ đề Mỹ thuật, lọc từ vựng, mở rộng bối cảnh văn hóa.
  - Phóng to tranh (Modal triển lãm), kiểm tra ảnh fallback lỗi.
  - Luyện Flashcard 3D: lật thẻ, phím tắt Space, phím mũi tên, xáo thẻ, lưu vào SM-2.
  - Làm bài trắc nghiệm đố tranh, lưu nháp sessionStorage, nộp bài nhận giải thích.
  - Vào phòng ôn tập SM-2, đổi nguồn ôn, đánh giá 4 mức nhớ, kiểm tra cập nhật số liệu.
  - Tạo sổ từ mới và thêm từ vào bộ sưu tập cá nhân.
