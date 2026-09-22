#!/usr/bin/env node
/**
 * 🧪 API Endpoint Tester
 * Tự động test các API endpoints của ứng dụng
 *
 * Usage:
 *   node api-tester.js              - Test all endpoints
 *   node api-tester.js --auth       - Test auth endpoints only
 *   node api-tester.js --vocab      - Test vocabulary endpoints
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken = null;

const tests = {
  auth: [
    { method: 'POST', path: '/auth/register', body: { username: 'testuser', email: 'test@test.com', password: 'Test@123456', full_name: 'Test User' }, expect: 201 },
    { method: 'POST', path: '/auth/login', body: { email: 'test@test.com', password: 'Test@123456' }, expect: 200, saveToken: true },
    { method: 'GET', path: '/users/profile', auth: true, expect: 200 },
  ],
  vocabulary: [
    { method: 'GET', path: '/vocabulary/topics', auth: true, expect: 200 },
    { method: 'GET', path: '/vocabulary/topic/1', auth: true, expect: 200 },
    { method: 'GET', path: '/vocabulary/flashcards/1', auth: true, expect: 200 },
  ],
  reading: [
    { method: 'GET', path: '/readings', auth: true, expect: 200 },
    { method: 'GET', path: '/readings/recommended', auth: true, expect: 200 },
  ],
  review: [
    { method: 'GET', path: '/review/due', auth: true, expect: 200 },
    { method: 'GET', path: '/review/stats', auth: true, expect: 200 },
  ],
  lesson: [
    { method: 'GET', path: '/lessons/explore', auth: true, expect: 200 },
    { method: 'GET', path: '/lessons/mine', auth: true, expect: 200 },
    { method: 'GET', path: '/lessons/bookmarked', auth: true, expect: 200 },
  ],
  group: [
    { method: 'GET', path: '/groups', auth: true, expect: 200 },
  ],
};

async function runTest(test) {
  try {
    const config = {
      method: test.method,
      url: \`\${BASE_URL}\${test.path}\`,
      data: test.body,
      headers: test.auth && authToken ? { Authorization: \`Bearer \${authToken}\` } : {},
      validateStatus: () => true,
    };

    const start = Date.now();
    const res = await axios(config);
    const time = Date.now() - start;

    if (test.saveToken && res.data?.data?.accessToken) {
      authToken = res.data.data.accessToken;
    }

    const passed = res.status === test.expect;
    const icon = passed ? '✅' : '❌';
    console.log(\`  \${icon} \${test.method} \${test.path} → \${res.status} (\${time}ms) \${passed ? '' : \`(expected \${test.expect})\`}\`);
    return passed;
  } catch (error) {
    console.log(\`  ❌ \${test.method} \${test.path} → ERROR: \${error.message}\`);
    return false;
  }
}

async function run() {
  console.log(\`\\n🧪 API Tester - \${BASE_URL}\\n\`);
  
  const filter = process.argv[2]?.replace('--', '');
  const groups = filter ? { [filter]: tests[filter] } : tests;
  
  let total = 0, passed = 0;

  for (const [group, groupTests] of Object.entries(groups)) {
    if (!groupTests) { console.log(\`❓ Unknown group: \${group}\`); continue; }
    console.log(\`\\n📋 \${group.toUpperCase()}:\`);
    for (const test of groupTests) {
      total++;
      if (await runTest(test)) passed++;
    }
  }

  console.log(\`\\n📊 Results: \${passed}/\${total} passed \${passed === total ? '🎉' : '⚠️'}\\n\`);
}

run();
