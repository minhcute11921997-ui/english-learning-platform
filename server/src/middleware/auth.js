const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/app');
const { User } = require('../models');

/**
 * Middleware xác thực JWT token
 * Lấy token từ header Authorization: Bearer <token>
 */
const authenticate = catchAsync(async (req, res, next) => {
  // 1) Lấy token từ header
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401));
  }

  // 2) Verify token
  const decoded = jwt.verify(token, config.jwt.secret);

  // 3) Kiểm tra user còn tồn tại và chưa bị khóa
  const user = await User.findByPk(decoded.id, {
    attributes: ['id', 'username', 'email', 'role', 'is_active', 'full_name', 'initial_level', 'learning_goal', 'avatar_url']
  });

  if (!user) {
    return next(new AppError('Người dùng không còn tồn tại.', 401));
  }

  if (!user.is_active) {
    return next(new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403));
  }

  req.user = user.toJSON();

  next();
});

/**
 * Middleware phân quyền theo role
 * @param  {...string} roles - Các role được phép truy cập
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện thao tác này.', 403));
    }
    next();
  };
};

const optionalAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
  } catch (err) {
    // Token không hợp lệ thì bỏ qua, coi như khách vãng lai
  }

  next();
};

module.exports = { authenticate, authorize, optionalAuth };

