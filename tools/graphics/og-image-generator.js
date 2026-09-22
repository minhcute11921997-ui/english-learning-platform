#!/usr/bin/env node
/**
 * 🖼️ Open Graph Image Generator
 * Tạo ảnh OG cho sharing trên mạng xã hội
 *
 * Usage: node og-image-generator.js --title "Lesson Title" --author "Username"
 */

const fs = require('fs');
const path = require('path');

function generateOgSVG(title, author = 'English Learning App', topic = '') {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="80" y="200" font-family="Arial, sans-serif" font-size="56" fill="white" font-weight="bold">
    <tspan x="80" dy="0">${title.substring(0, 35)}</tspan>
    <tspan x="80" dy="70">${title.substring(35, 70)}</tspan>
  </text>
  <text x="80" y="420" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.8)">by ${author}</text>
  ${topic ? `<text x="80" y="470" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.6)">📚 ${topic}</text>` : ''}
  <text x="80" y="560" font-family="Arial, sans-serif" font-size="32" fill="rgba(255,255,255,0.9)" font-weight="bold">📘 English Learning App</text>
</svg>`;
}

const args = process.argv.slice(2);
const titleIdx = args.indexOf('--title');
const authorIdx = args.indexOf('--author');

const title = titleIdx !== -1 ? args[titleIdx + 1] : 'English Learning App';
const author = authorIdx !== -1 ? args[authorIdx + 1] : 'EnLearn';

const svg = generateOgSVG(title, author);
const outputDir = path.resolve(__dirname, '../output');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'og-image.svg'), svg);
console.log(`✅ OG image saved to ${path.join(outputDir, 'og-image.svg')}`);
