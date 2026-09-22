/**
 * Wrapper để bắt lỗi async trong Express route handlers
 * Tránh phải viết try-catch trong mỗi controller
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
