const {
  User,
  Vocabulary,
  UserVocabProgress,
  ReviewSchedule,
  ReviewEvent,
  Topic
} = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const getOverviewStats = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalVocab,
    totalTopics
  ] = await Promise.all([
    User.count(),
    Vocabulary.count({ where: { is_approved: true } }),
    Topic.count()
  ]);

  return ApiResponse.success(
    res,
    {
      totalUsers,
      totalVocab,
      totalTopics
    },
    'Lấy thống kê tổng quan thành công'
  );
});

const getMyProgress = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  const [
    learnedCount,
    masteredCount,
    dueTodayCount,
    allProgress
  ] = await Promise.all([
    UserVocabProgress.count({ where: { user_id: userId } }),
    UserVocabProgress.count({ where: { user_id: userId, status: 'mastered' } }),
    UserVocabProgress.count({
      where: {
        user_id: userId,
        next_review_at: { [Op.lte]: now }
      }
    }),
    UserVocabProgress.findAll({
      where: { user_id: userId },
      attributes: ['correct_count', 'incorrect_count']
    })
  ]);

  let totalCorrect = 0;
  let totalAttempts = 0;
  allProgress.forEach((p) => {
    totalCorrect += p.correct_count || 0;
    totalAttempts += (p.correct_count || 0) + (p.incorrect_count || 0);
  });

  const vocabAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return ApiResponse.success(
    res,
    {
      learnedCount,
      masteredCount,
      learningCount: Math.max(0, learnedCount - masteredCount),
      dueTodayCount,
      accuracyRate: vocabAccuracy,
      totalAttempts
    },
    'Lấy tiến độ học tập từ vựng cá nhân thành công'
  );
});

const getLearningTrends = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Lấy dữ liệu 7 ngày qua
  const past7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const endD = new Date(d);
    endD.setHours(23, 59, 59, 999);

    const count = await ReviewEvent.count({
      where: {
        user_id: userId,
        reviewed_at: {
          [Op.between]: [d, endD]
        }
      }
    });

    past7Days.push({
      date: [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'),
      dayName: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
      reviewsCount: count
    });
  }

  return ApiResponse.success(res, past7Days, 'Lấy dữ liệu xu hướng học tập thành công');
});

module.exports = {
  getOverviewStats,
  getMyProgress,
  getLearningTrends
};
