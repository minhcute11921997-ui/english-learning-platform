const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');

test('MySQL + HTTP regression checks (isolated temporary database)',{
  skip:process.env.RUN_MYSQL_TESTS!=='1',timeout:120000
},async t=>{
  // Explicit opt-in. No application database is opened or reset.
  require('../server/node_modules/dotenv').config({path:require('node:path').join(__dirname,'../server/.env')});
  const mysql=require('../server/node_modules/mysql2/promise');
  const name=`englearn_test_${process.pid}_${Date.now()}`;
  assert.match(name,/^englearn_test_\d+_\d+$/);
  const connection=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||''});
  let db;
  try {
    await connection.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    process.env.NODE_ENV='test';process.env.DB_NAME_TEST=name;
    process.env.JWT_SECRET=randomBytes(48).toString('hex');process.env.JWT_REFRESH_SECRET=randomBytes(48).toString('hex');
    db=require('../server/src/models');await db.sequelize.sync();
    const app=require('../server/src/app'),request=require('../server/node_modules/supertest');
    const register=await request(app).post('/api/auth/register').send({username:'regression',email:'regression@example.test',password:'Test@123456',full_name:'Regression',role:'admin'});
    assert.equal(register.status,201);assert.equal(register.body.data.user.role,'learner');
    const token=register.body.data.accessToken,userId=register.body.data.user.id;
    const auth=r=>r.set('Authorization',`Bearer ${token}`);
    const topic=await db.Topic.create({name:'Regression art',name_vi:'Art'});
    const words=await db.Vocabulary.bulkCreate([1,2,3,4].map(i=>({topic_id:topic.id,word:'word'+i,meaning_vi:'meaning'+i,part_of_speech:'noun',is_approved:true})));
    await t.test('registration cannot access admin API',async()=>{
      assert.equal((await auth(request(app).get('/api/admin/users'))).status,403);
    });
    await t.test('simultaneous HTTP reviews preserve both answers',async()=>{
      const results=await Promise.all([1,2].map(()=>auth(request(app).post(`/api/reviews/${words[0].id}/answer`)).send({quality:4})));
      assert.ok(results.every(r=>r.status===200));
      const p=await db.UserVocabProgress.findOne({where:{user_id:userId,vocabulary_id:words[0].id}});
      assert.equal(p.correct_count,2);assert.equal(await db.ReviewEvent.count({where:{user_id:userId}}),2);
      assert.equal(await db.ReviewSchedule.count({where:{user_id:userId,vocabulary_id:words[0].id}}),1);
    });
    await t.test('server-owned quiz and replay do not inflate progress',async()=>{
      const issued=await auth(request(app).get(`/api/exercises/vocab/${topic.id}?count=4`));assert.equal(issued.status,200);
      const a=issued.body.data;assert.ok(a.exercises.every(q=>q.correct_option===undefined));
      const results=a.exercises.map(q=>({id:q.id,selected_option:null,is_correct:true,quality:5}));
      const url='/api/exercises/vocab/submit',payload={attempt_id:a.attempt_id,results};
      const scored=await auth(request(app).post(url)).send(payload);assert.equal(scored.status,200);assert.equal(scored.body.data.correct,0);
      const count=await db.ReviewEvent.count();const replay=await auth(request(app).post(url)).send(payload);
      assert.deepEqual(replay.body.data,scored.body.data);assert.equal(await db.ReviewEvent.count(),count);
    });
    await t.test('failure during quiz rolls back progress, events and attempt',async()=>{
      const a=(await auth(request(app).get(`/api/exercises/vocab/${topic.id}?count=4`))).body.data;
      const count=await db.ReviewEvent.count();const original=db.ReviewSchedule.create;let calls=0;
      try {
        db.ReviewSchedule.create=async function(...args){if(++calls===2)throw Error('Injected failure');return original.apply(this,args)};
        const r=await auth(request(app).post('/api/exercises/vocab/submit')).send({attempt_id:a.attempt_id,results:a.exercises.map(q=>({id:q.id,selected_option:0}))});
        assert.equal(r.status,500);
      } finally {db.ReviewSchedule.create=original;}
      assert.equal(await db.ReviewEvent.count(),count);assert.equal((await db.ExerciseAttempt.findByPk(a.attempt_id)).result,null);
    });
    await t.test('personal word remains private to its owner',async()=>{
      const list=await db.UserVocabList.create({user_id:userId,name:'Private test'});
      const r=await auth(request(app).post('/api/vocab-lists/words/sync')).send({word:'privateword',meaning_vi:'Private',list_ids:[list.id]});
      assert.equal(r.status,200);
      const id=r.body.data.vocabulary_id;assert.equal((await request(app).get('/api/vocabularies/'+id)).status,404);
      assert.equal((await auth(request(app).get('/api/vocabularies/'+id))).status,200);
    });
  } finally {
    if(db)await db.sequelize.close();
    await connection.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await connection.end();
  }
});
