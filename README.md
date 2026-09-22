# 📚 EngLearn - Hệ Thống Học Tiếng Anh Cơ Bản

Ứng dụng web học tiếng Anh cơ bản dành cho học sinh và người mới bắt đầu.

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 4 + Zustand
- **Backend:** Express.js 5 + Sequelize + MySQL
- **Auth:** JWT (Access + Refresh tokens)

## 📁 Cấu trúc dự án

```
├── client/          # Frontend React + Vite
├── server/          # Backend Express.js + Sequelize
└── tools/           # Dev tools, scripts
```

## 🚀 Bắt đầu

### Yêu cầu
- Node.js >= 18
- MySQL >= 8.0

### Cài đặt

```bash
# Backend
cd server
cp .env.example .env   # Chỉnh sửa thông tin DB
npm install
npm run dev

# Frontend (terminal khác)
cd client
npm install
npm run dev
```

### Truy cập
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/api/health

## 📖 Tính năng

- ✅ Đăng ký, đăng nhập, đánh giá đầu vào
- ✅ Học từ vựng theo chủ đề (flashcard, bài tập)
- ✅ Ôn tập ngắt quãng (thuật toán SM-2)
- ✅ Luyện đọc hiểu + câu hỏi trắc nghiệm
- ✅ Nhóm học tập (tạo/join, chia sẻ nội dung)
- ✅ Cộng đồng đóng góp nội dung
- ✅ Quản trị hệ thống
