import { HiOutlineBookOpen, HiOutlineSparkles, HiOutlineBookmark } from 'react-icons/hi2';

/**
 * Hiển thị khối thông tin bên lề theo phong cách Thẻ Triển Lãm Đương Đại (Gallery Plaque)
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
      className={`rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 text-left space-y-3 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-blue-700">
          <HiOutlineSparkles className="w-3.5 h-3.5 text-blue-600" />
          Bối cảnh Văn hóa &amp; Lịch sử
        </span>
        {sourceRef && (
          <span className="font-mono text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-semibold shadow-2xs">
            {sourceRef}
          </span>
        )}
      </div>

      {/* Bối cảnh văn hóa – lịch sử */}
      {culturalNote && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <HiOutlineBookOpen className="w-3.5 h-3.5 text-blue-600" />
            Nguồn gốc &amp; Kỹ nghệ chế tác:
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-5 font-normal">
            {culturalNote}
          </p>
        </div>
      )}

      {/* Nghệ sĩ / làng nghề tiêu biểu */}
      {relatedArtist && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <HiOutlineBookmark className="w-3.5 h-3.5 text-blue-600" />
            Nghệ sĩ / Di sản Làng nghề:
          </p>
          <p className="text-xs sm:text-sm text-slate-900 font-semibold pl-5">
            {relatedArtist}
          </p>
        </div>
      )}

      {/* Ghi công ảnh */}
      {imageCredit && (
        <p className="font-mono text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
          Visual: {imageCredit}
        </p>
      )}
    </div>
  );
}
