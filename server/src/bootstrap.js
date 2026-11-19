// Only creates missing tables. Existing data/columns are never dropped or altered.
const { sequelize } = require('./models');
async function bootstrap() {
  await sequelize.authenticate();
  await sequelize.sync();
  if (process.env.SEED_DEMO === 'true') {
    if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production');
    await require('./seeders').seed();
  }
}
if (require.main === module) bootstrap().then(()=>sequelize.close()).catch(async err=>{
  console.error('Bootstrap failed:',err.message);await sequelize.close();process.exitCode=1;
});
module.exports=bootstrap;
