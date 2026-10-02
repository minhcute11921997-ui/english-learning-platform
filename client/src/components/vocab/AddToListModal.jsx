import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { vocabListApi, vocabApi } from '../../api/services';
import {
  HiX,
  HiPlus,
  HiCheck,
  HiOutlineFolder,
  HiOutlineFolderAdd
} from 'react-icons/hi';

/**
 * Modal thêm từ vựng vào một hoặc nhiều bộ danh sách cá nhân
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - vocab: { id?: number, word: string, meaning_vi?: string, pronunciation?: string, part_of_speech?: string }
 * - onSuccess?: (assignedIds) => void
 */
export default function AddToListModal({ isOpen, onClose, vocab, onSuccess }) {
  const [lists, setLists] = useState([]);
  const [selectedListIds, setSelectedListIds] = useState([]);
  const [initialListIds, setInitialListIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  useEffect(() => {
    if (isOpen && vocab) {
      loadData();
    } else {
      setShowCreateInput(false);
      setNewListName('');
    }
  }, [isOpen, vocab?.id, vocab?.word]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [listsRes, membershipRes] = await Promise.all([
        vocabListApi.getAll(),
        vocabListApi.getWordMembership({
          vocabId: vocab.id,
          word: vocab.word
        })
      ]);

      const userLists = listsRes.data || [];
      const currentMemberIds = membershipRes?.data?.listIds || [];

      setLists(userLists);
      setSelectedListIds(currentMemberIds);
      setInitialListIds(currentMemberIds);
    } catch (err) {
      toast.error('Không thể tải danh sách bộ từ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleList = (listId) => {
    setSelectedListIds((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
    );
  };

  const handleCreateNewList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      setIsCreatingList(true);
      const res = await vocabListApi.create({
        name: newListName.trim(),
        description: ''
      });
      const created = res.data;
      setLists((prev) => [created, ...prev]);
      // Tự động tích chọn danh sách vừa tạo
      setSelectedListIds((prev) => [...prev, created.id]);
      setNewListName('');
      setShowCreateInput(false);
      toast.success(`Đã tạo bộ từ "${created.name}"`);
    } catch (err) {
      toast.error(err.message || 'Không thể tạo danh sách');
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleSave = async () => {
    if (!vocab) return;

    try {
      setIsSaving(true);
      await vocabListApi.syncWord({
        vocabulary_id: vocab.id,
        word: vocab.word,
        meaning_vi: vocab.meaning_vi,
        pronunciation: vocab.pronunciation,
        part_of_speech: vocab.part_of_speech,
        list_ids: selectedListIds
      });

      if (vocab.id && selectedListIds.length > 0) {
        try {
          await vocabApi.markAsLearned(vocab.id);
        } catch {
          // ignore if already learned
        }
      }

      toast.success(
        selectedListIds.length > 0
          ? `Đã lưu từ "${vocab.word}" vào ${selectedListIds.length} danh sách!`
          : `Đã gỡ từ "${vocab.word}" khỏi danh sách!`
      );

      if (onSuccess) {
        onSuccess(selectedListIds, vocab.id);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Lưu từ thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#E8E4DC] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#ECE7DC] flex items-center justify-between bg-[#FAF8F5]">
          <div className="min-w-0 pr-2">
            <h3 className="font-serif text-lg font-bold text-[#16201B] truncate">
              Lưu vào bộ từ cá nhân
            </h3>
            <p className="text-xs text-[#6C726E] mt-0.5 truncate">
              Từ: <strong className="text-[#195646] font-serif text-sm">{vocab?.word}</strong>
              {vocab?.meaning_vi ? ` — ${vocab.meaning_vi}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#EBE7DF] text-[#787E7B] transition-colors cursor-pointer"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-[#7B827E]">
              <div className="w-5 h-5 border-2 border-[#195646] border-t-transparent rounded-full animate-spin" />
              <span>Đang tải các bộ từ...</span>
            </div>
          ) : (
            <>
              {/* Danh sách các bộ từ */}
              <div className="space-y-2">
                {lists.length === 0 ? (
                  <div className="text-center py-6 px-4 bg-[#FAF8F5] rounded-xl border border-dashed border-[#DFD9CD] text-xs text-[#7B827E] space-y-2">
                    <HiOutlineFolder className="w-8 h-8 text-[#A4AAA6] mx-auto" />
                    <p>Bạn chưa có danh sách từ nào. Hãy tạo danh sách đầu tiên!</p>
                  </div>
                ) : (
                  lists.map((list) => {
                    const isChecked = selectedListIds.includes(list.id);
                    return (
                      <label
                        key={list.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#F0F7F4] border-[#195646] shadow-xs'
                            : 'bg-white border-[#E8E4DC] hover:border-[#CCD5D0] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleList(list.id)}
                            className="w-4 h-4 rounded text-[#195646] focus:ring-[#195646] border-[#CCD5D0] cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#16201B] truncate">
                              {list.name}
                            </p>
                            {list.description && (
                              <p className="text-xs text-[#7B827E] truncate">
                                {list.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FAF5EC] text-[#8C6D3B] border border-[#EFE5D0] flex-shrink-0">
                          {list.vocab_count || 0} từ
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Khu vực tạo bộ từ mới nhanh */}
              {showCreateInput ? (
                <form onSubmit={handleCreateNewList} className="space-y-2 pt-2 border-t border-[#ECE7DC]">
                  <label className="text-xs font-semibold text-[#16201B]">
                    Tên bộ danh sách mới:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ví dụ: Từ vựng IELTS khó, Unit 1..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="input py-1.5 px-3 text-xs flex-1 border-[#CCD5D0] focus:border-[#195646]"
                    />
                    <button
                      type="submit"
                      disabled={isCreatingList || !newListName.trim()}
                      className="btn btn-primary py-1.5 px-3 text-xs flex-shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isCreatingList ? 'Đang tạo...' : 'Tạo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateInput(false)}
                      className="btn btn-outline py-1.5 px-2.5 text-xs text-[#7B827E] cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateInput(true)}
                  className="w-full py-2 px-3 border border-dashed border-[#B8D4C8] hover:border-[#195646] rounded-xl text-xs font-semibold text-[#195646] hover:bg-[#F0F7F4] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HiPlus className="w-4 h-4" />
                  <span>+ Tạo danh sách mới</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#ECE7DC] bg-[#FAF8F5] flex items-center justify-between gap-3">
          <span className="text-xs text-[#7B827E]">
            Đã chọn: <strong className="text-[#195646]">{selectedListIds.length}</strong> danh sách
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline py-1.5 px-3 text-xs cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="btn btn-primary py-1.5 px-4 text-xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
