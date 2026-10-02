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
 * 1. Làm sạch ký tự dấu thừa ở đầu/cuối (như dấu hai chấm, gạch đầu dòng...)
 * 2. Tự động mở rộng từ nếu người dùng bôi thiếu một vài ký tự trong từ
 * 3. Trích xuất chuẩn xác câu ngữ cảnh chứa từ (chỉ khi bôi từ/cụm ngắn)
 * 4. Tính toán tọa độ và biên giới hạn màn hình
 */
export function getSmartSelectionData() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  let rawText = selection.toString().trim();
  if (!rawText) return null;

  // Loại bỏ các ký tự dấu ngăn cách thừa ở đầu hoặc cuối vùng bôi (như ": ", "- ", ", ", ". ")
  rawText = rawText.replace(/^[:\s\-–—\.\,\;\?\!]+|[:\s\-–—\.\,\;\?\!]+$/g, '').trim();
  if (!rawText) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Bỏ qua nếu vùng chọn không có kích thước thực tế
  if (rect.width === 0 && rect.height === 0) return null;

  let fullWord = rawText;
  const startNode = range.startContainer;
  const endNode = range.endContainer;

  // 1. Tự động mở rộng từ/cụm từ nếu người dùng bôi thiếu ký tự ở đầu hoặc cuối
  // Áp dụng cho cả từ đơn và cụm từ (dưới 150 ký tự)
  if (rawText.length < 150) {
    let start = range.startOffset;
    let end = range.endOffset;
    let startExpanded = false;
    let endExpanded = false;

    // Mở rộng đầu: nếu vị trí bắt đầu cắt ngang một từ
    if (startNode && startNode.nodeType === Node.TEXT_NODE) {
      const startText = startNode.textContent || '';
      while (start < startText.length && /\s/.test(startText[start])) {
        start++;
      }
      if (start > 0 && isWordChar(startText[start - 1]) && isWordChar(startText[start])) {
        while (start > 0 && isWordChar(startText[start - 1])) {
          start--;
        }
        startExpanded = true;
      }
    }

    // Mở rộng cuối: nếu vị trí kết thúc cắt ngang một từ
    if (endNode && endNode.nodeType === Node.TEXT_NODE) {
      const endText = endNode.textContent || '';
      while (end > 0 && /\s/.test(endText[end - 1])) {
        end--;
      }
      if (end > 0 && end < endText.length && isWordChar(endText[end - 1]) && isWordChar(endText[end])) {
        while (end < endText.length && isWordChar(endText[end])) {
          end++;
        }
        endExpanded = true;
      }
    }

    if (startExpanded || endExpanded) {
      if (startNode === endNode && startNode && startNode.nodeType === Node.TEXT_NODE) {
        const expanded = (startNode.textContent || '').slice(start, end).trim();
        if (expanded) {
          fullWord = expanded.replace(/^[:\s\-–—\.\,\;\?\!]+|[:\s\-–—\.\,\;\?\!]+$/g, '').trim();
        }
      } else {
        const prefix = (startExpanded && startNode?.textContent) ? startNode.textContent.slice(start, range.startOffset) : '';
        const suffix = (endExpanded && endNode?.textContent) ? endNode.textContent.slice(range.endOffset, end) : '';
        const combined = `${prefix}${rawText}${suffix}`.trim();
        if (combined) {
          fullWord = combined.replace(/^[:\s\-–—\.\,\;\?\!]+|[:\s\-–—\.\,\;\?\!]+$/g, '').trim();
        }
      }
    }
  }

  // 2. Trích xuất câu ngữ cảnh bao quanh
  // CHỈ trích xuất khi người dùng bôi từ hoặc cụm từ ngắn (< 45 ký tự và <= 5 từ).
  // Nếu người dùng đã bôi cả câu dài, bản thân vùng bôi đã là câu hoàn chỉnh nên không cần ngữ cảnh thừa.
  let contextSentence = null;
  const wordCount = fullWord.split(/\s+/).length;

  if (fullWord.length < 80 && wordCount <= 8) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    // Tìm thẻ đoạn văn hoặc khối chứa gần nhất (P, DIV, LI, BLOCKQUOTE,...)
    let blockEl = container;
    while (blockEl && !['P', 'DIV', 'LI', 'BLOCKQUOTE', 'ARTICLE', 'SECTION', 'H1', 'H2', 'H3', 'H4'].includes(blockEl.tagName)) {
      if (!blockEl.parentElement || blockEl.tagName === 'BODY') break;
      blockEl = blockEl.parentElement;
    }

    const blockText = (blockEl?.innerText || blockEl?.textContent || container?.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();

    if (blockText && blockText.length > fullWord.length + 8) {
      // Tách văn bản thành các câu dựa trên dấu chấm, hỏi, cảm
      const sentences = blockText.split(/(?<=[.!?])\s+/);
      const matched = sentences.find((s) => s.toLowerCase().includes(fullWord.toLowerCase()));

      if (matched) {
        const cleanSentence = matched.trim();
        // Kiểm tra câu ngữ cảnh hợp lệ: dài hơn từ gốc, tối thiểu 12 ký tự, có từ ngữ thực tế
        if (
          cleanSentence.length > fullWord.length + 5 &&
          cleanSentence.length >= 12 &&
          /[a-zA-ZÀ-ỹ]{3,}/.test(cleanSentence)
        ) {
          contextSentence = cleanSentence;
        }
      }
    }
  }

  const langs = detectLanguage(fullWord);

  return {
    rawText,
    fullWord,
    contextSentence,
    source: langs.source,
    target: langs.target,
    rect: {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top,
      viewportTop: rect.top,
      viewportBottom: rect.bottom
    }
  };
}
