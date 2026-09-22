#!/usr/bin/env node
/**
 * 🔒 SQL Injection Vulnerability Scanner
 * Usage: node sql-injection-check.js <directory>
 */
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const DANGEROUS_PATTERNS = [
  { pattern: /query\s*\(\s*[`'"].*\$\{/g, desc: 'Template literal in raw SQL query' },
  { pattern: /query\s*\(\s*['"].*\+\s*/g, desc: 'String concatenation in SQL query' },
  { pattern: /\.raw\s*\(\s*[`'"].*\$\{/g, desc: 'Template literal in Sequelize raw query' },
  { pattern: /execute\s*\(\s*[`'"].*\$\{/g, desc: 'Template literal in execute statement' },
  { pattern: /WHERE.*req\.(body|params|query)/g, desc: 'Direct user input in WHERE clause' },
  { pattern: /ORDER BY.*req\.(body|params|query)/g, desc: 'Direct user input in ORDER BY' },
];

async function scan() {
  const targetDir = process.argv[2] || path.resolve(__dirname, '../../server/src');
  console.log(`🔒 SQL Injection Scanner\n\n📁 Scanning: ${targetDir}\n`);

  const files = await glob(`${targetDir}/**/*.{js,ts}`, { ignore: ['**/node_modules/**'] });
  let totalIssues = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, index) => {
      for (const { pattern, desc } of DANGEROUS_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          issues.push({ line: index + 1, desc, code: line.trim() });
        }
      }
    });

    if (issues.length > 0) {
      const relative = path.relative(targetDir, file);
      console.log(`\n⚠️  ${relative}:`);
      issues.forEach(i => {
        console.log(`  Line ${i.line}: ${i.desc}`);
        console.log(`    → ${i.code.substring(0, 100)}`);
      });
      totalIssues += issues.length;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Scanned ${files.length} files, found ${totalIssues} potential issues`);
  if (totalIssues === 0) console.log('✅ No SQL injection risks detected!');
  else {
    console.log('\n💡 Recommendations:');
    console.log('  ✓ Use parameterized queries');
    console.log('  ✓ Use Sequelize ORM methods');
    console.log('  ✓ Use express-validator');
  }
}

scan();
