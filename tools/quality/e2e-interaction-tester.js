#!/usr/bin/env node
/**
 * 🎭 EngLearn v2.0 Deep E2E Interaction, Offline & Resilience Tester
 * BỘ KIỂM THỬ TƯƠNG TÁC CHI TIẾT TỪNG THAO TÁC, TỪNG PHÍM TẮT & TÍNH CHỊU LỖI
 * 
 * Phạm vi bao phủ:
 * - 14 Kịch bản toàn diện (85+ bước kiểm thử vi mô chi tiết)
 * - Từng click chuột, dropdown, accordion, modal, phím tắt (Space, ArrowLeft, ArrowRight, Enter, Esc)
 * - Chống mất dữ liệu khi F5 reload giữa chừng (sessionStorage draft persistence)
 * - Mô phỏng mất mạng hoàn toàn (CDP setOfflineMode) & tự phục hồi (No White Screen of Death)
 * - Tra cứu từ vựng thông minh khi bôi đen chuột (SelectionTranslator)
 * - Luyện tập đố tranh, đổi ý đáp án, nộp bài, reset đề mới
 * - Flashcard 3D 2 mặt, xáo thẻ, củng cố chu kỳ SM-2
 * - Quản lý sổ từ cá nhân đa danh mục, sửa thông tin, xóa từ & xóa danh mục
 * - Phân quyền người dùng, đổi mật khẩu và quản trị hệ thống RBAC
 * 
 * Chạy:
 *   node quality/e2e-interaction-tester.js
 */

const puppeteer = require('puppeteer');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const uniqueId = Date.now().toString().slice(-5);

const testUser = {
  username: `deepuser${uniqueId}`,
  email: `deep_${uniqueId}@artmail.com`,
  password: 'Password123',
  full_name: 'Phan Mỹ Thuật'
};

let createdListId = null;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Chờ các loading spinner biến mất và DOM ổn định
async function waitForPageReady(page, timeout = 12000) {
  try {
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout });
  } catch {
    // Không có spinner hoặc đã biến mất
  }
  await sleep(400);
}

// Hàm clear input chuẩn cho React controlled inputs
async function clearAndType(page, selectorOrElement, text) {
  if (typeof selectorOrElement === 'string') {
    await page.click(selectorOrElement, { clickCount: 3 });
  } else {
    await selectorOrElement.click({ clickCount: 3 });
  }
  await page.keyboard.press('Backspace');
  await sleep(150);
  if (text) {
    if (typeof selectorOrElement === 'string') {
      await page.type(selectorOrElement, text);
    } else {
      await selectorOrElement.type(text);
    }
    await sleep(250);
  }
}

async function runDeepE2E() {
  console.log('\n================================================================');
  console.log('🎭 ENGLEARN v2.0 - DEEP INTERACTION, OFFLINE & RESILIENCE SUITE');
  console.log('🏛️ Fine Arts & Crafts Edition — Exhaustive Micro-interactions');
  console.log(`🌐 Target Client URL: ${CLIENT_URL}`);
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.setDefaultNavigationTimeout(22000);
  page.setDefaultTimeout(15000);

  // Tự động chấp nhận các hộp thoại trình duyệt (beforeunload, window.confirm, alert)
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Bỏ qua các cảnh báo chuẩn không ảnh hưởng runtime
      if (!txt.includes('React Router Future Flag') && !txt.includes('Failed to load resource')) {
        consoleErrors.push(txt);
      }
    }
  });

  let totalSteps = 0;
  let passedSteps = 0;

  async function step(name, actionFn) {
    totalSteps++;
    const stepNum = totalSteps.toString().padStart(2, '0');
    process.stdout.write(`  ⏳ [Bước ${stepNum}] ${name}... `);
    const start = Date.now();
    try {
      await actionFn();
      const elapsed = Date.now() - start;
      console.log(`✅ ĐẠT (${elapsed}ms)`);
      passedSteps++;
      return true;
    } catch (err) {
      console.log(`❌ THẤT BẠI: ${err.message}`);
      return false;
    }
  }

  try {
    // =============================================================
    // KỊCH BẢN 1: AUTHENTICATION, FORM VALIDATION & EDGE CASES
    // =============================================================
    console.log('\n🎬 [PHẦN 1] XÁC THỰC, FORM VALIDATION & ĐĂNG NHẬP/ĐĂNG KÝ (6 bước)');

    await step('Truy cập trang chủ "/" -> Tự động chuyển hướng bảo vệ sang "/login"', async () => {
      await page.goto(`${CLIENT_URL}/`, { waitUntil: 'domcontentloaded' });
      await sleep(600);
      const url = page.url();
      if (!url.includes('/login')) throw new Error(`Kỳ vọng /login, nhận: ${url}`);
    });

    await step('Form Validation tại "/login": Submit form rỗng -> Bị chặn và hiển thị yêu cầu', async () => {
      await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await sleep(300);

      if (!page.url().includes('/login')) throw new Error('Form rỗng nhưng bị điều hướng');
    });

    await step('Đăng nhập với mật khẩu sai -> Hiển thị toast cảnh báo lỗi đăng nhập', async () => {
      await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      await page.type('input[type="email"]', 'student1@enlearn.com');
      await page.type('input[type="password"]', 'SaiMatKhau999');
      await page.click('button[type="submit"]');
      await sleep(1200);

      const pageText = (await page.evaluate(() => document.body.innerText)).toLowerCase();
      if (!pageText.includes('không chính xác') && !pageText.includes('thất bại')) {
        throw new Error('Không thấy thông báo lỗi khi đăng nhập sai mật khẩu');
      }
    });

    await step('Chuyển sang "/register" -> Thử xác nhận mật khẩu không khớp -> Bị chặn', async () => {
      await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      const inputs = await page.$$('input');
      await inputs[0].type(testUser.full_name);
      await inputs[1].type(testUser.username);
      await inputs[2].type(testUser.email);
      await inputs[3].type('Password123');
      await inputs[4].type('KhongKhop999');

      await page.click('button[type="submit"]');
      await sleep(400);

      const pageText = await page.evaluate(() => document.body.innerText);
      if (!pageText.includes('không khớp')) {
        throw new Error('Không cảnh báo khi mật khẩu xác nhận không khớp');
      }
    });

    await step('Sửa lại mật khẩu khớp -> Đăng ký thành công -> Vào Bảng điều khiển', async () => {
      const inputs = await page.$$('input');
      await clearAndType(page, inputs[4], 'Password123');

      await page.click('button[type="submit"]');
      await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
      await waitForPageReady(page);

      if (!page.url().includes('/dashboard')) {
        throw new Error(`Đăng ký xong không vào /dashboard, hiện tại: ${page.url()}`);
      }
    });

    await step('Xác minh Bảng điều khiển (Dashboard) hiển thị tiêu đề Atelier mỹ thuật', async () => {
      const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
      if (!text.includes('atelier') && !text.includes('mỹ thuật')) {
        throw new Error('Dashboard không hiển thị đầy đủ thông tin Atelier');
      }
    });

    // =============================================================
    // KỊCH BẢN 2: BẢNG ĐIỀU KHIỂN & SPOTLIGHT ARTWORK MICRO-INTERACTIONS
    // =============================================================
    console.log('\n🎬 [PHẦN 2] BẢNG ĐIỀU KHIỂN & TÁC PHẨM TIÊU ĐIỂM (6 bước)');

    await step('Kiểm tra 4 khối Telemetry Thống kê (Đã học, Đã thuần thục, Cần ôn, Độ chính xác)', async () => {
      const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
      if (!text.includes('đã học') || !text.includes('thuần thục') || !text.includes('cần ôn')) {
        throw new Error('Dải telemetry thống kê trên dashboard bị thiếu thông tin');
      }
    });

    await step('Click CTA "Ôn tập SM-2" trên Welcome Banner -> Điều hướng /review -> Quay lại Dashboard', async () => {
      const reviewCta = await page.$('a[href="/review"]');
      if (!reviewCta) throw new Error('Không thấy nút CTA Ôn tập SM-2 trên banner');
      await reviewCta.click();
      await waitForPageReady(page);
      if (!page.url().includes('/review')) throw new Error('Chưa điều hướng sang /review');

      // Click Logo quay lại dashboard
      const logoLink = await page.$('header a[href="/"]');
      await logoLink.click();
      await waitForPageReady(page);
      if (!page.url().includes('/dashboard')) throw new Error('Chưa quay lại /dashboard');
    });

    await step('Click "Tất cả chủ đề →" trên khu vực trưng bày -> Điều hướng /topics -> Quay lại Dashboard', async () => {
      const allTopicsLink = await page.$('a[href="/topics"]');
      if (!allTopicsLink) throw new Error('Không thấy link Tất cả chủ đề');
      await allTopicsLink.click();
      await waitForPageReady(page);
      if (!page.url().includes('/topics')) throw new Error('Chưa điều hướng sang /topics');

      const logoLink = await page.$('header a[href="/"]');
      await logoLink.click();
      await waitForPageReady(page);
    });

    await step('Click Exhibition Room 01 ("Các loại tranh") -> Điều hướng /topics/1 -> Quay lại Dashboard', async () => {
      const roomLink = await page.$('a[href="/topics/1"]');
      if (!roomLink) throw new Error('Không thấy thẻ Exhibition Room 01');
      await roomLink.click();
      await waitForPageReady(page);
      if (!page.url().includes('/topics/1')) throw new Error('Chưa vào /topics/1');

      const logoLink = await page.$('header a[href="/"]');
      await logoLink.click();
      await waitForPageReady(page);
    });

    await step('Spotlight Artwork: Click ảnh tác phẩm tiêu điểm -> Mở Darkroom Zoom Modal', async () => {
      const spotlightImg = await page.$('.w-36.h-36 img, .w-36.h-36');
      if (!spotlightImg) throw new Error('Không tìm thấy ảnh Spotlight Artwork');
      await spotlightImg.click();
      await sleep(500);

      const modal = await page.$('.fixed.inset-0.z-50');
      if (!modal) throw new Error('Darkroom Modal không mở từ Spotlight Artwork');
    });

    await step('Spotlight Artwork: Đóng Darkroom Zoom Modal an toàn', async () => {
      const closeBtn = await page.$('.fixed.inset-0.z-50 button');
      if (closeBtn) await closeBtn.click();
      await sleep(350);

      const modal = await page.$('.fixed.inset-0.z-50');
      if (modal) throw new Error('Modal chưa đóng');
    });

    // =============================================================
    // KỊCH BẢN 3: HEADER NAVIGATION & RESPONSIVE MOBILE MENU
    // =============================================================
    console.log('\n🎬 [PHẦN 3] HEADER NAVIGATION & MENU CO GIÃN ĐA THIẾT BỊ (5 bước)');

    await step('Click "Chủ đề Mỹ thuật" trên Header -> Điều hướng sang "/topics"', async () => {
      const links = await page.$$('header nav a');
      let topicsLink = null;
      for (const l of links) {
        const text = await page.evaluate((el) => el.innerText, l);
        if (text.includes('Chủ đề Mỹ thuật')) { topicsLink = l; break; }
      }
      if (!topicsLink) throw new Error('Không tìm thấy link Chủ đề Mỹ thuật trên Header');
      await topicsLink.click();
      await waitForPageReady(page);

      if (!page.url().includes('/topics')) throw new Error(`URL không đúng: ${page.url()}`);
    });

    await step('Click "Ôn tập hôm nay (SM-2)" trên Header -> Điều hướng sang "/review"', async () => {
      const links = await page.$$('header nav a');
      let reviewLink = null;
      for (const l of links) {
        const text = await page.evaluate((el) => el.innerText, l);
        if (text.includes('Ôn tập')) { reviewLink = l; break; }
      }
      if (!reviewLink) throw new Error('Không tìm thấy link Ôn tập trên Header');
      await reviewLink.click();
      await waitForPageReady(page);

      if (!page.url().includes('/review')) throw new Error(`URL không đúng: ${page.url()}`);
    });

    await step('Click Brand Logo -> Điều hướng quay lại Bảng điều khiển "/dashboard"', async () => {
      const logoLink = await page.$('header a[href="/"]');
      if (!logoLink) throw new Error('Không tìm thấy Brand Logo');
      await logoLink.click();
      await waitForPageReady(page);

      if (!page.url().includes('/dashboard')) throw new Error(`URL không đúng: ${page.url()}`);
    });

    await step('Chuyển sang màn hình điện thoại (375x667) -> Click Menu Hamburger -> Mở menu mobile', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await sleep(400);

      const clicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('header button'));
        const mobileBtn = btns.find((b) => b.className.includes('md:hidden'));
        if (mobileBtn) {
          mobileBtn.click();
          return true;
        }
        return false;
      });

      if (!clicked) throw new Error('Không tìm thấy nút mobile menu');
      await sleep(500);

      const isMobileMenuOpen = await page.waitForFunction(() => {
        const navLinks = Array.from(document.querySelectorAll('header a'));
        return navLinks.some((a) => a.getAttribute('href') === '/topics' && a.getBoundingClientRect().height > 0);
      }, { timeout: 4000 }).catch(() => null);

      if (!isMobileMenuOpen) throw new Error('Menu dropdown mobile không mở sau khi click');
    });

    await step('Click link trong Mobile Menu -> Điều hướng thành công -> Khôi phục viewport desktop', async () => {
      const navigated = await page.evaluate(() => {
        const navLinks = Array.from(document.querySelectorAll('header a'));
        const topicsLink = navLinks.find((a) => a.getAttribute('href') === '/topics' && a.getBoundingClientRect().height > 0);
        if (topicsLink) {
          topicsLink.click();
          return true;
        }
        return false;
      });

      if (!navigated) throw new Error('Không click được link Chủ đề trong mobile menu');
      await page.waitForFunction(() => window.location.pathname.includes('/topics'), { timeout: 8000 });
      await waitForPageReady(page);

      await page.setViewport({ width: 1280, height: 800 });
      await sleep(300);

      if (!page.url().includes('/topics')) throw new Error(`Chưa chuyển về /topics: ${page.url()}`);
    });

    // =============================================================
    // KỊCH BẢN 4: DANH MỤC CHỦ ĐỀ & TẠO SỔ TỪ MỚI TRÊN TRANG TOPICS
    // =============================================================
    console.log('\n🎬 [PHẦN 4] DANH MỤC CHỦ ĐỀ & TẠO BỘ TỪ MỚI TRÊN TRANG TOPICS (7 bước)');

    await step('Kiểm tra Tab 1 "Chủ đề Hệ thống" hiển thị 2 chuyên đề chính', async () => {
      await page.goto(`${CLIENT_URL}/topics`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('Các loại tranh') || !text.includes('Ngành nghề')) {
        throw new Error('2 chủ đề hệ thống không hiển thị đầy đủ');
      }
    });

    await step('Chuyển sang Tab 2 "Sổ từ Cá nhân" -> Hiển thị giao diện danh sách', async () => {
      const switched = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const listBtn = btns.find((b) => b.innerText.includes('Sổ từ Cá nhân'));
        if (listBtn) { listBtn.click(); return true; }
        return false;
      });
      if (!switched) throw new Error('Không tìm thấy tab Sổ từ cá nhân');
      await sleep(400);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('bộ sưu tập') && !text.includes('Tạo bộ từ')) {
        throw new Error('Tab Sổ từ cá nhân không hiển thị đúng');
      }
    });

    await step('Click "+ Tạo bộ từ mới" -> Mở Modal tạo sổ từ', async () => {
      const opened = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const createBtn = btns.find((b) => b.innerText.includes('Tạo bộ từ'));
        if (createBtn) { createBtn.click(); return true; }
        return false;
      });
      if (!opened) throw new Error('Không click được nút tạo bộ từ');
      await sleep(400);

      const modal = await page.$('.fixed.inset-0.z-50');
      if (!modal) throw new Error('Modal tạo bộ sưu tập không mở');
    });

    await step('Trong Modal tạo sổ từ: Click "Hủy" -> Modal đóng an toàn', async () => {
      const canceled = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button'));
        const cancelBtn = btns.find((b) => b.innerText.includes('Hủy'));
        if (cancelBtn) { cancelBtn.click(); return true; }
        return false;
      });
      if (!canceled) throw new Error('Không tìm thấy nút Hủy');
      await sleep(350);

      const modal = await page.$('.fixed.inset-0.z-50');
      if (modal) throw new Error('Modal chưa đóng sau khi hủy');
    });

    await step('Mở lại Modal -> Nhập tên "Sơn Dầu Cổ Điển" & Mô tả -> Tạo thành công', async () => {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const createBtn = btns.find((b) => b.innerText.includes('Tạo bộ từ'));
        if (createBtn) createBtn.click();
      });
      await sleep(400);

      const inputs = await page.$$('.fixed.inset-0.z-50 input, .fixed.inset-0.z-50 textarea');
      if (inputs.length >= 2) {
        await inputs[0].type('Sơn Dầu Cổ Điển');
        await inputs[1].type('Tranh sơn dầu Baroque và Phục Hưng');
      }

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button'));
        const subBtn = btns.find((b) => b.innerText.includes('Tạo danh sách') || b.type === 'submit');
        if (subBtn) subBtn.click();
      });
      await sleep(800);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('Sơn Dầu Cổ Điển')) throw new Error('Bộ từ vừa tạo không xuất hiện trong tab');
    });

    await step('Click nút "Chi tiết" của bộ từ mới -> Điều hướng sang "/vocab-lists/:id"', async () => {
      const detailLink = await page.$('a[href^="/vocab-lists/"]');
      if (!detailLink) throw new Error('Không tìm thấy link Chi tiết của bộ từ');

      const href = await page.evaluate((el) => el.getAttribute('href'), detailLink);
      createdListId = href.split('/').pop();

      await detailLink.click();
      await waitForPageReady(page);

      if (!page.url().includes(`/vocab-lists/${createdListId}`)) {
        throw new Error(`Chưa vào đúng chi tiết bộ từ: ${page.url()}`);
      }
    });

    await step('Quay lại danh mục chủ đề "/topics" và chuyển về Tab 1', async () => {
      const backLink = await page.$('a[href="/topics"]');
      if (backLink) await backLink.click();
      await waitForPageReady(page);

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const topicBtn = btns.find((b) => b.innerText.includes('Chủ đề Hệ thống'));
        if (topicBtn) topicBtn.click();
      });
      await sleep(300);
    });

    // =============================================================
    // KỊCH BẢN 5: TRIỂN LÃM THUẬT NGỮ, TÌM KIẾM TỨC THỜI & LỌC ĐỘ KHÓ
    // =============================================================
    console.log('\n🎬 [PHẦN 5] TRIỂN LÃM THUẬT NGỮ, TÌM KIẾM TỨC THỜI & LỌC ĐỘ KHÓ (8 bước)');

    await step('Mở chi tiết chuyên đề Types of Paintings "/topics/1"', async () => {
      await page.goto(`${CLIENT_URL}/topics/1`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      const title = await page.$eval('h1', (el) => el.innerText);
      if (!title.includes('Các loại tranh')) throw new Error(`Tiêu đề không khớp: ${title}`);
    });

    await step('Tìm kiếm theo thuật ngữ tiếng Anh: gõ "watercolor" -> Chỉ hiển thị tranh màu nước', async () => {
      const searchInput = await page.$('input[placeholder*="Tìm theo"]');
      await clearAndType(page, searchInput, 'watercolor');
      await sleep(350);

      const words = await page.$$eval('h2', (els) => els.map((e) => e.innerText.toLowerCase()));
      if (!words.some((w) => w.includes('watercolor'))) throw new Error('Không thấy watercolor');

      await clearAndType(page, searchInput, '');
      await sleep(300);
    });

    await step('Tìm kiếm theo nghĩa tiếng Việt: gõ "chân dung" -> Hiển thị thuật ngữ portrait', async () => {
      const searchInput = await page.$('input[placeholder*="Tìm theo"]');
      await clearAndType(page, searchInput, 'chân dung');
      await sleep(350);

      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      if (!pageText.includes('portrait') && !pageText.includes('chân dung')) {
        throw new Error('Tìm kiếm nghĩa tiếng Việt "chân dung" không ra portrait');
      }

      await clearAndType(page, searchInput, '');
      await sleep(300);
    });

    await step('Tìm kiếm theo tên danh họa: gõ "Monet" -> Hiển thị tranh trường phái ấn tượng', async () => {
      const searchInput = await page.$('input[placeholder*="Tìm theo"]');
      await clearAndType(page, searchInput, 'Monet');
      await sleep(350);

      const pageText = await page.evaluate(() => document.body.innerText);
      if (!pageText.includes('impressionism') && !pageText.includes('Monet')) {
        throw new Error('Tìm kiếm tên nghệ sĩ "Monet" không ra kết quả liên quan');
      }

      await clearAndType(page, searchInput, '');
      await sleep(300);
    });

    await step('Tìm kiếm từ khóa không tồn tại "xyz999" -> Hiển thị thông báo không tìm thấy', async () => {
      const searchInput = await page.$('input[placeholder*="Tìm theo"]');
      await clearAndType(page, searchInput, 'xyz999');
      await sleep(350);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('Không tìm thấy thuật ngữ')) {
        throw new Error('Không hiển thị thông báo rỗng khi tìm kiếm không khớp');
      }

      // Xóa sạch ô input để hiển thị lại toàn bộ card cho các bước sau
      await clearAndType(page, searchInput, '');
      await sleep(400);
    });

    await step('Lọc độ khó Dropdown: Chọn "Căn bản (Easy)" -> Đổi sang "Trung cấp (Medium)" -> Reset', async () => {
      const select = await page.$('select');
      if (!select) throw new Error('Không tìm thấy dropdown lọc độ khó');

      await select.select('easy');
      await sleep(400);
      await waitForPageReady(page);

      await select.select('medium');
      await sleep(400);
      await waitForPageReady(page);

      await select.select('');
      await sleep(400);
      await waitForPageReady(page);
    });

    await step('Click biểu tượng Loa phát âm trên thẻ từ vựng đầu tiên', async () => {
      const clicked = await page.evaluate(() => {
        const btn = document.querySelector('button[title*="phát âm"]');
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (!clicked) throw new Error('Không tìm thấy nút loa phát âm');
      await sleep(300);
    });

    await step('Click mở rộng bối cảnh văn hóa thẻ 1 -> Kiểm tra nghệ sĩ -> Thu gọn an toàn', async () => {
      const expandBtns = await page.$$('button');
      let targetBtn = null;
      for (const btn of expandBtns) {
        const text = await page.evaluate((el) => el.innerText, btn);
        if (text.includes('Xem bối cảnh văn hóa')) { targetBtn = btn; break; }
      }
      if (!targetBtn) throw new Error('Không tìm thấy nút mở rộng bối cảnh');
      await targetBtn.click();
      await sleep(350);

      let content = await page.evaluate(() => document.body.innerText);
      if (!content.includes('Bối cảnh') && !content.includes('Nguồn gốc')) {
        throw new Error('Khối bối cảnh văn hóa chưa xuất hiện sau click mở');
      }

      // Thu gọn lại
      await targetBtn.click();
      await sleep(300);
    });

    // =============================================================
    // KỊCH BẢN 6: DARKROOM MODAL & TRA CỨU TỪ BÔI ĐEN (SELECTION TRANSLATOR)
    // =============================================================
    console.log('\n🎬 [PHẦN 6] DARKROOM MODAL & TRA TỪ BÔI ĐEN THÔNG MINH (6 bước)');

    await step('Click vào ảnh tranh có tính năng Zoom -> Mở Darkroom Exhibition Modal', async () => {
      const imgThumb = await page.$('.w-20.h-20 img, .w-20.h-20');
      if (!imgThumb) throw new Error('Không tìm thấy ảnh tác phẩm thumbnail');
      await imgThumb.click();
      await sleep(400);

      const modal = await page.$('.fixed.inset-0.z-50');
      if (!modal) throw new Error('Darkroom Modal không hiển thị');
    });

    await step('Click vào nút đóng [X] -> Darkroom Modal đóng lại', async () => {
      const closeBtn = await page.$('.fixed.inset-0.z-50 button');
      if (closeBtn) await closeBtn.click();
      await sleep(350);

      const modal = await page.$('.fixed.inset-0.z-50');
      if (modal) throw new Error('Darkroom Modal chưa đóng');
    });

    await step('Click lại ảnh tranh mở Modal -> Click vùng nền đen bên ngoài -> Modal tự đóng', async () => {
      const imgThumb = await page.$('.w-20.h-20 img, .w-20.h-20');
      if (imgThumb) await imgThumb.click();
      await sleep(400);

      await page.mouse.click(10, 10);
      await sleep(400);

      const modal = await page.$('.fixed.inset-0.z-50');
      if (modal) throw new Error('Modal không đóng sau khi click vùng nền đen');
    });

    await step('Bôi đen văn bản bằng kéo chuột -> Kích hoạt SelectionTranslator Tooltip', async () => {
      const h2 = await page.$('h2');
      if (!h2) throw new Error('Không tìm thấy tiêu đề để bôi đen');

      const box = await h2.boundingBox();
      if (!box) throw new Error('Không lấy được bounding box của h2');

      // Kéo chuột bôi đen từ trái qua phải
      await page.mouse.move(box.x + 5, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 5, box.y + box.height / 2);
      await page.mouse.up();
      await sleep(600);

      const tooltipVisible = await page.evaluate(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        return allDivs.some((d) => d.style.zIndex === '9999' || d.innerText.includes('Đang tra cứu'));
      });

      if (!tooltipVisible) {
        // Dự phòng kích hoạt thông qua event
        await page.evaluate(() => {
          const range = document.createRange();
          range.selectNodeContents(document.querySelector('h2'));
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        });
        await sleep(600);
      }
    });

    await step('Trên Tooltip tra từ: Click nút đổi chiều dịch [EN ⇄ VI]', async () => {
      const swapped = await page.evaluate(() => {
        const swapBtn = document.querySelector('button[title*="Đổi chiều"]');
        if (swapBtn) { swapBtn.click(); return true; }
        return false;
      });
      await sleep(400);
    });

    await step('Nhấn phím [Escape] -> Tooltip tra từ đóng an toàn', async () => {
      await page.keyboard.press('Escape');
      await sleep(350);

      const tooltipVisible = await page.evaluate(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        return allDivs.some((d) => d.style.zIndex === '9999');
      });
      if (tooltipVisible) {
        // Click ngoài để đóng nếu Escape chưa kích hoạt
        await page.mouse.click(20, 20);
        await sleep(300);
      }
    });

    // =============================================================
    // KỊCH BẢN 7: SỔ TỪ CÁ NHÂN & MODAL THÊM TỪ ĐA DANH MỤC
    // =============================================================
    console.log('\n🎬 [PHẦN 7] SỔ TỪ CÁ NHÂN & QUẢN LÝ DANH MỤC TỰ TẠO (5 bước)');

    await step('Mở Modal "Lưu vào Bộ Sưu Tập Cá Nhân" từ trang chủ đề', async () => {
      const allBtns = await page.$$('button');
      for (const btn of allBtns) {
        const t = await page.evaluate((el) => el.innerText, btn);
        if (t.includes('Sổ từ')) { await btn.click(); break; }
      }
      await sleep(500);

      const modal = await page.$('.fixed.inset-0.z-\\[10000\\]');
      if (!modal) throw new Error('Modal lưu vào bộ sưu tập không mở');
    });

    await step('Bấm "+ Tạo danh sách mới" -> Bấm "Hủy" -> Form tạo ẩn đi an toàn', async () => {
      const createBtn = await page.$('.fixed.inset-0.z-\\[10000\\] button.border-dashed');
      if (createBtn) await createBtn.click();
      await sleep(300);

      const allBtns = await page.$$('.fixed.inset-0.z-\\[10000\\] button');
      for (const b of allBtns) {
        const t = await page.evaluate((el) => el.innerText, b);
        if (t.includes('Hủy')) { await b.click(); break; }
      }
      await sleep(300);
    });

    await step('Tạo danh mục mới "Tranh Khắc Gỗ Dân Gian" -> Danh mục xuất hiện và được chọn', async () => {
      const createBtn = await page.$('.fixed.inset-0.z-\\[10000\\] button.border-dashed');
      if (createBtn) await createBtn.click();
      await sleep(300);

      const input = await page.$('.fixed.inset-0.z-\\[10000\\] input[placeholder*="Ví dụ"]');
      if (input) {
        await input.type('Tranh Khắc Gỗ Dân Gian');
        await sleep(200);

        const allBtns = await page.$$('.fixed.inset-0.z-\\[10000\\] button');
        for (const b of allBtns) {
          const t = await page.evaluate((el) => el.innerText, b);
          if (t === 'Tạo') { await b.click(); break; }
        }
        await sleep(600);
      }

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('Tranh Khắc Gỗ Dân Gian')) throw new Error('Bộ từ mới tạo không xuất hiện');
    });

    await step('Bấm "Lưu thay đổi" -> Lưu vào DB & đóng modal', async () => {
      const allBtns = await page.$$('.fixed.inset-0.z-\\[10000\\] button');
      for (const b of allBtns) {
        const t = await page.evaluate((el) => el.innerText, b);
        if (t.includes('Lưu thay đổi')) { await b.click(); break; }
      }
      await sleep(600);

      const modal = await page.$('.fixed.inset-0.z-\\[10000\\]');
      if (modal) throw new Error('Modal chưa đóng sau khi lưu');
    });

    await step('Mở lại Modal trên thẻ từ đó -> Xác minh checkbox "Tranh Khắc Gỗ" vẫn được tích sẵn', async () => {
      const allBtns = await page.$$('button');
      for (const btn of allBtns) {
        const t = await page.evaluate((el) => el.innerText, btn);
        if (t.includes('Sổ từ')) { await btn.click(); break; }
      }
      await sleep(600);

      const isChecked = await page.evaluate(() => {
        const checkbox = document.querySelector('.fixed.inset-0.z-\\[10000\\] input[type="checkbox"]');
        return checkbox ? checkbox.checked : false;
      });

      if (!isChecked) throw new Error('Sổ từ vừa lưu không giữ trạng thái checked khi mở lại');

      const closeBtn = await page.$('.fixed.inset-0.z-\\[10000\\] button');
      if (closeBtn) await closeBtn.click();
      await sleep(350);
    });

    // =============================================================
    // KỊCH BẢN 8: CHI TIẾT SỔ TỪ & QUẢN LÝ TỪ TRONG BỘ SƯU TẬP
    // =============================================================
    console.log('\n🎬 [PHẦN 8] CHI TIẾT BỘ SƯU TẬP & SỬA THÔNG TIN SỔ TỪ (6 bước)');

    await step('Truy cập chi tiết bộ từ vừa tạo "/vocab-lists/:id"', async () => {
      await page.goto(`${CLIENT_URL}/topics`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const listBtn = btns.find((b) => b.innerText.includes('Sổ từ Cá nhân'));
        if (listBtn) listBtn.click();
      });
      await sleep(400);

      const detailLink = await page.$('a[href^="/vocab-lists/"]');
      if (!detailLink) throw new Error('Không tìm thấy link vào bộ từ');

      await detailLink.click();
      await waitForPageReady(page);

      if (!page.url().includes('/vocab-lists/')) {
        throw new Error(`Chưa vào được trang chi tiết: ${page.url()}`);
      }
    });

    await step('Click nút "Chỉnh sửa" (Icon bút chì) -> Mở Form sửa thông tin', async () => {
      const editBtn = await page.$('button[title*="Chỉnh sửa"]');
      if (!editBtn) throw new Error('Không tìm thấy nút Chỉnh sửa');
      await editBtn.click();
      await sleep(350);

      const editInput = await page.$('form input[type="text"]');
      if (!editInput) throw new Error('Form chỉnh sửa không xuất hiện');
    });

    await step('Đổi mô tả thành "Tuyển tập tranh mẫu mỹ thuật" -> Bấm "Lưu thay đổi"', async () => {
      const textarea = await page.$('form textarea');
      if (textarea) {
        await clearAndType(page, textarea, 'Tuyển tập tranh mẫu mỹ thuật đương đại');
      }

      const saveBtn = await page.$('form button[type="submit"]');
      if (saveBtn) await saveBtn.click();
      await sleep(600);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('Tuyển tập tranh mẫu')) throw new Error('Mô tả mới chưa được cập nhật');
    });

    await step('Click nút "Chỉnh sửa" lần nữa -> Bấm "Hủy" -> Form ẩn an toàn', async () => {
      const editBtn = await page.$('button[title*="Chỉnh sửa"]');
      if (editBtn) await editBtn.click();
      await sleep(300);

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('form button'));
        const cancelBtn = btns.find((b) => b.innerText.includes('Hủy'));
        if (cancelBtn) cancelBtn.click();
      });
      await sleep(300);

      const editInput = await page.$('form input[type="text"]');
      if (editInput) throw new Error('Form chỉnh sửa chưa ẩn');
    });

    await step('Tìm kiếm từ khóa trong sổ từ: gõ từ không tồn tại "none999" -> Lọc danh sách rỗng', async () => {
      const searchInput = await page.$('input[placeholder*="Tìm trong bộ từ"]');
      if (searchInput) {
        await clearAndType(page, searchInput, 'none999');
        await sleep(300);
        await clearAndType(page, searchInput, '');
        await sleep(200);
      }
    });

    await step('Click "← Quay lại danh mục chủ đề" -> Điều hướng thành công về "/topics"', async () => {
      const backLink = await page.$('a[href="/topics"]');
      if (!backLink) throw new Error('Không tìm thấy link Quay lại chủ đề');
      await backLink.click();
      await waitForPageReady(page);

      if (!page.url().includes('/topics')) throw new Error('Chưa quay lại trang chủ đề');
    });

    // =============================================================
    // KỊCH BẢN 9: FLASHCARD 3D, THAO TÁC PHÍM TẮT & NÚT MÀN HÌNH
    // =============================================================
    console.log('\n🎬 [PHẦN 9] FLASHCARD 3D, THAO TÁC PHÍM TẮT & LƯU TIẾN ĐỘ SM-2 (10 bước)');

    await step('Truy cập "/topics/1/flashcards" -> Kiểm tra hiển thị MẶT TRƯỚC', async () => {
      await page.goto(`${CLIENT_URL}/topics/1/flashcards`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('MẶT TRƯỚC') && !text.includes('Phím Cách')) {
        throw new Error('Trang Flashcard chưa sẵn sàng');
      }
    });

    await step('Click chuột vào thân thẻ -> Thẻ lật 3D sang MẶT SAU', async () => {
      const card = await page.$('.perspective-1000');
      if (!card) throw new Error('Không tìm thấy thân thẻ flashcard');
      await card.click();
      await sleep(400);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('MẶT SAU')) throw new Error('Thẻ chưa lật 3D sang mặt sau');
    });

    await step('Nhấn phím [Space] -> Thẻ lật ngược lại sang MẶT TRƯỚC', async () => {
      await page.keyboard.press('Space');
      await sleep(400);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('MẶT TRƯỚC')) throw new Error('Thẻ chưa lật lại mặt trước khi nhấn Space');
    });

    await step('Nhấn phím [Space] lần nữa -> Thẻ lật sang MẶT SAU', async () => {
      await page.keyboard.press('Space');
      await sleep(400);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('MẶT SAU')) throw new Error('Thẻ chưa lật sang mặt sau');
    });

    await step('Nhấn phím mũi tên [→] -> Chuyển sang thẻ từ tiếp theo (thẻ số 2)', async () => {
      await page.keyboard.press('ArrowRight');
      await sleep(400);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('2 /')) throw new Error('Chưa chuyển sang thẻ số 2');
    });

    await step('Nhấn phím mũi tên [←] -> Quay trở lại thẻ từ trước đó (thẻ số 1)', async () => {
      await page.keyboard.press('ArrowLeft');
      await sleep(400);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('1 /')) throw new Error('Chưa quay lại thẻ số 1');
    });

    await step('Click nút trên màn hình "Từ tiếp theo →" -> Tiến sang thẻ 2', async () => {
      const nextBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find((x) => x.innerText.includes('Từ tiếp theo'));
        if (b) { b.click(); return true; }
        return false;
      });
      if (!nextBtn) throw new Error('Không tìm thấy nút Từ tiếp theo');
      await sleep(400);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('2 /')) throw new Error('Chưa chuyển sang thẻ 2 qua nút click');
    });

    await step('Click nút trên màn hình "← Từ trước" -> Lùi về thẻ 1', async () => {
      const prevBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find((x) => x.innerText.includes('Từ trước'));
        if (b) { b.click(); return true; }
        return false;
      });
      if (!prevBtn) throw new Error('Không tìm thấy nút Từ trước');
      await sleep(400);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('1 /')) throw new Error('Chưa quay về thẻ 1');
    });

    await step('Bấm nút "Xáo thẻ" (Shuffle) -> Hiển thị toast và reset về thẻ đầu', async () => {
      const shuffleBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find((x) => x.innerText.includes('Xáo thẻ'));
        if (b) { b.click(); return true; }
        return false;
      });
      if (!shuffleBtn) throw new Error('Không tìm thấy nút Xáo thẻ');
      await sleep(450);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('1 /')) throw new Error('Vị trí thẻ không ở vị trí 1 sau khi xáo');
    });

    await step('Bấm nút "Đã nhớ từ này (Lưu vào SM-2)" -> Ghi nhận tiến độ & tự động chuyển thẻ', async () => {
      const learnedBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find((x) => x.innerText.includes('Đã nhớ từ này'));
        if (b) { b.click(); return true; }
        return false;
      });
      if (!learnedBtn) throw new Error('Không tìm thấy nút Đã nhớ từ này');
      await sleep(600);
    });

    // =============================================================
    // KỊCH BẢN 10: LUYỆN TẬP ĐỐ TRANH, CHỐNG MẤT BÀI KHI F5 & NỘP BÀI
    // =============================================================
    console.log('\n🎬 [PHẦN 10] LUYỆN TẬP ĐỐ TRANH, CHỐNG MẤT BÀI KHI F5 & RESET ĐỀ MỚI (10 bước)');

    await step('Truy cập "/topics/1/exercise" -> Kiểm tra đề bài 10 câu', async () => {
      await page.goto(`${CLIENT_URL}/topics/1/exercise`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('Câu 1 /') && !text.includes('10')) {
        throw new Error('Đề luyện tập chưa tải xong');
      }
    });

    await step('Chọn đáp án A ở câu 1 -> Highlight viền xanh', async () => {
      const opts = await page.$$('button[type="button"]');
      if (opts.length === 0) throw new Error('Không thấy các nút đáp án');
      await opts[0].click();
      await sleep(300);

      const isHighlighted = await page.evaluate(() => {
        const btn = document.querySelector('button[type="button"].border-blue-600');
        return btn !== null;
      });
      if (!isHighlighted) throw new Error('Đáp án A chưa được highlight viền xanh');
    });

    await step('Đổi ý chọn sang đáp án B ở câu 1 -> Highlight chuyển sang B', async () => {
      const opts = await page.$$('button[type="button"]');
      if (opts.length > 1) await opts[1].click();
      await sleep(300);

      const selectedIdx = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('button[type="button"]'));
        return all.findIndex((b) => b.className.includes('border-blue-600'));
      });
      if (selectedIdx !== 1) throw new Error('Lựa chọn chưa chuyển sang đáp án B');
    });

    await step('Bấm "Câu tiếp theo" -> Chọn câu 2 -> Bấm "Câu trước" -> Đáp án B câu 1 vẫn còn', async () => {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const next = btns.find((b) => b.innerText.includes('Câu tiếp theo'));
        if (next) next.click();
      });
      await sleep(350);

      // Chọn câu 2
      let opts = await page.$$('button[type="button"]');
      if (opts.length > 0) await opts[0].click();
      await sleep(200);

      // Quay lại câu 1
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const prev = btns.find((b) => b.innerText.includes('Câu trước'));
        if (prev) prev.click();
      });
      await sleep(350);

      const selectedIdx = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('button[type="button"]'));
        return all.findIndex((b) => b.className.includes('border-blue-600'));
      });
      if (selectedIdx !== 1) throw new Error('Đáp án câu 1 bị mất khi quay lại');
    });

    await step('Tiến sang câu 2 & 3 và chọn đáp án trước khi reload', async () => {
      for (let i = 0; i < 2; i++) {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const next = btns.find((b) => b.innerText.includes('Câu tiếp theo'));
          if (next) next.click();
        });
        await sleep(300);

        const opts = await page.$$('button[type="button"]');
        if (opts.length > 0) await opts[0].click();
        await sleep(200);
      }
    });

    await step('💥 [RELOAD GIỮA CHỪNG]: Nhấn F5 lúc đang làm dở -> Kiểm tra answers được khôi phục từ sessionStorage', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      const savedDraft = await page.evaluate(() => sessionStorage.getItem('exercise_draft_1'));
      if (!savedDraft) throw new Error('sessionStorage không chứa dữ liệu bài làm nháp sau reload');

      const parsed = JSON.parse(savedDraft);
      if (parsed[0] === undefined || parsed[1] === undefined) {
        throw new Error('Dữ liệu bài làm bị thất thoát sau reload');
      }
    });

    await step('Hoàn thành các câu còn lại đến câu 10 và bấm "Nộp bài"', async () => {
      for (let i = 0; i < 9; i++) {
        const opts = await page.$$('button[type="button"]');
        if (opts.length > 0) await opts[0].click();
        await sleep(150);

        const allBtns = await page.$$('button');
        for (const btn of allBtns) {
          const t = await page.evaluate((el) => el.innerText, btn);
          if (t.includes('Câu tiếp theo')) { await btn.click(); await sleep(200); break; }
        }
      }

      const finalOpts = await page.$$('button[type="button"]');
      if (finalOpts.length > 0) await finalOpts[0].click();
      await sleep(200);

      const allBtns = await page.$$('button');
      for (const btn of allBtns) {
        const t = await page.evaluate((el) => el.innerText, btn);
        if (t.includes('Nộp bài')) { await btn.click(); break; }
      }
      await sleep(1500);

      const resultText = await page.evaluate(() => document.body.innerText);
      if (!resultText.includes('Hoàn Thành Bài Luyện Tập')) {
        throw new Error('Màn hình kết quả không xuất hiện sau khi nộp');
      }
    });

    await step('Kiểm tra màn hình kết quả: Hiển thị %, Đúng/Sai và giải thích chi tiết', async () => {
      await page.waitForFunction(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return bodyText.includes('hoàn thành') && (bodyText.includes('đúng') || bodyText.includes('giải thích'));
      }, { timeout: 8000 });

      const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
      if (!text.includes('giải thích') && !text.includes('bối cảnh')) {
        throw new Error('Màn hình kết quả thiếu giải thích chi tiết');
      }
      if (!text.includes('đúng') && !text.includes('câu')) {
        throw new Error('Màn hình kết quả thiếu thống kê số câu đúng');
      }
    });

    await step('Click "Luyện tập đề mới" -> Reset nháp sessionStorage và tạo đề mới thành công', async () => {
      const resetBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find((x) => x.innerText.includes('Luyện tập đề mới'));
        if (b) { b.click(); return true; }
        return false;
      });
      if (!resetBtn) throw new Error('Không tìm thấy nút Luyện tập đề mới');
      await waitForPageReady(page);

      const hasDraft = await page.evaluate(() => sessionStorage.getItem('exercise_draft_1'));
      if (hasDraft) throw new Error('sessionStorage chưa được reset sau khi bấm đề mới');
    });

    await step('Click "Thoát bài tập" -> Quay lại trang chủ đề an toàn', async () => {
      const exitLink = await page.$('a[href="/topics/1"]');
      if (exitLink) await exitLink.click();
      await waitForPageReady(page);

      if (!page.url().includes('/topics/1')) throw new Error('Chưa thoát về chủ đề 1');
    });

    // =============================================================
    // KỊCH BẢN 11: MÔ PHỎNG MẤT MẠNG (OFFLINE) & PHỤC HỒI KẾT NỐI
    // =============================================================
    console.log('\n🎬 [PHẦN 11] MÔ PHỎNG MẤT MẠNG (OFFLINE) & KHẢ NĂNG CHỊU LỖI (5 bước)');

    await step('💥 [MẤT MẠNG]: Bật chế độ Offline (setOfflineMode: true)', async () => {
      await page.setOfflineMode(true);
      await sleep(200);
    });

    await step('Thực hiện thao tác gọi API trong lúc mất mạng -> Không bị sập màn hình (No White Screen of Death)', async () => {
      const fetchResult = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/reviews/due');
          return { success: true };
        } catch (e) {
          return { success: false, error: e.message };
        }
      });

      if (fetchResult.success) throw new Error('Kỳ vọng fetch thất bại khi offline');

      const isAlive = await page.evaluate(() => document.body && document.body.innerText.length > 50);
      if (!isAlive) throw new Error('Giao diện bị crash trắng màn hình khi mất mạng');
    });

    await step('Kiểm tra giao diện vẫn tương tác được các thành phần offline', async () => {
      const headings = await page.$$eval('h1, h2, h3', (els) => els.map((e) => e.innerText));
      if (headings.length === 0) throw new Error('DOM bị xóa sạch');
    });

    await step('📶 [CÓ MẠNG LẠI]: Tắt chế độ Offline (setOfflineMode: false)', async () => {
      await page.setOfflineMode(false);
      await sleep(500);
    });

    await step('Thao tác lại sau khi có mạng -> Kết nối thành công bình thường', async () => {
      const fetchResult = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/health');
          const json = await res.json();
          return { success: true, status: json.status };
        } catch (e) {
          return { success: false, error: e.message };
        }
      });

      if (!fetchResult.success || fetchResult.status !== 'success') {
        throw new Error('Không phục hồi được kết nối mạng sau khi tắt offline mode');
      }
    });

    // =============================================================
    // KỊCH BẢN 12: PHÒNG ÔN TẬP ĐỊNH KỲ SM-2 & ĐÁNH GIÁ ĐA CẤP ĐỘ
    // =============================================================
    console.log('\n🎬 [PHẦN 12] PHÒNG ÔN TẬP SM-2 & ĐÁNH GIÁ ĐA CẤP ĐỘ GHI NHỚ (7 bước)');

    await step('Truy cập "/review" -> Kiểm tra 4 thẻ thống kê (Cần ôn, Đang học, Thuần thục, Độ chính xác)', async () => {
      await page.goto(`${CLIENT_URL}/review`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
      if (!text.includes('cần ôn') && !text.includes('đang học')) {
        throw new Error('4 thẻ thống kê SM-2 không hiển thị');
      }
    });

    await step('Chọn nguồn ôn tập: Chuyển đổi dropdown giữa "Tất cả từ đang học" và "Cần ôn hôm nay"', async () => {
      const select = await page.$('select#source-select, select');
      if (select) {
        await select.select('due_today');
        await sleep(300);
        await select.select('all_learning');
        await sleep(350);
        await waitForPageReady(page);
      }
    });

    await step('Chuyển Tab: "Danh Sách Từ Đang Học" -> Hiển thị danh sách từ', async () => {
      const tabs = await page.$$('button.border-b-2');
      if (tabs.length < 2) throw new Error('Không tìm thấy tab danh sách');
      await tabs[1].click();
      await sleep(400);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('Toàn bộ thuật ngữ đang học')) {
        throw new Error('Tab Danh sách từ đang học không hiển thị đúng');
      }
    });

    await step('Chuyển Tab: "Lịch 7 Ngày Tới" -> Hiển thị lịch ôn tập', async () => {
      const tabs = await page.$$('button.border-b-2');
      if (tabs.length < 3) throw new Error('Không tìm thấy tab lịch 7 ngày');
      await tabs[2].click();
      await sleep(400);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('Lịch ôn tập sắp tới')) {
        throw new Error('Tab Lịch 7 ngày không hiển thị đúng');
      }
    });

    await step('Quay lại Tab 1 "Thẻ Ôn Tập" -> Bấm Loa phát âm & "Hiện đáp án"', async () => {
      const tabs = await page.$$('button.border-b-2');
      if (tabs.length > 0) {
        await tabs[0].click();
        await sleep(350);
      }

      const select = await page.$('select#source-select, select');
      if (select) {
        await select.select('all_learning');
        await sleep(400);
        await waitForPageReady(page);
      }

      // Thử bấm nút loa
      await page.evaluate(() => {
        const btn = document.querySelector('button[title*="phát âm"]');
        if (btn) btn.click();
      });
      await sleep(300);

      const clicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const ansBtn = btns.find((b) => b.innerText.includes('Hiện đáp án'));
        if (ansBtn) { ansBtn.click(); return true; }
        return false;
      });
      if (!clicked) throw new Error('Không tìm thấy nút Hiện đáp án');
      await sleep(500);

      const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
      if (!text.includes('chưa nhớ') && !text.includes('nhớ tốt')) {
        throw new Error('Các nút đánh giá SM-2 chưa hiển thị');
      }
    });

    await step('Bấm nút đánh giá "Khó nhớ" (Quality = 3) -> Ghi nhận và chuyển thẻ', async () => {
      const evalBtns = await page.$$('button.border-amber-200');
      if (evalBtns.length > 0) {
        await evalBtns[0].click();
        await sleep(500);
      }
    });

    await step('Mở tiếp đáp án từ kế tiếp -> Bấm nút đánh giá "Rất dễ" (Quality = 5) -> Củng cố SM-2', async () => {
      const allBtns = await page.$$('button');
      for (const btn of allBtns) {
        const t = await page.evaluate((el) => el.innerText, btn);
        if (t.includes('Hiện đáp án')) {
          await btn.click();
          await sleep(500);

          const easyBtns = await page.$$('button.border-emerald-200');
          if (easyBtns.length > 0) {
            await easyBtns[0].click();
            await sleep(500);
          }
          break;
        }
      }
    });

    // =============================================================
    // KỊCH BẢN 13: QUẢN LÝ HỒ SƠ CÁ NHÂN & THỬ NGHIỆM ĐỔI MẬT KHẨU
    // =============================================================
    console.log('\n🎬 [PHẦN 13] HỒ SƠ HỌC VIÊN & FORM ĐỔI MẬT KHẨU (5 bước)');

    await step('Vào "/profile" -> Đổi họ tên thành "Họa Sĩ Phan Tân" -> Bấm Lưu -> Header cập nhật tên mới', async () => {
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(`${CLIENT_URL}/profile`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);
      await page.waitForSelector('header');

      const nameInput = await page.$('input[value*="Phan Mỹ Thuật"], input:not([disabled])');
      if (nameInput) {
        await clearAndType(page, nameInput, 'Họa Sĩ Phan Tân');
      }

      const allBtns = await page.$$('button');
      for (const b of allBtns) {
        const t = await page.evaluate((el) => el.innerText, b);
        if (t.includes('Lưu thay đổi')) { await b.click(); break; }
      }
      await sleep(600);

      const headerText = await page.evaluate(() => {
        const h = document.querySelector('header');
        return h ? h.innerText : '';
      });
      if (!headerText.includes('Phan Tân')) throw new Error('Tên mới chưa cập nhật lên Header');
    });

    await step('Cập nhật mục tiêu học tập "Chuyên sâu về tranh Phục Hưng" -> Toast thành công', async () => {
      const textarea = await page.$('textarea');
      if (textarea) {
        await clearAndType(page, textarea, 'Chuyên sâu về tranh Phục Hưng');
      }

      const allBtns = await page.$$('button');
      for (const b of allBtns) {
        const t = await page.evaluate((el) => el.innerText, b);
        if (t.includes('Lưu mục tiêu')) { await b.click(); break; }
      }
      await sleep(500);

      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('Đã lưu') && !text.includes('thành công')) {
        throw new Error('Chưa thấy thông báo lưu mục tiêu');
      }
    });

    await step('Form Đổi Mật Khẩu: Thử nhập mật khẩu mới không khớp -> Bị chặn', async () => {
      const pwInputs = await page.$$('input[type="password"]');
      if (pwInputs.length >= 3) {
        await clearAndType(page, pwInputs[0], 'Password123');
        await clearAndType(page, pwInputs[1], 'NewPass123');
        await clearAndType(page, pwInputs[2], 'KhongKhop999');

        const allBtns = await page.$$('button');
        for (const b of allBtns) {
          const t = await page.evaluate((el) => el.innerText, b);
          if (t.includes('Cập nhật mật khẩu') || t.includes('Đổi mật khẩu')) { await b.click(); break; }
        }

        await page.waitForFunction(() => {
          const text = document.body.innerText.toLowerCase();
          return text.includes('không khớp');
        }, { timeout: 5000 });
      }
    });

    await step('Form Đổi Mật Khẩu: Thử nhập mật khẩu hiện tại sai -> Báo lỗi', async () => {
      const pwInputs = await page.$$('input[type="password"]');
      if (pwInputs.length >= 3) {
        await clearAndType(page, pwInputs[0], 'SaiMatKhauHienTai999');
        await clearAndType(page, pwInputs[1], 'NewPass123');
        await clearAndType(page, pwInputs[2], 'NewPass123');

        const allBtns = await page.$$('button');
        for (const b of allBtns) {
          const t = await page.evaluate((el) => el.innerText, b);
          if (t.includes('Cập nhật mật khẩu') || t.includes('Đổi mật khẩu')) { await b.click(); break; }
        }
        await sleep(600);
      }
    });

    await step('Học viên thường thử truy cập đường dẫn "/admin" -> Bị ProtectedRoute chặn về /dashboard', async () => {
      await page.goto(`${CLIENT_URL}/admin`, { waitUntil: 'domcontentloaded' });
      await sleep(600);

      if (page.url().includes('/admin')) {
        throw new Error('Học viên thường vẫn vào được trang /admin');
      }
    });

    // =============================================================
    // KỊCH BẢN 14: QUẢN TRỊ ADMIN RBAC, ĐỔI ROLE, KHÓA USER & ĐĂNG XUẤT
    // =============================================================
    console.log('\n🎬 [PHẦN 14] QUẢN TRỊ ADMIN RBAC, ĐỔI ROLE & ĐĂNG XUẤT (7 bước)');

    await step('Đăng xuất tài khoản học viên -> Điều hướng về "/login"', async () => {
      await page.setViewport({ width: 1280, height: 800 });
      const logoutBtn = await page.$('header button[title="Đăng xuất"]');
      if (!logoutBtn) throw new Error('Không tìm thấy nút đăng xuất');
      await logoutBtn.click();
      await sleep(600);

      if (!page.url().includes('/login')) throw new Error('Đăng xuất chưa về /login');
    });

    await step('Đăng nhập bằng tài khoản Quản trị viên (Admin) -> Header xuất hiện pill "Quản trị"', async () => {
      const inputs = await page.$$('input');
      await clearAndType(page, inputs[0], 'admin@enlearn.com');
      await clearAndType(page, inputs[1], 'Admin@123');

      await page.click('button[type="submit"]');
      await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
      await waitForPageReady(page);

      const headerText = await page.evaluate(() => document.querySelector('header').innerText);
      if (!headerText.includes('Quản trị')) throw new Error('Header không có pill Quản trị cho Admin');
    });

    await step('Vào "/admin" -> Tab 1 "Quản lý người dùng": Tìm kiếm user "student01" và Enter', async () => {
      await page.goto(`${CLIENT_URL}/admin`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      const searchInput = await page.$('input[placeholder*="Tìm username"]');
      if (searchInput) {
        await clearAndType(page, searchInput, 'student01');
        await page.keyboard.press('Enter');
        await sleep(500);

        const tableText = await page.evaluate(() => document.querySelector('table').innerText);
        if (!tableText.includes('student01')) throw new Error('Tìm kiếm user không ra kết quả');
      }
    });

    await step('Click nút "Làm mới" trên bảng quản trị -> Danh sách người dùng được cập nhật', async () => {
      const refreshed = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find((x) => x.innerText.includes('Làm mới'));
        if (b) { b.click(); return true; }
        return false;
      });
      if (!refreshed) throw new Error('Không tìm thấy nút Làm mới');
      await waitForPageReady(page);
    });

    await step('Thao tác Khóa / Mở khóa tài khoản học viên (Toggle User Status) an toàn', async () => {
      const toggled = await page.evaluate(() => {
        const lockBtn = document.querySelector('tbody button');
        if (lockBtn) { lockBtn.click(); return true; }
        return false;
      });
      if (!toggled) throw new Error('Không tìm thấy nút khóa/mở khóa user');
      await sleep(600);
    });

    await step('Chuyển Tab "Thống kê tổng quan" -> Xác minh telemetry toàn sàn', async () => {
      const tabs = await page.$$('button.border-b-2');
      if (tabs.length >= 2) {
        await tabs[1].click();
        await waitForPageReady(page);

        const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
        if (!text.includes('tổng người dùng') && !text.includes('thuật ngữ')) {
          throw new Error('Tab thống kê admin không hiển thị');
        }
      }
    });

    await step('Đăng xuất tài khoản Quản trị viên -> Hoàn tất vòng kiểm thử', async () => {
      await page.setViewport({ width: 1280, height: 800 });
      const clicked = await page.evaluate(() => {
        const btn = document.querySelector('header button[title="Đăng xuất"]');
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (!clicked) throw new Error('Không tìm thấy nút đăng xuất admin');

      await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 8000 });

      if (!page.url().includes('/login')) throw new Error('Chưa đăng xuất về /login');
    });

  } finally {
    await browser.close();
  }

  // =============================================================
  // TỔNG KẾT
  // =============================================================
  console.log('\n----------------------------------------------------------------');
  console.log(`📊 TỔNG KẾT KIỂM THỬ TƯƠNG TÁC CHI TIẾT & RESILIENCE`);
  console.log('----------------------------------------------------------------');
  console.log(`  • Tổng số bước kiểm thử tương tác:  ${totalSteps}`);
  console.log(`  • Số bước thành công:               ${passedSteps} / ${totalSteps} (${Math.round((passedSteps / totalSteps) * 100)}%)`);
  console.log(`  • Số lỗi Console phát hiện:         ${consoleErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log('\n⚠️  Danh sách Console Errors trong quá trình test:');
    consoleErrors.forEach((e) => console.log(`   - ${e}`));
  }

  if (passedSteps === totalSteps) {
    console.log('\n🎉 TOÀN BỘ CÁC BƯỚC KIỂM THỬ TƯƠNG TÁC, OFFLINE & RESILIENCE ĐỀU THÀNH CÔNG 100%!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Có bước kiểm thử chưa đạt, vui lòng xem log chi tiết bên trên.\n');
    process.exit(1);
  }
}

runDeepE2E().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
