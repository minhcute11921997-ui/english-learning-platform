const {
  User,
  Topic,
  Vocabulary,
  VocabExample,
  Reading,
  Question,
  Group,
  GroupMember,
  GroupVocabSet,
  GroupVocabItem,
  GroupReadingSet,
  UserVocabProgress,
  ReviewSchedule,
  UserVocabListItem,
  UserReadingAttempt,
  UserAnswer,
  sequelize
} = require('../models');

const { topicsData, vocabByTopic } = require('./artVocabData');
const { readingsData } = require('./artReadingsData');
const { placementQuestionsData } = require('./artPlacementData');

// Test users to seed
const usersData = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@enlearn.com',
    password_hash: 'Admin@123',
    full_name: 'Quản Trị Viên Hệ Thống',
    role: 'admin',
    learning_goal: 'Quản trị và phát triển hệ thống học tiếng Anh chuyên đề Mỹ thuật toàn diện.',
    initial_level: 100
  },
  {
    id: 2,
    username: 'teacher01',
    email: 'teacher@enlearn.com',
    password_hash: 'Teacher@123',
    full_name: 'Cô Giáo Mai Lan',
    role: 'group_owner',
    learning_goal: 'Biên soạn tài liệu thuật ngữ Mỹ thuật & hướng dẫn học viên thực hành.',
    initial_level: 95
  },
  {
    id: 3,
    username: 'student01',
    email: 'student1@enlearn.com',
    password_hash: 'Student@123',
    full_name: 'Nguyễn Văn Minh',
    role: 'learner',
    learning_goal: 'Học từ vựng về các trường phái hội họa và kỹ thuật vẽ tranh mỗi ngày.',
    initial_level: 45
  },
  {
    id: 4,
    username: 'student02',
    email: 'student2@enlearn.com',
    password_hash: 'Student@123',
    full_name: 'Trần Thị Hà',
    role: 'learner',
    learning_goal: 'Trau dồi thuật ngữ mỹ nghệ truyền thống và kỹ năng đọc hiểu chuyên ngành.',
    initial_level: 60
  }
];

async function seed() {
  console.log('🎨 Starting Fine Arts & Crafts Database Seeding...');

  // Ensure tables sync
  await sequelize.sync();

  // Temporarily disable foreign keys for clean data refresh
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

  // Clean old topics > 2 and their dependent items
  try {
    await sequelize.query('DELETE FROM questions WHERE reading_id IN (SELECT id FROM readings WHERE topic_id > 2);');
    await sequelize.query('DELETE FROM group_reading_sets WHERE reading_id IN (SELECT id FROM readings WHERE topic_id > 2);');
    await sequelize.query('DELETE FROM user_reading_attempts WHERE reading_id IN (SELECT id FROM readings WHERE topic_id > 2);');
    await sequelize.query('DELETE FROM readings WHERE topic_id > 2;');

    await sequelize.query('DELETE FROM vocab_examples WHERE vocabulary_id IN (SELECT id FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL);');
    await sequelize.query('DELETE FROM user_vocab_progress WHERE vocabulary_id IN (SELECT id FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL);');
    await sequelize.query('DELETE FROM review_schedules WHERE vocabulary_id IN (SELECT id FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL);');
    await sequelize.query('DELETE FROM user_vocab_list_items WHERE vocabulary_id IN (SELECT id FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL);');
    await sequelize.query('DELETE FROM group_vocab_items WHERE vocabulary_id IN (SELECT id FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL);');
    await sequelize.query('DELETE FROM vocabularies WHERE topic_id > 2 OR source_ref IS NULL;');

    await sequelize.query('DELETE FROM topics WHERE id > 2;');
  } catch (cleanErr) {
    console.warn('⚠️ Non-critical notice during table clean:', cleanErr.message);
  }

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

  // 1. Seed Topics (2 Fine Arts topics)
  console.log('📌 Seeding 2 Fine Arts Topics...');
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

  // 3. Seed Vocabularies with source_ref and image_url
  console.log('📚 Seeding 60 Fine Arts Vocabularies with images & references...');
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
  console.log(`✅ Seeded/Updated ${vocabCount} vocabularies`);

  // 4. Seed Readings and Questions
  console.log('📖 Seeding 6 Fine Arts Readings with 24 comprehension questions...');
  for (const r of readingsData) {
    const { questions, ...readingInfo } = r;
    const [reading] = await Reading.findOrCreate({
      where: { title: readingInfo.title },
      defaults: {
        ...readingInfo,
        source_type: 'system',
        is_approved: true
      }
    });

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await Question.findOrCreate({
        where: { reading_id: reading.id, display_order: i },
        defaults: {
          reading_id: reading.id,
          question_text: q.question_text,
          question_text_vi: q.question_text_vi,
          options: q.options,
          correct_option: q.correct_option,
          explanation_vi: q.explanation_vi,
          display_order: i
        }
      });
    }
  }

  // 5. Seed Sample Study Group
  console.log('👥 Seeding Fine Arts Study Group & Vocab Set...');
  const teacher = await User.findOne({ where: { username: 'teacher01' } });
  const student1 = await User.findOne({ where: { username: 'student01' } });
  const student2 = await User.findOne({ where: { username: 'student02' } });

  if (teacher) {
    const [group] = await Group.findOrCreate({
      where: { invite_code: 'ART101' },
      defaults: {
        owner_id: teacher.id,
        name: 'CLB Mỹ Thuật & Di Sản Thủ Công',
        description: 'Nhóm học tập, thảo luận thuật ngữ nghệ thuật thị giác và phân tích tác phẩm hội họa.',
        invite_code: 'ART101',
        is_active: true
      }
    });

    await GroupMember.findOrCreate({
      where: { group_id: group.id, user_id: teacher.id },
      defaults: { group_id: group.id, user_id: teacher.id, role: 'owner' }
    });

    if (student1) {
      await GroupMember.findOrCreate({
        where: { group_id: group.id, user_id: student1.id },
        defaults: { group_id: group.id, user_id: student1.id, role: 'member' }
      });
    }

    if (student2) {
      await GroupMember.findOrCreate({
        where: { group_id: group.id, user_id: student2.id },
        defaults: { group_id: group.id, user_id: student2.id, role: 'member' }
      });
    }

    const [vocabSet] = await GroupVocabSet.findOrCreate({
      where: { group_id: group.id, title: 'Thuật Ngữ Hội Họa Kinh Điển' },
      defaults: {
        group_id: group.id,
        created_by: teacher.id,
        title: 'Thuật Ngữ Hội Họa Kinh Điển',
        description: 'Bộ 10 thuật ngữ nền tảng về thể loại tranh và kỹ thuật vẽ chuyên nghiệp.',
        is_published: true
      }
    });

    const sampleVocabs = await Vocabulary.findAll({ where: { topic_id: 1 }, limit: 10 });
    for (let idx = 0; idx < sampleVocabs.length; idx++) {
      await GroupVocabItem.findOrCreate({
        where: { vocab_set_id: vocabSet.id, vocabulary_id: sampleVocabs[idx].id },
        defaults: {
          vocab_set_id: vocabSet.id,
          vocabulary_id: sampleVocabs[idx].id,
          display_order: idx
        }
      });
    }

    const sampleReading = await Reading.findOne({ where: { topic_id: 1 } });
    if (sampleReading) {
      await GroupReadingSet.findOrCreate({
        where: { group_id: group.id, reading_id: sampleReading.id },
        defaults: {
          group_id: group.id,
          reading_id: sampleReading.id,
          created_by: teacher.id,
          is_published: true
        }
      });
    }
  }

  console.log('🎉 Fine Arts Database Seeding completed successfully!');
}

module.exports = { seed, placementQuestionsData };

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
