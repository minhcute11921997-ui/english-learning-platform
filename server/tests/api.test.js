const request = require('supertest');
const app = require('../src/app');

describe('EngLearn Backend Integration Test Suite', () => {
  let authToken = '';
  let adminToken = '';

  beforeAll(async () => {
    // Đăng nhập student01
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student1@enlearn.com', password: 'Student@123' });
    authToken = res.body.data.accessToken;

    // Đăng nhập admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@enlearn.com', password: 'Admin@123' });
    adminToken = adminRes.body.data.accessToken;
  });

  describe('1. System Health & Auth APIs', () => {
    test('GET /api/health should return 200 and success status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });

    test('GET /api/auth/me should return logged in user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('student1@enlearn.com');
    });

    test('GET /api/auth/me without token should return 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('2. Topics & Vocabulary APIs', () => {
    test('GET /api/topics should return 7 topics', async () => {
      const res = await request(app).get('/api/topics');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(7);
    });

    test('GET /api/vocabularies/topic/1 should return words with examples', async () => {
      const res = await request(app).get('/api/vocabularies/topic/1');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('word');
      expect(res.body.data[0]).toHaveProperty('meaning_vi');
    });

    test('POST /api/vocabularies/:id/learn should record learning progress', async () => {
      const res = await request(app)
        .post('/api/vocabularies/1/learn')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('learning');
    });
  });

  describe('3. Placement Assessment APIs', () => {
    test('GET /api/assessment/start should return 30 questions without exposing answers', async () => {
      const res = await request(app).get('/api/assessment/start');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(30);
      expect(res.body.data[0]).not.toHaveProperty('correct_option');
    });

    test('POST /api/assessment/submit should score and assign level', async () => {
      const answers = Array.from({ length: 30 }, (_, i) => ({
        question_id: i,
        selected_option: 0
      }));
      const res = await request(app)
        .post('/api/assessment/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data).toHaveProperty('result_level');
    });
  });

  describe('4. Spaced Repetition (SRS) Review APIs', () => {
    test('POST /api/reviews/:vocabId/answer should update SM-2 schedule', async () => {
      const res = await request(app)
        .post('/api/reviews/1/answer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quality: 4 });

      expect(res.status).toBe(200);
      expect(res.body.data.interval_days).toBeGreaterThanOrEqual(1);
    });

    test('GET /api/reviews/stats should return review counts', async () => {
      const res = await request(app)
        .get('/api/reviews/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('learningCount');
    });
  });

  describe('5. Reading & Recommendation APIs', () => {
    test('GET /api/readings should return passages list', async () => {
      const res = await request(app).get('/api/readings');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/readings/recommended should return customized reading suggestions', async () => {
      const res = await request(app)
        .get('/api/readings/recommended')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('6. Study Group APIs', () => {
    test('GET /api/groups/my should return user groups', async () => {
      const res = await request(app)
        .get('/api/groups/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('7. Admin Protection APIs', () => {
    test('Non-admin user accessing /api/admin/users should get 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
    });

    test('Admin user accessing /api/admin/users should get 200 OK', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
