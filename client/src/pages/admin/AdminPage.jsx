import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminApi, statsApi, topicApi, vocabApi } from '../../api/services';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import VocabImage from '../../components/vocab/VocabImage';
import {
  HiUsers,
  HiChartBar,
  HiLockClosed,
  HiLockOpen,
  HiSearch,
  HiBookOpen,
  HiPlus,
  HiPencil,
  HiTrash,
  HiX
} from 'react-icons/hi';

const EMPTY_VOCAB_FORM = {
  topic_id: '1',
  word: '',
  pronunciation: '',
  part_of_speech: 'noun',
  difficulty: 'easy',
  meaning_vi: '',
  example_sentence: '',
  example_translation: '',
  image_url: '/images/vocab/_placeholder.svg',
  image_alt: '',
  related_artist: '',
  source_ref: '',
  cultural_note: ''
};

export default function AdminPage() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('1');
  const [vocabs, setVocabs] = useState([]);
  const [vocabSearch, setVocabSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showVocabModal, setShowVocabModal] = useState(false);
  const [editingVocab, setEditingVocab] = useState(null);
  const [vocabForm, setVocabForm] = useState(EMPTY_VOCAB_FORM);
  const [isSavingVocab, setIsSavingVocab] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'users') {
        const res = await adminApi.getUsers({ search: search || undefined, page, limit: 20 });
        setUsers(res.data || []);
        setTotalPages(Math.max(1, res.pagination?.totalPages || 1));
      } else if (activeTab === 'stats') {
        const res = await statsApi.getOverview();
        setStats(res.data);
      } else if (activeTab === 'vocabularies') {
        const tRes = await topicApi.getAll();
        const loadedTopics = tRes.data || [];
        setTopics(loadedTopics);
        const targetTopicId = selectedTopicId || String(loadedTopics[0]?.id || '1');
        const vRes = await vocabApi.getByTopic(targetTopicId, { limit: 100 });
        setVocabs(vRes.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tải dữ liệu quản trị');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchTab = async () => {
      try {
        setIsLoading(true);
        if (activeTab === 'users') {
          const res = await adminApi.getUsers({ search: search || undefined, page, limit: 20 });
          if (active) {
            setUsers(res.data || []);
            setTotalPages(Math.max(1, res.pagination?.totalPages || 1));
          }
        } else if (activeTab === 'stats') {
          const res = await statsApi.getOverview();
          if (active) setStats(res.data);
        } else if (activeTab === 'vocabularies') {
          const tRes = await topicApi.getAll();
          if (!active) return;
          const loadedTopics = tRes.data || [];
          setTopics(loadedTopics);
          const targetTopicId = selectedTopicId || String(loadedTopics[0]?.id || '1');
          const vRes = await vocabApi.getByTopic(targetTopicId, { limit: 100 });
          if (active) setVocabs(vRes.data || []);
        }
      } catch (err) {
        if (active) toast.error(err.message || 'Không thể tải dữ liệu quản trị');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchTab();
    return () => {
      active = false;
    };
  }, [activeTab, selectedTopicId, page, search]);

  const applySearch = () => {
    const term = searchUser.trim();
    if (page === 1 && term === search) loadData();
    else { setPage(1); setSearch(term); }
  };

  useEffect(() => {
    if (!showVocabModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowVocabModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVocabModal]);

  const handleTabSelect = (tab) => {
    if (tab !== activeTab) {
      setIsLoading(true);
      setActiveTab(tab);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    if (userId === currentUser?.id) {
      toast.error('Bạn không thể tự khóa tài khoản của chính mình.');
      return;
    }
    try {
      const res = await adminApi.toggleStatus(userId);
      toast.success(res.message || 'Đã cập nhật trạng thái');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
      );
    } catch (err) {
      toast.error(err.message || 'Thao tác thất bại');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?.id && newRole !== 'admin') {
      toast.error('Bạn không thể tự hạ quyền quản trị của chính mình.');
      return;
    }
    try {
      await adminApi.updateRole(userId, newRole);
      toast.success('Đã cập nhật vai trò người dùng!');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error(err.message || 'Đổi vai trò thất bại');
    }
  };

  const openCreateVocabModal = () => {
    setEditingVocab(null);
    setVocabForm({
      ...EMPTY_VOCAB_FORM,
      topic_id: selectedTopicId || String(topics[0]?.id || '1')
    });
    setShowVocabModal(true);
  };

  const openEditVocabModal = (vocab) => {
    setEditingVocab(vocab);
    setVocabForm({
      topic_id: String(vocab.topic_id || selectedTopicId || '1'),
      word: vocab.word || '',
      pronunciation: vocab.pronunciation || '',
      part_of_speech: vocab.part_of_speech || 'noun',
      difficulty: vocab.difficulty || 'easy',
      meaning_vi: vocab.meaning_vi || '',
      example_sentence: vocab.example_sentence || '',
      example_translation: vocab.example_translation || '',
      image_url: vocab.image_url || '/images/vocab/_placeholder.svg',
      image_alt: vocab.image_alt || '',
      related_artist: vocab.related_artist || '',
      source_ref: vocab.source_ref || '',
      cultural_note: vocab.cultural_note || ''
    });
    setShowVocabModal(true);
  };

  const handleSaveVocab = async (e) => {
    e.preventDefault();
    if (!vocabForm.word.trim() || !vocabForm.meaning_vi.trim()) {
      toast.error('Vui lòng nhập đầy đủ từ tiếng Anh và nghĩa tiếng Việt.');
      return;
    }

    const payload = {
      ...vocabForm,
      topic_id: Number(vocabForm.topic_id),
      word: vocabForm.word.trim(),
      meaning_vi: vocabForm.meaning_vi.trim(),
      pronunciation: vocabForm.pronunciation.trim() || null,
      example_sentence: vocabForm.example_sentence.trim() || null,
      example_translation: vocabForm.example_translation.trim() || null,
      image_url: vocabForm.image_url.trim() || '/images/vocab/_placeholder.svg',
      image_alt: vocabForm.image_alt.trim() || vocabForm.word.trim(),
      related_artist: vocabForm.related_artist.trim() || null,
      source_ref: vocabForm.source_ref.trim() || null,
      cultural_note: vocabForm.cultural_note.trim() || null
    };

    try {
      setIsSavingVocab(true);
      if (editingVocab) {
        await adminApi.updateVocab(editingVocab.id, payload);
        toast.success(`Đã cập nhật thuật ngữ "${payload.word}"`);
      } else {
        await adminApi.createVocab(payload);
        toast.success(`Đã thêm thuật ngữ "${payload.word}"`);
      }
      setShowVocabModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Lưu thuật ngữ thất bại');
    } finally {
      setIsSavingVocab(false);
    }
  };

  const handleDeleteVocab = async (vocab) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thuật ngữ "${vocab.word}"?`)) {
      return;
    }
    try {
      await adminApi.deleteVocab(vocab.id);
      toast.success(`Đã xóa "${vocab.word}"`);
      setVocabs((prev) => prev.filter((item) => item.id !== vocab.id));
    } catch (err) {
      toast.error(err.message || 'Xóa thuật ngữ thất bại');
    }
  };

  const filteredVocabs = vocabs.filter((v) => {
    const q = vocabSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      v.word.toLowerCase().includes(q) ||
      v.meaning_vi.toLowerCase().includes(q) ||
      (v.related_artist && v.related_artist.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-14">
      <div>
        <h1 className="page-title">
          Quản trị EngLearn
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quản lý tài khoản, từ vựng và số liệu của hệ thống.
        </p>
      </div>

      {/* Tabs */}
      <div className="studio-tabs text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => handleTabSelect('users')}
          className={`py-2 px-1 sm:px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiUsers className="w-4 h-4" /> Quản lý người dùng
        </button>
        <button
          type="button"
          onClick={() => handleTabSelect('stats')}
          className={`py-2 px-1 sm:px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'stats' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiChartBar className="w-4 h-4" /> Thống kê tổng quan
        </button>
        <button
          type="button"
          onClick={() => handleTabSelect('vocabularies')}
          className={`py-2 px-1 sm:px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'vocabularies' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiBookOpen className="w-4 h-4" /> Quản lý từ vựng
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" text="Đang tải dữ liệu quản trị..." />
        </div>
      ) : (
        <>
          {/* Tab 1: Users */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                  <HiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    className="input pl-10 py-2 text-xs rounded-xl"
                    placeholder="Tìm username hoặc email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                  />
                </div>
                <Button onClick={loadData} variant="secondary" size="sm" className="rounded-xl text-xs py-2 px-4">
                  Làm mới
                </Button>
              </div>

              <div className="card overflow-x-auto p-0 border border-slate-200/90 rounded-3xl shadow-sm bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">Người dùng</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {users.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70">
                          <td className="p-4 font-bold text-slate-900">
                            <div>
                              <p>
                                {u.full_name}
                                {isSelf && (
                                  <span className="ml-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                    Bạn
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 font-mono font-normal">@{u.username}</p>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-mono text-slate-600">{u.email}</td>
                          <td className="p-4">
                            <select
                              className="input py-1 text-xs rounded-xl w-auto disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="learner">Học viên (learner)</option>
                              <option value="admin">Quản trị viên (admin)</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <span
                              className={`badge text-[10px] uppercase font-mono font-bold px-2 py-0.5 ${
                                u.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                            </span>
                          </td>
                          <td className="p-4">
                            {isSelf ? (
                              <span className="text-xs font-mono text-slate-400">Đang đăng nhập</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u.id)}
                                className={`btn py-1 px-3 text-xs gap-1 rounded-xl cursor-pointer ${
                                  u.is_active ? 'btn-danger' : 'btn-success'
                                }`}
                              >
                                {u.is_active ? (
                                  <>
                                    <HiLockClosed /> Khóa
                                  </>
                                ) : (
                                  <>
                                    <HiLockOpen /> Mở khóa
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Trang trước
                </Button>
                <span>Trang {page} / {totalPages}</span>
                <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Trang sau
                </Button>
              </div>
            </div>
          )}

          {/* Tab 2: Overview stats */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="card text-center p-7 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
                <p className="font-mono text-xs uppercase font-bold text-slate-500">Tổng người dùng</p>
                <p className="text-4xl font-extrabold text-slate-900 tracking-tight mt-2">{stats.totalUsers}</p>
              </div>

              <div className="card text-center p-7 bg-white border border-blue-200/80 bg-blue-50/20 rounded-3xl shadow-sm">
                <p className="font-mono text-xs uppercase font-bold text-blue-700">Thuật ngữ mỹ thuật</p>
                <p className="text-4xl font-extrabold text-blue-600 tracking-tight mt-2">{stats.totalVocab}</p>
              </div>

              <div className="card text-center p-7 bg-white border border-emerald-200/80 bg-emerald-50/20 rounded-3xl shadow-sm">
                <p className="font-mono text-xs uppercase font-bold text-emerald-700">Chuyên đề mỹ thuật</p>
                <p className="text-4xl font-extrabold text-emerald-600 tracking-tight mt-2">{stats.totalTopics}</p>
              </div>
            </div>
          )}

          {/* Tab 3: Vocabularies */}
          {activeTab === 'vocabularies' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <select
                    value={selectedTopicId}
                    onChange={(e) => {
                      setIsLoading(true);
                      setSelectedTopicId(e.target.value);
                    }}
                    className="input py-2 text-xs rounded-xl sm:w-64"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.name_vi} ({t.vocab_count} từ)
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1 max-w-sm">
                    <HiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      className="input pl-10 py-2 text-xs rounded-xl"
                      placeholder="Tìm thuật ngữ, nghĩa hoặc nghệ sĩ..."
                      value={vocabSearch}
                      onChange={(e) => setVocabSearch(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={openCreateVocabModal}
                  className="btn-primary rounded-xl text-xs py-2.5 px-4 gap-1.5 shrink-0"
                >
                  <HiPlus className="w-4 h-4" /> Thêm thuật ngữ
                </Button>
              </div>

              <div className="card overflow-x-auto p-0 border border-slate-200/90 rounded-3xl shadow-sm bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">Thuật ngữ</th>
                      <th className="p-4">Nghĩa tiếng Việt</th>
                      <th className="p-4">Từ loại &amp; Độ khó</th>
                      <th className="p-4">Nghệ sĩ / Làng nghề</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredVocabs.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/70">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                              <VocabImage src={v.image_url} alt={v.word} fit="cover" className="w-full h-full" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{v.word}</p>
                              <p className="text-[11px] font-mono text-slate-400">{v.pronunciation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs sm:text-sm font-semibold text-slate-800">{v.meaning_vi}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="badge bg-slate-100 text-slate-700 font-mono text-[10px] uppercase">
                              {v.part_of_speech}
                            </span>
                            <span className="badge bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] uppercase">
                              {v.difficulty}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-slate-600 max-w-xs truncate">
                          {v.related_artist || '—'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditVocabModal(v)}
                              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <HiPencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVocab(v)}
                              className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                              title="Xóa"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Thêm / Sửa Thuật Ngữ */}
      {showVocabModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setShowVocabModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingVocab ? `Chỉnh sửa: ${editingVocab.word}` : 'Thêm thuật ngữ mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowVocabModal(false)}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVocab} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Chuyên đề</label>
                  <select
                    className="input text-xs py-2"
                    value={vocabForm.topic_id}
                    onChange={(e) => setVocabForm({ ...vocabForm, topic_id: e.target.value })}
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.name_vi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Thuật ngữ tiếng Anh *</label>
                  <input
                    type="text"
                    required
                    className="input text-xs py-2"
                    value={vocabForm.word}
                    onChange={(e) => setVocabForm({ ...vocabForm, word: e.target.value })}
                    placeholder="Ví dụ: oil painting"
                  />
                </div>

                <div>
                  <label className="label">Phiên âm IPA</label>
                  <input
                    type="text"
                    className="input text-xs py-2 font-mono"
                    value={vocabForm.pronunciation}
                    onChange={(e) => setVocabForm({ ...vocabForm, pronunciation: e.target.value })}
                    placeholder="/ɔɪl ˈpeɪn.tɪŋ/"
                  />
                </div>

                <div>
                  <label className="label">Nghĩa tiếng Việt *</label>
                  <input
                    type="text"
                    required
                    className="input text-xs py-2"
                    value={vocabForm.meaning_vi}
                    onChange={(e) => setVocabForm({ ...vocabForm, meaning_vi: e.target.value })}
                    placeholder="Tranh sơn dầu"
                  />
                </div>

                <div>
                  <label className="label">Từ loại</label>
                  <select
                    className="input text-xs py-2"
                    value={vocabForm.part_of_speech}
                    onChange={(e) => setVocabForm({ ...vocabForm, part_of_speech: e.target.value })}
                  >
                    <option value="noun">noun</option>
                    <option value="verb">verb</option>
                    <option value="adjective">adjective</option>
                    <option value="adverb">adverb</option>
                    <option value="preposition">preposition</option>
                    <option value="conjunction">conjunction</option>
                    <option value="pronoun">pronoun</option>
                  </select>
                </div>

                <div>
                  <label className="label">Độ khó</label>
                  <select
                    className="input text-xs py-2"
                    value={vocabForm.difficulty}
                    onChange={(e) => setVocabForm({ ...vocabForm, difficulty: e.target.value })}
                  >
                    <option value="easy">easy</option>
                    <option value="medium">medium</option>
                    <option value="hard">hard</option>
                  </select>
                </div>

                <div>
                  <label className="label">Đường dẫn ảnh</label>
                  <input
                    type="text"
                    className="input text-xs py-2 font-mono"
                    value={vocabForm.image_url}
                    onChange={(e) => setVocabForm({ ...vocabForm, image_url: e.target.value })}
                    placeholder="/images/vocab/oil_painting.jpg"
                  />
                </div>

                <div>
                  <label className="label">Nguồn tham chiếu</label>
                  <input
                    type="text"
                    className="input text-xs py-2"
                    value={vocabForm.source_ref}
                    onChange={(e) => setVocabForm({ ...vocabForm, source_ref: e.target.value })}
                    placeholder="Oxford Art Dictionary"
                  />
                </div>
              </div>

              <div>
                <label className="label">Nghệ sĩ / Làng nghề tiêu biểu</label>
                <input
                  type="text"
                  className="input text-xs py-2"
                  value={vocabForm.related_artist}
                  onChange={(e) => setVocabForm({ ...vocabForm, related_artist: e.target.value })}
                  placeholder="Jan van Eyck, Tô Ngọc Vân..."
                />
              </div>

              <div>
                <label className="label">Câu ví dụ tiếng Anh</label>
                <input
                  type="text"
                  className="input text-xs py-2"
                  value={vocabForm.example_sentence}
                  onChange={(e) => setVocabForm({ ...vocabForm, example_sentence: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Dịch câu ví dụ</label>
                <input
                  type="text"
                  className="input text-xs py-2"
                  value={vocabForm.example_translation}
                  onChange={(e) => setVocabForm({ ...vocabForm, example_translation: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Bối cảnh văn hóa &amp; lịch sử</label>
                <textarea
                  rows="3"
                  className="input text-xs py-2"
                  value={vocabForm.cultural_note}
                  onChange={(e) => setVocabForm({ ...vocabForm, cultural_note: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowVocabModal(false)}
                  className="rounded-xl text-xs py-2 px-4"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isLoading={isSavingVocab}
                  className="btn-primary rounded-xl text-xs py-2 px-5"
                >
                  {editingVocab ? 'Lưu thay đổi' : 'Thêm thuật ngữ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
