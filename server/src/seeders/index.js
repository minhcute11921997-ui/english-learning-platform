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

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo seeding is disabled in production');
  }
  // Only create missing tables; existing user data and schemas are preserved.
  await sequelize.sync();

  // 1. Seed Topics (2 Fine Arts topics)
  console.log('📌 Seeding 2 Fine Arts & Crafts Topics...');
  const legacyTopicNames = {
    'Fine Crafts & Handicrafts': ['Fine Arts & Crafts Professions']
  };
  const topicIds = new Map();
  for (const topic of topicsData) {
    const { id, ...values } = topic;
    const candidateNames = [topic.name, ...(legacyTopicNames[topic.name] || [])];
    let savedTopic = await Topic.findOne({ where: { name: candidateNames } });
    if (!savedTopic) {
      savedTopic = await Topic.create(values);
    } else {
      const updates = { name: values.name, name_vi: values.name_vi };
      if (values.icon !== undefined) updates.icon = values.icon;
      if (values.display_order !== undefined) updates.display_order = values.display_order;
      if (values.description !== undefined) updates.description = values.description;
      await savedTopic.update(updates);
    }
    topicIds.set(String(id), savedTopic.id);
  }

  // 2. Seed Users
  console.log('👤 Seeding Test Users...');
  for (const user of usersData) {
    const existing = await User.findOne({ where: { username: user.username } });
    if (!existing) {
      const { id: _demoId, ...values } = user;
      await User.create(values);
    }
  }

  // 3. Seed Vocabularies with rich cultural notes, artists, images & references
  const totalDefined = Object.values(vocabByTopic).reduce((sum, list) => sum + list.length, 0);
  console.log(`📚 Seeding ${totalDefined} Fine Arts Vocabularies with images & cultural side-notes...`);
  const activeWords = new Set();
  let vocabCount = 0;
  for (const [topicId, words] of Object.entries(vocabByTopic)) {
    const savedTopicId = topicIds.get(topicId);
    if (!savedTopicId) throw new Error(`Seed topic ${topicId} is missing`);
    for (const item of words) {
      activeWords.add(String(item.word).toLowerCase());
      const [vocab, created] = await Vocabulary.findOrCreate({
        where: { word: item.word, topic_id: savedTopicId },
        defaults: {
          topic_id: savedTopicId,
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

      if (!created && vocab.source_type === 'system' && !vocab.created_by) {
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
          difficulty: item.difficulty,
          is_approved: true
        });
      }

      if (!created && (vocab.source_type !== 'system' || vocab.created_by)) continue;

      if (item.example_sentence) {
        const [example, exCreated] = await VocabExample.findOrCreate({
          where: { vocabulary_id: vocab.id, sentence: item.example_sentence },
          defaults: {
            vocabulary_id: vocab.id,
            sentence: item.example_sentence,
            translation: item.example_translation
          }
        });
        if (!exCreated && item.example_translation && example.translation !== item.example_translation) {
          await example.update({ translation: item.example_translation });
        }
      }
      vocabCount++;
    }
  }

  if (activeWords.size > 0) {
    const systemVocabs = await Vocabulary.findAll({
      where: { source_type: 'system', is_approved: true }
    });
    for (const sv of systemVocabs) {
      if (!sv.created_by && !activeWords.has(String(sv.word || '').toLowerCase())) {
        await sv.update({ is_approved: false });
      }
    }
  }
  console.log(`✅ Seeded/Updated ${vocabCount} vocabularies with cultural notes & artwork visuals`);

  // 4. Seed sample progress for student01
  const student = await User.findOne({ where: { username: 'student01' } });
  if (student) {
    const sampleWords = await Vocabulary.findAll({
      where: { source_type: 'system', is_approved: true, topic_id: [...topicIds.values()] },
      limit: 8
    });
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
