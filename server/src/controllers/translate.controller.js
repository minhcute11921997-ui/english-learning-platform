const { Vocabulary } = require('../models');
const translationService = require('../services/translate/translationService');

/**
 * POST /api/translate
 * Body: { text, fullWord, context, source, target }
 *
 * Luồng xử lý:
 * 1. Tra cứu từ vựng nội bộ trong DB (nếu là từ tiếng Anh đơn giản)
 * 2. Gọi TranslationService (AI → Google → MyMemory theo thứ tự ưu tiên)
 * 3. Dịch câu ngữ cảnh (nếu người dùng bôi cả câu)
 * 4. Trả về kết quả tổng hợp
 */
exports.translateSelection = async (req, res, next) => {
  try {
    const { text, fullWord, context, source = 'auto', target = 'vi' } = req.body;
    const queryWord = (fullWord || text || '').trim();

    if (!queryWord) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp nội dung cần dịch'
      });
    }

    // 1. Tra cứu từ vựng nội bộ trong DB trước (nếu là từ tiếng Anh đơn)
    let localVocab = null;
    try {
      localVocab = await Vocabulary.findOne({
        where: { word: queryWord.toLowerCase() }
      });
    } catch (dbErr) {
      console.warn('[TranslateController] Local vocab lookup warning:', dbErr.message);
    }

    // 2. Dịch từ chính qua TranslationService (AI → Google → MyMemory)
    let wordResult;
    try {
      wordResult = await translationService.translate(queryWord, source, target, context || '');
    } catch (err) {
      // Nếu tất cả dịch vụ thất bại nhưng có từ trong DB → dùng DB
      if (localVocab) {
        console.warn('[TranslateController] All providers failed, using local DB:', err.message);
        wordResult = {
          translated: localVocab.meaning_vi,
          detectedLang: 'en',
          dictionary: [{ partOfSpeech: localVocab.part_of_speech, terms: [localVocab.meaning_vi] }],
          provider: 'local_db'
        };
      } else {
        throw err;
      }
    }

    // Xác định chiều dịch thực tế
    const effectiveSource = source === 'auto' ? wordResult.detectedLang : source;
    let effectiveTarget = target;
    if (effectiveSource === target) {
      effectiveTarget = target === 'vi' ? 'en' : 'vi';
    }

    // 3. Dịch câu ngữ cảnh (nếu có context và dài hơn từ đang dịch)
    let contextTranslation = '';
    if (context && context.trim().length > queryWord.length) {
      try {
        const ctxRes = await translationService.translate(
          context.trim(),
          effectiveSource,
          effectiveTarget
        );
        contextTranslation = ctxRes.translated;
      } catch (ctxErr) {
        console.warn('[TranslateController] Context translation warning:', ctxErr.message);
      }
    }

    return res.json({
      status: 'success',
      data: {
        original: queryWord,
        translation: wordResult.translated,
        sourceLang: effectiveSource,
        targetLang: effectiveTarget,
        dictionary: wordResult.dictionary || [],
        contextSentence: context || null,
        contextTranslation: contextTranslation || null,
        phonetic: localVocab?.pronunciation || null,
        localMeaning: localVocab?.meaning_vi || null,
        exampleSentence: localVocab?.example_sentence || null,
        exampleTranslation: localVocab?.example_translation || null,
        difficulty: localVocab?.difficulty || null,
        provider: wordResult.provider || 'unknown'  // debug: biết dùng provider nào
      }
    });
  } catch (error) {
    next(error);
  }
};
