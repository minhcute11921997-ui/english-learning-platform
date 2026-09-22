const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reading = sequelize.define('Reading', {
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Tiêu đề tiếng Anh'
    },
    title_vi: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Tiêu đề tiếng Việt'
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      comment: 'Nội dung bài đọc tiếng Anh'
    },
    content_vi: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Bản dịch tiếng Việt'
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'easy'
    },
    word_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Số từ trong bài'
    },
    estimated_time_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Thời gian đọc ước tính (phút)'
    },
    source_type: {
      type: DataTypes.ENUM('system', 'community', 'group'),
      defaultValue: 'system'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'readings',
    indexes: [
      { fields: ['topic_id'] },
      { fields: ['difficulty'] },
      { fields: ['is_approved'] }
    ]
  });

  return Reading;
};
