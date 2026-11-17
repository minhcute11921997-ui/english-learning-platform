/**
 * 🧪 Unit Tests: Spaced Repetition System (SuperMemo-2)
 * File: server/tests/unit/srs.service.test.js
 */

const SrsService = require('../../src/services/srs.service');
const { sequelize } = require('../../src/models');

afterAll(async () => {
  await sequelize.close();
});

describe('SrsService - Thuật toán SM-2 (calculateSM2)', () => {
  describe('1. Khởi tạo & Lần học đầu tiên (Repetition 0 -> 1)', () => {
    test('TC-SM2-01: Lần đầu nhớ tốt (quality = 4) -> interval = 1 ngày, rep = 1, ease factor giữ nguyên 2.5', () => {
      const initial = { ease_factor: 2.5, interval_days: 0, repetition_count: 0 };
      const result = SrsService.calculateSM2(initial, 4);

      expect(result.repetition_count).toBe(1);
      expect(result.interval_days).toBe(1);
      expect(result.ease_factor).toBe(2.5);
      expect(result.status).toBe('learning');
      expect(result.next_review_at).toBeInstanceOf(Date);
    });

    test('TC-SM2-02: Lần đầu rất dễ (quality = 5) -> interval = 1 ngày, ease factor tăng lên 2.6', () => {
      const initial = { ease_factor: 2.5, interval_days: 0, repetition_count: 0 };
      const result = SrsService.calculateSM2(initial, 5);

      expect(result.repetition_count).toBe(1);
      expect(result.interval_days).toBe(1);
      expect(result.ease_factor).toBe(2.6);
      expect(result.status).toBe('learning');
    });

    test('TC-SM2-03: Lần đầu khó nhớ (quality = 3) -> interval = 1 ngày, ease factor giảm nhẹ', () => {
      const initial = { ease_factor: 2.5, interval_days: 0, repetition_count: 0 };
      const result = SrsService.calculateSM2(initial, 3);

      expect(result.repetition_count).toBe(1);
      expect(result.interval_days).toBe(1);
      expect(result.ease_factor).toBe(2.36);
      expect(result.status).toBe('learning');
    });
  });

  describe('2. Các chu kỳ ôn tập tiếp theo (Repetition >= 1)', () => {
    test('TC-SM2-04: Lần thứ hai đúng (Rep 1 -> 2) -> interval = 6 ngày', () => {
      const current = { ease_factor: 2.5, interval_days: 1, repetition_count: 1 };
      const result = SrsService.calculateSM2(current, 4);

      expect(result.repetition_count).toBe(2);
      expect(result.interval_days).toBe(6);
      expect(result.ease_factor).toBe(2.5);
      expect(result.status).toBe('learning');
    });

    test('TC-SM2-05: Lần thứ ba đúng (Rep 2 -> 3) -> interval = round(6 * 2.5) = 15 ngày', () => {
      const current = { ease_factor: 2.5, interval_days: 6, repetition_count: 2 };
      const result = SrsService.calculateSM2(current, 4);

      expect(result.repetition_count).toBe(3);
      expect(result.interval_days).toBe(15);
      expect(result.status).toBe('learning'); // Chưa đủ rep >= 4 nên vẫn là learning
    });

    test('TC-SM2-06: Đạt điều kiện thuần thục (rep >= 4 & interval >= 15) -> status chuyển thành "mastered"', () => {
      const current = { ease_factor: 2.5, interval_days: 15, repetition_count: 3 };
      const result = SrsService.calculateSM2(current, 4);

      expect(result.repetition_count).toBe(4);
      expect(result.interval_days).toBe(38); // 15 * 2.5 = 37.5 -> round = 38
      expect(result.status).toBe('mastered');
    });
  });

  describe('3. Xử lý khi quên hoặc trả lời sai (quality < 3)', () => {
    test('TC-SM2-07: Từ đang mastered nhưng bị quên (quality = 1) -> reset rep = 0, interval = 1, rớt xuống learning', () => {
      const current = { ease_factor: 2.5, interval_days: 40, repetition_count: 5 };
      const result = SrsService.calculateSM2(current, 1);

      expect(result.repetition_count).toBe(0);
      expect(result.interval_days).toBe(1);
      expect(result.status).toBe('learning');
      expect(result.ease_factor).toBeLessThan(2.5);
    });

    test('TC-SM2-08: Hoàn toàn không nhớ gì (quality = 0) -> EF giảm mạnh nhất', () => {
      const current = { ease_factor: 2.5, interval_days: 10, repetition_count: 2 };
      const result = SrsService.calculateSM2(current, 0);

      // EF formula: 2.5 + (0.1 - (5 - 0) * (0.08 + (5 - 0) * 0.02)) = 2.5 + (0.1 - 5 * 0.18) = 2.5 - 0.8 = 1.70
      expect(result.repetition_count).toBe(0);
      expect(result.interval_days).toBe(1);
      expect(result.ease_factor).toBe(1.7);
    });
  });

  describe('4. Kiểm tra biên (Boundary Value Analysis)', () => {
    test('TC-SM2-09: Ease Factor không bao giờ thấp hơn biên sàn 1.30', () => {
      let current = { ease_factor: 1.4, interval_days: 1, repetition_count: 0 };
      // Quên liên tiếp nhiều lần
      current = SrsService.calculateSM2(current, 0);
      expect(current.ease_factor).toBe(1.3);

      // Tiếp tục quên thêm lần nữa
      current = SrsService.calculateSM2(current, 0);
      expect(current.ease_factor).toBe(1.3);
    });

    test('TC-SM2-10: Khoảng cách ôn tập không vượt quá biên trần 365 ngày', () => {
      const current = { ease_factor: 2.8, interval_days: 200, repetition_count: 5 };
      const result = SrsService.calculateSM2(current, 5);

      // 200 * 2.9 = 580 -> bị chặn ở 365
      expect(result.interval_days).toBe(365);
      expect(result.status).toBe('mastered');
    });

    test('TC-SM2-11: Quality âm được làm tròn và kẹp lên 0', () => {
      const initial = { ease_factor: 2.5, interval_days: 0, repetition_count: 0 };
      const result = SrsService.calculateSM2(initial, -5);

      expect(result.repetition_count).toBe(0);
      expect(result.interval_days).toBe(1);
      expect(result.ease_factor).toBe(1.7);
    });

    test('TC-SM2-12: Quality > 5 được làm tròn và kẹp xuống 5', () => {
      const initial = { ease_factor: 2.5, interval_days: 0, repetition_count: 0 };
      const result = SrsService.calculateSM2(initial, 99);

      expect(result.repetition_count).toBe(1);
      expect(result.interval_days).toBe(1);
      expect(result.ease_factor).toBe(2.6);
    });

    test('TC-SM2-13: Next review timestamp tương thích với số ngày interval', () => {
      const before = Date.now();
      const result = SrsService.calculateSM2({ ease_factor: 2.5, interval_days: 0, repetition_count: 0 }, 4);
      const after = Date.now();

      const expectedMin = before + 1 * 24 * 60 * 60 * 1000;
      const expectedMax = after + 1 * 24 * 60 * 60 * 1000;

      expect(result.next_review_at.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(result.next_review_at.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });
});
