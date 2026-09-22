#!/usr/bin/env node
/**
 * 🖼️ Image Optimizer
 * Nén và tối ưu hóa ảnh cho web
 *
 * Usage: node image-optimizer.js <directory> [--quality 80] [--max-width 800]
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function optimize() {
  const targetDir = process.argv[2] || path.resolve(__dirname, '../../client/public/images');
  const quality = parseInt(process.argv.find(a => a.startsWith('--quality'))?.split('=')[1] || process.argv[process.argv.indexOf('--quality') + 1]) || 80;
  const maxWidth = parseInt(process.argv.find(a => a.startsWith('--max-width'))?.split('=')[1] || process.argv[process.argv.indexOf('--max-width') + 1]) || 800;

  console.log(`🖼️  Image Optimizer\n`);
  console.log(`📁 Directory: ${targetDir}`);
  console.log(`⚙️  Quality: ${quality}%, Max width: ${maxWidth}px\n`);

  try {
    const sharp = require('sharp');
    const images = await glob(`${targetDir}/**/*.{jpg,jpeg,png,webp,gif}`);
    
    if (images.length === 0) {
      console.log('ℹ️  No images found.');
      return;
    }

    let totalSaved = 0;

    for (const imagePath of images) {
      const originalSize = fs.statSync(imagePath).size;
      const ext = path.extname(imagePath).toLowerCase();
      const outputPath = imagePath.replace(ext, '.webp');

      try {
        await sharp(imagePath)
          .resize(maxWidth, null, { withoutEnlargement: true })
          .webp({ quality })
          .toFile(outputPath);

        const newSize = fs.statSync(outputPath).size;
        const saved = originalSize - newSize;
        totalSaved += saved;

        const pct = ((saved / originalSize) * 100).toFixed(1);
        const relative = path.relative(targetDir, imagePath);
        console.log(`  ✅ ${relative} → .webp (${(originalSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB, -${pct}%)`);
      } catch (e) {
        console.log(`  ❌ ${path.basename(imagePath)}: ${e.message}`);
      }
    }

    console.log(`\n📊 Total: ${images.length} images, saved ${(totalSaved/1024).toFixed(1)}KB`);
  } catch (error) {
    console.log('❌ sharp not available. Install: npm install sharp');
  }
}

optimize();
