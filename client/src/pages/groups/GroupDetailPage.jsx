import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { groupApi, vocabApi, readingApi } from '../../api/services';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiUserGroup,
  HiBookOpen,
  HiAcademicCap,
  HiChartBar,
  HiPlus,
  HiClipboardCopy,
  HiCheck,
  HiTrash,
  HiArrowLeft,
  HiPencil,
  HiLogout,
  HiRefresh
} from 'react-icons/hi';

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form states for owner creating vocab set
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetDesc, setNewSetDesc] = useState('');
  const [allVocabs, setAllVocabs] = useState([]);
  const [selectedVocabIds, setSelectedVocabIds] = useState([]);
  const [allReadings, setAllReadings] = useState([]);
  const [selectedReadingId, setSelectedReadingId] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
    try {
      setIsLoading(true);
      const res = await groupApi.getById(id);
      setGroup(res.data);
      setEditFormData({
        name: res.data.name || '',
        description: res.data.description || ''
      });

      if (res.data.is_owner) {
        const progRes = await groupApi.getProgress(id);
        setProgress(progRes.data);
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tải chi tiết nhóm');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableContent = async () => {
    try {
      const [vRes, rRes] = await Promise.all([
        vocabApi.search('', { limit: 200 }),
        readingApi.getAll({ limit: 100 })
      ]);
      setAllVocabs(vRes.data || []);
      setAllReadings(rRes.data || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (activeTab === 'add_content') {
      loadAvailableContent();
    }
  }, [activeTab]);

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    toast.success(`Đã sao chép mã mời: ${group.invite_code}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm('Tạo lại mã mời sẽ khiến mã cũ không còn sử dụng được. Bạn có chắc chắn?')) return;
    try {
      const res = await groupApi.regenerateCode(id);
      setGroup((prev) => ({ ...prev, invite_code: res.data.invite_code }));
      toast.success(`Đã tạo mã mời mới: ${res.data.invite_code}`);
    } catch (err) {
      toast.error(err.message || 'Tạo lại mã mời thất bại');
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      toast.error('Vui lòng nhập tên nhóm');
      return;
    }
    try {
      setIsActionLoading(true);
      await groupApi.update(id, editFormData);
      toast.success('Cập nhật thông tin nhóm thành công!');
      setShowEditModal(false);
      loadGroupData();
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setIsActionLoading(true);
      await groupApi.delete(id);
      toast.success('Đã xóa nhóm học tập thành công');
      navigate('/groups');
    } catch (err) {
      toast.error(err.message || 'Xóa nhóm thất bại');
      setIsActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setIsActionLoading(true);
      await groupApi.leave(id);
      toast.success('Đã rời khỏi nhóm học tập');
      navigate('/groups');
    } catch (err) {
      toast.error(err.message || 'Rời nhóm thất bại');
      setIsActionLoading(false);
    }
  };

  const handlePublishVocabSet = async (setId) => {
    try {
      await groupApi.publishVocabSet(id, setId);
      toast.success('Đã phát hành bộ từ và đồng bộ vào lịch ôn tập thành viên!');
      loadGroupData();
    } catch (err) {
      toast.error(err.message || 'Phát hành thất bại');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return;
    try {
      await groupApi.removeMember(id, userId);
      toast.success('Đã xóa thành viên khỏi nhóm');
      loadGroupData();
    } catch (err) {
      toast.error(err.message || 'Xóa thành viên thất bại');
    }
  };

  const handleCreateVocabSet = async (e) => {
    e.preventDefault();
    if (selectedVocabIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 từ vựng');
      return;
    }

    try {
      setIsSavingContent(true);
      await groupApi.createVocabSet(id, {
        title: newSetTitle,
        description: newSetDesc,
        vocabulary_ids: selectedVocabIds
      });
      toast.success('Tạo bộ từ vựng nhóm thành công!');
      setNewSetTitle('');
      setNewSetDesc('');
      setSelectedVocabIds([]);
      setActiveTab('content');
      loadGroupData();
    } catch (err) {
      toast.error(err.message || 'Tạo bộ từ thất bại');
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleAddReading = async (e) => {
    e.preventDefault();
    if (!selectedReadingId) {
      toast.error('Vui lòng chọn một bài đọc');
      return;
    }

    try {
      setIsSavingContent(true);
      await groupApi.addReading(id, selectedReadingId);
      toast.success('Đã thêm bài đọc vào nhóm!');
      setSelectedReadingId('');
      setActiveTab('content');
      loadGroupData();
    } catch (err) {
      toast.error(err.message || 'Thêm bài đọc thất bại');
    } finally {
      setIsSavingContent(false);
    }
  };

  const toggleVocabSelect = (vocabId) => {
    setSelectedVocabIds((prev) =>
      prev.includes(vocabId) ? prev.filter((i) => i !== vocabId) : [...prev, vocabId]
    );
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-stone-500 font-medium">Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/groups"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-emerald-800 transition-colors"
        >
          <HiArrowLeft className="w-4 h-4" /> Quay lại danh sách nhóm
        </Link>

        <div className="flex items-center gap-2">
          {group.is_owner ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="gap-1.5 text-stone-700 text-xs"
              >
                <HiPencil className="w-3.5 h-3.5" /> Chỉnh sửa
              </Button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
              >
                <HiTrash className="w-3.5 h-3.5" /> Xóa nhóm
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-amber-700 hover:bg-amber-50 border border-amber-300 transition-colors"
            >
              <HiLogout className="w-3.5 h-3.5" /> Rời nhóm
            </button>
          )}
        </div>
      </div>

      {/* Group Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2.5 max-w-xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                group.is_owner
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                  : 'bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {group.is_owner ? 'Chủ nhóm' : 'Thành viên'}
            </span>
            <span className="text-xs text-stone-400">
              Mã nhóm #{group.id}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 leading-tight">
            {group.name}
          </h1>

          <p className="text-sm text-stone-600 leading-relaxed">
            {group.description || 'Chưa có mô tả cho nhóm học này.'}
          </p>

          <div className="pt-1 flex items-center gap-3 text-xs text-stone-500 flex-wrap">
            <span>
              Chủ sở hữu:{' '}
              <strong className="text-stone-800 font-medium">
                {group.owner?.full_name || group.owner?.username}
              </strong>
            </span>
            <span>•</span>
            <span>
              Thành viên:{' '}
              <strong className="text-stone-800 font-medium">
                {group.members?.length || 0} người
              </strong>
            </span>
          </div>
        </div>

        {/* Invite Code Box */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col gap-2 min-w-[220px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Mã mời tham gia
            </span>
            {group.is_owner && (
              <button
                type="button"
                onClick={handleRegenerateCode}
                className="text-stone-400 hover:text-emerald-700 p-1 rounded transition-colors"
                title="Tạo lại mã mời mới"
              >
                <HiRefresh className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-stone-200">
            <span className="text-lg font-mono font-bold text-emerald-800 tracking-widest">
              {group.invite_code}
            </span>
            <button
              onClick={copyCode}
              className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-700 hover:bg-stone-50 transition-colors"
              title="Sao chép mã mời"
            >
              {copied ? (
                <HiCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <HiClipboardCopy className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-stone-400 text-center">
            Chia sẻ mã này để mời thành viên vào lớp
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 text-sm font-semibold gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('content')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'content'
              ? 'border-emerald-800 text-emerald-800 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <HiBookOpen className="w-4 h-4" /> Nội dung học ({group.vocabSets?.length || 0} bộ từ, {group.readingSets?.length || 0} bài đọc)
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'members'
              ? 'border-emerald-800 text-emerald-800 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <HiUserGroup className="w-4 h-4" /> Thành viên ({group.members?.length || 0})
        </button>

        {group.is_owner && (
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'progress'
                ? 'border-emerald-800 text-emerald-800 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <HiChartBar className="w-4 h-4" /> Tiến độ thành viên
          </button>
        )}

        {group.is_owner && (
          <button
            onClick={() => setActiveTab('add_content')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'add_content'
                ? 'border-emerald-800 text-emerald-800 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <HiPlus className="w-4 h-4" /> Soạn & Giao bài
          </button>
        )}
      </div>

      {/* Tab 1: Content */}
      {activeTab === 'content' && (
        <div className="space-y-8">
          {/* Vocab Sets */}
          <div className="space-y-4">
            <h2 className="text-base font-bold font-serif text-stone-900 flex items-center gap-2">
              <HiBookOpen className="text-emerald-700 w-5 h-5" /> Các bộ từ vựng của nhóm
            </h2>

            {group.vocabSets?.length > 0 ? (
              <div className="space-y-4">
                {group.vocabSets.map((vSet) => (
                  <div
                    key={vSet.id}
                    className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-stone-900 text-base">{vSet.title}</h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {vSet.description || 'Không có mô tả'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                            vSet.is_published
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {vSet.is_published ? 'Đã phát hành' : 'Bản nháp'}
                        </span>

                        {group.is_owner && !vSet.is_published && (
                          <button
                            onClick={() => handlePublishVocabSet(vSet.id)}
                            className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white transition-colors"
                          >
                            Phát hành
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Words preview pills */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-stone-100 text-xs">
                      {vSet.items?.map((item) => (
                        <span
                          key={item.id}
                          className="px-2.5 py-1 rounded-md bg-stone-50 border border-stone-200 text-stone-700 font-medium"
                        >
                          <strong className="text-emerald-800">{item.vocabulary?.word}</strong>:{' '}
                          {item.vocabulary?.meaning_vi}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-sm text-stone-400 italic">
                Chưa có bộ từ vựng nào được thêm vào nhóm này.
              </div>
            )}
          </div>

          {/* Reading Sets */}
          <div className="space-y-4">
            <h2 className="text-base font-bold font-serif text-stone-900 flex items-center gap-2">
              <HiAcademicCap className="text-emerald-700 w-5 h-5" /> Bài đọc được giao
            </h2>

            {group.readingSets?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.readingSets.map((rSet) => (
                  <div
                    key={rSet.id}
                    className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide mb-2">
                        {rSet.reading?.difficulty}
                      </span>
                      <h3 className="font-bold text-stone-900 text-base">{rSet.reading?.title}</h3>
                      <p className="text-xs text-stone-500 italic mb-4 mt-0.5">
                        {rSet.reading?.title_vi}
                      </p>
                    </div>

                    <Link
                      to={`/readings/${rSet.reading_id}`}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 border border-stone-200 transition-colors"
                    >
                      Làm bài đọc này
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-sm text-stone-400 italic">
                Chưa có bài đọc nào được giao cho nhóm này.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Members */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
          {group.members?.map((m) => (
            <div key={m.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold flex items-center justify-center text-sm">
                  {(m.user?.full_name || m.user?.username || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-sm">
                    {m.user?.full_name || m.user?.username}
                  </p>
                  <p className="text-xs text-stone-400">@{m.user?.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                    m.role === 'owner'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {m.role === 'owner' ? 'Chủ nhóm' : 'Thành viên'}
                </span>

                {group.is_owner && m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(m.user_id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Xóa khỏi nhóm"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Progress tracking for owner */}
      {activeTab === 'progress' && group.is_owner && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-4">Học viên</th>
                  <th className="p-4">Vai trò</th>
                  <th className="p-4">Tiến độ từ vựng nhóm</th>
                  <th className="p-4">Tiến độ bài đọc nhóm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {progress?.members?.map((m) => (
                  <tr key={m.user_id} className="hover:bg-stone-50/50">
                    <td className="p-4 font-semibold text-stone-900">
                      {m.full_name || m.username}
                    </td>
                    <td className="p-4 text-xs">
                      <span className="badge bg-stone-100 text-stone-700">{m.role}</span>
                    </td>
                    <td className="p-4">
                      <div className="w-40">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-stone-500">
                            {m.vocab_progress?.learned}/{m.vocab_progress?.total} từ
                          </span>
                          <span className="font-bold text-stone-900">
                            {m.vocab_progress?.percent}%
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-700 h-1.5 rounded-full"
                            style={{ width: `${m.vocab_progress?.percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-40">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-stone-500">
                            {m.reading_progress?.completed}/{m.reading_progress?.total} bài
                          </span>
                          <span className="font-bold text-stone-900">
                            {m.reading_progress?.percent}%
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${m.reading_progress?.percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Add content for owner */}
      {activeTab === 'add_content' && group.is_owner && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Vocab Set */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-bold font-serif text-base flex items-center gap-2 text-stone-900">
              <HiPlus className="text-emerald-700" /> Soạn bộ từ vựng mới
            </h3>
            <form onSubmit={handleCreateVocabSet} className="space-y-4">
              <Input
                label="Tiêu đề bộ từ"
                placeholder="Ví dụ: 10 từ vựng cốt lõi Unit 1"
                value={newSetTitle}
                onChange={(e) => setNewSetTitle(e.target.value)}
                required
              />

              <div>
                <label className="label text-xs font-semibold text-stone-700 mb-1.5 block">
                  Mô tả bộ từ
                </label>
                <textarea
                  className="input h-20 resize-none text-xs w-full"
                  placeholder="Ghi chú thêm cho thành viên..."
                  value={newSetDesc}
                  onChange={(e) => setNewSetDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="label text-xs font-semibold text-stone-700 mb-1.5 block">
                  Chọn từ vựng đưa vào bộ (Đã chọn: {selectedVocabIds.length})
                </label>
                <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl p-2 space-y-1 text-xs divide-y divide-stone-100">
                  {allVocabs.slice(0, 50).map((v) => {
                    const isSelected = selectedVocabIds.includes(v.id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => toggleVocabSelect(v.id)}
                        className={`p-2 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span>
                          {v.word} ({v.meaning_vi})
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-emerald-700 focus:ring-emerald-700"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isSavingContent}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white"
              >
                Lưu bộ từ vựng
              </Button>
            </form>
          </div>

          {/* Share Reading */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-bold font-serif text-base flex items-center gap-2 text-stone-900">
              <HiPlus className="text-emerald-700" /> Giao bài đọc cho nhóm
            </h3>
            <form onSubmit={handleAddReading} className="space-y-4">
              <div>
                <label className="label text-xs font-semibold text-stone-700 mb-1.5 block">
                  Chọn bài đọc trong hệ thống
                </label>
                <select
                  className="input py-2 text-sm w-full"
                  value={selectedReadingId}
                  onChange={(e) => setSelectedReadingId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn bài đọc --</option>
                  {allReadings.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 text-xs text-stone-500 space-y-1.5 border border-stone-200">
                <p className="font-semibold text-stone-800">ℹ️ Thông tin:</p>
                <p>Bài đọc được chọn sẽ hiển thị trong mục "Bài đọc được giao" của nhóm.</p>
                <p>Tiến độ làm bài và điểm số của học viên sẽ được ghi nhận vào bảng theo dõi.</p>
              </div>

              <Button
                type="submit"
                isLoading={isSavingContent}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white"
              >
                Giao bài đọc
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa nhóm */}
      {showEditModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-stone-100 text-stone-800">
                <HiPencil className="w-5 h-5 text-stone-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">Chỉnh Sửa Nhóm</h2>
                <p className="text-xs text-stone-500">Cập nhật thông tin chi tiết</p>
              </div>
            </div>

            <form onSubmit={handleEditGroup} className="space-y-4">
              <Input
                label="Tên nhóm học"
                placeholder="Tên nhóm..."
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />

              <div>
                <label className="label text-xs font-semibold text-stone-700 mb-1.5 block">
                  Mô tả nhóm
                </label>
                <textarea
                  className="input h-24 resize-none text-sm w-full"
                  placeholder="Mô tả mục tiêu, thông tin..."
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={isActionLoading}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isLoading={isActionLoading}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa nhóm (Chủ nhóm) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200">
                <HiTrash className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">Xóa Nhóm Học Tập</h2>
                <p className="text-xs text-red-600 font-medium">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa nhóm{' '}
              <strong className="text-stone-900">"{group.name}"</strong>? Toàn bộ danh sách bộ từ vựng, bài đọc được giao và lịch sử học tập của thành viên trong nhóm sẽ bị xóa.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isActionLoading}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleDeleteGroup}
                isLoading={isActionLoading}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận rời nhóm (Thành viên) */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <HiLogout className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">Rời Khỏi Nhóm</h2>
                <p className="text-xs text-stone-500">Xác nhận rời khỏi nhóm</p>
              </div>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              Bạn có chắc chắn muốn rời khỏi nhóm{' '}
              <strong className="text-stone-900">"{group.name}"</strong>?
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowLeaveModal(false)}
                disabled={isActionLoading}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleLeaveGroup}
                isLoading={isActionLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white border-transparent"
              >
                Rời nhóm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
