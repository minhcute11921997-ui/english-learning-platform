#!/usr/bin/env node
/**
 * 🎨 Color Palette Generator
 * Tạo bảng màu nhất quán cho Tailwind CSS
 *
 * Usage:
 *   node color-palette.js --theme ocean    - Bảng màu xanh biển
 *   node color-palette.js --theme forest   - Bảng màu xanh lá
 *   node color-palette.js --theme sunset   - Bảng màu cam/vàng
 *   node color-palette.js --theme purple   - Bảng màu tím
 */

const fs = require('fs');
const path = require('path');

const THEMES = {
  ocean: {
    primary: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
    secondary: { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a' },
    accent: { 50:'#fdf4ff',100:'#fae8ff',200:'#f5d0fe',300:'#f0abfc',400:'#e879f9',500:'#d946ef',600:'#c026d3',700:'#a21caf',800:'#86198f',900:'#701a75' },
  },
  forest: {
    primary: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d' },
    secondary: { 50:'#fefce8',100:'#fef9c3',200:'#fef08a',300:'#fde047',400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207',800:'#854d0e',900:'#713f12' },
    accent: { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12' },
  },
  sunset: {
    primary: { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12' },
    secondary: { 50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d' },
    accent: { 50:'#fefce8',100:'#fef9c3',200:'#fef08a',300:'#fde047',400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207',800:'#854d0e',900:'#713f12' },
  },
  purple: {
    primary: { 50:'#faf5ff',100:'#f3e8ff',200:'#e9d5ff',300:'#d8b4fe',400:'#c084fc',500:'#a855f7',600:'#9333ea',700:'#7e22ce',800:'#6b21a8',900:'#581c87' },
    secondary: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
    accent: { 50:'#fdf2f8',100:'#fce7f3',200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#ec4899',600:'#db2777',700:'#be185d',800:'#9d174d',900:'#831843' },
  }
};

const themeArg = process.argv.find(a => a.startsWith('--theme'));
const themeName = themeArg ? process.argv[process.argv.indexOf(themeArg) + 1] : 'ocean';
const theme = THEMES[themeName];

if (!theme) {
  console.log(`❌ Unknown theme: ${themeName}`);
  console.log(`Available: ${Object.keys(THEMES).join(', ')}`);
  process.exit(1);
}

console.log(`🎨 Color Palette: ${themeName}\n`);

// Generate Tailwind config extension
const tailwindColors = `// Add to tailwind.config.js → theme.extend.colors\nconst colors = ${JSON.stringify(theme, null, 2)};\n\nmodule.exports = colors;\n`;

// Generate CSS variables
let cssVars = ':root {\n';
for (const [group, shades] of Object.entries(theme)) {
  for (const [shade, hex] of Object.entries(shades)) {
    cssVars += `  --color-${group}-${shade}: ${hex};\n`;
  }
}
cssVars += '}\n';

// Display
for (const [group, shades] of Object.entries(theme)) {
  console.log(`  ${group}:`);
  for (const [shade, hex] of Object.entries(shades)) {
    console.log(`    ${shade}: ${hex}`);
  }
  console.log();
}

// Save files
const outputDir = path.resolve(__dirname, '../output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(path.join(outputDir, `colors-${themeName}.js`), tailwindColors);
fs.writeFileSync(path.join(outputDir, `colors-${themeName}.css`), cssVars);

console.log(`📁 Saved to:`);
console.log(`  ${path.join(outputDir, `colors-${themeName}.js`)}`);
console.log(`  ${path.join(outputDir, `colors-${themeName}.css`)}`);
