const { Topic, Vocabulary, UserVocabProgress } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const getAllTopics = catchAsync(async (req, res) => {
  const topics = await Topic.findAll({
    order: [['display_order', 'ASC']]
  });

  const userId = req.user?.id;
  const result = [];

  for (const topic of topics) {
    const vocabCount = await Vocabulary.count({
      where: { topic_id: topic.id, is_approved: true }
    });

    let learnedCount = 0;
    if (userId) {
      learnedCount = await UserVocabProgress.count({
        where: { user_id: userId },
        include: [
          {
            model: Vocabulary,
            as: 'vocabulary',
            where: { topic_id: topic.id, is_approved: true }
          }
        ]
      });
    }

    result.push({
      ...topic.toJSON(),
      vocab_count: vocabCount,
      learned_count: learnedCount,
      progress_percent: vocabCount > 0 ? Math.round((learnedCount / vocabCount) * 100) : 0
    });
  }

  return ApiResponse.success(res, result, 'Lấy danh sách chủ đề thành công');
});

const getTopicById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const topic = await Topic.findByPk(id);
  if (!topic) {
    return ApiResponse.error(res, 'Không tìm thấy chủ đề', 404);
  }
  return ApiResponse.success(res, topic, 'Lấy thông tin chủ đề thành công');
});

module.exports = {
  getAllTopics,
  getTopicById
};
