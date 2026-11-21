const SrsService = require('../services/srs.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const getDueReviews = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 30;
  const dueWords = await SrsService.getDueReviews(userId, limit);

  return ApiResponse.success(res, dueWords, 'Lấy danh sách từ vựng cần ôn tập thành công');
});

const getLearningReviews = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 100;
  const learningWords = await SrsService.getLearningWords(userId, limit);

  return ApiResponse.success(res, learningWords, 'Lấy danh sách từ đang học thành công');
});

const getUpcomingReviews = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const days = parseInt(req.query.days) || 7;
  const upcoming = await SrsService.getUpcomingReviews(userId, days);

  return ApiResponse.success(res, upcoming, 'Lấy lịch ôn tập sắp tới thành công');
});

const answerReview = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const vocabId = parseInt(req.params.vocabId);
  const { quality } = req.body;

  const q = quality;
  if (!Number.isInteger(q) || q < 0 || q > 5) {
    throw new AppError('Điểm chất lượng (quality) phải là số từ 0 đến 5.', 400);
  }

  const updatedProgress = await SrsService.recordReviewAnswer(userId, vocabId, q);

  return ApiResponse.success(res, updatedProgress, 'Đã ghi nhận kết quả ôn tập và cập nhật lịch ôn');
});

const getReviewStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const stats = await SrsService.getStats(userId);

  return ApiResponse.success(res, stats, 'Lấy thống kê ôn tập thành công');
});

module.exports = {
  getDueReviews,
  getLearningReviews,
  getUpcomingReviews,
  answerReview,
  getReviewStats
};
