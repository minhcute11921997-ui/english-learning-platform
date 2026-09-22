const { Reading, Question, Topic, UserReadingAttempt, UserAnswer } = require('../models');
const RecommendationService = require('../services/recommendation.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const getAllReadings = catchAsync(async (req, res) => {
  const { topic_id, difficulty, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const where = { is_approved: true };
  if (topic_id) where.topic_id = topic_id;
  if (difficulty) where.difficulty = difficulty;
  if (search) {
    where[require('sequelize').Op.or] = [
      { title: { [require('sequelize').Op.like]: `%${search}%` } },
      { title_vi: { [require('sequelize').Op.like]: `%${search}%` } }
    ];
  }

  const { rows: readings, count: total } = await Reading.findAndCountAll({
    where,
    include: [{ model: Topic, as: 'topic', attributes: ['id', 'name', 'name_vi'] }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['id', 'ASC']]
  });

  const userId = req.user?.id;
  let result = readings.map((r) => r.toJSON());

  if (userId) {
    const attempts = await UserReadingAttempt.findAll({
      where: {
        user_id: userId,
        reading_id: readings.map((r) => r.id)
      }
    });

    const attemptMap = {};
    attempts.forEach((a) => {
      if (!attemptMap[a.reading_id] || a.score > attemptMap[a.reading_id].score) {
        attemptMap[a.reading_id] = a;
      }
    });

    result = result.map((r) => ({
      ...r,
      best_attempt: attemptMap[r.id] || null,
      is_completed: !!attemptMap[r.id]
    }));
  }

  return ApiResponse.paginated(
    res,
    result,
    { page: parseInt(page), limit: parseInt(limit), total },
    'Lấy danh sách bài đọc thành công'
  );
});

const getReadingById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const reading = await Reading.findByPk(id, {
    include: [
      { model: Topic, as: 'topic' },
      {
        model: Question,
        as: 'questions',
        attributes: ['id', 'question_text', 'question_text_vi', 'options', 'display_order']
      }
    ]
  });

  if (!reading) {
    throw new AppError('Không tìm thấy bài đọc.', 404);
  }

  return ApiResponse.success(res, reading, 'Lấy chi tiết bài đọc thành công');
});

const submitReadingAttempt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { answers, time_spent_seconds = 0 } = req.body; // answers: [{ question_id, selected_option }]
  const userId = req.user.id;

  const reading = await Reading.findByPk(id, {
    include: [{ model: Question, as: 'questions' }]
  });

  if (!reading) {
    throw new AppError('Không tìm thấy bài đọc.', 404);
  }

  if (!answers || !Array.isArray(answers)) {
    throw new AppError('Dữ liệu bài làm không hợp lệ.', 400);
  }

  const questionMap = {};
  reading.questions.forEach((q) => {
    questionMap[q.id] = q;
  });

  let score = 0;
  const total_questions = reading.questions.length;
  const userAnswersData = [];
  const detailedResults = [];

  for (const item of answers) {
    const question = questionMap[item.question_id];
    if (question) {
      const is_correct = question.correct_option === item.selected_option;
      if (is_correct) score++;

      userAnswersData.push({
        question_id: question.id,
        selected_option: item.selected_option,
        is_correct
      });

      detailedResults.push({
        question_id: question.id,
        question_text: question.question_text,
        question_text_vi: question.question_text_vi,
        options: question.options,
        selected_option: item.selected_option,
        correct_option: question.correct_option,
        is_correct,
        explanation_vi: question.explanation_vi
      });
    }
  }

  // Tạo UserReadingAttempt
  const attempt = await UserReadingAttempt.create({
    user_id: userId,
    reading_id: parseInt(id),
    score,
    total_questions,
    time_spent_seconds,
    attempted_at: new Date()
  });

  // Lưu từng UserAnswer
  for (const ua of userAnswersData) {
    await UserAnswer.create({
      attempt_id: attempt.id,
      ...ua
    });
  }

  return ApiResponse.created(
    res,
    {
      attempt_id: attempt.id,
      score,
      total_questions,
      percentage: Math.round((score / total_questions) * 100),
      time_spent_seconds,
      results: detailedResults
    },
    'Nộp bài đọc hiểu thành công'
  );
});

const getReadingResults = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const latestAttempt = await UserReadingAttempt.findOne({
    where: { user_id: userId, reading_id: id },
    order: [['attempted_at', 'DESC']],
    include: [
      {
        model: UserAnswer,
        as: 'answers',
        include: [{ model: Question, as: 'question' }]
      }
    ]
  });

  if (!latestAttempt) {
    throw new AppError('Bạn chưa làm bài đọc này.', 404);
  }

  return ApiResponse.success(res, latestAttempt, 'Lấy kết quả bài đọc thành công');
});

const getRecommended = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const recommended = await RecommendationService.getRecommendedReadings(userId, 6);

  return ApiResponse.success(res, recommended, 'Lấy danh sách bài đọc gợi ý thành công');
});

module.exports = {
  getAllReadings,
  getReadingById,
  submitReadingAttempt,
  getReadingResults,
  getRecommended
};
