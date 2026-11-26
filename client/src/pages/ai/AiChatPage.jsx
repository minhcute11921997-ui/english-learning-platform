import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { aiApi, vocabApi } from '../../api/services';
import useAuthStore from '../../stores/authStore';
import AddToListModal from '../../components/vocab/AddToListModal';
import {
  HiOutlinePhoto,
  HiOutlineArrowUpTray,
  HiOutlineTrash,
  HiOutlineBookmark,
  HiOutlineCheckCircle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import { HiVolumeUp } from 'react-icons/hi';

const STORAGE_KEY = 'englearn_ai_vision_history_v3';
const MAX_HISTORY_ITEMS = 12;

const SAMPLE_ARTWORKS = [
  { label: 'Tranh khắc gỗ', url: '/images/vocab/printmaking.jpg' },
  { label: 'Sơn dầu', url: '/images/vocab/oil_painting.jpg' },
  { label: 'Màu nước', url: '/images/vocab/watercolor.jpg' },
  { label: 'Gốm sứ', url: '/images/vocab/ceramics.jpg' },
  { label: 'Sơn mài', url: '/images/vocab/lacquerware.jpg' },
  { label: 'Origami', url: '/images/vocab/origami.jpg' }
];

function loadSavedHistory(historyKey) {
  try {
    const raw = localStorage.getItem(historyKey);
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

export default function AiChatPage() {
  const userId = useAuthStore(state => state.user?.id);
  if (userId == null) return null;
  return <ImageLookup key={userId} historyKey={`${STORAGE_KEY}:${userId}`} />;
}

function ImageLookup({ historyKey }) {
  const [messages, setMessages] = useState(() => loadSavedHistory(historyKey));
  const [aiHealth, setAiHealth] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVocabForList, setSelectedVocabForList] = useState(null);
  const [learnedIds, setLearnedIds] = useState({});

  const fileInputRef = useRef(null);
  const latestResultRef = useRef(null);
  const scrollOnResult = useRef(false);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    aiApi
      .health()
      .then((hRes) => {
        if (active) setAiHealth(hRes.data || { ready: false });
      })
      .catch(() => {
        if (active) setAiHealth({ ready: false });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(historyKey, JSON.stringify(messages.slice(-MAX_HISTORY_ITEMS)));
    } catch {
      // Ignore quota errors
    }
  }, [messages, historyKey]);

  useEffect(() => {
    if (isSubmitting || !scrollOnResult.current) return;
    scrollOnResult.current = false;
    latestResultRef.current?.scrollIntoView({ block: 'nearest' });
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
    if (!file || busy.current) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (file.type && !validTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB.');
      return;
    }

    busy.current = true;
    scrollOnResult.current = true;
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
      busy.current = false;
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
      if (!resp.ok) throw new Error('Không thể tải ảnh mẫu');
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

  const handleClearHistory = () => {
    setMessages([]);
    try { localStorage.removeItem(historyKey); } catch { /* Storage is optional. */ }
    toast.success('Đã xóa lịch sử nhận diện');
  };

  return (
    <div className="image-lab">
      <header className="image-lab-header page-heading">
        <div>
          <h1 className="page-title">Tra từ qua ảnh</h1>
          <p className="page-description">Gửi ảnh tác phẩm hoặc đồ thủ công để nhận gợi ý từ tiếng Anh liên quan.</p>
        </div>
        <div className="image-lab-actions">
          <span className={aiHealth?.ready ? 'image-lab-status is-ready' : 'image-lab-status'}>
            {aiHealth == null ? 'Đang kiểm tra dịch vụ' : aiHealth.ready ? 'Sẵn sàng nhận diện' : 'Nhận diện chưa sẵn sàng'}
          </span>
          {messages.length > 0 && (
            <button type="button" className="btn btn-secondary gap-1.5" disabled={isSubmitting} onClick={handleClearHistory}>
              <HiOutlineTrash className="w-4 h-4" aria-hidden="true" />
              Xóa lịch sử
            </button>
          )}
        </div>
      </header>

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
        className={isDragging ? 'image-lab-drop is-dragging' : 'image-lab-drop'}
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

        <div>
          <div className="flex items-start gap-3">
            <HiOutlineArrowUpTray className="h-5 w-5 mt-0.5 text-blue-700 shrink-0" aria-hidden="true" />
            <div>
              <strong>Kéo thả hoặc dán ảnh vào đây</strong>
              <p>JPG, PNG hoặc WebP · Tối đa 5 MB</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary shrink-0 gap-2 w-full sm:w-auto"
          >
            <HiOutlinePhoto className="w-4 h-4" />
            {isSubmitting ? 'Đang nhận diện…' : 'Chọn ảnh'}
          </button>
        </div>

      </div>

      <section className="image-lab-samples" aria-labelledby="sample-heading">
        <h2 id="sample-heading">Thử với ảnh mẫu</h2>
        <div className="image-lab-samples-grid">
          {SAMPLE_ARTWORKS.map(sample => (
            <button key={sample.label} type="button" className="image-lab-sample" disabled={isSubmitting}
              onClick={() => handleSampleClick(sample)}>
              <img src={sample.url} alt="" />
              <span>{sample.label}</span>
            </button>
          ))}
        </div>
      </section>

      {(messages.length > 0 || isSubmitting) && (
        <section className="image-lab-thread" aria-labelledby="result-heading" aria-busy={isSubmitting}>
          <h2 id="result-heading">Kết quả nhận diện</h2>
          <div className="image-lab-thread-items">
            {messages.map((msg, index) => {

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
                <div key={msg.id} className="flex justify-start" ref={index === messages.length - 1 ? latestResultRef : null}>
                  <div className="max-w-lg bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-start gap-2.5">
                    <HiOutlineExclamationTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{msg.error}</span>
                  </div>
                </div>
              );
            }

            const result = msg.result;
            const primaryMatch = result?.matches?.[0];
            const vocab = primaryMatch?.vocabulary;
            const topic = vocab?.topic;
            const topicLabel =
              topic?.name_vi ||
              (Number(vocab?.topic_id) === 2 ? 'Ngành nghề mỹ nghệ' : 'Các loại tranh');

            return (
              <div key={msg.id} className="flex justify-start" ref={index === messages.length - 1 ? latestResultRef : null}>
                <div className="image-lab-result w-full max-w-xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3">
                  {result.status === 'out_of_scope' || !vocab ? (
                    <div className="flex items-start gap-2.5 text-sm text-slate-700 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
                      <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{result.message}</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-blue-700">
                          Chủ đề:{' '}
                          {topic?.id ? (
                            <Link
                              to={`/topics/${topic.id}`}
                              className="hover:underline inline-flex items-center gap-1"
                            >
                              {topicLabel}
                              {topic.name ? ` (${topic.name})` : ''}
                              <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <span>{topicLabel}</span>
                          )}
                        </div>

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
                        </div>

                        {vocab.pronunciation && (
                          <div className="text-xs font-mono text-slate-500">
                            {vocab.pronunciation}
                          </div>
                        )}

                        <div className="text-base font-bold text-blue-700">
                          {vocab.meaning_vi}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
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
                    </>
                  )}
                </div>
              </div>
            );
            })}

        {isSubmitting && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-xs font-semibold text-slate-500 flex items-center gap-2.5 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              Đang phân tích ảnh…
            </div>
          </div>
        )}
          </div>
        </section>
      )}

      <AddToListModal
        isOpen={Boolean(selectedVocabForList)}
        onClose={() => setSelectedVocabForList(null)}
        vocab={selectedVocabForList}
      />
    </div>
  );
}
