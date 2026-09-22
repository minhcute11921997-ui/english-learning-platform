const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Topic = sequelize.define('Topic', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Tên chủ đề tiếng Anh'
    },
    name_vi: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Tên chủ đề tiếng Việt'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Tên icon (react-icons)'
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Thứ tự hiển thị'
    }
  }, {
    tableName: 'topics'
  });

  return Topic;
};
