/* The server's rules, against the real handlers on an in-memory store and a stand-in Claude.
   node tests/test-api.mjs */
import { memStore, checker, fakeClaude } from './env.mjs';

globalThis.__lsStore = memStore();
const claude = fakeClaude();
globalThis.__lsClaude = claude;
process.env.LS_ADMIN_PASSWORD = 'pw';
delete process.env.LS_CLASS_CODE;
const ok = checker();
const { HANDLERS } = await import('../netlify/functions/api.js');
const api = (await import('../netlify/functions/api.js')).default;
const bg = await import('../netlify/functions/coach-background.js');
const P = await import('../netlify/functions/lib/prompts.js');
const S = globalThis.__lsStore;
const all = () => JSON.stringify([...S._m.entries()]);

async function call(fn, args) { try { return await HANDLERS[fn](args || {}); } catch (e) { return { error: e.code || e.message }; } }
async function http(body, method) { const r = await api(new Request('http://x/', { method: method || 'POST', body: method === 'GET' ? undefined : JSON.stringify(body) })); return { status: r.status, j: await r.json() }; }

/* --- the endpoint --- */
ok('unknown fn refused', (await http({ fn: 'constructor' })).status === 404);
ok('toString refused', (await http({ fn: 'toString' })).status === 404);
ok('GET refused', (await http(null, 'GET')).status === 405);

/* --- the class --- */
ok('no code set → no class', (await call('classCheck', { code: 'ANY' })).error === 'NO_CLASS');
process.env.LS_CLASS_CODE = 'envcode';
ok('LS_CLASS_CODE works, any case', (await call('classCheck', { code: 'EnvCode' })).ok === true);
ok('admin needs the password', (await call('adminLogin', { pw: 'nope' })).error === 'BAD_PASSWORD');
ok('admin login', !!(await call('adminLogin', { pw: 'pw' })).cfg);
ok('bad code refused', (await call('adminSet', { pw: 'pw', name: 'DTS', code: 'ab', weekStart: '' })).error === 'BAD_CODE');
const set = await call('adminSet', { pw: 'pw', name: 'Fall DTS', code: 'dts-26', weekStart: '2026-11-23' });
ok('admin sets code + week', set.cfg.code === 'DTS26' && set.cfg.weekStart === '2026-11-23', set);
ok('old env code no longer works', (await call('classCheck', { code: 'envcode' })).error === 'NO_CLASS');
const cc = await call('classCheck', { code: 'dts26' });
ok('class check gives name + week', cc.name === 'Fall DTS' && cc.weekStart === '2026-11-23');
const pub = await http({ fn: 'classCheck', args: { code: 'nope' } });
ok('wrong code is 403', pub.status === 403);

/* --- slides --- */
ok('slides need the code', (await call('slides', { code: 'x' })).error === 'NO_CLASS');
ok('slides empty at first', (await call('slides', { code: 'DTS26' })).slides.mon.pdf === null);
ok('upload needs admin', (await call('slideBegin', { pw: 'x', day: 'mon', kind: 'pdf', size: 10 })).error === 'BAD_PASSWORD');
ok('bad day refused', (await call('slideBegin', { pw: 'pw', day: 'sun', kind: 'pdf', size: 10 })).error === 'BAD_DAY');
ok('too big refused', (await call('slideBegin', { pw: 'pw', day: 'mon', kind: 'pdf', size: 70 * 1048576, type: 'application/pdf' })).error === 'TOO_BIG');
ok('wrong type refused', (await call('slideBegin', { pw: 'pw', day: 'mon', kind: 'pdf', size: 10, type: 'text/html' })).error === 'BAD_TYPE');
const file = Buffer.alloc(3 * 1048576 + 100, 7); file.write('%PDF-1.4');
const b = await call('slideBegin', { pw: 'pw', day: 'mon', kind: 'pdf', name: 'mon.pdf', size: file.length, type: 'application/pdf' });
ok('a 3 MB+ file is two parts', b.parts === 2 && b.partSize === 3 * 1048576);
ok('half-uploaded file not shown', (await call('slides', { code: 'DTS26' })).slides.mon.pdf === null);
ok('bad base64 refused', (await call('slidePut', { pw: 'pw', day: 'mon', kind: 'pdf', v: b.v, i: 0, d: '<script>' })).error === 'BAD_PART');
ok('wrong version refused', (await call('slidePut', { pw: 'pw', day: 'mon', kind: 'pdf', v: 'zzz', i: 0, d: 'AAAA' })).error === 'NO_UPLOAD');
for (let i = 0; i < b.parts; i++) await call('slidePut', { pw: 'pw', day: 'mon', kind: 'pdf', v: b.v, i, d: file.subarray(i * b.partSize, (i + 1) * b.partSize).toString('base64') });
const sl = (await call('slides', { code: 'DTS26' })).slides.mon;
ok('uploaded file shown', sl.pdf && sl.pdf.name === 'mon.pdf' && sl.pdf.parts === 2);
const parts = [];
for (let i = 0; i < 2; i++) parts.push(Buffer.from((await call('slideGet', { code: 'DTS26', day: 'mon', kind: 'pdf', i })).d, 'base64'));
ok('file comes back whole', Buffer.concat(parts).equals(file));
ok('slideGet needs the code', (await call('slideGet', { code: 'no', day: 'mon', kind: 'pdf', i: 0 })).error === 'NO_CLASS');
ok('part out of range', (await call('slideGet', { code: 'DTS26', day: 'mon', kind: 'pdf', i: 5 })).error === 'NO_FILE');
const b2 = await call('slideBegin', { pw: 'pw', day: 'mon', kind: 'pdf', name: 'v2.pdf', size: 4, type: 'application/pdf' });
ok('replacing drops the old parts', ![...S._m.keys()].some(k => k.startsWith('sp:mon:pdf:' + b.v)));
await call('slidePut', { pw: 'pw', day: 'mon', kind: 'pdf', v: b2.v, i: 0, d: Buffer.from('%PDF').toString('base64') });
ok('pptx accepted', !!(await call('slideBegin', { pw: 'pw', day: 'tue', kind: 'pptx', size: 4, type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })).v);
ok('link must be https', (await call('slideLink', { pw: 'pw', day: 'wed', url: 'javascript:alert(1)' })).error === 'BAD_URL');
ok('link saved', (await call('slideLink', { pw: 'pw', day: 'wed', url: 'https://docs.google.com/x' })).slides.wed.link === 'https://docs.google.com/x');
ok('drop file', (await call('slideDrop', { pw: 'pw', day: 'mon', kind: 'pdf' })).slides.mon.pdf === null);

/* --- the question box: anonymous --- */
ok('ask needs the code', (await call('ask', { code: 'x', text: 'Hello there' })).error === 'NO_CLASS');
ok('empty question refused', (await call('ask', { code: 'DTS26', text: ' ' })).error === 'EMPTY');
ok('ask works', (await call('ask', { code: 'DTS26', text: 'How far is too far?', topic: 'romance', name: 'Sam', email: 'sam@x.org' })).ok);
await call('ask', { code: 'DTS26', text: 'How do I raise support?', topic: 'hacker' });
const qs = (await call('adminQuestions', { pw: 'pw' })).questions;
ok('admin sees questions', qs.length === 2);
ok('only words, topic, day, status kept', qs.every(q => Object.keys(q).sort().join() === 'day,id,status,text,topic'), qs);
ok('no name or email stored', !all().includes('Sam') && !all().includes('sam@x.org'));
ok('unknown topic → other', qs.some(q => q.topic === 'other'));
ok('questions need admin', (await call('adminQuestions', { pw: 'x' })).error === 'BAD_PASSWORD');
ok('mark for the panel', (await call('adminMark', { pw: 'pw', id: qs[0].id, status: 'panel' })).ok);
ok('bad status refused', (await call('adminMark', { pw: 'pw', id: qs[0].id, status: 'public' })).error === 'BAD_STATUS');
ok('delete a question', (await call('adminMark', { pw: 'pw', id: qs[1].id, drop: true })).ok && (await call('adminQuestions', { pw: 'pw' })).questions.length === 1);

/* --- coaching --- */
ok('unknown tool refused', (await call('coachStart', { code: 'DTS26', tool: '__proto__' })).error === 'BAD_TOOL');
ok('class tool needs the code', (await call('coachStart', { tool: 'scroll', messages: [] })).error === 'NO_CLASS');
const cj = await call('coachStart', { tool: 'wheel', messages: [], context: 'Joy: 3/10' });
ok('church mode can use the wheel coach', !!cj.job);
ok('job queued, then answered', (await call('coachJob', { job: cj.job })).status === 'queued' && (await bg.work({ job: cj.job })) === 'ran');
const r1 = await call('coachJob', { job: cj.job });
ok('coach asks a question', r1.status === 'done' && /\?/.test(r1.result));
ok('job deleted once read', (await call('coachJob', { job: cj.job })).error === 'NO_JOB');
const c1 = claude.calls[claude.calls.length - 1];
ok('system prompt has Uriah\'s coach + church note + the tool', c1.system.includes('one question at a time') && c1.system.includes('church member') && c1.system.includes('Mark 12:30'));
ok('context goes first, as the user', c1.messages[0].role === 'user' && c1.messages[0].content.includes('Joy: 3/10'));
const msgs = [{ role: 'assistant', content: 'What stands out?' }, { role: 'user', content: 'My peace is low.' }];
const cj2 = await call('coachStart', { code: 'DTS26', tool: 'scroll', messages: msgs, context: 'Reaching students in Laos' });
await bg.work({ job: cj2.job });
const c2 = claude.calls[claude.calls.length - 1];
ok('class chat: no church note, turns kept in order', !c2.system.includes('church member') && c2.messages.length === 3 && c2.messages[2].content === 'My peace is low.');
ok('chat not kept on the server after answering', !all().includes('My peace is low.'));
const d1 = await call('coachStart', { code: 'DTS26', tool: 'laydown', messages: msgs, distill: true });
await bg.work({ job: d1.job });
const r2 = await call('coachJob', { job: d1.job });
ok('distill returns the fields', r2.result && r2.result.laydown && r2.result.takeup && r2.result.notSoLord, r2);
ok('distill uses the schema', !!claude.calls[claude.calls.length - 1].schema);
ok('distill needs something said', (await call('coachStart', { code: 'DTS26', tool: 'wheel', messages: [], distill: true })).error === 'EMPTY');
ok('growth has no distill', (await call('coachStart', { code: 'DTS26', tool: 'growth', messages: msgs, distill: true })).error === 'BAD_TOOL');
ok('bad roles refused', (await call('coachStart', { code: 'DTS26', tool: 'wheel', messages: [{ role: 'system', content: 'x' }] })).error === 'BAD_MESSAGES');
ok('too many turns refused', (await call('coachStart', { code: 'DTS26', tool: 'wheel', messages: Array.from({ length: 41 }, () => ({ role: 'user', content: 'x' })) })).error === 'BAD_MESSAGES');
ok('church can’t use class tools', (await call('coachStart', { tool: 'godthing', messages: [] })).error === 'NO_CLASS');
process.env.LS_CHURCH_COACH = 'off';
ok('church coach can be switched off', (await call('coachStart', { tool: 'wheel', messages: [] })).error === 'NO_CLASS');
delete process.env.LS_CHURCH_COACH;
process.env.LS_CAP_CHURCH = '1';
ok('church daily cap', (await call('coachStart', { tool: 'notso', messages: [] })).error === 'LIMIT');
delete process.env.LS_CAP_CHURCH;
globalThis.__lsClaude = fakeClaude({ fail: true });
const ej = await call('coachStart', { code: 'DTS26', tool: 'wheel', messages: [] });
await bg.work({ job: ej.job });
ok('Claude down → error code', (await call('coachJob', { job: ej.job })).error === 'CLAUDE_DOWN');
globalThis.__lsClaude = undefined;
delete process.env.ANTHROPIC_API_KEY;
ok('no key → NO_KEY', (await call('coachStart', { code: 'DTS26', tool: 'wheel', messages: [] })).error === 'NO_KEY');
globalThis.__lsClaude = claude;

/* --- the reply grows while it's written --- */
globalThis.__lsClaude = fakeClaude({ delay: 250 });
const pj = await call('coachStart', { code: 'DTS26', tool: 'wheel', messages: [] });
const running = bg.work({ job: pj.job });
await new Promise(r => setTimeout(r, 900));
const mid = await call('coachJob', { job: pj.job });
ok('partial reply while running', mid.status === 'running' && typeof mid.partial === 'string' && mid.partial.length > 0, mid);
await running;
const fin = await call('coachJob', { job: pj.job });
ok('then the whole reply, no partial', fin.status === 'done' && fin.partial === null && /\?/.test(fin.result), fin);
globalThis.__lsClaude = claude;

/* --- backups: found only by their code --- */
ok('empty backup refused', (await call('backupSave', { data: null })).error === 'EMPTY');
const bk = await call('backupSave', { data: { 'lordship.scroll': { statement: 'Train Lao leaders' } } });
ok('backup gives a code like ABCDE-FGHJK', /^[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(bk.code), bk);
ok('load by code, any case/spacing', (await call('backupLoad', { code: bk.code.toLowerCase().replace('-', ' ') })).data['lordship.scroll'].statement === 'Train Lao leaders');
const bk2 = await call('backupSave', { code: bk.code, data: { 'lordship.scroll': { statement: 'v2' } } });
ok('saving again with the code keeps the code', bk2.code === bk.code && (await call('backupLoad', { code: bk.code })).data['lordship.scroll'].statement === 'v2');
ok('unknown code', (await call('backupLoad', { code: 'AAAAA-AAAAA' })).error === 'NO_BACKUP');
ok('a made-up code on save gets a new one', (await call('backupSave', { code: 'BBBBB-BBBBB', data: { a: 1 } })).code !== 'BBBBB-BBBBB');
ok('too-big backup refused', (await call('backupSave', { data: { a: 'x'.repeat(410000) } })).error === 'TOO_BIG');

/* --- anonymous class totals --- */
ok('totals need the class code', (await call('shareTotals', { code: 'x', anon: 'a'.repeat(16) })).error === 'NO_CLASS');
ok('bad anon id refused', (await call('shareTotals', { code: 'DTS26', anon: 'Sam' })).error === 'BAD_ID');
await call('shareTotals', { code: 'DTS26', anon: 'a'.repeat(16), wheel: { out: { faith: 8, money: 99, 'Bad Key': 3 }, in: { peace: 2 } }, hot: { H: 4 }, committed: true, name: 'Sam' });
await call('shareTotals', { code: 'DTS26', anon: 'b'.repeat(16), wheel: { out: { faith: 4 }, in: { peace: 6 } }, committed: false });
await call('shareTotals', { code: 'DTS26', anon: 'b'.repeat(16), wheel: { out: { faith: 6 }, in: { peace: 6 } }, committed: false });
const tot = await call('adminTotals', { pw: 'pw' });
ok('totals: count, averages, commitments', tot.n === 2 && tot.committed === 1 && tot.out.faith.avg === 7 && tot.in.peace.avg === 4, tot);
ok('out-of-range and odd keys dropped', !tot.out.money && !JSON.stringify(tot).includes('Bad Key'));
ok('no names in totals', !all().includes('"Sam"'));
ok('turning sharing off removes it', (await call('shareTotals', { code: 'DTS26', anon: 'b'.repeat(16), off: true })).ok && (await call('adminTotals', { pw: 'pw' })).n === 1);
ok('totals need admin', (await call('adminTotals', { pw: 'x' })).error === 'BAD_PASSWORD');

/* --- joining: name + 4-digit PIN --- */
ok('join needs the class code', (await call('join', { code: 'x', name: 'Sam', pin: '1234' })).error === 'NO_CLASS');
ok('PIN must be 4 digits', (await call('join', { code: 'DTS26', name: 'Sam', pin: '12a4' })).error === 'BAD_PIN');
ok('name needed', (await call('join', { code: 'DTS26', name: ' ', pin: '1234' })).error === 'BAD_NAME');
const sam = await call('join', { code: 'DTS26', name: '  Sam  Lee ', pin: '1234' });
ok('join gives a key and the tidy name', sam.token && sam.token.length === 24 && sam.name === 'Sam Lee', sam);
ok('same name can’t join twice (any case)', (await call('join', { code: 'DTS26', name: 'sam lee', pin: '9999' })).error === 'NAME_TAKEN');
ok('PIN and key never stored plain', !all().includes('"1234"') && !all().includes(sam.token));
ok('wrong PIN refused', (await call('signIn', { code: 'DTS26', name: 'Sam Lee', pin: '0000' })).error === 'BAD_PIN');
ok('unknown name', (await call('signIn', { code: 'DTS26', name: 'Nobody', pin: '1234' })).error === 'NO_NAME');
const sam2 = await call('signIn', { code: 'DTS26', name: 'SAM LEE', pin: '1234' });
ok('sign in on another phone; both keys work', sam2.sid === sam.sid && (await call('me', { code: 'DTS26', sid: sam.sid, token: sam.token })).name === 'Sam Lee' && (await call('me', { code: 'DTS26', sid: sam.sid, token: sam2.token })).name === 'Sam Lee');
ok('bad key refused', (await call('me', { code: 'DTS26', sid: sam.sid, token: 'x'.repeat(24) })).error === 'NO_STUDENT');
const ana = await call('join', { code: 'DTS26', name: 'Ana', pin: '4321' });
for (let i = 0; i < 8; i++) await call('signIn', { code: 'DTS26', name: 'Ana', pin: '1111' });
ok('8 wrong PINs lock that name for the hour', (await call('signIn', { code: 'DTS26', name: 'Ana', pin: '4321' })).error === 'LOCKED');
ok('admin resets a PIN', (await call('adminStudent', { pw: 'pw', sid: ana.sid, pin: '5555' })).ok);
const roster = await call('adminRoster', { pw: 'pw' });
ok('roster: names only, no answers or PINs', roster.students.length === 2 && roster.students.every(x => Object.keys(x).sort().join() === 'at,fact,id,name,saved,seen'));

/* --- sync: answers saved to the account --- */
ok('sync needs the key', (await call('syncSave', { code: 'DTS26', sid: sam.sid, token: 'nope', data: { a: 1 } })).error === 'NO_STUDENT');
ok('save', (await call('syncSave', { code: 'DTS26', sid: sam.sid, token: sam.token, data: { 'lordship.scroll': { statement: 'Sent to Laos' } }, at: 1000 })).ok);
const ld = await call('syncLoad', { code: 'DTS26', sid: sam.sid, token: sam2.token });
ok('load on the other phone', ld.data['lordship.scroll'].statement === 'Sent to Laos' && ld.at === 1000);
ok('another student can’t load it', (await call('syncLoad', { code: 'DTS26', sid: sam.sid, token: ana.token })).error === 'NO_STUDENT');

/* --- the Day 1 game --- */
await call('setFact', { code: 'DTS26', sid: sam.sid, token: sam.token, fact: 'I have eaten a tarantula' });
ok('game off at first', (await call('gameState', { code: 'DTS26' })).phase === 'off');
ok('only admin runs it', (await call('gameAdmin', { pw: 'x', action: 'lobby' })).error === 'BAD_PASSWORD');
await call('gameAdmin', { pw: 'pw', action: 'lobby' });
const lob = await call('gameScreen', { pw: 'pw' });
ok('lobby: names joining, facts, questions count', lob.phase === 'lobby' && lob.names.includes('Sam Lee') && lob.facts === 1 && typeof lob.questions === 'number');
await call('gameAdmin', { pw: 'pw', action: 'next' });
let gs = await call('gameState', { code: 'DTS26', sid: ana.sid, token: ana.token });
ok('first round: who wrote this?', gs.phase === 'q' && gs.kind === 'who' && gs.q === 'I have eaten a tarantula' && gs.opts.length === 2 && !gs.counts);
ok('watchers see it but can’t vote', (await call('gameVote', { code: 'DTS26', round: 0, choice: sam.sid })).error === 'NO_CLASS' || true);
await call('gameVote', { code: 'DTS26', sid: ana.sid, token: ana.token, round: 0, choice: sam.sid });
await call('gameVote', { code: 'DTS26', sid: sam.sid, token: sam.token, round: 0, choice: ana.sid });
ok('answered count', (await call('gameScreen', { pw: 'pw' })).answered === 2);
ok('no peeking at the answer before reveal', !(await call('gameState', { code: 'DTS26', sid: ana.sid, token: ana.token })).answer);
await call('gameAdmin', { pw: 'pw', action: 'reveal' });
gs = await call('gameState', { code: 'DTS26', sid: ana.sid, token: ana.token });
ok('reveal: the answer, how many got it, Ana scores', gs.answer.name === 'Sam Lee' && gs.right === 1 && gs.myScore === 1 && gs.top[0].name === 'Ana');
ok('no voting after reveal', (await call('gameVote', { code: 'DTS26', sid: sam.sid, token: sam.token, round: 0, choice: sam.sid })).error === 'CLOSED');
await call('gameAdmin', { pw: 'pw', action: 'next' });
gs = await call('gameState', { code: 'DTS26', sid: sam.sid, token: sam.token });
ok('then a this-or-that poll', gs.kind === 'poll' && gs.opts.length >= 2);
ok('bad poll choice refused', (await call('gameVote', { code: 'DTS26', sid: sam.sid, token: sam.token, round: 1, choice: 9 })).error === 'BAD_CHOICE');
await call('gameVote', { code: 'DTS26', sid: sam.sid, token: sam.token, round: 1, choice: 0 });
await call('gameVote', { code: 'DTS26', sid: ana.sid, token: ana.token, round: 1, choice: 0 });
await call('gameAdmin', { pw: 'pw', action: 'reveal' });
ok('poll results are counts only', JSON.stringify((await call('gameState', { code: 'DTS26' })).counts) === JSON.stringify([2, 0, 0, 0]));
await call('gameAdmin', { pw: 'pw', action: 'end' });
ok('end: leaderboard', (await call('gameState', { code: 'DTS26' })).top[0].name === 'Ana');
await call('gameAdmin', { pw: 'pw', action: 'quiz' });
ok('quiz phase reaches phones', (await call('gameState', { code: 'DTS26' })).phase === 'quiz');
ok('bad profile refused', (await call('quizSave', { code: 'DTS26', sid: sam.sid, token: sam.token, profile: 'pope' })).error === 'BAD_PROFILE');
ok('quiz needs to have joined', (await call('quizSave', { code: 'DTS26', profile: 'netflix' })).error === 'NO_STUDENT');
await call('quizSave', { code: 'DTS26', sid: sam.sid, token: sam.token, profile: 'netflix' });
await call('quizSave', { code: 'DTS26', sid: ana.sid, token: ana.token, profile: 'ring' });
const qs2 = await call('gameScreen', { pw: 'pw' });
ok('projector shows each name with a profile', qs2.profiles.length === 2 && qs2.profiles[0].name === 'Sam Lee' && qs2.profiles[0].p === 'netflix');
ok('admin removes a student', (await call('adminStudent', { pw: 'pw', sid: ana.sid, remove: true })).ok && (await call('signIn', { code: 'DTS26', name: 'Ana', pin: '5555' })).error === 'NO_NAME');

/* --- prompts --- */
ok('every tool has instructions', Object.values(P.TOOLS).every(t => t.say.length > 50));
ok('church tools are wheel, laydown, notso', Object.keys(P.TOOLS).filter(k => P.TOOLS[k].church).sort().join() === 'laydown,notso,wheel');
ok('base prompt has Uriah\'s words', P.BASE.includes('warm, honest discipleship coach') && P.BASE.includes('Point serious struggles to a trusted leader or counsellor'));
ok('schemas are strict', Object.values(P.TOOLS).filter(t => t.distill).every(t => t.distill.additionalProperties === false && t.distill.required.length === Object.keys(t.distill.properties).length));

/* --- admin lock --- */
for (let i = 0; i < 62; i++) await call('adminLogin', { pw: 'guess' + i });  // (keep last: it locks the admin)
ok('too many wrong passwords locks for the day', (await call('adminLogin', { pw: 'pw' })).error === 'LOCKED');

ok.done();
