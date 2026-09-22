const { LevelAssessment, User } = require('../models');
const { placementQuestionsData } = require('../seeders/index');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const getQuestions = catchAsync(async (req, res) => {
  // Trả về danh sách câu hỏi mà không để lộ đáp án đúng và giải thích
  const sanitizedQuestions = placementQuestionsData.map((q, index) => ({
    id: index,
    question_text: q.question_text,
    question_text_vi: q.question_text_vi,
    options: q.options
  }));

  return ApiResponse.success(res, sanitizedQuestions, 'Lấy đề thi đánh giá đầu vào thành công');
});

const submitAssessment = catchAsync(async (req, res) => {
  const { answers } = req.body; // Map hoặc array [{ question_id, selected_option }]
  if (!answers || !Array.isArray(answers)) {
    throw new AppError('Dữ liệu bài làm không hợp lệ.', 400);
  }

  let score = 0;
  const total_questions = placementQuestionsData.length;
  const answersDetail = [];

  answers.forEach((ans) => {
    const qIndex = ans.question_id;
    const q = placementQuestionsData[qIndex];
    if (q) {
      const isCorrect = q.correct_option === ans.selected_option;
      if (isCorrect) score += 1;

      answersDetail.push({
        question_id: qIndex,
        question_text: q.question_text,
        question_text_vi: q.question_text_vi,
        options: q.options,
        selected_option: ans.selected_option,
        correct_option: q.correct_option,
        is_correct: isCorrect,
        explanation_vi: q.explanation_vi
      });
    }
  });

  // Phân loại level
  // >= 22: Pre-intermediate (75+)
  // 12 - 21: Elementary (50-74)
  // < 12: Beginner (< 50)
  let result_level = 'beginner';
  let levelScorePercent = Math.round((score / total_questions) * 100);

  if (score >= 22) {
    result_level = 'pre_intermediate';
  } else if (score >= 12) {
    result_level = 'elementary';
  } else {
    result_level = 'beginner';
  }

  const assessment = await LevelAssessment.create({
    user_id: req.user.id,
    score,
    total_questions,
    result_level,
    answers_detail: answersDetail,
    taken_at: new Date()
  });

  // Cập nhật initial_level cho User
  await User.update(
    { initial_level: levelScorePercent },
    { where: { id: req.user.id } }
  );

  return ApiResponse.created(res, {
    assessment_id: assessment.id,
    score,
    total_questions,
    percentage: levelScorePercent,
    result_level,
    answers_detail: answersDetail
  }, 'Nộp bài đánh giá thành công');
});

const getHistory = catchAsync(async (req, res) => {
  const history = await LevelAssessment.findAll({
    where: { user_id: req.user.id },
    order: [['taken_at', 'DESC']]
  });

  return ApiResponse.success(res, history, 'Lấy lịch sử đánh giá thành công');
});

module.exports = {
  getQuestions,
  submitAssessment,
  getHistory
};
