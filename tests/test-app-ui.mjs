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
    try { if (!localStorage.getItem('gpa-lang')) localStorage.setItem('gpa-lang', 'en'); } catch (e) {}
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

/* ---------- 6. Khmer ---------- */
await a.click('#langBtn'); await a.waitForTimeout(300);
await a.click('nav.bottom button[data-tab="home"]');
ok('Khmer switches the screens', /ទម្លាប់ថ្ងៃនេះ/.test(await text(a)) && /ទំព័រដើម/.test(await a.$eval('nav.bottom', e => e.innerText)));

/* ---------- 7. the page fits a phone ---------- */
ok('nothing scrolls sideways', await a.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
ok('no page errors', errors.length === 0, errors.join(' | '));
await browser.close(); srv.close();
ok.done();
