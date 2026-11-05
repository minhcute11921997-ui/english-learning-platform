const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '../../client/public/images/vocab');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Frame wrapper for contemporary exhibition prints
function wrapArt(id, bgGrad, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    ${bgGrad}
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="drop" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <clipPath id="canvasClip">
      <rect x="24" y="24" width="452" height="452" rx="20"/>
    </clipPath>
  </defs>

  <!-- Outer Exhibition Bezel -->
  <rect width="500" height="500" rx="24" fill="#0c1017"/>
  <rect x="20" y="20" width="460" height="460" rx="22" fill="none" stroke="#222b3d" stroke-width="1.5"/>

  <!-- Main Artwork Canvas with Clipping -->
  <g clip-path="url(#canvasClip)">
    <rect x="24" y="24" width="452" height="452" fill="url(#bg_${id})"/>
    ${content}
    <!-- Inner Gallery Vignette / Lighting Accent -->
    <rect x="24" y="24" width="452" height="452" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
  </g>
</svg>`;
}

// 60 tailored contemporary art compositions
const artPieces = {
  // === TOPIC 1: TYPES OF PAINTINGS ===
  'oil_painting': {
    bg: `<linearGradient id="bg_oil_painting" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1b36"/>
      <stop offset="100%" stop-color="#1a365d"/>
    </linearGradient>`,
    body: `
      <!-- Deep Impasto Paint Layers & Palette Knife Swipes -->
      <path d="M60 380 Q140 280 260 320 T440 260 L460 460 L60 460 Z" fill="#b91c1c" opacity="0.8"/>
      <path d="M40 260 C120 180 200 300 320 220 C380 180 430 200 460 180 L460 360 L40 400 Z" fill="#d97706" opacity="0.7"/>
      <path d="M100 120 C180 80 280 160 360 100 C420 50 450 90 460 120 L460 250 L80 220 Z" fill="#2563eb" opacity="0.65"/>
      <path d="M140 80 Q250 20 380 90 T450 180" stroke="#facc15" stroke-width="18" fill="none" stroke-linecap="round" filter="url(#drop)"/>
      <path d="M80 340 C160 280 240 380 380 320" stroke="#ef4444" stroke-width="24" fill="none" stroke-linecap="round" filter="url(#drop)"/>
      <path d="M180 160 Q260 260 340 180" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.9"/>
      <!-- Palette Knife in Foreground -->
      <polygon points="210,190 280,140 350,170 280,220" fill="#e2e8f0" stroke="#94a3b8" stroke-width="3" filter="url(#drop)"/>
      <line x1="160" y1="270" x2="225" y2="200" stroke="#78350f" stroke-width="12" stroke-linecap="round"/>
      <circle cx="280" cy="175" r="12" fill="#3b82f6" opacity="0.8"/>
    `
  },
  'watercolor': {
    bg: `<linearGradient id="bg_watercolor" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>`,
    body: `
      <!-- Translucent Fluid Bleeds & Pigment Granulation -->
      <ellipse cx="200" cy="200" rx="140" ry="110" fill="#60a5fa" opacity="0.45" filter="url(#softGlow)"/>
      <circle cx="290" cy="240" r="110" fill="#f472b6" opacity="0.4" filter="url(#softGlow)"/>
      <circle cx="180" cy="300" r="100" fill="#34d399" opacity="0.35" filter="url(#softGlow)"/>
      <ellipse cx="270" cy="180" rx="80" ry="60" fill="#818cf8" opacity="0.5"/>
      <path d="M120 180 Q190 120 300 160 T400 240" stroke="#0284c7" stroke-width="6" fill="none" opacity="0.7"/>
      <!-- Spatter droplets -->
      <circle cx="340" cy="130" r="5" fill="#0284c7" opacity="0.6"/>
      <circle cx="365" cy="145" r="3" fill="#0284c7" opacity="0.6"/>
      <circle cx="130" cy="280" r="6" fill="#ec4899" opacity="0.5"/>
      <circle cx="115" cy="310" r="4" fill="#059669" opacity="0.6"/>
    `
  },
  'acrylic_painting': {
    bg: `<linearGradient id="bg_acrylic_painting" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#27272a"/>
    </linearGradient>`,
    body: `
      <!-- Vibrant Pop Art & Fluid Acrylic Color Blocks -->
      <path d="M40 180 C140 80, 220 280, 340 160 C400 100, 440 140, 460 120 L460 460 L40 460 Z" fill="#ec4899"/>
      <path d="M100 460 C120 320, 280 260, 360 360 C400 400, 440 380, 460 420 L460 460 Z" fill="#06b6d4"/>
      <circle cx="360" cy="130" r="55" fill="#eab308" filter="url(#drop)"/>
      <path d="M60 120 L240 300 L180 360 Z" fill="#8b5cf6" opacity="0.9"/>
      <line x1="80" y1="80" x2="420" y2="420" stroke="#ffffff" stroke-width="4" stroke-dasharray="16,8"/>
    `
  },
  'fresco': {
    bg: `<linearGradient id="bg_fresco" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4b996"/>
      <stop offset="100%" stop-color="#9a7b56"/>
    </linearGradient>`,
    body: `
      <!-- Classical Wall Mural & Plaster Fissures -->
      <rect x="50" y="50" width="400" height="400" fill="#e8d5b7" opacity="0.4"/>
      <circle cx="250" cy="230" r="120" fill="none" stroke="#78350f" stroke-width="6"/>
      <path d="M170 320 C180 220 320 220 330 320" fill="#854d0e" opacity="0.7"/>
      <circle cx="250" cy="190" r="45" fill="#a16207" opacity="0.8"/>
      <path d="M80 120 L160 180 L140 240 L210 270" stroke="#573815" stroke-width="2" fill="none"/>
      <path d="M380 90 L340 160 L370 210" stroke="#573815" stroke-width="2" fill="none"/>
      <!-- Fissure crack line -->
      <path d="M120 40 L160 140 L220 180 L250 310 L310 380 L340 460" stroke="#3e2723" stroke-width="3" fill="none" opacity="0.75"/>
    `
  },
  'portrait': {
    bg: `<linearGradient id="bg_portrait" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>`,
    body: `
      <!-- Contemporary Stylized Geometric Profile Face -->
      <ellipse cx="250" cy="220" rx="95" ry="125" fill="#f87171" opacity="0.85" filter="url(#drop)"/>
      <path d="M220 140 C280 120 320 180 310 240 C300 290 260 320 220 330 C200 300 200 180 220 140 Z" fill="#fca5a5"/>
      <!-- Sharp Modernist Silhouette Planes -->
      <polygon points="250,95 330,190 270,220" fill="#1e3a8a" opacity="0.8"/>
      <polygon points="270,220 330,190 320,290 260,260" fill="#0284c7" opacity="0.7"/>
      <path d="M230 340 L230 440 L310 440 L290 340 Z" fill="#334155"/>
      <circle cx="240" cy="180" r="7" fill="#0f172a"/>
      <line x1="260" y1="140" x2="310" y2="170" stroke="#ffffff" stroke-width="3"/>
    `
  },
  'landscape': {
    bg: `<linearGradient id="bg_landscape" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="35%" stop-color="#f43f5e"/>
      <stop offset="70%" stop-color="#4338ca"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Solar Orb & Rhythmic Mountain Silhouettes -->
      <circle cx="250" cy="180" r="60" fill="#fef08a" filter="url(#softGlow)"/>
      <polygon points="40,360 170,220 290,360" fill="#312e81" opacity="0.9"/>
      <polygon points="180,380 310,240 460,380" fill="#1e1b4b"/>
      <polygon points="100,420 250,290 400,420" fill="#0f172a"/>
      <path d="M40 420 Q250 370 460 420 L460 460 L40 460 Z" fill="#090d16"/>
    `
  },
  'still_life': {
    bg: `<linearGradient id="bg_still_life" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#292524"/>
      <stop offset="100%" stop-color="#1c1917"/>
    </linearGradient>`,
    body: `
      <!-- Cubist Still Life: Pitcher, Fruit & Drape -->
      <polygon points="40,340 460,300 460,460 40,460" fill="#44403c"/>
      <ellipse cx="280" cy="270" rx="55" ry="90" fill="#d97706" filter="url(#drop)"/>
      <path d="M280 180 L260 130 L310 130 Z" fill="#f59e0b"/>
      <circle cx="170" cy="330" r="35" fill="#dc2626" filter="url(#drop)"/>
      <circle cx="230" cy="350" r="30" fill="#ea580c" filter="url(#drop)"/>
      <ellipse cx="250" cy="360" rx="90" ry="25" fill="none" stroke="#78716c" stroke-width="5"/>
      <path d="M120 300 Q150 240 170 320" stroke="#facc15" stroke-width="4" fill="none"/>
    `
  },
  'abstract_art': {
    bg: `<linearGradient id="bg_abstract_art" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>`,
    body: `
      <!-- Avant-Garde Constructivist Geometry -->
      <rect x="80" y="80" width="160" height="220" fill="#ef4444" opacity="0.85" transform="rotate(15 160 190)"/>
      <circle cx="330" cy="180" r="75" fill="#3b82f6" opacity="0.9" filter="url(#drop)"/>
      <polygon points="180,260 380,220 280,410" fill="#eab308" opacity="0.85"/>
      <line x1="60" y1="400" x2="440" y2="100" stroke="#ffffff" stroke-width="5"/>
      <line x1="120" y1="80" x2="380" y2="420" stroke="#10b981" stroke-width="6"/>
      <circle cx="210" cy="230" r="24" fill="#0f172a" stroke="#ffffff" stroke-width="4"/>
    `
  },
  'impressionism': {
    bg: `<linearGradient id="bg_impressionism" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="50%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#065f46"/>
    </linearGradient>`,
    body: `
      <!-- Monet Waterlilies Broken Brushwork Strokes -->
      <g stroke-linecap="round" stroke-width="8" opacity="0.85">
        <line x1="100" y1="180" x2="160" y2="175" stroke="#a7f3d0"/>
        <line x1="140" y1="195" x2="210" y2="190" stroke="#38bdf8"/>
        <line x1="220" y1="180" x2="280" y2="175" stroke="#f472b6"/>
        <line x1="290" y1="195" x2="370" y2="190" stroke="#fde047"/>
        <line x1="80" y1="260" x2="180" y2="255" stroke="#60a5fa"/>
        <line x1="190" y1="270" x2="300" y2="265" stroke="#f43f5e"/>
        <line x1="310" y1="250" x2="410" y2="245" stroke="#34d399"/>
        <line x1="120" y1="340" x2="220" y2="335" stroke="#fbbf24"/>
        <line x1="240" y1="350" x2="360" y2="345" stroke="#e879f9"/>
      </g>
      <!-- Floating Lily Pad -->
      <ellipse cx="250" cy="270" rx="70" ry="24" fill="#047857" stroke="#6ee7b7" stroke-width="4"/>
      <circle cx="250" cy="265" r="14" fill="#f43f5e" filter="url(#drop)"/>
      <circle cx="250" cy="265" r="5" fill="#fef08a"/>
    `
  },
  'surrealism': {
    bg: `<linearGradient id="bg_surrealism" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>`,
    body: `
      <!-- Melting Watch on Desert Horizon (Dalí homage) -->
      <polygon points="40,320 460,320 460,460 40,460" fill="#b45309"/>
      <path d="M160 260 C240 240 280 280 270 350 C260 400 210 410 180 370 C150 330 130 270 160 260 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="5" filter="url(#drop)"/>
      <ellipse cx="205" cy="330" rx="30" ry="40" fill="none" stroke="#475569" stroke-width="2"/>
      <line x1="205" y1="330" x2="220" y2="310" stroke="#0f172a" stroke-width="3"/>
      <line x1="205" y1="330" x2="190" y2="345" stroke="#0f172a" stroke-width="3"/>
      <!-- Bare Branch -->
      <path d="M380 400 L380 220 L350 180 M380 260 L410 220" stroke="#451a03" stroke-width="7" stroke-linecap="round"/>
    `
  },
  'cubism': {
    bg: `<linearGradient id="bg_cubism" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3f3f46"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>`,
    body: `
      <!-- Fractured Modernist Planes (Picasso / Braque) -->
      <polygon points="120,80 280,110 210,280" fill="#a16207" opacity="0.85"/>
      <polygon points="210,280 340,160 380,320" fill="#3b82f6" opacity="0.8"/>
      <polygon points="140,250 240,410 360,360" fill="#e2e8f0" opacity="0.75"/>
      <polygon points="80,180 180,240 110,380" fill="#b45309" opacity="0.8"/>
      <!-- Guitar / Instrument Silhouette Fragments -->
      <path d="M220 180 C260 160 280 240 240 280" fill="none" stroke="#ffffff" stroke-width="6"/>
      <circle cx="230" cy="230" r="20" fill="#18181b"/>
      <line x1="160" y1="120" x2="270" y2="380" stroke="#facc15" stroke-width="3"/>
    `
  },
  'canvas': {
    bg: `<linearGradient id="bg_canvas" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d6d3d1"/>
      <stop offset="100%" stop-color="#a8a29e"/>
    </linearGradient>`,
    body: `
      <!-- Stretched Linen Texture on Heavy Wooden Stretcher -->
      <rect x="80" y="80" width="340" height="340" rx="6" fill="#f5f5f4" stroke="#78716c" stroke-width="12" filter="url(#drop)"/>
      <!-- Canvas weave grid lines -->
      <g stroke="#e7e5e4" stroke-width="2" opacity="0.8">
        <line x1="100" y1="120" x2="400" y2="120"/><line x1="100" y1="160" x2="400" y2="160"/>
        <line x1="100" y1="200" x2="400" y2="200"/><line x1="100" y1="240" x2="400" y2="240"/>
        <line x1="100" y1="280" x2="400" y2="280"/><line x1="100" y1="320" x2="400" y2="320"/>
        <line x1="100" y1="360" x2="400" y2="360"/>
        <line x1="140" y1="100" x2="140" y2="400"/><line x1="180" y1="100" x2="180" y2="400"/>
        <line x1="220" y1="100" x2="220" y2="400"/><line x1="260" y1="100" x2="260" y2="400"/>
        <line x1="300" y1="100" x2="300" y2="400"/><line x1="340" y1="100" x2="340" y2="400"/>
      </g>
      <!-- Corner staples -->
      <rect x="90" y="90" width="14" height="6" fill="#71717a"/>
      <rect x="396" y="90" width="14" height="6" fill="#71717a"/>
    `
  },
  'easel': {
    bg: `<linearGradient id="bg_easel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Atelier Wooden Tripod Studio Easel -->
      <line x1="150" y1="440" x2="250" y2="60" stroke="#d97706" stroke-width="14" stroke-linecap="round"/>
      <line x1="350" y1="440" x2="250" y2="60" stroke="#d97706" stroke-width="14" stroke-linecap="round"/>
      <line x1="250" y1="440" x2="250" y2="60" stroke="#92400e" stroke-width="10"/>
      <!-- Canvas Shelf Support Bar -->
      <rect x="100" y="270" width="300" height="20" rx="4" fill="#b45309" filter="url(#drop)"/>
      <!-- Artwork mounted on easel -->
      <rect x="140" y="140" width="220" height="150" rx="4" fill="#3b82f6" stroke="#ffffff" stroke-width="4" filter="url(#drop)"/>
      <circle cx="250" cy="215" r="35" fill="#facc15"/>
    `
  },
  'palette': {
    bg: `<linearGradient id="bg_palette" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>`,
    body: `
      <!-- Artist Wooden Palette with Color Swatches -->
      <path d="M120 320 C80 230 140 100 260 100 C360 100 420 180 400 270 C390 320 350 350 300 350 C260 350 240 310 200 310 C170 310 140 370 120 320 Z" fill="#d97706" stroke="#b45309" stroke-width="6" filter="url(#drop)"/>
      <ellipse cx="320" cy="270" rx="20" ry="26" fill="#1e1b4b"/>
      <!-- Paint Dollops -->
      <circle cx="170" cy="180" r="18" fill="#ef4444" filter="url(#drop)"/>
      <circle cx="225" cy="140" r="18" fill="#eab308" filter="url(#drop)"/>
      <circle cx="290" cy="140" r="18" fill="#3b82f6" filter="url(#drop)"/>
      <circle cx="345" cy="180" r="18" fill="#10b981" filter="url(#drop)"/>
      <circle cx="365" cy="230" r="18" fill="#8b5cf6" filter="url(#drop)"/>
    `
  },
  'brushstroke': {
    bg: `<linearGradient id="bg_brushstroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Monumental High-Velocity Calligraphic Brushstroke -->
      <path d="M60 380 Q180 120 340 160 T440 110" stroke="#f43f5e" stroke-width="48" fill="none" stroke-linecap="round" filter="url(#softGlow)"/>
      <path d="M80 390 Q190 140 330 170 T420 125" stroke="#ffffff" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M120 410 Q220 200 360 210" stroke="#fda4af" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- Bristle flyaway flecks -->
      <circle cx="380" cy="90" r="6" fill="#f43f5e"/>
      <circle cx="430" cy="80" r="4" fill="#f43f5e"/>
    `
  },
  'sketch': {
    bg: `<linearGradient id="bg_sketch" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>`,
    body: `
      <!-- Academic Graphite Hatching & Figure Study -->
      <ellipse cx="250" cy="230" rx="90" ry="120" fill="none" stroke="#334155" stroke-width="2"/>
      <g stroke="#475569" stroke-width="1.5">
        <line x1="200" y1="160" x2="300" y2="200"/>
        <line x1="190" y1="180" x2="310" y2="220"/>
        <line x1="180" y1="200" x2="320" y2="240"/>
        <line x1="180" y1="220" x2="310" y2="260"/>
        <line x1="190" y1="240" x2="290" y2="280"/>
        <!-- Cross hatching -->
        <line x1="200" y1="260" x2="300" y2="180"/>
        <line x1="190" y1="240" x2="290" y2="160"/>
      </g>
      <circle cx="225" cy="210" r="6" fill="#1e293b"/>
      <circle cx="275" cy="210" r="6" fill="#1e293b"/>
      <path d="M230 260 Q250 280 270 260" stroke="#1e293b" stroke-width="3" fill="none"/>
    `
  },
  'mural': {
    bg: `<linearGradient id="bg_mural" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Monumental Architectural Brickwork Wall Painting -->
      <g stroke="#334155" stroke-width="2" opacity="0.6">
        <line x1="40" y1="120" x2="460" y2="120"/><line x1="40" y1="200" x2="460" y2="200"/>
        <line x1="40" y1="280" x2="460" y2="280"/><line x1="40" y1="360" x2="460" y2="360"/>
        <line x1="120" y1="40" x2="120" y2="120"/><line x1="240" y1="40" x2="240" y2="120"/>
        <line x1="180" y1="120" x2="180" y2="200"/><line x1="300" y1="120" x2="300" y2="200"/>
      </g>
      <!-- Stylized Urban Graffiti/Mural Bird in Flight -->
      <path d="M120 280 Q250 140 380 220 T420 340 T280 320 Z" fill="#f59e0b" filter="url(#drop)"/>
      <circle cx="340" cy="210" r="18" fill="#ef4444"/>
      <line x1="100" y1="320" x2="400" y2="160" stroke="#06b6d4" stroke-width="8"/>
    `
  },
  'gouache': {
    bg: `<linearGradient id="bg_gouache" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#312e81"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>`,
    body: `
      <!-- Opaque Velvet Matte Geometric Compositions (Matisse Cutouts style) -->
      <path d="M140 120 C180 80 220 160 260 110 C300 60 340 140 380 100 L350 250 L110 220 Z" fill="#fb923c"/>
      <circle cx="160" cy="320" r="70" fill="#38bdf8"/>
      <path d="M240 220 C320 200 360 280 400 360 L260 410 Z" fill="#4ade80"/>
      <circle cx="280" cy="270" r="30" fill="#f43f5e" filter="url(#drop)"/>
    `
  },
  'tempera': {
    bg: `<linearGradient id="bg_tempera" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>`,
    body: `
      <!-- Byzantine Egg Tempera Halo & Gold Leaf Tooling -->
      <circle cx="250" cy="220" r="110" fill="#eab308" stroke="#ca8a04" stroke-width="8" filter="url(#softGlow)"/>
      <circle cx="250" cy="220" r="90" fill="none" stroke="#fef08a" stroke-width="3" stroke-dasharray="10,6"/>
      <ellipse cx="250" cy="240" rx="55" ry="70" fill="#991b1b"/>
      <circle cx="250" cy="180" r="35" fill="#fde68a"/>
      <!-- Radiating Halo rays -->
      <g stroke="#fef08a" stroke-width="3">
        <line x1="250" y1="90" x2="250" y2="70"/><line x1="340" y1="130" x2="355" y2="120"/>
        <line x1="380" y1="220" x2="400" y2="220"/><line x1="160" y1="130" x2="145" y2="120"/>
        <line x1="120" y1="220" x2="100" y2="220"/>
      </g>
    `
  },
  'minimalism': {
    bg: `<linearGradient id="bg_minimalism" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>`,
    body: `
      <!-- Pure Monolithic Spatial Plane (Barnett Newman Zip) -->
      <rect x="70" y="70" width="360" height="360" fill="#dc2626"/>
      <line x1="250" y1="70" x2="250" y2="430" stroke="#f8fafc" stroke-width="12" filter="url(#drop)"/>
      <line x1="250" y1="70" x2="250" y2="430" stroke="#facc15" stroke-width="2"/>
    `
  },
  'expressionism': {
    bg: `<linearGradient id="bg_expressionism" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#450a0a"/>
      <stop offset="100%" stop-color="#1c1917"/>
    </linearGradient>`,
    body: `
      <!-- Raw Emotional Swirls (Munch / Van Gogh) -->
      <path d="M40 180 Q140 80 250 180 T460 140" stroke="#ea580c" stroke-width="28" fill="none" stroke-linecap="round"/>
      <path d="M40 230 Q160 120 260 220 T460 200" stroke="#eab308" stroke-width="24" fill="none" stroke-linecap="round"/>
      <path d="M40 290 Q180 180 270 280 T460 260" stroke="#0284c7" stroke-width="26" fill="none" stroke-linecap="round"/>
      <path d="M40 360 Q200 240 280 340 T460 330" stroke="#1e3a8a" stroke-width="30" fill="none" stroke-linecap="round"/>
      <circle cx="340" cy="110" r="40" fill="#ef4444" filter="url(#softGlow)"/>
    `
  },
  'realism': {
    bg: `<linearGradient id="bg_realism" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f2937"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>`,
    body: `
      <!-- Volumetric Sphere with Specular Highlight and Cast Shadow -->
      <ellipse cx="250" cy="360" rx="130" ry="35" fill="#000000" opacity="0.6" filter="url(#drop)"/>
      <circle cx="240" cy="230" r="100" fill="url(#sphereShade)"/>
      <defs>
        <radialGradient id="sphereShade" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="20%" stop-color="#cbd5e1"/>
          <stop offset="65%" stop-color="#475569"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>
    `
  },
  'miniature': {
    bg: `<linearGradient id="bg_miniature" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#172554"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Ornate Filigree Oval Cameo Miniature Locket -->
      <ellipse cx="250" cy="240" rx="110" ry="140" fill="#ca8a04" stroke="#facc15" stroke-width="10" filter="url(#drop)"/>
      <ellipse cx="250" cy="240" rx="90" ry="120" fill="#1e1b4b"/>
      <ellipse cx="250" cy="230" rx="55" ry="75" fill="#fca5a5"/>
      <circle cx="250" cy="190" r="30" fill="#ef4444"/>
      <circle cx="250" cy="70" r="16" fill="none" stroke="#facc15" stroke-width="8"/>
    `
  },
  'self_portrait': {
    bg: `<linearGradient id="bg_self_portrait" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="100%" stop-color="#292524"/>
    </linearGradient>`,
    body: `
      <!-- Artist Holding Mirror / Brush Reflecting Gaze -->
      <circle cx="250" cy="210" r="100" fill="#44403c" stroke="#a8a29e" stroke-width="8" filter="url(#drop)"/>
      <circle cx="250" cy="210" r="85" fill="#1e293b"/>
      <path d="M220 180 C260 160 280 230 240 260" fill="#f87171"/>
      <line x1="280" y1="280" x2="360" y2="390" stroke="#d97706" stroke-width="10" stroke-linecap="round"/>
      <polygon points="360,390 380,410 390,395" fill="#94a3b8"/>
    `
  },
  'seascape': {
    bg: `<linearGradient id="bg_seascape" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#082f49"/>
    </linearGradient>`,
    body: `
      <!-- Dynamic Cresting Wave with Sea Spray (Hokusai contemporary homage) -->
      <path d="M40 380 Q160 260 220 220 Q280 160 340 180 Q380 200 370 240 Q350 280 320 280 Q290 280 310 230 Q330 190 300 200 Q260 210 220 260 L40 460 Z" fill="#f0f9ff" filter="url(#drop)"/>
      <path d="M40 400 Q180 300 250 260 T460 340 L460 460 L40 460 Z" fill="#0284c7"/>
      <circle cx="340" cy="140" r="6" fill="#ffffff"/>
      <circle cx="360" cy="160" r="5" fill="#ffffff"/>
      <circle cx="310" cy="170" r="4" fill="#ffffff"/>
    `
  },
  'cityscape': {
    bg: `<linearGradient id="bg_cityscape" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="60%" stop-color="#4338ca"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>`,
    body: `
      <!-- Geometric Modernist Skyline with Illuminated Windows -->
      <rect x="80" y="240" width="70" height="220" fill="#090d16"/>
      <rect x="170" y="160" width="80" height="300" fill="#0f172a"/>
      <polygon points="170,160 210,100 250,160" fill="#0f172a"/>
      <rect x="270" y="200" width="90" height="260" fill="#020617"/>
      <rect x="380" y="260" width="60" height="200" fill="#090d16"/>
      <!-- Window Grids -->
      <g fill="#fde047" opacity="0.8">
        <rect x="190" y="180" width="10" height="15"/><rect x="220" y="180" width="10" height="15"/>
        <rect x="190" y="210" width="10" height="15"/><rect x="220" y="210" width="10" height="15"/>
        <rect x="290" y="220" width="12" height="12"/><rect x="320" y="220" width="12" height="12"/>
      </g>
    `
  },
  'chiaroscuro': {
    bg: `<linearGradient id="bg_chiaroscuro" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#000000"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>`,
    body: `
      <!-- High-Drama Caravaggio Beam Carving Sculptural Form -->
      <polygon points="40,40 180,40 380,460 200,460" fill="#fef08a" opacity="0.35" filter="url(#softGlow)"/>
      <ellipse cx="270" cy="260" rx="80" ry="110" fill="#ca8a04" filter="url(#drop)"/>
      <path d="M270 150 C330 180 340 320 270 370 Z" fill="#fef08a"/>
    `
  },
  'charcoal': {
    bg: `<linearGradient id="bg_charcoal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>`,
    body: `
      <!-- Rich Smoky Vine Charcoal Smudges & Expressive Hatching -->
      <ellipse cx="250" cy="240" rx="120" ry="80" fill="#18181b" opacity="0.6" filter="url(#softGlow)"/>
      <g stroke="#09090b" stroke-width="8" stroke-linecap="round">
        <line x1="120" y1="160" x2="380" y2="280"/>
        <line x1="140" y1="220" x2="360" y2="340"/>
        <line x1="180" y1="140" x2="260" y2="360"/>
        <line x1="280" y1="120" x2="340" y2="300"/>
      </g>
      <!-- Charcoal Stick -->
      <rect x="340" y="320" width="90" height="22" rx="4" fill="#09090b" transform="rotate(-35 340 320)" filter="url(#drop)"/>
    `
  },
  'pastel': {
    bg: `<linearGradient id="bg_pastel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d3748"/>
      <stop offset="100%" stop-color="#1a202c"/>
    </linearGradient>`,
    body: `
      <!-- Soft Velvety Blended Chalk Sticks in Peach, Lilac, Mint -->
      <ellipse cx="200" cy="220" rx="90" ry="70" fill="#fbcfe8" opacity="0.8" filter="url(#softGlow)"/>
      <ellipse cx="290" cy="250" rx="80" ry="70" fill="#fed7aa" opacity="0.8" filter="url(#softGlow)"/>
      <ellipse cx="230" cy="290" rx="80" ry="60" fill="#a7f3d0" opacity="0.75" filter="url(#softGlow)"/>
      <!-- Soft Pastel Chalk Sticks -->
      <rect x="110" y="340" width="70" height="18" rx="4" fill="#f472b6" filter="url(#drop)"/>
      <rect x="200" y="350" width="70" height="18" rx="4" fill="#fb923c" filter="url(#drop)"/>
      <rect x="290" y="340" width="70" height="18" rx="4" fill="#4ade80" filter="url(#drop)"/>
    `
  },
  'triptych': {
    bg: `<linearGradient id="bg_triptych" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Three-Panel Polyptych Altarpiece Frame with Hinges -->
      <!-- Left Panel -->
      <rect x="70" y="150" width="85" height="230" rx="8" fill="#d97706" stroke="#facc15" stroke-width="4" filter="url(#drop)"/>
      <circle cx="112" cy="230" r="24" fill="#991b1b"/>
      <!-- Center Main Panel -->
      <rect x="175" y="100" width="150" height="280" rx="10" fill="#b45309" stroke="#facc15" stroke-width="6" filter="url(#drop)"/>
      <polygon points="250,140 280,220 220,220" fill="#fde047"/>
      <circle cx="250" cy="260" r="35" fill="#1e3a8a"/>
      <!-- Right Panel -->
      <rect x="345" y="150" width="85" height="230" rx="8" fill="#d97706" stroke="#facc15" stroke-width="4" filter="url(#drop)"/>
      <circle cx="387" cy="230" r="24" fill="#15803d"/>
    `
  },

  // === TOPIC 2: FINE ARTS & CRAFTS PROFESSIONS ===
  'ceramics': {
    bg: `<linearGradient id="bg_ceramics" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#134e4a"/>
      <stop offset="100%" stop-color="#042f2e"/>
    </linearGradient>`,
    body: `
      <!-- Elegant Ceramic Vase with Celadon Crackle Glaze -->
      <ellipse cx="250" cy="380" rx="70" ry="18" fill="#000000" opacity="0.5" filter="url(#drop)"/>
      <path d="M200 160 C170 240 140 300 170 370 L330 370 C360 300 330 240 300 160 Z" fill="#2dd4bf" stroke="#99f6e4" stroke-width="4" filter="url(#drop)"/>
      <ellipse cx="250" cy="160" rx="50" ry="14" fill="#14b8a6" stroke="#ccfbf1" stroke-width="3"/>
      <!-- Crackle glaze pattern -->
      <path d="M220 200 L250 240 L230 280 L280 320" stroke="#0f766e" stroke-width="2.5" fill="none"/>
      <path d="M270 190 L290 230 L270 270" stroke="#0f766e" stroke-width="2.5" fill="none"/>
    `
  },
  'pottery': {
    bg: `<linearGradient id="bg_pottery" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>`,
    body: `
      <!-- Classical Terracotta Amphora on Wheel -->
      <ellipse cx="250" cy="390" rx="90" ry="20" fill="#292524" filter="url(#drop)"/>
      <path d="M210 140 C160 220 160 310 190 380 L310 380 C340 310 340 220 290 140 Z" fill="#ea580c" stroke="#fed7aa" stroke-width="4" filter="url(#drop)"/>
      <ellipse cx="250" cy="140" rx="40" ry="12" fill="#c2410c"/>
      <!-- Amphora Handles -->
      <path d="M190 170 C130 190 130 270 180 290" stroke="#c2410c" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M310 170 C370 190 370 270 320 290" stroke="#c2410c" stroke-width="12" fill="none" stroke-linecap="round"/>
    `
  },
  'lacquerware': {
    bg: `<linearGradient id="bg_lacquerware" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#000000"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>`,
    body: `
      <!-- Deep Gloss Urushi Lacquer with Gold Maki-e & Eggshell Inlay -->
      <circle cx="250" cy="240" r="130" fill="#991b1b" stroke="#facc15" stroke-width="6" filter="url(#drop)"/>
      <circle cx="250" cy="240" r="110" fill="#09090b"/>
      <!-- Gold Maki-e Crane Motif -->
      <path d="M180 280 Q250 170 320 220 T280 300 Z" fill="#eab308" filter="url(#softGlow)"/>
      <circle cx="300" cy="200" r="6" fill="#ef4444"/>
      <!-- Inlaid Gold Flecks -->
      <polygon points="210,210 216,214 212,220" fill="#fef08a"/>
      <polygon points="240,290 248,294 242,302" fill="#fef08a"/>
      <polygon points="270,170 278,172 274,180" fill="#fef08a"/>
    `
  },
  'embroidery': {
    bg: `<linearGradient id="bg_embroidery" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#831843"/>
      <stop offset="100%" stop-color="#500724"/>
    </linearGradient>`,
    body: `
      <!-- Wooden Hoop with Delicate Silk Thread Floral Needlework -->
      <circle cx="250" cy="240" r="130" fill="#fdf2f8" stroke="#d97706" stroke-width="14" filter="url(#drop)"/>
      <!-- Floral Thread Work -->
      <path d="M250 240 Q210 180 250 150 Q290 180 250 240 Z" fill="#ec4899"/>
      <path d="M250 240 Q180 210 150 250 Q180 290 250 240 Z" fill="#f43f5e"/>
      <path d="M250 240 Q290 210 330 250 Q290 290 250 240 Z" fill="#f43f5e"/>
      <path d="M250 240 Q210 300 250 330 Q290 300 250 240 Z" fill="#ec4899"/>
      <circle cx="250" cy="240" r="16" fill="#fde047"/>
      <!-- Brass Tightening Screw at Top -->
      <rect x="238" y="90" width="24" height="18" fill="#ca8a04"/>
    `
  },
  'woodcarving': {
    bg: `<linearGradient id="bg_woodcarving" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#451a03"/>
      <stop offset="100%" stop-color="#291203"/>
    </linearGradient>`,
    body: `
      <!-- Sculpted Teak Wood Relief with Chisel Gouges -->
      <rect x="80" y="80" width="340" height="340" rx="16" fill="#92400e" stroke="#78350f" stroke-width="8" filter="url(#drop)"/>
      <!-- Carved Floral Scroll Relief -->
      <path d="M140 320 C180 220 320 220 360 320" stroke="#fde68a" stroke-width="12" fill="none" stroke-linecap="round"/>
      <circle cx="250" cy="220" r="45" fill="#b45309" stroke="#fde68a" stroke-width="8"/>
      <!-- Chisel Tool Crossing Canvas -->
      <polygon points="120,400 160,370 280,240 250,220" fill="#94a3b8" filter="url(#drop)"/>
      <line x1="280" y1="240" x2="380" y2="130" stroke="#d97706" stroke-width="16" stroke-linecap="round"/>
    `
  },
  'calligraphy': {
    bg: `<linearGradient id="bg_calligraphy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>`,
    body: `
      <!-- Dynamic Black Ink Brush Character & Vermillion Seal Chop -->
      <path d="M160 160 C260 100 340 180 320 300 C300 380 200 400 180 340 C170 300 240 280 280 270" stroke="#0f172a" stroke-width="32" fill="none" stroke-linecap="round" filter="url(#drop)"/>
      <line x1="140" y1="240" x2="360" y2="240" stroke="#0f172a" stroke-width="20" stroke-linecap="round"/>
      <!-- Red Cinnabar Seal Chop -->
      <rect x="330" y="330" width="55" height="55" rx="6" fill="#dc2626" filter="url(#drop)"/>
      <rect x="340" y="340" width="35" height="35" fill="none" stroke="#fecaca" stroke-width="3"/>
    `
  },
  'sculpture': {
    bg: `<linearGradient id="bg_sculpture" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>`,
    body: `
      <!-- Classical Carved Marble Torso on Modern Plinth -->
      <rect x="180" y="380" width="140" height="40" rx="4" fill="#334155" filter="url(#drop)"/>
      <polygon points="210,380 290,380 310,240 190,240" fill="#e2e8f0" filter="url(#drop)"/>
      <ellipse cx="250" cy="180" rx="50" ry="70" fill="#f8fafc"/>
      <path d="M210 240 Q250 270 290 240" stroke="#94a3b8" stroke-width="6" fill="none"/>
      <path d="M230 190 Q250 210 270 190" stroke="#94a3b8" stroke-width="4" fill="none"/>
    `
  },
  'weaving': {
    bg: `<linearGradient id="bg_weaving" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#312e81"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>`,
    body: `
      <!-- Traditional Loom Warp and Weft with Wooden Flying Shuttle -->
      <g stroke="#818cf8" stroke-width="4">
        <line x1="140" y1="80" x2="140" y2="420"/><line x1="180" y1="80" x2="180" y2="420"/>
        <line x1="220" y1="80" x2="220" y2="420"/><line x1="260" y1="80" x2="260" y2="420"/>
        <line x1="300" y1="80" x2="300" y2="420"/><line x1="340" y1="80" x2="340" y2="420"/>
      </g>
      <!-- Interwoven Textile Band -->
      <rect x="100" y="240" width="300" height="80" fill="#f59e0b" opacity="0.9" filter="url(#drop)"/>
      <!-- Wooden Shuttle -->
      <path d="M90 280 Q250 240 410 280 Q250 320 90 280 Z" fill="#d97706" stroke="#fef08a" stroke-width="3" filter="url(#drop)"/>
      <circle cx="250" cy="280" r="8" fill="#ffffff"/>
    `
  },
  'glassblowing': {
    bg: `<linearGradient id="bg_glassblowing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>`,
    body: `
      <!-- Incandescent Molten Glass Bubble on Steel Blowpipe -->
      <line x1="60" y1="120" x2="230" y2="230" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
      <!-- Glowing Molten Glass Orb -->
      <circle cx="300" cy="280" r="95" fill="#f97316" filter="url(#softGlow)"/>
      <circle cx="300" cy="280" r="80" fill="#facc15" opacity="0.9"/>
      <circle cx="300" cy="280" r="50" fill="#ffffff" opacity="0.85"/>
      <path d="M220 220 Q260 250 250 280" stroke="#f97316" stroke-width="18" fill="none"/>
    `
  },
  'silversmithing': {
    bg: `<linearGradient id="bg_silversmithing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Hammered Sterling Silver Vessel with Silversmith Ball-Peen Hammer -->
      <ellipse cx="230" cy="270" rx="100" ry="65" fill="#e2e8f0" stroke="#ffffff" stroke-width="4" filter="url(#drop)"/>
      <!-- Hammering Facets -->
      <ellipse cx="230" cy="270" rx="75" ry="45" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="8,6"/>
      <!-- Ball Peen Hammer Head -->
      <polygon points="310,140 370,160 350,210 290,190" fill="#64748b" filter="url(#drop)"/>
      <circle cx="380" cy="175" r="14" fill="#94a3b8"/>
      <line x1="330" y1="175" x2="440" y2="300" stroke="#b45309" stroke-width="14" stroke-linecap="round"/>
    `
  },
  'jewelry_design': {
    bg: `<linearGradient id="bg_jewelry_design" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>`,
    body: `
      <!-- Brilliant Cut Sapphire Gemstone in Solitaire Ring Prongs -->
      <circle cx="250" cy="310" r="90" fill="none" stroke="#e2e8f0" stroke-width="16" filter="url(#drop)"/>
      <!-- Faceted Gemstone -->
      <polygon points="250,130 320,180 250,250 180,180" fill="#3b82f6" filter="url(#softGlow)"/>
      <polygon points="250,130 300,160 250,190 200,160" fill="#93c5fd"/>
      <polygon points="250,190 320,180 250,250" fill="#1d4ed8"/>
      <polygon points="250,190 180,180 250,250" fill="#2563eb"/>
      <circle cx="250" cy="190" r="10" fill="#ffffff" opacity="0.9"/>
    `
  },
  'leathercraft': {
    bg: `<linearGradient id="bg_leathercraft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#451a03"/>
      <stop offset="100%" stop-color="#291203"/>
    </linearGradient>`,
    body: `
      <!-- Saddle-Tan Burnished Leather with Hand-Sewn Waxed Thread -->
      <rect x="90" y="100" width="320" height="300" rx="16" fill="#9a3412" stroke="#7c2d12" stroke-width="8" filter="url(#drop)"/>
      <!-- Saddle Stitch Perimeter Line -->
      <rect x="110" y="120" width="280" height="260" rx="12" fill="none" stroke="#fef08a" stroke-width="3" stroke-dasharray="10,8"/>
      <!-- Brass Rivet Snap -->
      <circle cx="250" cy="250" r="24" fill="#eab308" stroke="#ca8a04" stroke-width="4" filter="url(#drop)"/>
      <circle cx="250" cy="250" r="10" fill="#a16207"/>
    `
  },
  'quilting': {
    bg: `<linearGradient id="bg_quilting" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>`,
    body: `
      <!-- Geometric Star Patchwork Quilt Block -->
      <rect x="80" y="80" width="340" height="340" fill="#f8fafc" stroke="#475569" stroke-width="4" filter="url(#drop)"/>
      <!-- 8-Point Diamond Star -->
      <polygon points="250,120 280,200 250,250 220,200" fill="#ef4444"/>
      <polygon points="250,380 280,300 250,250 220,300" fill="#ef4444"/>
      <polygon points="120,250 200,280 250,250 200,220" fill="#3b82f6"/>
      <polygon points="380,250 300,280 250,250 300,220" fill="#3b82f6"/>
      <polygon points="160,160 220,200 250,250 200,220" fill="#f59e0b"/>
      <polygon points="340,340 280,300 250,250 300,280" fill="#f59e0b"/>
      <polygon points="340,160 300,220 250,250 280,200" fill="#10b981"/>
      <polygon points="160,340 200,280 250,250 220,300" fill="#10b981"/>
    `
  },
  'printmaking': {
    bg: `<linearGradient id="bg_printmaking" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#27272a"/>
    </linearGradient>`,
    body: `
      <!-- Linocut Woodblock Relief Print with Brayer Roller -->
      <rect x="90" y="90" width="260" height="260" rx="8" fill="#ffffff" filter="url(#drop)"/>
      <!-- Block Print Graphic (Bold Black Silhouette) -->
      <circle cx="220" cy="220" r="75" fill="#09090b"/>
      <polygon points="220,160 260,250 180,250" fill="#ffffff"/>
      <!-- Ink Brayer Roller -->
      <rect x="240" y="270" width="160" height="35" rx="6" fill="#0284c7" filter="url(#drop)"/>
      <line x1="320" y1="305" x2="380" y2="430" stroke="#78350f" stroke-width="16" stroke-linecap="round"/>
    `
  },
  'engraving': {
    bg: `<linearGradient id="bg_engraving" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>`,
    body: `
      <!-- Polished Copperplate with Steel Burin Engraver -->
      <rect x="80" y="80" width="340" height="340" rx="12" fill="#d97706" stroke="#fef3c7" stroke-width="6" filter="url(#drop)"/>
      <!-- Fine Intaglio Cross-hatching -->
      <g stroke="#78350f" stroke-width="2">
        <line x1="120" y1="120" x2="380" y2="120"/><line x1="120" y1="140" x2="380" y2="140"/>
        <line x1="120" y1="160" x2="380" y2="160"/><line x1="120" y1="180" x2="380" y2="180"/>
        <line x1="140" y1="100" x2="140" y2="360"/><line x1="160" y1="100" x2="160" y2="360"/>
        <line x1="180" y1="100" x2="180" y2="360"/>
      </g>
      <!-- Burin Tool -->
      <polygon points="260,240 340,320 310,340 240,260" fill="#64748b"/>
      <circle cx="360" cy="350" r="25" fill="#92400e" filter="url(#drop)"/>
    `
  },
  'mosaic': {
    bg: `<linearGradient id="bg_mosaic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>`,
    body: `
      <!-- Byzantine Smalti Colored Glass Tesserae Mosaic Tiles -->
      <g stroke="#0f172a" stroke-width="4">
        <!-- Gold and Cobalt Tesserae Grid -->
        <rect x="100" y="100" width="60" height="60" fill="#eab308"/>
        <rect x="165" y="100" width="60" height="60" fill="#3b82f6"/>
        <rect x="230" y="100" width="60" height="60" fill="#ef4444"/>
        <rect x="295" y="100" width="60" height="60" fill="#10b981"/>
        <rect x="100" y="165" width="60" height="60" fill="#6366f1"/>
        <rect x="165" y="165" width="60" height="60" fill="#facc15"/>
        <rect x="230" y="165" width="60" height="60" fill="#f97316"/>
        <rect x="295" y="165" width="60" height="60" fill="#3b82f6"/>
        <rect x="100" y="230" width="60" height="60" fill="#ec4899"/>
        <rect x="165" y="230" width="60" height="60" fill="#14b8a6"/>
        <rect x="230" y="230" width="60" height="60" fill="#fde047"/>
        <rect x="295" y="230" width="60" height="60" fill="#8b5cf6"/>
        <rect x="100" y="295" width="60" height="60" fill="#eab308"/>
        <rect x="165" y="295" width="60" height="60" fill="#3b82f6"/>
        <rect x="230" y="295" width="60" height="60" fill="#ef4444"/>
        <rect x="295" y="295" width="60" height="60" fill="#10b981"/>
      </g>
    `
  },
  'basketry': {
    bg: `<linearGradient id="bg_basketry" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#451a03"/>
      <stop offset="100%" stop-color="#291203"/>
    </linearGradient>`,
    body: `
      <!-- Interlaced Wicker and Rattan Woven Basketry Rim -->
      <ellipse cx="250" cy="240" rx="140" ry="110" fill="#d97706" stroke="#b45309" stroke-width="12" filter="url(#drop)"/>
      <ellipse cx="250" cy="240" rx="100" ry="75" fill="#78350f"/>
      <!-- Radiating Rattan Spokes -->
      <g stroke="#fef3c7" stroke-width="3">
        <line x1="250" y1="130" x2="250" y2="350"/>
        <line x1="110" y1="240" x2="390" y2="240"/>
        <line x1="150" y1="160" x2="350" y2="320"/>
        <line x1="150" y1="320" x2="350" y2="160"/>
      </g>
    `
  },
  'tapestry': {
    bg: `<linearGradient id="bg_tapestry" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14532d"/>
      <stop offset="100%" stop-color="#052e16"/>
    </linearGradient>`,
    body: `
      <!-- Woven Wall Tapestry with Wooden Suspension Rod -->
      <rect x="60" y="70" width="380" height="20" rx="6" fill="#78350f" filter="url(#drop)"/>
      <circle cx="65" cy="80" r="14" fill="#b45309"/>
      <circle cx="435" cy="80" r="14" fill="#b45309"/>
      <!-- Hanging Textile Tapestry -->
      <rect x="90" y="90" width="320" height="340" fill="#fef08a" stroke="#ca8a04" stroke-width="4" filter="url(#drop)"/>
      <polygon points="250,140 330,260 170,260" fill="#15803d"/>
      <circle cx="250" cy="220" r="28" fill="#dc2626"/>
      <rect x="90" y="380" width="320" height="50" fill="#b45309"/>
      <!-- Fringe tassels -->
      <g stroke="#ca8a04" stroke-width="4">
        <line x1="110" y1="430" x2="110" y2="455"/><line x1="150" y1="430" x2="150" y2="455"/>
        <line x1="190" y1="430" x2="190" y2="455"/><line x1="230" y1="430" x2="230" y2="455"/>
        <line x1="270" y1="430" x2="270" y2="455"/><line x1="310" y1="430" x2="310" y2="455"/>
        <line x1="350" y1="430" x2="350" y2="455"/><line x1="390" y1="430" x2="390" y2="455"/>
      </g>
    `
  },
  'gilding': {
    bg: `<linearGradient id="bg_gilding" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="100%" stop-color="#0c0a09"/>
    </linearGradient>`,
    body: `
      <!-- 24K Gold Leaf Flake Application with Gilder's Tip Brush -->
      <polygon points="120,160 380,120 340,360 100,320" fill="#eab308" filter="url(#softGlow)"/>
      <polygon points="140,180 360,140 320,340 120,300" fill="#fef08a" opacity="0.9"/>
      <!-- Gilder Tip Brush -->
      <rect x="240" y="80" width="120" height="60" rx="4" fill="#44403c" filter="url(#drop)"/>
      <path d="M240 140 L240 220 L360 220 L360 140 Z" fill="#ca8a04" opacity="0.75"/>
    `
  },
  'stonemasonry': {
    bg: `<linearGradient id="bg_stonemasonry" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Dressed Ashlar Stone Block with Mason's Mallet & Chisel -->
      <polygon points="120,200 320,150 400,220 200,270" fill="#94a3b8" filter="url(#drop)"/>
      <polygon points="120,200 200,270 200,400 120,330" fill="#64748b"/>
      <polygon points="200,270 400,220 400,350 200,400" fill="#475569"/>
      <!-- Mason Mallet -->
      <rect x="250" y="100" width="80" height="50" rx="8" fill="#d97706" filter="url(#drop)"/>
      <line x1="290" y1="150" x2="350" y2="280" stroke="#78350f" stroke-width="14" stroke-linecap="round"/>
    `
  },
  'origami': {
    bg: `<linearGradient id="bg_origami" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf2f8"/>
      <stop offset="100%" stop-color="#fce7f3"/>
    </linearGradient>`,
    body: `
      <!-- Crisp Faceted Paper Crane (Orizuru) with Precision Creases -->
      <polygon points="250,110 370,240 250,280 130,240" fill="#f43f5e" filter="url(#drop)"/>
      <polygon points="250,110 370,240 250,220" fill="#fb7185"/>
      <polygon points="250,110 130,240 250,220" fill="#fda4af"/>
      <polygon points="250,280 340,380 250,330" fill="#e11d48"/>
      <polygon points="250,280 160,380 250,330" fill="#be123c"/>
      <polygon points="130,240 70,260 120,290" fill="#9f1239"/>
    `
  },
  'blacksmithing': {
    bg: `<linearGradient id="bg_blacksmithing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c0a09"/>
      <stop offset="100%" stop-color="#1c1917"/>
    </linearGradient>`,
    body: `
      <!-- Cast Steel Anvil with Glowing Orange Hot Iron Rod & Sparks -->
      <path d="M120 300 L180 260 L340 260 L400 300 L360 380 L160 380 Z" fill="#334155" filter="url(#drop)"/>
      <rect x="200" y="380" width="120" height="60" fill="#1e293b"/>
      <!-- Glowing Forged Steel Bar -->
      <line x1="140" y1="240" x2="360" y2="240" stroke="#f97316" stroke-width="16" stroke-linecap="round" filter="url(#softGlow)"/>
      <line x1="200" y1="240" x2="300" y2="240" stroke="#fef08a" stroke-width="8" stroke-linecap="round"/>
      <!-- Flying Sparks -->
      <circle cx="210" cy="180" r="4" fill="#fde047"/>
      <circle cx="260" cy="160" r="5" fill="#fde047"/>
      <circle cx="310" cy="190" r="4" fill="#f97316"/>
    `
  },
  'potter': {
    bg: `<linearGradient id="bg_potter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>`,
    body: `
      <!-- Potter Hands Shaping Clay on Turning Wheel Plinth -->
      <ellipse cx="250" cy="380" rx="130" ry="30" fill="#1c1917" filter="url(#drop)"/>
      <ellipse cx="250" cy="370" rx="110" ry="24" fill="#292524"/>
      <!-- Clay Vessel in Formation -->
      <path d="M210 210 C180 270 180 330 210 360 L290 360 C320 330 320 270 290 210 Z" fill="#ea580c"/>
      <!-- Hands Cupping Clay -->
      <path d="M150 250 C190 240 210 270 210 300" stroke="#fcd34d" stroke-width="18" fill="none" stroke-linecap="round"/>
      <path d="M350 250 C310 240 290 270 290 300" stroke="#fcd34d" stroke-width="18" fill="none" stroke-linecap="round"/>
    `
  },
  'sculptor': {
    bg: `<linearGradient id="bg_sculptor" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Sculptor at Work with Mallet and Chisel on Stone Block -->
      <rect x="140" y="220" width="180" height="200" rx="8" fill="#94a3b8" stroke="#cbd5e1" stroke-width="4" filter="url(#drop)"/>
      <polygon points="140,220 220,160 320,220" fill="#64748b"/>
      <!-- Mallet in Swing -->
      <rect x="290" y="110" width="70" height="40" rx="6" fill="#d97706" transform="rotate(-25 290 110)" filter="url(#drop)"/>
      <line x1="330" y1="130" x2="390" y2="240" stroke="#78350f" stroke-width="14" stroke-linecap="round"/>
      <line x1="220" y1="210" x2="260" y2="170" stroke="#e2e8f0" stroke-width="10"/>
    `
  },
  'artisan': {
    bg: `<linearGradient id="bg_artisan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Atelier Craft Bench with Fine Artisan Tools -->
      <rect x="60" y="320" width="380" height="30" rx="4" fill="#b45309" filter="url(#drop)"/>
      <line x1="100" y1="350" x2="100" y2="440" stroke="#78350f" stroke-width="14"/>
      <line x1="400" y1="350" x2="400" y2="440" stroke="#78350f" stroke-width="14"/>
      <!-- Tools on Bench: Caliper, Hammer, Chisel -->
      <ellipse cx="250" cy="240" rx="60" ry="70" fill="#3b82f6" opacity="0.8"/>
      <line x1="160" y1="320" x2="160" y2="200" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round"/>
      <polygon points="160,200 175,170 145,170" fill="#94a3b8"/>
      <circle cx="250" cy="160" r="30" fill="#facc15" filter="url(#drop)"/>
    `
  },
  'craftsman': {
    bg: `<linearGradient id="bg_craftsman" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>`,
    body: `
      <!-- Master Wood Joint Mortise & Tenon Assembly -->
      <polygon points="160,180 260,140 340,180 240,220" fill="#d97706" filter="url(#drop)"/>
      <polygon points="160,180 240,220 240,360 160,320" fill="#b45309"/>
      <polygon points="240,220 340,180 340,320 240,360" fill="#92400e"/>
      <polygon points="210,130 270,105 315,130 255,155" fill="#fde68a" stroke="#d97706" stroke-width="3"/>
    `
  },
  'weaver': {
    bg: `<linearGradient id="bg_weaver" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14532d"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>`,
    body: `
      <!-- Weaver's Loom Shuttle Crossing Vibrant Threads -->
      <g stroke="#86efac" stroke-width="4">
        <line x1="120" y1="80" x2="120" y2="420"/><line x1="160" y1="80" x2="160" y2="420"/>
        <line x1="200" y1="80" x2="200" y2="420"/><line x1="240" y1="80" x2="240" y2="420"/>
        <line x1="280" y1="80" x2="280" y2="420"/><line x1="320" y1="80" x2="320" y2="420"/>
        <line x1="360" y1="80" x2="360" y2="420"/>
      </g>
      <!-- Shuttle in Motion -->
      <path d="M100 240 Q250 200 400 240 Q250 280 100 240 Z" fill="#f59e0b" stroke="#fef08a" stroke-width="4" filter="url(#drop)"/>
      <circle cx="250" cy="240" r="10" fill="#dc2626"/>
    `
  },
  'metalsmith': {
    bg: `<linearGradient id="bg_metalsmith" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Metalsmith Torch Flame Shaping Metal -->
      <line x1="120" y1="360" x2="240" y2="240" stroke="#94a3b8" stroke-width="16" stroke-linecap="round"/>
      <!-- Blue-Orange Torch Flame Cone -->
      <polygon points="240,240 330,200 310,270" fill="#3b82f6" filter="url(#softGlow)"/>
      <polygon points="250,235 300,215 290,250" fill="#f97316"/>
      <circle cx="320" cy="225" r="8" fill="#fef08a"/>
    `
  },
  'calligrapher': {
    bg: `<linearGradient id="bg_calligrapher" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>`,
    body: `
      <!-- Calligrapher Holding Bamboo Brush poised over Xuan Paper -->
      <rect x="100" y="160" width="280" height="260" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="3" filter="url(#drop)"/>
      <path d="M140 260 Q240 180 320 280" stroke="#0f172a" stroke-width="24" fill="none" stroke-linecap="round"/>
      <!-- Long Bamboo Brush -->
      <line x1="280" y1="80" x2="220" y2="260" stroke="#b45309" stroke-width="10" stroke-linecap="round"/>
      <polygon points="220,260 210,290 230,275" fill="#0f172a"/>
    `
  },
  'restorer': {
    bg: `<linearGradient id="bg_restorer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>`,
    body: `
      <!-- Art Conservator Magnifier Revealing Masterpiece Beneath Grime -->
      <rect x="80" y="80" width="340" height="340" rx="8" fill="#581c87" stroke="#eab308" stroke-width="8" filter="url(#drop)"/>
      <circle cx="250" cy="230" r="70" fill="#9333ea"/>
      <!-- Circular Magnifying Glass Lens -->
      <circle cx="230" cy="210" r="80" fill="none" stroke="#e2e8f0" stroke-width="12" filter="url(#drop)"/>
      <circle cx="230" cy="210" r="74" fill="#ffffff" opacity="0.25"/>
      <line x1="290" y1="270" x2="380" y2="360" stroke="#78350f" stroke-width="18" stroke-linecap="round"/>
    `
  }
};

// Placeholder SVG for unknown/missing image
const placeholderSVG = wrapArt(
  'placeholder',
  `<linearGradient id="bg_placeholder" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#1e293b"/>
    <stop offset="100%" stop-color="#0f172a"/>
  </linearGradient>`,
  `
    <circle cx="250" cy="220" r="80" fill="none" stroke="#64748b" stroke-width="4" stroke-dasharray="12,8"/>
    <polygon points="250,170 290,250 210,250" fill="#3b82f6" opacity="0.8"/>
    <circle cx="250" cy="220" r="14" fill="#facc15"/>
    <path d="M180 340 Q250 310 320 340" stroke="#94a3b8" stroke-width="6" fill="none" stroke-linecap="round"/>
  `
);
fs.writeFileSync(path.join(outputDir, '_placeholder.svg'), placeholderSVG, 'utf-8');

// Generate all 60 art SVGs
let count = 0;
for (const [key, piece] of Object.entries(artPieces)) {
  const svg = wrapArt(key, piece.bg, piece.body);
  const filePath = path.join(outputDir, `${key}.svg`);
  fs.writeFileSync(filePath, svg, 'utf-8');
  count++;
}

console.log(`✨ Successfully generated ${count} pure contemporary art gallery exhibits in ${outputDir}!`);
