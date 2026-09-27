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
  let error = err;

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      status: 'error',
      message: 'Dung lượng payload gửi lên vượt quá giới hạn cho phép (1MB).'
    });
  }

  if (err.name === 'SequelizeValidationError') error = handleSequelizeValidationError(err);
  else if (err.name === 'SequelizeUniqueConstraintError') error = handleSequelizeUniqueError(err);
  else if (err.name === 'JsonWebTokenError') error = handleJWTError();
  else if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  else if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('Kích thước file ảnh vượt quá giới hạn tối đa cho phép (5MB).', 400);
    } else {
      error = new AppError(`Lỗi tải file lên: ${err.message}`, 400);
    }
  }

  error.statusCode = error.statusCode || (typeof error.status === 'number' ? error.status : 500);
  error.status = error.status || 'error';

  // Log lỗi trong development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      error: err,
      stack: err.stack
    });
  }

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
