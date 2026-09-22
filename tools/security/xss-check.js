#!/usr/bin/env node
/**
 * 🛡️ XSS Vulnerability Scanner
 * Usage: node xss-check.js <directory>
 */
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const DANGEROUS_PATTERNS = [
  { pattern: /dangerouslySetInnerHTML/g, desc: 'dangerouslySetInnerHTML usage (XSS risk)' },
  { pattern: /innerHTML\s*=/g, desc: 'Direct innerHTML assignment' },
  { pattern: /document\.write/g, desc: 'document.write usage' },
  { pattern: /eval\s*\(/g, desc: 'eval() usage' },
];

async function scan() {
  const targetDir = process.argv[2] || path.resolve(__dirname, '../../client/src');
  console.log(`🛡️  XSS Scanner\n\n📁 Scanning: ${targetDir}\n`);
  const files = await glob(`${targetDir}/**/*.{jsx,tsx,js,ts}`, { ignore: ['**/node_modules/**'] });
  let totalIssues = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const issues = [];
    lines.forEach((line, index) => {
      for (const { pattern, desc } of DANGEROUS_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) issues.push({ line: index + 1, desc, code: line.trim() });
      }
    });
    if (issues.length > 0) {
      console.log(`⚠️  ${path.relative(targetDir, file)}:`);
      issues.forEach(i => console.log(`  Line ${i.line}: ${i.desc}`));
      totalIssues += issues.length;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Scanned ${files.length} files, found ${totalIssues} potential XSS issues`);
  if (totalIssues === 0) console.log('✅ No XSS risks detected!');
}

scan();
