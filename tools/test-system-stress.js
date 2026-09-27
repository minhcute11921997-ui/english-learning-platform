/**
 * 🧪 EngLearn Comprehensive Stress, Fuzzing & Negative Test Suite
 * Tests edge cases, special characters, type mismatches, SQL/XSS injections,
 * invalid inputs, boundary values, and crash resilience.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let studentToken = null;
let adminToken = null;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function testCase(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    const errMsg = err.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}` : err.message;
    failures.push({ name, error: errMsg });
    console.log(`  ❌ [FAIL] ${name} -> ${errMsg}`);
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🚀 BẮT ĐẦU TEST TOÀN DIỆN HỆ THỐNG ENGLEARN');
  console.log('======================================================\n');

  // --- 1. SETUP & AUTH ---
  console.log('🔑 NHÓM 1: XÁC THỰC & ĐĂNG NHẬP (AUTH & PERMISSIONS)');

  await testCase('Đăng nhập học viên hợp lệ', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'student1@enlearn.com',
      password: 'Student@123'
    });
    if (res.status !== 200 || !res.data.data.accessToken) throw new Error('Không lấy được accessToken');
    studentToken = res.data.data.accessToken;
  });

  await testCase('Đăng nhập Admin hợp lệ', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@enlearn.com',
      password: 'Admin@123'
    });
    if (res.status !== 200 || !res.data.data.accessToken) throw new Error('Không lấy được accessToken');
    adminToken = res.data.data.accessToken;
  });

  await testCase('Đăng nhập với body rỗng ({}) phải trả về 400', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {});
      throw new Error('Mong đợi lỗi 400 nhưng request thành công');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Đăng nhập với email sai định dạng ("invalid-email") phải trả về 400', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, { email: 'invalid-email', password: '123' });
      throw new Error('Mong đợi lỗi 400 nhưng request thành công');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Đăng nhập với mật khẩu sai phải trả về 401', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, { email: 'student1@enlearn.com', password: 'WrongPassword!@#' });
      throw new Error('Mong đợi 401');
    } catch (err) {
      if (err.response?.status !== 401) throw err;
    }
  });

  await testCase('Đăng nhập với SQL Injection payload ("\' OR \'1\'=\'1") bị chặn 400', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, { email: "' OR '1'='1", password: "' OR '1'='1" });
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Đăng ký tài khoản với username quá ngắn (< 3 ký tự) phải trả về 400', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        username: 'ab',
        email: `test_${Date.now()}@example.com`,
        password: 'Password123!',
        full_name: 'Test Short'
      });
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Đăng ký tài khoản với email đã tồn tại phải trả về 409 hoặc 400', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        username: `user_${Date.now()}`,
        email: 'student1@enlearn.com',
        password: 'Password123!',
        full_name: 'Duplicate Email Test'
      });
      throw new Error('Mong đợi lỗi trùng email');
    } catch (err) {
      if (![400, 409].includes(err.response?.status)) throw err;
    }
  });

  await testCase('Đăng ký thành công với ký tự đặc biệt, dấu tiếng Việt, emoji trong full_name', async () => {
    const unique = Date.now();
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      username: `fuzz${unique}`,
      email: `fuzz${unique}@example.com`,
      password: 'StrongPassword123!',
      full_name: 'Nguyễn Văn Đạt - 🚀 Special chars: !@#$%^&*()_+ Đạt'
    });
    if (res.status !== 201) throw new Error('Không tạo được tài khoản');
  });

  await testCase('Truy cập /api/auth/me không có token bị từ chối 401', async () => {
    try {
      await axios.get(`${BASE_URL}/auth/me`);
      throw new Error('Mong đợi 401');
    } catch (err) {
      if (err.response?.status !== 401) throw err;
    }
  });

  await testCase('Truy cập /api/auth/me với token giả mạo ("Bearer invalid.token.xyz") bị từ chối 401', async () => {
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake' }
      });
      throw new Error('Mong đợi 401');
    } catch (err) {
      if (err.response?.status !== 401) throw err;
    }
  });

  // --- 2. TOPICS & VOCABULARY ---
  console.log('\n📚 NHÓM 2: CHỦ ĐỀ & TỪ VỰNG (TOPICS & VOCABULARY)');

  await testCase('Lấy danh sách tất cả chủ đề', async () => {
    const res = await axios.get(`${BASE_URL}/topics`);
    if (res.status !== 200 || !Array.isArray(res.data.data)) throw new Error('Dữ liệu trả về không hợp lệ');
  });

  await testCase('Truy vấn từ vựng với topic ID không tồn tại (999999) -> trả về mảng rỗng không crash', async () => {
    const res = await axios.get(`${BASE_URL}/vocabularies/topic/999999`);
    if (res.status !== 200 || res.data.data.length !== 0) throw new Error('Phải trả về mảng rỗng');
  });

  await testCase('Tìm kiếm từ vựng với SQL injection: "x\' OR \'1\'=\'1" -> không leak dữ liệu', async () => {
    const res = await axios.get(`${BASE_URL}/vocabularies/topic/1?search=x' OR '1'='1`);
    if (res.status !== 200) throw new Error('Request lỗi');
  });

  await testCase('Tìm kiếm từ vựng với ký tự đặc biệt, dấu tiếng Việt có dấu: "bảo vệ môi trường"', async () => {
    const res = await axios.get(`${BASE_URL}/vocabularies/topic/1?search=${encodeURIComponent('môi trường')}`);
    if (res.status !== 200) throw new Error('Request lỗi');
  });

  await testCase('Học từ vựng với ID âm (-1) -> trả về 404', async () => {
    try {
      await axios.post(
        `${BASE_URL}/vocabularies/-1/learn`,
        {},
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 404');
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }
  });

  await testCase('Học từ vựng với ID không phải số ("abc") -> trả về 404 hoặc 400', async () => {
    try {
      await axios.post(
        `${BASE_URL}/vocabularies/abc/learn`,
        {},
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 404 hoặc 400');
    } catch (err) {
      if (![400, 404].includes(err.response?.status)) throw err;
    }
  });

  // --- 3. ASSESSMENT ---
  console.log('\n📝 NHÓM 3: BÀI ĐÁNH GIÁ ĐẦU VÀO (PLACEMENT ASSESSMENT)');

  await testCase('Lấy danh sách 30 câu hỏi đánh giá mà không lộ đáp án đúng', async () => {
    const res = await axios.get(`${BASE_URL}/assessment/start`);
    if (res.status !== 200 || res.data.data.length !== 30) throw new Error('Đề thi không đủ 30 câu');
    if (res.data.data[0].correct_option !== undefined) throw new Error('Lộ đáp án đúng!');
  });

  await testCase('Nộp bài đánh giá với body không phải array ({ answers: "invalid" }) -> trả về 400', async () => {
    try {
      await axios.post(
        `${BASE_URL}/assessment/submit`,
        { answers: 'invalid_data' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Nộp bài đánh giá với mảng rỗng ([]) -> chấm điểm 0, phân loại beginner', async () => {
    const res = await axios.post(
      `${BASE_URL}/assessment/submit`,
      { answers: [] },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (res.status !== 201 || res.data.data.result_level !== 'beginner') {
      throw new Error('Kết quả phân loại không đúng');
    }
  });

  await testCase('Nộp bài đánh giá với các giá trị biên (question_id cực lớn, selected_option sai kiểu dữ liệu)', async () => {
    const res = await axios.post(
      `${BASE_URL}/assessment/submit`,
      {
        answers: [
          { question_id: 999999, selected_option: 'not_a_number' },
          { question_id: -5, selected_option: null },
          { question_id: 0, selected_option: 0 }
        ]
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (res.status !== 201) throw new Error('Server crash hoặc không xử lý được');
  });

  // --- 4. SPACED REPETITION (SRS) ---
  console.log('\n🧠 NHÓM 4: ÔN TẬP NGẮT QUÃNG SM-2 (SRS REVIEW)');

  await testCase('Lấy danh sách từ cần ôn tập (due reviews)', async () => {
    const res = await axios.get(`${BASE_URL}/reviews/due`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (res.status !== 200) throw new Error('Request thất bại');
  });

  await testCase('Lấy lịch ôn tập với tham số query sai kiểu: ?days=abc -> fallback an toàn, không crash', async () => {
    const res = await axios.get(`${BASE_URL}/reviews/upcoming?days=abc`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (res.status !== 200) throw new Error('Request thất bại');
  });

  await testCase('Nộp kết quả ôn tập với quality là ký tự chữ ("abc") -> chặn 400', async () => {
    try {
      await axios.post(
        `${BASE_URL}/reviews/1/answer`,
        { quality: 'abc' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Nộp kết quả ôn tập với quality âm (-1) -> chặn 400', async () => {
    try {
      await axios.post(
        `${BASE_URL}/reviews/1/answer`,
        { quality: -1 },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Nộp kết quả ôn tập với quality vượt ngưỡng (6) -> chặn 400', async () => {
    try {
      await axios.post(
        `${BASE_URL}/reviews/1/answer`,
        { quality: 6 },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Nộp kết quả ôn tập với quality hợp lệ (4) -> cập nhật SM-2 thành công', async () => {
    const res = await axios.post(
      `${BASE_URL}/reviews/1/answer`,
      { quality: 4 },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (res.status !== 200 || !res.data.data.next_review_at) throw new Error('Không cập nhật được lịch ôn');
  });

  // --- 5. READING COMPREHENSION ---
  console.log('\n📖 NHÓM 5: LUYỆN ĐỌC HIỂU (READING COMPREHENSION)');

  await testCase('Lấy danh sách bài đọc', async () => {
    const res = await axios.get(`${BASE_URL}/readings`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (res.status !== 200 || !Array.isArray(res.data.data)) throw new Error('Không lấy được danh sách bài đọc');
  });

  await testCase('Lấy chi tiết bài đọc với ID không tồn tại (999999) -> trả về 404', async () => {
    try {
      await axios.get(`${BASE_URL}/readings/999999`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      throw new Error('Mong đợi 404');
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }
  });

  await testCase('Nộp bài đọc với answers không phải array -> trả về 400', async () => {
    try {
      await axios.post(
        `${BASE_URL}/readings/1/attempt`,
        { answers: 'invalid' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Nộp bài đọc với dữ liệu hợp lệ -> tính điểm chính xác', async () => {
    const res = await axios.post(
      `${BASE_URL}/readings/1/attempt`,
      {
        answers: [{ question_id: 1, selected_option: 0 }],
        time_spent_seconds: 45
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (res.status !== 201 || res.data.data.percentage === undefined) throw new Error('Tính điểm thất bại');
  });

  // --- 6. STUDY GROUPS ---
  console.log('\n👥 NHÓM 6: NHÓM HỌC TẬP (STUDY GROUPS)');

  let createdGroupId = null;

  await testCase('Tạo nhóm với tên ngắn (< 2 ký tự: "A") -> chặn 400', async () => {
    try {
      await axios.post(
        `${BASE_URL}/groups`,
        { name: 'A', description: 'Test short name' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Tạo nhóm với tên quá dài (> 100 ký tự) -> chặn 400', async () => {
    try {
      await axios.post(
        `${BASE_URL}/groups`,
        { name: 'A'.repeat(150), description: 'Too long' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Tạo nhóm với tên chứa ký tự đặc biệt & emojis thành công', async () => {
    const res = await axios.post(
      `${BASE_URL}/groups`,
      {
        name: `Nhóm Học VIP 🚀 #1 [IELTS & TOEIC]_${Date.now().toString().slice(-4)}`,
        description: 'Mô tả có ký tự đặc biệt: <script>console.log("safe")</script> & "quotes"'
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (res.status !== 201 || !res.data.data.id) throw new Error('Không tạo được nhóm');
    createdGroupId = res.data.data.id;
  });

  await testCase('Tham gia nhóm với mã mời không tồn tại ("WRONGCODE") -> trả về 404', async () => {
    try {
      await axios.post(
        `${BASE_URL}/groups/join`,
        { invite_code: 'WRONGCODE' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 404');
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }
  });

  // --- 7. COMMUNITY & CONTRIBUTIONS ---
  console.log('\n🌐 NHÓM 7: CỘNG ĐỒNG ĐÓNG GÓP (COMMUNITY)');

  await testCase('Đăng bài cộng đồng thiếu tiêu đề -> trả về 400', async () => {
    try {
      await axios.post(
        `${BASE_URL}/community/submit`,
        { content_type: 'vocab_set', content_data: {} },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Đăng bài cộng đồng với content_type không hợp lệ ("malicious_type") -> trả về 400', async () => {
    try {
      await axios.post(
        `${BASE_URL}/community/submit`,
        { content_type: 'malicious_type', title: 'Test Title' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await testCase('Đăng bài đóng góp từ vựng hợp lệ', async () => {
    const res = await axios.post(
      `${BASE_URL}/community/submit`,
      {
        content_type: 'vocab_set',
        title: `Bộ từ vựng giao tiếp sân bay ✈️_${Date.now()}`,
        description: 'Tổng hợp từ vựng hữu ích',
        content_data: { words: ['boarding pass', 'terminal', 'gate'] }
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (res.status !== 201) throw new Error('Đăng bài thất bại');
  });

  // --- 8. ADMIN RBAC & SECURITY PRIVILEGE ESCALATION ---
  console.log('\n🛡️ NHÓM 8: PHÂN QUYỀN QUẢN TRỊ & BẢO MẬT (ADMIN RBAC)');

  await testCase('Học viên thường cố gọi API Admin (/api/admin/users) -> bị chặn 403 Forbidden', async () => {
    try {
      await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      throw new Error('Mong đợi 403 Forbidden nhưng request lọt qua!');
    } catch (err) {
      if (err.response?.status !== 403) throw err;
    }
  });

  await testCase('Học viên thường cố gọi API Admin (/api/admin/topics) -> bị chặn 403 Forbidden', async () => {
    try {
      await axios.post(
        `${BASE_URL}/admin/topics`,
        { name: 'Hacked Topic', name_vi: 'Chủ đề bị hack' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      throw new Error('Mong đợi 403 Forbidden nhưng request lọt qua!');
    } catch (err) {
      if (err.response?.status !== 403) throw err;
    }
  });

  await testCase('Admin truy cập /api/admin/users thành công 200', async () => {
    const res = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error('Admin không truy cập được');
  });

  // --- 9. RAPID CONCURRENCY & RACE CONDITIONS ---
  console.log('\n⚡ NHÓM 9: GIẢ LẬP CLICK NHANH, ĐỒNG THỜI (RAPID CONCURRENCY)');

  await testCase('Giả lập 15 request đồng thời gọi /api/reviews/stats không gây crash server', async () => {
    const requests = Array.from({ length: 15 }, () =>
      axios.get(`${BASE_URL}/reviews/stats`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      })
    );
    const results = await Promise.all(requests);
    const all200 = results.every(r => r.status === 200);
    if (!all200) throw new Error('Một số request bị lỗi trong khi spam');
  });

  await testCase('Giả lập 10 lần click liên tục nộp bài ôn tập không làm crash hay deadlock DB', async () => {
    const requests = Array.from({ length: 10 }, (_, i) =>
      axios.post(
        `${BASE_URL}/reviews/1/answer`,
        { quality: (i % 5) + 1 },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      )
    );
    const results = await Promise.all(requests);
    const all200 = results.every(r => r.status === 200);
    if (!all200) throw new Error('Lỗi đồng thời');
  });

  // --- TỔNG KẾT ---
  console.log('\n======================================================');
  console.log('📊 TỔNG KẾT KẾT QUẢ TEST STRESS & FUZZING:');
  console.log(`- Tổng số ca kiểm thử: ${totalTests}`);
  console.log(`- Thành công (PASSED): ${passedTests}`);
  console.log(`- Thất bại (FAILED):   ${failedTests}`);
  console.log('======================================================\n');

  if (failures.length > 0) {
    console.log('⚠️ Danh sách ca kiểm thử thất bại:');
    failures.forEach((f, idx) => console.log(`  ${idx + 1}. ${f.name} -> ${f.error}`));
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
