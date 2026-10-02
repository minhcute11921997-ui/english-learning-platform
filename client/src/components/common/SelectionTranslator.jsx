import { useState, useEffect, useRef } from 'react';
import axios from '@/api/axios';
import { getSmartSelectionData } from '@/utils/textSelectionHelper';
import {
  HiOutlineSpeakerWave,
  HiOutlineArrowsRightLeft,
  HiOutlineXMark,
  HiOutlineBookOpen,
  HiOutlineChevronDown,
  HiOutlineChevronUp
} from 'react-icons/hi2';

export default function SelectionTranslator() {
  const [selectionData, setSelectionData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [langs, setLangs] = useState({ source: 'en', target: 'vi' });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, placement: 'bottom' });
  const tooltipRef = useRef(null);

  // Lắng nghe sự kiện bôi đen (mouseup)
  useEffect(() => {
    const handleMouseUp = (e) => {
      // Nếu click bên trong tooltip thì không đóng
      if (tooltipRef.current && tooltipRef.current.contains(e.target)) {
        return;
      }

      // Trì hoãn một chút để window.getSelection() cập nhật chính xác
      setTimeout(() => {
        const data = getSmartSelectionData();
        if (data && data.rawText.length > 0) {
          // Bỏ qua nếu bôi đen trong input hoặc textarea
          const activeEl = document.activeElement;
          if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            return;
          }

          setSelectionData(data);
          setShowContext(false); // Luôn ẩn ngữ cảnh mặc định để tooltip gọn gàng
          const initLangs = { source: data.source, target: data.target };
          setLangs(initLangs);

          // Tính toán vị trí hiển thị thông minh:
          // Ưu tiên hiển thị BÊN DƯỚI vùng bôi để tránh bị che khuất ở mép trên màn hình
          const tooltipWidth = 330;
          const viewportTop = data.rect.viewportTop !== undefined ? data.rect.viewportTop : data.rect.clientY;
          const viewportBottom = data.rect.viewportBottom !== undefined ? data.rect.viewportBottom : (data.rect.clientY + data.rect.height);

          const spaceAbove = viewportTop;
          const spaceBelow = window.innerHeight - viewportBottom;

          let placement = 'bottom';
          let top = data.rect.top + data.rect.height + 8;

          // Tự động xử lý khi ở mép dưới màn hình:
          // Nếu khoảng trống phía dưới < 220px VÀ phía trên có nhiều chỗ hơn -> Lật popup lên trên
          if (spaceBelow < 220 && spaceAbove > spaceBelow) {
            placement = 'top';
            top = data.rect.top - 8;
          }

          // Căn giữa theo từ được bôi và đảm bảo không tràn ra ngoài màn hình
          let left = data.rect.left + (data.rect.width / 2) - (tooltipWidth / 2);
          left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));

          setTooltipPos({ top, left, placement });
          fetchTranslation(data, initLangs.source, initLangs.target);
        } else {
          setSelectionData(null);
          setResult(null);
          setShowContext(false);
        }
      }, 60);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectionData(null);
        setResult(null);
        setShowContext(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchTranslation = async (selData, source, target) => {
    try {
      setLoading(true);
      const res = await axios.post('/translate', {
        text: selData.rawText,
        fullWord: selData.fullWord,
        context: selData.contextSentence,
        source,
        target
      });
      const payload = res?.data?.original ? res.data : (res?.data?.data || res?.data || res);
      setResult(payload);
    } catch (err) {
      console.warn('Translate error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Đổi chiều dịch (EN ⇄ VI)
  const handleSwap = () => {
    if (!selectionData) return;
    const newLangs = {
      source: langs.target,
      target: langs.source
    };
    setLangs(newLangs);
    fetchTranslation(selectionData, newLangs.source, newLangs.target);
  };

  // Phát âm từ vựng bằng Web Speech API
  const speakWord = (text, lang) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'vi-VN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!selectionData) return null;

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'absolute',
        top: `${tooltipPos.top}px`,
        left: `${tooltipPos.left}px`,
        zIndex: 9999
      }}
      className={`w-[330px] max-h-[85vh] overflow-y-auto bg-[#FCFBF9] rounded-2xl shadow-[0_12px_36px_-6px_rgba(22,32,27,0.18)] border border-[#E5DFD3] p-3.5 text-sm transition-all duration-150 ${
        tooltipPos.placement === 'top' ? '-translate-y-full' : ''
      }`}
    >
      {/* Header tối giản */}
      <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DC]">
        <div className="flex items-center gap-1 text-[11px] font-bold text-[#195646] bg-[#F0F7F4] px-2.5 py-0.5 rounded-full border border-[#DCEEE5]">
          <span>{langs.source.toUpperCase()}</span>
          <button
            onClick={handleSwap}
            title="Đổi chiều dịch"
            className="p-0.5 hover:bg-[#D5EAE0] rounded-full transition cursor-pointer"
          >
            <HiOutlineArrowsRightLeft className="w-3 h-3 text-[#195646]" />
          </button>
          <span>{langs.target.toUpperCase()}</span>
        </div>

        <button
          onClick={() => {
            setSelectionData(null);
            setResult(null);
            setShowContext(false);
          }}
          className="text-[#969C98] hover:text-[#16201B] p-1 rounded-lg hover:bg-[#EFECE5] transition cursor-pointer"
          title="Đóng (Esc)"
        >
          <HiOutlineXMark className="w-4 h-4" />
        </button>
      </div>

      {/* Nội dung kết quả */}
      {loading ? (
        <div className="py-5 flex flex-col items-center justify-center gap-2 text-xs text-[#7B827E]">
          <div className="w-5 h-5 border-2 border-[#195646] border-t-transparent rounded-full animate-spin" />
          <span>Đang tra cứu từ điển...</span>
        </div>
      ) : result ? (
        <div className="mt-2.5 space-y-2.5">
          {/* Từ gốc + Nút phát âm */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-serif text-base font-bold text-[#16201B] leading-snug break-words">
                {result.original}
              </h4>
              {result.phonetic && (
                <p className="text-xs text-[#7B827E] font-mono mt-0.5">
                  {result.phonetic}
                </p>
              )}
            </div>

            <button
              onClick={() => speakWord(result.original, langs.source)}
              title="Phát âm"
              className="p-1.5 bg-[#F0F7F4] hover:bg-[#E2F0EA] text-[#195646] rounded-xl transition flex-shrink-0 cursor-pointer border border-[#D6EBE0]"
            >
              <HiOutlineSpeakerWave className="w-4 h-4" />
            </button>
          </div>

          {/* Bản dịch chính: Tinh gọn, rõ ràng */}
          <div className="p-2.5 rounded-xl bg-[#F4F9F6] border border-[#D7E9E1]">
            <p className="font-serif text-sm font-bold text-[#11382E] leading-snug">
              {result.translation}
            </p>
            {result.localMeaning && result.localMeaning !== result.translation && (
              <p className="text-xs text-[#4E7065] mt-0.5">
                Nghĩa từ điển: {result.localMeaning}
              </p>
            )}
          </div>

          {/* Nút bấm xem ngữ cảnh (ẩn mặc định, chỉ hiện khi click) */}
          {result.contextSentence && result.contextSentence !== result.original && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowContext(!showContext)}
                className="text-xs font-semibold text-[#195646] hover:text-[#12392F] flex items-center justify-between py-1 px-2.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EAE3D6] transition-colors cursor-pointer w-full"
              >
                <span className="flex items-center gap-1.5">
                  <HiOutlineBookOpen className="w-3.5 h-3.5 text-[#195646]" />
                  <span>{showContext ? 'Ẩn ngữ cảnh câu' : 'Xem ngữ cảnh trong câu'}</span>
                </span>
                {showContext ? (
                  <HiOutlineChevronUp className="w-3.5 h-3.5 text-[#767D79]" />
                ) : (
                  <HiOutlineChevronDown className="w-3.5 h-3.5 text-[#767D79]" />
                )}
              </button>

              {/* Khung ngữ cảnh chỉ mở ra khi bấm xem */}
              {showContext && (
                <div className="mt-2 text-xs bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EAE3D6] space-y-1">
                  <p className="text-[#3E4340] italic leading-relaxed">
                    &ldquo;{result.contextSentence}&rdquo;
                  </p>
                  {result.contextTranslation && (
                    <p className="text-[#195646] font-medium pt-1 border-t border-[#E8E1D2] mt-1">
                      ↳ {result.contextTranslation}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Từ điển theo từ loại nếu có */}
          {result.dictionary && result.dictionary.length > 0 && (
            <div className="pt-1.5 border-t border-[#ECE7DC] space-y-1">
              {result.dictionary.slice(0, 2).map((dict, idx) => (
                <div key={idx} className="text-[11px] text-[#555C58] flex items-baseline gap-1.5">
                  <span className="text-[10px] font-semibold text-[#8A918D] uppercase italic">
                    {dict.partOfSpeech}:
                  </span>
                  <span className="text-[#2C332F] truncate">{dict.terms?.join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
