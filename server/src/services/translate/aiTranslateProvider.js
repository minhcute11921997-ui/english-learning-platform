/**
 * AI Translate Provider — Ollama (model fine-tuned EN↔VI)
 *
 * Gọi model Gemma 3 4B đã được fine-tune cho cặp ngôn ngữ EN↔VI,
 * chạy local qua Ollama server.
 *
 * Cách kích hoạt:
 *   1. Train model: xem tools/training/README.md
 *   2. Chạy: ollama serve
 *   3. Set trong .env:
 *      TRANSLATE_AI_ENABLED=true
 *      TRANSLATE_AI_PROVIDER=ollama
 *      OLLAMA_BASE_URL=http://localhost:11434   (hoặc IP máy RTX)
 *      OLLAMA_MODEL=vi-en-translator
 *      TRANSLATE_AI_TIMEOUT_MS=8000
 *
 * Output format từ model:
 *   { "translated": "...", "dictionary": [...], "explanation": "...", "error": false }
 */

const AI_ENABLED = process.env.TRANSLATE_AI_ENABLED === 'true';
const PROVIDER   = process.env.TRANSLATE_AI_PROVIDER || 'ollama';
const OLLAMA_URL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'vi-en-translator';
const TIMEOUT_MS = parseInt(process.env.TRANSLATE_AI_TIMEOUT_MS || '8000', 10);

// Chỉ hỗ trợ cặp EN↔VI
const SUPPORTED_LANG_PAIRS = new Set(['en-vi', 'vi-en', 'auto-vi', 'auto-en']);

/**
 * Xây dựng prompt chuyên biệt cho dịch EN↔VI.
 * @param {string} text - Văn bản cần dịch
 * @param {string} sl   - Ngôn ngữ nguồn ('en', 'vi', 'auto')
 * @param {string} tl   - Ngôn ngữ đích ('vi', 'en')
 * @param {string} context - Câu ngữ cảnh (tùy chọn)
 */
function buildPrompt(text, sl, tl, context) {
  const isEnToVi = tl === 'vi';
  const isSingleWord = !text.includes(' ');

  let directionLine;
  if (isEnToVi) {
    directionLine = 'Translate from English to Vietnamese:';
  } else {
    directionLine = 'Dịch từ tiếng Việt sang tiếng Anh:';
  }

  const contextLine = context && context !== text
    ? `\nContext sentence: "${context}"`
    : '';

  const dictNote = isSingleWord
    ? '\nInclude dictionary entries with part of speech if it is a single word.'
    : '';

  return `${directionLine}\n\n"${text}"${contextLine}${dictNote}

Return ONLY valid JSON:
{
  "translated": "<bản dịch chính>",
  "dictionary": [{"partOfSpeech": "noun|verb|adj|adv|phrase", "terms": ["nghĩa 1"]}],
  "explanation": "<ghi chú ngắn bằng tiếng Việt hoặc null>",
  "error": false
}`;
}

/**
 * Parse JSON từ response của model.
 * Model có thể trả về JSON thuần hoặc có markdown wrapper.
 */
function parseModelResponse(raw) {
  // Loại bỏ markdown code block nếu có
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Thử parse JSON trực tiếp
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.error === true) {
      throw new Error('Model báo không dịch được (error: true)');
    }
    if (!parsed.translated) {
      throw new Error('Model không trả về trường "translated"');
    }
    return parsed;
  } catch (parseErr) {
    // Thử tìm JSON trong text (model đôi khi thêm text trước JSON)
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.translated) return parsed;
    }
    throw new Error(`Không parse được response: ${parseErr.message} | Raw: ${cleaned.slice(0, 100)}`);
  }
}

/**
 * Gọi Ollama API với timeout.
 */
async function callOllama(prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          top_k: 40,
          num_predict: 256,
          repeat_penalty: 1.1,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.response || '';
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hàm dịch chính của AI provider.
 * Chỉ xử lý cặp ngôn ngữ EN↔VI. Các cặp khác → throw để fallback Google.
 *
 * @param {string} text    - Từ / cụm từ / câu cần dịch
 * @param {string} sl      - Ngôn ngữ nguồn ('auto', 'en', 'vi', ...)
 * @param {string} tl      - Ngôn ngữ đích ('vi', 'en', ...)
 * @param {string} context - Câu ngữ cảnh (tùy chọn)
 * @returns {Promise<{translated, detectedLang, dictionary, explanation, provider}>}
 */
async function translate(text, sl = 'auto', tl = 'vi', context = '') {
  if (!AI_ENABLED) {
    throw new Error('AI translate chưa được kích hoạt (TRANSLATE_AI_ENABLED != true)');
  }

  // Kiểm tra cặp ngôn ngữ — chỉ xử lý EN↔VI
  const langPair = `${sl}-${tl}`;
  if (!SUPPORTED_LANG_PAIRS.has(langPair)) {
    throw new Error(`AI provider chỉ hỗ trợ EN↔VI, không hỗ trợ ${sl}→${tl}`);
  }

  const prompt = buildPrompt(text, sl, tl, context);

  let rawResponse;
  try {
    rawResponse = await callOllama(prompt);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Ollama timeout sau ${TIMEOUT_MS}ms`);
    }
    throw new Error(`Lỗi gọi Ollama (${OLLAMA_URL}): ${err.message}`);
  }

  const parsed = parseModelResponse(rawResponse);

  return {
    translated:   parsed.translated,
    detectedLang: sl === 'auto' ? (tl === 'vi' ? 'en' : 'vi') : sl,
    dictionary:   parsed.dictionary || [],
    explanation:  parsed.explanation || null,
    provider:     `ai-ollama:${OLLAMA_MODEL}`,
  };
}

/**
 * Kiểm tra Ollama có đang chạy không.
 * isAvailable() được gọi bởi TranslationService trước khi invoke translate().
 */
function isAvailable() {
  return AI_ENABLED;
}

module.exports = { translate, name: 'ai-ollama', isAvailable };
