# Sửa lỗi trên nền commit 714ea28

Giữ các ảnh JPG, tab quản trị từ vựng và thay đổi giao diện ngày 16–17/11.

- Đăng ký công khai chỉ tạo learner.
- Server lưu đề và đáp án trong exercise_attempts; client gửi mã lượt và lựa chọn. Lượt hết hạn sau 24 giờ. Nộp lặp trả kết quả đã lưu, không cộng tiến độ lần nữa.
- Tiến độ, lịch ôn, review_events và kết quả bài tập ghi trong transaction; khóa user trước khi cập nhật.
- Bản nháp gắn user/topic/mã lượt, khôi phục cả câu đang làm. Lỗi mạng giữ bản lưu để thử lại; lượt hết hạn tạo đề mới và bỏ đáp án cũ.
- Refresh token có timeout, một refresh cho request đồng thời, giữ mã lỗi HTTP.
- Giữ tab quản trị từ vựng và thêm phân trang user. Không tự khóa/hạ quyền, không làm mất admin hoạt động cuối cùng.
- Từ riêng có topic hợp lệ và quyền riêng tư; lưu sổ/tiến độ có rollback.
- review_events đếm từng lần ôn; không suy diễn lịch sử cũ trước khi có bảng này.
- Nginx/Vite proxy đường dẫn /uploads/.
- Docker dùng Nginx Debian và MySQL 8.0 Debian đã chọn khi sửa lỗi khởi động.
- Bootstrap chỉ tạo bảng còn thiếu, không alter/reset; demo mặc định tắt và không chạy trong production.
- Seed không DROP/DELETE. Giữ quyền/trạng thái tài khoản; database cấp ID để tránh trùng. Chỉ cập nhật nội dung/ảnh từ hệ thống đúng chủ đề, giữ từ riêng.
- Test MySQL chỉ chạy khi bật rõ ràng và dùng database tạm.

## API bài tập

GET /api/exercises/vocab/:topicId?count=10 yêu cầu Bearer token; count là số nguyên 1–50. data trả về:

```json
{
  "attempt_id": "uuid",
  "expires_at": "ISO timestamp",
  "exercises": [{ "id": 1, "options": ["A", "B", "C", "D"] }]
}
```

Khôi phục bằng cùng GET kèm attemptId=<uuid>, chỉ chủ sở hữu được đọc.

POST /api/exercises/vocab/submit:

```json
{
  "attempt_id": "uuid",
  "results": [{ "id": 1, "selected_option": 0 }]
}
```

Gửi đủ câu, dùng null cho câu bỏ qua. Server bỏ qua điểm/đáp án chuẩn do client tự khai.

## Áp dụng

```powershell
docker compose up -d --build
# Khi cần dữ liệu và tài khoản demo trong development:
docker compose exec server node src/seeders/index.js
```

Giữ volume database. Bootstrap tạo exercise_attempts/review_events và các bảng còn thiếu; cần quyền CREATE TABLE.

Xem README.md cùng thư mục để biết kết quả và giới hạn kiểm thử. Chưa push thay đổi.
