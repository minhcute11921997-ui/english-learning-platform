#!/usr/bin/env node
/**
 * 🎯 Favicon Generator
 * Tạo favicon ở nhiều kích thước từ 1 ảnh gốc
 *
 * Usage: node favicon-generator.js <source-image>
 */

const path = require('path');
const fs = require('fs');

const SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

async function generate() {
  const source = process.argv[2];
  if (!source) {
    console.log('Usage: node favicon-generator.js <source-image>');
    console.log('  Source should be at least 512x512px');
    process.exit(1);
  }

  console.log(`🎯 Favicon Generator\n`);
  console.log(`📁 Source: ${source}\n`);

  try {
    const sharp = require('sharp');
    const outputDir = path.resolve(__dirname, '../output/favicons');
    fs.mkdirSync(outputDir, { recursive: true });

    for (const { size, name } of SIZES) {
      await sharp(source)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, name));
      console.log(`  ✅ ${name} (${size}x${size})`);
    }

    // Generate webmanifest
    const manifest = {
      name: 'English Learning App',
      short_name: 'EnLearn',
      icons: SIZES.filter(s => s.size >= 192).map(s => ({
        src: `/${s.name}`, sizes: `${s.size}x${s.size}`, type: 'image/png'
      })),
      theme_color: '#3b82f6',
      background_color: '#ffffff',
      display: 'standalone',
    };
    fs.writeFileSync(path.join(outputDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

    // Generate HTML snippet
    const html = `<!-- Favicons - copy to index.html <head> -->\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">\n<meta name="theme-color" content="#3b82f6">`;
    fs.writeFileSync(path.join(outputDir, 'favicon-html.txt'), html);

    console.log(`\n📁 Output: ${outputDir}`);
    console.log('📋 Copy favicon-html.txt content to your index.html <head>');
  } catch (error) {
    console.log('❌ sharp not available. Install: npm install sharp');
  }
}

generate();
