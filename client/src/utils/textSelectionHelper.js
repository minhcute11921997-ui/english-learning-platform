// Kiểm tra ký tự thuộc từ vựng (hỗ trợ cả chữ cái tiếng Anh, số, và chữ tiếng Việt có dấu)
const isWordChar = (char) => /[a-zA-Z0-9_\u00C0-\u1EF9]/.test(char);

/**
 * Nhận diện ngôn ngữ tự động dựa trên ký tự tiếng Việt có dấu
 */
export function detectLanguage(text) {
  const vietnameseRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  return vietnameseRegex.test(text)
    ? { source: 'vi', target: 'en' }
    : { source: 'en', target: 'vi' };
}

/**
 * Thu thập dữ liệu bôi đen thông minh:
 * 1. Tự động mở rộng từ nếu người dùng bôi thiếu
 * 2. Trích xuất cả câu chứa từ để dịch chuẩn ngữ cảnh
 * 3. Tính toán vị trí hiển thị Tooltip
 */
export function getSmartSelectionData() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const rawText = selection.toString().trim();
  if (!rawText) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Bỏ qua nếu vùng chọn không có kích thước thực tế
  if (rect.width === 0 && rect.height === 0) return null;

  let fullWord = rawText;
  let contextSentence = rawText;
  const startNode = range.startContainer;

  // Xử lý mở rộng từ và ngữ cảnh nếu nằm trong Text Node
  if (startNode && startNode.nodeType === Node.TEXT_NODE) {
    const fullText = startNode.textContent || '';
    let start = range.startOffset;
    let end = range.endOffset;

    // 1. Tự động mở rộng ra từ hoàn chỉnh nếu bôi thiếu (chỉ áp dụng khi bôi ngắn, ví dụ 1 từ hoặc cụm ngắn)
    if (!rawText.includes('\n') && rawText.length < 50) {
      // Mở rộng lùi về đầu từ
      while (start > 0 && isWordChar(fullText[start - 1])) {
        start--;
      }
      // Mở rộng tiến đến cuối từ
      while (end < fullText.length && isWordChar(fullText[end])) {
        end++;
      }
      fullWord = fullText.slice(start, end).trim() || rawText;
    }

    // 2. Trích xuất câu ngữ cảnh bao quanh
    const beforeText = fullText.slice(0, start);
    const sMatch = beforeText.match(/.*[.!?\n]\s*/s);
    const sentenceStart = sMatch ? sMatch[0].length : 0;

    const afterText = fullText.slice(end);
    const eMatch = afterText.match(/^[^.!?\n]*[.!?\n]?/);
    const sentenceEnd = end + (eMatch ? eMatch[0].length : afterText.length);

    contextSentence = fullText.slice(sentenceStart, sentenceEnd).trim() || fullWord;
  }

  const langs = detectLanguage(fullWord);

  return {
    rawText,
    fullWord,
    isExpanded: fullWord.toLowerCase() !== rawText.toLowerCase(),
    contextSentence,
    source: langs.source,
    target: langs.target,
    rect: {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top
    }
  };
}
