const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    reading_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'readings', key: 'id' }
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Nội dung câu hỏi tiếng Anh'
    },
    question_text_vi: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Nội dung câu hỏi tiếng Việt'
    },
    options: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Mảng các đáp án [{text, text_vi}]'
    },
    correct_option: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Index đáp án đúng (0-based)'
    },
    explanation_vi: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Giải thích đáp án bằng tiếng Việt'
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'questions',
    indexes: [
      { fields: ['reading_id'] }
    ]
  });

  return Question;
};
