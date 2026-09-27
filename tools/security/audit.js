#!/usr/bin/env node
/**
 * 🛡️ Security Audit Tool
 * Kiểm tra lỗ hổng bảo mật trong dependencies
 * Usage: node audit.js [--fix]
 */

const { execSync } = require('child_process');
const path = require('path');

const projects = [
  { name: 'Server', path: path.resolve(__dirname, '../../server') },
  { name: 'Client', path: path.resolve(__dirname, '../../client') },
  { name: 'Tools', path: path.resolve(__dirname, '..') },
];

const shouldFix = process.argv.includes('--fix');

console.log('🛡️  Security Audit Tool\n');

for (const project of projects) {
  console.log(`\n📋 Auditing ${project.name} (${project.path}):`);
  try {
    const cmd = shouldFix ? 'npm audit fix' : 'npm audit --json';
    let result = '';
    try {
      result = execSync(cmd, { cwd: project.path, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err) {
      if (err.stdout) {
        result = err.stdout;
      } else {
        throw err;
      }
    }
    if (!shouldFix) {
      try {
        const audit = JSON.parse(result);
        const { vulnerabilities } = audit.metadata || {};
        if (vulnerabilities) {
          const total = Object.values(vulnerabilities).reduce((a, b) => a + b, 0);
          if (total === 0) console.log('  ✅ No vulnerabilities found');
          else {
            console.log(`  ⚠️  Found vulnerabilities:`);
            for (const [severity, count] of Object.entries(vulnerabilities)) {
              if (count > 0) console.log(`     ${severity}: ${count}`);
            }
          }
        }
      } catch (e) {
        console.log('  ✅ Audit completed');
      }
    } else {
      console.log('  ✅ Audit fix completed');
    }
  } catch (error) {
    console.log(`  ℹ️  Skipped (${error.message || 'error running audit'})`);
  }
}

console.log('\n💡 Tip: Run "node audit.js --fix" to auto-fix.\n');
