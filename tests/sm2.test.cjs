const {test,describe}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {load,read,baseMocks}=require('./helpers.cjs');
const srs=load('server/src/services/srs.service.js',{...baseMocks,'../models':{}});
vm.runInNewContext(read('server/tests/unit/srs.service.test.js'),{
 require:name=>name.includes('/models')?{sequelize:{close:async()=>{}}}:srs,
 test,describe,afterAll(){},
 expect:value=>({
  toBe:expected=>assert.equal(value,expected),
  toBeInstanceOf:()=>assert.equal(Object.prototype.toString.call(value),'[object Date]'),
  toBeGreaterThanOrEqual:expected=>assert.ok(value>=expected),
  toBeLessThanOrEqual:expected=>assert.ok(value<=expected),
  toBeLessThan:expected=>assert.ok(value<expected)
 })
});
