const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: { args: [3, 50], msg: 'Username phải từ 3-50 ký tự' },
        isAlphanumeric: { msg: 'Username chỉ chứa chữ cái và số' }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Email không hợp lệ' }
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: { args: [1, 100], msg: 'Họ tên phải từ 1-100 ký tự' }
      }
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('learner', 'group_owner', 'admin'),
      defaultValue: 'learner'
    },
    learning_goal: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mục tiêu học tập của người dùng'
    },
    initial_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Điểm đánh giá đầu vào'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Trạng thái tài khoản (true = hoạt động)'
    }
  }, {
    tableName: 'users',
    hooks: {
      // Mã hóa password trước khi lưu
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      }
    }
  });

  /**
   * Kiểm tra mật khẩu có đúng không
   */
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password_hash);
  };

  /**
   * Ẩn password khi trả về JSON
   */
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  return User;
};
