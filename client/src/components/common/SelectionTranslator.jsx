import { useState, useEffect, useRef } from 'react';
import axios from '@/api/axios';
import { getSmartSelectionData } from '@/utils/textSelectionHelper';
import { HiVolumeUp, HiSwitchHorizontal, HiX, HiSparkles, HiBookOpen } from 'react-icons/hi';

export default function SelectionTranslator() {
  const [selectionData, setSelectionData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [langs, setLangs] = useState({ source: 'en', target: 'vi' });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, placement: 'top' });
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
          const initLangs = { source: data.source, target: data.target };
          setLangs(initLangs);

          // Tính toán vị trí hiển thị (tránh tràn mép trên và 2 bên màn hình)
          const tooltipWidth = 320;
          const tooltipHeight = 220;
          let left = data.rect.clientX - tooltipWidth / 2;
          // Giữ trong màn hình
          left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));

          let top = data.rect.top - 12;
          let placement = 'top';

          // Nếu sát mép trên màn hình, lật tooltip xuống dưới vùng bôi
          if (data.rect.clientY < tooltipHeight + 20) {
            top = data.rect.top + data.rect.height + 12;
            placement = 'bottom';
          }

          setTooltipPos({ top, left, placement });
          fetchTranslation(data, initLangs.source, initLangs.target);
        } else {
          setSelectionData(null);
          setResult(null);
        }
      }, 60);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectionData(null);
        setResult(null);
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
      setResult(res.data.data);
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
      className={`w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 p-3.5 text-sm transition-all duration-200 animate-in fade-in zoom-in-95 ${
        tooltipPos.placement === 'top' ? '-translate-y-full' : ''
      }`}
    >
      {/* Header điều khiển */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5 bg-blue-50/80 px-2 py-0.5 rounded-full text-xs font-semibold text-blue-700">
          <HiSparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>{langs.source.toUpperCase()}</span>
          <button
            onClick={handleSwap}
            title="Đổi chiều dịch (EN ⇄ VI)"
            className="p-0.5 hover:bg-blue-100 rounded-full text-blue-600 transition"
          >
            <HiSwitchHorizontal className="w-3.5 h-3.5" />
          </button>
          <span>{langs.target.toUpperCase()}</span>
        </div>

        <button
          onClick={() => {
            setSelectionData(null);
            setResult(null);
          }}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
          title="Đóng (Esc)"
        >
          <HiX className="w-4 h-4" />
        </button>
      </div>

      {/* Nội dung kết quả */}
      {loading ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Đang dịch theo ngữ cảnh câu...</span>
        </div>
      ) : result ? (
        <div className="mt-2.5 space-y-2.5">
          {/* Từ gốc + Phát âm */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-base text-gray-900 tracking-tight">
                  {result.original}
                </span>
                {result.difficulty && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 capitalize font-medium">
                    {result.difficulty}
                  </span>
                )}
              </div>
              {result.phonetic && (
                <div className="text-xs text-gray-400 font-mono mt-0.5">
                  {result.phonetic}
                </div>
              )}
            </div>

            <button
              onClick={() => speakWord(result.original, langs.source)}
              title="Phát âm từ này"
              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition shadow-sm active:scale-95"
            >
              <HiVolumeUp className="w-4 h-4" />
            </button>
          </div>

          {/* Thông báo nếu đã tự động mở rộng do người dùng bôi thiếu */}
          {selectionData.isExpanded && (
            <div className="text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
              <span>✨</span>
              <span>
                Đã tự động sửa vùng bôi thiếu: <b>{result.original}</b>
              </span>
            </div>
          )}

          {/* Bản dịch chính */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-2.5 rounded-xl border border-blue-100/80">
            <div className="text-blue-950 font-bold text-sm leading-snug">
              {result.translation}
            </div>
            {result.localMeaning && result.localMeaning !== result.translation && (
              <div className="text-xs text-blue-800/80 mt-1">
                Nghĩa từ điển: {result.localMeaning}
              </div>
            )}
          </div>

          {/* Câu ngữ cảnh và bản dịch ngữ cảnh */}
          {result.contextSentence && result.contextSentence !== result.original && (
            <div className="text-xs bg-gray-50/90 p-2.5 rounded-xl border border-gray-100 space-y-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <HiBookOpen className="w-3 h-3 text-gray-400" />
                <span>Ngữ cảnh trong câu</span>
              </div>
              <p className="text-gray-700 italic leading-relaxed">
                "{result.contextSentence}"
              </p>
              {result.contextTranslation && (
                <p className="text-blue-600 font-medium pt-0.5 border-t border-gray-100 mt-1">
                  ↳ {result.contextTranslation}
                </p>
              )}
            </div>
          )}

          {/* Từ điển theo từ loại (Danh từ, Động từ, Tính từ...) */}
          {result.dictionary && result.dictionary.length > 0 && (
            <div className="pt-1.5 border-t border-gray-100 space-y-1">
              {result.dictionary.slice(0, 2).map((dict, idx) => (
                <div key={idx} className="text-[11px] text-gray-600 flex items-baseline gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase italic">
                    {dict.partOfSpeech}:
                  </span>
                  <span className="text-gray-700 truncate">{dict.terms?.join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
