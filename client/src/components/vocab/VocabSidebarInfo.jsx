import { HiOutlineBookOpen, HiOutlineBookmark } from 'react-icons/hi2';

/**
 * Hiển thị khối thông tin bối cảnh văn hóa & nghệ sĩ gọn gàng
 */
export default function VocabSidebarInfo({
  culturalNote,
  relatedArtist,
  sourceRef,
  className = ''
}) {
  if (!culturalNote && !relatedArtist) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-left space-y-2.5 ${className}`}
    >
      {culturalNote && (
        <div className="flex items-start gap-2">
          <HiOutlineBookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {culturalNote}
          </p>
        </div>
      )}

      {relatedArtist && (
        <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
          <HiOutlineBookmark className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-800 font-semibold leading-snug">
            {relatedArtist}
          </p>
        </div>
      )}

      {sourceRef && (
        <div className="flex justify-end">
          <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
            {sourceRef}
          </span>
        </div>
      )}
    </div>
  );
}
