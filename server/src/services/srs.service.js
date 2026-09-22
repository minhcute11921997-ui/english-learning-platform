const { UserVocabProgress, ReviewSchedule, Vocabulary, Topic } = require('../models');
const { Op } = require('sequelize');

class SrsService {
  /**
   * Tính toán tham số SM-2 tiếp theo
   * @param {Object} currentParams
   * @param {number} quality - Điểm chất lượng trả lời (0 đến 5)
   *   0: Hoàn toàn không nhớ gì (Blackout)
   *   1: Sai, nhưng khi nhìn đáp án thì nhớ ra
   *   2: Sai, đáp án có vẻ quen thuộc
   *   3: Đúng, nhưng tốn nhiều thời gian suy nghĩ (Hard)
   *   4: Đúng, sau chút do dự (Good)
   *   5: Đúng hoàn hảo, phản xạ ngay tức khắc (Easy)
   */
  static calculateSM2(currentParams, quality) {
    let { ease_factor = 2.5, interval_days = 0, repetition_count = 0 } = currentParams;

    quality = Math.max(0, Math.min(5, Math.round(quality)));

    if (quality >= 3) {
      if (repetition_count === 0) {
        interval_days = 1;
      } else if (repetition_count === 1) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetition_count += 1;
    } else {
      repetition_count = 0;
      interval_days = 1;
    }

    // Cập nhật hệ số Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease_factor < 1.3) {
      ease_factor = 1.3;
    }

    const next_review_at = new Date(Date.now() + interval_days * 24 * 60 * 60 * 1000);

    let status = 'learning';
    if (repetition_count >= 4 && interval_days >= 15) {
      status = 'mastered';
    }

    return {
      ease_factor: parseFloat(ease_factor.toFixed(2)),
      interval_days,
      repetition_count,
      next_review_at,
      status
    };
  }

  /**
   * Cập nhật tiến độ học từ vựng khi ôn tập
   */
  static async recordReviewAnswer(userId, vocabularyId, quality, source = 'personal', groupVocabSetId = null) {
    let progress = await UserVocabProgress.findOne({
      where: { user_id: userId, vocabulary_id: vocabularyId }
    });

    if (!progress) {
      progress = await UserVocabProgress.create({
        user_id: userId,
        vocabulary_id: vocabularyId,
        status: 'new',
        correct_count: 0,
        incorrect_count: 0,
        ease_factor: 2.5,
        interval_days: 0,
        repetition_count: 0
      });
    }

    const sm2Result = this.calculateSM2(progress, quality);

    const isCorrect = quality >= 3;
    progress.correct_count = (progress.correct_count || 0) + (isCorrect ? 1 : 0);
    progress.incorrect_count = (progress.incorrect_count || 0) + (isCorrect ? 0 : 1);
    progress.ease_factor = sm2Result.ease_factor;
    progress.interval_days = sm2Result.interval_days;
    progress.repetition_count = sm2Result.repetition_count;
    progress.last_reviewed_at = new Date();
    progress.next_review_at = sm2Result.next_review_at;
    progress.status = sm2Result.status;

    await progress.save();

    // Đánh dấu lịch ôn tập hiện tại là đã hoàn thành
    await ReviewSchedule.update(
      { is_completed: true },
      {
        where: {
          user_id: userId,
          vocabulary_id: vocabularyId,
          is_completed: false
        }
      }
    );

    // Lên lịch ôn tập tiếp theo
    await ReviewSchedule.create({
      user_id: userId,
      vocabulary_id: vocabularyId,
      scheduled_at: sm2Result.next_review_at,
      is_completed: false,
      source,
      group_vocab_set_id: groupVocabSetId
    });

    return progress;
  }

  /**
   * Lấy danh sách các từ vựng đến hạn cần ôn tập hôm nay
   */
  static async getDueReviews(userId, limit = 50) {
    const now = new Date();

    const dueProgress = await UserVocabProgress.findAll({
      where: {
        user_id: userId,
        next_review_at: {
          [Op.lte]: now
        }
      },
      include: [
        {
          model: Vocabulary,
          as: 'vocabulary',
          include: [{ model: Topic, as: 'topic', attributes: ['id', 'name', 'name_vi'] }]
        }
      ],
      order: [['next_review_at', 'ASC']],
      limit
    });

    return dueProgress;
  }

  /**
   * Lấy lịch ôn tập sắp tới (calendar view)
   */
  static async getUpcomingReviews(userId, days = 7) {
    const now = new Date();
    const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const schedules = await ReviewSchedule.findAll({
      where: {
        user_id: userId,
        scheduled_at: {
          [Op.between]: [now, future]
        },
        is_completed: false
      },
      include: [
        {
          model: Vocabulary,
          as: 'vocabulary',
          attributes: ['id', 'word', 'meaning_vi', 'part_of_speech', 'difficulty']
        }
      ],
      order: [['scheduled_at', 'ASC']]
    });

    return schedules;
  }

  /**
   * Thống kê ôn tập cho người dùng
   */
  static async getStats(userId) {
    const now = new Date();

    const dueCount = await UserVocabProgress.count({
      where: {
        user_id: userId,
        next_review_at: { [Op.lte]: now }
      }
    });

    const masteredCount = await UserVocabProgress.count({
      where: { user_id: userId, status: 'mastered' }
    });

    const learningCount = await UserVocabProgress.count({
      where: { user_id: userId, status: 'learning' }
    });

    const totalLearned = await UserVocabProgress.count({
      where: { user_id: userId }
    });

    const allProgress = await UserVocabProgress.findAll({
      where: { user_id: userId },
      attributes: ['correct_count', 'incorrect_count']
    });

    let totalCorrect = 0;
    let totalAttempts = 0;
    allProgress.forEach((p) => {
      totalCorrect += p.correct_count || 0;
      totalAttempts += (p.correct_count || 0) + (p.incorrect_count || 0);
    });

    const accuracyRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return {
      dueCount,
      learningCount,
      masteredCount,
      totalLearned,
      accuracyRate
    };
  }
}

module.exports = SrsService;
