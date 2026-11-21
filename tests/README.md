# Kiểm thử trên commit 714ea28

Nền mã nguồn: 714ea2872bfa91b18ee3f009c86adc6474cfa6b6 (17/11/2026), giữ 60 ảnh JPG và giao diện mới.

## Kiểm tra nhanh

Tại thư mục gốc chạy:

```powershell
npm test
```

48 ca gồm: 27 ca hồi quy backend/cấu hình, 13 ca SM-2 từ bộ unit test mới, 8 ca về vòng đời bài tập và refresh token.

- regression.test.cjs: phân quyền đăng ký, đề do server lưu, chống nộp lặp, rollback, từ riêng, lịch sử ôn, admin, seed và cấu hình.
- frontend.test.cjs: logic thật của trang bài tập/interceptor chạy với hooks, storage và API giả lập; kiểm tra khôi phục vị trí, hết hạn, lỗi mạng, tách tài khoản, phản hồi muộn, storage lỗi và refresh đồng thời.
- sm2.test.cjs: chạy 13 ca thuật toán tại server/tests/unit/srs.service.test.js bằng Node test runner.

Controller/service dùng model giả lập; kết quả không chứng minh khóa InnoDB, HTTP/MySQL thật hoặc DOM trình duyệt.

## Bằng chứng

- results/latest-before.txt: mã nguồn nguyên bản của commit mới nhất, 16/37 ca đạt, 21 ca thất bại.
- results/latest-after.txt: sau sửa và thêm ca kiểm tra, 48/48 ca đạt.
- 11 ca thêm sau baseline gồm 3 ca seed/admin/list và 8 ca frontend; không dùng tổng sau sửa để mô tả tổng baseline.

## Build, lint và Jest

```powershell
cd client
npm run lint
npm run build
cd ../server
npm test
```

Jest mặc định: 13 unit test đạt, 33 integration test bỏ qua khi chưa bật MySQL. Các ca SM-2 của Jest và Node là cùng một bộ, không cộng thành hai bộ độc lập.

## HTTP/MySQL thật

Thiết lập DB_HOST, DB_PORT, DB_USER, DB_PASSWORD trỏ tới MySQL. Tài khoản cần quyền CREATE/DROP DATABASE.

```powershell
$env:RUN_MYSQL_TESTS = '1'
npm run test:mysql
# Hoặc ma trận API Jest:
cd server
npm test
Remove-Item Env:RUN_MYSQL_TESTS
```

Mỗi bộ tạo database tạm có tên riêng và chỉ xóa đúng database đó trong finally/afterAll. Không reset database đang học.

Môi trường sửa mã nguồn bị từ chối truy cập Docker Engine/socket MySQL (EACCES), nên chưa chạy HTTP/MySQL và E2E trình duyệt thật.

## Kiểm tra thủ công

- Làm bài, chuyển câu rồi reload: giữ lượt, lựa chọn và vị trí câu.
- Đổi tài khoản: không dùng bản nháp cũ.
- Hai tab nộp cùng lượt: tiến độ chỉ ghi một lần.
- Quản trị user: phân trang, tìm kiếm từ trang 2; tab quản lý từ vựng mới vẫn còn.
- Seed trên dữ liệu đã có: giữ tài khoản/từ riêng, cập nhật ảnh JPG cho từ hệ thống.
- Upload JPG/PNG qua cả Vite và Nginx.
