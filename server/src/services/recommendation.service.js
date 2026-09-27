const { Reading, UserReadingAttempt, User, Topic, UserVocabProgress, Vocabulary } = require('../models');
const { Op } = require('sequelize');

class RecommendationService {
  /**
   * Đề xuất bài đọc dựa trên trình độ và lịch sử người dùng
   */
  static async getRecommendedReadings(userId, limit = 5) {
    const user = await User.findByPk(userId);
    let targetDifficulty = 'easy';

    if (user && user.initial_level) {
      if (user.initial_level >= 75) {
        targetDifficulty = 'hard';
      } else if (user.initial_level >= 50) {
        targetDifficulty = 'medium';
      }
    }

    // Lấy các bài đọc user đã từng làm
    const completedAttempts = await UserReadingAttempt.findAll({
      where: { user_id: userId },
      attributes: ['reading_id', 'score', 'total_questions']
    });

    const completedReadingIds = completedAttempts.map((a) => a.reading_id);

    // Ưu tiên bài đọc phù hợp độ khó mà chưa làm
    let recommended = await Reading.findAll({
      where: {
        is_approved: true,
        difficulty: targetDifficulty,
        id: {
          [Op.notIn]: completedReadingIds.length > 0 ? completedReadingIds : [0]
        }
      },
      include: [{ model: Topic, as: 'topic', attributes: ['id', 'name', 'name_vi'] }],
      limit
    });

    // Nếu chưa đủ, lấy thêm bài khác
    if (recommended.length < limit) {
      const more = await Reading.findAll({
        where: {
          is_approved: true,
          id: {
            [Op.notIn]: [
              ...(completedReadingIds.length > 0 ? completedReadingIds : [0]),
              ...recommended.map((r) => r.id)
            ]
          }
        },
        include: [{ model: Topic, as: 'topic', attributes: ['id', 'name', 'name_vi'] }],
        limit: limit - recommended.length
      });
      recommended = recommended.concat(more);
    }

    return recommended;
  }

  /**
   * Phân tích khoảng trống kiến thức (gap analysis)
   * Tìm các chủ đề user chưa học hoặc có tỷ lệ làm sai cao
   */
  static async getLearningGaps(userId) {
    const allTopics = await Topic.findAll();
    const topicProgress = [];

    for (const topic of allTopics) {
      const vocabCount = await Vocabulary.count({ where: { topic_id: topic.id } });

      // Fix: Sequelize count() không support include đúng cách, dùng findAll với include thay thế
      const vocabIdsInTopic = await Vocabulary.findAll({
        where: { topic_id: topic.id },
        attributes: ['id']
      });
      const vocabIds = vocabIdsInTopic.map((v) => v.id);
      const learnedCount = vocabIds.length > 0
        ? await UserVocabProgress.count({
            where: { user_id: userId, vocabulary_id: vocabIds }
          })
        : 0;

      topicProgress.push({
        topicId: topic.id,
        topicName: topic.name_vi,
        totalVocab: vocabCount,
        learnedVocab: learnedCount,
        completionPercent: vocabCount > 0 ? Math.round((learnedCount / vocabCount) * 100) : 0
      });
    }

    // Sắp xếp tăng dần theo tỷ lệ hoàn thành để đề xuất chủ đề cần bổ sung
    topicProgress.sort((a, b) => a.completionPercent - b.completionPercent);

    return topicProgress;
  }
}

module.exports = RecommendationService;
