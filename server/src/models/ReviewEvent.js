const { DataTypes } = require('sequelize');

module.exports = sequelize => sequelize.define('ReviewEvent', {
  id: { type: DataTypes.INTEGER, primaryKey:true, autoIncrement:true },
  user_id: { type: DataTypes.INTEGER, allowNull:false, references:{model:'users',key:'id'}, onDelete:'CASCADE' },
  // Preserve historical counts when an administrator deletes a vocabulary item.
  vocabulary_id: { type: DataTypes.INTEGER, allowNull:true, references:{model:'vocabularies',key:'id'}, onDelete:'SET NULL' },
  quality: { type: DataTypes.INTEGER, allowNull:false, validate:{min:0,max:5} },
  reviewed_at: { type: DataTypes.DATE, allowNull:false, defaultValue:DataTypes.NOW }
}, {tableName:'review_events', indexes:[{fields:['user_id','reviewed_at']}]});
