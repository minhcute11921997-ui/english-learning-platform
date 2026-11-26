// Runs pending Sequelize migrations first, then ensures base models are synced without destructive alters.
const { sequelize } = require('./models');
const { runMigrations } = require('./utils/migrator');

async function bootstrap() {
  await sequelize.authenticate();
  await runMigrations(sequelize);
  await sequelize.sync();
  if (process.env.SEED_DEMO === 'true') {
    if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production');
    await require('./seeders').seed();
  }
}

if (require.main === module) {
  bootstrap()
    .then(() => sequelize.close())
    .catch(async (err) => {
      console.error('Bootstrap failed:', err.message);
      await sequelize.close();
      process.exitCode = 1;
    });
}

module.exports = bootstrap;
