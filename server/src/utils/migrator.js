const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

/**
 * Chạy tuần tự các migration chưa áp dụng và ghi nhận vào bảng SequelizeMeta.
 * An toàn với cả mock Sequelize trong unit test (bỏ qua nếu không có QueryInterface).
 */
async function runMigrations(sequelize) {
  if (!sequelize || typeof sequelize.getQueryInterface !== 'function') {
    return [];
  }

  const queryInterface = sequelize.getQueryInterface();
  await sequelize.query(
    'CREATE TABLE IF NOT EXISTS `SequelizeMeta` (`name` VARCHAR(255) NOT NULL PRIMARY KEY) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;'
  );

  const [appliedRows] = await sequelize.query('SELECT `name` FROM `SequelizeMeta`');
  const applied = new Set(appliedRows.map((r) => r.name));

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.js'))
    .sort();

  const newlyApplied = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const migration = require(path.join(MIGRATIONS_DIR, file));
    if (typeof migration.up === 'function') {
      await migration.up(queryInterface, Sequelize);
      await sequelize.query('INSERT INTO `SequelizeMeta` (`name`) VALUES (?)', {
        replacements: [file]
      });
      newlyApplied.push(file);
    }
  }

  return newlyApplied;
}

module.exports = { runMigrations };
