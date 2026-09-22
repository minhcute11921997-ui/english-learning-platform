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
const Reading = require('./Reading')(sequelize);
const Question = require('./Question')(sequelize);
const UserVocabProgress = require('./UserVocabProgress')(sequelize);
const ReviewSchedule = require('./ReviewSchedule')(sequelize);
const UserReadingAttempt = require('./UserReadingAttempt')(sequelize);
const UserAnswer = require('./UserAnswer')(sequelize);
const LevelAssessment = require('./LevelAssessment')(sequelize);
const Group = require('./Group')(sequelize);
const GroupMember = require('./GroupMember')(sequelize);
const GroupVocabSet = require('./GroupVocabSet')(sequelize);
const GroupVocabItem = require('./GroupVocabItem')(sequelize);
const GroupReadingSet = require('./GroupReadingSet')(sequelize);
const CommunityPost = require('./CommunityPost')(sequelize);

// ===== ASSOCIATIONS =====

// User associations
User.hasMany(UserVocabProgress, { foreignKey: 'user_id', as: 'vocabProgress' });
User.hasMany(UserReadingAttempt, { foreignKey: 'user_id', as: 'readingAttempts' });
User.hasMany(ReviewSchedule, { foreignKey: 'user_id', as: 'reviewSchedules' });
User.hasMany(LevelAssessment, { foreignKey: 'user_id', as: 'assessments' });
User.hasMany(Group, { foreignKey: 'owner_id', as: 'ownedGroups' });
User.hasMany(GroupMember, { foreignKey: 'user_id', as: 'groupMemberships' });
User.hasMany(CommunityPost, { foreignKey: 'user_id', as: 'communityPosts' });

// Topic associations
Topic.hasMany(Vocabulary, { foreignKey: 'topic_id', as: 'vocabularies' });
Topic.hasMany(Reading, { foreignKey: 'topic_id', as: 'readings' });

// Vocabulary associations
Vocabulary.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });
Vocabulary.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Vocabulary.hasMany(VocabExample, { foreignKey: 'vocabulary_id', as: 'examples' });
Vocabulary.hasMany(UserVocabProgress, { foreignKey: 'vocabulary_id', as: 'userProgress' });
Vocabulary.hasMany(ReviewSchedule, { foreignKey: 'vocabulary_id', as: 'reviewSchedules' });

// VocabExample associations
VocabExample.belongsTo(Vocabulary, { foreignKey: 'vocabulary_id', as: 'vocabulary' });

// Reading associations
Reading.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });
Reading.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Reading.hasMany(Question, { foreignKey: 'reading_id', as: 'questions' });
Reading.hasMany(UserReadingAttempt, { foreignKey: 'reading_id', as: 'attempts' });

// Question associations
Question.belongsTo(Reading, { foreignKey: 'reading_id', as: 'reading' });
Question.hasMany(UserAnswer, { foreignKey: 'question_id', as: 'userAnswers' });

// UserVocabProgress associations
UserVocabProgress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserVocabProgress.belongsTo(Vocabulary, { foreignKey: 'vocabulary_id', as: 'vocabulary' });

// ReviewSchedule associations
ReviewSchedule.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ReviewSchedule.belongsTo(Vocabulary, { foreignKey: 'vocabulary_id', as: 'vocabulary' });
ReviewSchedule.belongsTo(GroupVocabSet, { foreignKey: 'group_vocab_set_id', as: 'groupVocabSet' });

// UserReadingAttempt associations
UserReadingAttempt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserReadingAttempt.belongsTo(Reading, { foreignKey: 'reading_id', as: 'reading' });
UserReadingAttempt.hasMany(UserAnswer, { foreignKey: 'attempt_id', as: 'answers' });

// UserAnswer associations
UserAnswer.belongsTo(UserReadingAttempt, { foreignKey: 'attempt_id', as: 'attempt' });
UserAnswer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// LevelAssessment associations
LevelAssessment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Group associations
Group.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
Group.hasMany(GroupMember, { foreignKey: 'group_id', as: 'members' });
Group.hasMany(GroupVocabSet, { foreignKey: 'group_id', as: 'vocabSets' });
Group.hasMany(GroupReadingSet, { foreignKey: 'group_id', as: 'readingSets' });

// GroupMember associations
GroupMember.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
GroupMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// GroupVocabSet associations
GroupVocabSet.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
GroupVocabSet.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
GroupVocabSet.hasMany(GroupVocabItem, { foreignKey: 'vocab_set_id', as: 'items' });
GroupVocabSet.hasMany(ReviewSchedule, { foreignKey: 'group_vocab_set_id', as: 'reviewSchedules' });

// GroupVocabItem associations
GroupVocabItem.belongsTo(GroupVocabSet, { foreignKey: 'vocab_set_id', as: 'vocabSet' });
GroupVocabItem.belongsTo(Vocabulary, { foreignKey: 'vocabulary_id', as: 'vocabulary' });

// GroupReadingSet associations
GroupReadingSet.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
GroupReadingSet.belongsTo(Reading, { foreignKey: 'reading_id', as: 'reading' });
GroupReadingSet.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// CommunityPost associations
CommunityPost.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

const db = {
  sequelize,
  Sequelize,
  User,
  Topic,
  Vocabulary,
  VocabExample,
  Reading,
  Question,
  UserVocabProgress,
  ReviewSchedule,
  UserReadingAttempt,
  UserAnswer,
  LevelAssessment,
  Group,
  GroupMember,
  GroupVocabSet,
  GroupVocabItem,
  GroupReadingSet,
  CommunityPost
};

module.exports = db;
