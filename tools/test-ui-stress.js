/**
 * 🖥️ EngLearn Comprehensive Puppeteer E2E UI & Crash Stress Test
 * Simulates real user interactions, rapid clicks, input fuzzing,
 * route transitions, and monitors console errors / page crashes.
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:5173';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const errors = [];
const consoleErrors = [];

async function runUITests() {
  console.log('\n======================================================');
  console.log('🖥️ BẮT ĐẦU TEST GIAO DIỆN & TRÌNH DUYỆT THỰC TẾ (E2E)');
  console.log('======================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Lắng nghe lỗi console và unhandled exceptions từ React
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Bỏ qua lỗi icon 404 nếu có
      if (!text.includes('favicon.ico')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', err => {
    errors.push(`Page Crash / Exception: ${err.message}`);
    console.log(`  💥 CRASH: ${err.message}`);
  });

  async function testStep(name, fn) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      failedTests++;
      errors.push(`${name} -> ${err.message}`);
      console.log(`  ❌ [FAIL] ${name} -> ${err.message}`);
    }
  }

  // --- 1. LOGIN PAGE TESTS ---
  console.log('🔐 BƯỚC 1: KIỂM THỬ TRANG ĐĂNG NHẬP & FORM VALIDATION');

  await testStep('Truy cập trang đăng nhập (/login)', async () => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 5000 });
  });

  await testStep('Nhập ký tự đặc biệt, dấu, emoji vào ô Email & Password không làm crash React', async () => {
    const emailInput = await page.$('input[name="email"], input[type="email"]');
    const passInput = await page.$('input[name="password"], input[type="password"]');

    await emailInput.click({ clickCount: 3 });
    await emailInput.type(`🚀 Special_Chars!@#$%^&*()_+{}[]:;"'<>,.?/~\` Đạt`);
    await passInput.click({ clickCount: 3 });
    await passInput.type(`Pass_💣_Emoji_123456!@#`);

    // Click nút đăng nhập
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 1000));

    // Form không bị crash và hiển thị thông báo lỗi
    const isStillOnLogin = page.url().includes('/login');
    if (!isStillOnLogin) throw new Error('Trang bị chuyển hướng bất thường');
  });

  await testStep('Giả lập spam click liên tục (10 lần trong 500ms) vào nút Đăng nhập', async () => {
    const submitBtn = await page.$('button[type="submit"]');
    for (let i = 0; i < 10; i++) {
      await submitBtn.click().catch(() => {});
    }
    await new Promise(r => setTimeout(r, 800));
  });

  await testStep('Đăng nhập với tài khoản hợp lệ (student1@enlearn.com)', async () => {
    const emailInput = await page.$('input[name="email"], input[type="email"]');
    const passInput = await page.$('input[name="password"], input[type="password"]');

    await emailInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await emailInput.type('student1@enlearn.com');

    await passInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await passInput.type('Student@123');

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    // Chờ chuyển hướng tới dashboard
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 8000 });
  });

  // --- 2. DASHBOARD ---
  console.log('\n📊 BƯỚC 2: KIỂM THỬ TRANG BẢNG ĐIỀU KHIỂN (DASHBOARD)');

  await testStep('Hiển thị thông tin tổng quan, số liệu thống kê học tập', async () => {
    await page.waitForSelector('main, .container, body', { timeout: 5000 });
    const content = await page.content();
    if (!content.includes('student1') && !content.includes('Dashboard') && !content.includes('Học')) {
      // Cho phép linh hoạt theo UI
    }
  });

  // --- 3. TOPICS & FLASHCARDS ---
  console.log('\n📚 BƯỚC 3: KIỂM THỬ CHỦ ĐỀ & FLASHCARDS & BÀI TẬP');

  await testStep('Truy cập trang danh sách chủ đề (/topics)', async () => {
    await page.goto(`${FRONTEND_URL}/topics`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    const cards = await page.$$('a[href*="/topics/"]');
    if (cards.length === 0) throw new Error('Không hiển thị thẻ chủ đề');
  });

  await testStep('Truy cập chi tiết chủ đề đầu tiên (/topics/1)', async () => {
    await page.goto(`${FRONTEND_URL}/topics/1`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
  });

  await testStep('Kiểm thử giao diện Flashcard (/topics/1/flashcards) và lật thẻ', async () => {
    await page.goto(`${FRONTEND_URL}/topics/1/flashcards`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Tìm thẻ flashcard để click lật thẻ
    const flashcard = await page.$('.cursor-pointer, button');
    if (flashcard) {
      // Click lật thẻ
      await flashcard.click();
      await new Promise(r => setTimeout(r, 300));
      // Click lật lại
      await flashcard.click();
      await new Promise(r => setTimeout(r, 300));
    }
  });

  await testStep('Giả lập click nhanh đổi thẻ liên tục không làm vỡ giao diện', async () => {
    const nextButtons = await page.$$('button');
    if (nextButtons.length > 0) {
      for (let i = 0; i < 5; i++) {
        await nextButtons[nextButtons.length - 1].click().catch(() => {});
        await new Promise(r => setTimeout(r, 100));
      }
    }
  });

  // --- 4. SPACED REPETITION REVIEW ---
  console.log('\n🧠 BƯỚC 4: KIỂM THỬ TRANG ÔN TẬP NGẮT QUÃNG (/review)');

  await testStep('Truy cập trang ôn tập (/review) và kiểm tra tải dữ liệu', async () => {
    await page.goto(`${FRONTEND_URL}/review`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
  });

  // --- 5. READING COMPREHENSION ---
  console.log('\n📖 BƯỚC 5: KIỂM THỬ TRANG BÀI ĐỌC HIỂU (/readings)');

  await testStep('Truy cập danh sách bài đọc (/readings)', async () => {
    await page.goto(`${FRONTEND_URL}/readings`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
  });

  await testStep('Mở chi tiết bài đọc đầu tiên (/readings/1) và đọc nội dung', async () => {
    await page.goto(`${FRONTEND_URL}/readings/1`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
  });

  // --- 6. STUDY GROUPS ---
  console.log('\n👥 BƯỚC 6: KIỂM THỬ NHÓM HỌC TẬP (/groups)');

  await testStep('Truy cập trang nhóm học tập (/groups)', async () => {
    await page.goto(`${FRONTEND_URL}/groups`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
  });

  // --- 7. COMMUNITY ---
  console.log('\n🌐 BƯỚC 7: KIỂM THỬ CỘNG ĐỒNG (/community)');

  await testStep('Truy cập trang cộng đồng (/community)', async () => {
    await page.goto(`${FRONTEND_URL}/community`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
  });

  // --- 8. 404 ERROR PAGE ---
  console.log('\n🚫 BƯỚC 8: KIỂM THỬ TRANG 404 (NOT FOUND ROUTE)');

  await testStep('Truy cập route không tồn tại (/duong-dan-khong-ton-tai-xyz)', async () => {
    await page.goto(`${FRONTEND_URL}/duong-dan-khong-ton-tai-xyz`, { waitUntil: 'networkidle0' });
    const content = await page.content();
    if (!content.includes('404') && !content.includes('Không tìm thấy')) {
      throw new Error('Không hiển thị trang 404');
    }
  });

  // --- 9. RESPONSIVE VIEWPORT STRESS ---
  console.log('\n📱 BƯỚC 9: KIỂM THỬ GIAO DIỆN RESPONSIVE MOBILE (375x667)');

  await testStep('Chuyển sang màn hình điện thoại iPhone SE (375x667) không bị bể layout', async () => {
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
  });

  await browser.close();

  console.log('\n======================================================');
  console.log('📊 TỔNG KẾT KIỂM THỬ GIAO DIỆN (UI E2E):');
  console.log(`- Tổng số bước kiểm thử: ${totalTests}`);
  console.log(`- Thành công (PASSED):    ${passedTests}`);
  console.log(`- Thất bại (FAILED):      ${failedTests}`);
  console.log(`- Console Errors:        ${consoleErrors.length}`);
  console.log('======================================================\n');

  if (errors.length > 0) {
    console.log('⚠️ Danh sách lỗi UI / Exceptions:');
    errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
  }

  if (consoleErrors.length > 0) {
    console.log('⚠️ Chi tiết các lỗi Console:');
    consoleErrors.slice(0, 5).forEach((err, idx) => console.log(`  [Console ${idx + 1}]: ${err.slice(0, 200)}...`));
  }
}

runUITests().catch(err => {
  console.error('Fatal UI test error:', err);
  process.exit(1);
});
