const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Vocabulary = sequelize.define('Vocabulary', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    topic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'topics', key: 'id' }
    },
    word: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Từ vựng tiếng Anh'
    },
    pronunciation: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Phiên âm IPA'
    },
    part_of_speech: {
      type: DataTypes.ENUM('noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'determiner', 'exclamation'),
      allowNull: false,
      comment: 'Từ loại'
    },
    meaning_vi: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Nghĩa tiếng Việt'
    },
    example_sentence: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Câu ví dụ tiếng Anh'
    },
    example_translation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Bản dịch câu ví dụ'
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL hình ảnh minh họa'
    },
    audio_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL file phát âm'
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'easy',
      comment: 'Mức độ khó'
    },
    source_type: {
      type: DataTypes.ENUM('system', 'community'),
      defaultValue: 'system',
      comment: 'Nguồn: hệ thống hoặc cộng đồng đóng góp'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      comment: 'Người tạo (null = admin/hệ thống)'
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Đã được duyệt chưa'
    }
  }, {
    tableName: 'vocabularies',
    indexes: [
      { fields: ['topic_id'] },
      { fields: ['word'] },
      { fields: ['difficulty'] },
      { fields: ['is_approved'] }
    ]
  });

  return Vocabulary;
};
