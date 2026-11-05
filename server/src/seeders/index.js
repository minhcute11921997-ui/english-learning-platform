const {
  User,
  Topic,
  Vocabulary,
  VocabExample,
  UserVocabProgress,
  ReviewSchedule,
  UserVocabList,
  UserVocabListItem,
  sequelize
} = require('../models');

const { topicsData, vocabByTopic } = require('./artVocabData');

// Test users to seed
const usersData = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@enlearn.com',
    password_hash: 'Admin@123',
    full_name: 'Quản Trị Viên Mỹ Thuật',
    role: 'admin',
    learning_goal: 'Quản trị và phát triển hệ thống học thuật ngữ tiếng Anh chuyên ngành Mỹ thuật & Mỹ nghệ.'
  },
  {
    id: 2,
    username: 'teacher01',
    email: 'teacher@enlearn.com',
    password_hash: 'Teacher@123',
    full_name: 'Họa sĩ / Cố vấn Mai Lan',
    role: 'learner',
    learning_goal: 'Nghiên cứu thuật ngữ Mỹ thuật & hướng dẫn học viên tìm hiểu lịch sử nghệ thuật.'
  },
  {
    id: 3,
    username: 'student01',
    email: 'student1@enlearn.com',
    password_hash: 'Student@123',
    full_name: 'Nguyễn Văn Minh',
    role: 'learner',
    learning_goal: 'Học từ vựng về các trường phái hội họa và kỹ thuật vẽ tranh mỗi ngày.'
  },
  {
    id: 4,
    username: 'student02',
    email: 'student2@enlearn.com',
    password_hash: 'Student@123',
    full_name: 'Trần Thị Hà',
    role: 'learner',
    learning_goal: 'Trau dồi thuật ngữ thủ công mỹ nghệ truyền thống và di sản văn hóa.'
  }
];

async function seed() {
  console.log('🎨 Starting Fine Arts & Crafts Database Seeding...');

  // Temporarily disable foreign keys for clean data refresh
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

  try {
    if (process.env.NODE_ENV !== 'production') {
      // Drop obsolete tables if they still exist in database
      await sequelize.query('DROP TABLE IF EXISTS group_reading_sets;');
      await sequelize.query('DROP TABLE IF EXISTS group_vocab_items;');
      await sequelize.query('DROP TABLE IF EXISTS group_vocab_sets;');
      await sequelize.query('DROP TABLE IF EXISTS group_members;');
      await sequelize.query('DROP TABLE IF EXISTS `groups`;');
      await sequelize.query('DROP TABLE IF EXISTS user_answers;');
      await sequelize.query('DROP TABLE IF EXISTS user_reading_attempts;');
      await sequelize.query('DROP TABLE IF EXISTS questions;');
      await sequelize.query('DROP TABLE IF EXISTS readings;');
      await sequelize.query('DROP TABLE IF EXISTS community_posts;');
      await sequelize.query('DROP TABLE IF EXISTS level_assessments;');

      // Clean old topics > 2 and their dependent items
      await sequelize.query('DELETE FROM vocab_examples WHERE vocabulary_id IN (SELECT id FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL);');
      await sequelize.query('DELETE FROM user_vocab_progress WHERE vocabulary_id IN (SELECT id FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL);');
      await sequelize.query('DELETE FROM review_schedules WHERE vocabulary_id IN (SELECT id FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL);');
      await sequelize.query('DELETE FROM user_vocab_list_items WHERE vocabulary_id IN (SELECT id FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL);');
      await sequelize.query('DELETE FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL;');
      await sequelize.query('DELETE FROM topics WHERE id > 2;');
    }
  } catch (cleanErr) {
    console.warn('⚠️ Non-critical notice during table clean:', cleanErr.message);
  }

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

  // Sync schema alterations (adds new columns: image_alt, image_credit, cultural_note, related_artist)
  console.log('🔄 Syncing schema alterations...');
  await sequelize.sync({ alter: true });

  // 1. Seed Topics (2 Fine Arts topics)
  console.log('📌 Seeding 2 Fine Arts & Crafts Topics...');
  for (const topic of topicsData) {
    await Topic.upsert(topic);
  }

  // 2. Seed Users
  console.log('👤 Seeding Test Users...');
  for (const user of usersData) {
    const existing = await User.findOne({ where: { username: user.username } });
    if (!existing) {
      await User.create(user);
    }
  }

  // 3. Seed Vocabularies with rich cultural notes, artists, images & references
  console.log('📚 Seeding 60 Fine Arts Vocabularies with images & cultural side-notes...');
  let vocabCount = 0;
  for (const [topicId, words] of Object.entries(vocabByTopic)) {
    for (const item of words) {
      const [vocab, created] = await Vocabulary.findOrCreate({
        where: { word: item.word, topic_id: parseInt(topicId) },
        defaults: {
          topic_id: parseInt(topicId),
          word: item.word,
          pronunciation: item.pronunciation,
          part_of_speech: item.part_of_speech,
          meaning_vi: item.meaning_vi,
          example_sentence: item.example_sentence,
          example_translation: item.example_translation,
          image_url: item.image_url,
          image_alt: item.image_alt,
          image_credit: item.image_credit,
          cultural_note: item.cultural_note,
          related_artist: item.related_artist,
          source_ref: item.source_ref,
          difficulty: item.difficulty,
          source_type: 'system',
          is_approved: true
        }
      });

      if (!created) {
        await vocab.update({
          pronunciation: item.pronunciation,
          part_of_speech: item.part_of_speech,
          meaning_vi: item.meaning_vi,
          example_sentence: item.example_sentence,
          example_translation: item.example_translation,
          image_url: item.image_url,
          image_alt: item.image_alt,
          image_credit: item.image_credit,
          cultural_note: item.cultural_note,
          related_artist: item.related_artist,
          source_ref: item.source_ref,
          difficulty: item.difficulty
        });
      }

      if (item.example_sentence) {
        await VocabExample.findOrCreate({
          where: { vocabulary_id: vocab.id, sentence: item.example_sentence },
          defaults: {
            vocabulary_id: vocab.id,
            sentence: item.example_sentence,
            translation: item.example_translation
          }
        });
      }
      vocabCount++;
    }
  }
  console.log(`✅ Seeded/Updated ${vocabCount} vocabularies with cultural notes & artwork visuals`);

  // 4. Seed sample progress for student01
  const student = await User.findOne({ where: { username: 'student01' } });
  if (student) {
    const sampleWords = await Vocabulary.findAll({ limit: 8 });
    for (let i = 0; i < sampleWords.length; i++) {
      const w = sampleWords[i];
      const isMastered = i < 3;
      await UserVocabProgress.findOrCreate({
        where: { user_id: student.id, vocabulary_id: w.id },
        defaults: {
          user_id: student.id,
          vocabulary_id: w.id,
          status: isMastered ? 'mastered' : 'learning',
          correct_count: isMastered ? 5 : 2,
          incorrect_count: 0,
          ease_factor: 2.5,
          interval_days: isMastered ? 16 : 1,
          repetition_count: isMastered ? 4 : 1,
          last_reviewed_at: new Date(),
          next_review_at: new Date(Date.now() + (isMastered ? 86400000 * 5 : -3600000))
        }
      });

      await ReviewSchedule.findOrCreate({
        where: { user_id: student.id, vocabulary_id: w.id },
        defaults: {
          user_id: student.id,
          vocabulary_id: w.id,
          scheduled_at: new Date(Date.now() + (isMastered ? 86400000 * 5 : -3600000)),
          is_completed: false,
          source: 'personal'
        }
      });
    }
  }

  console.log('🎉 Fine Arts Database Seeding completed successfully!');
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
