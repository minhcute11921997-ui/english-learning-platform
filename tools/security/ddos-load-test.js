#!/usr/bin/env node
/**
 * 🛡️🚀 High Concurrency & DDoS Stress Testing Tool
 *
 * Kiểm thử khả năng chịu tải cao, phòng vệ DDoS, giới hạn tần suất (Rate Limiting)
 * và tối ưu hóa xử lý đồng thời cho backend.
 *
 * Usage: node tools/security/ddos-load-test.js [base-url]
 */

const axios = require('axios');
const http = require('http');
const https = require('https');

const BASE_URL = process.argv[2] || 'http://localhost:3000/api';

// Tối ưu axios http agent với keep-alive để test concurrency chính xác
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 500 });
const client = axios.create({
  httpAgent,
  timeout: 10000,
  validateStatus: () => true
});

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { min: 0, max: 0, mean: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const getPercentile = (p) => sorted[Math.floor(sorted.length * p)];
  const sum = sorted.reduce((acc, cur) => acc + cur, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(sum / sorted.length),
    p50: getPercentile(0.50),
    p90: getPercentile(0.90),
    p95: getPercentile(0.95),
    p99: getPercentile(0.99)
  };
}

async function runConcurrencyTest(name, url, method, data, totalRequests, concurrency) {
  console.log(`\n--------------------------------------------------------------`);
  console.log(`⚡ TEST TẢI ĐỒNG THỜI: ${name}`);
  console.log(`   URL: ${url}`);
  console.log(`   Tổng request: ${totalRequests} | Concurrency (Đồng thời): ${concurrency}`);

  const latencies = [];
  const statusCodes = {};
  let errors = 0;
  let inFlight = 0;
  let completed = 0;

  const startTime = Date.now();

  const sendRequest = async () => {
    const reqStart = Date.now();
    try {
      let res;
      if (method === 'POST') {
        res = await client.post(url, data);
      } else {
        res = await client.get(url);
      }
      const dur = Date.now() - reqStart;
      latencies.push(dur);
      statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;
    } catch (err) {
      errors++;
      const code = err.response ? err.response.status : 'ERR';
      statusCodes[code] = (statusCodes[code] || 0) + 1;
    } finally {
      completed++;
    }
  };

  // Dispatch requests với concurrency control
  let launched = 0;
  const workers = [];

  const worker = async () => {
    while (launched < totalRequests) {
      launched++;
      await sendRequest();
    }
  };

  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const totalTime = Date.now() - startTime;
  const totalSeconds = totalTime / 1000;
  const rps = (completed / totalSeconds).toFixed(2);
  const metrics = calculatePercentiles(latencies);

  console.log(`\n📊 KẾT QUẢ HIỆU NĂNG:`);
  console.log(`   - Tổng thời gian hoàn thành: ${totalTime} ms (${totalSeconds.toFixed(2)}s)`);
  console.log(`   - Throughput (RPS):          ${rps} req/giây 🚀`);
  console.log(`   - Độ trễ trung bình:         ${metrics.mean} ms`);
  console.log(`   - Độ trễ P50 (50% requests): ${metrics.p50} ms`);
  console.log(`   - Độ trễ P90:                ${metrics.p90} ms`);
  console.log(`   - Độ trễ P95:                ${metrics.p95} ms`);
  console.log(`   - Độ trễ P99:                ${metrics.p99} ms`);
  console.log(`   - Min: ${metrics.min} ms | Max: ${metrics.max} ms`);
  console.log(`   - Phân bố HTTP Status:`, JSON.stringify(statusCodes));

  return { rps, metrics, statusCodes, errors };
}

async function testDDoSDefense() {
  console.log('\n==============================================================');
  console.log('🛡️ KIỂM THỬ CƠ CHẾ PHÒNG VỆ DDOS / FLOOD ATTACK (RATE LIMITING)');
  console.log('==============================================================');

  console.log('👉 Giả lập Botnet gửi dồn dập 240 request đăng nhập trong vài giây...');
  const burstRequests = 240;
  const promises = [];
  const statusCounts = {};

  const startBurst = Date.now();
  for (let i = 0; i < burstRequests; i++) {
    promises.push(
      client.post(`${BASE_URL}/auth/login`, {
        email: `attacker_${i}@badbot.com`,
        password: 'Password123!'
      }).then(res => {
        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
        return res.status;
      }).catch(err => {
        const code = err.response?.status || 'ERR';
        statusCounts[code] = (statusCounts[code] || 0) + 1;
        return code;
      })
    );
  }

  await Promise.all(promises);
  const duration = Date.now() - startBurst;

  console.log(`\n⏱️ Hoàn thành bắn ${burstRequests} requests trong ${duration}ms`);
  console.log(`📊 Phân bố mã HTTP trả về:`, statusCounts);

  if (statusCounts[429] > 0) {
    console.log(`✅ [THÀNH CÔNG] Rate Limiter đã kích hoạt chặn thành công ${statusCounts[429]} requests với HTTP 429 Too Many Requests!`);
    console.log(`🛡️ Server và Database được bảo vệ an toàn khỏi việc bị kiệt quệ tài nguyên CPU/Bcrypt!`);
  } else {
    console.log(`⚠️ Không có request nào bị chặn 429. Cần xem lại cấu hình windowMs và max.`);
  }
}

async function testLargePayloadDefense() {
  console.log('\n==============================================================');
  console.log('🛡️ KIỂM THỬ CHỐNG TẤN CÔNG MEMORY EXHAUSTION (PAYLOAD QUÁ TẢI)');
  console.log('==============================================================');

  console.log('👉 Gửi payload JSON dung lượng ~2.5MB (vượt ngưỡng 1MB quy định)...');
  const largeString = 'A'.repeat(2.5 * 1024 * 1024);
  try {
    const res = await client.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: largeString
    });

    if (res.status === 413) {
      console.log(`✅ [THÀNH CÔNG] Server chặn đứng payload lớn với HTTP 413 Payload Too Large!`);
    } else {
      console.log(`⚠️ Server trả về status ${res.status}`);
    }
  } catch (err) {
    if (err.response?.status === 413) {
      console.log(`✅ [THÀNH CÔNG] Server chặn đứng payload lớn với HTTP 413 Payload Too Large!`);
    } else {
      console.log(`❌ Lỗi: ${err.message}`);
    }
  }
}

async function testCompression() {
  console.log('\n==============================================================');
  console.log('📦 KIỂM THỬ TỐI ƯU HÓA BĂNG THÔNG VỚI NÉN HTTP GZIP/COMPRESSION');
  console.log('==============================================================');

  try {
    const res = await axios.get(`${BASE_URL}/topics`, {
      headers: { 'Accept-Encoding': 'gzip, deflate, br' },
      decompress: false // Không tự động giải nén để đo kích thước
    });

    const encoding = res.headers['content-encoding'];
    const compressedSize = res.data.length || (typeof res.data === 'string' ? Buffer.byteLength(res.data) : 0);

    console.log(`- Header Content-Encoding: ${encoding || 'None'}`);
    if (encoding && (encoding.includes('gzip') || encoding.includes('br') || encoding.includes('deflate'))) {
      console.log(`✅ [THÀNH CÔNG] Dữ liệu được nén qua ${encoding}, giúp tiết kiệm tối đa băng thông khi nhiều người dùng cùng truy cập!`);
    } else {
      console.log(`ℹ️ Response không có Content-Encoding (dữ liệu có thể nhỏ hơn ngưỡng threshold của compression middleware)`);
    }
  } catch (err) {
    console.log(`❌ Lỗi kiểm tra nén: ${err.message}`);
  }
}

async function main() {
  console.log('==============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ HIỆU NĂNG TẢI CAO & PHÒNG THỦ BẢO MẬT WEB');
  console.log(`🌐 Base API: ${BASE_URL}`);
  console.log('==============================================================');

  // 1. Kiểm tra nén
  await testCompression();

  // 2. Chống Memory Exhaustion (Payload quá tải)
  await testLargePayloadDefense();

  // 3. Test tải đồng thời cao: /topics
  await runConcurrencyTest('Đọc danh sách chủ đề (/topics)', `${BASE_URL}/topics`, 'GET', null, 200, 50);

  // 4. Test tải đồng thời cao: /readings
  await runConcurrencyTest('Luyện đọc hiểu (/readings)', `${BASE_URL}/readings`, 'GET', null, 300, 75);

  // 5. Test tải đồng thời cao: /vocabularies/topic/1
  await runConcurrencyTest('Học từ vựng theo chủ đề (/vocabularies/topic/1)', `${BASE_URL}/vocabularies/topic/1`, 'GET', null, 500, 100);

  // 6. Test cơ chế phòng thủ DDoS / Rate Limiting
  await testDDoSDefense();

  console.log('\n==============================================================');
  console.log('🎉 HOÀN THÀNH TOÀN BỘ BÀI TEST CHỊU TẢI & BẢO MẬT TẤN CÔNG!');
  console.log('==============================================================\n');
}

main().catch(err => {
  console.error('Lỗi thực thi:', err);
});
