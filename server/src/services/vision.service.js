const crypto = require('crypto');
const sharp = require('sharp');
const config = require('../config/app');
const AppError = require('../utils/AppError');
const { BoundedAsyncQueue, QueueFullError, QueueTimeoutError } = require('../utils/asyncQueue');
const { PersistentVisionCache, rawPixelsToDHash, findInFlightByDHash } = require('../utils/persistentCache');

const OFF_TOPIC_MESSAGE =
  'Ảnh này không thuộc các loại tranh hoặc tác phẩm mỹ nghệ trong EngLearn. Vui lòng thử ảnh tranh vẽ, tác phẩm điêu khắc hoặc đồ thủ công mỹ nghệ.';

const VALID_ACTIONS = new Set(['identify']);

class VisionService {
  /**
   * @param {object} [deps] - Optional dependency overrides for unit testing
   */
  constructor(deps = {}) {
    this.aiConfig = deps.aiConfig || config.ai;
    this.fetchImpl = deps.fetchImpl || global.fetch;
    this.vocabLoader = deps.vocabLoader || null;

    this.cache = new PersistentVisionCache({
      maxEntries: this.aiConfig.cacheMaxEntries || 1000,
      ttlMs: this.aiConfig.cacheTtlMs || 30 * 60 * 1000,
      persistPath: deps.persistPath !== undefined ? deps.persistPath : this.aiConfig.cachePersistPath
    });
    this.inFlight = new Map();
    this.refineJobs = new Map();
    this.tier2Queue = new BoundedAsyncQueue({
      concurrency: this.aiConfig.tier2Concurrency || 1,
      maxQueueSize: this.aiConfig.tier2MaxQueue || 20,
      retryAfterSec: 3
    });

    this.vocabCache = null;
    this.vocabCacheAt = 0;
    this._healthCache = null;
    this._healthCacheAt = 0;

    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      dedupeHits: 0,
      tier1Matched: 0,
      tier1Rejected: 0,
      tier2Calls: 0,
      tier2Fallbacks: 0,
      latencySamples: []
    };
  }

  _recordLatency(ms) {
    this.metrics.latencySamples.push(ms);
    if (this.metrics.latencySamples.length > 200) {
      this.metrics.latencySamples.shift();
    }
  }

  _percentile(p) {
    const arr = [...this.metrics.latencySamples].sort((a, b) => a - b);
    if (arr.length === 0) return 0;
    const idx = Math.min(arr.length - 1, Math.floor((p / 100) * arr.length));
    return Math.round(arr[idx]);
  }

  getMetrics() {
    return {
      totalRequests: this.metrics.totalRequests,
      cacheHits: this.metrics.cacheHits,
      dedupeHits: this.metrics.dedupeHits,
      tier1Matched: this.metrics.tier1Matched,
      tier1Rejected: this.metrics.tier1Rejected,
      tier2Calls: this.metrics.tier2Calls,
      tier2Fallbacks: this.metrics.tier2Fallbacks,
      cacheSize: this.cache.size,
      tier2Mode: this.aiConfig.tier2Mode || 'off',
      tier2QueueWaiting: this.tier2Queue.size,
      tier2QueueActive: this.tier2Queue.activeCount,
      p50Ms: this._percentile(50),
      p95Ms: this._percentile(95)
    };
  }

  resetRuntimeState() {
    this.cache.clear();
    this.inFlight.clear();
    this.refineJobs.clear();
    this.vocabCache = null;
    this.vocabCacheAt = 0;
    this._healthCache = null;
    this._healthCacheAt = 0;
  }

  invalidateVocabCache() {
    this.vocabCache = null;
    this.vocabCacheAt = 0;
  }

  async syncVocabLabel(vocab) {
    if (!vocab || !vocab.word) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      await this.fetchImpl(`${this.aiConfig.aiServiceUrl}/upsert-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: vocab.word,
          topic_id: Number(vocab.topic_id) || 1,
          topic_name: vocab.topic?.name || '',
          meaning_vi: vocab.meaning_vi || '',
          image_alt: vocab.image_alt || '',
          facet: Number(vocab.topic_id) === 2 ? 'craft' : 'medium'
        }),
        signal: controller.signal
      });
    } catch {
      // Non-blocking sync
    } finally {
      clearTimeout(timer);
    }
  }

  async forwardFeedbackVector({ embId, predictedWord, correctedWord, isCorrect }) {
    if (!embId) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      await this.fetchImpl(`${this.aiConfig.aiServiceUrl}/record-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emb_id: embId,
          predicted_word: predictedWord || null,
          corrected_word: correctedWord || '',
          is_correct: Boolean(isCorrect)
        }),
        signal: controller.signal
      });
    } catch {
      // Non-blocking feedback vector logging
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Load approved vocabulary terms from MySQL (cached for 60s) so AI outputs
   * are strictly grounded in the database and never hallucinate terms.
   */
  async getVocabMap() {
    const now = Date.now();
    if (this.vocabCache && now - this.vocabCacheAt < 60 * 1000) {
      return this.vocabCache;
    }

    let rows;
    if (this.vocabLoader) {
      rows = await this.vocabLoader();
    } else {
      const { Vocabulary, Topic } = require('../models');
      const models = await Vocabulary.findAll({
        where: { is_approved: true },
        include: [{ model: Topic, as: 'topic', attributes: ['id', 'name', 'name_vi'] }],
        order: [['id', 'ASC']]
      });
      rows = models.map((m) => m.toJSON());
    }

    const map = new Map();
    for (const row of rows) {
      map.set(String(row.word).toLowerCase(), row);
    }
    this.vocabCache = map;
    this.vocabCacheAt = now;
    return map;
  }

  /**
   * Strip EXIF, auto-orient, validate raster format, downscale to 512px max side,
   * and compute both exact SHA-256 and perceptual dHash.
   */
  async preprocessImage(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new AppError('Vui lòng tải lên một file ảnh hợp lệ.', 400);
    }
    try {
      const base = sharp(buffer).rotate();
      const [normalized, rawGray] = await Promise.all([
        base.clone().resize(512, 512, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer(),
        base.clone().greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer()
      ]);
      const hash = crypto.createHash('sha256').update(normalized).digest('hex');
      const dhash = rawPixelsToDHash(rawGray);
      return { normalized, hash, dhash };
    } catch {
      throw new AppError('File ảnh không hợp lệ hoặc bị hỏng. Chỉ hỗ trợ JPG, PNG, WEBP.', 400);
    }
  }

  async _downscaleForVlm(normalizedBuffer) {
    return sharp(normalizedBuffer)
      .resize(448, 448, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  async _callTier1(normalizedBuffer) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.aiConfig.tier1TimeoutMs || 5000);

    try {
      const form = new FormData();
      form.append('file', new Blob([normalizedBuffer], { type: 'image/jpeg' }), 'query.jpg');

      const res = await this.fetchImpl(`${this.aiConfig.aiServiceUrl}/classify`, {
        method: 'POST',
        body: form,
        signal: controller.signal
      });

      if (res.status === 429) {
        throw new QueueFullError();
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new AppError(`Lỗi dịch vụ AI Tier-1 (${res.status}): ${text || 'Không xác định'}`, 502);
      }
      return await res.json();
    } catch (err) {
      if (err instanceof AppError || err instanceof QueueFullError) throw err;
      if (err.name === 'AbortError') {
        throw new AppError('Dịch vụ nhận diện ảnh quá tải hoặc phản hồi chậm. Vui lòng thử lại.', 504);
      }
      throw new AppError('Dịch vụ AI nhận diện ảnh hiện chưa khởi động. Vui lòng thử lại sau.', 503);
    } finally {
      clearTimeout(timer);
    }
  }

  async _callTier2Ollama(vlmBuffer, candidates, vocabMap) {
    const candWords = candidates.map((c) => c.word);
    const candLines = candidates
      .map((c, idx) => {
        const v = vocabMap.get(c.word.toLowerCase());
        const pct = Math.round((Number(c.prob) || 0) * 100);
        return `${idx + 1}. "${c.word}" (${v?.meaning_vi || ''}, prior=${pct}%)`;
      })
      .join('\n');

    const prompt =
      'You are a strict closed-set fine-arts and crafts visual classifier.\n' +
      'Choose the SINGLE most specific matching label from the 5 candidates below (prefer specific genres/subjects/crafts like portrait, still life, cubism, watercolor, easel, potter over generic "oil painting" when applicable), ' +
      'or choose "none" if the image is NOT a painting, drawing, sculpture, craft object, or craftsperson ' +
      '(for example: selfie, food, animal, vehicle, UI screenshot, normal landscape photo).\n\n' +
      `Candidates:\n${candLines}\n\n` +
      'Reply strictly as JSON: {"selected_word": "<exact label from list or none>", "confidence": <0..1>}';

    const payload = {
      model: this.aiConfig.visionModel || 'qwen2.5vl:7b',
      stream: false,
      keep_alive: -1,
      format: 'json',
      options: {
        temperature: 0,
        num_predict: 96,
        num_ctx: 1024
      },
      messages: [
        {
          role: 'user',
          content: prompt,
          images: [vlmBuffer.toString('base64')]
        }
      ]
    };

    const timeoutMs = this.aiConfig.tier2TimeoutMs || 15000;
    return this.tier2Queue.run(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await this.fetchImpl(`${this.aiConfig.ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        if (!res.ok) {
          throw new Error(`Ollama HTTP ${res.status}`);
        }
        const data = await res.json();
        const rawContent = data?.message?.content || '{}';
        const parsed = JSON.parse(rawContent);
        const selected = String(parsed.selected_word || 'none').trim();
        const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));
        if (selected !== 'none' && !candWords.includes(selected)) {
          return { selected_word: 'none', confidence: 0, invalidEnum: true };
        }
        return { selected_word: selected, confidence };
      } finally {
        clearTimeout(timer);
      }
    }, timeoutMs + 500);
  }

  _buildMatches(candidates, vocabMap, overrideTopWord = null, overrideConfidence = null) {
    const ordered = [...candidates];
    if (overrideTopWord) {
      const idx = ordered.findIndex((c) => c.word.toLowerCase() === overrideTopWord.toLowerCase());
      if (idx > 0) {
        const [picked] = ordered.splice(idx, 1);
        ordered.unshift(picked);
      }
    }

    const matches = [];
    for (let i = 0; i < ordered.length && matches.length < 3; i += 1) {
      const item = ordered[i];
      const vocab = vocabMap.get(item.word.toLowerCase());
      if (!vocab) continue;
      const conf = i === 0 && overrideConfidence !== null ? overrideConfidence : item.prob;
      matches.push({
        word: vocab.word,
        facet: item.facet || null,
        confidence: Math.round(conf * 1000) / 1000,
        vocabulary: vocab
      });
    }
    return matches;
  }

  _buildFacets(rawFacets, vocabMap) {
    if (!Array.isArray(rawFacets)) return [];
    const out = [];
    for (const f of rawFacets) {
      const vocab = vocabMap.get(String(f.word || '').toLowerCase());
      if (!vocab) continue;
      out.push({
        facet: f.facet,
        facetLabelVi: f.facet_label_vi || f.facet,
        word: vocab.word,
        confidence: Math.round((Number(f.prob) || 0) * 1000) / 1000,
        withinFacetConfidence: Math.round((Number(f.within_facet_prob) || 0) * 1000) / 1000,
        vocabulary: vocab
      });
    }
    return out;
  }

  _scheduleAsyncRefine(normalized, hash, dhash, topK, vocabMap, initialResult) {
    const jobId = crypto.randomUUID();
    const job = {
      jobId,
      status: 'pending',
      result: null,
      createdAt: Date.now()
    };
    this.refineJobs.set(jobId, job);

    // Prune stale jobs (> 5 mins)
    const now = Date.now();
    for (const [k, v] of this.refineJobs.entries()) {
      if (now - v.createdAt > 5 * 60 * 1000) this.refineJobs.delete(k);
    }

    (async () => {
      try {
        this.metrics.tier2Calls += 1;
        const vlmBuffer = await this._downscaleForVlm(normalized);
        const vlmRes = await this._callTier2Ollama(vlmBuffer, topK.slice(0, 5), vocabMap);
        let refined;
        if (vlmRes.selected_word === 'none' || !vocabMap.has(vlmRes.selected_word.toLowerCase())) {
          refined = {
            ...initialResult,
            status: 'out_of_scope',
            tier: 2,
            preliminary: false,
            message: OFF_TOPIC_MESSAGE,
            matches: [],
            facets: []
          };
        } else {
          const matches = this._buildMatches(topK, vocabMap, vlmRes.selected_word, vlmRes.confidence);
          refined = {
            ...initialResult,
            status: vlmRes.confidence >= (this.aiConfig.thresholds?.vlmConfidence || 0.55) ? 'matched' : 'uncertain',
            tier: 2,
            preliminary: false,
            message: `Đã tinh chỉnh: **${matches[0].vocabulary.word}** (${matches[0].vocabulary.meaning_vi}).`,
            matches
          };
        }
        job.status = 'done';
        job.result = refined;
        this.cache.set(hash, refined, dhash);
      } catch {
        this.metrics.tier2Fallbacks += 1;
        job.status = 'done';
        job.result = { ...initialResult, preliminary: false };
      }
    })();

    return jobId;
  }

  getRefineJob(jobId) {
    return this.refineJobs.get(jobId) || null;
  }

  /**
   * Main recognition entry point with persistent pHash/SHA cache, dedupe,
   * calibrated probe + multi-facet classification, and optional Tier-2 mode.
   */
  async identifyImage(fileBuffer, options = {}) {
    const startMs = Date.now();
    this.metrics.totalRequests += 1;

    if (!this.aiConfig.enabled) {
      throw new AppError('Tính năng AI nhận diện ảnh hiện đang tạm tắt.', 503);
    }

    if (options.action && !VALID_ACTIONS.has(options.action)) {
      return {
        status: 'out_of_scope',
        tier: 0,
        cached: false,
        message: 'Hệ thống chỉ hỗ trợ nhận diện ảnh mỹ thuật & mỹ nghệ trong EngLearn.',
        matches: [],
        facets: []
      };
    }

    const { normalized, hash, dhash } = await this.preprocessImage(fileBuffer);

    const hit = this.cache.get(hash, dhash);
    if (hit) {
      this.metrics.cacheHits += 1;
      const elapsed = Date.now() - startMs;
      this._recordLatency(elapsed);
      return {
        ...hit.value,
        imageHash: hash,
        cached: true,
        cacheType: hit.matchType,
        latencyMs: elapsed
      };
    }

    const existingInFlight = this.inFlight.get(hash) || findInFlightByDHash(this.inFlight, dhash, 2);
    if (existingInFlight) {
      this.metrics.dedupeHits += 1;
      const sharedResult = await existingInFlight.promise;
      const elapsed = Date.now() - startMs;
      this._recordLatency(elapsed);
      return {
        ...sharedResult,
        imageHash: hash,
        cached: true,
        deduped: true,
        latencyMs: elapsed
      };
    }

    const workPromise = this._executeCascade(normalized, hash, dhash, startMs);
    this.inFlight.set(hash, { promise: workPromise, dhash });

    try {
      return await workPromise;
    } finally {
      this.inFlight.delete(hash);
    }
  }

  async _executeCascade(normalized, hash, dhash, startMs) {
    const vocabMap = await this.getVocabMap();
    const t1 = await this._callTier1(normalized);
    const th = this.aiConfig.thresholds;

    const topK = Array.isArray(t1.top_k) ? t1.top_k : [];
    const isOod =
      topK.length === 0 ||
      t1.is_ood === true ||
      (t1.is_ood === undefined && (Number(t1.top1_text_sim) < th.lowSim || Number(t1.ood_margin) < th.oodMargin));

    const tier2Mode = this.aiConfig.tier2Mode || 'off';
    const isConfidentT1 =
      t1.confident_match === true ||
      (t1.confident_match === undefined &&
        Number(t1.top1_prob) >= th.highProb &&
        Number(t1.prob_margin) >= th.probMargin);

    let result;

    if (isOod) {
      this.metrics.tier1Rejected += 1;
      result = {
        status: 'out_of_scope',
        tier: 1,
        mode: t1.mode || 'zero_shot',
        cached: false,
        imageHash: hash,
        embId: t1.emb_id || null,
        message: OFF_TOPIC_MESSAGE,
        matches: [],
        facets: [],
        diagnostics: {
          top1Sim: t1.top1_text_sim,
          oodMargin: t1.ood_margin,
          oodProb: t1.ood_prob,
          oodLabel: t1.ood_label
        }
      };
    } else if (isConfidentT1 || tier2Mode === 'off' || tier2Mode === 'async') {
      this.metrics.tier1Matched += 1;
      const matches = this._buildMatches(topK, vocabMap);
      const facets = this._buildFacets(t1.facets, vocabMap);
      if (matches.length === 0) {
        result = {
          status: 'out_of_scope',
          tier: 1,
          mode: t1.mode || 'zero_shot',
          cached: false,
          imageHash: hash,
          message: OFF_TOPIC_MESSAGE,
          matches: [],
          facets: []
        };
      } else {
        const facetSummary = facets.length > 1
          ? ` (${facets.map((f) => f.vocabulary.word).join(' + ')})`
          : '';
        const status = isConfidentT1 ? 'matched' : 'uncertain';
        result = {
          status,
          tier: 1,
          mode: t1.mode || 'zero_shot',
          cached: false,
          imageHash: hash,
          embId: t1.emb_id || null,
          conformalSet: Array.isArray(t1.conformal_set) ? t1.conformal_set : undefined,
          message: isConfidentT1
            ? `Ảnh này thuộc loại hình **${matches[0].vocabulary.word}** (${matches[0].vocabulary.meaning_vi})${facetSummary}.`
            : `Ảnh có thể thuộc **${matches[0].vocabulary.word}** (${matches[0].vocabulary.meaning_vi}). Xem thêm các gợi ý bên dưới.`,
          matches,
          facets
        };

        if (!isConfidentT1 && tier2Mode === 'async') {
          result.preliminary = true;
          result.refineJobId = this._scheduleAsyncRefine(normalized, hash, dhash, topK, vocabMap, result);
        }
      }
    } else {
      // Sync Tier-2 escalation (only when AI_TIER2_MODE=sync)
      this.metrics.tier2Calls += 1;
      const facets = this._buildFacets(t1.facets, vocabMap);
      try {
        const vlmBuffer = await this._downscaleForVlm(normalized);
        const vlmRes = await this._callTier2Ollama(vlmBuffer, topK.slice(0, 5), vocabMap);

        if (vlmRes.selected_word === 'none' || !vocabMap.has(vlmRes.selected_word.toLowerCase())) {
          result = {
            status: 'out_of_scope',
            tier: 2,
            cached: false,
            imageHash: hash,
            message: OFF_TOPIC_MESSAGE,
            matches: [],
            facets: []
          };
        } else {
          const matches = this._buildMatches(topK, vocabMap, vlmRes.selected_word, vlmRes.confidence);
          const confident = vlmRes.confidence >= th.vlmConfidence;
          result = {
            status: confident ? 'matched' : 'uncertain',
            tier: 2,
            cached: false,
            imageHash: hash,
            message: confident
              ? `Ảnh này nhiều khả năng thuộc loại hình **${matches[0].vocabulary.word}** (${matches[0].vocabulary.meaning_vi}).`
              : `Ảnh hơi khó phân biệt; gợi ý gần nhất là **${matches[0].vocabulary.word}** (${matches[0].vocabulary.meaning_vi}).`,
            matches,
            facets
          };
        }
      } catch (err) {
        this.metrics.tier2Fallbacks += 1;
        const matches = this._buildMatches(topK, vocabMap);
        const reason =
          err instanceof QueueFullError
            ? 'GPU đang bận nên dùng kết quả nhanh từ bộ phân loại.'
            : err instanceof QueueTimeoutError
              ? 'Xác minh sâu vượt thời gian chờ nên dùng gợi ý nhanh.'
              : 'Đang dùng kết quả gợi ý nhanh từ bộ phân loại.';
        result = matches.length > 0
          ? {
              status: 'uncertain',
              tier: 1,
              fallback: true,
              cached: false,
              imageHash: hash,
              message: `${reason} Gợi ý gần nhất: **${matches[0].vocabulary.word}** (${matches[0].vocabulary.meaning_vi}).`,
              matches,
              facets
            }
          : {
              status: 'out_of_scope',
              tier: 1,
              fallback: true,
              cached: false,
              imageHash: hash,
              message: OFF_TOPIC_MESSAGE,
              matches: [],
              facets: []
            };
      }
    }

    const elapsed = Date.now() - startMs;
    this._recordLatency(elapsed);
    result.latencyMs = elapsed;
    this.cache.set(hash, result, dhash);
    return result;
  }

  async checkHealth() {
    const now = Date.now();
    if (this._healthCache && now - this._healthCacheAt < 3000) {
      return {
        ...this._healthCache,
        metrics: this.getMetrics()
      };
    }

    const ping = async (url) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      try {
        const res = await this.fetchImpl(url, { signal: controller.signal });
        if (!res.ok) return { ok: false, status: res.status };
        const json = await res.json().catch(() => ({}));
        return { ok: true, data: json };
      } catch (err) {
        return { ok: false, error: err.message };
      } finally {
        clearTimeout(timer);
      }
    };

    const tier2Mode = this.aiConfig.tier2Mode || 'off';
    const [tier1, ollama] = await Promise.all([
      ping(`${this.aiConfig.aiServiceUrl}/health`),
      tier2Mode === 'off' ? Promise.resolve({ ok: false, skipped: true }) : ping(`${this.aiConfig.ollamaUrl}/api/tags`)
    ]);

    const models = Array.isArray(ollama.data?.models) ? ollama.data.models.map((m) => m.name) : [];
    const visionModelName = this.aiConfig.visionModel;
    const hasVisionModel = models.some((m) => m === visionModelName || m.startsWith(`${visionModelName}:`));

    const baseHealth = {
      enabled: this.aiConfig.enabled,
      ready: Boolean(tier1.ok && tier1.data?.status === 'ok'),
      tier1: {
        ok: Boolean(tier1.ok && tier1.data?.status === 'ok'),
        device: tier1.data?.device || null,
        mode: tier1.data?.mode || null,
        numClasses: tier1.data?.num_classes || 0,
        numFacets: tier1.data?.num_facets || 0,
        queueSize: tier1.data?.queue_size || 0
      },
      tier2: {
        mode: tier2Mode,
        ok: tier2Mode === 'off' ? false : Boolean(ollama.ok && hasVisionModel),
        ollamaReachable: Boolean(ollama.ok),
        visionModel: visionModelName,
        modelLoaded: hasVisionModel,
        queueWaiting: this.tier2Queue.size,
        queueActive: this.tier2Queue.activeCount
      },
      thresholds: this.aiConfig.thresholds
    };

    this._healthCache = baseHealth;
    this._healthCacheAt = Date.now();

    return {
      ...baseHealth,
      metrics: this.getMetrics()
    };
  }
}

const defaultInstance = new VisionService();

module.exports = defaultInstance;
module.exports.VisionService = VisionService;
module.exports.OFF_TOPIC_MESSAGE = OFF_TOPIC_MESSAGE;
