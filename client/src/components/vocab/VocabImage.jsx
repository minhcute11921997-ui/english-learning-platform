import { useState, useEffect } from 'react';
import { HiOutlineMagnifyingGlassPlus, HiXMark } from 'react-icons/hi2';

const FALLBACK_SRC = '/images/vocab/_placeholder.svg';

/**
 * Component hiển thị hình ảnh minh họa thuật ngữ Mỹ thuật & Mỹ nghệ
 * Phong cách Phòng Trưng Bày Đương Đại (Contemporary Art Gallery Matting)
 */
export default function VocabImage({
  src,
  alt = 'Tác phẩm mỹ thuật',
  className = '',
  imgClassName = '',
  fit = 'contain',
  showCaption = false,
  caption = '',
  enableZoom = false
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
    setIsLoading(true);
  }

  useEffect(() => {
    if (!isZoomed) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsZoomed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed]);

  const finalSrc = !src || hasError ? FALLBACK_SRC : src;

  return (
    <>
      <div className={`relative overflow-hidden group select-none ${className}`}>
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
        )}

        <img
          src={finalSrc}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          onClick={() => {
            if (enableZoom && !hasError) setIsZoomed(true);
          }}
          className={`w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'} transition-all duration-300 ${
            enableZoom && !hasError ? 'cursor-zoom-in group-hover:scale-[1.03]' : ''
          } ${imgClassName}`}
        />

        {/* Hover zoom indicator */}
        {enableZoom && !hasError && !isLoading && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900/80 backdrop-blur-xs text-white p-1.5 rounded-lg shadow-sm">
            <HiOutlineMagnifyingGlassPlus className="w-4 h-4" />
          </div>
        )}

        {showCaption && caption && (
          <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xs text-[11px] font-mono text-slate-200 px-3 py-1.5 truncate text-center">
            {caption}
          </div>
        )}
      </div>

      {/* Darkroom Exhibition Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 illustration-dialog bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Đóng"
            >
              <HiXMark className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center p-2 rounded-2xl bg-black/40 overflow-hidden">
              <img src={finalSrc} alt={alt} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
            {alt && (
              <div className="mt-4 text-center">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
                  Xem tác phẩm
                </span>
                <p className="text-sm text-slate-200 font-medium">{alt}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
