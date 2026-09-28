const { Vocabulary } = require('../models');

/**
 * Gọi Google Translate Web API với client=dict-chrome-ex
 */
async function fetchGoogleTranslate(text, sl = 'auto', tl = 'vi') {
  const clients = ['dict-chrome-ex', 'gtx'];
  let lastError = null;

  for (const client of clients) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=${client}&sl=${sl}&tl=${tl}&dt=t&dt=bd&dt=rm&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const translated = data[0]?.map(item => item[0]).filter(Boolean).join('') || '';
        const detectedLang = data[2] || sl;
        const dictionary = (data[1] || []).map(dictItem => ({
          partOfSpeech: dictItem[0],
          terms: dictItem[1]?.slice(0, 5) || []
        }));

        if (translated) {
          return { translated, detectedLang, dictionary };
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Google Translate failed');
}

/**
 * Fallback: Dịch qua MyMemory API
 */
async function fetchMyMemory(text, sl = 'en', tl = 'vi') {
  const s = sl === 'auto' ? 'en' : sl;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${s}|${tl}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('MyMemory API error');
  const data = await res.json();
  const translated = data.responseData?.translatedText || '';
  return {
    translated,
    detectedLang: s,
    dictionary: []
  };
}

/**
 * Wrapper dịch có cơ chế Fallback tự động
 */
async function translateWithFallback(text, sl = 'auto', tl = 'vi') {
  try {
    return await fetchGoogleTranslate(text, sl, tl);
  } catch (err) {
    console.warn('Google Translate unavailable, trying MyMemory:', err.message);
    try {
      return await fetchMyMemory(text, sl, tl);
    } catch (fallbackErr) {
      console.warn('MyMemory also failed:', fallbackErr.message);
      throw new Error('Dịch vụ dịch tạm thời gián đoạn');
    }
  }
}

/**
 * POST /api/translate
 * Body: { text, fullWord, context, source, target }
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
      console.warn('Local vocab lookup warning:', dbErr.message);
    }

    // 2. Dịch từ chính
    let wordResult;
    try {
      wordResult = await translateWithFallback(queryWord, source, target);
    } catch (err) {
      // Nếu dịch mạng thất bại nhưng có từ trong DB
      if (localVocab) {
        wordResult = {
          translated: localVocab.meaning_vi,
          detectedLang: 'en',
          dictionary: [{ partOfSpeech: localVocab.part_of_speech, terms: [localVocab.meaning_vi] }]
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

    // 3. Dịch câu ngữ cảnh (nếu có context)
    let contextTranslation = '';
    if (context && context.trim().length > queryWord.length) {
      try {
        const ctxRes = await translateWithFallback(context.trim(), effectiveSource, effectiveTarget);
        contextTranslation = ctxRes.translated;
      } catch (ctxErr) {
        console.warn('Context translation warning:', ctxErr.message);
      }
    }

    return res.json({
      status: 'success',
      data: {
        original: queryWord,
        translation: wordResult.translated,
        sourceLang: effectiveSource,
        targetLang: effectiveTarget,
        dictionary: wordResult.dictionary,
        contextSentence: context || null,
        contextTranslation: contextTranslation || null,
        phonetic: localVocab?.pronunciation || null,
        localMeaning: localVocab?.meaning_vi || null,
        exampleSentence: localVocab?.example_sentence || null,
        exampleTranslation: localVocab?.example_translation || null,
        difficulty: localVocab?.difficulty || null
      }
    });
  } catch (error) {
    next(error);
  }
};
