/**
 * TranslationService — Điều phối các translation provider
 *
 * Chiến lược ưu tiên:
 *   1. AI Provider (nếu TRANSLATE_AI_ENABLED=true)
 *   2. Google Translate (unofficial web API)
 *   3. MyMemory (built-in fallback trong googleTranslateProvider)
 *
 * Cách thêm provider mới:
 *   1. Tạo file provider trong thư mục này (phải export: translate(text, sl, tl), name, isAvailable?)
 *   2. Import và thêm vào mảng PROVIDERS bên dưới theo thứ tự ưu tiên
 */

const googleProvider = require('./googleTranslateProvider');
const aiProvider = require('./aiTranslateProvider');

/**
 * Danh sách provider theo thứ tự ưu tiên.
 * Provider đầu tiên được thử trước, nếu fail thì thử provider tiếp theo.
 */
const PROVIDERS = [
  aiProvider,      // Ưu tiên 1: AI (bật/tắt qua env TRANSLATE_AI_ENABLED)
  googleProvider,  // Ưu tiên 2: Google Translate (luôn sẵn sàng, có fallback MyMemory)
];

/**
 * Dịch văn bản với cơ chế fallback tự động giữa các provider.
 *
 * @param {string} text - Từ / cụm từ / câu cần dịch
 * @param {string} sl - Ngôn ngữ nguồn ('auto', 'en', 'vi', ...)
 * @param {string} tl - Ngôn ngữ đích ('vi', 'en', ...)
 * @param {string} [context] - Câu ngữ cảnh xung quanh (tùy chọn, dùng cho AI)
 * @returns {Promise<{translated: string, detectedLang: string, dictionary: Array, provider: string}>}
 * @throws {Error} Khi tất cả provider đều thất bại
 */
async function translate(text, sl = 'auto', tl = 'vi', context = '') {
  const errors = [];

  for (const provider of PROVIDERS) {
    // Bỏ qua provider nếu nó khai báo chính nó không sẵn sàng
    if (typeof provider.isAvailable === 'function' && !provider.isAvailable()) {
      continue;
    }

    try {
      const result = await provider.translate(text, sl, tl, context);
      if (result && result.translated) {
        return result;
      }
    } catch (err) {
      errors.push(`[${provider.name}] ${err.message}`);
      console.warn(`[TranslationService] Provider "${provider.name}" failed:`, err.message);
    }
  }

  throw new Error(`Tất cả dịch vụ dịch đều thất bại: ${errors.join(' | ')}`);
}

module.exports = { translate };
