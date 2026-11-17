import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { vocabListApi } from '../../api/services';
import {
  HiX,
  HiPlus,
  HiOutlineFolder
} from 'react-icons/hi';

/**
 * Modal thêm từ vựng vào một hoặc nhiều bộ danh sách cá nhân - Modern Design Studio
 */
export default function AddToListModal({ isOpen, onClose, vocab, onSuccess }) {
  const [lists, setLists] = useState([]);
  const [selectedListIds, setSelectedListIds] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(isOpen && (vocab?.id || vocab?.word)));
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIsLoading(true);
    } else {
      setShowCreateInput(false);
      setNewListName('');
    }
  }

  const vocabId = vocab?.id;
  const vocabWord = vocab?.word;

  useEffect(() => {
    if (!isOpen || (!vocabId && !vocabWord)) return;
    let active = true;

    const fetchMembership = async () => {
      try {
        const [listsRes, membershipRes] = await Promise.all([
          vocabListApi.getAll(),
          vocabListApi.getWordMembership({
            vocabId,
            word: vocabWord
          })
        ]);
        if (!active) return;
        setLists(listsRes.data || []);
        setSelectedListIds(membershipRes?.data?.listIds || []);
      } catch {
        if (active) toast.error('Không thể tải danh sách bộ từ');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchMembership();
    return () => {
      active = false;
    };
  }, [isOpen, vocabId, vocabWord]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="min-w-0 pr-2">
            <h3 className="text-lg font-extrabold text-slate-950 truncate tracking-tight">
              Lưu vào Bộ Sưu Tập Cá Nhân
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Thuật ngữ: <strong className="text-blue-600 font-bold">{vocab?.word}</strong>
              {vocab?.meaning_vi ? ` — ${vocab.meaning_vi}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải các bộ sưu tập...</span>
            </div>
          ) : (
            <>
              {/* Danh sách các bộ từ */}
              <div className="space-y-2">
                {lists.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
                    <HiOutlineFolder className="w-8 h-8 text-slate-400 mx-auto" />
                    <p>Bạn chưa có danh sách từ nào. Hãy tạo bộ sưu tập đầu tiên!</p>
                  </div>
                ) : (
                  lists.map((list) => {
                    const isChecked = selectedListIds.includes(list.id);
                    return (
                      <label
                        key={list.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleList(list.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 border-slate-300 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {list.name}
                            </p>
                            {list.description && (
                              <p className="text-xs text-slate-500 truncate">
                                {list.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {list.vocab_count || 0} từ
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Khu vực tạo bộ từ mới nhanh */}
              {showCreateInput ? (
                <form onSubmit={handleCreateNewList} className="space-y-2 pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Tên bộ danh sách mới:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ví dụ: Kỹ thuật Phục Hưng, Gốm Bát Tràng..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="input py-2 px-3 text-xs flex-1"
                    />
                    <button
                      type="submit"
                      disabled={isCreatingList || !newListName.trim()}
                      className="btn btn-primary py-2 px-4 text-xs cursor-pointer disabled:opacity-50 rounded-xl"
                    >
                      {isCreatingList ? 'Đang tạo...' : 'Tạo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateInput(false)}
                      className="btn btn-secondary py-2 px-3 text-xs text-slate-600 cursor-pointer rounded-xl"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateInput(true)}
                  className="w-full py-2.5 px-3 border border-dashed border-blue-300 hover:border-blue-500 rounded-2xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HiPlus className="w-4 h-4" />
                  <span>+ Tạo danh sách mới</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-mono">
            Đã chọn: <strong className="text-blue-600 font-bold">{selectedListIds.length}</strong> bộ
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary py-2 px-4 text-xs cursor-pointer rounded-xl"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="btn btn-primary py-2 px-5 text-xs cursor-pointer disabled:opacity-50 rounded-xl"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
