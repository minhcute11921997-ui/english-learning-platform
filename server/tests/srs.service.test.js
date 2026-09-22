const SrsService = require('../src/services/srs.service');

describe('SM-2 Spaced Repetition Algorithm Unit Tests', () => {
  test('First successful recall (quality = 4) should set interval to 1 day and rep to 1', () => {
    const current = { ease_factor: 2.5, interval_days: 0, repetition_count: 0 };
    const res = SrsService.calculateSM2(current, 4);

    expect(res.repetition_count).toBe(1);
    expect(res.interval_days).toBe(1);
    expect(res.status).toBe('learning');
    expect(res.ease_factor).toBeCloseTo(2.5, 1);
  });

  test('Second successful recall (quality = 4) should set interval to 6 days and rep to 2', () => {
    const current = { ease_factor: 2.5, interval_days: 1, repetition_count: 1 };
    const res = SrsService.calculateSM2(current, 4);

    expect(res.repetition_count).toBe(2);
    expect(res.interval_days).toBe(6);
  });

  test('Third successful recall should multiply interval by ease_factor', () => {
    const current = { ease_factor: 2.5, interval_days: 6, repetition_count: 2 };
    const res = SrsService.calculateSM2(current, 5); // 6 * 2.6 = 15.6 -> 16

    expect(res.repetition_count).toBe(3);
    expect(res.interval_days).toBeGreaterThanOrEqual(15);
  });

  test('Failed recall (quality < 3) should reset repetition_count to 0 and interval to 1', () => {
    const current = { ease_factor: 2.3, interval_days: 20, repetition_count: 5 };
    const res = SrsService.calculateSM2(current, 1);

    expect(res.repetition_count).toBe(0);
    expect(res.interval_days).toBe(1);
  });

  test('Ease factor should not drop below 1.3 floor', () => {
    const current = { ease_factor: 1.35, interval_days: 5, repetition_count: 2 };
    const res = SrsService.calculateSM2(current, 0); // huge drop

    expect(res.ease_factor).toBeGreaterThanOrEqual(1.3);
  });

  test('Card becomes mastered after 4+ consecutive repetitions and 15+ days interval', () => {
    const current = { ease_factor: 2.5, interval_days: 14, repetition_count: 3 };
    const res = SrsService.calculateSM2(current, 5);

    expect(res.repetition_count).toBe(4);
    expect(res.interval_days).toBeGreaterThanOrEqual(15);
    expect(res.status).toBe('mastered');
  });
});
