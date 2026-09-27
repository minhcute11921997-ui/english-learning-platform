import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  HiArrowLeft
} from 'react-icons/hi';

export default function GroupDetailPage() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
    toast.success(`Đã chép mã mời: ${group.invite_code}`);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/groups"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 mb-2"
        >
          <HiArrowLeft /> Quay lại danh sách nhóm
        </Link>
      </div>

      {/* Group Header Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-purple-50 via-white to-blue-50 border border-purple-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.is_owner && (
              <span className="badge bg-purple-100 text-purple-800 font-bold text-xs">
                Chủ nhóm
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{group.description || 'Chưa có mô tả'}</p>
          <p className="text-xs text-gray-400">
            Chủ sở hữu: <strong>{group.owner?.full_name || group.owner?.username}</strong> • Thành viên: <strong>{group.members?.length || 0}</strong>
          </p>
        </div>

        {/* Invite Code Box */}
        <div className="p-3.5 rounded-xl bg-white shadow-sm border border-purple-200 flex items-center gap-3">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase">Mã mời nhóm</p>
            <p className="text-lg font-mono font-bold text-purple-700 tracking-wider">
              {group.invite_code}
            </p>
          </div>
          <button
            onClick={copyCode}
            className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
            title="Sao chép mã mời"
          >
            {copied ? <HiCheck className="w-5 h-5 text-green-600" /> : <HiClipboardCopy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 text-sm font-semibold gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('content')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'content'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiBookOpen className="w-4 h-4" /> Nội dung học ({group.vocabSets?.length || 0} bộ từ, {group.readingSets?.length || 0} bài đọc)
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'members'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiUserGroup className="w-4 h-4" /> Thành viên ({group.members?.length || 0})
        </button>

        {group.is_owner && (
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'progress'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <HiPlus className="w-4 h-4" /> Soạn & Chia sẻ nội dung
          </button>
        )}
      </div>

      {/* Tab 1: Content */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Vocab Sets */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <HiBookOpen className="text-primary-600" /> Các bộ từ vựng của nhóm
            </h2>
            <div className="space-y-4">
              {group.vocabSets?.map((vSet) => (
                <div key={vSet.id} className="card p-5 border space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{vSet.title}</h3>
                      <p className="text-xs text-gray-500">{vSet.description || 'Không có mô tả'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`badge text-xs ${
                          vSet.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {vSet.is_published ? 'Đã phát hành' : 'Bản nháp'}
                      </span>

                      {group.is_owner && !vSet.is_published && (
                        <button
                          onClick={() => handlePublishVocabSet(vSet.id)}
                          className="btn btn-primary text-xs py-1 px-2.5"
                        >
                          Phát hành
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Words preview pills */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t text-xs">
                    {vSet.items?.map((item) => (
                      <span
                        key={item.id}
                        className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium"
                      >
                        <strong>{item.vocabulary?.word}</strong>: {item.vocabulary?.meaning_vi}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {(!group.vocabSets || group.vocabSets.length === 0) && (
                <p className="text-sm text-gray-400 italic">Chưa có bộ từ vựng nào trong nhóm.</p>
              )}
            </div>
          </div>

          {/* Reading Sets */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <HiAcademicCap className="text-green-600" /> Bài đọc được giao
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.readingSets?.map((rSet) => (
                <div key={rSet.id} className="card p-5 border flex flex-col justify-between">
                  <div>
                    <span className="badge bg-green-100 text-green-700 text-xs mb-2">
                      {rSet.reading?.difficulty}
                    </span>
                    <h3 className="font-bold text-gray-900">{rSet.reading?.title}</h3>
                    <p className="text-xs text-gray-500 italic mb-4">{rSet.reading?.title_vi}</p>
                  </div>
                  <Link
                    to={`/readings/${rSet.reading_id}`}
                    className="btn btn-outline text-xs w-full text-center py-2"
                  >
                    Làm bài đọc này
                  </Link>
                </div>
              ))}

              {(!group.readingSets || group.readingSets.length === 0) && (
                <p className="text-sm text-gray-400 italic">Chưa có bài đọc nào được giao.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Members */}
      {activeTab === 'members' && (
        <div className="card divide-y">
          {group.members?.map((m) => (
            <div key={m.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{m.user?.full_name || m.user?.username}</p>
                <p className="text-xs text-gray-500">@{m.user?.username}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="badge bg-gray-100 text-gray-700 text-xs capitalize">
                  {m.role === 'owner' ? 'Chủ nhóm' : 'Học viên'}
                </span>

                {group.is_owner && m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(m.user_id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Xóa khỏi nhóm"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Progress tracking for owner */}
      {activeTab === 'progress' && group.is_owner && (
        <div className="space-y-4">
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b">
                <tr>
                  <th className="p-4">Học viên</th>
                  <th className="p-4">Vai trò</th>
                  <th className="p-4">Tiến độ từ vựng nhóm</th>
                  <th className="p-4">Tiến độ bài đọc nhóm</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {progress?.members?.map((m) => (
                  <tr key={m.user_id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900">
                      {m.full_name || m.username}
                    </td>
                    <td className="p-4 text-xs">
                      <span className="badge bg-gray-100">{m.role}</span>
                    </td>
                    <td className="p-4">
                      <div className="w-36">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{m.vocab_progress?.learned}/{m.vocab_progress?.total} từ</span>
                          <span className="font-bold">{m.vocab_progress?.percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full"
                            style={{ width: `${m.vocab_progress?.percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-36">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{m.reading_progress?.completed}/{m.reading_progress?.total} bài</span>
                          <span className="font-bold">{m.reading_progress?.percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-green-600 h-1.5 rounded-full"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Vocab Set */}
          <div className="card p-6 space-y-4 border">
            <h3 className="font-bold text-lg flex items-center gap-2 text-primary-700">
              <HiPlus /> Soạn bộ từ vựng mới
            </h3>
            <form onSubmit={handleCreateVocabSet} className="space-y-4">
              <Input
                label="Tiêu đề bộ từ"
                placeholder="Ví dụ: 10 từ vựng tuần 1"
                value={newSetTitle}
                onChange={(e) => setNewSetTitle(e.target.value)}
                required
              />

              <div>
                <label className="label">Mô tả bộ từ</label>
                <textarea
                  className="input h-20 resize-none text-xs"
                  placeholder="Ghi chú thêm cho thành viên..."
                  value={newSetDesc}
                  onChange={(e) => setNewSetDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="label">
                  Chọn từ vựng đưa vào bộ (Đã chọn: {selectedVocabIds.length})
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-1 text-xs divide-y">
                  {allVocabs.slice(0, 40).map((v) => {
                    const isSelected = selectedVocabIds.includes(v.id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => toggleVocabSelect(v.id)}
                        className={`p-2 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${
                          isSelected ? 'bg-primary-50 text-primary-900 font-bold' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span>{v.word} ({v.meaning_vi})</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-primary-600"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" isLoading={isSavingContent} className="w-full">
                Lưu bộ từ vựng
              </Button>
            </form>
          </div>

          {/* Share Reading */}
          <div className="card p-6 space-y-4 border">
            <h3 className="font-bold text-lg flex items-center gap-2 text-green-700">
              <HiPlus /> Giao bài đọc cho nhóm
            </h3>
            <form onSubmit={handleAddReading} className="space-y-4">
              <div>
                <label className="label">Chọn bài đọc có sẵn trong hệ thống</label>
                <select
                  className="input py-2 text-sm"
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

              <div className="p-4 rounded-xl bg-gray-50 text-xs text-gray-500 space-y-1 border">
                <p className="font-semibold text-gray-700">ℹ️ Thông tin:</p>
                <p>Bài đọc được chọn sẽ hiển thị trong mục "Bài đọc được giao" của nhóm.</p>
                <p>Tiến độ làm bài và điểm số của học viên sẽ được ghi nhận vào bảng theo dõi.</p>
              </div>

              <Button type="submit" variant="success" isLoading={isSavingContent} className="w-full">
                Giao bài đọc
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
