#!/usr/bin/env node
/**
 * 🏎️ Lighthouse Performance Audit
 * Chạy Google Lighthouse để đánh giá performance, accessibility, SEO
 *
 * Usage: node lighthouse-audit.js [url]
 */

async function run() {
  const url = process.argv[2] || 'http://localhost:5173';
  console.log(`🏎️  Lighthouse Audit\n`);
  console.log(`🌐 URL: ${url}\n`);

  try {
    const lighthouse = require('lighthouse');
    const chromeLauncher = require('chrome-launcher');

    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = { logLevel: 'error', output: 'html', port: chrome.port };
    const result = await lighthouse(url, options);

    const { categories } = result.lhr;
    console.log('📊 Scores:\n');
    for (const [key, cat] of Object.entries(categories)) {
      const score = Math.round(cat.score * 100);
      const icon = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
      console.log(`  ${icon} ${cat.title}: ${score}/100`);
    }

    const outputDir = require('path').resolve(__dirname, '../output');
    require('fs').mkdirSync(outputDir, { recursive: true });
    const reportPath = require('path').join(outputDir, 'lighthouse-report.html');
    require('fs').writeFileSync(reportPath, result.report);
    console.log(`\n📁 Full report: ${reportPath}`);

    await chrome.kill();
  } catch (error) {
    console.log('❌ Lighthouse not available. Install: npm install lighthouse chrome-launcher');
    console.log('\n📋 Manual performance checklist:');
    console.log('  ☐ Images optimized (WebP, lazy loading)');
    console.log('  ☐ Code splitting & lazy loading routes');
    console.log('  ☐ Caching with React Query');
    console.log('  ☐ Bundle size < 500KB (gzipped)');
    console.log('  ☐ First Contentful Paint < 1.5s');
    console.log('  ☐ Largest Contentful Paint < 2.5s');
  }
}

run();
