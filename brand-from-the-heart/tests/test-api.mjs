/* The server's rules, against the real handlers on an in-memory store and a stand-in Claude.
   node tests/test-api.mjs */
import { memStore, checker, fakeClaude } from './env.mjs';

globalThis.__bfhStore = memStore();
process.env.BFH_TEACHER_PASSWORD = 'teach';
const ok = checker();
await import('../netlify/functions/lib/data.js');
const { HANDLERS } = await import('../netlify/functions/api.js');
const bg = await import('../netlify/functions/generate-background.js');
const P = await import('../netlify/functions/lib/prompts.js');
const api = (await import('../netlify/functions/api.js')).default;

async function call(fn, args) {
  try { return await HANDLERS[fn](args || {}); } catch (e) { return { error: e.code || e.message }; }
}
async function http(body) { const r = await api(new Request('http://x/', { method: 'POST', body: JSON.stringify(body) })); return { status: r.status, j: await r.json() }; }

/* --- the endpoint --- */
ok('unknown fn is refused', (await http({ fn: 'constructor', args: {} })).status === 404);
ok('GET is refused', (await api(new Request('http://x/', { method: 'GET' }))).status === 405);

/* --- classes --- */
ok('class needs the teacher password', (await call('classCreate', { name: 'X', password: 'nope' })).error === 'BAD_PASSWORD');
delete process.env.BFH_TEACHER_PASSWORD;
ok('no password set → no classes', (await call('classCreate', { name: 'X', password: '' })).error === 'NO_TEACHER_PASSWORD');
process.env.BFH_TEACHER_PASSWORD = 'teach';
const cls = await call('classCreate', { name: 'Social Media School', password: 'teach' });
ok('class made with a 6-letter code', /^[A-Z2-9]{6}$/.test(cls.code) && cls.tkey.length === 24, cls);
ok('class info by code', (await call('classInfo', { code: cls.code.toLowerCase() })).name === 'Social Media School');
ok('teacher key hashed, never stored plain', !JSON.stringify([...globalThis.__bfhStore._m.values()]).includes(cls.tkey));

/* --- students --- */
const a = await call('start', { name: 'Sokha', code: cls.code });
const b = await call('start', { name: 'Dara', code: cls.code });
const solo = await call('start', { name: 'Solo' });
ok('student gets id + key', /^[a-z0-9]{12}$/.test(a.id) && a.key.length === 24 && a.cls === cls.code);
ok('start with a bad class code fails', (await call('start', { code: 'ZZZZZZ' })).error === 'NO_CLASS');
ok('wrong key is refused', (await call('load', { id: a.id, key: 'x'.repeat(24) })).error === 'NO_STUDENT');
ok('key never stored plain', !JSON.stringify([...globalThis.__bfhStore._m.values()]).includes(a.key));
const data = { answers: { name: 'Sokha', story: 'I grew up in Pailin by the river', moods: ['warm', 'hopeful'] }, likes: ['nike'], tot: {}, quiz: { result: { top: 'warm' } }, heart: { en: 'You are kind', km: 'អ្នកចិត្តល្អ', confirmed: true } };
ok('save works', (await call('save', { id: a.id, key: a.key, data, stage: 'interview', prog: 30, name: 'Sokha' })).ok);
const la = await call('load', { id: a.id, key: a.key });
ok('load gives back the data and class', la.data.answers.story === 'I grew up in Pailin by the river' && la.cls === cls.code && la.className === 'Social Media School');
ok('too-big save is refused', (await call('save', { id: a.id, key: a.key, data: { x: 'y'.repeat(460000) } })).error === 'TOO_BIG');
ok('bad stage ignored, prog clamped', (await call('save', { id: a.id, key: a.key, data, stage: 'hacker', prog: 999 })).ok && (await globalThis.__bfhStore.get('sum:' + a.id)).stage === 'interview' && (await globalThis.__bfhStore.get('sum:' + a.id)).prog === 100);
await call('save', { id: b.id, key: b.key, data: { answers: { name: 'Dara' } }, stage: 'directions', prog: 60, name: 'Dara' });

/* --- teacher --- */
const tv = await call('teacher', { code: cls.code, tkey: cls.tkey });
ok('teacher sees both students, not the solo one', tv.students.length === 2 && !tv.students.some(s => s.id === solo.id));
ok('teacher sees stage + progress, never answers', tv.students.find(s => s.id === a.id).stage === 'interview' && !JSON.stringify(tv).includes('Pailin'));
ok('wrong teacher key refused', (await call('teacher', { code: cls.code, tkey: 'nope' })).error === 'NO_TEACHER');

/* --- sharing, votes, comments --- */
const dir = { key: 'k1', name: { en: 'Sunrise', km: 'ថ្ងៃរះ' }, personality: { en: 'warm', km: 'កក់ក្ដៅ' }, tagline: { en: 'Hope speaks', km: 'សង្ឃឹម' }, fontId: 'x', colors: { primary: '#C8553D', secondary: '#F28F3B', accent: '#588B8B', background: '#FFF5E9', text: 'red;background:url(x)' } };
await call('share', { id: a.id, key: a.key, on: true, dirs: [dir, dir, dir] });
const sum = await globalThis.__bfhStore.get('sum:' + a.id);
ok('share keeps at most 2 and cleans colours', sum.share.dirs.length === 2 && sum.share.dirs[0].colors.text === '#888888');
const gb = await call('gallery', { id: b.id, key: b.key });
ok('classmate sees the shared directions', gb.people.length === 1 && gb.people[0].id === a.id && gb.people[0].dirs.length === 2);
ok('gallery never carries answers', !JSON.stringify(gb).includes('Pailin'));
ok('own share not in own gallery', (await call('gallery', { id: a.id, key: a.key })).people.length === 0);
ok('solo student has no gallery', (await call('gallery', { id: solo.id, key: solo.key })).error === 'NO_CLASS');
ok('vote', (await call('vote', { id: b.id, key: b.key, target: a.id, dir: 1 })).myVote === 1);
ok('vote changes, not doubles', (await call('vote', { id: b.id, key: b.key, target: a.id, dir: 0 })).myVote === 0);
ok('cannot vote for yourself', (await call('vote', { id: a.id, key: a.key, target: a.id, dir: 0 })).error === 'NO_TARGET');
ok('outsider cannot vote', (await call('vote', { id: solo.id, key: solo.key, target: a.id, dir: 0 })).error === 'NO_TARGET');
ok('bad dir refused', (await call('vote', { id: b.id, key: b.key, target: a.id, dir: 5 })).error === 'BAD_DIR');
const c1 = await call('comment', { id: b.id, key: b.key, target: a.id, text: '  I can see your heart! ' + 'x'.repeat(300) });
ok('comment saved and clipped', c1.ok);
await call('comment', { id: b.id, key: b.key, target: a.id, text: 'two' });
await call('comment', { id: b.id, key: b.key, target: a.id, text: 'three' });
ok('3 comments each at most', (await call('comment', { id: b.id, key: b.key, target: a.id, text: 'four' })).error === 'ENOUGH_COMMENTS');
ok('outsider cannot comment', (await call('comment', { id: solo.id, key: solo.key, target: a.id, text: 'hi' })).error === 'NO_TARGET');
let fa = await call('feedback', { id: a.id, key: a.key });
ok('owner sees votes and comments', fa.votes[0] === 1 && fa.comments.length === 3 && fa.comments.every(c => c.text.length <= 160));
const tv2 = await call('teacher', { code: cls.code, tkey: cls.tkey });
ok('teacher sees votes and comments', tv2.students.find(s => s.id === a.id).votes[0] === 1 && tv2.comments.length === 3);
await call('teacherHide', { code: cls.code, tkey: cls.tkey, target: a.id, cid: c1.id, hidden: true });
fa = await call('feedback', { id: a.id, key: a.key });
ok('hidden comment is gone for the student', fa.comments.length === 2);
ok('voter sees own comment marked hidden', (await call('gallery', { id: b.id, key: b.key })).people[0].myComments.find(c => c.id === c1.id).hidden === true);
ok('only the author removes a comment', (await call('uncomment', { id: a.id, key: a.key, target: a.id, cid: c1.id })).error === 'NO_COMMENT');
ok('author removes own comment', (await call('uncomment', { id: b.id, key: b.key, target: a.id, cid: c1.id })).ok);
ok('unshare hides from class', (await call('share', { id: a.id, key: a.key, on: false })).share === null && (await call('gallery', { id: b.id, key: b.key })).people.length === 0);

/* --- logos --- */
ok('logo must be an image data URL', (await call('teacherLogo', { code: cls.code, tkey: cls.tkey, brand: 'nike', data: 'javascript:alert(1)' })).error === 'BAD_IMAGE');
ok('logo saved', (await call('teacherLogo', { code: cls.code, tkey: cls.tkey, brand: 'nike', data: 'data:image/png;base64,iVBORw0KGgo=' })).ok);
ok('logos listed for the class', (await call('logos', { code: cls.code })).logos.nike.startsWith('data:image/png'));
ok('student cannot upload logos', (await call('teacherLogo', { code: cls.code, tkey: a.key, brand: 'nike', data: 'data:image/png;base64,AA==' })).error === 'NO_TEACHER');

/* --- Claude jobs --- */
ok('no API key → NO_KEY', (await call('genStart', { id: a.id, key: a.key, kind: 'heart' })).error === 'NO_KEY');
const fake = fakeClaude();
globalThis.__bfhClaude = fake;
ok('a job needs a class', (await call('genStart', { id: solo.id, key: solo.key, kind: 'heart' })).error === 'NEED_CLASS');
ok('bad kind refused', (await call('genStart', { id: a.id, key: a.key, kind: 'evil' })).error === 'BAD_KIND');
let g = await call('genStart', { id: a.id, key: a.key, kind: 'heart', data });
ok('job queued', /^[a-z0-9]{16}$/.test(g.job));
ok('one job at a time', (await call('genStart', { id: a.id, key: a.key, kind: 'heart' })).error === 'BUSY');
ok('a stranger cannot run it', await bg.work({ id: b.id, key: b.key, job: g.job }) === 'skip');
ok('the wrong key cannot run it', await bg.work({ id: a.id, key: b.key, job: g.job }) === 'skip');
ok('the job runs', await bg.work({ id: a.id, key: a.key, job: g.job }) === 'ran');
ok('it runs only once', await bg.work({ id: a.id, key: a.key, job: g.job }) === 'skip');
let j = await call('job', { id: a.id, key: a.key, job: g.job });
ok('heart result', j.status === 'done' && j.result.en && j.result.km && j.result.title.en);
ok('another student cannot read the job', (await call('job', { id: b.id, key: b.key, job: g.job })).error === 'NO_JOB');
ok('student answers go in the user turn, wrapped, not the system prompt', fake.calls[0].user.includes('<student_answers>') && fake.calls[0].user.includes('Pailin by the river') && !fake.calls[0].system.includes('Pailin by the river'));
ok('system prompt lists the palette and font libraries', fake.calls[0].system.includes('PALETTE LIBRARY') && fake.calls[0].system.includes('FONT LIBRARY'));
ok('liked brands are taste signals', fake.calls[0].user.includes('<brands_they_like_the_vibe_of>') && fake.calls[0].user.includes('Nike'));

g = await call('genStart', { id: a.id, key: a.key, kind: 'directions', data });
await bg.work({ id: a.id, key: a.key, job: g.job });
j = await call('job', { id: a.id, key: a.key, job: g.job });
ok('five directions', j.status === 'done' && j.result.dirs.length === 5, j);
ok('five different lanes', new Set(j.result.dirs.map(d => d.lane)).size === 5);
ok('one direction is rooted in Cambodia (khmer palette)', j.result.dirs.find(d => d.lane === 'khmer').mood === 'khmer');
const d0 = j.result.dirs[0];
ok('direction has the full set', d0.taglines.length === 8 && d0.pillars.length === 5 && d0.captions.length === 3 && d0.voiceDo.length === 3 && d0.bio.km && d0.mission.en && d0.whyIPost.en);
ok('hashtags get a #', d0.hashtags.every(h => h.startsWith('#')));
ok('palette and font ids are real', globalThis.BFH_PALETTES.some(p => p.id === d0.paletteId) && globalThis.BFH_FONTS.some(f => f.id === d0.fontId));
ok('directions use structured output schema', fake.calls.slice(-5).every(c => c.schema.properties.taglines && c.schema.additionalProperties === false));
const saveDirs = Object.assign({}, data, { dirs: j.result.dirs });

/* bad colours from Claude are mended */
const cleaned = P.cleanDirection({ paletteId: 'nope', fontId: 'nope', colors: { primary: 'red', secondary: '#123', accent: '#00FF00', background: '#FFFFFF', text: '#FEFEFE' } }, P.lanes(data)[0]);
ok('bad hex replaced, unreadable text fixed', /^#[0-9A-F]{6}$/.test(cleaned.colors.primary) && cleaned.colors.accent === '#00FF00' && globalThis.BFH_COLOR.contrast(cleaned.colors.text, cleaned.colors.background) >= 4.5);
ok('unknown palette/font fall back to the library', globalThis.BFH_PALETTES.some(p => p.id === cleaned.paletteId) && globalThis.BFH_FONTS.some(f => f.id === cleaned.fontId));

g = await call('genStart', { id: a.id, key: a.key, kind: 'more', opts: { dir: 2 }, data: saveDirs });
await bg.work({ id: a.id, key: a.key, job: g.job });
j = await call('job', { id: a.id, key: a.key, job: g.job });
ok('more like this → 2 variations', j.status === 'done' && j.result.dirs.length === 2 && j.result.dirs[0].from === 2);

g = await call('genStart', { id: a.id, key: a.key, kind: 'refine', opts: { dir: 1, part: 'palette', how: 'warmer' }, data: saveDirs });
await bg.work({ id: a.id, key: a.key, job: g.job });
j = await call('job', { id: a.id, key: a.key, job: g.job });
ok('refine returns only that part', j.status === 'done' && j.result.part === 'palette' && j.result.value.colors && !j.result.value.taglines);
ok('refine asked for the right thing', fake.calls[fake.calls.length - 1].user.includes('warmer'));
g = await call('genStart', { id: a.id, key: a.key, kind: 'refine', opts: { dir: 1, part: 'evil', how: 'warmer' }, data: saveDirs });
await bg.work({ id: a.id, key: a.key, job: g.job });
ok('bad refine part → error', (await call('job', { id: a.id, key: a.key, job: g.job })).status === 'error');

const brandOpt = { title: 'Sokha', colors: d0.colors, fontId: d0.fontId, tagline: d0.taglines[0], taglines: d0.taglines, mission: d0.mission, personality: d0.personality, voiceDo: d0.voiceDo, voiceDont: d0.voiceDont, pillars: d0.pillars, audience: 'youth' };
g = await call('genStart', { id: a.id, key: a.key, kind: 'package', opts: { brand: brandOpt }, data: saveDirs });
await bg.work({ id: a.id, key: a.key, job: g.job });
j = await call('job', { id: a.id, key: a.key, job: g.job });
ok('package: 5 motion + 5 poster prompts', j.status === 'done' && j.result.motion.length === 5 && j.result.posters.length === 5 && j.result.wordmarks.length === 3);
ok('package prompt carries the brand colours and fonts', fake.calls[fake.calls.length - 1].user.includes(d0.colors.primary) && fake.calls[fake.calls.length - 1].user.includes('<final_brand>'));

/* Claude failing */
globalThis.__bfhClaude = fakeClaude({ fail: true });
g = await call('genStart', { id: a.id, key: a.key, kind: 'heart', data });
await bg.work({ id: a.id, key: a.key, job: g.job });
j = await call('job', { id: a.id, key: a.key, job: g.job });
ok('Claude down → error code, not a crash', j.status === 'error' && j.error === 'CLAUDE_DOWN');
ok('teacher sees the error', (await call('teacher', { code: cls.code, tkey: cls.tkey })).students.find(s => s.id === a.id).lastErr.code === 'CLAUDE_DOWN');

/* daily cap */
globalThis.__bfhClaude = fakeClaude();
process.env.BFH_STUDENT_DAILY = '2';
const c = await call('start', { name: 'Cap', code: cls.code });
for (let i = 0; i < 2; i++) { const x = await call('genStart', { id: c.id, key: c.key, kind: 'heart', data }); await bg.work({ id: c.id, key: c.key, job: x.job }); }
ok('daily cap per student', (await call('genStart', { id: c.id, key: c.key, kind: 'heart', data })).error === 'LIMIT_STUDENT');
delete process.env.BFH_STUDENT_DAILY;

/* join / remove */
ok('solo student joins a class', (await call('join', { id: solo.id, key: solo.key, code: cls.code })).cls === cls.code);
ok('teacher removes a student', (await call('teacherRemove', { code: cls.code, tkey: cls.tkey, sid: solo.id })).ok && !(await call('teacher', { code: cls.code, tkey: cls.tkey })).students.some(s => s.id === solo.id));

/* the real Claude caller asks for structured output with a cached system prompt */
delete globalThis.__bfhClaude;
const { callClaude } = await import('../netlify/functions/lib/claude.js');
delete process.env.ANTHROPIC_API_KEY;
let err = ''; try { await callClaude('s', 'u', P.HEART_SCHEMA, 100); } catch (e) { err = e.message; }
ok('no key → NO_KEY from the caller', err === 'NO_KEY');

ok.done();
