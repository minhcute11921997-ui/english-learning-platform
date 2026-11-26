# Hướng dẫn Triển khai Production — EngLearn

Tài liệu này mô tả quy trình đưa hệ thống **EngLearn** lên máy chủ thật (VPS / Cloud VM) một cách an toàn và ổn định.

---

## 1. Yêu cầu Hạ tầng
- **Docker** `>= 24.0` và **Docker Compose** `>= 2.20`
- Tên miền đã trỏ bản ghi `A` / `AAAA` về IP của máy chủ
- Chứng chỉ TLS/SSL (Let's Encrypt hoặc Cloudflare Origin Certificate) nếu không đứng sau reverse proxy ngoài
- **Tối thiểu 2 GB RAM** (khuyến nghị **4 GB+ RAM** hoặc GPU nếu bật `ai-service`)

---

## 2. Cấu hình Biến môi trường

Sao chép file mẫu ở thư mục gốc và điền đầy đủ giá trị bí mật thực tế:

```bash
cp .env.example .env
```

Sinh khóa JWT ngẫu nhiên chuẩn Production (ít nhất 64 ký tự hex, hai khóa phải khác nhau):

```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
```

Các biến bắt buộc phải kiểm tra trong `.env`:
- `NODE_ENV=production`
- `SEED_DEMO=false`
- `MYSQL_ROOT_PASSWORD` và `DB_PASSWORD` (mật khẩu mạnh, không dùng giá trị mẫu)
- `JWT_SECRET` và `JWT_REFRESH_SECRET`
- `CLIENT_URL=https://your-domain.com`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` (để gửi email quên mật khẩu & xác minh tài khoản)

---

## 3. Khởi chạy Stack Production

Chạy với file override `docker-compose.prod.yml` để đóng cổng MySQL và cổng Node.js ra ngoài Internet (chỉ đi qua Nginx):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Nếu muốn bật thêm container AI nhận diện ảnh (`ai-service`):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile ai up -d --build
```

---

## 4. Database Migrations

Khi `server` khởi động qua `src/bootstrap.js`, các migration mới trong `server/src/migrations/` tự động chạy và được ghi vào bảng `SequelizeMeta`. Để chạy kiểm tra thủ công trong container:

```bash
docker exec englearn_server node src/bootstrap.js
```

---

## 5. Kích hoạt HTTPS / TLS

1. Đặt cặp chứng chỉ `fullchain.pem` và `privkey.pem` vào thư mục `./certs/` trên máy chủ.
2. Mở chú thích `volumes` trong `docker-compose.prod.yml` (`./certs:/etc/nginx/certs:ro`).
3. Mở chú thích khối `server { listen 443 ssl http2; ... }` trong `client/nginx.conf` (hoặc đặt Caddy/Cloudflare phía trước làm TLS termination).
4. Khởi động lại `client`: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build client`.

---

## 6. Kiểm tra Sức khỏe Hệ thống (Healthcheck)

- `GET /api/health` hoặc `GET /api/health/ready`: trả về HTTP `200` khi cả API lẫn MySQL hoạt động, và `503` nếu MySQL mất kết nối.
- Mọi HTTP response đều đính kèm header `X-Request-Id` để đối chiếu với log JSON của container `englearn_server`.

---

## 7. Sao lưu & Khôi phục Cơ sở dữ liệu

Thiết lập cronjob sao lưu hằng ngày lúc 02:00 sáng:

```bash
chmod +x tools/ops/backup-db.sh
# Crontab:
0 2 * * * cd /path/to/englearn && ./tools/ops/backup-db.sh >> /var/log/englearn-backup.log 2>&1
```

Trên Windows PowerShell:

```powershell
.\tools\ops\backup-db.ps1
```

Để khôi phục từ file `.sql.gz`:

```bash
gunzip < backups/mysql/english_learning_YYYYMMDD_HHMMSS.sql.gz | docker exec -i englearn_mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD"
```
