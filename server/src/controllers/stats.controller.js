const {
  User,
  Vocabulary,
  Reading,
  Group,
  CommunityPost,
  UserVocabProgress,
  UserReadingAttempt,
  ReviewSchedule
} = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const getOverviewStats = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalVocab,
    totalReadings,
    totalGroups,
    totalCommunityPosts
  ] = await Promise.all([
    User.count(),
    Vocabulary.count({ where: { is_approved: true } }),
    Reading.count({ where: { is_approved: true } }),
    Group.count({ where: { is_active: true } }),
    CommunityPost.count({ where: { status: 'approved' } })
  ]);

  return ApiResponse.success(
    res,
    {
      totalUsers,
      totalVocab,
      totalReadings,
      totalGroups,
      totalCommunityPosts
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
    readingAttempts
  ] = await Promise.all([
    UserVocabProgress.count({ where: { user_id: userId } }),
    UserVocabProgress.count({ where: { user_id: userId, status: 'mastered' } }),
    UserVocabProgress.count({
      where: {
        user_id: userId,
        next_review_at: { [Op.lte]: now }
      }
    }),
    UserReadingAttempt.findAll({
      where: { user_id: userId },
      attributes: ['reading_id', 'score', 'total_questions', 'attempted_at']
    })
  ]);

  const completedReadingIds = new Set(readingAttempts.map((a) => a.reading_id));
  const completedReadingsCount = completedReadingIds.size;

  let totalReadingScore = 0;
  let totalReadingQuestions = 0;
  readingAttempts.forEach((a) => {
    totalReadingScore += a.score;
    totalReadingQuestions += a.total_questions;
  });

  const readingAccuracy =
    totalReadingQuestions > 0 ? Math.round((totalReadingScore / totalReadingQuestions) * 100) : 0;

  return ApiResponse.success(
    res,
    {
      learnedCount,
      masteredCount,
      learningCount: Math.max(0, learnedCount - masteredCount),
      dueTodayCount,
      completedReadingsCount,
      readingAccuracy,
      totalAttempts: readingAttempts.length
    },
    'Lấy tiến độ học tập cá nhân thành công'
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

    const count = await UserVocabProgress.count({
      where: {
        user_id: userId,
        last_reviewed_at: {
          [Op.between]: [d, endD]
        }
      }
    });

    past7Days.push({
      date: d.toISOString().split('T')[0],
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
