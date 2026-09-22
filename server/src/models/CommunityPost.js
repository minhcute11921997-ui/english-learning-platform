const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CommunityPost = sequelize.define('CommunityPost', {
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
    content_type: {
      type: DataTypes.ENUM('vocab_set', 'reading'),
      allowNull: false,
      comment: 'Loại nội dung: bộ từ vựng hoặc bài đọc'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content_ids: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Mảng ID từ vựng hoặc bài đọc'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    admin_note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú của admin khi duyệt/từ chối'
    },
    upvote_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'community_posts',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['content_type'] }
    ]
  });

  return CommunityPost;
};
