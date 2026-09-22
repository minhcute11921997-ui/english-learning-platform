#!/usr/bin/env node
/**
 * 📱 Responsive Design Checker
 * Kiểm tra trang web ở nhiều kích thước màn hình
 *
 * Usage: node responsive-check.js [url]
 */

const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Desktop', width: 1920, height: 1080 },
];

async function check() {
  const url = process.argv[2] || 'http://localhost:5173';
  console.log(`📱 Responsive Design Checker\n`);
  console.log(`🌐 URL: ${url}\n`);
  
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: true });
    const outputDir = require('path').resolve(__dirname, '../output/responsive');
    require('fs').mkdirSync(outputDir, { recursive: true });

    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        const filename = `${vp.name.replace(/\s+/g, '-').toLowerCase()}-${vp.width}x${vp.height}.png`;
        await page.screenshot({ path: require('path').join(outputDir, filename), fullPage: true });
        console.log(`  ✅ ${vp.name} (${vp.width}x${vp.height}) → ${filename}`);
      } catch (e) {
        console.log(`  ❌ ${vp.name}: ${e.message}`);
      }
      await page.close();
    }

    await browser.close();
    console.log(`\n📁 Screenshots saved to: ${outputDir}`);
  } catch (error) {
    console.log('❌ Puppeteer not available. Install it: npm install puppeteer');
    console.log('\n📋 Manual checklist for responsive design:');
    VIEWPORTS.forEach(vp => {
      console.log(`  ☐ Test at ${vp.name} (${vp.width}x${vp.height})`);
    });
  }
}

check();
