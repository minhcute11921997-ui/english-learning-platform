const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LevelAssessment = sequelize.define('LevelAssessment', {
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
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Điểm đạt được'
    },
    total_questions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Tổng số câu hỏi'
    },
    result_level: {
      type: DataTypes.ENUM('beginner', 'elementary', 'pre_intermediate'),
      allowNull: false,
      comment: 'Kết quả phân loại trình độ'
    },
    answers_detail: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Chi tiết từng câu trả lời'
    },
    taken_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'level_assessments',
    indexes: [
      { fields: ['user_id'] }
    ]
  });

  return LevelAssessment;
};
