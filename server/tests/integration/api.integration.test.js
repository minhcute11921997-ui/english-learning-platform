/**
 * 🧪 Integration Tests: Comprehensive API Contract & Security Matrix
 * File: server/tests/integration/api.integration.test.js
 */

const request = require('supertest');
const runIntegration = process.env.RUN_MYSQL_TESTS === '1';
const testDatabase = `englearn_jest_${process.pid}_${Date.now()}`;
if (runIntegration) {
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME_TEST = testDatabase;
}
const app = runIntegration ? require('../../src/app') : null;
const {
  sequelize,
  User,
  UserVocabList,
  UserVocabProgress,
  ReviewSchedule
} = runIntegration ? require('../../src/models') : {};

(runIntegration ? describe : describe.skip)('EngLearn v2.0 - Comprehensive API Integration Tests', () => {
  let learnerToken = null;
  let learnerId = null;
  let adminToken = null;
  let adminId = null;
  let testVocabId = null;
  let createdListId = null;

  const uniqueSuffix = Date.now().toString().slice(-6);
  const testUser = {
    username: `qauser${uniqueSuffix}`,
    email: `qa${uniqueSuffix}@test.com`,
    password: 'Password123',
    full_name: 'QA Test Learner'
  };

  let databaseConnection;
  beforeAll(async () => {
    const config = require('../../src/config/database').test;
    databaseConnection = await require('mysql2/promise').createConnection({
      host: config.host, port: config.port, user: config.username, password: config.password
    });
    if (!/^englearn_jest_\d+_\d+$/.test(testDatabase)) throw new Error('Invalid test database name');
    await databaseConnection.query(`CREATE DATABASE \`${testDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await sequelize.sync();
    await require('../../src/seeders').seed();
  }, 60000);

  afterAll(async () => {
    if (sequelize) await sequelize.close();
    if (databaseConnection) {
      try {
        await databaseConnection.query(`DROP DATABASE IF EXISTS \`${testDatabase}\``);
      } finally {
        await databaseConnection.end();
      }
    }
  });

  // ==========================================
  // 1. HEALTH CHECK & INFRASTRUCTURE
  // ==========================================
  describe('1. Health Check & Basic Info', () => {
    test('GET /api/health -> 200 OK với trạng thái server', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Server đang hoạt động');
      expect(res.body).toHaveProperty('timestamp');
    });

    test('GET /api/unknown-route -> 404 Not Found với AppError format', async () => {
      const res = await request(app).get('/api/not-existing-endpoint-xyz');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Không tìm thấy');
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & VALIDATION
  // ==========================================
  describe('2. Authentication, Input Validation & Security', () => {
    test('TC-AUTH-01: Đăng ký thất bại khi thiếu hoặc sai trường đầu vào (Validation Input)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab', // < 3 chars
          email: 'invalid-email',
          password: '123',
          full_name: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBeDefined();
    });

    test('TC-AUTH-02: Đăng ký thành công tài khoản học viên mới', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe('learner');
      // Anti-leak: Không bao giờ trả về password_hash
      expect(res.body.data.user).not.toHaveProperty('password_hash');

      learnerToken = res.body.data.accessToken;
      learnerId = res.body.data.user.id;
    });

    test('TC-AUTH-03: Đăng ký thất bại khi email hoặc username đã tồn tại', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('đã được sử dụng');
    });

    test('TC-AUTH-04: Đăng nhập thất bại khi sai mật khẩu', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword999'
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('không chính xác');
    });

    test('TC-AUTH-05: Đăng nhập thành công với tài khoản học viên', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.id).toBe(learnerId);
      learnerToken = res.body.data.accessToken;
    });

    test('TC-AUTH-06: Đăng nhập với tài khoản Admin mặc định', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@enlearn.com',
          password: 'Admin@123'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
      adminToken = res.body.data.accessToken;
      adminId = res.body.data.user.id;
    });

    test('TC-AUTH-07: Xác thực GET /api/auth/me với token hợp lệ vs không có token', async () => {
      // Không có token
      const resNoAuth = await request(app).get('/api/auth/me');
      expect(resNoAuth.status).toBe(401);

      // Có token
      const resAuth = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(resAuth.status).toBe(200);
      expect(resAuth.body.data.email).toBe(testUser.email);
    });
  });

  // ==========================================
  // 3. TOPICS & VOCABULARIES
  // ==========================================
  describe('3. Topics, Vocabularies & Search', () => {
    test('TC-VOCAB-01: GET /api/topics -> Trả về 2 chuyên đề mỹ thuật', async () => {
      const res = await request(app)
        .get('/api/topics')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0]).toHaveProperty('name_vi');
      expect(res.body.data[0]).toHaveProperty('vocab_count');
      expect(res.body.data[0]).toHaveProperty('progress_percent');
    });

    test('TC-VOCAB-02: GET /api/vocabularies/topic/1 -> Trả về danh sách từ vựng kèm phân trang', async () => {
      const res = await request(app)
        .get('/api/vocabularies/topic/1?page=1&limit=10')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const first = res.body.data[0];
      testVocabId = first.id;
      expect(first).toHaveProperty('word');
      expect(first).toHaveProperty('meaning_vi');
      expect(first).toHaveProperty('image_url');
      expect(first).toHaveProperty('cultural_note');
    });

    test('TC-VOCAB-03: Tìm kiếm từ vựng qua GET /api/vocabularies/search', async () => {
      const res = await request(app)
        .get('/api/vocabularies/search?q=oil')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.some((v) => v.word.toLowerCase().includes('oil'));
      expect(found).toBe(true);
    });

    test('TC-VOCAB-04: Đánh dấu đã học POST /api/vocabularies/:id/learn', async () => {
      const res = await request(app)
        .post(`/api/vocabularies/${testVocabId}/learn`)
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('learning');
      expect(Number(res.body.data.vocabulary_id)).toBe(Number(testVocabId));
    });
  });

  // ==========================================
  // 4. EXERCISE GENERATOR & SCORING LOGIC
  // ==========================================
  describe('4. Exercise Generation, Anti-leak Security & Scoring', () => {
    let generatedExercises = [];
    let generatedAttemptId;

    test('TC-EX-01: Sinh đề tự động 10 câu qua GET /api/exercises/vocab/1', async () => {
      const res = await request(app).get('/api/exercises/vocab/1?count=10')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.exercises)).toBe(true);
      expect(res.body.data.exercises.length).toBe(10);
      generatedExercises = res.body.data.exercises;
      generatedAttemptId = res.body.data.attempt_id;

      // Anti-leak Check: Trước khi nộp bài, tuyệt đối KHÔNG lộ đáp án hay bối cảnh giải thích
      generatedExercises.forEach((q) => {
        expect(q).not.toHaveProperty('is_correct');
        expect(q).not.toHaveProperty('correct_option');
        expect(q.options.length).toBe(4);
        if (q.type === 'image_to_word') {
          expect(q).not.toHaveProperty('meaning_vi');
          expect(q).not.toHaveProperty('cultural_note');
        }
      });
    });

    test('TC-EX-02: Nộp bài thất bại khi dữ liệu không hợp lệ', async () => {
      const res = await request(app)
        .post('/api/exercises/vocab/submit')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ results: 'not-an-array' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    test('TC-EX-03: Nộp bài thành công, Server-side Scoring & trả về đầy đủ bối cảnh văn hóa', async () => {
      const submitPayload = {
        attempt_id: generatedAttemptId,
        results: generatedExercises.map((ex) => ({
          id: ex.id,
          selected_option: 0
        }))
      };

      const res = await request(app)
        .post('/api/exercises/vocab/submit')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(submitPayload);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total', 10);
      expect(res.body.data).toHaveProperty('correct');
      expect(res.body.data).toHaveProperty('percentage');
      expect(Array.isArray(res.body.data.explanations)).toBe(true);

      const firstExp = res.body.data.explanations[0];
      expect(firstExp).toHaveProperty('is_correct');
      expect(firstExp).toHaveProperty('correct_option');
      expect(firstExp).toHaveProperty('meaning_vi');
    });
  });

  // ==========================================
  // 5. REVIEW SPACING REPETITION (SM-2)
  // ==========================================
  describe('5. Spaced Repetition Review (SM-2 SRS)', () => {
    test('TC-REV-01: Lấy danh sách cần ôn hôm nay GET /api/reviews/due', async () => {
      const res = await request(app)
        .get('/api/reviews/due')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('TC-REV-02: Lấy danh sách từ đang học GET /api/reviews/learning', async () => {
      const res = await request(app)
        .get('/api/reviews/learning')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('TC-REV-03: Lấy thống kê ôn tập GET /api/reviews/stats', async () => {
      const res = await request(app)
        .get('/api/reviews/stats')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('learningCount');
      expect(res.body.data).toHaveProperty('masteredCount');
      expect(res.body.data).toHaveProperty('accuracyRate');
    });

    test('TC-REV-04: Đánh giá ôn tập POST /api/reviews/:vocabId/answer thất bại khi quality ngoài [0, 5]', async () => {
      const res = await request(app)
        .post(`/api/reviews/${testVocabId}/answer`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ quality: 99 });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('phải là số từ 0 đến 5');
    });

    test('TC-REV-05: Đánh giá ôn tập thành công với quality = 4 (Nhớ tốt)', async () => {
      const res = await request(app)
        .post(`/api/reviews/${testVocabId}/answer`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ quality: 4 });

      expect(res.status).toBe(200);
      expect(res.body.data.repetition_count).toBeGreaterThanOrEqual(1);
      expect(res.body.data.interval_days).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================
  // 6. SỔ TỪ VỰNG CÁ NHÂN (USER VOCAB LISTS)
  // ==========================================
  describe('6. Custom Vocab Lists & Ownership Security', () => {
    test('TC-LIST-01: Tạo sổ từ mới POST /api/vocab-lists', async () => {
      const res = await request(app)
        .post('/api/vocab-lists')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          name: 'Bộ sưu tập Sơn mài & Gốm',
          description: 'Các kỹ thuật mỹ nghệ truyền thống tiêu biểu',
          color: '#195646'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Bộ sưu tập Sơn mài & Gốm');
      createdListId = res.body.data.id;
    });

    test('TC-LIST-02: Lấy danh sách sổ từ GET /api/vocab-lists', async () => {
      const res = await request(app)
        .get('/api/vocab-lists')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.some((l) => l.id === createdListId);
      expect(found).toBe(true);
    });

    test('TC-LIST-03: Đồng bộ thêm từ vào sổ từ POST /api/vocab-lists/words/sync', async () => {
      const res = await request(app)
        .post('/api/vocab-lists/words/sync')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          vocabulary_id: testVocabId,
          list_ids: [createdListId]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assigned_list_ids).toContain(createdListId);
    });

    test('TC-LIST-04: Lấy chi tiết sổ từ GET /api/vocab-lists/:id', async () => {
      const res = await request(app)
        .get(`/api/vocab-lists/${createdListId}`)
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdListId);
      expect(Array.isArray(res.body.data.vocabularies)).toBe(true);
      expect(res.body.data.vocabularies.length).toBe(1);
    });

    test('TC-LIST-05: Bảo mật quyền sở hữu (Ownership) - User khác không thể truy cập sổ từ này', async () => {
      const res = await request(app)
        .get(`/api/vocab-lists/${createdListId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Không tìm thấy danh sách từ vựng');
    });

    test('TC-LIST-06: Xóa sổ từ cá nhân DELETE /api/vocab-lists/:id', async () => {
      const res = await request(app)
        .delete(`/api/vocab-lists/${createdListId}`)
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Đã xóa danh sách từ vựng');
    });
  });

  // ==========================================
  // 7. ADMIN PANEL & ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================
  describe('7. Admin Panel & Role-Based Access Control (RBAC)', () => {
    test('TC-RBAC-01: Học viên thường (learner) bị chặn 403 khi gọi API Admin', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Bạn không có quyền');
    });

    test('TC-RBAC-02: Quản trị viên (admin) gọi thành công GET /api/admin/users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('TC-RBAC-03: Admin khóa và mở khóa tài khoản user PUT /api/admin/users/:id/status', async () => {
      // Khóa tài khoản test learner
      const resLock = await request(app)
        .put(`/api/admin/users/${learnerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resLock.status).toBe(200);
      expect(resLock.body.data.is_active).toBe(false);

      // Thử đăng nhập bằng tài khoản bị khóa -> Bị từ chối 403
      const resLoginLocked = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      expect(resLoginLocked.status).toBe(403);
      expect(resLoginLocked.body.message).toContain('bị khóa');

      // Mở khóa lại
      const resUnlock = await request(app)
        .put(`/api/admin/users/${learnerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resUnlock.status).toBe(200);
      expect(resUnlock.body.data.is_active).toBe(true);
    });

    test('TC-RBAC-04: Admin không thể tự khóa hoặc tự hạ quyền chính mình', async () => {
      const resSelfLock = await request(app)
        .put(`/api/admin/users/${adminId}/status`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([400, 409]).toContain(resSelfLock.status);

      const resSelfDemote = await request(app)
        .put(`/api/admin/users/${adminId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'learner' });
      expect([400, 409]).toContain(resSelfDemote.status);
    });
  });

  // ==========================================
  // 8. STATS APIS
  // ==========================================
  describe('8. Learning Progress & Overview Stats APIs', () => {
    test('TC-STAT-01: GET /api/stats/overview -> Trả về tổng số từ vựng và chủ đề', async () => {
      const res = await request(app)
        .get('/api/stats/overview')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalVocab).toBeGreaterThan(0);
      expect(res.body.data.totalTopics).toBe(2);
    });

    test('TC-STAT-02: GET /api/stats/my-progress -> Trả về tiến độ học cá nhân', async () => {
      const res = await request(app)
        .get('/api/stats/my-progress')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('learnedCount');
      expect(res.body.data).toHaveProperty('dueTodayCount');
    });
  });
});
