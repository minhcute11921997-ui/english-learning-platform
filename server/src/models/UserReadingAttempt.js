const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserReadingAttempt = sequelize.define('UserReadingAttempt', {
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
    reading_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'readings', key: 'id' }
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Số câu trả lời đúng'
    },
    total_questions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Tổng số câu hỏi'
    },
    time_spent_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Thời gian làm bài (giây)'
    },
    attempted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_reading_attempts',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['reading_id'] }
    ]
  });

  return UserReadingAttempt;
};
