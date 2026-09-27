# 📚 EngLearn - Hệ Thống Học Tiếng Anh Cơ Bản

Ứng dụng web học tiếng Anh cơ bản dành cho học sinh và người mới bắt đầu, tích hợp thuật toán ôn tập ngắt quãng (Spaced Repetition System - SM-2) và luyện đọc hiểu theo chủ đề.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React 19, Vite, Tailwind CSS v4, Zustand, React Router v7, React Icons
- **Backend:** Node.js, Express.js, Sequelize ORM, MySQL 8.0
- **Bảo mật:** JWT (Access Token + Refresh Token), Helmet, CORS, Rate Limiting, Input Validation, BCrypt
- **DevOps:** Docker, Docker Compose, Nginx Reverse Proxy

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Khởi chạy siêu tốc bằng Docker (Khuyên dùng ⭐)

Chỉ cần cài sẵn **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** trên máy, không cần tự cài Node.js hay MySQL.

```bash
# 1. Clone repository
git clone https://github.com/minhcute11921997-ui/english-learning-platform.git
cd english-learning-platform

# 2. Khởi chạy toàn bộ hệ thống (MySQL + Backend + Frontend + Tự động nạp dữ liệu mẫu)
docker compose up -d --build
```

👉 **Truy cập ứng dụng ngay tại:**
- **Giao diện học tập:** [http://localhost](http://localhost) hoặc [http://localhost:5173](http://localhost:5173)
- **API Backend:** [http://localhost:3000/api](http://localhost:3000/api)
- **Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

> **Khi bạn kéo code mới từ GitHub về:**
> ```bash
> git pull
> docker compose up -d --build
> ```
> Toàn bộ database, thư viện và mã nguồn sẽ tự động cập nhật đồng bộ!

---

### Cách 2: Khởi chạy thủ công (Không dùng Docker)

#### Yêu cầu:
- Node.js >= 18
- MySQL Server >= 8.0 (đang chạy cổng 3306)

#### Các bước thực hiện:

```bash
# 1. Khởi động Backend
cd server
cp .env.example .env    # Cấu hình tài khoản / mật khẩu MySQL của bạn
npm install
node src/seeders/index.js   # Khởi tạo bảng & nạp dữ liệu mẫu
npm run dev

# 2. Khởi động Frontend (mở terminal khác)
cd client
npm install
npm run dev
```

---

## 🔑 Tài Khoản Demo Sẵn Có

Hệ thống đã nạp sẵn các tài khoản để bạn kiểm thử ngay:

| Vai trò | Email | Mật khẩu | Mục đích kiểm thử |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin@englearn.com` | `Admin@123` | Quản trị người dùng, duyệt bài cộng đồng, thống kê hệ thống |
| **Chủ nhóm (Group Owner)** | `teacher@englearn.com` | `Teacher@123` | Tạo nhóm học, biên soạn bộ từ, giao bài đọc, xem tiến độ |
| **Học viên (Learner)** | `learner@englearn.com` | `Learner@123` | Làm bài đánh giá, học từ vựng, flashcard, ôn tập SRS, đọc hiểu |

*(Bạn cũng có thể tự đăng ký tài khoản mới trực tiếp trên giao diện)*

---

## 📖 Các Tính Năng Chính

- ✅ **Đánh giá đầu vào**: Xác định trình độ (Beginner, Elementary, Pre-Intermediate) và đề xuất lộ trình phù hợp.
- ✅ **Học từ vựng theo chủ đề**: 7 chủ đề quen thuộc (210+ từ vựng phong phú), lật thẻ Flashcard 3D, nghe phát âm tự động.
- ✅ **Bài tập củng cố**: Trắc nghiệm 4 lựa chọn, đảo nghĩa từ, điền từ vào ngữ cảnh câu ví dụ.
- ✅ **Ôn tập ngắt quãng (SM-2)**: Thuật toán Spaced Repetition tính toán ngày ôn tập tối ưu để chống quên kiến thức.
- ✅ **Luyện đọc hiểu**: 21 bài đọc kèm câu hỏi trắc nghiệm, hiển thị bản dịch đối chiếu và giải thích đáp án chi tiết.
- ✅ **Nhóm học tập**: Tạo nhóm học bằng mã mời, giáo viên/chủ nhóm chia sẻ bộ từ và bài đọc, theo dõi tỷ lệ hoàn thành của học viên.
- ✅ **Cộng đồng đóng góp**: Học viên chia sẻ bài học hay, gửi kiểm duyệt tới ban quản trị.
- ✅ **Bảng quản trị hệ thống**: Quản lý thành viên, khóa/mở khóa tài khoản, duyệt nội dung và xem biểu đồ số liệu.
