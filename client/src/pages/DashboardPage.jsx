import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineBookmark, HiOutlinePhoto } from 'react-icons/hi2';
import useAuthStore from '../stores/authStore';
import { reviewApi, topicApi } from '../api/services';
import ArtworkStudy from '../components/vocab/ArtworkStudy';
import TopicCard from '../components/vocab/TopicCard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [reviewStats, setReviewStats] = useState(null);
  const [topics, setTopics] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    reviewApi.getStats().then(res => {
      if (active) setReviewStats(res.data);
    }).catch(() => {});
    topicApi.getAll().then(res => {
      if (active) setTopics(res.data || []);
    }).catch(() => {
      if (active) setLoadFailed(true);
    });
    return () => { active = false; };
  }, []);

  const due = reviewStats?.dueCount ?? 0;
  const next = topics?.find(t => (t.progress_percent ?? 0) < 100);
  const startPath = due > 0 ? '/review' : next ? `/topics/${next.id}/flashcards` : '/topics';

  return (
    <div className="studio-home">
      <section className="study-hero" aria-labelledby="study-hero-title">
        <div className="study-hero-copy">
          <p className="study-hello">Chào {user?.full_name || user?.username || 'bạn'},</p>
          <h1 id="study-hero-title">Nhìn tranh,<br /><em>gọi tên.</em></h1>
          <p className="study-intro">Chạm vào một chi tiết trong tranh để khám phá từ tiếng Anh.</p>
          <div className="study-next">
            <Link to={startPath} className="btn btn-primary">
              {due > 0 ? `Ôn ${due} từ đến hạn` : next?.learned_count > 0 ? 'Học tiếp' : 'Bắt đầu học'}
              <HiOutlineArrowRight aria-hidden="true" />
            </Link>
            {due === 0 && next && <span>{next.name_vi}</span>}
          </div>
        </div>
        <ArtworkStudy />
      </section>

      <div className="studio-home-shelf">
        <section className="min-w-0" aria-labelledby="home-topics">
          <div className="section-line">
            <h2 id="home-topics">Chủ đề học</h2>
            <Link to="/topics">Xem tất cả <HiOutlineArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="studio-topic-grid">
            {topics?.map(topic => <TopicCard key={topic.id} topic={topic} />)}
          </div>
          {!topics?.length && <p className="studio-muted">{loadFailed ? 'Chưa tải được chủ đề.' : topics ? 'Chưa có chủ đề.' : 'Đang tải chủ đề…'}</p>}
        </section>
        <aside className="study-notebook" aria-labelledby="study-progress">
          <h2 id="study-progress">Tiến độ của bạn</h2>
          <dl>
            <div><dt>Từ đã học</dt><dd>{reviewStats?.totalLearned ?? '—'}</dd></div>
            <div><dt>Đã thuần thục</dt><dd>{reviewStats?.masteredCount ?? '—'}</dd></div>
            <div><dt>Độ chính xác</dt><dd>{reviewStats?.accuracyRate == null ? '—' : `${reviewStats.accuracyRate}%`}</dd></div>
          </dl>
          <Link to="/topics?tab=my-lists"><HiOutlineBookmark aria-hidden="true" /> Sổ từ của tôi <HiOutlineArrowRight aria-hidden="true" /></Link>
          <Link to="/ai-chat"><HiOutlinePhoto aria-hidden="true" /> Tra từ qua ảnh <HiOutlineArrowRight aria-hidden="true" /></Link>
        </aside>
      </div>
    </div>
  );
}
