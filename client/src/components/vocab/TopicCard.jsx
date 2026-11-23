import { Link } from 'react-router-dom';
import { HiOutlineArrowUpRight } from 'react-icons/hi2';

const covers = {
  'Types of Paintings': { src: '/images/vocab/impressionism.jpg', position: 'center 54%' },
  'Fine Arts & Crafts Professions': { src: '/images/vocab/ceramics.jpg', position: 'center 47%' }
};

function getCover(topic) {
  const cover = covers[topic.name];
  if (cover) return cover;
  if (topic.icon === 'HiPaintBrush') return covers['Types of Paintings'];
  if (topic.icon === 'HiSparkles') return covers['Fine Arts & Crafts Professions'];
  return null;
}

export default function TopicCard({ topic, showFlashcards = false, heading: Heading = 'h3' }) {
  const cover = getCover(topic);
  const topicPath = `/topics/${topic.id}`;
  const count = topic.vocab_count ?? 0;
  const learned = topic.learned_count ?? 0;
  const percent = Math.max(0, Math.min(100, topic.progress_percent ?? 0));

  return (
    <article className="studio-topic">
      <Link to={topicPath} className="studio-topic-link">
        {cover && <img src={cover.src} alt="" style={{ objectPosition: cover.position }} className="studio-topic-image" />}
        <div className="studio-topic-title">
          <div>
            <Heading>{topic.name_vi}</Heading>
            <p lang="en">{topic.name}</p>
          </div>
          <HiOutlineArrowUpRight aria-hidden="true" />
        </div>
      </Link>
      <div className="studio-topic-progress">
        <progress value={percent} max="100" aria-label={`Tiến độ chủ đề ${topic.name_vi}`} />
        <div>
          <span>{learned}/{count} từ đã học</span>
          {showFlashcards && <Link to={`${topicPath}/flashcards`}>Học bằng thẻ</Link>}
        </div>
      </div>
    </article>
  );
}
