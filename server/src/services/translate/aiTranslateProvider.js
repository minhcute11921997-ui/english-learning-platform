/**
 * AI Translate Provider — Placeholder
 *
 * TODO: Implement khi có model AI chuyên dụng EN↔VI.
 *
 * Kế hoạch triển khai:
 * - Dùng model fine-tuned (Gemini / Llama / ViT5) cho cặp ngôn ngữ EN-VI
 * - Input:  { text, context, sourceLang, targetLang }
 * - Output: { translated, detectedLang, dictionary, explanation, provider }
 *
 * Lợi thế so với Google Translate:
 * - Hiểu ngữ cảnh sâu hơn (idioms, collocations, slang)
 * - Trả về giải thích ngữ pháp / ghi chú dịch thuật
 * - Không bị rate limit bởi bên thứ 3
 *
 * Cách kích hoạt:
 * 1. Set TRANSLATE_AI_ENABLED=true trong .env
 * 2. Điền TRANSLATE_AI_API_KEY và TRANSLATE_AI_MODEL_URL vào .env
 * 3. Implement hàm callAIModel() bên dưới
 */

const AI_ENABLED = process.env.TRANSLATE_AI_ENABLED === 'true';

/**
 * [TODO] Gọi AI model để dịch
 * @param {string} text - Văn bản cần dịch
 * @param {string} sl - Ngôn ngữ nguồn
 * @param {string} tl - Ngôn ngữ đích
 * @param {string} [context] - Câu ngữ cảnh (nếu có)
 * @returns {Promise<{translated: string, detectedLang: string, dictionary: Array, explanation: string, provider: string}>}
 */
async function callAIModel(text, sl, tl, context = '') {
  // TODO: Thay thế bằng call thực tế khi có model
  // Ví dụ với Gemini:
  //
  // const { GoogleGenerativeAI } = require('@google/generative-ai');
  // const genAI = new GoogleGenerativeAI(process.env.TRANSLATE_AI_API_KEY);
  // const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  //
  // const prompt = buildTranslatePrompt(text, sl, tl, context);
  // const result = await model.generateContent(prompt);
  // const response = result.response.text();
  // return parseAIResponse(response);

  throw new Error('AI translate model chưa được cấu hình');
}

/**
 * [TODO] Tạo prompt chuẩn cho AI dịch EN↔VI
 */
// function buildTranslatePrompt(text, sl, tl, context) {
//   return `You are an expert English-Vietnamese translator.
// Translate the word/phrase: "${text}" (${sl} → ${tl})
// ${context ? `Context sentence: "${context}"` : ''}
//
// Return JSON:
// {
//   "translated": "<bản dịch>",
//   "dictionary": [{ "partOfSpeech": "noun", "terms": ["..."] }],
//   "explanation": "<ghi chú ngữ pháp hoặc ngữ cảnh nếu cần>"
// }`;
// }

/**
 * Hàm dịch chính của AI provider.
 * Nếu AI chưa được bật hoặc lỗi → throw để TranslationService xử lý fallback.
 */
async function translate(text, sl = 'auto', tl = 'vi', context = '') {
  if (!AI_ENABLED) {
    throw new Error('AI translate chưa được kích hoạt (TRANSLATE_AI_ENABLED != true)');
  }
  return await callAIModel(text, sl, tl, context);
}

module.exports = { translate, name: 'ai', isAvailable: () => AI_ENABLED };
