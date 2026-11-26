const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Tên đăng nhập phải từ 3-50 ký tự'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
    body('full_name').notEmpty().withMessage('Họ và tên không được để trống'),
    validate
  ],
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu'),
    validate
  ],
  authController.login
);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().withMessage('Email không hợp lệ'), validate],
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  [
    body('token').notEmpty().withMessage('Thiếu mã đặt lại mật khẩu'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự'),
    validate
  ],
  authController.resetPassword
);

router.post(
  '/verify-email',
  authLimiter,
  [body('token').notEmpty().withMessage('Thiếu mã xác minh email'), validate],
  authController.verifyEmail
);

router.post('/resend-verification', authenticate, authLimiter, authController.resendVerification);

router.post(
  '/google',
  authLimiter,
  [body('credential').notEmpty().withMessage('Thiếu mã xác thực Google'), validate],
  authController.googleLogin
);

module.exports = router;
