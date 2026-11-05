# CHƯƠNG 3: CÀI ĐẶT THỰC NGHIỆM VÀ KIỂM THỬ HỆ THỐNG

---

## 3.1. MÔI TRƯỜNG CÀI ĐẶT VÀ CẤU HÌNH HỆ THỐNG

### 3.1.1. Môi trường phần cứng và phần mềm triển khai thực nghiệm

Hệ thống **EngLearn** được xây dựng, cấu hình và tiến hành kiểm thử thực nghiệm trên môi trường máy chủ cục bộ và máy khách với các thông số kỹ thuật tiêu chuẩn.

##### Bảng 3.1: Môi trường phần cứng và phần mềm triển khai thực nghiệm

| Thành phần | Thông số máy chủ phát triển (Server) | Yêu cầu máy trạm học viên (Client) |
| :--- | :--- | :--- |
| **Hệ điều hành** | Windows 11 Pro 64-bit / Linux Ubuntu 22.04 LTS | Windows 10/11, macOS, iOS, Android |
| **Bộ vi xử lý (CPU)** | Intel Core i5 / AMD Ryzen 5 thế hệ mới (>= 4 Cores) | Đa nhân tiêu chuẩn |
| **Bộ nhớ trong (RAM)** | 16 GB DDR4/DDR5 | Tối thiểu 4 GB RAM |
| **Lưu trữ** | 256 GB SSD NVMe M.2 | Tối thiểu 500 MB dung lượng trống |
| **Môi trường thực thi** | Node.js v20.x LTS, npm v10.x | Trình duyệt Web hiện đại (V8/Webkit engine) |
| **Cơ sở dữ liệu** | MySQL Server 8.0.36 (InnoDB Storage Engine) | Không yêu cầu |
| **Trình duyệt kiểm thử**| Google Chrome (v120+), MS Edge, Mozilla Firefox| Google Chrome, Safari, Edge, Firefox |
| **Công cụ phát triển** | VS Code, Visual Paradigm 17.x, DBeaver, Postman | Không yêu cầu |

---

### 3.1.2. Cấu trúc tổ chức thư mục dự án

Mã nguồn dự án được tổ chức tách biệt thành hai phân hệ độc lập `client` và `server`, tuân thủ các quy chuẩn công nghiệp về kiến trúc phần mềm:

```
englearn/
├── client/                     # Phân hệ Frontend (React 19 + Tailwind CSS v4)
│   ├── public/
│   │   └── images/art/         # Thư viện ảnh minh họa vector SVG độc bản
│   ├── src/
│   │   ├── components/         # Các thành phần UI dùng chung (Navbar, Footer, Modal, Button)
│   │   ├── pages/              # Các trang giao diện chính
│   │   │   ├── auth/           # LoginPage, RegisterPage
│   │   │   ├── assessment/     # PlacementTestPage, AssessmentResultPage
│   │   │   ├── vocab/          # TopicsPage, TopicDetailPage, FlashcardPage, SrsReviewPage
│   │   │   ├── reading/        # ReadingListPage, ReadingDetailPage, ReadingQuizPage
│   │   │   ├── group/          # GroupListPage, GroupDetailPage, GroupVocabSetPage
│   │   │   ├── dashboard/      # UserDashboardPage
│   │   │   └── admin/          # AdminUsersPage, AdminVocabPage, AdminReadingPage
│   │   ├── services/           # Axios API services (authApi, vocabApi, srsApi, readingApi)
│   │   ├── store/              # Zustand global state (authStore, vocabStore)
│   │   ├── App.jsx             # React Router DOM v7 Route Configuration
│   │   └── main.jsx            # Entry point
│   ├── vite.config.js          # Cấu hình Vite 6 & Alias
│   └── package.json
│
├── server/                     # Phân hệ Backend (Node.js + Express.js 5 + Sequelize)
│   ├── src/
│   │   ├── config/             # Cấu hình kết nối MySQL và biến môi trường .env
│   │   ├── controllers/        # Điều phối HTTP Request/Response (11 Controllers)
│   │   ├── middlewares/        # Middlewares: authJwt, verifyAdmin, validator, errorHandler
│   │   ├── models/             # Định nghĩa 16 Sequelize Models và ánh xạ quan hệ
│   │   ├── routes/             # Định tuyến RESTful API (auth, vocab, srs, readings, groups, admin)
│   │   ├── seeders/            # Bộ dữ liệu mẫu khởi tạo chuẩn hóa (Art Data)
│   │   ├── services/           # Logic nghiệp vụ: srs.service.js, reading.service.js
│   │   ├── app.js              # Cấu hình ứng dụng Express
│   │   └── server.js           # Khởi động HTTP Server (Port 5000)
│   ├── tests/                  # Bộ ca kiểm thử tự động (api.test.js - Jest & Supertest)
│   └── package.json
│
├── docs/                       # Tài liệu thiết kế ERD, UML Visual Paradigm và Báo cáo tốt nghiệp
└── tools/                      # Bộ công cụ tự động hóa phát triển, đồ họa SVG và kiểm định
```

---

### 3.1.3. Cài đặt cơ sở dữ liệu và bộ dữ liệu mẫu chuyên ngành Mỹ thuật

Hệ thống được nạp bộ dữ liệu mẫu học thuật chuẩn hóa (*Seeders*) thông qua quy trình di chuyển dữ liệu tự động (`npm run seed`):
* **60 Từ vựng chuyên ngành cốt lõi:** Phân chia theo 2 chủ đề lớn:
  1. *Fine Arts Fundamentals* (Mỹ thuật cơ bản): perspective, composition, chiaroscuro, medium, canvas, pigment, texture, fresco, palette, impasto...
  2. *Vietnamese Traditional Handicrafts* (Thủ công mỹ nghệ truyền thống): lacquerware, terracotta, crackle glaze, mother-of-pearl inlay, brocade, wood carving, handloom, ceramic kiln...
* **Bộ minh họa vector SVG độc bản:** Mỗi từ vựng được liên kết với một tệp đồ họa vector SVG chất lượng cao (độ phân giải vô hạn, dung lượng siêu nhẹ ~2KB), thể hiện chính xác trực quan bản chất nghệ thuật của thuật ngữ.
* **6 Bài đọc chuyên luận song ngữ:** Các bài đọc chuyên sâu về lịch sử hội họa Ấn tượng (*Impressionism*), kỹ nghệ gốm Bát Tràng thế kỷ 14, tranh khắc gỗ dân gian Đông Hồ, kỹ thuật sơn mài truyền thống... kèm 24 câu hỏi trắc nghiệm kiểm tra khả năng đọc hiểu.
* **30 Câu hỏi Placement Test:** Ngân hàng đề thi phân cấp độ từ A1 đến C1 giúp phân loại học viên chính xác ngay khi khởi tạo tài khoản.

---

## 3.2. CÀI ĐẶT CÁC MÔ-ĐUN CHỨC NĂNG CỐT LÕI

### 3.2.1. Cài đặt thuật toán lặp lại ngắt quãng SM-2 phía máy chủ

Thuật toán SM-2 được hiện thực hóa trong lớp dịch vụ `SrsService` tại tệp [srs.service.js](file:///e:/doan/server/src/services/srs.service.js) với cơ chế bảo đảm an toàn dữ liệu bằng giao dịch cơ sở dữ liệu (*Sequelize Transaction*):

```javascript
/**
 * Trích đoạn mã nguồn lõi: Tính toán các tham số thuật toán SM-2
 * Vị trí: server/src/services/srs.service.js
 */
static calculateSM2(currentParams, quality) {
  let { ease_factor = 2.5, interval_days = 0, repetition_count = 0 } = currentParams;

  // Chuẩn hóa điểm đánh giá trong miền [0, 5]
  quality = Math.max(0, Math.min(5, Math.round(quality)));

  // Nếu trả lời đạt (quality >= 3)
  if (quality >= 3) {
    if (repetition_count === 0) {
      interval_days = 1;
    } else if (repetition_count === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.min(Math.round(interval_days * ease_factor), 365);
    }
    repetition_count += 1;
  } else {
    // Trả lời sai (quality < 3): Reset chuỗi lặp và đưa về ôn lại vào ngày hôm sau
    repetition_count = 0;
    interval_days = 1;
  }

  // Cập nhật hệ số độ dễ EF theo công thức hồi quy Woźniak
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) {
    ease_factor = 1.3; // Điều kiện biên chặn dưới
  }

  const next_review_at = new Date(Date.now() + interval_days * 24 * 60 * 60 * 1000);

  // Xác định trạng thái thành thạo (Mastery Status)
  let status = 'learning';
  if (repetition_count >= 4 && interval_days >= 15) {
    status = 'mastered';
  }

  return {
    ease_factor: parseFloat(ease_factor.toFixed(2)),
    interval_days,
    repetition_count,
    next_review_at,
    status
  };
}
```

Để đảm bảo tính nhất quán giữa tiến độ học và lịch trình trong tương lai, thao tác ghi nhận được bọc trọn vẹn trong một giao dịch:

```javascript
// Thực thi giao dịch an toàn lưu vết kết quả và lên lịch hẹn mới
await sequelize.transaction(async (t) => {
  await progress.save({ transaction: t });

  // Xóa lịch cũ chưa hoàn thành của từ này
  await ReviewSchedule.destroy({
    where: { user_id: userId, vocabulary_id: vocabularyId },
    transaction: t
  });

  // Tạo lịch hẹn ôn tập cho chu kỳ tiếp theo
  await ReviewSchedule.create({
    user_id: userId,
    vocabulary_id: vocabularyId,
    scheduled_at: sm2Result.next_review_at,
    is_completed: false,
    source,
    group_vocab_set_id: groupVocabSetId
  }, { transaction: t });
});
```

---

### 3.2.2. Cài đặt giao diện tương tác Flashcard 3D và phát âm bản ngữ

Phía máy khách React 19, thẻ Flashcard được thiết kế với hiệu ứng xoay lật 3 chiều CSS 3D Transforms (`perspective: 1000px`, `transform-style: preserve-3d`), mang lại cảm giác chân thực như lật thẻ giấy thực tế:
* **Mặt trước:** Hiển thị thuật ngữ tiếng Anh in đậm, phiên âm quốc tế IPA dạng hộp thẻ và nút loa phát âm tích hợp công nghệ tổng hợp giọng nói `window.speechSynthesis` (Web Speech API) với tùy chọn giọng phát thanh viên chuẩn Anh - Mỹ (*en-US*).
* **Mặt sau:** Minh họa bằng hình ảnh vector SVG rõ nét, giải nghĩa tiếng Việt, phân loại từ loại (Noun, Verb, Adjective), câu ví dụ ngữ cảnh có bôi đậm từ khóa và thanh lựa chọn 6 nút bấm đánh giá phản hồi chất lượng nhớ $q \in \{0, 1, 2, 3, 4, 5\}$.

---

## 3.3. KẾT QUẢ HIỆN THỰC GIAO DIỆN HỆ THỐNG

Giao diện của hệ thống **EngLearn** được hoàn thiện đồng bộ theo ngôn ngữ thiết kế Học viện Viện hàn lâm (*Academic Scholar Theme*), ưu tiên sự thanh lịch, tập trung và trực quan:

### 3.3.1. Phân hệ Xác thực & Đánh giá năng lực đầu vào

* **Hình 3.1: Giao diện Đăng nhập và Đăng ký tài khoản:** Thiết kế hộp thoại trung tâm với biểu tượng nhận diện thương hiệu EngLearn, các trường nhập liệu có thông báo xác thực lỗi thời gian thực, hỗ trợ ghi nhớ phiên làm việc và bảo mật mật khẩu.
* **Hình 3.2: Giao diện bài kiểm tra năng lực đầu vào (Placement Test):** Màn hình hiển thị 30 câu hỏi trắc nghiệm mỹ thuật, thanh tiến độ hoàn thành trực quan (Progress bar), đồng hồ đếm thời gian và bảng tổng kết xếp hạng trình độ đạt được kèm lời khuyên lộ trình học.

---

### 3.3.2. Phân hệ Học & Ôn tập từ vựng SM-2

* **Hình 3.3: Giao diện học từ vựng Flashcard kết hợp hình ảnh vector SVG và âm thanh:** Thẻ từ vựng hiển thị nổi bật với ảnh minh họa vector sắc nét (như bức tranh sơn dầu, bàn xoay gốm sứ, ngọn bút lông), nút phát âm phản hồi nhanh và câu ví dụ học thuật chuẩn mực.
* **Hình 3.4: Giao diện đánh giá phản hồi theo các cấp độ thuật toán SM-2:** Thanh điều khiển gồm 6 mức phản hồi với màu sắc và chú thích nhận thức rõ ràng:
  * Nút đỏ (0 - Blackout): Quên hoàn toàn.
  * Nút cam (1 - Incorrect / 2 - Familiar): Nhớ mang máng nhưng sai.
  * Nút vàng (3 - Hard): Nhớ đúng sau nỗ lực suy nghĩ.
  * Nút xanh lá (4 - Good): Nhớ đúng tự tin.
  * Nút tím (5 - Easy): Phản xạ tức thì hoàn hảo.

---

### 3.3.3. Phân hệ Luyện kỹ năng Đọc hiểu chuyên ngành

* **Hình 3.5: Giao diện bài đọc hiểu chuyên ngành đối chiếu song ngữ:** Thiết kế hai cột (hoặc chuyển đổi tab đoạn văn) cho phép người học đọc đoạn văn tiếng Anh chuyên ngành và đối chiếu ngay lập tức với bản dịch nghĩa tiếng Việt học thuật; tích hợp bộ câu hỏi trắc nghiệm ngữ cảnh bên dưới có chấm điểm và hiển thị lời giải cặn kẽ.

---

### 3.3.4. Phân hệ Không gian nhóm học tập cộng tác

* **Hình 3.6: Giao diện Không gian nhóm học tập và chia sẻ bộ từ vựng:** Danh sách nhóm học, thẻ hiển thị mã mời (Invite Code) có nút sao chép nhanh một chạm, danh sách thành viên nhóm và khu vực biên soạn bộ từ vựng chuyên đề dùng chung cho toàn nhóm.

---

### 3.3.5. Phân hệ Bảng điều khiển cá nhân & Quản trị CMS

* **Hình 3.7: Giao diện Bảng điều khiển học tập cá nhân (Dashboard & Chuỗi Streak):** Biểu tượng ngọn lửa hiển thị số ngày học liên tục (*Streak*), biểu đồ tròn phân bố tỷ lệ từ vựng (Từ mới, Đang học, Đã thành thạo), tỷ lệ chính xác tổng thể và thông báo nhắc nhở các từ vựng cần ôn tập trong ngày.

---

## 3.4. KIỂM THỬ HỆ THỐNG VÀ ĐÁNH GIÁ KẾT QUẢ

### 3.4.1. Phương pháp kiểm thử tích hợp (Integration Testing)

Để kiểm chứng độ tin cậy và sự phối hợp chính xác giữa các tầng kiến trúc (Controller $\leftrightarrow$ Service $\leftrightarrow$ ORM $\leftrightarrow$ MySQL Database), tác giả đã xây dựng bộ kiểm thử tích hợp tự động toàn diện sử dụng khung kiểm thử **Jest** kết hợp thư viện mô phỏng giao thức HTTP **Supertest**.

Bộ kiểm thử được thiết lập để thực thi trên môi trường cơ sở dữ liệu thực nghiệm, bao phủ toàn bộ các kịch bản nghiệp vụ nhạy cảm:
* Kiểm tra xác thực Token JWT và các kịch bản truy cập không hợp lệ (401 Unauthorized, 403 Forbidden).
* Kiểm tra tính đúng đắn của logic chấm điểm Placement Test.
* Kiểm tra tính toàn vẹn và độ chính xác của thuật toán tính toán SM-2 và ghi nhận lịch học.
* Kiểm tra chức năng bảo vệ phân quyền Admin.

---

### 3.4.2. Danh mục các ca kiểm thử tích hợp và kết quả thực thi

##### Bảng 3.2: Danh mục các ca kiểm thử tích hợp (Integration Test Cases) và kết quả

| STT | Nhóm chức năng | Tên ca kiểm thử (Test Case) | Dữ liệu đầu vào / Endpoint | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **System Health** | Kiểm tra trạng thái máy chủ | `GET /api/health` | Mã 200, status: "success" | Mã 200, success | **PASS** |
| 2 | **Authentication** | Lấy thông tin tài khoản hợp lệ | `GET /api/auth/me` (Token hợp lệ) | Mã 200, đúng email user | Mã 200, đúng user | **PASS** |
| 3 | **Authentication** | Chặn truy cập khi thiếu Token | `GET /api/auth/me` (Không Token) | Mã 401 Unauthorized | Mã 401 Unauthorized | **PASS** |
| 4 | **Topics** | Lấy danh mục chủ đề mỹ thuật | `GET /api/topics` | Mã 200, danh sách $\ge 2$ topics | Mã 200, 2 topics | **PASS** |
| 5 | **Vocabularies** | Lấy danh sách từ kèm câu ví dụ | `GET /api/vocabularies/topic/1` | Mã 200, mảng từ có ví dụ | Mã 200, đúng dữ liệu | **PASS** |
| 6 | **Vocabularies** | Khởi tạo tiến độ học từ mới | `POST /api/vocabularies/:id/learn`| Mã 200, status $\in$ [learning, ...] | Mã 200, 'learning' | **PASS** |
| 7 | **Placement Test**| Tải ngân hàng đề thi đầu vào | `GET /api/assessment/start` | Mã 200, đúng 30 câu hỏi | Mã 200, 30 câu | **PASS** |
| 8 | **Placement Test**| Bảo mật: Ẩn đáp án đúng | `GET /api/assessment/start` | Không lộ trường `correct_option` | Trường đã bị ẩn | **PASS** |
| 9 | **Placement Test**| Chấm điểm và phân loại trình độ| `POST /api/assessment/submit` | Mã 201, trả về score & level | Mã 201, có xếp hạng | **PASS** |
| 10 | **SM-2 Review** | Cập nhật tham số SM-2 với q=4 | `POST /api/reviews/:id/answer` (q=4)| Mã 200, $I \ge 1$, $EF$ cập nhật | Mã 200, đúng chu kỳ | **PASS** |
| 11 | **SM-2 Review** | Cập nhật tham số SM-2 với q=1 | `POST /api/reviews/:id/answer` (q=1)| Mã 200, reset $rep=0, I=1$ | Mã 200, reset về 1 | **PASS** |
| 12 | **SM-2 Review** | Thống kê số lượng từ cần ôn tập | `GET /api/reviews/stats` | Mã 200, có learningCount | Mã 200, có thống kê | **PASS** |
| 13 | **Readings** | Lấy danh sách bài đọc chuyên ngành | `GET /api/readings` | Mã 200, danh sách bài đọc $> 0$ | Mã 200, 6 bài đọc | **PASS** |
| 14 | **Readings** | Lấy bài đọc gợi ý thích ứng | `GET /api/readings/recommended` | Mã 200, trả về danh sách đề xuất| Mã 200, đúng gợi ý | **PASS** |
| 15 | **Study Group** | Lấy danh sách nhóm của học viên | `GET /api/groups/my` | Mã 200, danh sách nhóm hợp lệ | Mã 200, dạng mảng | **PASS** |
| 16 | **Study Group** | Tạo nhóm và sinh mã mời 6 ký tự | `POST /api/groups` | Mã 201, trả về `invite_code` | Mã 201, mã 6 ký tự | **PASS** |
| 17 | **Study Group** | Gia nhập nhóm bằng mã mời | `POST /api/groups/join` | Mã 200, trở thành member nhóm | Mã 200, thành công | **PASS** |
| 18 | **Admin Guard** | Chặn học viên truy cập trang quản trị| `GET /api/admin/users` (Learner Token)| Mã 403 Forbidden | Mã 403 Forbidden | **PASS** |
| 19 | **Admin Guard** | Cho phép tài khoản Admin truy cập | `GET /api/admin/users` (Admin Token) | Mã 200, trả về danh sách user | Mã 200, đúng danh sách | **PASS** |
| 20 | **Admin CMS** | Cập nhật trạng thái khóa tài khoản | `PUT /api/admin/users/:id/status` | Mã 200, `is_active` đổi trạng thái| Mã 200, đổi thành công| **PASS** |
| 21 | **Admin CMS** | Thêm mới từ vựng vào hệ thống | `POST /api/admin/vocabularies` | Mã 201, từ vựng mới được lưu | Mã 201, đã tạo mới | **PASS** |

* **Hình 3.8: Kết quả chạy kiểm thử tự động 21/21 ca kiểm thử bằng Jest:** Toàn bộ 21/21 ca kiểm thử tích hợp (100%) đều vượt qua thành công (`PASS`), thời gian thực thi toàn bộ test suite đạt ~1.85 giây, chứng minh hệ thống hoạt động ổn định, chính xác và có độ tin cậy cao.

---

## 3.5. TỔNG KẾT CHƯƠNG 3

Chương 3 đã trình bày chi tiết toàn bộ tiến trình cài đặt thực nghiệm và kiểm thử hệ thống **EngLearn**:
* Thiết lập thành công môi trường máy chủ và máy khách với đầy đủ thông số kỹ thuật, cấu trúc tổ chức mã nguồn khoa học và cơ sở dữ liệu chứa 60 từ vựng mỹ thuật kèm đồ họa vector SVG, 6 bài đọc song ngữ và ngân hàng đề thi 30 câu.
* Cài đặt chính xác thuật toán cốt lõi **SuperMemo-2 (SM-2)** với khả năng tự động tính toán giãn cách ôn tập, điều chỉnh hệ số dễ $EF$ và bảo vệ bằng giao dịch CSDL an toàn.
* Hiện thực hóa giao diện người dùng mượt mà, trực quan theo phong cách Academic Scholar UI, hỗ trợ Flashcard xoay 3D, phát âm Web Speech API và phản hồi 6 thang điểm nhớ.
* Tiến hành kiểm thử tự động toàn diện với **21/21 ca kiểm thử tích hợp đạt chuẩn (PASS 100%)**, khẳng định tính đúng đắn, an toàn và sẵn sàng đưa vào ứng dụng thực tiễn của đề tài.
