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
  await j.waitForSelector('#jrOn');
  ok('finishing a stop saves it, with XP', /Where you come from: done!/.test(await text(j)) && await j.evaluate(() => S.me.story.done.join() === 'home' && S.me.story.a.best === 'Leading worship at camp' && S.me.level.xp === 20));
  await j.click('#jrLater2'); await j.waitForTimeout(300);
  await j.click('nav.bottom button[data-tab="home"]'); await j.waitForTimeout(300);
  ok('Home offers to continue the journey', /Continue your Life Journey · 1 of 7 stops/.test(await text(j)));
  await j.click('#goJourney'); await j.waitForSelector('#jrGo');
  ok('… which picks up at the next stop', /Who you are/.test(await text(j)));
  const answers = { gifts: ['music', 'teach'], who: ['youth'], heart: ['hope'], fear: ['fail'], truth: ['with'], walk: ['team'], known: ['brave', 'faithful'], word: ['focus'] };
  for (let guard = 0; guard < 60; guard++) {
    if (await j.$('#levelOk')) await j.click('#levelOk');
    if (await j.$('#jrGo')) { await j.click('#jrGo'); continue; }
    if (await j.$('#jrOn')) { await j.click('#jrOn'); continue; }
    if (await j.$('.jrBuild')) { await j.waitForSelector('#jrVision'); break; }
    if (await j.$('#jrVision')) break;
    const k = await j.evaluate(() => JR_STOPS[S.jr.s].qs[S.jr.q].k);
    if (k === 'wheel') { for (const a of ['faith', 'family', 'study', 'health', 'money', 'serve']) await j.click(`[data-jrw="${a}|4"]`); }
    else if (k === 'areas') await j.fill('#jrA_study', 'I teach English at a school');
    else if (k === 'year') await j.fill('#jrText', 'I pass grade 12');
    else if (answers[k]) for (const id of answers[k]) await j.click(`[data-jrc="${id}"]`);
    await j.click('#jrNext'); await j.waitForTimeout(100);
  }
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
