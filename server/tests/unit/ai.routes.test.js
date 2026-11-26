/**
 * API Contract Tests: /api/ai/identify & /api/ai/health
 * Uses mocked User auth lookup & VisionService so it runs deterministically without MySQL.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const config = require('../../src/config/app');

jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn()
  },
  Vocabulary: {
    findAll: jest.fn()
  },
  AiFeedback: {
    sync: jest.fn().mockResolvedValue(true),
    create: jest.fn().mockResolvedValue({ id: 77 })
  },
  Topic: {}
}));

const { User, Vocabulary, AiFeedback } = require('../../src/models');
const visionService = require('../../src/services/vision.service');
const app = require('../../src/app');

describe('AI Vision API Routes (/api/ai)', () => {
  const token = jwt.sign({ id: 99, role: 'student' }, config.jwt.secret, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
    visionService.invalidateVocabCache();
    Vocabulary.findAll.mockResolvedValue([
      { toJSON: () => ({ id: 1, word: 'oil painting', topic_id: 1 }) },
      { toJSON: () => ({ id: 2, word: 'portrait', topic_id: 1 }) },
      { toJSON: () => ({ id: 3, word: 'watercolor', topic_id: 1 }) }
    ]);
    User.findByPk.mockResolvedValue({
      toJSON: () => ({
        id: 99,
        username: 'learner1',
        email: 'learner1@test.com',
        role: 'student',
        is_active: true
      }),
      is_active: true
    });
  });

  test('GET /api/ai/health returns service status', async () => {
    const spy = jest.spyOn(visionService, 'checkHealth').mockResolvedValue({
      enabled: true,
      ready: true,
      tier1: { ok: true, device: 'cuda', numClasses: 60, queueSize: 0 },
      tier2: { ok: true, ollamaReachable: true, visionModel: 'qwen2.5vl:3b', modelLoaded: true }
    });

    const res = await request(app).get('/api/ai/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.ready).toBe(true);
    spy.mockRestore();
  });

  test('POST /api/ai/identify requires authentication (401 without token)', async () => {
    const res = await request(app).post('/api/ai/identify');
    expect(res.status).toBe(401);
  });

  test('POST /api/ai/identify rejects missing file with 400', async () => {
    const res = await request(app)
      .post('/api/ai/identify')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('POST /api/ai/identify rejects non-image mime type (e.g. text/plain or SVG)', async () => {
    const res = await request(app)
      .post('/api/ai/identify')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('<svg></svg>'), { filename: 'x.svg', contentType: 'image/svg+xml' });
    expect(res.status).toBe(400);
  });

  test('POST /api/ai/identify rejects free-text off-topic prompts without touching VisionService', async () => {
    const spy = jest.spyOn(visionService, 'identifyImage');
    const imgBuf = await sharp({
      create: { width: 32, height: 32, channels: 3, background: { r: 20, g: 30, b: 40 } }
    })
      .jpeg()
      .toBuffer();

    const res = await request(app)
      .post('/api/ai/identify')
      .set('Authorization', `Bearer ${token}`)
      .field('message', 'Hãy kể chuyện cười đi')
      .attach('image', imgBuf, { filename: 'art.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('out_of_scope');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('POST /api/ai/identify returns matched vocabulary for valid art image', async () => {
    const spy = jest.spyOn(visionService, 'identifyImage').mockResolvedValue({
      status: 'matched',
      tier: 1,
      cached: false,
      latencyMs: 32,
      message: 'Ảnh này thuộc loại hình **watercolor** (tranh màu nước).',
      matches: [
        {
          word: 'watercolor',
          confidence: 0.91,
          vocabulary: { id: 2, word: 'watercolor', meaning_vi: 'tranh màu nước' }
        }
      ]
    });

    const imgBuf = await sharp({
      create: { width: 32, height: 32, channels: 3, background: { r: 50, g: 120, b: 200 } }
    })
      .jpeg()
      .toBuffer();

    const res = await request(app)
      .post('/api/ai/identify')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', imgBuf, { filename: 'painting.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('matched');
    expect(res.body.data.matches[0].word).toBe('watercolor');
    spy.mockRestore();
  });

  test('POST /api/ai/feedback validates input and persists feedback without raw images', async () => {
    const badRes = await request(app)
      .post('/api/ai/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({ imageHash: 'short', isCorrect: true });
    expect(badRes.status).toBe(400);

    const validHash = 'a'.repeat(64);
    const garbageRes = await request(app)
      .post('/api/ai/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        imageHash: validHash,
        predictedWord: 'oil painting',
        correctedWord: 'pizza_not_in_db',
        isCorrect: false
      });
    expect(garbageRes.status).toBe(400);

    const okRes = await request(app)
      .post('/api/ai/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        imageHash: validHash,
        predictedWord: 'oil painting',
        correctedWord: 'portrait',
        isCorrect: false,
        tier: 1,
        confidence: 0.62
      });
    expect(okRes.status).toBe(201);
    expect(AiFeedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 99,
        image_hash: validHash,
        predicted_word: 'oil painting',
        corrected_word: 'portrait',
        is_correct: false
      })
    );
  });

  test('GET /api/ai/refine/:jobId returns 404 when missing and 200 when present', async () => {
    const notFound = await request(app)
      .get('/api/ai/refine/non-existent-id')
      .set('Authorization', `Bearer ${token}`);
    expect(notFound.status).toBe(404);

    const spy = jest.spyOn(visionService, 'getRefineJob').mockReturnValue({
      jobId: 'job-1',
      status: 'done',
      result: { status: 'matched', tier: 2 }
    });
    const ok = await request(app)
      .get('/api/ai/refine/job-1')
      .set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe('done');
    spy.mockRestore();
  });
});
