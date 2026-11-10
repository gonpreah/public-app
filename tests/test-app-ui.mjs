import require_fs from 'node:fs';
/* The app end to end in a phone-sized browser: sign up with a team code, habits,
   the week's goals, a team and its people, an under-18 kept out of the search,
   the personality test, Khmer, and no page errors. */
import { chromium, devices } from 'playwright';
import { startServer, CHROMIUM, checker } from './env.mjs';
const ok = checker();
const { srv, base } = await startServer();
const browser = await chromium.launch({ executablePath: CHROMIUM });
const errors = [];
async function phone(sub, name) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(([s, n]) => {
    window.__gpaGoogle = function (cb) { setTimeout(function () { cb('test:' + s + ':' + n); }, 10); };
    try { if (!localStorage.getItem('gpa-lang')) localStorage.setItem('gpa-lang', 'en'); localStorage.setItem('gpa-onboarded', '1'); } catch (e) {}
  }, [sub, name]);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(sub + ': ' + e.message));
  page.on('dialog', d => d.accept());
  return page;
}
const text = (page) => page.$eval('#main', e => e.innerText);
async function signUp(page, user, year, code) {
  await page.goto(base + '/' + (code ? '?join=' + code : ''));
  await page.click('#googleBtn');
  await page.waitForSelector('#suUser');
  await page.fill('#suUser', user);
  await page.selectOption('#suYear', String(year));
  if (code) ok('the join link fills in the team code', (await page.inputValue('#suCode')) === code);
  await page.click('#suGo');
  await page.waitForSelector('nav.bottom button[data-tab="home"]');
}
const Y = new Date().getFullYear();

/* ---------- 1. an adult signs up and starts a team ---------- */
const a = await phone('sokha', 'Sokha Chan');
await a.goto(base + '/');
ok('signed out, the welcome and Google button show', /Welcome to GonPreah/.test(await text(a)) && !!(await a.$('#googleBtn')));
await a.click('#googleBtn');
await a.waitForSelector('#suUser');
ok('a new Google account goes to sign-up with its name filled in', (await a.inputValue('#suName')) === 'Sokha Chan');
await a.fill('#suUser', 'sokha'); await a.waitForTimeout(600);
ok('the username is checked as you type', /Free/.test(await a.$eval('#suUserHint', e => e.textContent)));
await a.selectOption('#suYear', '2000');
await a.click('#suGo');
await a.waitForSelector('nav.bottom button[data-tab="home"]');
ok('signed up, Home says hello', /Sokha/.test(await text(a)) && /day streak/.test(await text(a)));
ok('the header shows the GonPreah seal, not the YWAM GP mark', await a.evaluate(() => document.getElementById('brandLogo').src === GP_LOGO));
ok('the session is kept on the phone', await a.evaluate(() => !!JSON.parse(localStorage.getItem('gpa-auth') || 'null')));

await a.click('#habitPick');
for (const h of ['bible', 'english', 'exercise']) await a.click('[data-hpick="' + h + '"]');
await a.fill('#hOwn', 'Call my family'); await a.click('#hOwnAdd');
await a.click('#hSave'); await a.waitForSelector('[data-habit="bible"]');
ok('four habits on Home', (await a.$$('[data-habit]')).length === 4);
await a.click('[data-habit="bible"]'); await a.waitForTimeout(500);
ok('ticking a habit starts the streak', /0 of 4|1 of 4/.test(await text(a)) && (await a.$eval('.heroStats b', e => e.textContent)) === '1');
await a.click('#wkEdit');
await a.fill('[data-wk="0"]', 'Read Mark 1–4'); await a.fill('[data-wk="1"]', 'Help at home');
await a.click('#wkSave'); await a.waitForSelector('[data-wkpct="0"]');
await a.$eval('[data-wkpct="0"]', e => { e.value = 80; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); });
await a.waitForTimeout(500);
ok('a goal’s slider sets the week’s %', (await a.$$eval('.heroStats b', bs => bs[1].textContent)) === '40%');

await a.click('nav.bottom button[data-tab="teams"]');
await a.click('#newTeam'); await a.fill('#ntName', 'Siem Reap Youth'); await a.click('[data-ntemoji="🔥"]');
await a.click('#ntGo'); await a.waitForSelector('.bigCode');
const code = await a.$eval('.bigCode', e => e.textContent);
ok('a new team shows its join code', /^[A-Z2-9]{6}$/.test(code));

/* ---------- 2. a 16-year-old joins with the link ---------- */
const m = await phone('mina', 'Mina Sok');
await signUp(m, 'mina', Y - 16, code);
await m.waitForTimeout(800);
await m.click('nav.bottom button[data-tab="teams"]'); await m.waitForTimeout(400);
ok('they’re in the team', /Siem Reap Youth/.test(await text(m)));
ok('under 18 has no Start a team or Find people', !(await m.$('#newTeam')) && !(await m.$('#findPeople')));
await m.click('nav.bottom button[data-tab="me"]');
ok('Me tells them who can see them', /only people in your teams can see you/.test(await text(m)));

/* ---------- 3. what the leader sees ---------- */
await a.click('nav.bottom button[data-tab="teams"]'); await a.waitForTimeout(400);
await a.click('[data-team]'); await a.waitForSelector('.personRow');
ok('the team lists both people', (await a.$$('.personRow')).length === 2);
ok('… the under-18 by first name', /\bMina\b/.test(await text(a)) && !/Mina Sok/.test(await text(a)));

/* ---------- 4. another adult can’t find her ---------- */
const d = await phone('dara', 'Dara Keo');
await signUp(d, 'dara_k', 1999);
await d.click('nav.bottom button[data-tab="teams"]'); await d.click('#findPeople');
await d.fill('#findQ', 'mina'); await d.waitForTimeout(800);
ok('the search never finds an under-18', /Nobody found/.test(await text(d)));
await d.fill('#findQ', 'sokha'); await d.waitForTimeout(800);
ok('… but finds an adult', /Sokha Chan/.test(await text(d)));
await d.click('[data-person]'); await d.waitForTimeout(600);
ok('an adult’s card shows their streak', /day streak/.test(await text(d)));

/* ---------- 5. the personality test ---------- */
await m.click('nav.bottom button[data-tab="me"]');
await m.click('#goPtest'); await m.click('[data-psex="female"]'); await m.click('#pBegin');
for (let p = 0; p < 8; p++) {
  const ids = await m.$$eval('[data-pans]', bs => [...new Set(bs.map(b => b.getAttribute('data-pans').split('|')[0]))]);
  for (const id of ids) await m.click('[data-pans="' + id + '|2"]');
  if (await m.$('#pNext')) await m.click('#pNext'); else { await m.click('#pFinish'); break; }
}
await m.waitForSelector('.pHero');
ok('finishing the test shows the type', /^[EI][SN][TF][JP]$/.test(await m.$eval('.pBig', e => e.textContent)));
await a.click('[data-back]'); await a.waitForTimeout(300); await a.click('[data-team]'); await a.waitForSelector('.personRow');
ok('the team’s mix now counts her type', /Personality — 1 person/.test(await text(a)));

/* ---------- 6. the life plan and tasks ---------- */
await m.click('nav.bottom button[data-tab="plan"]');
ok('the Plan tab opens the life plan', /My life plan/.test(await text(m)) && /Only you see your plan/.test(await text(m)));
await m.click('#whyEdit'); await m.fill('#whyIn', 'To care for people the way Jesus did'); await m.click('#whySave'); await m.waitForTimeout(400);
ok('my why is saved', /care for people the way Jesus did/.test(await text(m)));
await m.click('#newGoal');
await m.click('#goalSave'); await m.waitForTimeout(200);
ok('a goal needs a part of life', /Choose a part of life/.test(await m.$eval('#msg', e => e.textContent)));
await m.click('[data-garea="study"]');
await m.fill('#gTitle', 'Finish grade 12 with good marks'); await m.fill('#gMeasure', 'Pass the exam with a B');
await m.click('#goalSave'); await m.waitForSelector('#stepIn');
ok('a saved goal opens with this quarter marked Now', /Finish grade 12/.test(await text(m)) && !!(await m.$('.qCard.now')));
await m.fill('#stepIn', 'Make a study timetable'); await m.click('#stepAdd'); await m.waitForSelector('[data-step]');
const qOpt = await m.$eval('#stepWhen optgroup:nth-child(2) option', o => o.value);
await m.fill('#stepIn', 'Finish all maths past papers'); await m.selectOption('#stepWhen', qOpt); await m.click('#stepAdd');
await m.waitForFunction(() => document.querySelectorAll('[data-step]').length === 2);
ok('a monthly and a quarterly step', /study timetable/.test(await text(m)) && /past papers/.test(await text(m)));
await m.click('nav.bottom button[data-tab="home"]');
ok('Home shows the steps for now', /Steps for now/.test(await text(m)) && /study timetable/.test(await text(m)));
await m.click('[data-step]'); await m.waitForTimeout(500);
await m.click('nav.bottom button[data-tab="plan"]');
ok('the goal’s bar moves when a step is ticked', (await m.$eval('.goalRow .miniTrack div', e => e.style.width)) === '50%');
await m.fill('#taskIn', 'Buy a notebook'); await m.click('#taskAdd'); await m.waitForSelector('[data-task]');
await m.click('[data-task]'); await m.waitForTimeout(400);
ok('my own task is added and ticked', /Done \(1\)/.test(await text(m)));

await a.click('nav.bottom button[data-tab="teams"]'); await a.waitForTimeout(300); await a.click('[data-team]'); await a.waitForSelector('#tmIn');
await a.fill('#tmIn', 'Read Mark 5 before Friday'); await a.click('#tmAdd'); await a.waitForSelector('[data-tmtick]');
ok('a leader sets a team task, and sees it counted', /0 of 2 done/.test(await text(a)));
await m.click('nav.bottom button[data-tab="home"]'); await m.waitForTimeout(600);
ok('the member sees it on Home with the team’s name', /Read Mark 5/.test(await text(m)) && /Siem Reap Youth/.test(await text(m)));
await m.click('[data-ttick]'); await m.waitForTimeout(800);
await a.click('[data-back]'); await a.waitForTimeout(300); await a.click('[data-team]'); await a.waitForSelector('[data-tmtick]');
ok('… ticks it, and the leader sees 1 of 2 done', /1 of 2 done/.test(await text(a)));
ok('the leader sees her plan as counts, not words', await (async () => { await a.click('.personRow:not(:first-child)'); await a.waitForTimeout(600); const tx = await text(a); await a.click('[data-back]'); await a.waitForSelector('.personRow'); return /life goals/.test(tx) && !/grade 12|timetable/.test(tx); })());

/* ---------- 7. 1-on-1s ---------- */
async function openTeamPerson(page, who) {
  await page.click('nav.bottom button[data-tab="teams"]'); await page.waitForTimeout(400);
  await page.click('[data-team]'); await page.waitForSelector('.personRow');
  await page.click('.personRow:has-text("' + who + '")'); await page.waitForTimeout(600);
}
await openTeamPerson(m, 'Sokha');
ok('an under-18 can’t ask for a coach while the team has one leader', !(await m.$('[data-coachask]')));
await d.click('nav.bottom button[data-tab="teams"]'); await d.fill('#joinCode', code); await d.click('#joinGo'); await d.waitForSelector('.personRow');
await openTeamPerson(a, 'Dara'); await a.click('#makeLeader'); await a.waitForTimeout(500);
await openTeamPerson(m, 'Sokha');
ok('with a second leader, she can ask', !!(await m.$('[data-coachask$="|mentee"]')));
await m.click('[data-coachask$="|mentee"]'); await m.waitForTimeout(500);
ok('she’s told they’ll be asked', /They’ll see it on their Home/.test(await m.$eval('#msg', e => e.textContent)));
await a.click('nav.bottom button[data-tab="home"]'); await a.waitForSelector('[data-coachyes]');
ok('the leader sees the ask on Home', /Asks you to be their coach/.test(await text(a)));
await a.click('[data-coachyes$="|1"]'); await a.waitForTimeout(800);
await a.click('nav.bottom button[data-tab="plan"]'); await a.waitForTimeout(500);
await a.click('[data-coach]'); await a.waitForSelector('#meetNew');
ok('the coach is told other leaders can read it', /other leaders of Siem Reap Youth can read/.test(await text(a)));
await a.click('#meetNew'); await a.waitForSelector('[data-rate]');
await a.click('[data-rate="faith|4"]'); await a.click('[data-rate="family|2"]');
await a.fill('#mNotes', 'Talked about home. Pray together next time.'); await a.fill('#mPriv', 'Check in with her mum?');
await a.click('#meetSave'); await a.waitForTimeout(500);
await a.fill('#fIn', 'Read Psalm 23 each morning'); await a.click('#fAdd'); await a.waitForSelector('[data-follow]');
ok('a 1-on-1 with a check-in, notes and a follow-up', (await a.$$('.rateBtn.on')).length === 2 && /Psalm 23/.test(await text(a)));
await m.click('nav.bottom button[data-tab="home"]'); await m.waitForTimeout(700);
ok('she sees her follow-up waiting on Home', /1 follow-up for you/.test(await text(m)));
await m.click('[data-coach]'); await m.waitForSelector('[data-meet]');
ok('… and is told the other leaders can read it', /Because you’re under 18/.test(await text(m)));
await m.click('[data-meet]'); await m.waitForSelector('#mNotes');
ok('she reads the shared notes, not the coach’s own', (await m.inputValue('#mNotes')).startsWith('Talked') && !(await m.$('#mPriv')) && !/her mum/.test(await m.content()));
await m.click('[data-follow]'); await m.waitForTimeout(500);
ok('she ticks her follow-up', !!(await m.$('.stepRow.done')));
await d.click('nav.bottom button[data-tab="plan"]'); await d.waitForTimeout(700);
ok('the other leader sees it listed', /Sokha Chan coaches Mina/.test(await text(d)));
await d.click('[data-coach]'); await d.waitForSelector('[data-meet]');
ok('… can read it but not write in it', !(await d.$('#meetNew')) && /Only the two of them can write here/.test(await text(d)));
await d.click('[data-meet]'); await d.waitForSelector('#mNotes');
ok('… and never sees the coach’s own notes', !(await d.$('#mPriv')) && !/her mum/.test(await d.content()) && await d.$eval('#mNotes', e => e.disabled));

/* ---------- 8. the feed, 👏, report, block, the admin ---------- */
process.env.GPA_ADMIN_EMAILS = 'sokha@example.com';   // the server runs in this process
await a.click('nav.bottom button[data-tab="teams"]'); await a.waitForSelector('[data-clap]');
ok('Teams shows what the team is up to', /Mina found their personality type/.test(await text(a)));
await a.click('.feedRow:has-text("Mina found their personality type") [data-clap]'); await a.waitForTimeout(500);
ok('👏 a teammate', !!(await a.$('.feedRow:has-text("Mina found") .clapBtn.on')));
await m.click('nav.bottom button[data-tab="home"]'); await m.waitForTimeout(900);
ok('… who sees the cheer on Home', /Sokha Chan cheered your personality type/.test(await text(m)));
await openTeamPerson(m, 'Dara');
await m.click('#reportPerson'); await m.waitForSelector('#repSend');
await m.click('#repSend'); await m.waitForTimeout(200);
ok('a report needs a reason chosen', /Choose what is wrong/.test(await m.$eval('#msg', e => e.textContent)));
await m.check('input[name="repWhat"][value="other"]'); await m.fill('#repWhy', 'Testing the report');
await m.click('#repSend'); await m.waitForTimeout(500);
ok('… and is sent', /admin will look at it/.test(await m.$eval('#msg', e => e.textContent)));
ok('only the admin has Reports on Me', await (async () => { await m.click('nav.bottom button[data-tab="me"]'); return !(await m.$('#goAdmin')); })());
await a.click('nav.bottom button[data-tab="me"]'); await a.click('#goAdmin'); await a.waitForSelector('[data-admin]');
ok('the admin sees the report, who it’s about and why', /Dara Keo/.test(await text(a)) && /Testing the report/.test(await text(a)) && /Reported by Mina/.test(await text(a)));
await a.click('[data-admin$="|dismiss"]'); await a.waitForTimeout(600);
ok('… and leaves it as it is', /No reports waiting/.test(await text(a)));
await openTeamPerson(m, 'Dara');
await m.click('#blockPerson'); await m.waitForTimeout(800);
ok('she blocks someone, and they leave her team list', await (async () => { await m.click('[data-team]'); await m.waitForSelector('.personRow'); return !/Dara/.test(await text(m)); })());
await m.click('nav.bottom button[data-tab="me"]'); await m.click('#goBlocked'); await m.waitForSelector('[data-unblock]');
await m.click('[data-unblock]'); await m.waitForTimeout(500);
ok('… and can unblock them', /Nobody/.test(await text(m)));
delete process.env.GPA_ADMIN_EMAILS;

/* ---------- 9. the Learn tab: the Library and Learn Khmer / English ---------- */
ok('the books aren’t loaded until the Library opens', await m.evaluate(() => typeof GP_LIBRARY === 'undefined' && typeof GP_KHMER_VOCAB === 'undefined'));
await m.click('nav.bottom button[data-tab="grow"]');
ok('the Learn tab has the Library and Learn Khmer / English', /Library/.test(await text(m)) && /Learn Khmer \/ English/.test(await text(m)));
await m.click('#goLibrary'); await m.waitForSelector('.libRow');
const rows = await m.$$eval('.libRow', rs => rs.length);
ok('the Library: Start here and five shelves', rows === 6 && /Start here/.test(await text(m)) && /Friends, family & feelings/.test(await text(m)));
ok('… for young people, not YWAM GP', !/YWAM GP/.test(await text(m)));
await m.click('[data-libbook="atomic-habits"]'); await m.waitForSelector('#libStart');
ok('a book page with "For you"', /For you/i.test(await text(m)) && !/For us at YWAM GP/.test(await text(m)));
await m.click('#libStart'); await m.waitForTimeout(300);
ok('the reader opens full screen, the tabs hidden', await m.evaluate(() => document.body.classList.contains('libReading')) && !(await m.isVisible('nav.bottom')));
await m.click('#libNext'); await m.waitForTimeout(300);
ok('… and turns the page', await m.evaluate(() => S.libStep === 1));
await m.click('#libClose, #libBack').catch(() => {}); await m.waitForTimeout(200);
await m.evaluate(() => { S.libBook = null; S.libStep = null; S.view = 'grow'; render(); });
await m.click('#goLearn'); await m.waitForSelector('[data-khlevel]');
ok('Learn Khmer opens on its levels', /Learn Khmer/.test(await text(m)));
await m.click('[data-khlevel="1"]'); await m.waitForTimeout(300);
await m.click('[data-khcat="colors"]'); await m.waitForTimeout(300);
await m.click('[data-khmode="cards"]'); await m.waitForSelector('#khFlip');
await m.click('#khFlip'); await m.waitForTimeout(200); await m.click('#khYes'); await m.waitForTimeout(300);
ok('flashcards: flip, "Got it", and XP', await m.evaluate(() => khGame_().xp > 0));
await m.click('#khBack'); await m.waitForTimeout(300);
await m.click('[data-khmode="quiz"]'); await m.waitForSelector('[data-khopt]');
const right = await m.evaluate(() => S.kh.q.options.indexOf(S.kh.q.w));
await m.click('[data-khopt="' + right + '"]'); await m.waitForTimeout(200);
ok('a quiz answer goes green', !!(await m.$('.khOpt.right')));
await m.evaluate(() => { S.view = 'grow'; render(); });
ok('the Learn tab shows today’s XP', /XP today/.test(await text(m)));

/* ---------- 10. reminders on the phone (the phone's push system stood in for) ---------- */
{
  const crypto = await import('node:crypto');
  const e = crypto.createECDH('prime256v1'); e.generateKeys();
  const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const fake = { endpoint: 'https://fcm.googleapis.com/fcm/send/test-' + Date.now(), keys: { p256dh: b64u(e.getPublicKey()), auth: b64u(crypto.randomBytes(16)) } };
  const auth = await a.evaluate(() => localStorage.getItem('gpa-auth'));
  const ctx = await browser.newContext({ ...devices['iPhone 13'], userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile', timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(([au, sub]) => {
    localStorage.setItem('gpa-auth', au); localStorage.setItem('gpa-lang', 'en'); localStorage.setItem('gpa-onboarded', '1');
    window.PushManager = function () {};
    window.Notification = { permission: 'default', requestPermission: () => { window.Notification.permission = 'granted'; return Promise.resolve('granted'); } };
    let cur = null;
    const reg = { pushManager: { getSubscription: () => Promise.resolve(cur), subscribe: (o) => { window.__subKey = o.applicationServerKey.length; cur = { endpoint: sub.endpoint, toJSON: () => sub, unsubscribe: () => { cur = null; return Promise.resolve(true); } }; return Promise.resolve(cur); } } };
    Object.defineProperty(navigator, 'serviceWorker', { value: { ready: Promise.resolve(reg), register: () => Promise.resolve(reg) } });
  }, [auth, fake]);
  const r = await ctx.newPage(); r.on('pageerror', x => errors.push('reminders: ' + x.message)); r.on('dialog', d => d.accept());
  await r.goto(base + '/'); await r.waitForSelector('nav.bottom');
  await r.click('nav.bottom button[data-tab="me"]'); await r.waitForSelector('#remOn');
  ok('Me offers reminders', /One reminder a day/.test(await text(r)));
  await r.click('#remOn'); await r.waitForSelector('#remHour');
  ok('turning them on subscribes with the app’s key, and shows the choices', await r.evaluate(() => window.__subKey === 65) && /Reminders are on for this phone/.test(await text(r)) && (await r.inputValue('#remHour')) === '19');
  await r.selectOption('#remHour', '7'); await r.click('#remPlan'); await r.waitForTimeout(500);
  const me = await r.evaluate(() => S.push.prefs);
  ok('… the time and what to hear about are saved', me.hour === 7 && me.plan === false && me.habits === true);
  await r.click('#remOff'); await r.waitForSelector('#remOn');
  ok('… and they can be turned off', /Reminders are off for this phone/.test(await r.$eval('#msg', x => x.textContent)));
  await ctx.close();
}

/* ---------- 11. a username and password, no Google ---------- */
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(() => { try { localStorage.setItem('gpa-lang', 'en'); localStorage.setItem('gpa-onboarded', '1'); } catch (e) {} });
  const q = await ctx.newPage(); q.on('pageerror', x => errors.push('password: ' + x.message));
  await q.goto(base + '/'); await q.waitForSelector('#liNew');
  await q.click('#liNew'); await q.waitForSelector('#suPass');
  await q.fill('#suUser', 'kosal'); await q.fill('#suPass', 'my good password'); await q.fill('#suPass2', 'not the same');
  await q.fill('#suName', 'Kosal Meas'); await q.selectOption('#suYear', '2001');
  await q.click('#suGo'); await q.waitForTimeout(200);
  ok('sign-up with a password checks the two match', /aren’t the same/.test(await q.$eval('#msg', e => e.textContent)));
  await q.fill('#suPass2', 'my good password'); await q.click('#suGo');
  await q.waitForSelector('nav.bottom button[data-tab="home"]');
  ok('an account made with a username and password', /Kosal/.test(await text(q)));
  await q.evaluate(() => { AUTH = null; localStorage.removeItem('gpa-auth'); S.me = null; S.view = 'signin'; render(); });
  await q.waitForSelector('#liGo');
  await q.fill('#liUser', 'kosal'); await q.fill('#liPass', 'wrong password'); await q.click('#liGo'); await q.waitForTimeout(500);
  ok('a wrong password is turned away', /isn’t right/.test(await q.$eval('#msg', e => e.textContent)) && !!(await q.$('#liGo')));
  await q.fill('#liPass', 'my good password'); await q.click('#liGo');
  await q.waitForSelector('nav.bottom button[data-tab="home"]');
  ok('… and the right one signs in', /Kosal/.test(await text(q)));
  await q.click('nav.bottom button[data-tab="me"]'); await q.waitForSelector('#pwSave');
  ok('Me has the password card', /Change my password/.test(await text(q)));
  await ctx.close();
}

/* ---------- 17m. forgot my password: fix it myself, or the admin sets one ---------- */
{
  process.env.GPA_ADMIN_EMAILS = 'sokha@example.com';   // a is the admin again for this part
  const ctx = await browser.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('gpa-lang')) localStorage.setItem('gpa-lang', 'en'); localStorage.setItem('gpa-onboarded', '1'); } catch (e) {} });
  const f = await ctx.newPage(); f.on('pageerror', x => errors.push('forgot: ' + x.message)); f.on('dialog', d => d.accept());
  await f.goto(base + '/'); await f.click('#liNew'); await f.waitForSelector('#suPass');
  ok('a password needs only 4 characters', /At least 4 characters/.test(await text(f)));
  await f.fill('#suUser', 'forgetful'); await f.fill('#suPass', '1234'); await f.fill('#suPass2', '1234');
  await f.fill('#suName', 'Bopha Forget'); await f.selectOption('#suYear', '2001'); await f.click('#suGo'); await f.waitForSelector('nav.bottom');
  await f.evaluate(() => { localStorage.removeItem('gpa-auth'); }); await f.goto(base + '/'); await f.waitForSelector('#liForgot');
  ok('the sign-in screen remembers my username', await f.$eval('#liUser', e => e.value) === 'forgetful');
  await f.fill('#liPass', 'abcd'); await f.click('#liEye'); await f.waitForTimeout(150);
  ok('… and 👁 shows the password as I type it', await f.$eval('#liPass', e => e.type === 'text' && e.value === 'abcd'));
  await f.click('#liForgot'); await f.waitForSelector('#fpSelf');
  ok('“Forgot your password?”: my username, my birth year, a new one', await f.$eval('#fpUser', e => e.value) === 'forgetful' && !!(await f.$('#fpYear')) && !!(await f.$('#fpPass')));
  await f.selectOption('#fpYear', '1999'); await f.fill('#fpPass', 'newpass'); await f.click('#fpSelf'); await f.waitForTimeout(400);
  ok('… the wrong year doesn’t open it', /don’t match/.test(await f.$eval('#msg', e => e.textContent)) && !(await f.$('nav.bottom:not([hidden])')));
  await f.selectOption('#fpYear', '2001'); await f.fill('#fpPass', 'newpass'); await f.click('#fpSelf'); await f.waitForSelector('nav.bottom:not([hidden])');
  ok('… the right one, and I’m straight back in', await f.evaluate(() => !!S.me && S.me.username === 'forgetful'));
  await f.evaluate(() => { localStorage.removeItem('gpa-auth'); }); await f.goto(base + '/'); await f.waitForSelector('#liForgot');
  await f.click('#liForgot'); await f.waitForSelector('#fpAsk'); await f.click('#fpAsk'); await f.waitForTimeout(500);
  ok('can’t remember? “Tell the admin”', /The admin has been told/.test(await text(f)));
  await a.evaluate(() => refresh_()); await a.waitForTimeout(500);
  await a.click('nav.bottom button[data-tab="home"]'); await a.waitForTimeout(300);
  ok('the admin sees it on Home', /1 person asked for a new password/.test(await text(a)));
  await a.click('.pwAskCard'); await a.waitForSelector('[data-pwreset="forgetful"]');
  await a.click('[data-pwreset="forgetful"]'); await a.waitForSelector('.bigPw');
  const pw = await a.$eval('.bigPw', e => e.textContent);
  ok('… one tap gives them an easy new password, to copy or send', /^[a-z]+\d{4}$/.test(pw) && !!(await a.$('#pwShare')));
  await f.fill('#liUser', 'forgetful'); await f.fill('#liPass', pw); await f.click('#liGo'); await f.waitForSelector('nav.bottom:not([hidden])');
  ok('… and they sign in with it — nothing more to do', await f.evaluate(() => S.view === 'home'));
  await a.click('[data-back]'); await a.waitForTimeout(200);
  await a.click('nav.bottom button[data-tab="home"]'); await a.waitForTimeout(200);
  await ctx.close();
  delete process.env.GPA_ADMIN_EMAILS;
}

/* ---------- 17n. sign in with Telegram ---------- */
{
  process.env.GPA_TELEGRAM_BOT_TOKEN = '123:test-token'; process.env.GPA_TELEGRAM_BOT_NAME = 'testbot'; process.env.URL = 'https://gonpreah-app.netlify.app';
  const secret = (await import('node:crypto')).createHash('sha256').update('gpa-tg|123:test-token', 'utf8').digest('hex').slice(0, 48);
  const http = (await import('node:http')).default;
  const tapStart = (code, id, first) => new Promise((res, rej) => { const r = http.request(base + '/.netlify/functions/telegram', { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret } }, (resp) => { resp.resume(); resp.on('end', () => res(resp.statusCode)); }); r.on('error', rej); r.end(JSON.stringify({ message: { text: '/start ' + code, chat: { id, type: 'private' }, from: { id, first_name: first } } })); });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('gpa-lang')) localStorage.setItem('gpa-lang', 'en'); localStorage.setItem('gpa-onboarded', '1'); } catch (e) {} window.open = function (u) { window.__opened = u; return {}; }; });
  const g = await ctx.newPage(); g.on('pageerror', x => errors.push('telegram: ' + x.message)); g.on('dialog', d => d.accept());
  await g.goto(base + '/'); await g.waitForSelector('#tgBtn');
  ok('“Sign in with Telegram” on the sign-in screen', /Sign in with Telegram/.test(await text(g)));
  await g.click('#tgBtn'); await g.waitForSelector('#tgOpen');
  const code = await g.evaluate(() => S.tg.code);
  ok('… it opens the chat with the bot, and waits', await g.evaluate(() => /^https:\/\/t\.me\/testbot\?start=/.test(window.__opened)) && /Waiting for Telegram/.test(await text(g)));
  await tapStart(code, 4242, 'Sokunthea'); await g.waitForSelector('#tgMake', { timeout: 8000 });
  ok('tapping Start in Telegram: welcome, and make my account', /Welcome, Sokunthea!/.test(await text(g)));
  await g.click('#tgMake'); await g.waitForSelector('#suUser');
  ok('… with my name filled in, and no password to make', await g.$eval('#suName', e => e.value) === 'Sokunthea' && !(await g.$('#suPass')));
  await g.fill('#suUser', 'sokunthea'); await g.selectOption('#suYear', '2003'); await g.click('#suGo'); await g.waitForSelector('nav.bottom:not([hidden])');
  await g.click('nav.bottom button[data-tab="me"]'); await g.waitForTimeout(400);
  ok('… and I’m in, with Telegram connected on Me', /Connected/.test(await text(g)) && await g.evaluate(() => !!S.me.tg));
  await g.evaluate(() => { localStorage.removeItem('gpa-auth'); }); await g.goto(base + '/'); await g.waitForSelector('#tgBtn');
  await g.click('#tgBtn'); await g.waitForSelector('#tgOpen'); const code2 = await g.evaluate(() => S.tg.code);
  await tapStart(code2, 4242, 'Sokunthea'); await g.waitForSelector('nav.bottom:not([hidden])', { timeout: 8000 });
  ok('next time, one tap in Telegram signs me in', await g.evaluate(() => S.me && S.me.username === 'sokunthea'));
  await ctx.close();
  delete process.env.GPA_TELEGRAM_BOT_TOKEN; delete process.env.GPA_TELEGRAM_BOT_NAME; delete process.env.URL;
}

/* ---------- 12. Today: my why, three things, focus, the check-in ---------- */
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('gpa-lang')) localStorage.setItem('gpa-lang', 'en'); localStorage.setItem('gpa-onboarded', '1'); } catch (e) {} });
  const q = await ctx.newPage(); q.on('pageerror', x => errors.push('today: ' + x.message)); q.on('dialog', d => d.accept());
  await q.goto(base + '/'); await q.click('#liNew'); await q.waitForSelector('#suPass');
  await q.fill('#suUser', 'thida'); await q.fill('#suPass', 'thida password'); await q.fill('#suPass2', 'thida password');
  await q.fill('#suName', 'Thida Ros'); await q.selectOption('#suYear', '2002'); await q.click('#suGo');
  await q.waitForSelector('[data-topin]');
  ok('Home asks what God made me for, and today’s three things', /Take the Life Journey/.test(await text(q)) && /three things that matter most today/.test(await text(q)));
  await q.fill('[data-topin="0"]', 'Finish the essay'); await q.fill('[data-topin="1"]', 'Call Mum');
  await q.click('#topSave'); await q.waitForSelector('[data-top="0"]');
  await q.click('[data-top="1"]'); await q.waitForTimeout(500);
  ok('today’s three save and tick', /1 of 2 done/.test(await text(q)));
  await q.click('#goFocus'); await q.waitForSelector('#focusStart');
  ok('focus offers today’s things to work on', !!(await q.$('[data-flabel="Finish the essay"]')) && !(await q.$('[data-flabel="Call Mum"]')));
  await q.click('[data-fdur="15"]'); await q.click('[data-flabel="Finish the essay"]'); await q.click('#focusStart');
  await q.waitForSelector('#focusLeft');
  ok('the timer runs', /^1[45]:\d\d$/.test(await q.$eval('#focusLeft', e => e.textContent)));
  /* the phone is put away for 15 minutes: the session ends while the app is closed */
  await q.evaluate(() => { const f = JSON.parse(localStorage.getItem('gpa-focus')); f.start -= 15 * 60000; localStorage.setItem('gpa-focus', JSON.stringify(f)); });
  await q.reload(); await q.waitForSelector('nav.bottom'); await q.waitForTimeout(1200);
  ok('a session that ended while away is counted', await q.evaluate(() => (S.me.daily[S.today] || {}).focus === 15) && /15m/.test(await text(q)));
  await q.click('#goFocus'); await q.waitForTimeout(300);
  ok('… and the done screen offers to tick the thing off', /I finished: Finish the essay/.test(await text(q)));
  await q.click('#focusTick'); await q.waitForTimeout(600); await q.click('#focusHome'); await q.waitForTimeout(300);
  ok('ticked from the focus screen', /All done today/.test(await text(q)));
  await q.evaluate(() => { S.checkinEdit = true; render(); });
  await q.click('[data-mood="4"]'); await q.fill('#gratefulIn', 'My sister helped me'); await q.click('#checkSave'); await q.waitForTimeout(600);
  ok('the evening check-in saves', /Thankful for/.test(await text(q)) && /My sister helped me/.test(await text(q)));
  await ctx.close();
}

/* ---------- 13. team challenges, and a picture of my week ---------- */
await a.click('nav.bottom button[data-tab="teams"]'); await a.waitForTimeout(400);
await a.click('[data-team]'); await a.waitForSelector('#chNewOpen');
await a.click('#chNewOpen'); await a.click('[data-chidea^="📖"]'); await a.click('[data-chdays="7"]'); await a.click('#chGo');
await a.waitForSelector('.chCard');
ok('a leader starts a 7-day challenge', /Read a Bible chapter every day/.test(await text(a)) && /Day 1 of 7/.test(await text(a)));
await m.click('nav.bottom button[data-tab="teams"]'); await m.waitForTimeout(400); await m.click('[data-team]'); await m.waitForSelector('[data-chjoin]');
await m.click('[data-chjoin$="|1"]'); await m.waitForSelector('[data-chtick]');
ok('a member joins it', (await m.$$('.chDot')).length === 7);
await m.click('nav.bottom button[data-tab="home"]'); await m.waitForSelector('[data-chtick]');
ok('… sees it on Home', /Your challenges/.test(await text(m)));
await m.click('[data-chtick$="|1"]'); await m.waitForTimeout(800);
ok('… and ticks today from Home', /Done today/.test(await text(m)));
await a.click('[data-back]'); await a.waitForTimeout(300); await a.click('[data-team]'); await a.waitForSelector('.chPerson');
ok('the team sees her day counted', /Mina\s*1\/7/.test(await a.$eval('.chPeople', e => e.innerText.replace(/\n/g, ' '))));
await a.click('nav.bottom button[data-tab="home"]'); await a.click('#goShare');
await a.waitForSelector('.shareImg');
ok('a picture of my week is drawn on the phone', await a.evaluate(() => S.shareImg && S.shareImg.blob && S.shareImg.blob.size > 20000 && S.shareImg.url.startsWith('data:image/png')));
await a.click('[data-back]');

/* ---------- 14. the first-day walkthrough, and levels ---------- */
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('gpa-lang')) localStorage.setItem('gpa-lang', 'en'); } catch (e) {} });
  const q = await ctx.newPage(); q.on('pageerror', x => errors.push('welcome: ' + x.message));
  await q.goto(base + '/'); await q.click('#liNew'); await q.waitForSelector('#suPass');
  await q.fill('#suUser', 'dalin'); await q.fill('#suPass', 'dalin password'); await q.fill('#suPass2', 'dalin password');
  await q.fill('#suName', 'Dalin Chea'); await q.selectOption('#suYear', '2004'); await q.click('#suGo');
  await q.waitForSelector('.obBox');
  ok('a new account starts with the walkthrough', /Welcome, Dalin!/.test(await text(q)));
  await q.click('#obNext'); await q.waitForSelector('#obWhy');
  await q.fill('#obWhy', 'To be a light in my family'); await q.click('#obNext'); await q.waitForSelector('[data-obh]');
  await q.click('[data-obh="bible"]'); await q.click('[data-obh="exercise"]'); await q.click('#obNext');
  await q.waitForSelector('#obDone');
  ok('… my why and two habits are saved', await q.evaluate(() => S.me.plan.why === 'To be a light in my family' && S.me.habits.length === 2));
  await q.click('#obDone'); await q.waitForSelector('[data-habit="bible"]');
  ok('… and Home is ready, with my why on it', /To be a light in my family/.test(await text(q)) && /Level 1/.test(await text(q)));
  await q.click('[data-habit="bible"]'); await q.waitForSelector('.xpPop');
  ok('a habit ticked pops +5 XP', /\+5 XP/.test(await q.$eval('.xpPop', e => e.textContent)));
  await q.reload(); await q.waitForSelector('nav.bottom'); await q.waitForTimeout(500);
  ok('the walkthrough doesn’t come back', !(await q.$('.obBox')));
  await ctx.close();
}

/* ---------- 15. Bible reading plans and prayer ---------- */
await a.click('nav.bottom button[data-tab="grow"]'); await a.click('#goFaith'); await a.waitForSelector('[data-planstart="hard_days"]');
ok('the Learn tab opens Bible & prayer, with plans to start', /Psalms for hard days/.test(await text(a)) && /John in 21 days/.test(await text(a)));
await a.click('[data-planstart="hard_days"]'); await a.waitForSelector('[data-read^="hard_days|0"]');
ok('a plan starts on day 1: a passage, never the Bible’s text', /Psalms 23/.test(await text(a)));
await a.click('nav.bottom button[data-tab="home"]'); await a.waitForSelector('[data-read]');
ok('today’s reading is on Home', /Today’s reading/.test(await text(a)) && /Psalms 23/.test(await text(a)));
await a.click('[data-read^="hard_days|0"]'); await a.waitForTimeout(700);
ok('ticking it moves on to the next day', /Psalms 27/.test(await text(a)) && /Day 2 of 7/.test(await text(a)));
ok('book names follow the language', await a.evaluate(() => { const was = LANG; LANG = 'km'; const r = refLabel_('Psalms 23'); LANG = was; return r === 'ទំនុកតម្កើង 23'; }));
await a.click('nav.bottom button[data-tab="grow"]'); await a.click('#goFaith'); await a.waitForSelector('#prIn');
await a.fill('#prIn', 'For my exams next week'); await a.click('#prAdd'); await a.waitForSelector('[data-pranswer]');
await a.click('[data-pranswer$="|1"]'); await a.waitForTimeout(600);
ok('a prayer is added, then marked answered', /God answered 1 of your prayers/.test(await text(a)));

await a.click('nav.bottom button[data-tab="teams"]'); await a.waitForTimeout(400); await a.click('[data-team]'); await a.waitForSelector('.personRow');
ok('the team page shows this week’s leaderboard', /This week/.test(await text(a)) && !!(await a.$('.lbRow')) && /\+\d+ XP/.test(await text(a)));
await a.click('nav.bottom button[data-tab="home"]'); await a.waitForSelector('.heroStats');
ok('Home explains streak freezes', /streak freeze/.test(await text(a)));

/* ---------- 16. friends, and the leader's pulse ---------- */
await openTeamPerson(a, 'Dara');
await a.click('[data-friendask]'); await a.waitForTimeout(600);
ok('ask a teammate to be friends from their card', /Asked!/.test(await a.$eval('#msg', e => e.textContent)));
await d.click('nav.bottom button[data-tab="home"]'); await d.waitForSelector('[data-friendyes]');
ok('… they see the ask on Home', /wants to be friends/.test(await text(d)));
await d.click('[data-friendyes$="|1"]'); await d.waitForTimeout(800);
ok('… and say yes', /You’re friends now/.test(await d.$eval('#msg', e => e.textContent)));
await a.click('nav.bottom button[data-tab="home"]'); await a.waitForTimeout(800);
ok('friends show on Home with their streak', /Friends/.test(await text(a)) && /Dara/.test(await a.$eval('.feedRow:has-text("Dara")', e => e.innerText)));
if (await a.$('[data-nudge]')) { await a.click('[data-nudge]'); await a.waitForTimeout(600); ok('a 👋 nudge, once a day', !!(await a.$('[data-nudge][disabled]'))); }
else ok('a friend who has done today needs no nudge', !!(await a.$('.feedRow:has-text("Dara") .clapN')));
await a.click('nav.bottom button[data-tab="teams"]'); await a.waitForTimeout(400); await a.click('[data-team]'); await a.waitForSelector('#goPulse');
await a.click('#goPulse'); await a.waitForSelector('[data-cheer]');
ok('a leader sees the team’s pulse', /Team pulse/.test(await text(a)) && /Mina/.test(await text(a)) && /in the app today/.test(await text(a)));
await a.click('.feedRow:has-text("Mina") [data-cheer]'); await a.waitForTimeout(600);
ok('… and can cheer someone, once a day', !!(await a.$('.feedRow:has-text("Mina") [data-cheer][disabled]')));
ok('a member who isn’t a leader has no pulse', await (async () => { await m.click('nav.bottom button[data-tab="teams"]'); await m.waitForTimeout(400); if (!(await m.$('[data-team]'))) return true; await m.click('[data-team]'); await m.waitForTimeout(500); return !(await m.$('#goPulse')); })());
await a.click('[data-back]'); await a.waitForTimeout(200);

/* today's devotional */
await a.click('nav.bottom button[data-tab="home"]'); await a.waitForSelector('#goDevo');
ok('today’s devotional is on Home', /Today’s devotional/.test(await text(a)));
await a.click('#goDevo'); await a.waitForSelector('#devoAmen');
ok('… a passage to read first, a reflection, a question and a prayer', /Read first:/.test(await text(a)) && /Think about it/.test(await text(a)) && /Pray/.test(await text(a)));
await a.click('#devoAmen'); await a.waitForTimeout(600);
ok('… and Amen marks it read', /See you tomorrow/.test(await text(a)) && await a.evaluate(() => !!(S.me.daily[S.today] || {}).devo));
await a.click('[data-back]');

/* ---------- 17. the Life Journey, and my vision ---------- */
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(() => { try { localStorage.setItem('gpa-lang', 'en'); localStorage.setItem('gpa-onboarded', '1'); } catch (e) {} });
  const j = await ctx.newPage(); j.on('pageerror', x => errors.push('journey: ' + x.message)); j.on('dialog', d => d.accept());
  await j.goto(base + '/'); await j.click('#liNew'); await j.waitForSelector('#suPass');
  await j.fill('#suUser', 'jonah'); await j.fill('#suPass', 'jonah password'); await j.fill('#suPass2', 'jonah password');
  await j.fill('#suName', 'Jonah Lim'); await j.selectOption('#suYear', '2003'); await j.click('#suGo');
  await j.waitForSelector('#goJourney'); await j.click('#goJourney'); await j.waitForSelector('#jrGo');
  ok('the Life Journey starts at stop 1 of 7', /Stop 1 of 7/.test(await text(j)) && /Where you come from/.test(await text(j)) && (await j.$$('.jrStop')).length === 7);
  await j.click('#jrGo'); await j.waitForSelector('[data-jrc]');
  for (const id of ['happy', 'hard', 'blessed', 'growing']) await j.click(`[data-jrc="${id}"]`);
  ok('a question with chips keeps to its number', await j.$$eval('.jrChip.on', b => b.map(x => x.getAttribute('data-jrc')).join()) === 'hard,blessed,growing');
  await j.click('#jrNext'); await j.fill('#jrText', 'Leading worship at camp'); await j.click('#jrNext');
  ok('an empty question can be skipped', /Skip/.test(await j.$eval('#jrNext', b => b.textContent)) && /Only you will ever see this/.test(await text(j)));
  await j.click('#jrNext'); await j.fill('#jrText', 'God takes care of us'); await j.click('#jrNext');
  await j.fill('#jrText', '“Finding my feet”'); await j.click('#jrNext');
  await j.waitForSelector('#jrOn');
  ok('finishing a stop saves it, with XP', /Where you come from: done!/.test(await text(j)) && await j.evaluate(() => S.me.story.done.join() === 'home' && S.me.story.a.best === 'Leading worship at camp' && S.me.level.xp === 20));
  await j.click('#jrLater2'); await j.waitForTimeout(300);
  await j.click('nav.bottom button[data-tab="home"]'); await j.waitForTimeout(300);
  ok('Home offers to continue the journey', /Continue your Life Journey · 1 of 7 stops/.test(await text(j)));
  await j.click('#goJourney'); await j.waitForSelector('#jrGo');
  ok('… which picks up at the next stop', /Who you are/.test(await text(j)));
  let secs = 0;
  const answers = { gifts: ['music', 'teach'], who: ['youth'], heart: ['hope'], fear: ['fail'], truth: ['with'], walk: ['team'], known: ['brave', 'faithful'], word: ['focus'] };
  for (let guard = 0; guard < 60; guard++) {
    if (await j.$('#levelOk')) await j.click('#levelOk');
    if (await j.$('#jrGo')) { await j.click('#jrGo'); continue; }
    if (await j.$('#jrOn')) { await j.click('#jrOn'); continue; }
    if (await j.$('#jrSec')) { secs++; await j.click('#jrSecNext'); await j.waitForTimeout(100); continue; }
    if (await j.$('.jrBuild')) { await j.waitForSelector('#jrSec'); continue; }
    if (await j.$('#jrVision')) break;
    const k = await j.evaluate(() => JR_STOPS[S.jr.s].qs[S.jr.q].k);
    if (k === 'wheel') { for (const a of ['faith', 'family', 'study', 'health', 'money', 'serve']) await j.click(`[data-jrw="${a}|4"]`); }
    else if (k === 'areas') await j.fill('#jrA_study', 'I teach English at a school');
    else if (k === 'year') await j.fill('#jrText', 'I pass grade 12');
    else if (answers[k]) for (const id of answers[k]) await j.click(`[data-jrc="${id}"]`);
    await j.click('#jrNext'); await j.waitForTimeout(100);
  }
  ok('the vision is written in five sections, one at a time', secs === 5);
  const draft = await j.$eval('#jrVision', e => e.value);
  ok('text boxes are 16px on a phone, so iPhone Safari doesn’t zoom in', await j.$eval('#jrVision', e => getComputedStyle(e).fontSize) === '16px');
  await j.tap('#jrVision'); await j.waitForTimeout(200);
  ok('with the box in focus but no keyboard up, the bottom bar stays', await j.evaluate(() => !document.body.classList.contains('typing')));
  const vp = j.viewportSize(); await j.setViewportSize({ width: vp.width, height: Math.round(vp.height * 0.55) }); await j.waitForTimeout(300);   // the keyboard comes up
  ok('… and steps aside while the keyboard is up', await j.evaluate(() => document.body.classList.contains('typing') && getComputedStyle(document.getElementById('bottomNav')).display === 'none'));
  await j.setViewportSize(vp); await j.waitForTimeout(300);
  ok('… and comes back when the keyboard goes', await j.evaluate(() => !document.body.classList.contains('typing')));
  ok('the app writes a vision from the answers', /I’m Jonah, a child of God, becoming someone brave and faithful\./.test(draft) && /gift for music and explaining and teaching, and I want to use it to help young people/.test(draft)
    && /🎓 I teach English at a school/.test(draft) && /When I’m afraid of failing, I’ll remember: God is with me, even here\./.test(draft) && /My word for \d{4}: FOCUS/.test(draft), draft);
  ok('… and a why in one line, ready to use', /To help young people with my gift for music and explaining and teaching, because God cares about young people without hope/.test(await text(j)) && await j.$eval('#jrUseWhy', e => e.checked));
  await j.fill('#jrVision', draft + '\n\nI will not give up.'); await j.evaluate(() => document.activeElement.blur()); await j.waitForTimeout(200); await j.click('#jrKeep'); await j.waitForSelector('#visionRead');
  ok('keeping it shows my vision, as I changed it', /I will not give up/.test(await text(j)) && await j.evaluate(() => S.me.plan.word === 'Focus' && /^To help young people/.test(S.me.plan.why)), await j.evaluate(() => JSON.stringify({ w: S.me.plan.word, why: S.me.plan.why, v: S.me.plan.vision.slice(-60), view: S.view })));
  if (await j.$('#levelOk')) await j.click('#levelOk');
  await j.click('#visionRead'); await j.waitForTimeout(600);
  ok('… and I can mark it read today', /Read today/.test(await text(j)));
  await j.click('nav.bottom button[data-tab="home"]'); await j.waitForSelector('#goVision');
  ok('Home shows my vision: my word, my why, who I’m becoming and one thing for today', /FOCUS/.test(await text(j)) && /Becoming: Brave · Faithful/.test(await text(j)) && /For today/.test(await text(j)) && /To help young people/.test(await text(j)));
  await j.click('#goVision'); await j.waitForSelector('.visionText');
  ok('the journey’s life wheel shows on my vision', await j.evaluate(() => S.me.story.wheels.length === 1 && S.me.story.a.wheel.faith === 4) && /My life now/.test(await text(j)));
  await j.click('#wheelAgain'); await j.waitForSelector('[data-wh]');
  for (const a of ['faith', 'family', 'study', 'health', 'money', 'serve']) await j.click(`[data-wh="${a}|5"]`);
  await j.click('#wheelSave'); await j.waitForTimeout(700);
  ok('checking my life again saves it', await j.evaluate(() => S.me.story.a.wheel.health === 5 && !S.wheelEdit) && !(await j.$('[data-wh]')));
  await j.click('#shareWord'); await j.waitForSelector('.shareImg');
  ok('my word for the year makes a picture to share', /Share my word for the year/.test(await text(j)) && /gonpreah-my-word\.png/.test(await j.$eval('#shareSave', a => a.download)));
  await j.click('[data-back]'); await j.waitForSelector('#visionRead, .allDone');
  await j.click('nav.bottom button[data-tab="plan"]'); await j.waitForSelector('[data-dream="study"]');
  await j.click('[data-dream="study"]'); await j.waitForSelector('#gTitle');
  ok('a dream becomes a goal in one tap', await j.$eval('#gTitle', e => e.value) === 'I teach English at a school' && !!(await j.$('[data-garea="study"].on')));
  await ctx.close();
}

/* ---------- 17b. the five gifts, and going deeper ---------- */
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(() => { try { localStorage.setItem('gpa-lang', 'en'); localStorage.setItem('gpa-onboarded', '1'); } catch (e) {} });
  const g = await ctx.newPage(); g.on('pageerror', x => errors.push('gifts: ' + x.message));
  await g.goto(base + '/'); await g.click('#liNew'); await g.waitForSelector('#suPass');
  await g.fill('#suUser', 'gifty'); await g.fill('#suPass', 'gifty password'); await g.fill('#suPass2', 'gifty password');
  await g.fill('#suName', 'Gifty Chan'); await g.selectOption('#suYear', '2001'); await g.click('#suGo');
  await g.waitForSelector('#goAtest'); await g.click('#goAtest'); await g.waitForSelector('#apBegin');
  ok('the five gifts test explains itself first', /Ephesians 4:11/.test(await text(g)) && /Apostle/.test(await text(g)) && /Teacher/.test(await text(g)));
  await g.click('#apBegin');
  for (let pg = 0; pg < 6; pg++) {
    const ids = await g.$$eval('[data-apans]', bs => [...new Set(bs.map(b => b.getAttribute('data-apans').split('|')[0]))]);
    for (const id of ids) await g.click(`[data-apans="${id}|${id[0] === 'e' ? 5 : id[0] === 'p' ? 4 : 2}"]`);
    if (await g.$('#apNext')) await g.click('#apNext'); else { await g.click('#apFinish'); break; }
  }
  await g.waitForSelector('.apHero');
  ok('the results name the strongest gift and the second', /Your strongest gift/.test(await text(g)) && /Evangelist/.test(await g.$eval('.apHero', e => e.innerText)) && /Prophet/.test(await g.$eval('.apSecond', e => e.innerText)));
  ok('… with the mix, what it is, at its best and unhealthy, and where it could shine', (await g.$$('.apBar')).length === 5 && /At its best/.test(await text(g)) && /When it’s unhealthy/.test(await text(g)) && /Where your gift could shine/.test(await text(g)) && (await g.$$('.apCard .sphChip, .sphChip')).length >= 2);
  ok('… and passages to read, as references', /Read:/.test(await text(g)));
  await g.evaluate(() => call('savePersonality', { type: 'ENFJ', sex: 'female' }).then(d => { S.me = d.me; }));
  const gsAns = {}; for (let i = 0; i < 102; i++) gsAns['p' + i] = 0;
  await g.evaluate(a => call('saveStrengths', { answers: a }).then(d => { S.me = d.me; }), gsAns);
  await g.click('nav.bottom button[data-tab="home"]'); await g.waitForSelector('.godMade');
  ok('Home shows what the tests found: type, Top 5 and gifts, each opening its results', /ENFJ/.test(await g.$eval('.godMade', e => e.innerText)) && (await g.$$('.godMade .sChip')).length === 5 && /Evangelist · Prophet/.test(await g.$eval('.godMade', e => e.innerText)) && !(await g.$('#goPtest')) && !(await g.$('#goAtest')));
  if (await g.$('#levelOk')) await g.click('#levelOk');
  await g.click('.godMade #seeMyType'); await g.waitForSelector('.pHero'); await g.click('[data-back]'); await g.waitForTimeout(200);
  await g.click('nav.bottom button[data-tab="me"]'); await g.waitForSelector('#seeMyAp'); await g.waitForTimeout(800);
  ok('Me shows the gifts and where all three tests say my gifts may shine', /Evangelist · Prophet/.test(await g.$eval('#seeMyAp', e => e.innerText)) && (await g.$$('.sphRow')).length === 3);
  if (await g.$('#levelOk')) await g.click('#levelOk');
  await g.click('#seeMyType'); await g.waitForSelector('.deepCard');
  ok('my type goes deeper: at my best, under stress, with God, and work that may fit', /You at your best/.test(await text(g)) && /Under stress/.test(await text(g)) && /With God/.test(await text(g)) && /Work that may fit you/.test(await text(g)));
  await g.click('[data-back]'); await g.waitForSelector('#seeMyGs'); await g.click('#seeMyGs'); await g.waitForSelector('.gsDeep');
  ok('each of my top 5 strengths goes deeper, with where they may shine', (await g.$$('.gsDeep')).length === 5 && /Where your top 5 may shine/.test(await text(g)));
  await g.click('nav.bottom button[data-tab="home"]'); await g.waitForSelector('.gmShine');
  ok('… and once the deeper parts are on the phone, Home says where my gifts may shine', /May shine in/.test(await g.$eval('.godMade', e => e.innerText)));
  await ctx.close();
}

/* ---------- 17c. the debug panel (?debug) ---------- */
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const d = await ctx.newPage(); d.on('pageerror', x => errors.push('debug: ' + x.message));
  await d.goto(base + '/?debug'); await d.waitForSelector('#liUser');
  ok('a first visit is in English, with Khmer one tap away', /Sign in/.test(await text(d)) && await d.$eval('#langBtn', b => b.textContent) === 'ខ្មែរ' && await d.evaluate(() => document.documentElement.lang) === 'en');
  await d.tap('#liUser'); await d.waitForTimeout(600);
  const log = await d.$eval('#dbgBox', e => e.textContent);
  ok('?debug shows a panel of what the phone does: taps, focus, redraws', /touchstart input#liUser/.test(log) && /focusin input#liUser/.test(log) && /redraw/.test(log) && await d.$eval('#dbgBox', e => getComputedStyle(e).pointerEvents) === 'none', log.slice(0, 300));
  await d.goto(base + '/'); await d.waitForSelector('#liUser');
  ok('… only while ?debug is in the address: nothing to turn off', !(await d.$('#dbgBox')));
  await ctx.close();
}

/* ---------- 17d. staying up to date by itself ---------- */
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(() => { try { localStorage.setItem('gpa-lang', 'en'); localStorage.setItem('gpa-onboarded', '1'); } catch (e) {} });
  const u = await ctx.newPage(); u.on('pageerror', x => errors.push('update: ' + x.message));
  await u.goto(base + '/'); await u.click('#liNew'); await u.waitForSelector('#suPass');
  await u.fill('#suUser', 'fresh'); await u.fill('#suPass', 'fresh password'); await u.fill('#suPass2', 'fresh password');
  await u.fill('#suName', 'Fresh Ly'); await u.selectOption('#suYear', '2002'); await u.click('#suGo'); await u.waitForSelector('nav.bottom');
  await u.click('nav.bottom button[data-tab="plan"]'); await u.waitForTimeout(500);
  await u.waitForFunction(() => APP_TAG !== null);
  const away = async () => { await u.evaluate(() => { window.__old = 1; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); }); await u.waitForTimeout(1500); };
  await away();
  ok('coming back to the app with nothing new, it stays as it is', await u.evaluate(() => window.__old === 1));
  await u.evaluate(() => { APP_TAG = 'an older version'; }); await away(); await u.waitForSelector('nav.bottom');
  ok('… with a new version out, it reloads itself, on the same tab', await u.evaluate(() => window.__old === undefined && S.view === 'plan'));
  await ctx.close();
}

/* ---------- 17e. the Sunday reset, badges, and the walkthrough's way to the Life Journey ---------- */
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(() => { try { localStorage.setItem('gpa-lang', 'en'); } catch (e) {} });
  const w = await ctx.newPage(); w.on('pageerror', x => errors.push('reset: ' + x.message));
  await w.goto(base + '/'); await w.click('#liNew'); await w.waitForSelector('#suPass');
  await w.fill('#suUser', 'resetter'); await w.fill('#suPass', 'resetter password'); await w.fill('#suPass2', 'resetter password');
  await w.fill('#suName', 'Reset Ter'); await w.selectOption('#suYear', '2001'); await w.click('#suGo');
  await w.waitForSelector('#obNext'); await w.click('#obNext'); await w.waitForSelector('#obJourney');
  ok('the walkthrough offers the Life Journey for finding my why', /Find it with the Life Journey/.test(await text(w)));
  await w.click('#obJourney'); await w.waitForSelector('[data-obh]'); await w.click('#obNext'); await w.waitForSelector('#obDone'); await w.click('#obDone');
  await w.waitForSelector('#jrGo');
  ok('… and it opens right after the walkthrough', /Where you come from/.test(await text(w)));
  await w.click('#jrLater'); await w.waitForTimeout(400);
  await w.evaluate(() => { resetWeek_ = () => mondayOf(todayStr()); render(); });   // as if it were Monday
  await w.click('nav.bottom button[data-tab="home"]'); await w.waitForSelector('#goReset');
  ok('on a Monday, Home offers the Sunday reset', /Sunday reset/.test(await text(w)));
  await w.click('#goReset'); await w.waitForSelector('#rsText');
  ok('… which looks back at the week first', /what went well this week/.test(await text(w)) && /days with habits/.test(await text(w)));
  await w.fill('#rsText', 'Helped my sister'); await w.click('#rsNext'); await w.fill('#rsText', 'Late nights'); await w.click('#rsNext');
  await w.waitForSelector('[data-rsarea]'); await w.click('[data-rsarea="health"]'); await w.click('#rsNext');
  await w.waitForSelector('[data-rsgoal]'); await w.fill('[data-rsgoal="0"]', 'Sleep by 11'); await w.fill('[data-rsgoal="1"]', 'Run twice');
  ok('… suggests a goal for the part of life I chose', /Maybe one for/.test(await text(w)) && /Health/.test(await text(w)));
  await w.click('#rsNext'); await w.waitForSelector('#rsNext'); ok('… and ends by giving the week to God', /Give the week to God/.test(await text(w)) && /Sleep by 11/.test(await text(w)));
  await w.click('#rsNext'); await w.waitForTimeout(900);
  ok('the week is set: its goals, the reset kept, and it leaves Home', await w.evaluate(() => { const wk = mondayOf(todayStr()); return S.view === 'home' && (S.me.weeks[wk] || []).map(g => g.text).join() === 'Sleep by 11,Run twice' && S.me.resets[wk].area === 'health'; }) && !(await w.$('#goReset')));
  await w.click('nav.bottom button[data-tab="me"]'); await w.waitForSelector('#goBadges'); await w.click('#goBadges'); await w.waitForSelector('.badgeGrid');
  ok('badges: twenty-two, with what each one takes and how close I am', (await w.$$('.badge')).length === 22 && /A 7-day streak/.test(await text(w)) && /0 \/ 7/.test(await text(w)));
  await w.evaluate(() => { S.me.stats.best = 7; render(); }); await w.waitForTimeout(300);
  ok('… and a new one pops up once', /New badge/.test(await w.$eval('.badgePop', e => e.innerText)) && (await w.$$('.badge.got')).length >= 1);
  await ctx.close();
}

/* ---------- 17f. team meetups, and my habit calendar ---------- */
{
  await a.click('nav.bottom button[data-tab="teams"]'); await a.waitForTimeout(400); await a.click('[data-team]'); await a.waitForSelector('#mtNew');
  await a.click('#mtNew'); await a.fill('#mtTitle', 'Youth night'); await a.fill('#mtPlace', 'The church hall'); await a.click('#mtSave'); await a.waitForTimeout(700);
  ok('a leader posts a meetup on the team page', /Youth night/.test(await text(a)) && /The church hall/.test(await text(a)) && /1 going/.test(await text(a)));
  await d.click('nav.bottom button[data-tab="teams"]'); await d.waitForTimeout(300); await d.click('nav.bottom button[data-tab="home"]'); await d.waitForTimeout(800);
  ok('the team sees it on Home, coming up', /Coming up/.test(await text(d)) && /Youth night/.test(await text(d)));
  await d.click('[data-rsvp$="|yes"]'); await d.waitForTimeout(900);
  ok('… and says they’re going', await d.evaluate(() => (S.meets || []).some(m => m.title === 'Youth night' && m.mine === 'yes')));
  await a.click('nav.bottom button[data-tab="home"]'); await a.waitForSelector('#goHabitCal'); await a.click('#goHabitCal'); await a.waitForSelector('.calGrid');
  ok('my habit calendar: twelve weeks of days, a ticked day coloured, and each habit over 30 days', (await a.$$('.calGrid .calCell')).length === 84 && (await a.$$('.calGrid .calCell.l1, .calGrid .calCell.l2, .calGrid .calCell.l3, .calGrid .calCell.l4')).length >= 1 && /The last 30 days/.test(await text(a)));
  await a.click('[data-back]'); await a.waitForTimeout(200);
}

/* ---------- 17g. my journal, goal ideas, focus sounds, customize Home ---------- */
{
  await a.click('nav.bottom button[data-tab="me"]'); await a.waitForSelector('#goJournal'); await a.click('#goJournal'); await a.waitForSelector('#jnText');
  ok('my journal opens with a question for today, and says only I can read it', /Only you can read your journal/.test(await text(a)) && (await a.$eval('.jnPrompt', e => e.textContent)).length > 10);
  const q1 = await a.$eval('.jnPrompt', e => e.textContent); await a.click('#jnDice');
  ok('… 🎲 gives another question', (await a.$eval('.jnPrompt', e => e.textContent)) !== q1);
  await a.fill('#jnText', 'God answered my prayer about my exam today.'); await a.click('#jnSave'); await a.waitForTimeout(700);
  ok('… and a page is saved', await a.evaluate(() => (S.me.journalDays || []).includes(todayStr())));
  await a.click('[data-back]'); await a.waitForTimeout(200);
  await a.click('#goHomeCfg'); await a.waitForSelector('[data-hcshow="devo"]');
  await a.click('[data-hcshow="devo"]');
  for (let i = 0; i < 12; i++) { const up = await a.$('[data-hcup="habits"]:not([disabled])'); if (!up) break; await up.click(); await a.waitForTimeout(60); }
  await a.click('nav.bottom button[data-tab="home"]'); await a.waitForTimeout(500);
  ok('customize Home: a hidden part is gone, and habits moved to the top come before Today’s 3', !(await a.$('#goDevo')) && await a.evaluate(() => { const hb = document.querySelector('[data-habit]'), fc = document.querySelector('#goFocus'); return !!(hb && fc) && !!(hb.compareDocumentPosition(fc) & Node.DOCUMENT_POSITION_FOLLOWING); }));
  await a.evaluate(() => lsDel('gpa-home')); await a.evaluate(() => render());
  await a.click('nav.bottom button[data-tab="plan"]'); await a.waitForSelector('#newGoal'); await a.click('#newGoal'); await a.waitForSelector('[data-garea="health"]');
  await a.click('[data-garea="health"]'); await a.waitForSelector('[data-gidea]'); await a.click('[data-gidea="0"]');
  ok('a new goal offers ideas for that part of life, and one tap fills it in', await a.$eval('#gTitle', e => e.value) === 'Run 5 km without stopping' && await a.$eval('#gMeasure', e => e.value) === 'I run 5 km in one go');
  await a.click('[data-back]'); await a.waitForTimeout(200);
  await a.click('nav.bottom button[data-tab="home"]'); await a.waitForSelector('#goFocus'); await a.click('#goFocus'); await a.waitForSelector('#focusStart'); await a.click('#focusStart'); await a.waitForSelector('[data-fsound]');
  await a.click('[data-fsound="rain"]'); await a.waitForTimeout(200);
  ok('focus sounds: rain, made on the phone', await a.evaluate(() => FS.kind === 'rain') && !!(await a.$('[data-fsound="rain"].on')));
  await a.click('#focusStop'); await a.waitForTimeout(300);
  ok('… and quiet when the focus stops', await a.evaluate(() => FS.kind === ''));
  await a.evaluate(() => { S.focusDone = null; lsDel('gpa-focus'); S.view = 'home'; render(); });
}

/* ---------- 17h. text size, my data ---------- */
{
  await a.click('nav.bottom button[data-tab="me"]'); await a.waitForSelector('[data-tsize="xl"]');
  const w0 = await a.$eval('#main h3', e => e.getBoundingClientRect().height);
  await a.click('[data-tsize="xl"]'); await a.waitForTimeout(200);
  ok('text size: Larger makes the screen bigger, and stays', await a.evaluate(() => document.documentElement.classList.contains('textXL') && localStorage.getItem('gpa-text') === 'xl') && (await a.$eval('#main h3', e => e.getBoundingClientRect().height)) > w0 && await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await a.click('[data-tsize=""]'); await a.waitForTimeout(200);
  const [dl] = await Promise.all([a.waitForEvent('download'), a.click('#dlData')]);
  const file = JSON.parse(require_fs.readFileSync(await dl.path(), 'utf8'));
  ok('download my data: my account and my journal, in one file', file.app === 'GonPreah' && file.me.username === 'sokha' && file.journal.some(j => /answered my prayer/.test(j.text)));
}

/* ---------- 17i. a classroom: a QR code to join, the leaderboard, our words ---------- */
{
  await a.click('nav.bottom button[data-tab="teams"]'); await a.waitForTimeout(400); await a.click('[data-team]'); await a.waitForSelector('#showQr');
  const link = await a.$eval('#shareCode', b => b.getAttribute('data-link'));
  ok('the join link points at this app, wherever it is', link.startsWith(base + '/?join='));
  await a.click('#showQr'); await a.waitForSelector('.qrBox svg');
  ok('a big QR code of the join link, for a projector', /Point your phone camera here/.test(await text(a)));
  const code = link.split('join=')[1];
  const ctx = await browser.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Phnom_Penh' });
  await ctx.addInitScript(() => { try { localStorage.setItem('gpa-onboarded', '1'); } catch (e) {} });
  const st = await ctx.newPage(); st.on('pageerror', x => errors.push('student: ' + x.message));
  await st.goto(link); await st.waitForSelector('#liNew');
  ok('a student opening the link is told they have a team code', new RegExp(code).test(await text(st)));
  await st.click('#liNew'); await st.waitForSelector('#suPass');
  await st.fill('#suUser', 'student1'); await st.fill('#suPass', 'student1 password'); await st.fill('#suPass2', 'student1 password');
  await st.fill('#suName', 'Bopha Lim'); await st.selectOption('#suYear', '2004'); await st.click('#suGo'); await st.waitForSelector('nav.bottom'); await st.waitForTimeout(900);
  ok('… makes an account and is in the team straight away', await st.evaluate(() => (S.teams || []).length === 1));
  await st.click('nav.bottom button[data-tab="teams"]'); await st.waitForTimeout(500); await st.click('[data-team]'); await st.waitForSelector('.lbTabs');
  ok('… and sees the class leaderboard — everyone who shows their level, from day one', (await st.$$('.lbRow')).length >= 3 && /Leaderboard/.test(await text(st)));
  await st.click('[data-lball="1"]'); await st.waitForTimeout(200);
  ok('… this week or all time', /Lv \d/.test(await text(st)));
  await ctx.close();
  await a.evaluate(() => call('journey', 'vision', { vision: 'I am Sokha, a child of God.', word: 'Faithful' }).then(d => { S.me = d.me; }));
  await a.click('[data-back]'); await a.waitForTimeout(300); await a.click('[data-team]'); await a.waitForSelector('.wordWall');
  ok('our words for the year, on the team page', /FAITHFUL/.test(await a.$eval('.wordWall', e => e.innerText)));
  await a.click('[data-back]'); await a.waitForTimeout(200);
}

/* ---------- 17j. my StrengthsFinder Top 5, typed in ---------- */
{
  await a.click('nav.bottom button[data-tab="me"]'); await a.waitForSelector('#goClifton'); await a.click('#goClifton'); await a.waitForSelector('[data-cf]');
  for (const n of ['Relator', 'Learner', 'Strategic', 'Achiever', 'Empathy']) await a.click(`[data-cf="${n}"]`);
  ok('StrengthsFinder: tap five themes in order', /5 of 5 chosen/.test(await text(a)) && await a.$eval('#cfSave', b => !b.disabled));
  await a.click('[data-cf="Woo"]'); await a.waitForTimeout(200);
  ok('… a sixth is refused', /Five is the most/.test(await a.$eval('#msg', e => e.textContent)));
  await a.click('#cfSave'); await a.waitForTimeout(800);
  ok('… saved, and shown on Me', /Relator/.test(await a.$eval('#goClifton', e => e.innerText)) && await a.evaluate(() => S.me.clifton.top[0] === 'Relator'));
  await a.click('nav.bottom button[data-tab="home"]'); await a.waitForTimeout(400);
  ok('… and on Home, with the other results', /My StrengthsFinder Top 5/.test(await text(a)) && /Empathy/.test(await text(a)));
}

/* ---------- 17k. our gifts, and the big screen ---------- */
{
  await a.evaluate(() => { const ans = {}; 'apest'.split('').forEach(g => { for (let i = 1; i <= 6; i++) ans[g + i] = g === 't' ? 5 : 2; }); return call('saveApest', { answers: ans }).then(d => { S.me = d.me; }); });
  await a.click('nav.bottom button[data-tab="teams"]'); await a.waitForTimeout(400); if (await a.$('#levelOk')) await a.click('#levelOk');
  await a.click('[data-team]'); await a.waitForSelector('#goScreen'); await a.waitForTimeout(600);
  ok('our gifts: how many lead with each of the five, and which are missing', /Our gifts/.test(await text(a)) && /No one leads with/.test(await text(a)));
  await a.click('#goScreen'); await a.waitForSelector('.bsGrid');
  ok('the big screen: the leaderboard, our gifts and the join QR, without the bottom bar', (await a.$$('.bsRow')).length >= 2 && !!(await a.$('.bsGrid .qrBox')) && await a.evaluate(() => getComputedStyle(document.getElementById('bottomNav')).display === 'none' && SCREEN_TIMER !== null));
  await a.click('[data-back]'); await a.waitForTimeout(300);
  ok('… and leaving it brings the bar back and stops the refresh', await a.evaluate(() => !document.body.classList.contains('bigScreen') && SCREEN_TIMER === null));
  await a.click('#goPulse'); await a.waitForSelector('[data-cheer]');
  ok('the pulse shows tests taken and how many finished them all', /all 3 tests done/.test(await text(a)) && /📝 \d\/3/.test(await a.$eval('.list', e => e.innerText)));
  await a.click('[data-back]'); await a.waitForTimeout(200); await a.click('[data-back]'); await a.waitForTimeout(200);
}

/* ---------- 17l. my calling: six parts, in my own words ---------- */
{
  const lvl = async () => { await a.waitForTimeout(250); if (await a.$('#levelOk')) await a.click('#levelOk'); };
  const next = async () => { await a.click('#clNext'); await a.waitForTimeout(120); if (await a.$('#clPartGo')) await a.click('#clPartGo'); await a.waitForTimeout(120); };
  const q = () => a.evaluate(() => S.cl.i >= 0 ? CL_QS[S.cl.i].k : '');
  await a.click('nav.bottom button[data-tab="plan"]'); await a.waitForTimeout(400); await lvl();
  await a.click('#goCalling'); await a.waitForSelector('#clGo');
  ok('my calling: what the tests and journey bring, and six parts', (await a.$$('.clReadyRow')).length === 4 && (await a.$$('.clPartRow')).length === 6);
  await a.click('#clGo'); await a.waitForSelector('#clPartGo');
  ok('… each part starts with what it’s for', /Part 1 of 6/.test(await text(a)) && /How God made you/.test(await text(a)));
  await a.click('#clPartGo'); await a.waitForSelector('#clText');
  await a.click('[data-clst="0"]');
  ok('a starter begins the sentence for me', /^I’m someone who $/.test(await a.$eval('#clText', e => e.value)));
  await a.fill('#clText', 'I’m someone who notices the person sitting alone. I love explaining things.');
  await next(); await a.click('[data-clseed="0"]'); await a.fill('#clG2', 'Making people feel welcome');
  ok('three things I do well, with ideas to tap', (await a.$eval('#clG1', e => e.value)).length > 2);
  await next(); await a.fill('#clText', 'At camp I led ten kids through a Bible drama.');
  await next(); await a.fill('[data-clpair="gives"]', 'Teaching'); await a.fill('[data-clpair="drains"]', 'Paperwork');
  await next(); ok('part 2: what moves me', await q() === 'burden'); await a.fill('#clText', 'So many kids in my province stop school at 12 to work.');
  await a.click('#clLater'); await a.waitForTimeout(500);
  await a.click('#goCalling'); await a.waitForSelector('#clResume');
  ok('it saves, and carries on where I stopped', /Continue: What moves you/.test(await text(a)) && await a.evaluate(() => S.me.calling.a.gives === 'Teaching'));
  await a.click('#clResume'); await a.click('#clPartGo'); await a.waitForTimeout(150);
  await next(); await a.click('[data-clc="kids"]');
  await next(); await a.fill('#clText', 'A 13-year-old girl who sells vegetables every morning instead of going to school.');
  await next(); await a.click('[data-clc="learn"]');
  await next(); await a.fill('#clText', 'Every child in my village finishes grade 9.');
  await next(); await a.fill('#clText', 'My cousin had to leave school.');
  await next(); await a.waitForSelector('[data-clsph]');
  for (const id of ['education', 'tech', 'health']) await a.click(`[data-clsph="${id}"]`);
  ok('part 3: up to two spheres, with what God cares about there', await a.evaluate(() => S.cl.a.spheres.c.join() === 'tech,health') && /✝/.test(await text(a)));
  await a.click('[data-clsph="tech"]'); await a.click('[data-clsph="education"]');
  await next(); await a.waitForSelector('[data-clrole]');
  ok('… then real work in those spheres', !!(await a.$('[data-clrole="nurse"]')) && !!(await a.$('[data-clrole="teacher"]')) && !(await a.$('[data-clrole="dev"]')));
  await a.click('[data-clrole="teacher"]'); await a.waitForTimeout(100);
  ok('… each with how to start', /Go to a teacher training college/.test(await text(a)));
  await next(); await a.fill('#clText', 'When it clicks for a student.');
  await next(); await a.fill('#clText', 'Teacher Sokha');
  await next(); await a.waitForSelector('[data-clsk]');
  ok('… and the skills that work needs, first', (await a.$$eval('.jrChips', c => c[0].innerText)).includes('Teaching'));
  await a.click('[data-clsk="teach"]');
  await next(); await a.click('[data-clc="teach"]');
  await next(); await a.click('[data-clc="home"]');
  await next(); await a.waitForSelector('[data-clidea]'); await a.click('[data-clidea="0"]'); await a.waitForTimeout(150);
  await a.fill('#clText', 'Start a Saturday reading club for 20 children in my village.');
  await next(); await a.click('[data-clck="who"]'); await a.waitForTimeout(100);
  ok('a clarity check on my focus, with a tip for what’s missing', /Add a doing word/.test(await text(a)) && !!(await a.$('#clSharpen')));
  for (const id of ['what', 'measure', 'gifts', 'start']) await a.click(`[data-clck="${id}"]`);
  await next(); await a.fill('#clM1', 'Start the club with ten children'); await a.fill('#clM3', 'A second club');
  await next(); await a.fill('#clText', 'Ask Teacher Sokha if I can help.');
  await next(); await a.fill('#clText', 'My Saturdays.');
  await next(); await a.click('[data-clc="scroll"]');
  await next(); await a.fill('#clText', 'My youth leader');
  await next(); await a.click('[data-clc="pray"]'); await a.click('[data-clc="give"]');
  await next(); await a.fill('#clText', 'Isaiah 61:1');
  await next(); await a.waitForSelector('.clLead');
  const w1 = await a.$eval('#clText', e => e.value);
  ok('part 6: each line of my calling starts as a draft of my own words', w1.startsWith('I’m someone who notices the person sitting alone.') && /God made me/.test(w1));
  await next(); ok('… who I’m called to', /^I’m called to teach and train children, so they can learn and finish school\. I’ll serve through health & science and education, starting in my village or province\.$/.test(await a.$eval('#clText', e => e.value)));
  await next(); ok('… my focus', /^For the next three years, I will start a Saturday reading club for 20 children in my village\.$/.test(await a.$eval('#clText', e => e.value)));
  await next(); ok('… and why', /^Because I long to see this: every child in my village finishes grade 9\.$/.test(await a.$eval('#clText', e => e.value)));
  await next(); await a.waitForSelector('#clStmt');
  ok('the four lines together, to read out loud', (await a.$eval('#clStmt', e => e.value)).includes('I’m called to teach') && (await a.$$('[data-clread]')).length === 4);
  await a.click('#clKeep'); await a.waitForSelector('.clHero'); await lvl();
  const letter = await a.$eval('#clTx', e => e.value);
  ok('the letter tells my story in my own words, then the calling, the plan and the asks', /^Dear friends and family,/.test(letter) && letter.includes('My cousin had to leave school.') && letter.includes('A 13-year-old girl') && letter.includes('So this is my calling: I’m someone who') && /Here’s the plan, year by year/.test(letter) && letter.includes('School teacher') && letter.includes('Would you pray for me and give to support me?'), letter);
  await a.click('[data-cllang="km"]'); await a.waitForTimeout(200);
  ok('… and in Khmer, for the family', /^ជូនចំពោះ/.test(await a.$eval('#clTx', e => e.value)));
  await a.fill('#clTx', 'ជូនចំពោះ ប៉ា ម៉ាក់'); await a.dispatchEvent('#clTx', 'input');
  await a.click('#clTxSave'); await a.waitForTimeout(500);
  ok('… my own changes can be saved', await a.evaluate(() => S.me.calling.letter.km === 'ជូនចំពោះ ប៉ា ម៉ាក់'));
  await a.click('[data-cltab="post"]'); await a.click('[data-cllang="en"]'); await a.waitForTimeout(200);
  ok('a short message too', /^I’m someone who/.test(await a.$eval('#clTx', e => e.value)) && !!(await a.$('#clTg')));
  await a.click('[data-cltab="pic"]'); await a.waitForSelector('.clShare .shareImg', { timeout: 8000 });
  ok('… and a picture', (await a.$eval('.clShare .shareImg', e => e.naturalHeight)) === 1920);
  await a.click('[data-cltab="letter"]'); await a.waitForTimeout(200);
  ok('my calling page keeps what moves me and the work that draws me', /What moves me/.test(await text(a)) && /The work that draws me/.test(await text(a)));
  await a.click('[data-clmile="m3"]'); await a.waitForTimeout(500); await lvl();
  ok('a milestone ticked off when it’s reached', await a.evaluate(() => !!S.me.calling.done.m3) && !!(await a.$('.clYear.done')));
  await a.click('[data-clgoal="1"]'); await a.waitForSelector('#gTitle');
  ok('a milestone is one tap from a life goal', await a.$eval('#gTitle', e => e.value) === 'Start the club with ten children');
  await a.click('[data-back]'); await a.waitForTimeout(300);
  await a.evaluate(() => { window.print = () => { window.__printed = document.getElementById('printArea').innerText; }; });
  await a.click('#clPrint'); await a.waitForTimeout(200);
  ok('the letter can be printed or saved as a PDF — just the words', await a.evaluate(() => /Dear friends and family/.test(window.__printed || '')));
  await a.click('#goCUpdate'); await a.waitForSelector('[data-cu="since"]');
  ok('an update for supporters: what’s next starts from my next milestone', /By the end of \d{4}: Start the club/.test(await a.$eval('[data-cu="next"]', e => e.value)));
  await a.click('[data-custart="since|0"]'); await a.type('[data-cu="since"]', 'started the club with eight children.');
  await a.fill('[data-cu="pray"]', 'For more volunteers');
  await a.click('#cuWrite'); await a.waitForSelector('#cuTx');
  const up = await a.$eval('#cuTx', e => e.value);
  ok('… written into a letter, with where I am on my plan', /^Dear friends and family,/.test(up) && up.includes('This month I started the club with eight children.') && /Where I am on my plan:\n○ \d{4}: Start the club/.test(up) && /✓ \d{4}: A second club/.test(up) && up.includes('Please pray: For more volunteers.'), up);
  await a.click('#cuSave'); await a.waitForSelector('.cuOpen'); await lvl();
  ok('… kept in my updates, and open to copy again', await a.evaluate(() => S.me.calling.updates.length === 1) && /This month I started the club/.test(await a.$eval('.cuOpen', e => e.innerText)));
  await a.click('#goSpheres'); await a.waitForSelector('[data-sphopen]');
  ok('the spheres of society: ten', (await a.$$('[data-sphopen]')).length === 10);
  await a.click('[data-sphopen="land"]'); await a.waitForTimeout(200);
  ok('… each with what God cares about and the work in it', /Modern farmer/.test(await text(a)) && /How to start/.test(await text(a)) && /Genesis 2:15/.test(await text(a)));
  await a.click('[data-back]'); await a.waitForTimeout(200);
  await a.click('nav.bottom button[data-tab="home"]'); await a.waitForTimeout(400);
  ok('Home leads with my calling', /My calling/.test(await text(a)) && /I’m called to teach and train children/.test(await text(a)));
}

/* ---------- 18. Khmer ---------- */
await a.click('#langBtn'); await a.waitForTimeout(300);
await a.click('nav.bottom button[data-tab="home"]');
ok('Khmer switches the screens', /ទម្លាប់ថ្ងៃនេះ/.test(await text(a)) && /ទំព័រដើម/.test(await a.$eval('nav.bottom', e => e.innerText)));
ok('five tabs fit on one line in Khmer', await a.$$eval('nav.bottom button', bs => bs.every(b => b.scrollWidth <= b.clientWidth + 1) && new Set(bs.map(b => Math.round(b.getBoundingClientRect().top))).size === 1));
await a.click('nav.bottom button[data-tab="grow"]'); await a.click('#goLibrary');
await a.waitForFunction(() => typeof GP_LIBRARY_KM !== 'undefined', null, { timeout: 15000 });
await a.waitForTimeout(400);
await a.click('[data-libbook="boundaries"]'); await a.waitForTimeout(500);
ok('in Khmer, the Library reads in Khmer — "For you" too', /សម្រាប់អ្នក/.test(await text(a)) && /[ក-៿]{20}/.test(await a.$eval('.libForUs', e => e.innerText)));

/* ---------- 19. the page fits a phone ---------- */
ok('nothing scrolls sideways', await a.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
ok('no page errors', errors.length === 0, errors.join(' | '));
await browser.close(); srv.close();
ok.done();
