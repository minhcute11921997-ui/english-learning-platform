import { useState } from 'react';

const FALLBACK_SRC = '/images/vocab/_placeholder.svg';

/**
 * Component hiển thị hình ảnh minh họa thuật ngữ Mỹ thuật & Mỹ nghệ
 * Có cơ chế tự động xử lý lỗi, skeleton loading và fallback ảnh chuẩn
 */
export default function VocabImage({
  src,
  alt = 'Minh họa mỹ thuật',
  className = '',
  imgClassName = '',
  showCaption = false,
  caption = '',
  enableZoom = false
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  const finalSrc = !src || hasError ? FALLBACK_SRC : src;

  return (
    <>
      <div className={`relative overflow-hidden bg-stone-50 select-none ${className}`}>
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 animate-pulse" />
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
          className={`w-full h-full object-contain transition-transform duration-300 ${
            enableZoom && !hasError ? 'cursor-zoom-in hover:scale-105' : ''
          } ${imgClassName}`}
        />

        {showCaption && caption && (
          <div className="absolute bottom-0 inset-x-0 bg-stone-900/60 backdrop-blur-xs text-[11px] text-white/90 px-2.5 py-1 truncate text-center">
            {caption}
          </div>
        )}
      </div>

      {/* Modal Zoom preview */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
              title="Đóng xem lớn"
            >
              ✕
            </button>
            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-stone-50 p-2">
              <img src={finalSrc} alt={alt} className="max-w-full max-h-[65vh] object-contain" />
            </div>
            {alt && (
              <p className="mt-3 text-sm text-stone-700 font-medium text-center">{alt}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
