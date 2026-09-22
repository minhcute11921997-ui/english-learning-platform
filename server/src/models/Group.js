const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Group = sequelize.define('Group', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: { args: [2, 100], msg: 'Tên nhóm phải từ 2-100 ký tự' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    invite_code: {
      type: DataTypes.STRING(20),
      unique: true,
      comment: 'Mã mời tham gia nhóm'
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'groups',
    hooks: {
      // Tự động tạo mã mời khi tạo nhóm
      beforeCreate: (group) => {
        if (!group.invite_code) {
          group.invite_code = crypto.randomUUID().substring(0, 8).toUpperCase();
        }
      }
    }
  });

  /**
   * Tạo lại mã mời mới
   */
  Group.prototype.regenerateInviteCode = async function() {
    this.invite_code = crypto.randomUUID().substring(0, 8).toUpperCase();
    await this.save();
    return this.invite_code;
  };

  return Group;
};
