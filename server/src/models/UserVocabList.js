const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserVocabList = sequelize.define('UserVocabList', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(30),
      defaultValue: '#195646'
    }
  }, {
    tableName: 'user_vocab_lists',
    indexes: [
      { fields: ['user_id'] }
    ]
  });

  return UserVocabList;
};
