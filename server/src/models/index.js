'use strict';

const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: dbConfig.define,
    pool: dbConfig.pool
  }
);

// Import models
const User = require('./User')(sequelize);
const Topic = require('./Topic')(sequelize);
const Vocabulary = require('./Vocabulary')(sequelize);
const VocabExample = require('./VocabExample')(sequelize);
const UserVocabProgress = require('./UserVocabProgress')(sequelize);
const ReviewSchedule = require('./ReviewSchedule')(sequelize);
const UserVocabList = require('./UserVocabList')(sequelize);
const UserVocabListItem = require('./UserVocabListItem')(sequelize);

// ===== ASSOCIATIONS =====

// User associations
User.hasMany(UserVocabProgress, { foreignKey: 'user_id', as: 'vocabProgress' });
User.hasMany(ReviewSchedule, { foreignKey: 'user_id', as: 'reviewSchedules' });
User.hasMany(UserVocabList, { foreignKey: 'user_id', as: 'vocabLists' });

// Topic associations
Topic.hasMany(Vocabulary, { foreignKey: 'topic_id', as: 'vocabularies' });

// Vocabulary associations
Vocabulary.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });
Vocabulary.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Vocabulary.hasMany(VocabExample, { foreignKey: 'vocabulary_id', as: 'examples' });
Vocabulary.hasMany(UserVocabProgress, { foreignKey: 'vocabulary_id', as: 'userProgress' });
Vocabulary.hasMany(ReviewSchedule, { foreignKey: 'vocabulary_id', as: 'reviewSchedules' });
Vocabulary.hasMany(UserVocabListItem, { foreignKey: 'vocabulary_id', as: 'listItems' });

// VocabExample associations
VocabExample.belongsTo(Vocabulary, { foreignKey: 'vocabulary_id', as: 'vocabulary' });

// UserVocabProgress associations
UserVocabProgress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserVocabProgress.belongsTo(Vocabulary, { foreignKey: 'vocabulary_id', as: 'vocabulary' });

// ReviewSchedule associations
ReviewSchedule.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ReviewSchedule.belongsTo(Vocabulary, { foreignKey: 'vocabulary_id', as: 'vocabulary' });

// UserVocabList & UserVocabListItem associations
UserVocabList.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserVocabList.hasMany(UserVocabListItem, { foreignKey: 'list_id', as: 'listItems' });

UserVocabListItem.belongsTo(UserVocabList, { foreignKey: 'list_id', as: 'list' });
UserVocabListItem.belongsTo(Vocabulary, { foreignKey: 'vocabulary_id', as: 'vocabulary' });

UserVocabList.belongsToMany(Vocabulary, {
  through: UserVocabListItem,
  foreignKey: 'list_id',
  otherKey: 'vocabulary_id',
  as: 'vocabularies'
});

Vocabulary.belongsToMany(UserVocabList, {
  through: UserVocabListItem,
  foreignKey: 'vocabulary_id',
  otherKey: 'list_id',
  as: 'vocabLists'
});

const db = {
  sequelize,
  Sequelize,
  User,
  Topic,
  Vocabulary,
  VocabExample,
  UserVocabProgress,
  ReviewSchedule,
  UserVocabList,
  UserVocabListItem
};

module.exports = db;
