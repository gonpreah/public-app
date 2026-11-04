/* The server's rules, against the real handlers: sign-up, the age rules, who
   sees what, teams, the tests' scoring, habits and the week. */
import { memStore, fakeGoogle, checker } from './env.mjs';
globalThis.__gpaStore = memStore();
fakeGoogle();
const { HANDLERS: H, __test } = await import('../netlify/functions/api.js');
const ok = checker();
const Y = Number(__test.today_().slice(0, 4));

/* ---------- 1. sign-up ---------- */
ok('Google is switched on', (await H.authConfig()).google === process.env.GPA_GOOGLE_CLIENT_ID);
ok('a bad Google token is refused', (await H.loginGoogle('nope')).err === 'google');
ok('an unknown Google account is told to sign up, with its name', (await H.loginGoogle('test:sokha:Sokha Chan')).err === 'new');
ok('a bad username is refused', (await H.register('test:sokha:Sokha Chan', { username: 'a', name: 'Sokha Chan', birthYear: 2000 })).err === 'username');
ok('a reserved username is refused', (await H.register('test:sokha:Sokha Chan', { username: 'admin', name: 'Sokha Chan', birthYear: 2000 })).err === 'username');
ok('under 13 cannot make an account', (await H.register('test:kid:Kid', { username: 'kidd', name: 'Kid Kid', birthYear: Y - 12 })).err === 'too_young');
const A = await H.register('test:sokha:Sokha Chan', { username: 'sokha', name: 'Sokha Chan', birthYear: 2000 });
ok('an adult signs up', A.ok && A.me.username === 'sokha' && A.me.minor === false && /^[a-f0-9]{48}$/.test(A.token));
ok('the same Google account cannot sign up twice', (await H.register('test:sokha:Sokha Chan', { username: 'sokha2', name: 'Sokha', birthYear: 2000 })).err === 'exists');
ok('a taken username is refused', (await H.register('test:dara:Dara', { username: 'sokha', name: 'Dara Keo', birthYear: 2001 })).err === 'taken');
ok('checkUsername says taken / free', !(await H.checkUsername('sokha')).free && (await H.checkUsername('dara_k')).free);
const B = await H.register('test:dara:Dara Keo', { username: 'dara_k', name: 'Dara Keo', birthYear: 1999 });
const M = await H.register('test:mina:Mina Sok', { username: 'mina', name: 'Mina Sok', birthYear: Y - 16 });
const E = await H.register('test:eve:Eve Long', { username: 'eve', name: 'Eve Long', birthYear: Y - 18 });
ok('16 is under 18', M.me.minor === true);
ok('born 18 years ago counts as under 18 (they may still be 17)', E.me.minor === true);
const L = await H.loginGoogle('test:sokha:Sokha Chan');
ok('signing in again gives a fresh device token', L.ok && L.uid === A.uid && L.token !== A.token);
ok('both device tokens work', (await H.boot(A.uid, A.token)).ok && (await H.boot(A.uid, L.token)).ok);
ok('a wrong token is refused', (await H.boot(A.uid, 'f'.repeat(48))).err === 'auth');
await H.signOut(A.uid, L.token);
ok('signing out ends that token only', (await H.boot(A.uid, L.token)).err === 'auth' && (await H.boot(A.uid, A.token)).ok);

/* ---------- 2. the search never shows under-18s ---------- */
let s = await H.searchPeople(B.uid, B.token, 'so');
ok('an adult finds another adult by name', s.people.some(p => p.username === 'sokha'));
s = await H.searchPeople(A.uid, A.token, 'mina');
ok('… but never someone under 18', s.people.length === 0);
s = await H.searchPeople(A.uid, A.token, 'eve');
ok('… nor someone who might still be 17', s.people.length === 0);
ok('an under-18 profile is hidden from strangers', (await H.person(A.uid, A.token, M.uid)).err === 'none');
ok('an adult’s card shows their full name', (await H.person(B.uid, B.token, A.uid)).person.name === 'Sokha Chan');

/* ---------- 3. teams ---------- */
ok('under 18 cannot create a team', (await H.createTeam(M.uid, M.token, { name: 'Our club' })).err === 'adult_only');
const T = await H.createTeam(A.uid, A.token, { name: 'Siem Reap Youth', emoji: '🔥' });
ok('an adult creates a team and holds its join code', T.ok && T.team.leader && /^[A-Z2-9]{6}$/.test(T.team.code));
ok('a wrong code is refused', (await H.joinTeam(M.uid, M.token, 'ZZZZZZ')).err === 'code');
const J = await H.joinTeam(M.uid, M.token, T.team.code.toLowerCase());
ok('under 18 joins with the code (any case)', J.ok && !J.team.code && !J.team.leader);
await H.joinTeam(B.uid, B.token, T.team.code);
const tp = await H.team(A.uid, A.token, T.team.id);
const mina = tp.team.people.find(p => p.id === M.uid);
ok('the team page lists everyone', tp.team.people.length === 3);
ok('… an under-18 member by first name only', mina.name === 'Mina');
ok('a member sees an under-18 teammate’s card', (await H.person(B.uid, B.token, M.uid)).ok);
ok('only leaders get the join code', !(await H.team(B.uid, B.token, T.team.id)).team.code);
ok('a non-member cannot open a team', (await H.team(E.uid, E.token, T.team.id)).err === 'none');
ok('a leader cannot make an under-18 a leader', (await H.teamManage(A.uid, A.token, T.team.id, 'lead', M.uid)).err === 'adult_only');
ok('a member who is not a leader cannot manage', (await H.teamManage(B.uid, B.token, T.team.id, 'remove', M.uid)).err === 'not_leader');
const nc = await H.teamManage(A.uid, A.token, T.team.id, 'code');
ok('a new code replaces the old one', nc.ok && nc.team.code !== T.team.code && (await H.joinTeam(E.uid, E.token, T.team.code)).err === 'code');
ok('nobody can invite an under-18 from the search', (await H.inviteToTeam(A.uid, A.token, T.team.id, E.uid)).err === 'none');
const F = await H.register('test:fred:Fred Ty', { username: 'fred', name: 'Fred Ty', birthYear: 1995 });
ok('a leader invites an adult', (await H.inviteToTeam(A.uid, A.token, T.team.id, F.uid)).ok);
const fb = await H.boot(F.uid, F.token);
ok('… who sees the invite', fb.me.invites.length === 1 && fb.me.invites[0].name === 'Siem Reap Youth');
const fa = await H.answerInvite(F.uid, F.token, T.team.id, true);
ok('… and joins by saying yes', fa.ok && fa.me.teams.indexOf(T.team.id) > -1 && fa.me.invites.length === 0);
ok('the last leader cannot walk out on their team', (await H.leaveTeam(A.uid, A.token, T.team.id)).err === 'last_leader');
ok('a member can leave', (await H.leaveTeam(F.uid, F.token, T.team.id)).ok && (await H.team(F.uid, F.token, T.team.id)).err === 'none');
const rm = await H.teamManage(A.uid, A.token, T.team.id, 'remove', B.uid);
ok('a leader can remove someone', rm.ok && rm.team.people.length === 2 && (await H.boot(B.uid, B.token)).me.teams.length === 0);
ok('once out of the team, an under-18 is hidden again', (await H.person(B.uid, B.token, M.uid)).err === 'none');

/* ---------- 4. progress, not details ---------- */
await H.saveHabits(M.uid, M.token, [{ id: 'bible' }, { id: 'english' }, { id: 'c_x', label: 'Call grandma' }]);
const today = __test.today_();
let r = await H.tickHabit(M.uid, M.token, today, 'bible', true);
ok('a tick counts today', r.ok && r.me.days[today].bible === true && r.me.stats.streak === 1);
ok('a tick for a habit you don’t have is refused', (await H.tickHabit(M.uid, M.token, today, 'exercise', true)).err === 'habit');
ok('a tick a week ago is refused', (await H.tickHabit(M.uid, M.token, '2020-01-01', 'bible', true)).err === 'day');
const wk = __test.weekOf_(today);
r = await H.saveWeek(M.uid, M.token, wk, [{ text: 'Read Mark 1–4', pct: 50 }, { text: 'Help at home', pct: 101 }, { text: 'x', pct: 30 }, { text: 'fourth', pct: 0 }]);
ok('a week keeps three goals, % rounded and capped', r.ok && r.me.weeks[wk].length === 3 && r.me.weeks[wk][1].pct === 100);
const tue = new Date(wk + 'T00:00:00Z'); tue.setUTCDate(tue.getUTCDate() + 1);
ok('a week must be a Monday', (await H.saveWeek(M.uid, M.token, tue.toISOString().slice(0, 10), [])).err === 'week');
const card = (await H.team(A.uid, A.token, T.team.id)).team.people.find(p => p.id === M.uid);
ok('teammates see the streak and the week’s %', card.streak === 1 && card.week === 60);
const raw = JSON.stringify(card);
ok('… never the goals or the habit names', !/Read Mark|Help at home|Call grandma|bible/.test(raw), raw);
ok('… never the birth year', !/birthYear|2010|20\d\d/.test(raw.replace(/"id":"[^"]+"/g, '')));
await H.saveProfile(M.uid, M.token, { share: { streak: false } });
const card2 = (await H.team(A.uid, A.token, T.team.id)).team.people.find(p => p.id === M.uid);
ok('switching off the streak hides it', card2.streak === undefined && card2.week === 60);

/* ---------- 5. the tests ---------- */
ok('scores that disagree with the type are refused', (await H.savePersonality(M.uid, M.token, { type: 'INFJ', scores: { E: 80, S: 30, T: 30, J: 70 } })).err === 'scores');
r = await H.savePersonality(M.uid, M.token, { type: 'INFJ', scores: { E: 20, S: 30, T: 30, J: 70 }, sex: 'female' });
ok('a type with matching scores saves', r.ok && r.me.personality.type === 'INFJ' && r.me.personality.source === 'test');
ok('a type picked without a test saves too', (await H.savePersonality(B.uid, B.token, { type: 'ESTP' })).me.personality.source === 'picked');
const ans = {}; for (let i = 0; i < 102; i++) ans['p' + i] = (i % 5) - 2;
ok('strengths need every answer', (await H.saveStrengths(M.uid, M.token, { answers: { p0: 1 } })).err === 'answers');
r = await H.saveStrengths(M.uid, M.token, { answers: ans, top: ['voice', 'voice'] });
ok('the server works out the Top 5 (a sent top is ignored)', r.ok && r.me.gstrengths.top.length === 5 && JSON.stringify(r.me.gstrengths.top) === JSON.stringify(__test.gsScore_(ans).top));
const c3 = (await H.team(A.uid, A.token, T.team.id)).team.people.find(p => p.id === M.uid);
ok('teammates see the type and Top 5', c3.type === 'INFJ' && c3.strengths.length === 5);
ok('… never the answers or scores', !/"answers"|"scores"/.test(JSON.stringify(c3)));
await H.saveStrengths(M.uid, M.token, { share: false });
ok('switching the strengths off hides them', !(await H.team(A.uid, A.token, T.team.id)).team.people.find(p => p.id === M.uid).strengths);

/* ---------- 6. photos ---------- */
const jpg = 'data:image/jpeg;base64,' + Buffer.from('fake-jpeg').toString('base64');
ok('a non-JPEG is refused', (await H.savePhoto(M.uid, M.token, 'data:image/png;base64,AAAA')).err === 'photo');
ok('a photo saves', (await H.savePhoto(M.uid, M.token, jpg)).me.hasPhoto);
ok('a teammate gets an under-18’s photo', (await H.photos(A.uid, A.token, [M.uid])).photos[M.uid] === jpg);
ok('a stranger does not', !(await H.photos(F.uid, F.token, [M.uid])).photos[M.uid]);

/* ---------- 7. the door ---------- */
const api = (await import('../netlify/functions/api.js')).default;
const call = async (body) => (await api(new Request('http://x/', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }))).status;
ok('an unknown function is a 400', await call({ fn: 'constructor', args: [] }) === 400);
ok('bad JSON is a 400', await call('{') === 400);
ok('a known function answers 200', await call({ fn: 'authConfig', args: [] }) === 200);

ok.done();
