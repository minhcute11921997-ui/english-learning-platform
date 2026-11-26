'use strict';

async function getExistingTables(queryInterface) {
  const raw = await queryInterface.showAllTables();
  return new Set(
    raw.map((t) => (typeof t === 'string' ? t : Object.values(t)[0]).toLowerCase())
  );
}

async function addColIfMissing(queryInterface, table, existingCols, colName, definition) {
  if (!existingCols[colName]) {
    await queryInterface.addColumn(table, colName, definition);
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

    // 1. Bổ sung cột vòng đời tài khoản & bảo vệ brute-force vào bảng users
    if (existing.has('users')) {
      const userCols = await queryInterface.describeTable('users');
      await addColIfMissing(queryInterface, 'users', userCols, 'email_verified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      await addColIfMissing(queryInterface, 'users', userCols, 'email_verification_token', {
        type: Sequelize.STRING(128),
        allowNull: true
      });
      await addColIfMissing(queryInterface, 'users', userCols, 'password_reset_token', {
        type: Sequelize.STRING(128),
        allowNull: true
      });
      await addColIfMissing(queryInterface, 'users', userCols, 'password_reset_expires', {
        type: Sequelize.DATE,
        allowNull: true
      });
      await addColIfMissing(queryInterface, 'users', userCols, 'failed_login_attempts', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
      await addColIfMissing(queryInterface, 'users', userCols, 'locked_until', {
        type: Sequelize.DATE,
        allowNull: true
      });
      await addColIfMissing(queryInterface, 'users', userCols, 'google_id', {
        type: Sequelize.STRING(128),
        allowNull: true,
        unique: true
      });
    }

    // 2. Tạo bảng refresh_tokens phục vụ Rotation & Revocation
    if (!existing.has('refresh_tokens')) {
      await queryInterface.createTable(
        'refresh_tokens',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE'
          },
          token_hash: { type: Sequelize.STRING(128), allowNull: false, unique: true },
          expires_at: { type: Sequelize.DATE, allowNull: false },
          revoked_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
          replaced_by_hash: { type: Sequelize.STRING(128), allowNull: true, defaultValue: null },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        },
        { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
      );
      await safeAddIndex(queryInterface, 'refresh_tokens', ['user_id', 'revoked_at'], {
        name: 'idx_refresh_tokens_user_revoked'
      });
    }

    // 3. Tạo bảng admin_audit_logs lưu nhật ký thao tác quản trị
    if (!existing.has('admin_audit_logs')) {
      await queryInterface.createTable(
        'admin_audit_logs',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          admin_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL'
          },
          action: { type: Sequelize.STRING(64), allowNull: false },
          target_type: { type: Sequelize.STRING(64), allowNull: false },
          target_id: { type: Sequelize.STRING(64), allowNull: true },
          details: { type: Sequelize.JSON, allowNull: true },
          ip_address: { type: Sequelize.STRING(64), allowNull: true },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        },
        { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
      );
      await safeAddIndex(queryInterface, 'admin_audit_logs', ['admin_id', 'created_at'], {
        name: 'idx_admin_audit_admin_time'
      });
      await safeAddIndex(queryInterface, 'admin_audit_logs', ['action', 'created_at'], {
        name: 'idx_admin_audit_action_time'
      });
    }

    // 4. Composite indexes tối ưu các truy vấn lớn
    if (existing.has('review_schedules')) {
      await safeAddIndex(
        queryInterface,
        'review_schedules',
        ['user_id', 'is_completed', 'scheduled_at'],
        { name: 'idx_review_schedules_user_completed_sched' }
      );
    }
    if (existing.has('user_vocab_progress')) {
      await safeAddIndex(
        queryInterface,
        'user_vocab_progress',
        ['user_id', 'status', 'next_review_at'],
        { name: 'idx_user_vocab_progress_user_status_next' }
      );
    }
    if (existing.has('vocabularies')) {
      await safeAddIndex(
        queryInterface,
        'vocabularies',
        ['topic_id', 'is_approved', 'difficulty'],
        { name: 'idx_vocabularies_topic_approved_diff' }
      );
    }
  },

  async down(queryInterface) {
    const existing = await getExistingTables(queryInterface);
    if (existing.has('admin_audit_logs')) {
      await queryInterface.dropTable('admin_audit_logs');
    }
    if (existing.has('refresh_tokens')) {
      await queryInterface.dropTable('refresh_tokens');
    }
    if (existing.has('users')) {
      const userCols = await queryInterface.describeTable('users');
      for (const col of [
        'google_id',
        'locked_until',
        'failed_login_attempts',
        'password_reset_expires',
        'password_reset_token',
        'email_verification_token',
        'email_verified'
      ]) {
        if (userCols[col]) {
          await queryInterface.removeColumn('users', col);
        }
      }
    }
  }
};
