const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const Op = Object.fromEntries(['or', 'in', 'notIn', 'lte', 'between', 'like'].map(k => [k, Symbol.for(k)]));
function load(file, mocks = {}, globals = {}) {
  const filename = path.join(root, file), module = { exports: {} };
  const native = require('node:module').createRequire(filename);
  const req = n => Object.hasOwn(mocks, n) ? mocks[n] : native(n);
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports, require: req, __dirname: path.dirname(filename),
    console, process: { env: {} }, Buffer, setTimeout, clearTimeout, ...globals
  }, { filename });
  return module.exports;
}
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function response() { return { statusCode: 200, status(n) {this.statusCode=n;return this;}, json(body) {this.body=body;return body;} }; }
const baseMocks = { '../utils/catchAsync': fn => fn, sequelize: {Op} };
function database() {
  let state = {
    User: [{id:1, username:'admin', email:'admin@test.local', role:'admin', is_active:true}],
    Vocabulary: [1,2,3,4].map(id => ({id,topic_id:1,word:'word'+id,meaning_vi:'meaning'+id,is_approved:true, example_sentence:'An example word'+id})),
    Topic: [{id:1,name:'Art',name_vi:'Art'}], UserVocabProgress: [], ReviewSchedule: [],
    ReviewEvent: [], ExerciseAttempt: [], UserVocabList:[{id:1,user_id:1}],UserVocabListItem:[],VocabExample:[]
  };
  let queue = Promise.resolve(), failures = {};
  const models = {};
  function match(row, where = {}) {
    return Reflect.ownKeys(where).every(key => {
      if(key===Op.or) return where[key].some(w=>match(row,w));
      const value = where[key];
      if(Array.isArray(value)) return value.includes(row[key]);
      if(value && typeof value==='object' && !(value instanceof Date)) return Reflect.ownKeys(value).every(op => {
        if(op===Op.in)return value[op].includes(row[key]);
        if(op===Op.notIn)return !value[op].includes(row[key]);
        if(op===Op.between)return new Date(row[key])>=value[op][0] && new Date(row[key])<=value[op][1];
        if(op===Op.lte)return new Date(row[key])<=value[op];
        return true;
      });
      return String(row[key]) === String(value);
    });
  }
  for(const name of Object.keys(state)) {
    const rows = opts => (opts?.transaction?.state || state)[name];
    const wrap = (data, opts) => {
      if(!data)return null;
      const obj = {...structuredClone(data)};
      Object.defineProperties(obj, {
        toJSON:{value:()=>Object.fromEntries(Object.entries(obj))},
        save:{value:async options=>{ const table=rows(options||opts);const i=table.findIndex(r=>r.id===obj.id);table[i]=structuredClone({...obj});return obj;}},
        update:{value:async(data,options)=>{Object.assign(obj,data);return obj.save(options)}},
        destroy:{value:async()=>{const table=rows(opts);table.splice(table.findIndex(r=>r.id===obj.id),1)}}
      });
      return obj;
    };
    models[name]={
      findAll:async(opts={})=> rows(opts).filter(r=>match(r,opts.where)).slice(opts.offset||0, (opts.offset||0)+(opts.limit||1e6)).map(r=>wrap(r,opts)),
      findOne:async(opts={})=>wrap(rows(opts).find(r=>match(r,opts.where)),opts),
      findByPk:async(id,opts={})=>wrap(rows(opts).find(r=>String(r.id)===String(id)),opts),
      create:async(data,opts={})=>{
        if(failures[name])throw Error('Injected '+name+' write failure');
        if(name==='Vocabulary' && !data.topic_id)throw Error('Vocabulary.topic_id cannot be null');
        const table=rows(opts);const row={id:data.id || Math.max(0,...table.map(r=>Number(r.id)||0))+1,...data};
        table.push(structuredClone(row));return wrap(row,opts);
      },
      destroy:async(opts={})=>{const table=rows(opts);for(let i=table.length-1;i>=0;i--)if(match(table[i],opts.where))table.splice(i,1)},
      count:async(opts={})=>rows(opts).filter(r=>match(r,opts.where)).length,
      upsert:async()=>{},
    };
    models[name].findOrCreate=async(opts)=>{const found=await models[name].findOne(opts);return found?[found,false]:[await models[name].create({...opts.defaults,...opts.where},opts),true]};
    models[name].findAndCountAll=async(opts)=>({rows:await models[name].findAll(opts),count:await models[name].count({where:opts.where})});
  }
  models.sequelize={
    transaction:async(fn)=>{let release;const prev=queue;queue=new Promise(r=>{release=r});await prev;const t={state:structuredClone(state),LOCK:{UPDATE:'UPDATE'}};try{const out=await fn(t);state=t.state;return out}finally{release()}},
    query:async(sql)=>{if(/DELETE|DROP|TRUNCATE|FOREIGN_KEY_CHECKS\s*=\s*0/i.test(sql))throw Error('Destructive seed SQL: '+sql)},
    sync:async(opts)=>{if(opts?.alter||opts?.force)throw Error('Destructive schema sync')},
    literal:s=>s,
  };
  return {models, rows:name=>state[name], fail:name=>{failures[name]=true}};
}
module.exports={load,read,response,baseMocks,Op,database,root};
