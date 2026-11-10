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

/* ---------- 7. the life plan ---------- */
const mon = __test.monthOf_(today), qtr = __test.quarterOf_(today);
ok('a quarter key is worked out from a date', __test.quarterOf_('2027-05-14') === '2027-Q2' && __test.quarterOf_('2027-12-31') === '2027-Q4');
ok('a goal needs a title', (await H.saveGoal(M.uid, M.token, { area: 'study', title: '', by: mon })).err === 'title');
ok('a goal needs an area', (await H.saveGoal(M.uid, M.token, { area: 'nope', title: 'Finish school', by: mon })).err === 'area');
ok('a goal needs a month', (await H.saveGoal(M.uid, M.token, { area: 'study', title: 'Finish school', by: '2027-13' })).err === 'by');
ok('a new goal cannot end in the past', (await H.saveGoal(M.uid, M.token, { area: 'study', title: 'Finish school', by: (Y - 1) + '-01' })).err === 'by');
r = await H.saveGoal(M.uid, M.token, { area: 'study', title: 'Finish grade 12 with good marks', measure: 'Pass the exam with a B', help: 'Study group on Tuesdays', why: 'To study nursing', by: (Y + 1) + '-08' });
ok('a SMART goal saves', r.ok && r.me.plan.goals.length === 1 && r.me.plan.goals[0].measure === 'Pass the exam with a B');
const gid = r.id;
ok('a step needs a month or a quarter', (await H.goalAct(M.uid, M.token, gid, 'addStep', { text: 'Make a timetable', when: 'soon' })).err === 'when');
await H.goalAct(M.uid, M.token, gid, 'addStep', { text: 'Finish all past papers for maths', when: qtr });
r = await H.goalAct(M.uid, M.token, gid, 'addStep', { text: 'Make a study timetable', when: mon });
ok('quarterly and monthly steps save', r.ok && r.me.plan.goals[0].steps.length === 2 && r.me.plan.goals[0].steps[0].when === qtr);
const sid = r.me.plan.goals[0].steps[1].id;
r = await H.goalAct(M.uid, M.token, gid, 'tickStep', { id: sid, done: true });
ok('a step can be ticked', r.ok && r.me.plan.goals[0].steps[1].done === today);
await H.savePlanWhy(M.uid, M.token, 'To care for sick people like Jesus did');
await H.saveProfile(M.uid, M.token, { share: { streak: true } });
const c4 = (await H.team(A.uid, A.token, T.team.id)).team.people.find(p => p.id === M.uid);
ok('teammates see the plan as counts', c4.plan && c4.plan.goals === 1 && c4.plan.steps === 1);
ok('… never the goal, the steps or the why', !/grade 12|timetable|past papers|nursing|sick people|measure|"why"/.test(JSON.stringify(c4)), JSON.stringify(c4));
await H.saveProfile(M.uid, M.token, { share: { plan: false } });
ok('switching the plan off hides it', !(await H.team(A.uid, A.token, T.team.id)).team.people.find(p => p.id === M.uid).plan);
r = await H.goalAct(M.uid, M.token, gid, 'reach', { done: true });
ok('a goal can be reached', r.ok && r.me.plan.goals[0].done === today);
ok('someone else’s goal can’t be touched', (await H.goalAct(A.uid, A.token, gid, 'delete')).err === 'none');
for (let i = 0; i < 8; i++) await H.saveGoal(A.uid, A.token, { area: 'faith', title: 'Goal ' + i, by: mon });
ok('at most eight life goals at once', (await H.saveGoal(A.uid, A.token, { area: 'faith', title: 'One too many', by: mon })).err === 'too_many');

/* ---------- 8. tasks ---------- */
r = await H.myTask(M.uid, M.token, 'add', { text: 'Buy a new notebook', due: today });
ok('a task saves', r.ok && r.me.tasks.length === 1 && r.me.tasks[0].due === today);
r = await H.myTask(M.uid, M.token, 'tick', { id: r.me.tasks[0].id, done: true });
ok('a task can be ticked', r.me.tasks[0].done === today);
ok('an empty task is refused', (await H.myTask(M.uid, M.token, 'add', { text: '  ' })).err === 'text');
ok('a member who isn’t a leader can’t set a team task', (await H.teamTask(M.uid, M.token, T.team.id, 'add', { text: 'Bring snacks' })).err === 'not_leader');
r = await H.teamTask(A.uid, A.token, T.team.id, 'add', { text: 'Read Mark 5 before Friday' });
ok('a leader sets a task for everyone', r.ok && r.team.tasks.length === 1 && r.team.tasks[0].of === 2 && r.team.tasks[0].n === 0);
r = await H.teamTask(A.uid, A.token, T.team.id, 'add', { text: 'Bring the guitar', who: M.uid });
ok('… or for one person, by name', r.ok && r.team.tasks[1].whoName === 'Mina' && r.team.tasks[1].of === 1);
ok('a leader can’t set a task for someone outside the team', (await H.teamTask(A.uid, A.token, T.team.id, 'add', { text: 'x', who: F.uid })).err === 'none');
const mb = await H.boot(M.uid, M.token);
ok('the member sees both tasks waiting on Home', mb.teamTasks.length === 2 && mb.teamTasks[0].teamName === 'Siem Reap Youth');
const k1 = r.team.tasks[0].id, k2 = r.team.tasks[1].id;
r = await H.teamTask(M.uid, M.token, T.team.id, 'tick', { id: k1, done: true });
ok('the member ticks theirs', r.ok && r.team.tasks[0].mine && r.team.tasks[0].n === 1);
ok('a task for someone else can’t be ticked', (await H.teamTask(A.uid, A.token, T.team.id, 'tick', { id: k2, done: true })).err === 'none');
ok('a stranger can’t see or tick team tasks', (await H.teamTask(F.uid, F.token, T.team.id, 'tick', { id: k1, done: true })).err === 'none');
ok('a member can’t delete a team task', (await H.teamTask(M.uid, M.token, T.team.id, 'drop', { id: k1 })).err === 'not_leader');
r = await H.teamTask(A.uid, A.token, T.team.id, 'drop', { id: k1 });
ok('a leader can delete one', r.ok && r.team.tasks.length === 1);

/* ---------- 9. 1-on-1s ---------- */
ok('an under-18 can’t be coached while the team has one leader', (await H.coachAsk(M.uid, M.token, A.uid, T.team.id, 'mentee')).err === 'second_leader');
await H.joinTeam(B.uid, B.token, nc.team.code);
await H.teamManage(A.uid, A.token, T.team.id, 'lead', B.uid);
ok('nobody under 18 can be a coach', (await H.coachAsk(A.uid, A.token, M.uid, T.team.id, 'mentee')).err === 'not_leader');
ok('only a leader of the team can coach', (await H.coachAsk(M.uid, M.token, F.uid, T.team.id, 'mentee')).err === 'none');
let co = await H.coachAsk(M.uid, M.token, A.uid, T.team.id, 'mentee');
ok('with two leaders, she asks a leader to be her coach', co.ok);
const cid = co.id;
ok('… and can’t ask the same person twice', (await H.coachAsk(M.uid, M.token, A.uid, T.team.id, 'mentee')).err === 'already');
ok('she can’t say yes to her own ask', (await H.coachAnswer(M.uid, M.token, cid, true)).err === 'none');
ok('another leader can’t see an ask that isn’t answered yet', (await H.coaching(B.uid, B.token, cid)).err === 'none');
ok('the coach says yes', (await H.coachAnswer(A.uid, A.token, cid, true)).ok);
const ab = await H.boot(A.uid, A.token);
ok('the coach sees it on start-up', ab.coach.some(c => c.id === cid && c.role === 'coach' && c.status === 'active' && c.other.name === 'Mina'));
co = await H.coachAct(M.uid, M.token, cid, 'new', { date: today });
ok('a 1-on-1 starts', co.ok && co.mid && co.coaching.meetings.length === 1);
const mid = co.mid;
co = await H.coachAct(M.uid, M.token, cid, 'save', { mid, checkin: { faith: 4, family: 2, study: 9, money: 'x' }, good: 'Passed my test', hard: 'Arguing at home' });
ok('her check-in keeps only real answers (1–5)', co.ok && JSON.stringify(co.coaching.meetings[0].checkin) === '{"faith":4,"family":2}');
ok('she can’t write the coach’s own notes', (await H.coachAct(M.uid, M.token, cid, 'save', { mid, priv: 'x' })).err === 'none');
await H.coachAct(A.uid, A.token, cid, 'save', { mid, notes: 'Talked about home. Pray together next time.', priv: 'Check in with her mum?' });
await H.coachAct(A.uid, A.token, cid, 'addFollow', { mid, text: 'Read Psalm 23 each morning', who: 'mentee' });
co = await H.coachAct(A.uid, A.token, cid, 'next', { date: __test.today_() });
ok('the coach sees their own notes and sets the next date', co.coaching.meetings[0].priv === 'Check in with her mum?' && co.coaching.next === today);
const mv = (await H.coaching(M.uid, M.token, cid)).coaching;
ok('she sees the shared notes and her follow-up, not the coach’s own notes', mv.meetings[0].notes.startsWith('Talked') && mv.myFollow === 1 && !('priv' in mv.meetings[0]));
ok('… and is told it isn’t private between two people', mv.minor === true);
const bv = await H.coaching(B.uid, B.token, cid);
ok('another leader of the team can read an under-18’s 1-on-1s', bv.ok && bv.coaching.role === 'leader' && bv.coaching.meetings[0].good === 'Passed my test');
ok('… but not the coach’s own notes', !/mum/.test(JSON.stringify(bv)));
ok('… and lists them', (await H.coachings(B.uid, B.token)).coachings.some(c => c.id === cid && c.role === 'leader'));
ok('… but can’t write in them', (await H.coachAct(B.uid, B.token, cid, 'save', { mid, notes: 'x' })).err === 'none');
ok('a stranger can’t see them', (await H.coaching(E.uid, E.token, cid)).err === 'none' && (await H.coaching(F.uid, F.token, cid)).err === 'none');
ok('the coach can’t see her life plan until she shares it', !(await H.coaching(A.uid, A.token, cid)).coaching.plan);
ok('only she can share it', (await H.coachAct(A.uid, A.token, cid, 'sharePlan', { on: true })).err === 'none');
await H.coachAct(M.uid, M.token, cid, 'sharePlan', { on: true });
ok('once shared, the coach sees her plan', (await H.coaching(A.uid, A.token, cid)).coaching.plan.goals.length === 1);
ok('… other leaders still don’t', !(await H.coaching(B.uid, B.token, cid)).coaching.plan);
await H.journey(M.uid, M.token, 'save', { answers: { hard: 'A secret hard time', areas: { study: 'A nurse' } }, stop: 'home' });
await H.journey(M.uid, M.token, 'vision', { vision: 'I’m Mina, a child of God.', word: 'Brave' });
const cpv = await H.coaching(A.uid, A.token, cid);
ok('the coach she shares her plan with sees her vision — never the Life Journey’s answers', cpv.coaching.plan.vision.startsWith('I’m Mina') && cpv.coaching.plan.word === 'Brave' && !/secret|story/.test(JSON.stringify(cpv)));
const fid = (await H.coaching(M.uid, M.token, cid)).coaching.meetings[0].follow[0].id;
ok('she ticks her follow-up', (await H.coachAct(M.uid, M.token, cid, 'tickFollow', { mid, fid, done: true })).coaching.myFollow === 0);
co = await H.coachAsk(B.uid, B.token, M.uid, T.team.id, 'coach');
ok('a leader can offer to coach', co.ok && (await H.coachAnswer(M.uid, M.token, co.id, true)).ok);
const cid2 = co.id;
await H.coachAct(B.uid, B.token, cid2, 'new', {});
await H.teamManage(A.uid, A.token, T.team.id, 'remove', B.uid);
ok('a coach who leaves the team loses access at once', (await H.coaching(B.uid, B.token, cid2)).err === 'none');
const kept = await H.coaching(M.uid, M.token, cid2);
ok('… she keeps her history, but nothing more can be added', kept.ok && kept.coaching.meetings.length === 1 && !kept.coaching.live && (await H.coachAct(M.uid, M.token, cid2, 'new', {})).err === 'none');
ok('either of them can end it', (await H.coachAct(M.uid, M.token, cid, 'end')).coaching.status === 'ended');

/* ---------- 10. the feed, 👏, blocking, reports and the admin ---------- */
let fd = await H.feed(A.uid, A.token);
const minasType = fd.feed.find(x => x.who.id === M.uid && x.kind === 'type');
ok('the feed shows a teammate’s moments: her type, and joining the team', !!minasType && minasType.n === 'INFJ' && fd.feed.some(x => x.who.id === M.uid && x.kind === 'joined' && /Siem Reap Youth/.test(x.team)));
ok('… by first name if she’s under 18', minasType.who.name === 'Mina');
ok('… not her strengths (switched off) or her goal (plan switched off)', !fd.feed.some(x => x.who.id === M.uid && (x.kind === 'strengths' || x.kind === 'goal')));
ok('… never anyone’s own words', !/grade 12|timetable|Psalm|notebook|nursing/.test(JSON.stringify(fd)));
ok('someone in none of her teams sees none of it', !(await H.feed(E.uid, E.token)).feed.some(x => x.who.id === M.uid));
ok('a stranger can’t 👏', (await H.clap(E.uid, E.token, M.uid, minasType.id, true)).err === 'none');
ok('nobody 👏s their own moment', (await H.clap(M.uid, M.token, M.uid, minasType.id, true)).err === 'none');
ok('a teammate 👏s', (await H.clap(A.uid, A.token, M.uid, minasType.id, true)).n === 1);
ok('… and she sees who cheered her on Home', (await H.boot(M.uid, M.token)).cheers.some(c => c.kind === 'type' && c.names[0] === 'Sokha Chan'));
await H.saveProfile(M.uid, M.token, { share: { feed: false } });
ok('the feed switch hides all her moments', !(await H.feed(A.uid, A.token)).feed.some(x => x.who.id === M.uid));
await H.saveProfile(M.uid, M.token, { share: { feed: true } });
/* blocking */
r = await H.block(M.uid, M.token, A.uid, true);
ok('she blocks someone', r.ok && r.me.blocked === 1);
ok('… who can no longer open her card or see her in the feed', (await H.person(A.uid, A.token, M.uid)).err === 'none' && !(await H.feed(A.uid, A.token)).feed.some(x => x.who.id === M.uid));
ok('… nor 👏 her', (await H.clap(A.uid, A.token, M.uid, minasType.id, false)).err === 'none');
ok('… and she doesn’t see them in her team', !(await H.team(M.uid, M.token, T.team.id)).team.people.some(p => p.id === A.uid));
ok('… though a leader still sees every member, to look after the team', (await H.team(A.uid, A.token, T.team.id)).team.people.some(p => p.id === M.uid));
ok('she sees who she blocked', (await H.blockedList(M.uid, M.token)).people[0].id === A.uid);
await H.block(M.uid, M.token, A.uid, false);
ok('unblocking brings it back', (await H.person(A.uid, A.token, M.uid)).ok);
/* a leader removes a member's photo */
ok('a member can’t remove someone’s photo', (await H.teamManage(M.uid, M.token, T.team.id, 'photo', A.uid)).err === 'not_leader');
r = await H.teamManage(A.uid, A.token, T.team.id, 'photo', M.uid);
ok('a leader removes a member’s photo', r.ok && !(await H.boot(M.uid, M.token)).me.hasPhoto && !(await H.photos(A.uid, A.token, [M.uid])).photos[M.uid]);
/* reports and the admin (Fred) */
process.env.GPA_ADMIN_EMAILS = 'someone@else.org, fred@example.com';
ok('the admin is whoever’s Google email is listed', (await H.boot(F.uid, F.token)).me.admin === true && (await H.boot(M.uid, M.token)).me.admin === false);
await H.saveProfile(A.uid, A.token, { bio: 'Rude words here' });
ok('a report needs a reason kind', (await H.report(M.uid, M.token, { who: A.uid, what: 'x' })).err === 'what');
ok('you can’t report someone you can’t see', (await H.report(E.uid, E.token, { who: M.uid, what: 'photo' })).err === 'none');
ok('she reports a line about someone', (await H.report(M.uid, M.token, { who: A.uid, what: 'bio', reason: 'It is rude' })).ok);
ok('only the admin sees reports', (await H.adminReports(M.uid, M.token)).err === 'not_admin');
let ar = await H.adminReports(F.uid, F.token);
const rep1 = ar.reports[0];
ok('the admin sees it: who, what, the line, who reported', ar.reports.length === 1 && rep1.person.name === 'Sokha Chan' && rep1.person.bio === 'Rude words here' && /Mina/.test(rep1.byName) && rep1.reason === 'It is rude');
ar = await H.adminAct(F.uid, F.token, rep1.id, 'bio');
ok('the admin removes the line, and the report is done', ar.ok && ar.reports.length === 0 && (await H.boot(A.uid, A.token)).me.bio === '');
await H.report(M.uid, M.token, { who: A.uid, what: 'other', reason: 'Asked me for money' });
const rep2 = (await H.adminReports(F.uid, F.token)).reports[0];
await H.adminAct(F.uid, F.token, rep2.id, 'suspend');
ok('a suspended account is signed out and can’t sign in', (await H.boot(A.uid, A.token)).err === 'auth' && (await H.loginGoogle('test:sokha:Sokha Chan')).err === 'suspended');
ok('… and is gone from the team and the search', !(await H.team(M.uid, M.token, T.team.id)).team.people.some(p => p.id === A.uid) && !(await H.searchPeople(F.uid, F.token, 'sokha')).people.length);
await H.adminAct(F.uid, F.token, rep2.id, 'unsuspend');
ok('… and can lift it', (await H.boot(A.uid, A.token)).ok);
ok('a team can be reported by someone in it', (await H.report(M.uid, M.token, { team: T.team.id, what: 'team', reason: 'Bad name' })).ok && (await H.report(E.uid, E.token, { team: T.team.id, what: 'team' })).err === 'none');
const rep3 = (await H.adminReports(F.uid, F.token)).reports.find(x => x.what === 'team');
ok('the admin sees the team', rep3.teamInfo.name === 'Siem Reap Youth');
await H.adminAct(F.uid, F.token, rep3.id, 'closeTeam');
ok('closing a team takes everyone out of it, and its code stops working', (await H.boot(M.uid, M.token)).me.teams.length === 0 && (await H.team(A.uid, A.token, T.team.id)).err === 'none' && (await H.joinTeam(E.uid, E.token, nc.team.code)).err === 'code');
ok('the admin sees past reports too', (await H.adminReports(F.uid, F.token, true)).reports.length === 3);
delete process.env.GPA_ADMIN_EMAILS;

/* ---------- 11. username and password ---------- */
ok('a password must be 4 characters or more — easy is fine', (await H.registerPassword({ username: 'kosal', name: 'Kosal Meas', birthYear: 2001, password: 'abc' })).err === 'password');
ok('under 13 can’t make an account with a password either', (await H.registerPassword({ username: 'kidpw', name: 'Kid Pw', birthYear: Y - 12, password: 'longenough' })).err === 'too_young');
ok('a taken username is refused', (await H.registerPassword({ username: 'sokha', name: 'Someone', birthYear: 2001, password: 'longenough' })).err === 'taken');
const P = await H.registerPassword({ username: 'Kosal', name: 'Kosal Meas', birthYear: 2001, password: 'my good password' });
ok('an account with a username and password', P.ok && P.me.username === 'kosal' && P.me.hasPassword && P.me.minor === false);
ok('… never stores the password itself', !JSON.stringify(globalThis.__gpaStore._m.get('u:' + P.uid)).includes('my good password'));
const PM = await H.registerPassword({ username: 'srey', name: 'Srey Pich', birthYear: Y - 15, password: 'another pass' });
ok('a 15-year-old with a password is under 18, as with Google', PM.ok && PM.me.minor === true && !(await H.searchPeople(P.uid, P.token, 'srey')).people.length);
let pl = await H.loginPassword('KOSAL', 'my good password');
ok('sign in with username (any case) and password', pl.ok && pl.uid === P.uid && pl.token !== P.token && (await H.boot(P.uid, pl.token)).ok);
ok('a wrong password is refused', (await H.loginPassword('kosal', 'wrong password')).err === 'login');
ok('an unknown username says the same', (await H.loginPassword('nobody_here', 'my good password')).err === 'login');
ok('a Google account has no password to sign in with', (await H.loginPassword('sokha', 'anything at all')).err === 'google_only');
for (let i = 0; i < 12; i++) await H.loginPassword('kosal', 'wrong password');
ok('no lock after wrong tries — the right one still works', (await H.loginPassword('kosal', 'my good password')).ok);
ok('a new password needs 4 characters', (await H.setPassword(P.uid, P.token, '', 'abc')).err === 'password');
ok('signed in, I change mine without the old one', (await H.setPassword(P.uid, P.token, '', '1234')).ok && (await H.loginPassword('@kosal', '1234')).ok);
ok('a Google account can add a password', (await H.setPassword(A.uid, A.token, '', 'sokha password')).ok && (await H.loginPassword('sokha', 'sokha password')).ok);
ok('forgot it: a wrong birth year doesn’t open it', (await H.resetOwnPassword('kosal', 1999, 'mynewpw')).err === 'match' && (await H.resetOwnPassword('nobody_here', 2001, 'mynewpw')).err === 'match');
const own = await H.resetOwnPassword('@Kosal', '2001', 'mynewpw');
ok('… my username and birth year set a new one and sign me in', own.ok && own.uid === P.uid && (await H.boot(P.uid, own.token)).ok && (await H.loginPassword('kosal', 'mynewpw')).ok);
for (let i = 0; i < 10; i++) await H.resetOwnPassword('srey', 1900, 'guessing');
ok('… ten wrong birth years a day at most', (await H.resetOwnPassword('srey', Y - 15, 'right year')).err === 'too_many');
ok('only the admin or a leader can set someone else’s password', (await H.setUserPassword(P.uid, P.token, 'srey', 'abcd')).err === 'not_admin');
const Q0 = await H.registerPassword({ username: 'notadmin', name: 'Not Admin', birthYear: 2000, password: 'notadmin password' });
const LT = await H.createTeam(Q0.uid, Q0.token, { name: 'Password class' });
const AM = await H.registerPassword({ username: 'adultmember', name: 'Adult Member', birthYear: 2001, password: 'am password' });
await H.joinTeam(AM.uid, AM.token, LT.team.code); await H.joinTeam(PM.uid, PM.token, LT.team.code);
ok('a leader sets the password of an adult in their team, to anything', (await H.setUserPassword(Q0.uid, Q0.token, 'adultmember', 'class2026')).password === 'class2026' && (await H.loginPassword('adultmember', 'class2026')).ok);
ok('… not of someone under 18 — that’s the admin', (await H.setUserPassword(Q0.uid, Q0.token, 'srey', 'abcd')).err === 'not_admin');
process.env.GPA_ADMIN_USERNAMES = 'kosal';
ok('an admin named by username', (await H.boot(P.uid, P.token)).me.admin === true);
const rp = await H.adminResetPassword(P.uid, P.token, 'srey');
ok('the admin sets anyone’s: an easy one (“mango4821”) if none is given — and the old sign-ins carry on', rp.ok && /^[a-z]+\d{4}$/.test(rp.password) && (await H.boot(PM.uid, PM.token)).ok && (await H.loginPassword('srey', rp.password)).ok);
ok('… or the one they choose', (await H.setUserPassword(P.uid, P.token, 'srey', 'srey2026')).ok && (await H.loginPassword('srey', 'srey2026')).ok);
await H.setUserPassword(P.uid, P.token, 'srey', rp.password);
const FG = await H.registerPassword({ username: 'forgot1', name: 'For Got', birthYear: 2000, password: 'forgot1 password' });
ok('“Tell the admin” answers the same for a name that isn’t there', (await H.forgotPassword('nobody_here')).ok && (await H.adminReports(P.uid, P.token, false)).pwAsks.length === 0);
ok('… and for a real one, the ask waits for the admin', (await H.forgotPassword('@FORGOT1')).ok && (await H.adminReports(P.uid, P.token, false)).pwAsks.map(x => x.username).join() === 'forgot1');
await H.forgotPassword('forgot1');
ok('… once, however many times they tap', (await H.adminReports(P.uid, P.token, false)).pwAsks.length === 1 && (await H.boot(P.uid, P.token)).pwAsks === 1);
ok('the admin’s phone is remembered, to be told when someone asks', (JSON.parse(globalThis.__gpaStore._m.get('admins') || '[]')).includes(P.uid));
ok('nobody else sees or clears the asks', (await H.adminReports(Q0.uid, Q0.token, false)).err === 'not_admin' && (await H.dropPwAsk(Q0.uid, Q0.token, FG.uid)).err === 'not_admin');
const rp2 = await H.setUserPassword(P.uid, P.token, 'forgot1', '');
ok('setting it clears the ask', rp2.ok && (await H.adminReports(P.uid, P.token, false)).pwAsks.length === 0 && (await H.loginPassword('forgot1', rp2.password)).ok);
await H.forgotPassword('forgot1'); globalThis.__gpaStore._m.set('pwAsks', JSON.stringify(JSON.parse(globalThis.__gpaStore._m.get('pwAsks')).map(x => Object.assign(x, { at: new Date(Date.now() - 3600e3).toISOString() }))));
ok('the admin can clear an ask without setting one', (await H.dropPwAsk(P.uid, P.token, FG.uid)).pwAsks.length === 0);
delete process.env.GPA_ADMIN_USERNAMES;

/* ---------- 12. Today: three things, focus time, the evening check-in ---------- */
const Q = await H.registerPassword({ username: 'thida', name: 'Thida Ros', birthYear: 2002, password: 'thida password' });
const Q2 = await H.registerPassword({ username: 'vanna', name: 'Vanna Ly', birthYear: 2000, password: 'vanna password' });
const QT = await H.createTeam(Q2.uid, Q2.token, { name: 'Study crew' });
await H.joinTeam(Q.uid, Q.token, QT.team.code);
ok('today’s three must be for about today', (await H.saveTop(Q.uid, Q.token, '2020-01-01', [{ text: 'x' }])).err === 'day');
r = await H.saveTop(Q.uid, Q.token, today, [{ text: 'Finish the essay' }, { text: 'Call Mum', done: true }, { text: '' }, { text: 'fourth' }]);
ok('today’s three save (empty ones dropped)', r.ok && r.me.daily[today].top.length === 2 && r.me.daily[today].top[1].done === true);
ok('… and tomorrow can be planned tonight', (await H.saveTop(Q.uid, Q.token, new Date(Date.parse(today) + 864e5).toISOString().slice(0, 10), [{ text: 'Gym' }])).ok);
ok('a check-in needs a mood from 1 to 5', (await H.saveCheckin(Q.uid, Q.token, today, { mood: 9 })).err === 'mood');
r = await H.saveCheckin(Q.uid, Q.token, today, { mood: 4, grateful: 'My sister helped me study' });
ok('the evening check-in saves', r.ok && r.me.daily[today].mood === 4 && r.me.daily[today].grateful === 'My sister helped me study');
ok('focus needs 5 to 180 minutes', (await H.logFocus(Q.uid, Q.token, today, 2)).err === 'minutes' && (await H.logFocus(Q.uid, Q.token, today, 500)).err === 'minutes');
for (let i = 0; i < 4; i++) r = await H.logFocus(Q.uid, Q.token, today, 30);
ok('focus sessions add up', r.ok && r.me.daily[today].focus === 120 && r.me.daily[today].sessions === 4 && r.me.stats.focusWeek === 120);
let qf = (await H.feed(Q2.uid, Q2.token)).feed.find(x => x.who.id === Q.uid && x.kind === 'focus');
ok('two hours of focus this week is a moment in the team’s feed', qf && qf.n === 2);
const qcard = (await H.team(Q2.uid, Q2.token, QT.team.id)).team.people.find(p => p.id === Q.uid);
ok('teammates see focus minutes this week', qcard.focusWeek === 120);
ok('… never her three things, her mood or what she’s thankful for', !/essay|Call Mum|sister|"mood"|grateful|"top"/.test(JSON.stringify(qcard) + JSON.stringify(await H.feed(Q2.uid, Q2.token))));
await H.saveProfile(Q.uid, Q.token, { share: { focus: false } });
ok('switching focus off hides it', !(await H.team(Q2.uid, Q2.token, QT.team.id)).team.people.find(p => p.id === Q.uid).focusWeek && !(await H.feed(Q2.uid, Q2.token)).feed.some(x => x.who.id === Q.uid && x.kind === 'focus'));

/* ---------- 13. team challenges ---------- */
ok('only a leader starts a challenge', (await H.challenge(Q.uid, Q.token, QT.team.id, 'add', { title: '7 days of Bible', days: 7 })).err === 'not_leader');
ok('a challenge is 3 to 40 days', (await H.challenge(Q2.uid, Q2.token, QT.team.id, 'add', { title: 'Too long', days: 90 })).err === 'days');
let ch = await H.challenge(Q2.uid, Q2.token, QT.team.id, 'add', { title: '7 days of Bible', emoji: '📖', days: 7 });
const chal = ch.team.challenges[0];
ok('a leader starts one, from today, and is in it', ch.ok && chal.state === 'on' && chal.dayNo === 1 && chal.joined && chal.end > chal.start);
ok('a member sees it and isn’t in it until they join', !(await H.team(Q.uid, Q.token, QT.team.id)).team.challenges[0].joined);
ch = await H.challenge(Q.uid, Q.token, QT.team.id, 'join', { id: chal.id, on: true });
ok('she joins', ch.team.challenges[0].joined && ch.team.challenges[0].people.length === 2);
ok('only days in the challenge, up to today, can be ticked', (await H.challenge(Q.uid, Q.token, QT.team.id, 'tick', { id: chal.id, date: new Date(Date.parse(today) + 864e5).toISOString().slice(0, 10), done: true })).err === 'day');
ch = await H.challenge(Q.uid, Q.token, QT.team.id, 'tick', { id: chal.id, date: today, done: true });
ok('she ticks today, and the team sees her count', ch.team.challenges[0].doneToday && ch.team.challenges[0].people.find(p => p.id === Q.uid).n === 1);
ok('her joined challenges come with her start-up, for Home', (await H.boot(Q.uid, Q.token)).challenges.some(c => c.id === chal.id && c.doneToday && c.teamName === 'Study crew'));
ok('someone outside the team can’t touch it', (await H.challenge(E.uid, E.token, QT.team.id, 'tick', { id: chal.id, done: true })).err === 'none');
/* finish a 3-day challenge (its first two days set by hand, as if ticked on those days) */
ch = await H.challenge(Q2.uid, Q2.token, QT.team.id, 'add', { title: 'No phone after 10pm', emoji: '📵', days: 3 });
const ch3 = ch.team.challenges.find(c => c.days === 3);
const tk = JSON.parse(globalThis.__gpaStore._m.get('t:' + QT.team.id)), cc = tk.challenges.find(c => c.id === ch3.id);
cc.start = new Date(Date.parse(today) - 2 * 864e5).toISOString().slice(0, 10); cc.members[Q.uid] = [cc.start, new Date(Date.parse(today) - 864e5).toISOString().slice(0, 10)];
globalThis.__gpaStore._m.set('t:' + QT.team.id, JSON.stringify(tk));
await H.challenge(Q.uid, Q.token, QT.team.id, 'tick', { id: ch3.id, date: today, done: true });
const fin = (await H.feed(Q2.uid, Q2.token)).feed.find(x => x.who.id === Q.uid && x.kind === 'challenge');
ok('finishing every day is a feed moment, with the challenge’s name for the team', fin && /No phone after 10pm/.test(fin.team));
ok('… and no name for someone in none of that team', !(await H.feed(E.uid, E.token)).feed.some(x => x.kind === 'challenge'));
ok('a leader can end a challenge; a member can’t', (await H.challenge(Q.uid, Q.token, QT.team.id, 'drop', { id: chal.id })).err === 'not_leader' && (await H.challenge(Q2.uid, Q2.token, QT.team.id, 'drop', { id: chal.id })).team.challenges.length === 1);

/* ---------- 14. XP and levels ---------- */
ok('levels: 100 XP to level 2, then 50 more each', __test.xpForLevel_(2) === 100 && __test.xpForLevel_(3) === 250 && __test.xpForLevel_(4) === 450 && __test.levelOf_(260).level === 3 && __test.levelOf_(0).title === 'Seed');
const X = await H.registerPassword({ username: 'xp_test', name: 'Xp Test', birthYear: 2000, password: 'xp password' });
await H.saveHabits(X.uid, X.token, [{ id: 'bible' }, { id: 'english' }]);
r = await H.tickHabit(X.uid, X.token, today, 'bible', true);
ok('a habit ticked earns 5 XP', r.me.level.xp === 5 && r.me.level.level === 1);
for (let i = 0; i < 3; i++) { await H.tickHabit(X.uid, X.token, today, 'bible', false); r = await H.tickHabit(X.uid, X.token, today, 'bible', true); }
ok('ticking it off and on again earns nothing more', r.me.level.xp === 5);
r = await H.tickHabit(X.uid, X.token, today, 'bible', false);
ok('undoing takes it back', r.me.level.xp === 0);
r = await H.saveTop(X.uid, X.token, today, [{ text: 'a', done: true }, { text: 'b', done: true }, { text: 'c', done: true }]);
ok('all three of today’s things: 3×5 + 10', r.me.level.xp === 25);
r = await H.logFocus(X.uid, X.token, today, 50);
ok('50 minutes of focus: 25 XP', r.me.level.xp === 50);
r = await H.saveCheckin(X.uid, X.token, today, { mood: 3 });
r = await H.saveCheckin(X.uid, X.token, today, { mood: 4 });
ok('the check-in counts once a day', r.me.level.xp === 55);
const xg = await H.saveGoal(X.uid, X.token, { area: 'study', title: 'Pass the exam', by: __test.monthOf_(today) });
r = await H.goalAct(X.uid, X.token, xg.id, 'reach', { done: true });
ok('a goal reached: 100 XP, and level 2', r.me.level.xp === 155 && r.me.level.level === 2);
await H.saveProfile(X.uid, X.token, { share: { level: true } });
const xcard = (await H.person(A.uid, A.token, X.uid)).person;
ok('others see the level, not the XP log', xcard.level && xcard.level.level === 2 && !JSON.stringify(xcard).includes('xpLog'));
await H.saveProfile(X.uid, X.token, { share: { level: false } });
ok('… unless the level switch is off', !(await H.person(A.uid, A.token, X.uid)).person.level);

/* ---------- 15. faith daily: reading plans and prayers ---------- */
const F2 = await H.registerPassword({ username: 'faith_t', name: 'Faith Test', birthYear: 2001, password: 'faith password' });
ok('only known plans', (await H.reading(F2.uid, F2.token, 'start', { plan: 'constructor' })).err === 'none' && (await H.reading(F2.uid, F2.token, 'start', { plan: 'nope' })).err === 'none');
r = await H.reading(F2.uid, F2.token, 'start', { plan: 'hard_days' });
ok('a reading plan starts', r.ok && r.me.reading.hard_days.start === today && r.me.reading.hard_days.done.length === 0);
ok('the plans come with start-up — passages only, never the Bible’s text', (await H.boot(F2.uid, F2.token)).plans.hard_days[0] === 'Psalms 23');
ok('a day out of range is refused', (await H.reading(F2.uid, F2.token, 'tick', { plan: 'hard_days', day: 7, done: true })).err === 'none');
r = await H.reading(F2.uid, F2.token, 'tick', { plan: 'hard_days', day: 0, done: true });
ok('a day read: ticked, and 10 XP', r.me.reading.hard_days.done[0] === 0 && r.me.level.xp === 10);
await H.reading(F2.uid, F2.token, 'tick', { plan: 'hard_days', day: 0, done: false });
r = await H.reading(F2.uid, F2.token, 'tick', { plan: 'hard_days', day: 0, done: true });
ok('… once', r.me.level.xp === 10);
for (let i = 1; i < 7; i++) r = await H.reading(F2.uid, F2.token, 'tick', { plan: 'hard_days', day: i, done: true });
ok('every day read finishes the plan', r.me.reading.hard_days.finished === today);
await H.reading(F2.uid, F2.token, 'start', { plan: 'john' }); await H.reading(F2.uid, F2.token, 'start', { plan: 'mark' }); await H.reading(F2.uid, F2.token, 'start', { plan: 'proverbs' });
ok('three plans at once at most', (await H.reading(F2.uid, F2.token, 'start', { plan: 'identity' })).err === 'too_many');
ok('a prayer needs words', (await H.prayer(F2.uid, F2.token, 'add', { text: ' ' })).err === 'text');
r = await H.prayer(F2.uid, F2.token, 'add', { text: 'For my grandmother’s health' });
const yid = r.me.prayers[0].id;
r = await H.prayer(F2.uid, F2.token, 'answer', { id: yid, on: true });
ok('a prayer is added and marked answered', r.me.prayers[0].answered === today);
ok('prayers and reading are never on anyone’s card', !/grandmother|hard_days|"prayers"|"reading"/.test(JSON.stringify((await H.person(A.uid, A.token, F2.uid)).person)));

/* ---------- 16. streak freezes and the week's XP ---------- */
const Z = await H.registerPassword({ username: 'freeze_t', name: 'Freeze Test', birthYear: 2001, password: 'freeze password' });
await H.saveHabits(Z.uid, Z.token, [{ id: 'bible' }]);
const day = n => new Date(Date.parse(today) + n * 864e5).toISOString().slice(0, 10);
const setU = (id, f) => { const u = JSON.parse(globalThis.__gpaStore._m.get('u:' + id)); f(u); globalThis.__gpaStore._m.set('u:' + id, JSON.stringify(u)); };
/* six days done before today; ticking today makes seven and earns a freeze */
setU(Z.uid, u => { u.days = {}; for (let i = -6; i <= -1; i++) u.days[day(i)] = { bible: true }; });
r = await H.tickHabit(Z.uid, Z.token, today, 'bible', true);
ok('a 7-day streak earns a streak freeze', r.me.stats.streak === 7 && r.me.stats.freezes === 1);
await H.tickHabit(Z.uid, Z.token, today, 'bible', false); r = await H.tickHabit(Z.uid, Z.token, today, 'bible', true);
ok('… once, however often today is ticked', r.me.stats.freezes === 1);
/* now yesterday is missed: the freeze covers it at start-up */
setU(Z.uid, u => { u.days = {}; for (let i = -8; i <= -2; i++) u.days[day(i)] = { bible: true }; u.seen = day(-1); u.freezes = 1; u.frozen = []; });
let zb = await H.boot(Z.uid, Z.token);
ok('a missed day uses a freeze and the streak lives on', zb.froze.length === 1 && zb.froze[0] === day(-1) && zb.me.stats.streak === 7 && zb.me.stats.freezes === 0);
setU(Z.uid, u => { u.days = {}; for (let i = -9; i <= -3; i++) u.days[day(i)] = { bible: true }; u.seen = day(-1); u.freezes = 1; u.frozen = []; });
zb = await H.boot(Z.uid, Z.token);
ok('two missed days and one freeze: the freeze is kept and the streak ends', zb.froze.length === 0 && zb.me.stats.streak === 0 && zb.me.stats.freezes === 1);
/* the week's XP, for the team's leaderboard */
const ZT = await H.createTeam(Z.uid, Z.token, { name: 'Freeze crew' });
await H.joinTeam(Q.uid, Q.token, ZT.team.code);
await H.saveProfile(Q.uid, Q.token, { share: { level: true } });
const zq = (await H.team(Z.uid, Z.token, ZT.team.id)).team.people.find(p => p.id === Q.uid);
ok('teammates see the XP earned this week, for the leaderboard', zq.xpWeek > 0 && zq.level);

/* ---------- 17. friends, and the leader's dashboard ---------- */
ok('an adult can’t find someone under 18 to be friends', (await H.friendAsk(A.uid, A.token, 'mina')).err === 'none');
ok('nobody is friends with themselves', (await H.friendAsk(A.uid, A.token, 'sokha')).err === 'none');
r = await H.friendAsk(A.uid, A.token, 'fred');
ok('an adult asks another adult', r.ok && r.asked);
let fl = await H.friendsList(F.uid, F.token);
ok('… who sees the ask', fl.asks.length === 1 && fl.asks[0].id === A.uid && fl.friends.length === 0);
fl = await H.friendAnswer(F.uid, F.token, A.uid, true);
ok('saying yes makes them friends, both ways', fl.friends.some(f => f.id === A.uid) && (await H.friendsList(A.uid, A.token)).friends.some(f => f.id === F.uid));
ok('asking again says you’re already friends', (await H.friendAsk(A.uid, A.token, 'fred')).err === 'already');
setU(A.uid, u => { u.days = { [day(-1)]: { bible: true }, [today]: { bible: true } }; });
setU(F.uid, u => { u.days = { [day(-2)]: { x: true }, [day(-1)]: { x: true }, [today]: { x: true } }; });
const af = (await H.friendsList(A.uid, A.token)).friends.find(f => f.id === F.uid);
ok('friends see each other’s streak, today, and their streak together', af.streak === 3 && af.doneToday === true && af.together === 2);
ok('a nudge goes once a day', (await H.friendNudge(A.uid, A.token, F.uid)).ok && (await H.friendNudge(A.uid, A.token, F.uid)).err === 'once_a_day');
ok('a stranger can’t nudge', (await H.friendNudge(E.uid, E.token, F.uid)).err === 'none');
/* someone under 18: only through a shared team */
const sp = await H.loginPassword('srey', rp.password);
await H.joinTeam(PM.uid, sp.token, QT.team.code);
ok('an adult in her team can ask a 15-year-old', (await H.friendAsk(Q.uid, Q.token, 'srey')).ok);
fl = await H.friendAnswer(PM.uid, sp.token, Q.uid, true);
ok('… and she can say yes', fl.friends.some(f => f.id === Q.uid && f.name === 'Thida Ros'));
ok('her name shows as her first name only', (await H.friendsList(Q.uid, Q.token)).friends.find(f => f.id === PM.uid).name === 'Srey');
await H.leaveTeam(PM.uid, sp.token, QT.team.id);
ok('once they no longer share a team, the friendship is hidden', !(await H.friendsList(Q.uid, Q.token)).friends.some(f => f.id === PM.uid) && (await H.friendNudge(Q.uid, Q.token, PM.uid)).err === 'none');
ok('either can end a friendship', !(await H.friendDrop(F.uid, F.token, A.uid)).friends.length && !(await H.friendsList(A.uid, A.token)).friends.some(f => f.id === F.uid));
/* the leader's dashboard */
ok('only a leader sees the team’s pulse', (await H.teamPulse(Q.uid, Q.token, QT.team.id)).err === 'not_leader');
const pulse = (await H.teamPulse(Q2.uid, Q2.token, QT.team.id)).pulse;
const qrow = pulse.rows.find(x => x.id === Q.uid);
ok('the leader sees each member’s last day in the app and their numbers', qrow && qrow.seenAgo === 0 && 'streak' in qrow && pulse.week >= 1);
ok('… never their words', !/essay|Call Mum|sister|grandmother|"why"|"top"|"prayers"/.test(JSON.stringify(pulse)));
ok('a cheer goes once a day', (await H.leaderCheer(Q2.uid, Q2.token, QT.team.id, Q.uid)).ok && (await H.leaderCheer(Q2.uid, Q2.token, QT.team.id, Q.uid)).err === 'once_a_day');
ok('only a leader can cheer', (await H.leaderCheer(Q.uid, Q.token, QT.team.id, Q2.uid)).err === 'not_leader');

/* ---------- 18. the Life Journey, and my vision ---------- */
const JN = await H.registerPassword({ username: 'jona', name: 'Jona Lim', birthYear: 2004, password: 'jona password', lang: 'en' });
let jr = await H.journey(JN.uid, JN.token, 'save', { answers: { best: 'Camp', hard: 'When we lost the farm', gifts: { c: ['music', 'lead', 'teach', 'care'], o: 'Drums' }, fear: { c: ['fail', 'alone'] }, areas: { study: 'A nurse', bogus: 'x' }, evil: 'x', pastWords: { c: ['Bad ID!', 'happy'] } }, stop: 'home' });
ok('a stop is saved with its answers, and 20 XP', jr.ok && jr.me.story.done.join() === 'home' && jr.me.story.a.best === 'Camp' && jr.me.level.xp === 20);
ok('… chips kept to the most a question allows', jr.me.story.a.gifts.c.join() === 'music,lead,teach' && jr.me.story.a.gifts.o === 'Drums' && jr.me.story.a.fear.c.length === 1);
ok('… and only the journey’s own kinds of answers', !('evil' in jr.me.story.a) && !('bogus' in jr.me.story.a.areas) && jr.me.story.a.pastWords.c.join() === 'happy');
ok('a stop gives its XP once', (await H.journey(JN.uid, JN.token, 'save', { answers: {}, stop: 'home' })).me.level.xp === 20);
ok('an unknown stop is refused', (await H.journey(JN.uid, JN.token, 'save', { stop: 'moon' })).err === 'stop');
ok('there’s no vision to read before it’s written', (await H.journey(JN.uid, JN.token, 'read', { date: today })).err === 'none');
ok('a vision needs a few words', (await H.journey(JN.uid, JN.token, 'vision', { vision: 'Hi' })).err === 'text');
jr = await H.journey(JN.uid, JN.token, 'vision', { vision: 'I’m Jona, a child of God.\n\n\n\nFive years from now:\n🎓 A nurse', word: 'Brave', why: 'To help young people' });
ok('the vision is kept with its lines, my word and my why — and 60 XP', jr.ok && jr.me.plan.vision === 'I’m Jona, a child of God.\n\nFive years from now:\n🎓 A nurse' && jr.me.plan.word === 'Brave' && jr.me.plan.why === 'To help young people' && jr.me.story.finished === today && jr.me.level.xp === 80);
jr = await H.journey(JN.uid, JN.token, 'read', { date: today });
ok('reading it again: 5 XP, once a day', jr.me.daily[today].vision === true && jr.me.level.xp === 85 && (await H.journey(JN.uid, JN.token, 'read', { date: today })).me.level.xp === 85);
jr = await H.journey(JN.uid, JN.token, 'save', { answers: { wheel: { faith: 3, study: 9, money: 2, moon: 4 } }, stop: 'future' });
ok('the life wheel keeps 1–5 for the six areas only, and goes into its history', JSON.stringify(jr.me.story.a.wheel) === '{"faith":3,"money":2}' && jr.me.story.wheels.length === 1 && jr.me.story.wheels[0].d === today);
ok('checking the wheel again needs all six', (await H.journey(JN.uid, JN.token, 'wheel', { wheel: { faith: 4 } })).err === 'wheel');
const six = { faith: 4, family: 3, study: 4, health: 2, money: 3, serve: 5 };
jr = await H.journey(JN.uid, JN.token, 'wheel', { wheel: six });
ok('… then it’s kept (one a day) with 10 XP', jr.ok && jr.me.story.a.wheel.serve === 5 && jr.me.story.wheels.length === 1 && jr.me.level.xp === 115);
ok('… once a month', (await H.journey(JN.uid, JN.token, 'wheel', { wheel: six })).me.level.xp === 115);
const ju = JSON.parse(globalThis.__gpaStore._m.get('u:' + JN.uid));
ok('finishing is a feed moment that carries none of their words', ju.posts.some(x => x.kind === 'journey' && x.n === null));
const jc = await H.person(B.uid, B.token, JN.uid);
ok('nobody else sees the vision or the journey’s answers', jc.ok && !/child of God|farm|nurse|Drums|story|vision|"why"/.test(JSON.stringify(jc)));
ok('… only how far they’ve come and their word for the year (Uriah: “see each other’s journey a bit”)', jc.person.journey && jc.person.journey.word === 'Brave' && jc.person.journey.finished === true && jc.person.journey.stops === 2);
await H.saveProfile(JN.uid, JN.token, { share: { journey: false } });
ok('… and nothing of it when that switch is off', !('journey' in (await H.person(B.uid, B.token, JN.uid)).person));
await H.saveProfile(JN.uid, JN.token, { share: { journey: true } });

/* ---------- 18b. the five gifts (APEST) ---------- */
const AP = await H.registerPassword({ username: 'abby', name: 'Abby Sok', birthYear: 2002, password: 'abby password', lang: 'en' });
const apAns = {}; for (const g of 'apest') for (let i = 1; i <= 6; i++) apAns[g + i] = g === 's' ? 5 : g === 't' ? (i < 4 ? 5 : 4) : g === 'e' ? 3 : 2;
ok('the gifts test needs every answer', (await H.saveApest(AP.uid, AP.token, { answers: { a1: 5 } })).err === 'answers');
ok('… each from 1 to 5', (await H.saveApest(AP.uid, AP.token, { answers: Object.assign({}, apAns, { p3: 9 }) })).err === 'answers');
let apr = await H.saveApest(AP.uid, AP.token, { answers: apAns, top: ['a', 'a'], scores: { a: 100 } });
ok('the server works out the gifts from the answers, not what the page says', apr.ok && apr.me.apest.top.join('') === 'steap' && apr.me.apest.scores.s === 100 && apr.me.apest.scores.a === 25 && apr.me.apest.scores.t === 88);
ok('… 50 XP, once', apr.me.level.xp === 50 && (await H.saveApest(AP.uid, AP.token, { answers: apAns })).me.level.xp === 50);
const apu = JSON.parse(globalThis.__gpaStore._m.get('u:' + AP.uid));
ok('… and it’s a feed moment naming only the gift', apu.posts.some(x => x.kind === 'apest' && x.n === 's'));
let apc = await H.person(B.uid, B.token, AP.uid);
ok('others see the two strongest gifts — never the answers or numbers', JSON.stringify(apc.person.apest) === '["s","t"]' && !/"scores"|"answers"|"s1"/.test(JSON.stringify(apc)));
await H.saveApest(AP.uid, AP.token, { share: false });
ok('… and nothing when it’s switched off', !('apest' in (await H.person(B.uid, B.token, AP.uid)).person));
await H.saveApest(AP.uid, AP.token, { share: true }); await H.saveProfile(AP.uid, AP.token, { share: { apest: false } });
ok('… or when “Your gifts” is off in What others see', !('apest' in (await H.person(B.uid, B.token, AP.uid)).person));
ok('the tests count takes in the gifts', (await H.boot(AP.uid, AP.token)).me.stats.tests === 1);

/* ---------- 18c. the Sunday reset ---------- */
const RS = await H.registerPassword({ username: 'resa', name: 'Resa Lim', birthYear: 2002, password: 'resa password', lang: 'en' });
const thisMon = __test.weekOf_(today), nextMon = new Date(Date.parse(thisMon) + 7 * 864e5).toISOString().slice(0, 10);
ok('a reset is for this week or next only', (await H.weekReset(RS.uid, RS.token, '2020-01-06', {})).err === 'week' && (await H.weekReset(RS.uid, RS.token, today === thisMon ? nextMon.replace(/-\d\d$/, '-15') : today, {})).err === 'week');
let rsr = await H.weekReset(RS.uid, RS.token, nextMon, { good: 'Finished my essay', hard: 'Too late on my phone', area: 'health' });
ok('it keeps what went well, what was hard and the part of life to care for, with 30 XP', rsr.ok && rsr.me.resets[nextMon].good === 'Finished my essay' && rsr.me.resets[nextMon].area === 'health' && rsr.me.level.xp === 30);
ok('… once a week', (await H.weekReset(RS.uid, RS.token, nextMon, { area: 'moon' })).me.level.xp === 30 && (await H.boot(RS.uid, RS.token)).me.resets[nextMon].area === '');
ok('… and nobody else sees it', !/essay|phone|resets/.test(JSON.stringify(await H.person(B.uid, B.token, RS.uid))));

/* ---------- 18d. English first ---------- */
ok('a new account is English unless Khmer was chosen', (await H.registerPassword({ username: 'eng1', name: 'En Glish', birthYear: 2002, password: 'eng1 password', lang: 'km' })).me.lang === 'en');
const KMU = await H.registerPassword({ username: 'khm1', name: 'Kh Mer', birthYear: 2002, password: 'khm1 password', lang: 'km', langChosen: true });
ok('… and Khmer when it was', KMU.me.lang === 'km');
setU(KMU.uid, u => { delete u.langChosen; });
ok('an older account saved as Khmer by default reads as English', (await H.boot(KMU.uid, KMU.token)).me.lang === 'en');
ok('… until Khmer is picked again', (await H.saveProfile(KMU.uid, KMU.token, { lang: 'km' })).ok && (await H.boot(KMU.uid, KMU.token)).me.lang === 'km');

/* ---------- 18e. team meetups ---------- */
const tmw = new Date(Date.parse(today) + 864e5).toISOString().slice(0, 10);
ok('only a leader posts a meetup', (await H.meetup(Q.uid, Q.token, QT.team.id, 'add', { title: 'Study night', date: tmw })).err === 'not_leader');
ok('someone outside the team can’t', (await H.meetup(B.uid, B.token, QT.team.id, 'add', { title: 'x', date: tmw })).err === 'none');
ok('a meetup needs a day from today on', (await H.meetup(Q2.uid, Q2.token, QT.team.id, 'add', { title: 'x', date: '2020-01-01' })).err === 'date');
let mt = await H.meetup(Q2.uid, Q2.token, QT.team.id, 'add', { title: 'Study night', date: tmw, time: '18:30', place: 'Room 4' });
const mt0 = mt.team.meets[0];
ok('the leader posts it: what, when, where — and is going', mt.ok && mt0.title === 'Study night' && mt0.time === '18:30' && mt0.place === 'Room 4' && mt0.going === 1 && mt0.mine === 'yes');
mt = await H.meetup(Q.uid, Q.token, QT.team.id, 'rsvp', { id: mt0.id, answer: 'maybe' });
ok('a member answers maybe, and sees the counts', mt.team.meets[0].going === 1 && mt.team.meets[0].maybe === 1 && mt.team.meets[0].mine === 'maybe' && !('who' in mt.team.meets[0]));
ok('the leader sees who is going', JSON.stringify((await H.team(Q2.uid, Q2.token, QT.team.id)).team.meets[0].who) === '["Vanna Ly"]');
ok('it’s on Home for the team, coming up', (await H.boot(Q.uid, Q.token)).meets.some(m => m.id === mt0.id && m.teamName === 'Study crew'));
await H.meetup(Q.uid, Q.token, QT.team.id, 'rsvp', { id: mt0.id, answer: 'no' });
ok('… but not once they can’t come', !(await H.boot(Q.uid, Q.token)).meets.some(m => m.id === mt0.id));
ok('only a leader cancels it', (await H.meetup(Q.uid, Q.token, QT.team.id, 'drop', { id: mt0.id })).err === 'not_leader' && (await H.meetup(Q2.uid, Q2.token, QT.team.id, 'drop', { id: mt0.id })).team.meets.length === 0);

/* ---------- 18f. my journal ---------- */
const JR = await H.registerPassword({ username: 'jules', name: 'Jules Kim', birthYear: 2001, password: 'jules password' });
ok('a journal page is for today, yesterday or tomorrow only', (await H.journal(JR.uid, JR.token, 'save', { date: '2020-01-01', text: 'x' })).err === 'day');
let jn = await H.journal(JR.uid, JR.token, 'save', { date: today, text: 'Today I saw God in my friend.\n\nShe prayed for me at lunch.', prompt: 0 });
ok('a page is kept, line breaks and all — 5 XP for a real page', jn.ok && jn.me.journalDays.join() === today && jn.me.level.xp === 5);
ok('start-up sends only the days written, never the words', !/saw God/.test(JSON.stringify(await H.boot(JR.uid, JR.token))));
const jg = await H.journal(JR.uid, JR.token, 'get', {});
ok('the journal reads back its pages, newest first', jg.ok && jg.entries.length === 1 && jg.entries[0].text === 'Today I saw God in my friend.\n\nShe prayed for me at lunch.' && jg.entries[0].prompt === 0);
ok('nobody else ever sees it', !/saw God|journal/.test(JSON.stringify(await H.person(B.uid, B.token, JR.uid))));
jn = await H.journal(JR.uid, JR.token, 'save', { date: today, text: '' });
ok('an emptied page is gone, and its XP with it', jn.me.journalDays.length === 0 && jn.me.level.xp === 0);

/* ---------- 18g. friends this week ---------- */
{ const P1 = await H.registerPassword({ username: 'pal.one', name: 'Pal One', birthYear: 2000, password: 'pal1 password' });
  const P2 = await H.registerPassword({ username: 'pal.two', name: 'Pal Two', birthYear: 2000, password: 'pal2 password' });
  await H.friendAsk(P1.uid, P1.token, 'pal.two'); await H.friendAnswer(P2.uid, P2.token, P1.uid, true);
  await H.saveHabits(P2.uid, P2.token, [{ id: 'bible' }]); await H.tickHabit(P2.uid, P2.token, today, 'bible', true);
  const ff = (await H.friendsList(P1.uid, P1.token)).friends.find(f => f.id === P2.uid);
  ok('friends see each other’s XP this week — a number, behind the level switch', ff && ff.xpWeek === 5 && (await H.boot(P2.uid, P2.token)).me.xpWeek === 5);
  await H.saveProfile(P2.uid, P2.token, { share: { level: false } });
  ok('… and not when it’s off', !('xpWeek' in (await H.friendsList(P1.uid, P1.token)).friends.find(f => f.id === P2.uid))); }

/* ---------- 18h. StrengthsFinder results someone already has ---------- */
{ const CF = await H.registerPassword({ username: 'cliff', name: 'Cliff Ton', birthYear: 1999, password: 'cliff password' });
  ok('a StrengthsFinder Top 5 needs five real theme names', (await H.saveClifton(CF.uid, CF.token, { top: ['Achiever', 'Woo'] })).err === 'top' && (await H.saveClifton(CF.uid, CF.token, { top: ['Achiever', 'Woo', 'Focus', 'Learner', 'Magic'] })).err === 'top');
  const cr = await H.saveClifton(CF.uid, CF.token, { top: ['Strategic', 'Learner', 'Achiever', 'Relator', 'Futuristic'] });
  ok('… kept in order', cr.ok && cr.me.clifton.top.join() === 'Strategic,Learner,Achiever,Relator,Futuristic');
  ok('others see it with the strengths', JSON.stringify((await H.person(B.uid, B.token, CF.uid)).person.clifton) === '["Strategic","Learner","Achiever","Relator","Futuristic"]');
  await H.saveProfile(CF.uid, CF.token, { share: { strengths: false } });
  ok('… and not when strengths are hidden', !('clifton' in (await H.person(B.uid, B.token, CF.uid)).person));
  ok('it can be taken off again', !(await H.saveClifton(CF.uid, CF.token, { clear: true })).me.clifton); }

/* ---------- 18i. the pulse: tests and the journey ---------- */
{ const qp = (await H.teamPulse(Q2.uid, Q2.token, QT.team.id)).pulse, qr = qp.rows.find(r => r.id === Q.uid);
  ok('the pulse shows which tests each person has taken — taken or not, never the results', qr.tests && typeof qr.tests.type === 'boolean' && !('personality' in qr) && typeof qp.allTests === 'number' && typeof qp.journeys === 'number'); }

/* ---------- 18j. my calling ---------- */
{ const CL = await H.registerPassword({ username: 'called', name: 'Dara Called', birthYear: 2001, password: 'called password' });
  const CO = await H.registerPassword({ username: 'coachcl', name: 'Coach Cl', birthYear: 1990, password: 'coachcl password' });
  const CT = await H.createTeam(CO.uid, CO.token, { name: 'DTS calling', emoji: '🎯' }); await H.joinTeam(CL.uid, CL.token, CT.team.code);
  let r = await H.calling(CL.uid, CL.token, 'save', { answers: { do: { c: ['teach', 'care', 'BAD!'] }, who: { c: ['kids'], o: 'x'.repeat(200) }, sphere: 'nowhere', focus: 'Start a reading club', why: 'Line one\n\n\n\nLine two', m1: 'Ten children', secret: 'no' } });
  ok('my calling keeps only real answers: one way to serve, real ids, short words, a real sphere', r.ok && JSON.stringify(r.me.calling.a.do) === '{"c":["teach"],"o":""}' && r.me.calling.a.who.o.length === 80 && r.me.calling.a.sphere === '' && !('secret' in r.me.calling.a) && r.me.calling.a.why === 'Line one\n\nLine two');
  ok('a calling needs a statement of a few words', (await H.calling(CL.uid, CL.token, 'keep', { statement: 'short' })).err === 'text');
  const xp0 = r.me.level.xp;
  r = await H.calling(CL.uid, CL.token, 'keep', { answers: { sphere: 'education' }, statement: 'I believe God made me to teach and train children.', lang: 'km' });
  ok('kept, with its language and the first of its three years', r.ok && r.me.calling.statement.startsWith('I believe') && r.me.calling.sl === 'km' && r.me.calling.from >= Number(today.slice(0, 4)) && r.me.calling.a.sphere === 'education' && r.me.calling.a.focus === 'Start a reading club');
  r = await H.calling(CL.uid, CL.token, 'keep', { statement: 'I believe God made me to teach children to read.' });
  ok('60 XP, once', r.me.level.xp - xp0 === 60 && r.me.calling.statement.endsWith('read.'));
  ok('my own letter, kept in one language', (await H.calling(CL.uid, CL.token, 'text', { kind: 'letter', lang: 'en', text: 'Dear all,\n\nHello' })).me.calling.letter.en === 'Dear all,\n\nHello' && (await H.calling(CL.uid, CL.token, 'text', { kind: 'letter', lang: 'fr', text: 'x' })).err === 'kind');
  const x1 = (await H.calling(CL.uid, CL.token, 'mile', { m: 'm1', done: true })).me;
  ok('a year’s milestone ticked: 30 XP, once', !!x1.calling.done.m1 && x1.level.xp - xp0 === 90 && (await H.calling(CL.uid, CL.token, 'mile', { m: 'm1', done: true })).me.level.xp === x1.level.xp);
  ok('… only one that’s written down', (await H.calling(CL.uid, CL.token, 'mile', { m: 'm2', done: true })).err === 'none' && (await H.calling(CL.uid, CL.token, 'mile', { m: 'm9', done: true })).err === 'none');
  ok('… and untick takes it back', !(await H.calling(CL.uid, CL.token, 'mile', { m: 'm1', done: false })).me.calling.done.m1);
  ok('… and written fresh again when cleared', (await H.calling(CL.uid, CL.token, 'text', { kind: 'letter', lang: 'en', text: '' })).me.calling.letter.en === '');
  const pc = (await H.person(CO.uid, CO.token, CL.uid)).person;
  ok('nobody else sees my calling on my card', pc && !JSON.stringify(pc).includes('teach children') && !('calling' in pc));
  ok('finding it is a moment in the team feed, with no words', (await H.feed(CO.uid, CO.token)).feed.some(x => x.who.id === CL.uid && x.kind === 'calling' && !JSON.stringify(x).includes('teach')));
  const cc = await H.coachAsk(CL.uid, CL.token, CO.uid, CT.team.id, 'mentee'); await H.coachAnswer(CO.uid, CO.token, cc.id, true);
  ok('a coach doesn’t see it until the plan is shared', !(await H.coaching(CO.uid, CO.token, cc.id)).coaching.calling);
  await H.coachAct(CL.uid, CL.token, cc.id, 'sharePlan', { on: true });
  const cv = (await H.coaching(CO.uid, CO.token, cc.id)).coaching.calling;
  ok('… then sees the statement, the focus and the milestones — not the why or the letter', cv && cv.statement.endsWith('read.') && cv.focus === 'Start a reading club' && cv.m1 === 'Ten children' && !('why' in cv) && !('letter' in cv)); }

/* ---------- 18k. Telegram sign-in ---------- */
{ const TGH = (await import('../netlify/functions/telegram.js')).default;
  ok('no Telegram button until the bot is set up', (await H.authConfig()).telegram === '' && (await H.tgStart('https://gonpreah-app.netlify.app')).err === 'not_set_up');
  process.env.GPA_TELEGRAM_BOT_TOKEN = '123:test-token'; process.env.GPA_TELEGRAM_BOT_NAME = '@testbot'; process.env.URL = 'https://gonpreah-app.netlify.app';
  const secret = (await import('node:crypto')).createHash('sha256').update('gpa-tg|123:test-token', 'utf8').digest('hex').slice(0, 48);
  const post = (up, sec) => TGH(new Request('http://x/', { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': sec == null ? secret : sec }, body: JSON.stringify(up) }));
  const msg = (id, text, first, uname) => ({ message: { text, chat: { id, type: 'private' }, from: { id, first_name: first || 'Dara', username: uname || '', language_code: 'en' } } });
  const sent = () => (globalThis.__tgSent || []).filter(x => x.method === 'sendMessage').pop();
  globalThis.__tgSent = [];
  ok('with the bot set up, the button shows', (await H.authConfig()).telegram === 'testbot');
  let st = await H.tgStart('https://evil.example.com');
  const hook = globalThis.__tgSent.find(x => x.method === 'setWebhook');
  ok('the app points the bot at itself — at its own address, with a secret', st.ok && st.url === 'https://t.me/testbot?start=' + st.code && hook && hook.body.url === 'https://gonpreah-app.netlify.app/.netlify/functions/telegram' && hook.body.secret_token === secret);
  await H.tgStart(''); ok('… once', globalThis.__tgSent.filter(x => x.method === 'setWebhook').length === 1);
  ok('only Telegram (with the secret) can post to the bot', (await post(msg(555, '/start ' + st.code), 'wrong')).status === 401 && (await H.tgCheck(st.code)).state === 'wait');
  ok('a new person taps Start: the bot welcomes them', (await post(msg(555, '/start ' + st.code, 'Dara'))).status === 200 && /Welcome, Dara/.test(sent().body.text) && sent().body.reply_markup.inline_keyboard[0][0].url === 'https://gonpreah-app.netlify.app');
  ok('… and the page is told to make an account', JSON.stringify(await H.tgCheck(st.code)) === '{"ok":true,"state":"new","name":"Dara"}');
  ok('under 13 still can’t make one', (await H.registerTelegram(st.code, { username: 'tgkid', name: 'Kid Tg', birthYear: Y - 12 })).err === 'too_young');
  const tr = await H.registerTelegram(st.code, { username: 'tgdara', name: 'Dara Tg', birthYear: 2002 });
  ok('an account made from Telegram — no password', tr.ok && tr.me.tg && !tr.me.hasPassword && (await H.boot(tr.uid, tr.token)).ok);
  ok('… the code works once', (await H.registerTelegram(st.code, { username: 'tgdara2', name: 'Dara Two', birthYear: 2002 })).err === 'expired');
  ok('a password sign-in to it says to use Telegram', (await H.loginPassword('tgdara', 'anything')).err === 'telegram_only');
  st = await H.tgStart(''); await post(msg(555, '/start ' + st.code));
  ok('next time: tap Start, and the bot says you’re in', /signed in as @tgdara/.test(sent().body.text));
  const tin = await H.tgCheck(st.code);
  ok('… and the page is signed in', tin.ok && tin.uid === tr.uid && tin.token && (await H.boot(tin.uid, tin.token)).ok);
  ok('… once only', (await H.tgCheck(st.code)).token === undefined);
  await post(msg(555, '/start ' + st.code)); ok('an old code: the bot says it ran out', /run out/.test(sent().body.text));
  await post(msg(555, '/start')); ok('a bare /start: how to sign in', /tap “Sign in with Telegram”/.test(sent().body.text));
  st = await H.tgLinkStart(Q.uid, Q.token, ''); await post(msg(777, '/start ' + st.code, 'Thida', 'thida_tg'));
  ok('Me → Connect Telegram: tap Start, and it’s connected', (await H.tgCheck(st.code)).state === 'linked' && (await H.boot(Q.uid, Q.token)).me.tg.username === 'thida_tg' && /connected/.test(sent().body.text));
  st = await H.tgStart(''); await post(msg(777, '/start ' + st.code));
  ok('… then one tap signs them in', (await H.tgCheck(st.code)).uid === Q.uid);
  st = await H.tgLinkStart(Q2.uid, Q2.token, ''); await post(msg(777, '/start ' + st.code));
  ok('one Telegram, one account', (await H.tgCheck(st.code)).state === 'taken' && !(await H.boot(Q2.uid, Q2.token)).me.tg);
  st = await H.tgStart(''); await post(msg(888, '/start ' + st.code, 'Vanna'));
  const vl = await H.tgLinkLogin(st.code, 'vanna', 'vanna password');
  ok('“I already have an account”: sign in once with the password, and Telegram is connected', vl.ok && vl.uid === Q2.uid && vl.me.tg);
  st = await H.tgStart(''); await post(msg(888, '/start ' + st.code)); ok('… then one tap', (await H.tgCheck(st.code)).uid === Q2.uid);
  ok('disconnect it', !(await H.tgUnlink(Q2.uid, Q2.token)).me.tg);
  st = await H.tgStart(''); await post(msg(888, '/start ' + st.code)); ok('… and it no longer signs them in', (await H.tgCheck(st.code)).state === 'new');
  delete process.env.GPA_TELEGRAM_BOT_TOKEN; delete process.env.GPA_TELEGRAM_BOT_NAME; delete process.env.URL; }

/* ---------- 19. the door ---------- */
const api = (await import('../netlify/functions/api.js')).default;
const call = async (body) => (await api(new Request('http://x/', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }))).status;
ok('an unknown function is a 400', await call({ fn: 'constructor', args: [] }) === 400);
ok('bad JSON is a 400', await call('{') === 400);
ok('a known function answers 200', await call({ fn: 'authConfig', args: [] }) === 200);

ok.done();
