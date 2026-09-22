#!/usr/bin/env node
/**
 * ⚡ API Performance Benchmark
 * Đo thời gian phản hồi của các API endpoints
 *
 * Usage: node perf-benchmark.js [base-url]
 */

const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:3000/api';

const ENDPOINTS = [
  { path: '/vocabulary/topics', name: 'Get Topics' },
  { path: '/vocabulary/topic/1', name: 'Get Vocab by Topic' },
  { path: '/readings', name: 'Get Readings' },
  { path: '/lessons/explore?page=1&limit=10', name: 'Explore Lessons' },
  { path: '/review/due', name: 'Get Due Reviews' },
  { path: '/dashboard/overview', name: 'Dashboard Overview' },
];

async function benchmark(endpoint, token, iterations = 5) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await axios.get(`${BASE_URL}${endpoint.path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        validateStatus: () => true,
      });
      times.push(Date.now() - start);
    } catch (e) {
      times.push(-1);
    }
  }
  return times.filter(t => t > 0);
}

async function run() {
  console.log(`⚡ API Performance Benchmark\n`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📊 Iterations per endpoint: 5\n`);

  // Try to get auth token
  let token = null;
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@enlearn.com', password: 'Admin@123'
    }, { validateStatus: () => true });
    token = res.data?.data?.accessToken;
  } catch (e) {}

  console.log(`${'Endpoint'.padEnd(30)} ${'Avg'.padStart(8)} ${'Min'.padStart(8)} ${'Max'.padStart(8)} Status`);
  console.log('─'.repeat(65));

  for (const ep of ENDPOINTS) {
    const times = await benchmark(ep, token);
    if (times.length === 0) {
      console.log(`${ep.name.padEnd(30)} ${'-'.padStart(8)} ${'-'.padStart(8)} ${'-'.padStart(8)} ❌ Failed`);
    } else {
      const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(0);
      const min = Math.min(...times);
      const max = Math.max(...times);
      const status = avg < 200 ? '🟢' : avg < 500 ? '🟡' : '🔴';
      console.log(`${ep.name.padEnd(30)} ${(avg + 'ms').padStart(8)} ${(min + 'ms').padStart(8)} ${(max + 'ms').padStart(8)} ${status}`);
    }
  }

  console.log('\n🟢 < 200ms  🟡 200-500ms  🔴 > 500ms');
}

run();
