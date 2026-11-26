/**
 * Unit Tests: VisionService v2 (Probe Blend, Multi-Facet, Persistent pHash Cache,
 * Async/Off/Sync Tier-2 modes, Deduplication & Off-topic Guard)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');
const { VisionService, OFF_TOPIC_MESSAGE } = require('../../src/services/vision.service');

const MOCK_VOCABS = [
  {
    id: 1,
    topic_id: 1,
    word: 'oil painting',
    pronunciation: '/ˈɔɪl ˈpeɪntɪŋ/',
    part_of_speech: 'noun',
    meaning_vi: 'tranh sơn dầu',
    example_sentence: 'The museum exhibits a famous oil painting.',
    example_translation: 'Bảo tàng trưng bày một bức tranh sơn dầu nổi tiếng.',
    image_url: '/images/vocab/oil_painting.jpg',
    cultural_note: 'Kỹ thuật sơn dầu phát triển từ thế kỷ 15.',
    related_artist: 'Jan van Eyck',
    difficulty: 'easy',
    topic: { id: 1, name: 'Types of Paintings', name_vi: 'Các loại tranh' }
  },
  {
    id: 2,
    topic_id: 1,
    word: 'portrait',
    pronunciation: '/ˈpɔːtrɪt/',
    part_of_speech: 'noun',
    meaning_vi: 'tranh chân dung',
    example_sentence: 'Mona Lisa is a celebrated portrait.',
    example_translation: 'Mona Lisa là bức tranh chân dung nổi tiếng.',
    image_url: '/images/vocab/portrait.jpg',
    cultural_note: 'Ghi lại diện mạo nhân vật.',
    related_artist: 'Leonardo da Vinci',
    difficulty: 'easy',
    topic: { id: 1, name: 'Types of Paintings', name_vi: 'Các loại tranh' }
  },
  {
    id: 3,
    topic_id: 1,
    word: 'watercolor',
    pronunciation: '/ˈwɔːtəkʌlər/',
    part_of_speech: 'noun',
    meaning_vi: 'tranh màu nước',
    example_sentence: 'Watercolor creates soft translucent layers.',
    example_translation: 'Màu nước tạo ra những lớp màu trong trẻo.',
    image_url: '/images/vocab/watercolor.jpg',
    cultural_note: 'Nở rộ tại Anh thế kỷ 18-19.',
    related_artist: 'J. M. W. Turner',
    difficulty: 'easy',
    topic: { id: 1, name: 'Types of Paintings', name_vi: 'Các loại tranh' }
  },
  {
    id: 4,
    topic_id: 2,
    word: 'pottery',
    pronunciation: '/ˈpɒtəri/',
    part_of_speech: 'noun',
    meaning_vi: 'nghề làm đồ gốm',
    example_sentence: 'Traditional pottery uses a clay wheel.',
    example_translation: 'Nghề làm đồ gốm dùng bàn xoay đất sét.',
    image_url: '/images/vocab/pottery.jpg',
    cultural_note: 'Gắn liền với bàn xoay gốm.',
    related_artist: 'Làng gốm Bát Tràng',
    difficulty: 'easy',
    topic: { id: 2, name: 'Fine Arts & Crafts Professions', name_vi: 'Ngành nghề mỹ nghệ' }
  }
];

async function makeTestJpeg(r = 120, g = 80, b = 40, width = 64, height = 64, quality = 90) {
  // Generate a seeded spatial pattern so distinct seeds produce distinct perceptual dHashes
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 3;
      const wave = ((x * (r % 17 + 1) + y * (g % 13 + 1) + b) % 255);
      raw[idx] = (r + wave) % 256;
      raw[idx + 1] = (g + (x * 7 + y * 3)) % 256;
      raw[idx + 2] = (b + wave * 2) % 256;
    }
  }
  return sharp(raw, { raw: { width, height, channels: 3 } })
    .jpeg({ quality })
    .toBuffer();
}

function makeConfig(overrides = {}) {
  return {
    enabled: true,
    aiServiceUrl: 'http://tier1.local',
    ollamaUrl: 'http://ollama.local',
    visionModel: 'qwen2.5vl:7b',
    tier2Mode: 'off',
    tier1TimeoutMs: 2000,
    tier2TimeoutMs: 2000,
    tier2Concurrency: 1,
    tier2MaxQueue: 2,
    cacheMaxEntries: 100,
    cacheTtlMs: 60000,
    thresholds: {
      lowSim: 0.08,
      oodMargin: -0.01,
      highProb: 0.55,
      probMargin: 0.20,
      vlmConfidence: 0.55
    },
    ...overrides
  };
}

describe('VisionService v2 - Probe, Facets, Persistent Cache & Tier-2 Modes', () => {
  test('Tier-1 probe_blend returns matched vocabulary + multi-facet cards without calling Ollama', async () => {
    let ollamaCalls = 0;
    const fetchImpl = async (url) => {
      if (url.includes('/classify')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            mode: 'probe_blend',
            is_ood: false,
            confident_match: true,
            conformal_set: ['portrait', 'oil painting'],
            top_k: [
              { word: 'portrait', facet: 'subject', prob: 0.68, sim: 0.22, text_sim: 0.21 },
              { word: 'oil painting', facet: 'medium', prob: 0.25, sim: 0.20, text_sim: 0.19 }
            ],
            facets: [
              { facet: 'subject', facet_label_vi: 'Thể loại & Đề tài', word: 'portrait', prob: 0.68, within_facet_prob: 0.91 },
              { facet: 'medium', facet_label_vi: 'Chất liệu & Kỹ thuật', word: 'oil painting', prob: 0.25, within_facet_prob: 0.78 }
            ],
            top1_sim: 0.22,
            top1_text_sim: 0.21,
            top1_prob: 0.68,
            prob_margin: 0.43,
            ood_max_sim: 0.05,
            ood_margin: 0.16
          })
        };
      }
      ollamaCalls += 1;
      throw new Error('Ollama should not be called');
    };

    const service = new VisionService({
      aiConfig: makeConfig({ tier2Mode: 'off' }),
      fetchImpl,
      persistPath: null,
      vocabLoader: async () => MOCK_VOCABS
    });

    const buf = await makeTestJpeg(200, 40, 40);
    const res = await service.identifyImage(buf);
    expect(res.status).toBe('matched');
    expect(res.tier).toBe(1);
    expect(res.mode).toBe('probe_blend');
    expect(res.imageHash).toHaveLength(64);
    expect(res.matches[0].word).toBe('portrait');
    expect(res.facets).toHaveLength(2);
    expect(res.facets[0].facetLabelVi).toBe('Thể loại & Đề tài');
    expect(res.facets[1].word).toBe('oil painting');
    expect(ollamaCalls).toBe(0);
  });

  test('Persistent cache + perceptual dHash hits across restarts and recompressed images', async () => {
    const tmpFile = path.join(os.tmpdir(), `englearn-cache-test-${Date.now()}.json`);
    let tier1Calls = 0;

    const fetchImpl = async () => {
      tier1Calls += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          mode: 'probe_blend',
          is_ood: false,
          confident_match: true,
          top_k: [{ word: 'pottery', facet: 'craft', prob: 0.91, sim: 0.25, text_sim: 0.24 }],
          facets: [{ facet: 'craft', facet_label_vi: 'Nghề mỹ nghệ', word: 'pottery', prob: 0.91, within_facet_prob: 0.95 }],
          top1_sim: 0.25,
          top1_text_sim: 0.24,
          top1_prob: 0.91,
          prob_margin: 0.85,
          ood_margin: 0.16
        })
      };
    };

    try {
      const svc1 = new VisionService({
        aiConfig: makeConfig(),
        fetchImpl,
        persistPath: tmpFile,
        vocabLoader: async () => MOCK_VOCABS
      });

      const buf1 = await makeTestJpeg(40, 120, 90, 96, 96, 95);
      const first = await svc1.identifyImage(buf1);
      expect(first.cached).toBe(false);
      expect(tier1Calls).toBe(1);

      // Flush cache to disk and construct a brand-new VisionService (simulating server restart)
      svc1.cache.flushSync();
      const svc2 = new VisionService({
        aiConfig: makeConfig(),
        fetchImpl,
        persistPath: tmpFile,
        vocabLoader: async () => MOCK_VOCABS
      });

      // Re-encoded JPEG at different quality -> different SHA-256, same dHash -> hits persistent pHash cache!
      const bufRecompressed = await makeTestJpeg(40, 120, 90, 96, 96, 65);
      const second = await svc2.identifyImage(bufRecompressed);
      expect(second.cached).toBe(true);
      expect(second.matches[0].word).toBe('pottery');
      expect(tier1Calls).toBe(1);
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  test('Async Tier-2 mode returns preliminary Tier-1 immediately and refines in background', async () => {
    const fetchImpl = async (url) => {
      if (url.includes('/classify')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            mode: 'probe_blend',
            is_ood: false,
            confident_match: false,
            top_k: [
              { word: 'oil painting', prob: 0.42, sim: 0.18, text_sim: 0.16 },
              { word: 'watercolor', prob: 0.38, sim: 0.17, text_sim: 0.15 }
            ],
            facets: [],
            top1_prob: 0.42,
            prob_margin: 0.04,
            ood_margin: 0.08
          })
        };
      }
      if (url.includes('/api/chat')) {
        await new Promise((r) => setTimeout(r, 30));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            message: { content: JSON.stringify({ selected_word: 'watercolor', confidence: 0.87 }) }
          })
        };
      }
      throw new Error('Unexpected URL');
    };

    const service = new VisionService({
      aiConfig: makeConfig({ tier2Mode: 'async' }),
      fetchImpl,
      persistPath: null,
      vocabLoader: async () => MOCK_VOCABS
    });

    const buf = await makeTestJpeg(10, 100, 200);
    const initial = await service.identifyImage(buf);
    expect(initial.preliminary).toBe(true);
    expect(initial.refineJobId).toBeTruthy();
    expect(initial.tier).toBe(1);

    await new Promise((r) => setTimeout(r, 80));
    const job = service.getRefineJob(initial.refineJobId);
    expect(job.status).toBe('done');
    expect(job.result.tier).toBe(2);
    expect(job.result.matches[0].word).toBe('watercolor');
  });

  test('Concurrent identical uploads deduplicate into a single Tier-1 call', async () => {
    let tier1Calls = 0;
    const fetchImpl = async () => {
      tier1Calls += 1;
      await new Promise((r) => setTimeout(r, 25));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          is_ood: false,
          confident_match: true,
          top_k: [{ word: 'pottery', prob: 0.91, sim: 0.25, text_sim: 0.24 }],
          facets: []
        })
      };
    };

    const service = new VisionService({
      aiConfig: makeConfig(),
      fetchImpl,
      persistPath: null,
      vocabLoader: async () => MOCK_VOCABS
    });

    const buf = await makeTestJpeg(30, 120, 90);
    const results = await Promise.all([
      service.identifyImage(buf),
      service.identifyImage(buf),
      service.identifyImage(buf)
    ]);

    expect(tier1Calls).toBe(1);
    expect(results.every((r) => r.matches[0].word === 'pottery')).toBe(true);
  });

  test('Out-of-domain image is rejected at Tier-1 with fixed message and never invokes Ollama', async () => {
    let ollamaCalls = 0;
    const fetchImpl = async (url) => {
      if (url.includes('/classify')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            is_ood: true,
            ood_prob: 0.89,
            top_k: [{ word: 'portrait', prob: 0.35, sim: 0.09, text_sim: 0.06 }],
            top1_text_sim: 0.06,
            ood_margin: -0.12
          })
        };
      }
      ollamaCalls += 1;
      throw new Error('Should not call Ollama');
    };

    const service = new VisionService({
      aiConfig: makeConfig({ tier2Mode: 'sync' }),
      fetchImpl,
      persistPath: null,
      vocabLoader: async () => MOCK_VOCABS
    });

    const buf = await makeTestJpeg(10, 20, 30);
    const res = await service.identifyImage(buf);
    expect(res.status).toBe('out_of_scope');
    expect(res.tier).toBe(1);
    expect(res.message).toBe(OFF_TOPIC_MESSAGE);
    expect(ollamaCalls).toBe(0);
  });

  test('Sync Tier-2 mode rejects hallucinated labels and falls back gracefully on queue overflow', async () => {
    let mode = 'hallucinate';
    const fetchImpl = async (url) => {
      if (url.includes('/classify')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            is_ood: false,
            confident_match: false,
            top_k: [
              { word: 'oil painting', prob: 0.42, sim: 0.18, text_sim: 0.16 },
              { word: 'watercolor', prob: 0.35, sim: 0.16, text_sim: 0.14 }
            ],
            facets: []
          })
        };
      }
      if (mode === 'hallucinate') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            message: { content: JSON.stringify({ selected_word: 'banana_pizza', confidence: 0.99 }) }
          })
        };
      }
      await new Promise((r) => setTimeout(r, 80));
      throw new Error('Connection refused');
    };

    const service = new VisionService({
      aiConfig: makeConfig({ tier2Mode: 'sync', tier2Concurrency: 1, tier2MaxQueue: 1 }),
      fetchImpl,
      persistPath: null,
      vocabLoader: async () => MOCK_VOCABS
    });

    const resHallucinate = await service.identifyImage(await makeTestJpeg(50, 150, 220));
    expect(resHallucinate.status).toBe('out_of_scope');

    mode = 'fail';
    const inputs = await Promise.all([
      makeTestJpeg(1, 2, 3),
      makeTestJpeg(10, 20, 30),
      makeTestJpeg(40, 50, 60),
      makeTestJpeg(70, 80, 90)
    ]);
    const results = await Promise.all(inputs.map((b) => service.identifyImage(b)));
    expect(results.every((r) => r.status === 'uncertain' && r.fallback === true && r.matches.length > 0)).toBe(true);
  });

  test('Perceptual dHash deduplicates concurrent uploads with different JPEG quality', async () => {
    let tier1Calls = 0;
    const fetchImpl = async () => {
      tier1Calls += 1;
      await new Promise((r) => setTimeout(r, 35));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          emb_id: 'emb-dedupe',
          is_ood: false,
          confident_match: true,
          top_k: [{ word: 'watercolor', prob: 0.9, sim: 0.25, text_sim: 0.24 }],
          facets: []
        })
      };
    };

    const service = new VisionService({
      aiConfig: makeConfig(),
      fetchImpl,
      persistPath: null,
      vocabLoader: async () => MOCK_VOCABS
    });

    const bufHighQ = await makeTestJpeg(77, 88, 99, 96, 96, 95);
    const bufLowQ = await makeTestJpeg(77, 88, 99, 96, 96, 60);
    const [r1, r2] = await Promise.all([
      service.identifyImage(bufHighQ),
      service.identifyImage(bufLowQ)
    ]);

    expect(tier1Calls).toBe(1);
    expect(r1.matches[0].word).toBe('watercolor');
    expect(r2.matches[0].word).toBe('watercolor');
    expect(r2.deduped).toBe(true);
  });

  test('checkHealth caches external pings for 3s TTL and invalidateVocabCache clears vocabCache', async () => {
    let healthPings = 0;
    const fetchImpl = async () => {
      healthPings += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', device: 'cuda', num_classes: 60, num_facets: 6 })
      };
    };

    let vocabLoads = 0;
    const service = new VisionService({
      aiConfig: makeConfig({ tier2Mode: 'off' }),
      fetchImpl,
      persistPath: null,
      vocabLoader: async () => {
        vocabLoads += 1;
        return MOCK_VOCABS;
      }
    });

    await service.checkHealth();
    await service.checkHealth();
    expect(healthPings).toBe(1);

    await service.getVocabMap();
    await service.getVocabMap();
    expect(vocabLoads).toBe(1);

    service.invalidateVocabCache();
    await service.getVocabMap();
    expect(vocabLoads).toBe(2);
  });
});
