import { useState } from 'react';
import { HiOutlineSpeakerWave } from 'react-icons/hi2';

const details = [
  { word: 'wave', meaning: 'con sóng', sentence: 'A large wave rises above the boats.', x: 27, y: 38 },
  { word: 'boat', meaning: 'chiếc thuyền', sentence: 'The boat is beneath the wave.', x: 16.5, y: 66.5 },
  { word: 'mountain', meaning: 'ngọn núi', sentence: 'The mountain is in the distance.', x: 63.5, y: 69.5 }
];

export default function ArtworkStudy() {
  const [selected, setSelected] = useState(0);
  const detail = details[selected];

  function speak() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(detail.word);
    speech.lang = 'en-US';
    window.speechSynthesis.speak(speech);
  }

  return (
    <div className="artwork-study">
      <figure>
        <div className="artwork-study-image">
          <img src="/images/vocab/printmaking.jpg" fetchPriority="high" alt="Một con sóng lớn cuộn trên những chiếc thuyền, xa xa là núi Phú Sĩ" />
          {details.map(({ word, x, y }, i) => (
            <button
              key={word}
              type="button"
              className="artwork-point"
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-label={`Chi tiết ${i + 1}`}
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <figcaption className="artwork-study-caption">
          <span><em>Sóng lừng ngoài khơi Kanagawa</em></span>
          <span>Katsushika Hokusai</span>
        </figcaption>
      </figure>
      <div className="artwork-gloss">
        <div className="artwork-gloss-copy" aria-live="polite" aria-atomic="true">
          <p><strong lang="en">{detail.word}</strong> <span>{detail.meaning}</span></p>
          <span lang="en">{detail.sentence}</span>
        </div>
        <button type="button" className="studio-icon-button artwork-sound" onClick={speak} aria-label={`Nghe phát âm từ ${detail.word}`}>
          <HiOutlineSpeakerWave aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
