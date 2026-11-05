# KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

---

## 1. KẾT QUẢ ĐẠT ĐƯỢC CỦA ĐỒ ÁN

Sau quá trình nghiên cứu lý thuyết, phân tích thiết kế hệ thống và tiến hành lập trình thực nghiệm, đồ án tốt nghiệp với đề tài **"Xây dựng hệ thống hỗ trợ học tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ EngLearn áp dụng thuật toán SM-2"** đã hoàn thành đầy đủ các mục tiêu đề ra ban đầu với các kết quả cụ thể như sau:

### 1.1. Về mặt lý thuyết và phương pháp luận
* Đã nghiên cứu có hệ thống cơ sở khoa học nhận thức về trí nhớ con người, bản chất của **Đường cong quên lãng Hermann Ebbinghaus** và nguyên lý của **Hệ thống lặp lại ngắt quãng (Spaced Repetition System - SRS)**.
* Đã phân tích chi tiết mô hình toán học của thuật toán **SuperMemo-2 (SM-2)** do Piotr Woźniak sáng lập, bao gồm các công thức cập nhật khoảng cách chu kỳ ôn tập $I(n)$, hệ số độ dễ $EF$ và cơ chế chuẩn hóa thang điểm chất lượng nhớ $q \in [0, 5]$.
* Đã ứng dụng phương pháp phân tích và thiết kế hướng đối tượng (OOAD) sử dụng phần mềm chuẩn công nghiệp **Visual Paradigm** để xây dựng bộ biểu đồ UML tiêu chuẩn (Use Case Diagrams tổng quát và phân rã, Sequence Diagrams, Activity Diagrams) và sơ đồ thực thể liên kết (ERD 16 bảng ở dạng chuẩn 3NF).

### 1.2. Về mặt kỹ thuật và ứng dụng thực tiễn
* **Xây dựng hoàn chỉnh kiến trúc Full-stack hiện đại:** Phát triển thành công hệ thống ứng dụng web **EngLearn** với sự phân tách độc lập và tối ưu giữa Frontend (React 19, Tailwind CSS v4, Zustand, Vite 6, React Router DOM v7) và Backend (Node.js LTS, Express.js 5, Sequelize ORM, MySQL 8.0).
* **Cài đặt chuẩn xác thuật toán cốt lõi SM-2:** Triển khai dịch vụ `SrsService` phía máy chủ, đảm bảo tính toàn vẹn dữ liệu thông qua cơ chế giao dịch cơ sở dữ liệu (**Sequelize Transactions**), loại bỏ triệt để nguy cơ sai lệch giữa dữ liệu tiến độ và lịch trình hẹn ôn tập.
* **Chuẩn hóa kho ngữ liệu chuyên ngành Mỹ thuật độc bản:**
  * Xây dựng bộ cơ sở dữ liệu gồm 60 thuật ngữ mỹ thuật và thủ công mỹ nghệ cốt lõi phân theo 2 chủ đề lớn (*Fine Arts Fundamentals* và *Vietnamese Traditional Handicrafts*), tích hợp phiên âm IPA, từ loại, định nghĩa song ngữ và câu ví dụ học thuật.
  * Tích hợp bộ minh họa bằng **đồ họa vector SVG độc bản**, đảm bảo tính trực quan sắc nét và dung lượng tải cực nhẹ.
  * Xây dựng 6 bài đọc chuyên luận song ngữ chuyên sâu kèm 24 câu hỏi trắc nghiệm ngữ cảnh và hệ thống đề xuất bài đọc thông minh dựa trên năng lực.
  * Xây dựng ngân hàng 30 câu hỏi **Placement Test** đa cấp độ giúp phân loại học viên chính xác ngay từ đầu.
* **Xây dựng môi trường học nhóm cộng tác:** Tính năng tạo nhóm, tự động sinh mã mời ngẫu nhiên, cho phép trưởng nhóm biên soạn bộ từ vựng dùng chung và theo dõi tiến độ hoàn thành của từng thành viên.
* **Đảm bảo chất lượng qua kiểm thử tự động toàn diện:** Thiết kế bộ ca kiểm thử tích hợp (Integration Tests) với Jest và Supertest; đạt tỷ lệ **21/21 ca kiểm thử thành công (PASS 100%)**, khẳng định tính chính xác của các luồng nghiệp vụ và khả năng bảo vệ phân quyền chặt chẽ.

---

## 2. HẠN CHẾ CỦA HỆ THỐNG

Bên cạnh những kết quả tích cực đã đạt được, do giới hạn về mặt thời gian và nguồn lực nghiên cứu, hệ thống vẫn tồn tại một số điểm hạn chế nhất định:
1. **Quy mô ngữ liệu còn giới hạn:** Bộ dữ liệu mẫu hiện tại tập trung chủ yếu vào Hội họa và Thủ công mỹ nghệ truyền thống. Các phân ngành mỹ thuật ứng dụng rộng lớn khác như Thiết kế thời trang (Fashion Design), Thiết kế đồ họa số (Digital Art), Kiến trúc (Architecture) và Hoạt hình 3D (3D Animation) chưa được bao phủ toàn diện.
2. **Khả năng đánh giá kỹ năng phát âm:** Chức năng phát âm hiện tại mới dừng ở chiều tiếp nhận (Text-to-Speech qua Web Speech API); hệ thống chưa có khả năng thu âm và phân tích âm vị học tự động (Speech-to-Text & Pronunciation Scoring) để chỉ ra lỗi sai phát âm của người học.
3. **Nền tảng triển khai:** Ứng dụng hiện tại vận hành trên nền tảng Web; chưa có ứng dụng di động bản địa (Native Mobile App) để tận dụng các tiện ích thông báo đẩy (Push Notifications) thời gian thực trên điện thoại thông minh khi đến giờ ôn tập.

---

## 3. HƯỚNG PHÁT TRIỂN TRONG TƯƠNG LAI

Nhằm tiếp tục hoàn thiện và nâng cao giá trị ứng dụng của hệ thống **EngLearn**, tác giả định hướng các mục tiêu phát triển tiếp theo:

1. **Ứng dụng Trí tuệ Nhân tạo tạo sinh (Generative AI / Large Language Models):**
   * Tích hợp API mô hình ngôn ngữ lớn (như OpenAI GPT hoặc Google Gemini) để tự động sinh câu hỏi kiểm tra đọc hiểu ngữ cảnh theo thời gian thực dựa trên bất kỳ văn bản nghệ thuật nào mà học viên tải lên.
   * Xây dựng trợ lý ảo hỗ trợ giải thích các thuật ngữ nghệ thuật cổ và gợi ý viết bài luận phân tích tác phẩm nghệ thuật bằng tiếng Anh.
2. **Phát triển mô-đun AI nhận diện và chấm điểm phát âm (AI Speech Assessment):**
   * Tích hợp công nghệ nhận diện giọng nói (như Whisper / Vosk) kết hợp thuật toán đối chiếu âm vị học (Phoneme Alignment) để chấm điểm độ chuẩn xác của phát âm, chỉ ra trọng âm và ngữ điệu chưa chuẩn cho học viên.
3. **Phát triển ứng dụng di động đa nền tảng (React Native / Flutter):**
   * Đóng gói ứng dụng di động dành cho hệ điều hành Android và iOS.
   * Kích hoạt hệ thống thông báo đẩy (Local / Remote Push Notifications) để nhắc nhở học viên khi có từ vựng đến hạn ôn tập SM-2 trong ngày, giúp duy trì chuỗi ngày học (*Streak*) đều đặn hơn.
4. **Mở rộng kho học liệu liên kết với các Bảo tàng và Làng nghề truyền thống:**
   * Hợp tác thu thập ngữ liệu thực tế từ Bảo tàng Mỹ thuật Việt Nam, các nghệ nhân làng gốm Bát Tràng, tranh Đông Hồ, lụa Vạn Phúc để xây dựng các chuyến tham quan ảo (Virtual Tours) kết hợp học tiếng Anh chuyên ngành tương tác.
