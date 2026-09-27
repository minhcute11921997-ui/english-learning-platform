const rateLimit = require('express-rate-limit');

const isInternalTest = (req) => {
  return req.headers['x-internal-test'] === 'englearn-test-key' || process.env.NODE_ENV === 'test';
};

/**
 * Giới hạn chung cho toàn bộ API
 * Ngăn chặn brute-force và lạm dụng API nói chung
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: process.env.NODE_ENV === 'production' ? 300 : 2500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isInternalTest,
  message: {
    status: 'error',
    message: 'Quá nhiều request từ địa chỉ IP này. Vui lòng thử lại sau 15 phút.'
  }
});

/**
 * Giới hạn nghiêm ngặt cho Authentication (Login, Register)
 * Chống Brute Force mật khẩu, Credential Stuffing, và DoS thuật toán Bcrypt (CPU-bound)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: process.env.NODE_ENV === 'production' ? 15 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isInternalTest,
  message: {
    status: 'error',
    message: 'Quá nhiều lần thử xác thực. Vui lòng thử lại sau 15 phút để bảo vệ tài khoản.'
  }
});

/**
 * Giới hạn riêng cho các tính năng search/nặng
 */
const heavyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: process.env.NODE_ENV === 'production' ? 60 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Tần suất gửi yêu cầu quá nhanh. Vui lòng chậm lại một chút.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  heavyLimiter
};
