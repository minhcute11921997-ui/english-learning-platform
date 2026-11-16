#!/usr/bin/env node
/**
 * 🧪 EngLearn v2.0 Comprehensive API Endpoint Tester
 * Kiểm tra hợp đồng API, Input/Output, Phân quyền RBAC & Edge Cases
 *
 * Usage:
 *   node dev/api-tester.js              - Test toàn bộ 8 nhóm endpoints
 *   node dev/api-tester.js --auth       - Test nhóm Authentication
 *   node dev/api-tester.js --vocab      - Test nhóm Topics & Vocabulary
 *   node dev/api-tester.js --exercise   - Test nhóm Bài tập & Chấm điểm
 *   node dev/api-tester.js --review     - Test nhóm Ôn tập SM-2
 *   node dev/api-tester.js --list       - Test nhóm Sổ từ cá nhân
 *   node dev/api-tester.js --admin      - Test nhóm Quản trị & RBAC
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const uniqueId = Date.now().toString().slice(-6);

let learnerToken = null;
let adminToken = null;
let sampleVocabId = 211;
let sampleListId = null;

const testUser = {
  username: `apitest${uniqueId}`,
  email: `apitest${uniqueId}@example.com`,
  password: 'Password123',
  full_name: 'API Tester User'
};

async function executeRequest(test) {
  try {
    let token = null;
    if (test.auth === 'admin') token = adminToken;
    else if (test.auth === true || test.auth === 'learner') token = learnerToken;

    const headers = {
      'x-internal-test': 'englearn-test-key'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const path = typeof test.path === 'function' ? test.path() : test.path;
    const body = typeof test.body === 'function' ? test.body() : test.body;

    const start = Date.now();
    const res = await axios({
      method: test.method,
      url: `${BASE_URL}${path}`,
      data: body,
      headers,
      validateStatus: () => true // Bắt tất cả status code không throw
    });
    const duration = Date.now() - start;

    if (test.onSuccess) {
      test.onSuccess(res.data);
    }

    const passed = res.status === test.expect;
    const icon = passed ? '✅' : '❌';
    const statusNote = passed ? `${res.status}` : `${res.status} (Kỳ vọng: ${test.expect})`;
    const desc = test.desc || `${test.method} ${path}`;

    console.log(`  ${icon} [${statusNote}] ${desc} (${duration}ms)`);
    if (!passed && res.data?.message) {
      console.log(`     ↳ Phản hồi: "${res.data.message}"`);
    }

    return passed;
  } catch (err) {
    console.log(`  ❌ [ERROR] ${test.desc || test.path}: ${err.message}`);
    return false;
  }
}

const testSuites = {
  health: [
    {
      desc: 'Kiểm tra trạng thái server hoạt động',
      method: 'GET',
      path: '/health',
      expect: 200
    },
    {
      desc: 'Kiểm tra endpoint không tồn tại (Expect 404)',
      method: 'GET',
      path: '/unknown-route-xyz',
      expect: 404
    }
  ],

  auth: [
    {
      desc: 'Đăng ký thất bại với email sai định dạng (Expect 400)',
      method: 'POST',
      path: '/auth/register',
      body: { username: 'baduser', email: 'not-an-email', password: '123', full_name: '' },
      expect: 400
    },
    {
      desc: 'Đăng ký thành công tài khoản học viên mới',
      method: 'POST',
      path: '/auth/register',
      body: testUser,
      expect: 201,
      onSuccess: (data) => {
        learnerToken = data?.data?.accessToken;
      }
    },
    {
      desc: 'Đăng ký trùng lặp email (Expect 400)',
      method: 'POST',
      path: '/auth/register',
      body: testUser,
      expect: 400
    },
    {
      desc: 'Đăng nhập sai mật khẩu (Expect 401)',
      method: 'POST',
      path: '/auth/login',
      body: { email: testUser.email, password: 'WrongPassword' },
      expect: 401
    },
    {
      desc: 'Đăng nhập thành công học viên',
      method: 'POST',
      path: '/auth/login',
      body: { email: testUser.email, password: testUser.password },
      expect: 200,
      onSuccess: (data) => {
        learnerToken = data?.data?.accessToken;
      }
    },
    {
      desc: 'Lấy thông tin cá nhân GET /auth/me (Có token)',
      method: 'GET',
      path: '/auth/me',
      auth: true,
      expect: 200
    },
    {
      desc: 'Đăng nhập tài khoản Quản trị viên (Admin)',
      method: 'POST',
      path: '/auth/login',
      body: { email: 'admin@enlearn.com', password: 'Admin@123' },
      expect: 200,
      onSuccess: (data) => {
        adminToken = data?.data?.accessToken;
      }
    }
  ],

  vocab: [
    {
      desc: 'Lấy danh sách chuyên đề mỹ thuật GET /topics',
      method: 'GET',
      path: '/topics',
      expect: 200
    },
    {
      desc: 'Lấy chi tiết chuyên đề Types of Paintings GET /topics/1',
      method: 'GET',
      path: '/topics/1',
      expect: 200
    },
    {
      desc: 'Lấy chuyên đề không tồn tại GET /topics/99999 (Expect 404)',
      method: 'GET',
      path: '/topics/99999',
      expect: 404
    },
    {
      desc: 'Lấy từ vựng theo chuyên đề GET /vocabularies/topic/1',
      method: 'GET',
      path: '/vocabularies/topic/1?page=1&limit=5',
      expect: 200,
      onSuccess: (data) => {
        if (data?.data?.[0]?.id) sampleVocabId = data.data[0].id;
      }
    },
    {
      desc: 'Tìm kiếm từ vựng mỹ thuật GET /vocabularies/search?q=oil',
      method: 'GET',
      path: '/vocabularies/search?q=oil',
      expect: 200
    },
    {
      desc: 'Đánh dấu đã học từ vựng POST /vocabularies/:id/learn',
      method: 'POST',
      path: () => `/vocabularies/${sampleVocabId}/learn`,
      auth: true,
      expect: 200
    }
  ],

  exercise: [
    {
      desc: 'Sinh đề tự động 10 câu GET /exercises/vocab/1',
      method: 'GET',
      path: '/exercises/vocab/1?count=10',
      expect: 200
    },
    {
      desc: 'Nộp bài trắc nghiệm mỹ thuật POST /exercises/vocab/submit',
      method: 'POST',
      path: '/exercises/vocab/submit',
      auth: true,
      body: () => ({
        results: [
          {
            id: 1,
            vocabulary_id: sampleVocabId,
            selected_option: 0,
            options: ['oil painting', 'watercolor', 'fresco', 'mosaic']
          }
        ]
      }),
      expect: 200
    }
  ],

  review: [
    {
      desc: 'Lấy danh sách cần ôn hôm nay GET /reviews/due',
      method: 'GET',
      path: '/reviews/due',
      auth: true,
      expect: 200
    },
    {
      desc: 'Lấy danh sách từ đang học GET /reviews/learning',
      method: 'GET',
      path: '/reviews/learning',
      auth: true,
      expect: 200
    },
    {
      desc: 'Lấy thống kê chu kỳ SM-2 GET /reviews/stats',
      method: 'GET',
      path: '/reviews/stats',
      auth: true,
      expect: 200
    },
    {
      desc: 'Đánh giá ôn tập sai biên quality = 10 (Expect 400)',
      method: 'POST',
      path: () => `/reviews/${sampleVocabId}/answer`,
      auth: true,
      body: { quality: 10 },
      expect: 400
    },
    {
      desc: 'Đánh giá ôn tập thành công quality = 4 (Nhớ tốt)',
      method: 'POST',
      path: () => `/reviews/${sampleVocabId}/answer`,
      auth: true,
      body: { quality: 4 },
      expect: 200
    }
  ],

  list: [
    {
      desc: 'Lấy danh sách sổ từ cá nhân GET /vocab-lists',
      method: 'GET',
      path: '/vocab-lists',
      auth: true,
      expect: 200
    },
    {
      desc: 'Tạo sổ từ mới POST /vocab-lists (Expect 201)',
      method: 'POST',
      path: '/vocab-lists',
      auth: true,
      body: { name: 'Nghệ Thuật Cổ Điển', description: 'Tranh Phục hưng & Baroque' },
      expect: 201,
      onSuccess: (data) => {
        sampleListId = data?.data?.id;
      }
    },
    {
      desc: 'Đồng bộ từ vào sổ từ POST /vocab-lists/words/sync',
      method: 'POST',
      path: '/vocab-lists/words/sync',
      auth: true,
      body: () => ({
        vocabulary_id: sampleVocabId,
        list_ids: [sampleListId]
      }),
      expect: 200
    },
    {
      desc: 'Lấy chi tiết sổ từ kèm từ vựng GET /vocab-lists/:id',
      method: 'GET',
      path: () => `/vocab-lists/${sampleListId}`,
      auth: true,
      expect: 200
    },
    {
      desc: 'Bảo mật quyền sở hữu: User khác không thể truy cập sổ từ (Expect 404)',
      method: 'GET',
      path: () => `/vocab-lists/${sampleListId}`,
      auth: 'admin',
      expect: 404
    },
    {
      desc: 'Xóa sổ từ cá nhân DELETE /vocab-lists/:id',
      method: 'DELETE',
      path: () => `/vocab-lists/${sampleListId}`,
      auth: true,
      expect: 200
    }
  ],

  stats: [
    {
      desc: 'Lấy thống kê toàn sàn GET /stats/overview',
      method: 'GET',
      path: '/stats/overview',
      expect: 200
    },
    {
      desc: 'Lấy tiến độ học tập cá nhân GET /stats/my-progress',
      method: 'GET',
      path: '/stats/my-progress',
      auth: true,
      expect: 200
    },
    {
      desc: 'Lấy biểu đồ xu hướng 7 ngày GET /stats/learning-trends',
      method: 'GET',
      path: '/stats/learning-trends',
      auth: true,
      expect: 200
    }
  ],

  admin: [
    {
      desc: 'Học viên gọi API Admin bị từ chối GET /admin/users (Expect 403 Forbidden)',
      method: 'GET',
      path: '/admin/users',
      auth: true,
      expect: 403
    },
    {
      desc: 'Quản trị viên truy cập danh sách user GET /admin/users (Expect 200 OK)',
      method: 'GET',
      path: '/admin/users',
      auth: 'admin',
      expect: 200
    }
  ]
};

async function run() {
  console.log('\n================================================================');
  console.log(`🧪 ENGLEARN v2.0 - API CONTRACT & EDGE-CASE TESTER`);
  console.log(`📡 Server Endpoint: ${BASE_URL}`);
  console.log('================================================================\n');

  const filterArg = process.argv[2]?.replace('--', '');
  const selectedSuites = filterArg && testSuites[filterArg]
    ? { [filterArg]: testSuites[filterArg] }
    : testSuites;

  let total = 0;
  let passed = 0;

  for (const [groupName, tests] of Object.entries(selectedSuites)) {
    console.log(`\n📋 PHÂN HỆ: [${groupName.toUpperCase()}] (${tests.length} tests)`);
    for (const test of tests) {
      total++;
      const success = await executeRequest(test);
      if (success) passed++;
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`📊 KẾT QUẢ TỔNG QUAN: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('----------------------------------------------------------------\n');

  if (passed === total) {
    console.log('🎉 XUẤT SẮC: Toàn bộ 8 phân hệ API và cơ chế bảo mật RBAC hoạt động hoàn hảo!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Cảnh báo: Có test không đạt kỳ vọng, vui lòng kiểm tra chi tiết bên trên.\n');
    process.exit(1);
  }
}

run();
