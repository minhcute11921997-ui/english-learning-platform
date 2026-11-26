const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {load,read,response,baseMocks,Op,database}=require('./helpers.cjs');
function controller(file,db,extra={}) {return load('server/src/controllers/'+file,{...baseMocks,'../models':db.models,...extra})}
function exercise(db) {
 const srs=load('server/src/services/srs.service.js',{...baseMocks,'../models':db.models});
 return controller('exercise.controller.js',db,{'../services/srs.service':srs});
}
async function attempt(c){const r=response();await c.getVocabExercises({user:{id:1},params:{topicId:1},query:{count:4}},r);return r.body.data;}
test('R01 public registration cannot grant admin privileges',async()=>{
 const db=database();const auth=load('server/src/services/auth.service.js',{...baseMocks,'../models':db.models,'jsonwebtoken':{sign:p=>JSON.stringify(p)},'../config/app':{jwt:{}}});
 const result=await auth.register({username:'tester',email:'new@test.local',password:'Test123!',full_name:'Tester',role:'admin'});
 assert.equal(result.user.role,'learner');assert.equal(JSON.parse(result.accessToken).role,'learner');
});
test('R02 seed preserves existing data and schema',async()=>{
 const db=database();db.rows('Vocabulary').push({id:9,topic_id:9,word:'custom',source_ref:null});
 const seeder=load('server/src/seeders/index.js',{...baseMocks,'../models':db.models,'./artVocabData':{topicsData:[],vocabByTopic:{}}});
 await seeder.seed();assert.equal(db.rows('Vocabulary').find(v=>v.id===9).word,'custom');
});
test('R03 boolean-only forged quiz payload is rejected without writes',async()=>{
 const db=database(),c=exercise(db);
 await assert.rejects(c.submitVocabExercises({user:{id:1},body:{results:[{vocabulary_id:1,is_correct:true,quality:5}]}},response()),e=>e.statusCode===400);
 assert.equal(db.rows('UserVocabProgress').length,0);
});
test('R04 scoring uses issued options, ignores forged options/quality, and replay is idempotent',async()=>{
 const db=database(),c=exercise(db),a=await attempt(c);assert.ok(a.attempt_id,'server must issue an attempt');
 const results=a.exercises.map(q=>{const v=db.rows('Vocabulary').find(v=>v.id===q.vocabulary_id);return {id:q.id,selected_option:q.options.findIndex(x=>x!==v.word&&x!==v.meaning_vi),options:[v.word],is_correct:true,quality:5}});
 const req={user:{id:1},body:{attempt_id:a.attempt_id,results}},r=response();await c.submitVocabExercises(req,r);
 assert.equal(r.body.data.correct,0);assert.equal(db.rows('UserVocabProgress').every(p=>p.correct_count===0),true);
 const first=JSON.stringify(db.rows('UserVocabProgress'));await c.submitVocabExercises(req,response());assert.equal(JSON.stringify(db.rows('UserVocabProgress')),first);
});
test('R05 a failure on the second answer rolls back the whole quiz',async()=>{
 const db=database(),c=exercise(db),a=await attempt(c);assert.ok(a.attempt_id);
 let calls=0;const real=db.models.ReviewSchedule.create;db.models.ReviewSchedule.create=async(...args)=>{if(++calls===2)throw Error('Injected schedule failure');return real(...args)};
 await assert.rejects(c.submitVocabExercises({user:{id:1},body:{attempt_id:a.attempt_id,results:a.exercises.map(q=>({id:q.id,selected_option:0}))}},response()),/Injected/);
 assert.equal(db.rows('UserVocabProgress').length,0);assert.equal(db.rows('ReviewEvent').length,0);assert.equal(db.rows('ExerciseAttempt')[0].result,null);
});
test('R06 simultaneous reviews preserve both answers and exactly one next schedule',async()=>{
 const db=database();db.rows('UserVocabProgress').push({id:1,user_id:1,vocabulary_id:1,correct_count:1,incorrect_count:0,ease_factor:2.5,interval_days:1,repetition_count:1});
 const srs=load('server/src/services/srs.service.js',{...baseMocks,'../models':db.models});
 await Promise.all([srs.recordReviewAnswer(1,1,4),srs.recordReviewAnswer(1,1,4)]);
 assert.equal(db.rows('UserVocabProgress')[0].correct_count,3);assert.equal(db.rows('ReviewSchedule').length,1);assert.equal(db.rows('ReviewEvent').length,2);
});
test('R07 review quality must be a finite integer from 0 to 5',async()=>{
 const db=database(),srs=load('server/src/services/srs.service.js',{...baseMocks,'../models':db.models});
 for(const quality of [NaN,6,-1,2.5,null,'5'])await assert.rejects(srs.recordReviewAnswer(1,1,quality),e=>e.statusCode===400);
 assert.equal(db.rows('UserVocabProgress').length,0);
});
test('R08 creating a personal word supplies a valid topic and keeps it private',async()=>{
 const db=database(),c=controller('userVocabList.controller.js',db);
 await c.addWordToLists({user:{id:1},body:{word:'newword',meaning_vi:'new meaning',list_ids:[1]}},response());
 const v=db.rows('Vocabulary').find(v=>v.word==='newword');assert.ok(v.topic_id);assert.equal(v.created_by,1);assert.equal(v.is_approved,false);
 assert.equal(db.rows('UserVocabListItem').length,1);
});
test('R09 history counts two reviews of the same word on the same day',async()=>{
 const db=database(),now=new Date();db.rows('ReviewEvent').push({id:1,user_id:1,vocabulary_id:1,reviewed_at:now},{id:2,user_id:1,vocabulary_id:1,reviewed_at:now});
 db.rows('UserVocabProgress').push({id:1,user_id:1,vocabulary_id:1,last_reviewed_at:now});
 const r=response();await controller('stats.controller.js',db).getLearningTrends({user:{id:1}},r);
 assert.equal(r.body.data.at(-1).reviewsCount,2);
});
test('R10 last active admin cannot be demoted or disabled',async()=>{
 for(const [method,body] of [['updateUserRole',{role:'learner'}],['toggleUserStatus',{}]]){
 const db=database(),c=controller('admin.controller.js',db);
 await assert.rejects(c[method]({user:{id:1},params:{id:1},body},response()),e=>e.statusCode===409);
 assert.equal(db.rows('User')[0].role,'admin');assert.equal(db.rows('User')[0].is_active,true);
 }
});
test('R11 production refuses missing or public JWT secrets',()=>{
 for(const env of [{NODE_ENV:'production'},{NODE_ENV:'production',JWT_SECRET:'default-secret',JWT_REFRESH_SECRET:'default-refresh-secret'}])assert.throws(()=>load('server/src/config/app.js',{'dotenv':{config(){}}},{process:{env}}),/JWT/);
});
test('R12 test DB never falls back to the application database',()=>{
 const c=load('server/src/config/database.js',{'dotenv':{config(){}}},{process:{env:{DB_NAME:'real_data'}}});
 assert.notEqual(c.test.database,'real_data');
});
test('R13 uploaded png/jpg paths reach backend before nginx static regex',()=>{
 const conf=read('client/nginx.conf');assert.match(conf,/location\s+\^~\s+\/uploads\//);
 const vite=read('client/vite.config.js').replace(/^import .*;\r?\n/gm,'').replace('export default','module.exports =');
 const module={exports:{}};vm.runInNewContext(vite,{module,defineConfig:x=>x,react:()=>({}),tailwindcss:()=>({})});
 assert.ok(module.exports.server.proxy['/uploads']);
});
test('R14 refresh saves both renewed tokens',async()=>{
 const storage=new Map([['refreshToken','old']]);let onError;
 const api=Object.assign(async()=>({}),{defaults:{headers:{common:{}}},interceptors:{request:{use(){}},response:{use(_ok,err){onError=err}}}});
 const axios={create:()=>api,post:async()=>({data:{data:{accessToken:'new-access',refreshToken:'new-refresh'}}})};
 const module={exports:{}};vm.runInNewContext(read('client/src/api/axios.js').replace("import axios from 'axios';",'').replace('export default api;','module.exports=api;'),{axios,module,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},window:{location:{pathname:'/dashboard'}}});
 await onError({response:{status:401},config:{url:'/topics',headers:{}}});assert.equal(storage.get('refreshToken'),'new-refresh');
});
test('R15 legacy answers are discarded when issuing a new server-owned quiz', async () => {
 const source=read('client/src/pages/vocab/ExercisePage.jsx').replace(/^import[\s\S]*?;\r?\n/gm,'');
 const marker='export default function ExercisePage() {';
 const header=source.slice(0,source.indexOf(marker));
 const body=source.slice(source.indexOf(marker)+marker.length,source.indexOf('  if (isLoading)'));
 const names=[...body.matchAll(/const \[([A-Za-z]+),[^\]]+\] = useState/g)].map(m=>m[1]);
 const states=[],effects=[];let cursor=0;
 const storage=new Map([['exercise_draft_1',JSON.stringify({0:2})]]);
 const ctx={useState:init=>{const i=cursor++;states[i]=typeof init==='function'?init():init;return [states[i],v=>states[i]=typeof v==='function'?v(states[i]):v]},
 useEffect:f=>effects.push(f),useRef:v=>({current:v}),useCallback:f=>f,useParams:()=>({id:'1'}),useNavigate:()=>()=>{},useAuthStore:()=>({user:{id:1}}),
 toast:{error(){}},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 window:{addEventListener(){},removeEventListener(){}},topicApi:{getById:async()=>({data:{id:1}})},
 exerciseApi:{getVocabExercises:async()=>({data:{attempt_id:'fresh',exercises:[{id:1,vocabulary_id:2,options:['new']}],expires_at:new Date(Date.now()+864e5).toISOString()}})},effects};
 await vm.runInNewContext(header+'(async()=>{'+body+'; if(typeof loadData==="function") await loadData(); else for(const f of effects) f();})()',ctx);
 await new Promise(r=>setImmediate(r));
 assert.equal(Object.keys(states[names.indexOf('answers')]).length,0);
});
test('R16 admin UI can request pages beyond the first 20 users',()=>{
 const src=read('client/src/pages/admin/AdminPage.jsx');assert.match(src,/getUsers\([\s\S]*?\bpage\b/);assert.match(src,/totalPages/);assert.match(src,/setPage/);
});

test('R17 an issued attempt can be resumed only by its owner and topic',async()=>{
 const db=database(),c=exercise(db),a=await attempt(c),r=response();
 assert.equal(a.exercises.some(q=>q.correct_option!==undefined),false);
 await c.getVocabExercises({user:{id:1},params:{topicId:1},query:{attemptId:a.attempt_id}},r);
 assert.deepEqual(r.body.data,a);
 for(const req of [{user:{id:2},params:{topicId:1}},{user:{id:1},params:{topicId:2}}]){
   await assert.rejects(c.getVocabExercises({...req,query:{attemptId:a.attempt_id}},response()),e=>e.statusCode===404);
 }
 assert.equal(db.rows('ExerciseAttempt').length,1);
});
test('R18 invalid, duplicate, missing and expired answers do not change progress',async()=>{
 const db=database(),c=exercise(db),a=await attempt(c);
 const valid=a.exercises.map(q=>({id:q.id,selected_option:0}));
 for(const results of [[...valid.slice(0,-1)],valid.map((r,i)=>i===1?valid[0]:r),valid.map((r,i)=>i===0?{...r,selected_option:-1}:r),valid.map((r,i)=>i===0?{...r,selected_option:1.5}:r),valid.map((r,i)=>i===0?{...r,selected_option:100}:r)]){
   await assert.rejects(c.submitVocabExercises({user:{id:1},body:{attempt_id:a.attempt_id,results}},response()),e=>e.statusCode===400);
 }
 db.rows('ExerciseAttempt')[0].expires_at=new Date(0);
 await assert.rejects(c.submitVocabExercises({user:{id:1},body:{attempt_id:a.attempt_id,results:valid}},response()),e=>e.statusCode===409);
 assert.equal(db.rows('UserVocabProgress').length,0);
});
test('R19 correct server-issued answers score 100 percent',async()=>{
 const db=database(),c=exercise(db),a=await attempt(c),r=response();
 const results=a.exercises.map(q=>{const v=db.rows('Vocabulary').find(v=>v.id===q.vocabulary_id);return {id:q.id,selected_option:q.options.indexOf(q.type==='en_to_vi'?v.meaning_vi:v.word)}});
 await c.submitVocabExercises({user:{id:1},body:{attempt_id:a.attempt_id,results}},r);
 assert.equal(r.body.data.percentage,100);assert.equal(db.rows('ReviewEvent').length,4);
});
test('R20 private vocabulary is not readable or learnable by other users',async()=>{
 const db=database();db.rows('Vocabulary').push({id:99,topic_id:1,word:'private',created_by:1,is_approved:false});
 const c=controller('vocabulary.controller.js',db);
 for(const action of ['getVocabularyById','markAsLearned'])await assert.rejects(c[action]({params:{id:99},user:{id:2}},response()),e=>e.statusCode===404);
 assert.equal(db.rows('UserVocabProgress').length,0);
});
test('R21 personal list sync rolls back a newly created word on schedule failure',async()=>{
 const db=database();db.fail('ReviewSchedule');
 await assert.rejects(controller('userVocabList.controller.js',db).addWordToLists({user:{id:1},body:{word:'rollbackword',list_ids:[1]}},response()),/Injected/);
 assert.equal(db.rows('Vocabulary').some(v=>v.word==='rollbackword'),false);assert.equal(db.rows('UserVocabListItem').length,0);
});
test('R22 test mode refuses an explicitly shared application database',()=>{
 assert.throws(()=>load('server/src/config/database.js',{'dotenv':{config(){}}},{process:{env:{NODE_ENV:'test',DB_NAME:'live',DB_NAME_TEST:'live'}}}),/DB_NAME_TEST/);
});
test('R23 admin may change other accounts when another active admin remains',async()=>{
 const db=database();db.rows('User').push({id:2,role:'admin',is_active:true});
 const c=controller('admin.controller.js',db);await c.updateUserRole({user:{id:2},params:{id:1},body:{role:'learner'}},response());
 assert.equal(db.rows('User')[0].role,'learner');assert.equal(db.rows('User')[1].role,'admin');
});
test('R24 production accepts two independently generated JWT keys',()=>{
 const crypto=require('node:crypto');const env={NODE_ENV:'production',JWT_SECRET:crypto.randomBytes(48).toString('hex'),JWT_REFRESH_SECRET:crypto.randomBytes(48).toString('hex')};
 const config=load('server/src/config/app.js',{'dotenv':{config(){}}},{process:{env}});assert.equal(config.jwt.secret,env.JWT_SECRET);
});

test('R25 demo refresh preserves IDs and private data while updating system images',async()=>{
 const db=database();
 db.rows('User')[0].is_active=false;
 db.rows('User').push({id:2,username:'existing',email:'existing@test.local',role:'learner',is_active:true});
 db.rows('Topic').splice(0,1,{id:1,name:'Personal Vocabulary',name_vi:'Personal'},{id:7,name:'Paintings',name_vi:'Tranh'});
 db.rows('Vocabulary').splice(0,4,
  {id:10,topic_id:7,word:'oil painting',source_type:'system',is_approved:true,image_url:'/old.svg'},
  {id:11,topic_id:7,word:'privateword',source_type:'community',created_by:2,is_approved:false,image_url:'/private.svg',meaning_vi:'Private meaning'});
 const data={topicsData:[{id:1,name:'Paintings',name_vi:'Tranh'}],vocabByTopic:{1:[
  {word:'oil painting',meaning_vi:'Tranh',image_url:'/oil_painting.jpg'},
  {word:'privateword',meaning_vi:'Do not overwrite',image_url:'/new.jpg'}
 ]}};
 const seed=load('server/src/seeders/index.js',{...baseMocks,'../models':db.models,'./artVocabData':data}).seed;
 await seed();
 assert.equal(db.rows('User')[0].is_active,false);
 assert.equal(new Set(db.rows('User').map(u=>u.id)).size,db.rows('User').length);
 assert.equal(db.rows('Vocabulary').find(v=>v.id===10).image_url,'/oil_painting.jpg');
 assert.equal(db.rows('Vocabulary').find(v=>v.id===10).topic_id,7);
 assert.equal(db.rows('Vocabulary').find(v=>v.id===11).meaning_vi,'Private meaning');
 assert.ok(db.rows('UserVocabProgress').every(p=>p.vocabulary_id===10));
});
test('R26 admins cannot disable or demote themselves when another admin exists',async()=>{
 for(const [method,body] of [['updateUserRole',{role:'learner'}],['toggleUserStatus',{}]]){
  const db=database();db.rows('User').push({id:2,username:'otheradmin',role:'admin',is_active:true});
  const c=controller('admin.controller.js',db);
  await assert.rejects(c[method]({user:{id:1},params:{id:1},body},response()),e=>e.statusCode===400);
  assert.equal(db.rows('User')[0].is_active,true);assert.equal(db.rows('User')[0].role,'admin');
 }
});
test('R27 removing every list membership does not auto-enroll a word',async()=>{
 const db=database(),c=controller('userVocabList.controller.js',db);
 await c.addWordToLists({user:{id:1},body:{vocabulary_id:1,list_ids:[],auto_learn:true}},response());
 assert.equal(db.rows('UserVocabProgress').length,0);assert.equal(db.rows('ReviewSchedule').length,0);
});
test('R28 five consecutive failed logins temporarily lock the account and reset on valid login',async()=>{
 const db=database();
 db.rows('User').push({id:2,username:'learner',email:'lock@test.local',role:'learner',is_active:true,failed_login_attempts:0,locked_until:null});
 const origFindOne=db.models.User.findOne;
 db.models.User.findOne=async(opts)=>{const u=await origFindOne(opts);if(u)Object.defineProperty(u,'comparePassword',{value:async(pw)=>pw==='Correct123!',enumerable:false});return u;};
 const auth=load('server/src/services/auth.service.js',{...baseMocks,'../models':db.models,'jsonwebtoken':{sign:p=>JSON.stringify(p)},'../config/app':{jwt:{},security:{maxLoginAttempts:5,lockoutDurationMinutes:15}}});
 for(let i=0;i<4;i++) await assert.rejects(auth.login({email:'lock@test.local',password:'wrong'}),e=>e.statusCode===401);
 await assert.rejects(auth.login({email:'lock@test.local',password:'wrong'}),e=>e.statusCode===423);
 await assert.rejects(auth.login({email:'lock@test.local',password:'Correct123!'}),e=>e.statusCode===423);
 db.rows('User')[1].locked_until=new Date(Date.now()-1000);
 const ok=await auth.login({email:'lock@test.local',password:'Correct123!'});
 assert.ok(ok.accessToken);assert.equal(db.rows('User')[1].failed_login_attempts,0);assert.equal(db.rows('User')[1].locked_until,null);
});
test('R29 forgot password issues a one-time reset token that updates password and revokes refresh tokens',async()=>{
 const db=database();
 db.rows('User').push({id:2,username:'resetter',email:'reset@test.local',role:'learner',is_active:true,password_hash:'OldPass123'});
 db.rows('RefreshToken').push({id:1,user_id:2,token_hash:'oldhash',expires_at:new Date(Date.now()+864e5),revoked_at:null});
 const auth=load('server/src/services/auth.service.js',{...baseMocks,'../models':db.models,'jsonwebtoken':{sign:p=>JSON.stringify(p)},'../config/app':{env:'test',jwt:{},security:{passwordResetTtlMinutes:15}}});
 const forgot=await auth.forgotPassword('reset@test.local');
 assert.ok(forgot.resetToken);
 await auth.resetPassword({token:forgot.resetToken,newPassword:'NewPass123!'});
 assert.equal(db.rows('User')[1].password_hash,'NewPass123!');
 assert.ok(db.rows('RefreshToken')[0].revoked_at);
 await assert.rejects(auth.resetPassword({token:forgot.resetToken,newPassword:'Again123!'}),e=>e.statusCode===400);
});
test('R30 logged out refresh token cannot be reused to mint a new access token',async()=>{
 const db=database();
 const origFindOne=db.models.User.findOne;
 db.models.User.findOne=async(opts)=>{const u=await origFindOne(opts);if(u)Object.defineProperty(u,'comparePassword',{value:async()=>true,enumerable:false});return u;};
 const jwt=require('../server/node_modules/jsonwebtoken');
 const cfg={jwt:{secret:'a'.repeat(40),refreshSecret:'b'.repeat(40),expiresIn:'15m',refreshExpiresIn:'7d'},security:{maxLoginAttempts:5,lockoutDurationMinutes:15}};
 const auth=load('server/src/services/auth.service.js',{...baseMocks,'../models':db.models,jsonwebtoken:jwt,'../config/app':cfg});
 const session=await auth.login({email:'admin@test.local',password:'any'});
 await auth.logout(session.refreshToken);
 await assert.rejects(auth.refreshToken(session.refreshToken),e=>e.statusCode===401);
});
test('R31 admin mutations record audit log entries retrievable via getAuditLogs',async()=>{
 const db=database();db.rows('User').push({id:2,username:'u2',email:'u2@test.local',role:'learner',is_active:true});
 const c=controller('admin.controller.js',db);
 await c.updateUserRole({user:{id:1},params:{id:2},body:{role:'admin'},ip:'127.0.0.1'},response());
 await c.createVocabulary({user:{id:1},body:{topic_id:1,word:'gouache',meaning_vi:'màu bột'},ip:'127.0.0.1'},response());
 const r=response();await c.getAuditLogs({user:{id:1},query:{page:1,limit:10}},r);
 assert.equal(r.body.data.length,2);
 assert.deepEqual(r.body.data.map(l=>l.action),['UPDATE_USER_ROLE','CREATE_VOCABULARY']);
});
test('R32 user can export personal data and delete own account except last active admin',async()=>{
 const db=database();
 db.rows('User').push({id:2,username:'u2',email:'u2@test.local',role:'learner',is_active:true});
 db.rows('UserVocabProgress').push({id:1,user_id:2,vocabulary_id:1,status:'learning'});
 const origFindByPk=db.models.User.findByPk;
 db.models.User.findByPk=async(id,opts)=>{const u=await origFindByPk(id,opts);if(u)u.comparePassword=async(pw)=>pw==='Secret123!';return u;};
 const c=controller('user.controller.js',db);
 const expRes=response();await c.exportMyData({user:{id:2}},expRes);
 assert.equal(expRes.body.data.user.id,2);assert.equal(expRes.body.data.vocab_progress.length,1);
 await assert.rejects(c.deleteMyAccount({user:{id:1},body:{password:'Secret123!'}},response()),e=>e.statusCode===409);
 const delRes=response();await c.deleteMyAccount({user:{id:2},body:{password:'Secret123!'}},delRes);
 assert.equal(delRes.statusCode,200);assert.equal(db.rows('User').some(u=>u.id===2),false);
});
test('R33 Google sign-in creates verified learner or upgrades existing user email_verified status',async()=>{
 const db=database();
 db.rows('User').push({id:2,username:'existinguser',email:'old@gmail.com',role:'learner',is_active:true,email_verified:false});
 db.rows('User').push({id:3,username:'banned',email:'banned@gmail.com',role:'learner',is_active:false,email_verified:false});
 const auth=load('server/src/services/auth.service.js',{...baseMocks,'../models':db.models,'jsonwebtoken':{sign:p=>JSON.stringify(p)},'../config/app':{jwt:{},google:{clientId:'test-client-id'}}});
 const created=await auth.loginWithGoogle({
  credential:'tok-new',
  verifier:async()=>({sub:'sub-1',email:'hoang.art+test@gmail.com',name:'Hoang Artist',picture:'https://lh3.googleusercontent.com/a.jpg',email_verified:true})
 });
 assert.equal(created.user.role,'learner');assert.equal(created.user.email_verified,true);assert.equal(created.user.google_id,'sub-1');
 assert.match(created.user.username,/^[a-zA-Z0-9]{3,50}$/);
 const upgraded=await auth.loginWithGoogle({
  credential:'tok-old',
  verifier:async()=>({sub:'sub-2',email:'old@gmail.com',name:'Existing',picture:null,email_verified:true})
 });
 assert.equal(upgraded.user.id,2);assert.equal(upgraded.user.email_verified,true);assert.equal(upgraded.user.google_id,'sub-2');
 await assert.rejects(auth.loginWithGoogle({
  credential:'tok-ban',
  verifier:async()=>({sub:'sub-3',email:'banned@gmail.com',name:'Banned',email_verified:true})
 }),e=>e.statusCode===403);
 await assert.rejects(auth.verifyGoogleCredential('bad-aud',async()=>({ok:true,json:async()=>({aud:'other-client',email:'x@gmail.com',email_verified:'true'})})),e=>e.statusCode===401);
});
