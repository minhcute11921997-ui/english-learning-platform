#!/usr/bin/env node
/**
 * 🗄️ Database Reset & Seed
 * Reset database và chạy seed data
 *
 * Usage:
 *   node db-reset.js           - Reset DB (drop & recreate)
 *   node db-reset.js --seed    - Reset DB + seed data
 *   node db-reset.js --seed-only - Chỉ seed data (không reset)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });

async function main() {
  const args = process.argv.slice(2);
  const shouldSeed = args.includes('--seed') || args.includes('--seed-only');
  const seedOnly = args.includes('--seed-only');

  console.log('🗄️  Database Reset Tool\n');

  try {
    // Dynamic import of sequelize config
    const sequelize = require(path.resolve(__dirname, '../../server/src/config/database'));
    
    if (!seedOnly) {
      console.log('⏳ Dropping all tables...');
      await sequelize.drop();
      console.log('✅ All tables dropped');

      console.log('⏳ Recreating tables...');
      await sequelize.sync({ force: true });
      console.log('✅ Tables recreated');
    }

    if (shouldSeed) {
      console.log('⏳ Seeding database...');
      const seeder = require(path.resolve(__dirname, '../../server/src/seeders'));
      await seeder.run();
      console.log('✅ Database seeded successfully');
    }

    console.log('\n🎉 Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
