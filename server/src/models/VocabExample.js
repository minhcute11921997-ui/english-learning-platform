const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VocabExample = sequelize.define('VocabExample', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    vocabulary_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vocabularies', key: 'id' }
    },
    sentence: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Câu ví dụ tiếng Anh'
    },
    translation: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Bản dịch tiếng Việt'
    }
  }, {
    tableName: 'vocab_examples'
  });

  return VocabExample;
};
