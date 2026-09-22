#!/usr/bin/env node
/**
 * 📦 Bundle Size Analyzer
 * Phân tích kích thước bundle của ứng dụng React
 *
 * Usage: node bundle-analyzer.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Bundle Size Analyzer\n');

const clientDir = path.resolve(__dirname, '../../client');

try {
  // Build the project
  console.log('⏳ Building project...');
  execSync('npm run build', { cwd: clientDir, stdio: 'pipe' });

  const distDir = path.join(clientDir, 'dist');
  if (!fs.existsSync(distDir)) {
    console.log('❌ Build output not found at', distDir);
    process.exit(1);
  }

  // Analyze files
  const assets = path.join(distDir, 'assets');
  if (fs.existsSync(assets)) {
    const files = fs.readdirSync(assets);
    let totalJS = 0, totalCSS = 0, totalOther = 0;

    console.log('\n📊 Bundle breakdown:\n');
    console.log('  JavaScript:');
    files.filter(f => f.endsWith('.js')).forEach(f => {
      const size = fs.statSync(path.join(assets, f)).size;
      totalJS += size;
      console.log(`    ${f}: ${(size/1024).toFixed(1)}KB`);
    });

    console.log('\n  CSS:');
    files.filter(f => f.endsWith('.css')).forEach(f => {
      const size = fs.statSync(path.join(assets, f)).size;
      totalCSS += size;
      console.log(`    ${f}: ${(size/1024).toFixed(1)}KB`);
    });

    console.log(`\n${'─'.repeat(40)}`);
    console.log(`  Total JS:  ${(totalJS/1024).toFixed(1)}KB`);
    console.log(`  Total CSS: ${(totalCSS/1024).toFixed(1)}KB`);
    console.log(`  Total:     ${((totalJS+totalCSS)/1024).toFixed(1)}KB`);

    const limit = 500; // KB
    if (totalJS/1024 > limit) {
      console.log(`\n⚠️  JS bundle exceeds ${limit}KB! Consider:`);
      console.log('  • Code splitting with React.lazy()');
      console.log('  • Tree shaking unused imports');
      console.log('  • Using lighter alternatives for large libraries');
    } else {
      console.log('\n✅ Bundle size is within acceptable range.');
    }
  }
} catch (error) {
  console.log('❌ Build failed or client project not set up yet.');
  console.log('   Make sure to run "npm install" in the client directory first.');
}
