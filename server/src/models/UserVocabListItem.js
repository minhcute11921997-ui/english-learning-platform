const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserVocabListItem = sequelize.define('UserVocabListItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    list_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'user_vocab_lists', key: 'id' },
      onDelete: 'CASCADE'
    },
    vocabulary_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vocabularies', key: 'id' },
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'user_vocab_list_items',
    indexes: [
      { unique: true, fields: ['list_id', 'vocabulary_id'] },
      { fields: ['list_id'] },
      { fields: ['vocabulary_id'] }
    ]
  });

  return UserVocabListItem;
};
