import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { aiApi, vocabApi } from '../../api/services';
import VocabImage from '../../components/vocab/VocabImage';
import AddToListModal from '../../components/vocab/AddToListModal';
import {
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineArrowUpTray,
  HiOutlineTrash,
  HiOutlineBookmark,
  HiOutlineCheckCircle,
  HiOutlineBookOpen,
  HiOutlineLightBulb,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineExclamationTriangle,
  HiOutlineCpuChip,
  HiOutlineHandThumbUp,
  HiOutlineHandThumbDown,
  HiOutlineTag
} from 'react-icons/hi2';
import { HiVolumeUp } from 'react-icons/hi';

const STORAGE_KEY = 'englearn_ai_vision_history_v2';
const MAX_HISTORY_ITEMS = 12;

const SAMPLE_ARTWORKS = [
  { label: 'Sơn dầu', url: '/images/vocab/oil_painting.jpg' },
  { label: 'Màu nước', url: '/images/vocab/watercolor.jpg' },
  { label: 'Gốm sứ', url: '/images/vocab/ceramics.jpg' },
  { label: 'Sơn mài', url: '/images/vocab/lacquerware.jpg' },
  { label: 'Origami', url: '/images/vocab/origami.jpg' }
];

function loadSavedHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function processClientImage(fileOrBlob) {
  return new Promise((resolve) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(fileOrBlob);
    img.onload = () => {
      try {
        // 1) Compact thumbnail for localStorage chat history (<= 260px)
        const thumbScale = Math.min(1, 260 / Math.max(img.width, img.height));
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = Math.max(1, Math.round(img.width * thumbScale));
        thumbCanvas.height = Math.max(1, Math.round(img.height * thumbScale));
        thumbCanvas.getContext('2d').drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
        const previewUrl = thumbCanvas.toDataURL('image/jpeg', 0.72);

        // 2) Downscaled upload image (<= 640px JPEG) to slash bandwidth & server CPU
        const upScale = Math.min(1, 640 / Math.max(img.width, img.height));
        const upCanvas = document.createElement('canvas');
        upCanvas.width = Math.max(1, Math.round(img.width * upScale));
        upCanvas.height = Math.max(1, Math.round(img.height * upScale));
        upCanvas.getContext('2d').drawImage(img, 0, 0, upCanvas.width, upCanvas.height);

        upCanvas.toBlob(
          (blob) => {
            resolve({ previewUrl, uploadBlob: blob || fileOrBlob });
          },
          'image/jpeg',
          0.86
        );
      } catch {
        resolve({ previewUrl: '', uploadBlob: fileOrBlob });
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      resolve({ previewUrl: '', uploadBlob: fileOrBlob });
    };
    img.src = objUrl;
  });
}

function getStatusBadge(result) {
  if (result.status === 'out_of_scope') {
    return {
      text: 'Ngoài phạm vi mỹ thuật',
      cls: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  }
  if (result.preliminary) {
    return {
      text: 'Kết quả nhanh (đang tinh chỉnh...)',
      cls: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
  }
  if (result.status === 'uncertain') {
    return {
      text: result.fallback ? 'Gợi ý nhanh (AI bận)' : 'Nhiều khả năng (xem gợi ý)',
      cls: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
  }
  if (result.cached) {
    return {
      text: result.cacheType === 'phash' ? 'Khớp gần giống (Cache)' : 'Khớp tức thì (Cache)',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }
  return {
    text: result.mode === 'probe_blend' ? 'SigLIP + Probe (Local)' : 'SigLIP (Local)',
    cls: 'bg-blue-50 text-blue-700 border-blue-200'
  };
}

export default function AiChatPage() {
  const [messages, setMessages] = useState(loadSavedHistory);
  const [aiHealth, setAiHealth] = useState(null);
  const [allVocabWords, setAllVocabWords] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVocabForList, setSelectedVocabForList] = useState(null);
  const [expandedPanels, setExpandedPanels] = useState({});
  const [learnedIds, setLearnedIds] = useState({});
  const [selectedVocabByMsg, setSelectedVocabByMsg] = useState({});
  const [feedbackByMsg, setFeedbackByMsg] = useState({});
  const [correctionOpenMsg, setCorrectionOpenMsg] = useState(null);
  const [correctionWord, setCorrectionWord] = useState('');

  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const [hRes, t1, t2] = await Promise.all([
          aiApi.health().catch(() => ({ data: { ready: false } })),
          vocabApi.getByTopic(1, { limit: 100 }).catch(() => ({ data: [] })),
          vocabApi.getByTopic(2, { limit: 100 }).catch(() => ({ data: [] }))
        ]);
        if (!active) return;
        setAiHealth(hRes.data || { ready: false });
        const merged = [...(t1.data || []), ...(t2.data || [])]
          .map((v) => ({ word: v.word, meaning_vi: v.meaning_vi }))
          .sort((a, b) => a.word.localeCompare(b.word));
        setAllVocabWords(merged);
      } catch {
        if (active) setAiHealth({ ready: false });
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY_ITEMS)));
    } catch {
      // Ignore quota errors
    }
  }, [messages]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  const handleSpeak = (word) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } else {
      toast.error('Trình duyệt không hỗ trợ phát âm');
    }
  };

  const pollRefineJob = useCallback((msgId, jobId) => {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const res = await aiApi.refineStatus(jobId);
        const job = res.data;
        if (job?.status === 'done' && job.result) {
          clearInterval(timer);
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, result: job.result } : m))
          );
        } else if (attempts >= 12) {
          clearInterval(timer);
        }
      } catch {
        clearInterval(timer);
      }
    }, 1200);
  }, []);

  const submitImageFile = useCallback(async (file, labelHint = '') => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (file.type && !validTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB.');
      return;
    }

    setIsSubmitting(true);
    const { previewUrl, uploadBlob } = await processClientImage(file);
    const userMsgId = `u-${Date.now()}`;

    setMessages((prev) => [
      ...prev.slice(-(MAX_HISTORY_ITEMS - 1)),
      {
        id: userMsgId,
        role: 'user',
        previewUrl,
        fileName: labelHint || file.name || 'image.jpg',
        createdAt: new Date().toISOString()
      }
    ]);

    try {
      const formData = new FormData();
      formData.append('image', uploadBlob, file.name || 'upload.jpg');
      formData.append('action', 'identify');

      const res = await aiApi.identify(formData);
      const data = res.data;
      const assistantMsgId = `a-${Date.now()}`;

      setMessages((prev) => [
        ...prev.slice(-(MAX_HISTORY_ITEMS - 1)),
        {
          id: assistantMsgId,
          role: 'assistant',
          result: data,
          createdAt: new Date().toISOString()
        }
      ]);

      if (data?.preliminary && data?.refineJobId) {
        pollRefineJob(assistantMsgId, data.refineJobId);
      }
    } catch (err) {
      const status = err.response?.status;
      const retryAfter = err.response?.headers?.['retry-after'];
      const errMsg =
        status === 429
          ? `Hệ thống AI đang xử lý nhiều ảnh. Vui lòng đợi ${retryAfter || 3} giây rồi thử lại.`
          : err.response?.data?.message || err.message || 'Không thể kết nối dịch vụ AI local.';

      toast.error(errMsg);
      setMessages((prev) => [
        ...prev.slice(-(MAX_HISTORY_ITEMS - 1)),
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          error: errMsg,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [pollRefineJob]);

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            submitImageFile(blob, 'Ảnh dán từ Clipboard');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [submitImageFile]);

  const handleSampleClick = async (sample) => {
    if (isSubmitting) return;
    try {
      const resp = await fetch(sample.url);
      const blob = await resp.blob();
      const file = new File([blob], `${sample.label}.jpg`, { type: blob.type || 'image/jpeg' });
      await submitImageFile(file, `Mẫu: ${sample.label}`);
    } catch {
      toast.error('Không thể tải ảnh mẫu');
    }
  };

  const handleMarkLearned = async (vocab) => {
    try {
      await vocabApi.markAsLearned(vocab.id);
      setLearnedIds((prev) => ({ ...prev, [vocab.id]: true }));
      toast.success(`Đã thêm "${vocab.word}" vào lộ trình ôn tập!`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể lưu tiến độ');
    }
  };

  const handleFeedback = async (msgId, result, vocab, isCorrect, corrected = null) => {
    if (!result?.imageHash) return;
    try {
      await aiApi.feedback({
        imageHash: result.imageHash,
        embId: result.embId || null,
        predictedWord: vocab?.word || null,
        correctedWord: isCorrect ? vocab?.word : corrected,
        isCorrect,
        tier: result.tier,
        confidence: result.matches?.[0]?.confidence ?? null
      });
      setFeedbackByMsg((prev) => ({
        ...prev,
        [msgId]: isCorrect ? 'correct' : `corrected:${corrected}`
      }));
      setCorrectionOpenMsg(null);
      setCorrectionWord('');
      toast.success('Đã ghi nhận phản hồi của bạn!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể gửi phản hồi');
    }
  };

  const togglePanel = (msgId, panel) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === panel ? null : panel
    }));
  };

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Đã xóa lịch sử nhận diện');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Studio Header & Local AI Health */}
      <div className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
            <HiOutlineSparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              AI Nhận diện Mỹ thuật &amp; Mỹ nghệ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tải ảnh tác phẩm hội họa hoặc nghề thủ công — AI local nhận diện đa khía cạnh (thể loại, chất liệu, nghề) và trả từ vựng tiếng Anh chuẩn giáo trình.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              aiHealth?.ready
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title="Trạng thái mô hình chạy local"
          >
            <HiOutlineCpuChip className="w-4 h-4" />
            <span>{aiHealth?.ready ? 'Local AI sẵn sàng' : 'AI đang khởi động / offline'}</span>
            {aiHealth?.metrics?.p50Ms > 0 && (
              <span className="font-mono text-[11px] opacity-80">• {aiHealth.metrics.p50Ms}ms</span>
            )}
            {aiHealth?.tier1?.queueSize > 0 && (
              <span className="font-mono text-[11px] opacity-80">• Q:{aiHealth.tier1.queueSize}</span>
            )}
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="btn btn-secondary px-3 py-1.5 text-xs gap-1.5"
              title="Xóa lịch sử chat"
            >
              <HiOutlineTrash className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Conversation Area */}
      <div className="card p-4 sm:p-6 min-h-[380px] max-h-[60vh] overflow-y-auto space-y-5 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
              <HiOutlinePhoto className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Bắt đầu bằng cách gửi một bức ảnh
            </h2>
            <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
              Hỗ trợ 60 thuật ngữ chuyên ngành thuộc 2 chủ đề: <strong>Các loại tranh</strong> và <strong>Ngành nghề mỹ nghệ</strong>. Ảnh được thu gọn ngay trên trình duyệt trước khi gửi.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">Thử nhanh:</span>
              {SAMPLE_ARTWORKS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSampleClick(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-xs bg-blue-600 text-white rounded-2xl rounded-tr-sm p-2.5 shadow-sm">
                    {msg.previewUrl && (
                      <img
                        src={msg.previewUrl}
                        alt={msg.fileName}
                        className="w-52 h-40 object-cover rounded-xl bg-blue-700"
                      />
                    )}
                    <div className="text-[11px] text-blue-100 mt-1.5 px-1 truncate">
                      {msg.fileName}
                    </div>
                  </div>
                </div>
              );
            }

            if (msg.error) {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-lg bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-start gap-2.5">
                    <HiOutlineExclamationTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{msg.error}</span>
                  </div>
                </div>
              );
            }

            const result = msg.result;
            const badge = getStatusBadge(result);
            const matches = result.matches || [];
            const facets = result.facets || [];

            // Resolve active displayed vocabulary (from facet pill, match chip, or default top-1)
            const chosenWord = selectedVocabByMsg[msg.id];
            const chosenEntry =
              matches.find((m) => m.word === chosenWord) ||
              facets.find((f) => f.word === chosenWord) ||
              matches[0];
            const vocab = chosenEntry?.vocabulary;
            const confidence = chosenEntry?.confidence ?? matches[0]?.confidence ?? 0;
            const activePanel = expandedPanels[msg.id];
            const fbState = feedbackByMsg[msg.id];

            return (
              <div key={msg.id} className="flex justify-start">
                <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-xs space-y-4">
                  {/* Metadata row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                      {badge.text}
                    </span>
                    {typeof result.latencyMs === 'number' && (
                      <span className="text-[11px] font-mono text-slate-400">
                        {result.latencyMs}ms
                      </span>
                    )}
                  </div>

                  {result.status === 'out_of_scope' || !vocab ? (
                    <div className="flex items-start gap-2.5 text-sm text-slate-700 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
                      <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{result.message}</p>
                    </div>
                  ) : (
                    <>
                      {/* Multi-facet pills (e.g. Thể loại: portrait + Chất liệu: oil painting) */}
                      {facets.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <HiOutlineTag className="w-3.5 h-3.5" />
                            Nhóm nhận diện:
                          </span>
                          {facets.map((f) => {
                            const active = vocab.word === f.word;
                            return (
                              <button
                                key={`${f.facet}-${f.word}`}
                                type="button"
                                onClick={() =>
                                  setSelectedVocabByMsg((prev) => ({ ...prev, [msg.id]: f.word }))
                                }
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                                }`}
                              >
                                <span className={active ? 'text-blue-100' : 'text-slate-400'}>
                                  {f.facetLabelVi}:{' '}
                                </span>
                                {f.word}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Primary Vocabulary Card */}
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <VocabImage
                          src={vocab.image_url}
                          alt={vocab.image_alt || vocab.word}
                          className="w-full sm:w-36 h-32 rounded-xl bg-slate-100 border border-slate-200 shrink-0"
                          fit="cover"
                          enableZoom
                        />

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-extrabold text-slate-900">
                              {vocab.word}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleSpeak(vocab.word)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Nghe phát âm"
                            >
                              <HiVolumeUp className="w-4 h-4" />
                            </button>
                            {vocab.part_of_speech && (
                              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {vocab.part_of_speech}
                              </span>
                            )}
                            <span className="text-xs font-mono font-bold text-blue-600 ml-auto">
                              {Math.round(confidence * 100)}% khớp
                            </span>
                          </div>

                          {vocab.pronunciation && (
                            <div className="text-xs font-mono text-slate-500">
                              {vocab.pronunciation}
                            </div>
                          )}

                          <div className="text-base font-bold text-blue-700">
                            {vocab.meaning_vi}
                          </div>

                          {vocab.topic && (
                            <div className="text-xs text-slate-500">
                              Chủ đề:{' '}
                              <Link
                                to={`/topics/${vocab.topic.id}`}
                                className="font-semibold text-slate-700 hover:text-blue-600 inline-flex items-center gap-1"
                              >
                                {vocab.topic.name_vi}
                                <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Structured Quick-Action Chips */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {vocab.example_sentence && (
                          <button
                            type="button"
                            onClick={() => togglePanel(msg.id, 'example')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                              activePanel === 'example'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <HiOutlineBookOpen className="w-4 h-4" />
                            Xem ví dụ
                          </button>
                        )}

                        {vocab.cultural_note && (
                          <button
                            type="button"
                            onClick={() => togglePanel(msg.id, 'culture')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                              activePanel === 'culture'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <HiOutlineLightBulb className="w-4 h-4" />
                            Ghi chú văn hóa
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedVocabForList(vocab)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <HiOutlineBookmark className="w-4 h-4" />
                          Thêm vào sổ từ
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkLearned(vocab)}
                          disabled={Boolean(learnedIds[vocab.id])}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer ${
                            learnedIds[vocab.id]
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <HiOutlineCheckCircle className="w-4 h-4" />
                          {learnedIds[vocab.id] ? 'Đã đánh dấu học' : 'Đánh dấu đã học'}
                        </button>
                      </div>

                      {activePanel === 'example' && vocab.example_sentence && (
                        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-xs space-y-1">
                          <p className="font-semibold text-slate-800">&ldquo;{vocab.example_sentence}&rdquo;</p>
                          {vocab.example_translation && (
                            <p className="text-slate-500">{vocab.example_translation}</p>
                          )}
                        </div>
                      )}

                      {activePanel === 'culture' && vocab.cultural_note && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-xs space-y-1.5 text-slate-700">
                          <p className="leading-relaxed">{vocab.cultural_note}</p>
                          {vocab.related_artist && (
                            <p className="text-slate-500">
                              <strong>Tiêu biểu:</strong> {vocab.related_artist}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Alternative matches */}
                      {matches.length > 1 && (
                        <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">
                            Top gợi ý:
                          </span>
                          {matches.map((m) => (
                            <button
                              key={m.word}
                              type="button"
                              onClick={() =>
                                setSelectedVocabByMsg((prev) => ({ ...prev, [msg.id]: m.word }))
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                vocab.word === m.word
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {m.vocabulary.word} ({Math.round((m.confidence || 0) * 100)}%)
                            </button>
                          ))}
                        </div>
                      )}

                      {/* User Feedback Loop (Đúng / Sai - chọn nhãn đúng) */}
                      {result.imageHash && (
                        <div className="border-t border-slate-100 pt-3 space-y-2">
                          {fbState ? (
                            <div className="text-xs font-semibold text-emerald-700">
                              {fbState === 'correct'
                                ? '✓ Đã xác nhận kết quả chính xác.'
                                : `✓ Đã ghi nhận nhãn đúng: "${fbState.replace('corrected:', '')}".`}
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] text-slate-400">Nhận diện này đúng không?</span>
                              <button
                                type="button"
                                onClick={() => handleFeedback(msg.id, result, vocab, true)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <HiOutlineHandThumbUp className="w-3.5 h-3.5" />
                                Đúng
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCorrectionOpenMsg(correctionOpenMsg === msg.id ? null : msg.id);
                                  setCorrectionWord('');
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <HiOutlineHandThumbDown className="w-3.5 h-3.5" />
                                Sai – chọn từ đúng
                              </button>
                            </div>
                          )}

                          {correctionOpenMsg === msg.id && !fbState && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <select
                                value={correctionWord}
                                onChange={(e) => setCorrectionWord(e.target.value)}
                                className="input py-1.5 px-3 text-xs w-auto min-w-[220px]"
                              >
                                <option value="">-- Chọn thuật ngữ đúng --</option>
                                {allVocabWords.map((v) => (
                                  <option key={v.word} value={v.word}>
                                    {v.word} ({v.meaning_vi})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={!correctionWord}
                                onClick={() =>
                                  handleFeedback(msg.id, result, vocab, false, correctionWord)
                                }
                                className="btn btn-primary py-1.5 px-3 text-xs"
                              >
                                Gửi chỉnh sửa
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isSubmitting && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-xs font-semibold text-slate-500 flex items-center gap-2.5 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              Đang phân tích hình ảnh qua AI local...
            </div>
          </div>
        )}
        <div ref={threadEndRef} />
      </div>

      {/* Structured Image Input Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const dropped = e.dataTransfer?.files?.[0];
          if (dropped) submitImageFile(dropped);
        }}
        className={`card p-4 sm:p-5 border-2 border-dashed transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/60'
            : 'border-slate-300 hover:border-blue-400 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) submitImageFile(picked);
            e.target.value = '';
          }}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <HiOutlineArrowUpTray className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Kéo thả ảnh vào đây, dán ảnh (<kbd className="px-1.5 py-0.5 text-[11px] bg-slate-100 rounded border border-slate-300">Ctrl+V</kbd>), hoặc chọn tệp
              </p>
              <p className="text-xs text-slate-500">
                Định dạng JPG, PNG, WEBP tối đa 5MB • Tự động thu gọn ảnh trên trình duyệt trước khi gửi
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary shrink-0 gap-2 w-full sm:w-auto"
          >
            <HiOutlinePhoto className="w-4 h-4" />
            {isSubmitting ? 'Đang nhận diện...' : 'Chọn ảnh nhận diện'}
          </button>
        </div>

        {messages.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Ảnh mẫu:</span>
            {SAMPLE_ARTWORKS.map((s) => (
              <button
                key={s.label}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSampleClick(s)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <AddToListModal
        isOpen={Boolean(selectedVocabForList)}
        onClose={() => setSelectedVocabForList(null)}
        vocab={selectedVocabForList}
      />
    </div>
  );
}
