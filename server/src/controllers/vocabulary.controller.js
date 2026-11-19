const { Vocabulary, VocabExample, Topic, User, sequelize, UserVocabProgress, ReviewSchedule } = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const getVocabulariesByTopic = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50, difficulty, search } = req.query;
  const offset = (page - 1) * limit;

  const where = {
    topic_id: id,
    is_approved: true
  };

  if (difficulty) {
    where.difficulty = difficulty;
  }

  if (search) {
    where[Op.or] = [
      { word: { [Op.like]: `%${search}%` } },
      { meaning_vi: { [Op.like]: `%${search}%` } }
    ];
  }

  const { rows: vocabularies, count: total } = await Vocabulary.findAndCountAll({
    where,
    include: [
      { model: VocabExample, as: 'examples' },
      { model: Topic, as: 'topic', attributes: ['id', 'name', 'name_vi'] }
    ],
    distinct: true,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['id', 'ASC']]
  });

  // Gắn thông tin tiến độ nếu user đã đăng nhập
  const userId = req.user?.id;
  let result = vocabularies.map((v) => v.toJSON());

  if (userId) {
    const progressList = await UserVocabProgress.findAll({
      where: {
        user_id: userId,
        vocabulary_id: vocabularies.map((v) => v.id)
      }
    });

    const progressMap = {};
    progressList.forEach((p) => {
      progressMap[p.vocabulary_id] = p;
    });

    result = result.map((v) => ({
      ...v,
      user_progress: progressMap[v.id] || null
    }));
  }

  return ApiResponse.paginated(
    res,
    result,
    { page: parseInt(page), limit: parseInt(limit), total },
    'Lấy danh sách từ vựng thành công'
  );
});

const getVocabularyById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const vocabulary = await Vocabulary.findByPk(id, {
    include: [
      { model: VocabExample, as: 'examples' },
      { model: Topic, as: 'topic' }
    ]
  });

  if (!vocabulary || (!vocabulary.is_approved && vocabulary.created_by !== req.user?.id)) {
    throw new AppError('Không tìm thấy từ vựng.', 404);
  }

  const userId = req.user?.id;
  let user_progress = null;
  if (userId) {
    user_progress = await UserVocabProgress.findOne({
      where: { user_id: userId, vocabulary_id: id }
    });
  }

  return ApiResponse.success(res, { ...vocabulary.toJSON(), user_progress }, 'Lấy chi tiết từ vựng thành công');
});

const markAsLearned = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const vocabulary = await Vocabulary.findByPk(id);
  if (!vocabulary || (!vocabulary.is_approved && vocabulary.created_by !== req.user?.id)) {
    throw new AppError('Không tìm thấy từ vựng.', 404);
  }

  const progress = await sequelize.transaction(async t => {
    await User.findByPk(userId,{transaction:t,lock:t.LOCK.UPDATE});
    const [progress,created] = await UserVocabProgress.findOrCreate({where:{user_id:userId,vocabulary_id:id},
      defaults:{status:'learning',correct_count:0,incorrect_count:0,ease_factor:2.5,interval_days:1,
        repetition_count:0,next_review_at:new Date(Date.now()+86400000)},transaction:t});
    if(created) await ReviewSchedule.create({user_id:userId,vocabulary_id:id,
      scheduled_at:progress.next_review_at,is_completed:false,source:'personal'},{transaction:t});
    return progress;
  });

  return ApiResponse.success(res, progress, 'Đã lưu tiến độ học từ vựng');
});

const searchVocabularies = catchAsync(async (req, res) => {
  const { q = '', limit = 20 } = req.query;

  const vocabularies = await Vocabulary.findAll({
    where: {
      is_approved: true,
      [Op.or]: [
        { word: { [Op.like]: `%${q}%` } },
        { meaning_vi: { [Op.like]: `%${q}%` } }
      ]
    },
    include: [{ model: Topic, as: 'topic', attributes: ['id', 'name', 'name_vi'] }],
    limit: parseInt(limit),
    order: [['word', 'ASC']]
  });

  return ApiResponse.success(res, vocabularies, 'Tìm kiếm từ vựng thành công');
});

module.exports = {
  getVocabulariesByTopic,
  getVocabularyById,
  markAsLearned,
  searchVocabularies
};
