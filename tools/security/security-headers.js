#!/usr/bin/env node
/**
 * 🔒 Security Headers Checker
 * Usage: node security-headers.js [url]
 */
const axios = require('axios');
const url = process.argv[2] || 'http://localhost:3000';

const EXPECTED_HEADERS = [
  { header: 'x-content-type-options', expected: 'nosniff', desc: 'Prevents MIME sniffing' },
  { header: 'x-frame-options', expected: 'DENY', desc: 'Prevents clickjacking' },
  { header: 'x-xss-protection', expected: '0', desc: 'XSS filter' },
  { header: 'strict-transport-security', desc: 'Forces HTTPS', optional: true },
  { header: 'content-security-policy', desc: 'Controls resource loading', optional: true },
  { header: 'x-powered-by', expected: null, desc: 'Should be removed' },
  { header: 'referrer-policy', desc: 'Controls referrer info' },
];

async function check() {
  console.log(`🔒 Security Headers Checker\n\n🌐 URL: ${url}\n`);
  try {
    const res = await axios.get(url, { validateStatus: () => true });
    for (const h of EXPECTED_HEADERS) {
      const value = res.headers[h.header];
      if (h.expected === null) {
        console.log(value ? `  ⚠️  ${h.header}: present (should remove)` : `  ✅ ${h.header}: not present ✓`);
      } else if (value) {
        console.log(`  ✅ ${h.header}: ${value}`);
      } else if (h.optional) {
        console.log(`  ⚪ ${h.header}: not set (optional)`);
      } else {
        console.log(`  ❌ ${h.header}: MISSING`);
      }
    }
    console.log('\n💡 Use helmet.js for automatic security headers');
  } catch (error) {
    console.log(`❌ Cannot connect to ${url}: ${error.message}`);
  }
}
check();
