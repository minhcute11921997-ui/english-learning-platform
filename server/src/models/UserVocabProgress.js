const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserVocabProgress = sequelize.define('UserVocabProgress', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    vocabulary_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vocabularies', key: 'id' }
    },
    status: {
      type: DataTypes.ENUM('new', 'learning', 'mastered'),
      defaultValue: 'new',
      comment: 'Trạng thái học: mới, đang học, đã thuần thục'
    },
    correct_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Số lần trả lời đúng'
    },
    incorrect_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Số lần trả lời sai'
    },
    // Các trường cho thuật toán SM-2
    ease_factor: {
      type: DataTypes.FLOAT,
      defaultValue: 2.5,
      comment: 'Hệ số dễ - SM-2 algorithm (khởi tạo 2.5)'
    },
    interval_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Khoảng cách ôn tập (ngày)'
    },
    repetition_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Số lần ôn tập liên tiếp đúng'
    },
    last_reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Lần ôn tập cuối'
    },
    next_review_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Lần ôn tập tiếp theo'
    }
  }, {
    tableName: 'user_vocab_progress',
    indexes: [
      { unique: true, fields: ['user_id', 'vocabulary_id'] },
      { fields: ['next_review_at'] },
      { fields: ['status'] }
    ]
  });

  return UserVocabProgress;
};
