'use strict';

async function getExistingTables(queryInterface) {
  const raw = await queryInterface.showAllTables();
  return new Set(
    raw.map((t) => (typeof t === 'string' ? t : Object.values(t)[0]).toLowerCase())
  );
}

async function createIfMissing(queryInterface, existing, tableName, attributes, options = {}) {
  if (!existing.has(tableName.toLowerCase())) {
    await queryInterface.createTable(tableName, attributes, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      ...options
    });
    existing.add(tableName.toLowerCase());
  }
}

async function safeAddIndex(queryInterface, tableName, fields, options) {
  try {
    await queryInterface.addIndex(tableName, fields, options);
  } catch (err) {
    if (!/Duplicate key name|already exists/i.test(err.message)) {
      throw err;
    }
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await getExistingTables(queryInterface);

    await createIfMissing(queryInterface, existing, 'users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      username: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      email: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      full_name: { type: Sequelize.STRING(100), allowNull: false },
      avatar_url: { type: Sequelize.STRING(500), allowNull: true },
      role: { type: Sequelize.ENUM('learner', 'admin'), defaultValue: 'learner' },
      learning_goal: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createIfMissing(queryInterface, existing, 'topics', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      name_vi: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      icon: { type: Sequelize.STRING(50), allowNull: true },
      display_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createIfMissing(queryInterface, existing, 'vocabularies', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      topic_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'topics', key: 'id' },
        onDelete: 'CASCADE'
      },
      word: { type: Sequelize.STRING(100), allowNull: false },
      pronunciation: { type: Sequelize.STRING(200), allowNull: true },
      part_of_speech: {
        type: Sequelize.ENUM('noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'determiner', 'exclamation'),
        allowNull: false
      },
      meaning_vi: { type: Sequelize.STRING(500), allowNull: false },
      example_sentence: { type: Sequelize.TEXT, allowNull: true },
      example_translation: { type: Sequelize.TEXT, allowNull: true },
      image_url: { type: Sequelize.STRING(500), allowNull: true },
      image_alt: { type: Sequelize.STRING(300), allowNull: true },
      image_credit: { type: Sequelize.STRING(300), allowNull: true },
      cultural_note: { type: Sequelize.TEXT, allowNull: true },
      related_artist: { type: Sequelize.STRING(255), allowNull: true },
      audio_url: { type: Sequelize.STRING(500), allowNull: true },
      difficulty: { type: Sequelize.ENUM('easy', 'medium', 'hard'), defaultValue: 'easy' },
      source_ref: { type: Sequelize.STRING(255), allowNull: true },
      source_type: { type: Sequelize.ENUM('system', 'community'), defaultValue: 'system' },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      is_approved: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await safeAddIndex(queryInterface, 'vocabularies', ['topic_id'], { name: 'idx_vocab_topic_id' });
    await safeAddIndex(queryInterface, 'vocabularies', ['word'], { name: 'idx_vocab_word' });
    await safeAddIndex(queryInterface, 'vocabularies', ['difficulty'], { name: 'idx_vocab_difficulty' });
    await safeAddIndex(queryInterface, 'vocabularies', ['is_approved'], { name: 'idx_vocab_is_approved' });

    await createIfMissing(queryInterface, existing, 'vocab_examples', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      vocabulary_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'vocabularies', key: 'id' },
        onDelete: 'CASCADE'
      },
      sentence: { type: Sequelize.TEXT, allowNull: false },
      translation: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createIfMissing(queryInterface, existing, 'user_vocab_progress', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      vocabulary_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'vocabularies', key: 'id' },
        onDelete: 'CASCADE'
      },
      status: { type: Sequelize.ENUM('new', 'learning', 'mastered'), defaultValue: 'new' },
      correct_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      incorrect_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      ease_factor: { type: Sequelize.FLOAT, defaultValue: 2.5 },
      interval_days: { type: Sequelize.INTEGER, defaultValue: 0 },
      repetition_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      last_reviewed_at: { type: Sequelize.DATE, allowNull: true },
      next_review_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await safeAddIndex(queryInterface, 'user_vocab_progress', ['user_id', 'vocabulary_id'], {
      unique: true,
      name: 'uniq_progress_user_vocab'
    });

    await createIfMissing(queryInterface, existing, 'review_schedules', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      vocabulary_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'vocabularies', key: 'id' },
        onDelete: 'CASCADE'
      },
      scheduled_at: { type: Sequelize.DATE, allowNull: false },
      is_completed: { type: Sequelize.BOOLEAN, defaultValue: false },
      source: { type: Sequelize.STRING(20), defaultValue: 'personal' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createIfMissing(queryInterface, existing, 'user_vocab_lists', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      color: { type: Sequelize.STRING(30), defaultValue: '#195646' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createIfMissing(queryInterface, existing, 'user_vocab_list_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      list_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'user_vocab_lists', key: 'id' },
        onDelete: 'CASCADE'
      },
      vocabulary_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'vocabularies', key: 'id' },
        onDelete: 'CASCADE'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createIfMissing(queryInterface, existing, 'ai_feedback', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      image_hash: { type: Sequelize.STRING(64), allowNull: false },
      predicted_word: { type: Sequelize.STRING(100), allowNull: true },
      corrected_word: { type: Sequelize.STRING(100), allowNull: true },
      is_correct: { type: Sequelize.BOOLEAN, allowNull: false },
      tier: { type: Sequelize.INTEGER, allowNull: true },
      confidence: { type: Sequelize.FLOAT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createIfMissing(queryInterface, existing, 'exercise_attempts', {
      id: { type: Sequelize.UUID, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      topic_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'topics', key: 'id' },
        onDelete: 'CASCADE'
      },
      questions: { type: Sequelize.JSON, allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      result: { type: Sequelize.JSON, allowNull: true, defaultValue: null },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await createIfMissing(queryInterface, existing, 'review_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      vocabulary_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'vocabularies', key: 'id' },
        onDelete: 'SET NULL'
      },
      quality: { type: Sequelize.INTEGER, allowNull: false },
      reviewed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  async down(queryInterface) {
    const tables = [
      'review_events',
      'exercise_attempts',
      'ai_feedback',
      'user_vocab_list_items',
      'user_vocab_lists',
      'review_schedules',
      'user_vocab_progress',
      'vocab_examples',
      'vocabularies',
      'topics',
      'users'
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
  }
};
