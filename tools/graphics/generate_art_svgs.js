const fs = require('fs');
const path = require('path');
const { vocabByTopic } = require('../../server/src/seeders/artVocabData');

const outputDir = path.resolve(__dirname, '../../client/public/images/vocab');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Color palettes for arts & crafts
const palettes = {
  paintings: [
    { start: '#1e3a8a', end: '#3b82f6', accent: '#93c5fd', name: 'Blue Horizon' },
    { start: '#701a75', end: '#a21caf', accent: '#f0abfc', name: 'Deep Fuchsia' },
    { start: '#831843', end: '#be185d', accent: '#fbcfe8', name: 'Rose Madder' },
    { start: '#713f12', end: '#b45309', accent: '#fde68a', name: 'Raw Sienna' },
    { start: '#14532d', end: '#15803d', accent: '#86efac', name: 'Viridian' },
    { start: '#0f172a', end: '#334155', accent: '#cbd5e1', name: 'Charcoal Slate' }
  ],
  crafts: [
    { start: '#78350f', end: '#b45309', accent: '#fde68a', name: 'Terracotta' },
    { start: '#134e4a', end: '#0f766e', accent: '#99f6e4', name: 'Celadon Jade' },
    { start: '#4c1d95', end: '#6d28d9', accent: '#ddd6fe', name: 'Imperial Violet' },
    { start: '#881337', end: '#be123c', accent: '#fecdd3', name: 'Lacquer Red' },
    { start: '#312e81', end: '#4338ca', accent: '#c7d2fe', name: 'Indigo Dye' },
    { start: '#1c1917', end: '#44403c', accent: '#d6d3d1', name: 'Obsidian Forge' }
  ]
};

// Specialized SVG visual badges/icons for various art disciplines
function getDisciplineGraphic(topicId, word) {
  const isPainting = topicId === 1;

  if (word.includes('brush') || word.includes('paint') || word.includes('fresco') || word.includes('watercolor')) {
    return `
      <!-- Paint palette and brush -->
      <path d="M160 220 C140 180, 180 140, 220 140 C260 140, 290 170, 290 200 C290 230, 260 250, 230 250 C210 250, 200 240, 190 240 C180 240, 170 250, 160 250 C140 250, 140 230, 160 220 Z" fill="rgba(255,255,255,0.15)" stroke="white" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="200" cy="170" r="12" fill="#ef4444"/>
      <circle cx="240" cy="170" r="12" fill="#3b82f6"/>
      <circle cx="260" cy="205" r="12" fill="#eab308"/>
      <line x1="140" y1="270" x2="260" y2="150" stroke="#fef08a" stroke-width="8" stroke-linecap="round"/>
      <polygon points="260,150 275,135 285,145 270,160" fill="#f59e0b"/>
    `;
  }

  if (word.includes('canvas') || word.includes('easel') || word.includes('triptych') || word.includes('portrait') || word.includes('landscape') || word.includes('seascape') || word.includes('cityscape') || word.includes('still life')) {
    return `
      <!-- Easel and Canvas Frame -->
      <polygon points="150,270 200,120 250,270" stroke="rgba(255,255,255,0.4)" stroke-width="6" fill="none"/>
      <rect x="145" y="145" width="110" height="85" rx="6" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="4"/>
      <line x1="130" y1="230" x2="270" y2="230" stroke="white" stroke-width="6" stroke-linecap="round"/>
      <circle cx="180" cy="180" r="14" fill="#fbbf24"/>
      <path d="M150 215 L180 190 L210 215 L240 180 L255 215 Z" fill="rgba(255,255,255,0.3)"/>
    `;
  }

  if (word.includes('potter') || word.includes('ceramic')) {
    return `
      <!-- Ceramic vase on wheel -->
      <ellipse cx="200" cy="265" rx="55" ry="14" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="3"/>
      <path d="M175 145 C160 180, 145 220, 160 255 L240 255 C255 220, 240 180, 225 145 Z" fill="rgba(255,255,255,0.25)" stroke="white" stroke-width="4"/>
      <ellipse cx="200" cy="145" rx="25" ry="8" fill="rgba(255,255,255,0.4)" stroke="white" stroke-width="3"/>
      <line x1="160" y1="205" x2="240" y2="205" stroke="#fef08a" stroke-width="3" stroke-dasharray="6,4"/>
    `;
  }

  if (word.includes('sculpt') || word.includes('wood') || word.includes('stone') || word.includes('engrav')) {
    return `
      <!-- Sculpting Chisel & Mallet -->
      <rect x="185" y="140" width="30" height="90" rx="4" fill="rgba(255,255,255,0.25)" stroke="white" stroke-width="4"/>
      <polygon points="185,230 200,260 215,230" fill="#fde047" stroke="white" stroke-width="3"/>
      <rect x="140" y="160" width="50" height="24" rx="4" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="3" transform="rotate(-30 140 160)"/>
    `;
  }

  if (word.includes('calligraph') || word.includes('origami') || word.includes('print')) {
    return `
      <!-- Calligraphy Brush & Scroll -->
      <path d="M150 170 C170 140, 230 140, 250 170 C240 220, 160 220, 150 270" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
      <line x1="220" y1="130" x2="170" y2="250" stroke="#fde047" stroke-width="6" stroke-linecap="round"/>
      <circle cx="170" cy="250" r="7" fill="#ef4444"/>
    `;
  }

  if (word.includes('weav') || word.includes('embroid') || word.includes('quilt') || word.includes('tapestry')) {
    return `
      <!-- Loom Warp & Weft Thread Spool -->
      <rect x="150" y="150" width="100" height="100" rx="8" fill="none" stroke="white" stroke-width="4"/>
      <line x1="170" y1="150" x2="170" y2="250" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
      <line x1="190" y1="150" x2="190" y2="250" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
      <line x1="210" y1="150" x2="210" y2="250" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
      <line x1="230" y1="150" x2="230" y2="250" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
      <path d="M140 175 C160 190, 240 160, 260 220" stroke="#facc15" stroke-width="5" fill="none" stroke-linecap="round"/>
    `;
  }

  // Default artistic emblem
  return `
    <!-- Fine Art Emblem -->
    <circle cx="200" cy="200" r="55" fill="rgba(255,255,255,0.18)" stroke="white" stroke-width="4"/>
    <polygon points="200,160 235,225 165,225" fill="none" stroke="#fde047" stroke-width="4"/>
    <circle cx="200" cy="200" r="12" fill="white"/>
  `;
}

function generateArtSVG(item, topicId, index) {
  const isPainting = topicId === 1;
  const paletteList = isPainting ? palettes.paintings : palettes.crafts;
  const p = paletteList[index % paletteList.length];
  const topicLabel = isPainting ? 'TYPES OF PAINTINGS' : 'FINE ARTS & CRAFTS';
  const graphic = getDisciplineGraphic(topicId, item.word);

  const cleanWord = item.word.toUpperCase();
  const fontSizeWord = cleanWord.length > 15 ? '20' : cleanWord.length > 11 ? '24' : '28';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="grad_${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.start}"/>
      <stop offset="100%" stop-color="${p.end}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="400" height="400" rx="28" fill="url(#grad_${index})"/>
  
  <!-- Subtle Canvas Texture / Geometric Motif -->
  <circle cx="50" cy="50" r="120" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
  <circle cx="350" cy="350" r="140" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
  <rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-dasharray="8,6"/>

  <!-- Category Pill Badge -->
  <g transform="translate(200, 52)">
    <rect x="-85" y="-14" width="170" height="28" rx="14" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <text x="0" y="4" font-family="'Cinzel', 'Times New Roman', Georgia, serif" font-size="10" font-weight="bold" fill="${p.accent}" text-anchor="middle" letter-spacing="2">${topicLabel}</text>
  </g>

  <!-- Central Discipline Illustration -->
  <g filter="url(#shadow)">
    ${graphic}
  </g>

  <!-- English Vocabulary Title -->
  <text x="200" y="325" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="${fontSizeWord}" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">${cleanWord}</text>

  <!-- Vietnamese Meaning & Reference Tag -->
  <text x="200" y="352" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="rgba(255,255,255,0.92)" text-anchor="middle">${item.meaning_vi}</text>
  <text x="200" y="374" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="11" font-weight="400" fill="${p.accent}" text-anchor="middle" font-style="italic">Ref: ${item.source_ref}</text>
</svg>`;
}

let generated = 0;
for (const [topicId, words] of Object.entries(vocabByTopic)) {
  const tid = parseInt(topicId);
  words.forEach((item, idx) => {
    const filename = `${item.word.toLowerCase().replace(/\s+/g, '_')}.svg`;
    const filepath = path.join(outputDir, filename);
    const svgContent = generateArtSVG(item, tid, idx);
    fs.writeFileSync(filepath, svgContent, 'utf-8');
    generated++;
  });
}

console.log(`🎨 Successfully generated ${generated} fine arts SVG vector illustrations in ${outputDir}!`);
