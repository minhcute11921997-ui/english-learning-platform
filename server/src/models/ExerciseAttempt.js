const { DataTypes } = require('sequelize');

module.exports = sequelize => sequelize.define('ExerciseAttempt', {
  id: { type: DataTypes.UUID, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: {model:'users',key:'id'}, onDelete:'CASCADE' },
  topic_id: { type: DataTypes.INTEGER, allowNull: false, references: {model:'topics',key:'id'}, onDelete:'CASCADE' },
  // Issued questions and answer keys remain server-owned until submission.
  questions: { type: DataTypes.JSON, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  result: { type: DataTypes.JSON, allowNull: true, defaultValue: null }
}, { tableName: 'exercise_attempts', indexes: [{fields:['user_id','expires_at']}] });
