#!/usr/bin/env node
/**
 * 🏞️ Placeholder Image Generator
 * Tạo ảnh placeholder cho từ vựng khi chưa có ảnh thật
 *
 * Usage:
 *   node placeholder-gen.js --word "apple" --output ./images/
 *   node placeholder-gen.js --batch vocabulary.json --output ./images/
 */

const fs = require('fs');
const path = require('path');

const TOPIC_COLORS = {
  'about_me': '#3b82f6',
  'family': '#ec4899',
  'school': '#f97316',
  'food': '#22c55e',
  'hobbies': '#a855f7',
  'animals': '#eab308',
  'daily_life': '#14b8a6',
  'default': '#6b7280',
};

function generateSVG(word, topic = 'default', size = 400) {
  const bgColor = TOPIC_COLORS[topic] || TOPIC_COLORS.default;
  const initial = word.charAt(0).toUpperCase();
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}" rx="16"/>
  <text x="50%" y="38%" font-family="Arial, sans-serif" font-size="${size * 0.3}" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${initial}</text>
  <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="${size * 0.08}" fill="rgba(255,255,255,0.9)" text-anchor="middle" dominant-baseline="middle">${word}</text>
  <text x="50%" y="80%" font-family="Arial, sans-serif" font-size="${size * 0.05}" fill="rgba(255,255,255,0.6)" text-anchor="middle" dominant-baseline="middle">${topic.replace('_', ' ')}</text>
</svg>`;
}

async function main() {
  const args = process.argv.slice(2);
  const wordIdx = args.indexOf('--word');
  const batchIdx = args.indexOf('--batch');
  const outputIdx = args.indexOf('--output');
  const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : path.resolve(__dirname, '../output/placeholders');

  fs.mkdirSync(outputDir, { recursive: true });

  if (wordIdx !== -1) {
    const word = args[wordIdx + 1];
    const topic = args[args.indexOf('--topic') + 1] || 'default';
    const svg = generateSVG(word, topic);
    const filename = `${word.toLowerCase().replace(/\s+/g, '-')}.svg`;
    fs.writeFileSync(path.join(outputDir, filename), svg);
    console.log(`✅ Created: ${filename}`);
  } else if (batchIdx !== -1) {
    const dataFile = args[batchIdx + 1];
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    let count = 0;
    for (const item of data) {
      const svg = generateSVG(item.word, item.topic || 'default');
      const filename = `${item.word.toLowerCase().replace(/\s+/g, '-')}.svg`;
      fs.writeFileSync(path.join(outputDir, filename), svg);
      count++;
    }
    console.log(`✅ Created ${count} placeholder images in ${outputDir}`);
  } else {
    console.log('Usage:');
    console.log('  node placeholder-gen.js --word "apple" [--topic food] [--output dir]');
    console.log('  node placeholder-gen.js --batch data.json [--output dir]');
  }
}

main();
