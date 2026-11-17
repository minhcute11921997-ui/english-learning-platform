# 🎨 EngLearn v2.0 - Hệ Thống Học Từ Vựng Tiếng Anh Chuyên Ngành Mỹ Thuật & Mỹ Nghệ

**EngLearn v2.0 (Fine Arts & Crafts Edition)** là nền tảng web học thuật ngữ tiếng Anh chuyên ngành **Hội họa** và **Ngành nghề Mỹ nghệ thủ công** qua hình ảnh minh họa trực quan, bối cảnh văn hóa – lịch sử và thuật toán ôn tập ngắt quãng **SuperMemo 2 (SM-2)**.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React 19, Vite, Tailwind CSS v4, Zustand, React Router v6, Axios, React Icons, React Hot Toast
- **Backend:** Node.js, Express 5, Sequelize ORM 6, MySQL 8.0
- **Bảo mật:** JWT (Access Token + Refresh Token), Helmet, CORS, Rate Limiting, Express Validator, BCrypt
- **Kiểm thử & QA:** Jest, Supertest, Puppeteer E2E, Content & Security Scanners
- **DevOps:** Docker, Docker Compose, Nginx Reverse Proxy

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Khởi chạy nhanh bằng Docker

Chỉ cần cài sẵn **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**:

```bash
# 1. Clone repository
git clone https://github.com/minhcute11921997-ui/english-learning-platform.git
cd english-learning-platform

# 2. Khởi chạy toàn bộ hệ thống (MySQL + Backend + Frontend)
docker compose up -d --build
```

👉 **Truy cập ứng dụng tại:**
- **Giao diện học tập:** [http://localhost:5173](http://localhost:5173) (hoặc [http://localhost:8080](http://localhost:8080))
- **API Backend:** [http://localhost:3000/api](http://localhost:3000/api)
- **Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

### Cách 2: Khởi chạy thủ công (Không dùng Docker)

#### Yêu cầu:
- Node.js >= 18
- MySQL Server >= 8.0 (đang chạy cổng 3306)

#### Các bước thực hiện:

```bash
# 1. Khởi động Backend
cd server
cp .env.example .env       # Cấu hình tài khoản / mật khẩu MySQL
npm install
node src/seeders/index.js  # Khởi tạo bảng & nạp 60 thuật ngữ mẫu
npm run dev

# 2. Khởi động Frontend (mở terminal khác)
cd client
npm install
npm run dev
```

---

## 🔑 Tài Khoản Demo Sẵn Có

Hệ thống tự động nạp sẵn các tài khoản mẫu khi chạy `node server/src/seeders/index.js`:

| Vai trò | Email | Mật khẩu | Mục đích kiểm thử |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin@enlearn.com` | `Admin@123` | Quản lý người dùng, phân quyền, CRUD thuật ngữ mỹ thuật & thống kê |
| **Cố vấn / Giáo viên** | `teacher@enlearn.com` | `Teacher@123` | Trải nghiệm luồng học tập, flashcard, sổ từ & ôn tập SM-2 |
| **Học viên 1 (Learner)** | `student1@enlearn.com` | `Student@123` | Học từ vựng, làm bài tập đố tranh, ôn tập định kỳ (có sẵn dữ liệu tiến độ mẫu) |
| **Học viên 2 (Learner)** | `student2@enlearn.com` | `Student@123` | Trải nghiệm tài khoản học viên mới từ đầu |

*(Bạn cũng có thể tự đăng ký tài khoản học viên mới trực tiếp tại `/register`.)*

---

## 📖 Các Tính Năng Chính (v2.0 Fine Arts & Crafts Edition)

- ✅ **2 Chuyên đề Mỹ thuật & Mỹ nghệ chuyên sâu:** *Các loại tranh (Types of Paintings)* và *Ngành nghề Mỹ thuật & Thủ công (Fine Arts & Crafts Professions)* với **60 thuật ngữ** chuẩn hóa.
- ✅ **Trực quan hóa Tác phẩm & Bối cảnh Văn hóa:** Mỗi thuật ngữ đi kèm **hình ảnh minh họa (`.jpg`)** với cơ chế phóng to Darkroom Modal & ảnh dự phòng `_placeholder.svg`, phiên âm IPA, phát âm bản xứ, nghệ sĩ/làng nghề tiêu biểu và nguồn tham chiếu uy tín (Oxford Art, Tate, Britannica).
- ✅ **Thẻ ghi nhớ Flashcard 3D:** Lật thẻ 2 mặt bằng chuột hoặc phím tắt (`Space`, `←`, `→`), xáo trộn thẻ và lưu nhanh vào lộ trình ôn tập SM-2.
- ✅ **Bài tập Củng cố & Đố tranh:** Sinh đề 4 dạng câu hỏi (*Nhìn tranh đoán thuật ngữ*, *Anh–Việt*, *Việt–Anh*, *Điền từ vào ngữ cảnh*), lưu nháp bộ đề & đáp án chống mất bài khi reload, chấm điểm an toàn trên server kèm giải thích chi tiết.
- ✅ **Ôn tập Ngắt quãng Thông minh (SM-2):** Lập lịch ôn tự động theo mức độ ghi nhớ (*Chưa nhớ*, *Khó nhớ*, *Nhớ tốt*, *Rất dễ*), hỗ trợ chuyển đổi linh hoạt giữa *Cần ôn hôm nay*, *Tất cả từ đang học* và *Sổ từ cá nhân*.
- ✅ **Sổ từ vựng Cá nhân:** Tạo, chỉnh sửa, xóa bộ sưu tập từ và đồng bộ lưu từ đa danh mục.
- ✅ **Bảng Quản trị Hệ thống (RBAC):** Quản lý tài khoản (khóa/mở khóa, đổi vai trò có bảo vệ chống tự khóa/tự hạ quyền), quản lý kho từ vựng (Thêm/Sửa/Xóa) và thống kê tổng quan.

---

## 🧪 Kiểm Thử & Thẩm Định Chất Lượng

```bash
# 1. Kiểm định 60 thuật ngữ & 60 file ảnh minh họa
node tools/content/content-validator.js

# 2. Chạy Unit & Integration Tests (Backend Jest & Supertest)
cd server && npm test

# 3. Kiểm tra Lint & Production Build (Frontend)
cd client && npm run lint && npm run build

# 4. Kiểm thử API Matrix & E2E Trình duyệt (khi server và client đang chạy)
cd tools && node dev/api-tester.js
cd tools && node quality/e2e-interaction-tester.js
```
