const AppError = require('../utils/AppError');

/**
 * Xử lý lỗi Sequelize validation
 */
const handleSequelizeValidationError = (err) => {
  const messages = err.errors.map(e => e.message);
  return new AppError(messages.join('. '), 400);
};

/**
 * Xử lý lỗi Sequelize unique constraint
 */
const handleSequelizeUniqueError = (err) => {
  const field = err.errors[0]?.path || 'field';
  return new AppError(`${field} đã tồn tại`, 409);
};

/**
 * Xử lý lỗi JWT
 */
const handleJWTError = () => new AppError('Token không hợp lệ. Vui lòng đăng nhập lại.', 401);
const handleJWTExpiredError = () => new AppError('Token đã hết hạn. Vui lòng đăng nhập lại.', 401);

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log lỗi trong development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  }

  // Production: chỉ trả message, không leak stack trace
  let error = { ...err, message: err.message };

  if (err.name === 'SequelizeValidationError') error = handleSequelizeValidationError(err);
  if (err.name === 'SequelizeUniqueConstraintError') error = handleSequelizeUniqueError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message
    });
  }

  // Lỗi không xác định
  console.error('💥 Unexpected Error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
  });
};

module.exports = errorHandler;
