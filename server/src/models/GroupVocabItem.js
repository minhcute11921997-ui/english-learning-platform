const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupVocabItem = sequelize.define('GroupVocabItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    vocab_set_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'group_vocab_sets', key: 'id' }
    },
    vocabulary_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vocabularies', key: 'id' }
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'group_vocab_items',
    indexes: [
      { unique: true, fields: ['vocab_set_id', 'vocabulary_id'] }
    ]
  });

  return GroupVocabItem;
};
