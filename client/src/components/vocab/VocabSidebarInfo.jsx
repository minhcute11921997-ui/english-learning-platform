import { HiOutlineBookOpen, HiOutlineSparkles, HiOutlineBookmark } from 'react-icons/hi2';

/**
 * Hiển thị khối thông tin bên lề:
 * - Bối cảnh văn hóa & lịch sử nghệ thuật (cultural_note)
 * - Nghệ sĩ / Tác phẩm / Làng nghề tiêu biểu (related_artist)
 * - Nguồn tham chiếu chuyên ngành (source_ref)
 */
export default function VocabSidebarInfo({
  culturalNote,
  relatedArtist,
  sourceRef,
  imageCredit,
  className = ''
}) {
  if (!culturalNote && !relatedArtist && !sourceRef) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/50 via-stone-50/70 to-orange-50/30 p-4 text-left space-y-3.5 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-amber-200/50">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-900/80">
          <HiOutlineSparkles className="w-4 h-4 text-amber-600" />
          Thông tin bên lề &amp; Bối cảnh văn hóa
        </span>
        {sourceRef && (
          <span className="text-[10px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200/70 font-medium">
            {sourceRef}
          </span>
        )}
      </div>

      {/* Bối cảnh văn hóa – lịch sử */}
      {culturalNote && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <HiOutlineBookOpen className="w-3.5 h-3.5 text-amber-700" />
            Lịch sử &amp; Nguồn gốc nghệ thuật:
          </p>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pl-5 font-serif italic">
            "{culturalNote}"
          </p>
        </div>
      )}

      {/* Nghệ sĩ / làng nghề tiêu biểu */}
      {relatedArtist && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <HiOutlineBookmark className="w-3.5 h-3.5 text-amber-700" />
            Nghệ sĩ / Làng nghề tiêu biểu:
          </p>
          <p className="text-xs sm:text-sm text-stone-800 font-medium pl-5">
            {relatedArtist}
          </p>
        </div>
      )}

      {/* Ghi công ảnh */}
      {imageCredit && (
        <p className="text-[10px] text-stone-400 italic pt-1 border-t border-stone-200/60">
          Nguồn minh họa: {imageCredit}
        </p>
      )}
    </div>
  );
}
