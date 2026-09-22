const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserAnswer = sequelize.define('UserAnswer', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    attempt_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'user_reading_attempts', key: 'id' }
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'questions', key: 'id' }
    },
    selected_option: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Index đáp án đã chọn (0-based)'
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    tableName: 'user_answers',
    indexes: [
      { fields: ['attempt_id'] },
      { fields: ['question_id'] }
    ]
  });

  return UserAnswer;
};
