/**
 * Google Translate Provider
 * Gọi Google Translate Web API (unofficial) với cơ chế thử nhiều client.
 * Fallback sang MyMemory nếu Google Translate không phản hồi.
 */

/**
 * Gọi Google Translate với nhiều client thử lần lượt
 * @param {string} text - Văn bản cần dịch
 * @param {string} sl - Ngôn ngữ nguồn ('auto', 'en', 'vi', ...)
 * @param {string} tl - Ngôn ngữ đích ('vi', 'en', ...)
 * @returns {Promise<{translated: string, detectedLang: string, dictionary: Array}>}
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
          return { translated, detectedLang, dictionary, provider: 'google' };
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Google Translate failed');
}

/**
 * Fallback: Dịch qua MyMemory API (free, giới hạn 5000 ký tự/ngày)
 * @param {string} text
 * @param {string} sl
 * @param {string} tl
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
    dictionary: [],
    provider: 'mymemory'
  };
}

/**
 * Hàm dịch chính của provider này:
 * Google Translate → (nếu lỗi) → MyMemory
 *
 * @param {string} text
 * @param {string} sl
 * @param {string} tl
 * @returns {Promise<{translated: string, detectedLang: string, dictionary: Array, provider: string}>}
 */
async function translate(text, sl = 'auto', tl = 'vi') {
  try {
    return await fetchGoogleTranslate(text, sl, tl);
  } catch (err) {
    console.warn('[GoogleTranslateProvider] Google Translate unavailable, trying MyMemory:', err.message);
    return await fetchMyMemory(text, sl, tl);
  }
}

module.exports = { translate, name: 'google' };
