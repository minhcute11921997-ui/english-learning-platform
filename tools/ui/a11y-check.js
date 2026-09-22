#!/usr/bin/env node
/**
 * ♿ Accessibility Checker
 * Kiểm tra các vấn đề accessibility phổ biến trong source code React
 *
 * Usage: node a11y-check.js [directory]
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const A11Y_RULES = [
  { pattern: /<img(?![^>]*alt=)/g, desc: 'img without alt attribute', severity: 'error' },
  { pattern: /<a(?![^>]*aria-label)(?![^>]*>\s*\S)/g, desc: 'Link might be missing accessible text', severity: 'warn' },
  { pattern: /onClick(?!.*role=|.*button|.*Button|.*<button)/g, desc: 'onClick without role or button element', severity: 'warn' },
  { pattern: /<input(?![^>]*aria-label)(?![^>]*id=)(?![^>]*placeholder=)/g, desc: 'Input without label association', severity: 'warn' },
  { pattern: /style=.*color.*!important/g, desc: 'Color with !important may override user preferences', severity: 'info' },
  { pattern: /tabIndex=["']-1["']/g, desc: 'Negative tabIndex removes from tab order', severity: 'info' },
  { pattern: /autoFocus/g, desc: 'autoFocus can be disorienting for screen readers', severity: 'info' },
];

async function check() {
  const targetDir = process.argv[2] || path.resolve(__dirname, '../../client/src');
  console.log(`♿ Accessibility Checker\n`);
  console.log(`📁 Scanning: ${targetDir}\n`);

  const files = await glob(`${targetDir}/**/*.{jsx,tsx}`, { ignore: ['**/node_modules/**'] });
  let counts = { error: 0, warn: 0, info: 0 };

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, index) => {
      for (const rule of A11Y_RULES) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(line)) {
          issues.push({ line: index + 1, ...rule });
        }
      }
    });

    if (issues.length > 0) {
      const relative = path.relative(targetDir, file);
      console.log(`📄 ${relative}:`);
      const icons = { error: '❌', warn: '⚠️', info: 'ℹ️' };
      issues.forEach(i => {
        console.log(`  ${icons[i.severity]} Line ${i.line}: ${i.desc}`);
        counts[i.severity]++;
      });
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 ${files.length} files scanned`);
  console.log(`   ❌ ${counts.error} errors | ⚠️ ${counts.warn} warnings | ℹ️ ${counts.info} info`);
  if (counts.error === 0 && counts.warn === 0) console.log('\n✅ Great accessibility practices!');
}

check();
