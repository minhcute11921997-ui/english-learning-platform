const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { read } = require('./helpers.cjs');

function quizPage({ saved = {}, userId = 1, getExercises, storageError = false } = {}) {
  const source = read('client/src/pages/vocab/ExercisePage.jsx').replace(/^import[\s\S]*?;\r?\n/gm, '');
  const marker = 'export default function ExercisePage() {';
  const body = source.slice(source.indexOf(marker) + marker.length, source.indexOf('  if (isLoading)'));
  const names = [...body.matchAll(/const \[([A-Za-z]+),[^\]]+\] = useState/g)].map(m => m[1]);
  const values = [], storage = new Map(Object.entries(saved)), calls = [], errors = [];
  let cursor = 0;
  const context = {
    useState(initial) {
      const i = cursor++;
      values[i] = typeof initial === 'function' ? initial() : initial;
      return [values[i], value => { values[i] = typeof value === 'function' ? value(values[i]) : value; }];
    },
    useRef: value => ({ current: value }), useCallback: fn => fn, useEffect() {},
    useParams: () => ({ id: '1' }), useNavigate: () => () => {}, useAuthStore: () => ({ user: { id: userId } }),
    toast: { error: message => errors.push(message) },
    sessionStorage: {
      getItem(key) { if (storageError) throw Error('Storage blocked'); return storage.get(key); },
      setItem(key, value) { if (storageError) throw Error('Storage blocked'); storage.set(key, value); },
      removeItem: key => storage.delete(key)
    },
    window: { addEventListener() {}, removeEventListener() {}, confirm: () => true },
    topicApi: { getById: async () => ({ data: { id: 1 } }) },
    exerciseApi: {
      async getVocabExercises(...args) { calls.push(args); return getExercises(...args); }
    }
  };
  vm.runInNewContext('(function(){' + body + ';globalThis.page={loadData};})()', context);
  return { load: context.page.loadData, state: name => values[names.indexOf(name)], storage, calls, errors };
}
const issued = id => ({ data: {
  attempt_id: id, exercises: [{ id: 1, options: ['a', 'b', 'c'] }, { id: 2, options: ['a', 'b', 'c'] }]
} });

test('F01 reload resumes the owned attempt, answers and question position', async () => {
  const q = quizPage({
    saved: { exercise_draft_1_1: JSON.stringify({ attempt_id: 'owned', answers: { 1: 2 }, currentIndex: 1 }) },
    getExercises: async () => issued('owned')
  });
  await q.load();
  assert.equal(q.calls.length, 1); assert.equal(q.calls[0][2], 'owned');
  assert.equal(q.state('answers')[1], 2); assert.equal(q.state('currentIndex'), 1);
});
test('F02 expired attempts create a fresh quiz without applying old answers', async () => {
  const q = quizPage({
    saved: { exercise_draft_1_1: JSON.stringify({ attempt_id: 'expired', answers: { 0: 2 }, currentIndex: 1 }) },
    getExercises: async (_topic, _count, attempt) => {
      if (attempt) throw Object.assign(Error('Expired'), { status: 409 });
      return issued('fresh');
    }
  });
  await q.load();
  assert.equal(q.calls.length, 2); assert.equal(q.state('attemptId'), 'fresh');
  assert.equal(Object.keys(q.state('answers')).length, 0); assert.equal(q.state('currentIndex'), 0);
});
test('F03 a temporary resume failure preserves the stored attempt for retry', async () => {
  const draft = JSON.stringify({ attempt_id: 'owned', answers: { 0: 2 } });
  const q = quizPage({
    saved: { exercise_draft_1_1: draft },
    getExercises: async () => { throw Object.assign(Error('Offline'), { status: 503 }); }
  });
  await q.load();
  assert.equal(q.calls.length, 1); assert.equal(q.storage.get('exercise_draft_1_1'), draft);
  assert.equal(q.errors.length, 1); assert.equal(q.state('isLoading'), false);
});
test('F04 another account never loads the previous account draft', async () => {
  const q = quizPage({
    userId: 2, saved: { exercise_draft_1_1: JSON.stringify({ attempt_id: 'private', answers: { 0: 2 } }) },
    getExercises: async () => issued('new-user')
  });
  await q.load();
  assert.equal(q.calls[0][2], undefined); assert.equal(q.state('attemptId'), 'new-user');
  assert.equal(Object.keys(q.state('answers')).length, 0);
});
test('F05 late quiz responses cannot overwrite a newer load', async () => {
  const resolve = [];
  const q = quizPage({ getExercises: () => new Promise(done => resolve.push(done)) });
  const first = q.load(), second = q.load();
  resolve[1](issued('newest')); await second;
  resolve[0](issued('stale')); await first;
  assert.equal(q.state('attemptId'), 'newest');
});
test('F06 corrupt or blocked session storage does not prevent starting a quiz', async () => {
  for (const options of [
    { saved: { exercise_draft_1_1: '{invalid json' } },
    { saved: { exercise_draft_1_1: JSON.stringify({ attempt_id: 'bad', answers: [] }) } },
    { storageError: true }
  ]) {
    const q = quizPage({ ...options, getExercises: async () => issued('fresh') });
    await q.load();
    assert.equal(q.state('attemptId'), 'fresh'); assert.equal(q.calls[0][2], undefined);
  }
});
function interceptors(post) {
  let onError;
  const storage = new Map([['refreshToken', 'old']]);
  const api = Object.assign(async config => ({ url: config.url }), {
    defaults: { headers: { common: {} } },
    interceptors: { request: { use() {} }, response: { use(_ok, fail) { onError = fail; } } }
  });
  const context = {
    axios: { create: () => api, post },
    module: { exports: {} },
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    window: { location: { pathname: '/dashboard' } }
  };
  vm.runInNewContext(read('client/src/api/axios.js').replace("import axios from 'axios';", '')
    .replace('export default api;', 'module.exports=api;'), context);
  return { onError, storage };
}
test('F07 HTTP status survives interception so an expired attempt can be replaced', async () => {
  const { onError } = interceptors(async () => {});
  await assert.rejects(onError({ config: { url: '/exercises' }, response: { status: 409, data: { message: 'Expired' } } }),
    error => error.status === 409);
});
test('F08 simultaneous expired requests share one token refresh and retry once', async () => {
  let finish, refreshes = 0;
  const { onError, storage } = interceptors(async () => { refreshes++; return new Promise(done => { finish = done; }); });
  const first = { url: '/topics', headers: {} }, queued = { url: '/reviews', headers: {} };
  const a = onError({ config: first, response: { status: 401 } });
  const b = onError({ config: queued, response: { status: 401 } });
  assert.equal(refreshes, 1); assert.equal(queued._retry, true);
  finish({ data: { data: { accessToken: 'new-access', refreshToken: 'new-refresh' } } });
  await Promise.all([a, b]);
  assert.equal(storage.get('refreshToken'), 'new-refresh');
  assert.equal(queued.headers.Authorization, 'Bearer new-access');
});
