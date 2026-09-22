const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupMember = sequelize.define('GroupMember', {
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    role: {
      type: DataTypes.ENUM('owner', 'member'),
      defaultValue: 'member'
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'group_members',
    indexes: [
      { unique: true, fields: ['group_id', 'user_id'] }
    ]
  });

  return GroupMember;
};
