const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupVocabSet = sequelize.define('GroupVocabSet', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'groups', key: 'id' }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Đã phát hành cho thành viên chưa'
    }
  }, {
    tableName: 'group_vocab_sets',
    indexes: [
      { fields: ['group_id'] }
    ]
  });

  return GroupVocabSet;
};
