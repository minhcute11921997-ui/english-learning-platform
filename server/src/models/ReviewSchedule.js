const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReviewSchedule = sequelize.define('ReviewSchedule', {
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
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Thời điểm ôn tập dự kiến'
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    source: {
      type: DataTypes.ENUM('personal', 'group'),
      defaultValue: 'personal',
      comment: 'Nguồn: cá nhân hoặc từ nhóm'
    },
    group_vocab_set_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'group_vocab_sets', key: 'id' },
      comment: 'ID bộ từ nhóm (nếu source = group)'
    }
  }, {
    tableName: 'review_schedules',
    indexes: [
      { fields: ['user_id', 'scheduled_at'] },
      { fields: ['is_completed'] }
    ]
  });

  return ReviewSchedule;
};
