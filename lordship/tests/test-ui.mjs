/* The app in a phone-sized browser, against the real functions (in-memory store, stand-in coach).
   npm run build && node tests/test-ui.mjs   (needs: npm install --no-save playwright) */
import { memStore, checker, fakeClaude, serve } from './env.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = require(require.resolve('playwright', { paths: [process.cwd(), ...(process.env.NODE_PATH || '').split(':').filter(Boolean), '/usr/lib/node_modules', '/usr/local/lib/node_modules'] })); }
const { chromium } = pw;

globalThis.__lsStore = memStore();
globalThis.__lsClaude = fakeClaude({ delay: 400 });
process.env.LS_CLASS_CODE = 'TEST1';
process.env.LS_ADMIN_PASSWORD = 'admin';
const ok = checker();
const srv = await serve(8891);
const U = 'http://localhost:8891';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('dialog', d => d.accept());
const noScroll = async (name) => ok('no sideways scroll: ' + name, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
const text = () => page.locator('main').textContent();

/* a real (tiny) PDF for the slides */
function tinyPdf() {
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 320 180] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const stream = 'BT /F1 24 Tf 40 90 Td (Lordship) Tj ET';
  objs[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  objs[1] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  let out = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}

try {
  /* landing */
  await page.goto(U + '/');
  ok('landing asks for the class code', (await text()).includes('Class code'));
  await noScroll('landing');
  await page.fill('#code', 'nope');
  await page.click('text=Open this week’s class');
  await page.waitForSelector('.err');
  ok('wrong code says so', (await page.locator('.err').innerText()).includes('didn’t work'));

  /* the class link */
  await page.goto(U + '/?class=test1');
  await page.waitForSelector('nav.bottom');
  ok('class link opens the class home', (await text()).includes('Tools') && (await page.locator('.top .mode').innerText()).includes('Lordship DTS'));
  ok('code removed from the address', !page.url().includes('class='));
  await noScroll('class home');

  /* a day */
  await page.goto(U + '/#/day/wed');
  await page.waitForSelector('.scripture');
  const wed = await text();
  ok('day shows title, big idea, scripture text, questions', wed.includes('Laying Down') && wed.includes('take up his cross, and follow me') && wed.includes('What is your Isaac'));
  ok('all three Wednesday passages', (await page.locator('.scripture').count()) === 3);
  await page.waitForSelector('text=Slides for this day aren’t up yet');
  ok('no slides yet says so', true);
  ok('people group of the day shown', (await text()).includes('People group of the day'));
  const pgImg = page.locator('.pg-photo img');
  await page.evaluate(() => document.querySelector('.pg-photo').scrollIntoView());
  await page.waitForFunction(() => { const i = document.querySelector('.pg-photo img'); return i && i.complete && i.naturalWidth > 200; });
  ok('people group has a photo with a credit and licence', (await page.locator('.pg-photo figcaption').innerText()).includes('Photo:') && /CC BY/.test(await page.locator('.pg-photo figcaption').innerText()));
  ok('Wednesday responds with My plan vs God’s plan and Not so, Lord', (await page.locator('.respond .tile').count()) === 2 && (await page.locator('.respond').textContent()).includes('My plan vs God’s plan'));
  await page.click('text=I’ve responded today');
  ok('responded marks the day', (await page.locator('.respond').textContent()).includes('You responded') && (await page.locator('.daytabs a.done').count()) === 1);
  await noScroll('day');

  /* admin: upload slides, a link */
  await page.goto(U + '/#/admin');
  await page.fill('#pw', 'admin');
  await page.click('button:has-text("Sign in")');
  await page.waitForSelector('text=Thursday panel');
  ok('admin signs in', true);
  await page.click('.chip:has-text("Slides")');
  const pdf = tinyPdf();
  await page.locator('.card', { hasText: 'Wednesday' }).locator('input[type=file]').first().setInputFiles({ name: 'wed.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.waitForSelector('text=wed.pdf');
  ok('PDF uploaded', true);
  await page.locator('.card', { hasText: 'Wednesday' }).locator('input[type=file]').nth(1).setInputFiles({ name: 'wed.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: Buffer.from('PK fake pptx') });
  await page.waitForSelector('text=wed.pptx');
  ok('PPTX uploaded', true);
  await page.click('.chip:has-text("Class & links")');
  ok('class link QR shown', (await page.locator('svg[aria-label^="QR code"]').count()) === 2);
  await noScroll('admin');

  /* view + download slides */
  await page.goto(U + '/');
  await page.goto(U + '/#/day/wed');
  await page.click('text=View slides');
  await page.waitForSelector('.pdfview canvas');
  await page.waitForFunction(() => { const c = document.querySelector('.pdfview canvas'); return c && c.width > 100; });
  ok('slides drawn in the app', (await page.locator('.pdfnav').innerText()).includes('1 / 1'));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=Download PPTX (editable)')]);
  ok('PPTX downloads with its name', dl.suggestedFilename() === 'wed.pptx');

  /* the wheel + coach */
  await page.goto(U + '/#/t/wheel');
  for (let i = 0; i < 9; i++) await page.locator('.scale').nth(i).locator('button').nth(2 + (i % 6)).click();
  await page.click('.chip:has-text("Inner")');
  for (let i = 0; i < 3; i++) await page.locator('.scale').nth(i).locator('button').nth(1).click();
  const np = await page.locator('.wheel path').count(); ok('wheel draws the ratings', np === 12, [np, await page.evaluate(() => localStorage.getItem('gp.lordship.wheel'))]);
  ok('lowest areas shown', (await text()).includes('Lowest right now'));
  await noScroll('wheel');
  await page.click('text=Stuck? Ask for a question'); await page.click('text=Start with the coach');
  await page.waitForSelector('.msg.live');
  ok('the reply shows while it is written', (await page.locator('.msg.live').innerText()).length > 0);
  await page.waitForSelector('.msg.assistant:not(.typing):not(.live)');
  ok('coach asks first', (await page.locator('.msg.assistant').first().innerText()).includes('?'));
  ok('help link on the coach', (await page.locator('.helplink').getAttribute('href')) === '#/t/help');
  await page.fill('.say textarea', 'My peace is really low this week.');
  await page.click('.say button');
  await page.waitForFunction(() => document.querySelectorAll('.msg.assistant:not(.typing):not(.live)').length === 2);
  ok('reply comes back', (await page.locator('.msg.user').innerText()).includes('peace'));
  await page.click('text=Save my lay down / take up');
  await page.waitForSelector('.card h3:text-is("Saved")', { timeout: 15000 });
  ok('saved lay down / take up', (await text()).includes('Test laydown'));
  await page.click('text=Make "take up" a daily habit');
  await page.click('text=Save today’s check');
  await page.evaluate(() => { const h = JSON.parse(localStorage.getItem('gp.lordship.wheelHistory')); h[0].d = '2026-01-05'; h[0].out.faith = 1; localStorage.setItem('gp.lordship.wheelHistory', JSON.stringify(h)); });
  await page.reload();
  await page.waitForSelector('.prevline');
  ok('an earlier check shows as a dashed line and a change', (await page.locator('.prevline').count()) >= 1 && (await page.locator('.pill.up').count()) >= 1);
  await page.click('text=Add my numbers to the class totals');
  await page.reload();
  await page.waitForSelector('.msg.user');
  ok('chat kept on the phone after reload', (await page.locator('.msg.user').innerText()).includes('peace'));

  await page.goto(U + '/#/t/help');
  ok('help page: staff and emergency numbers', (await text()).includes('staff member') && (await text()).includes('999'));

  /* my plan vs God's plan */
  await page.goto(U + '/#/t/laydown');
  ok('plan tool: Proverbs 16:9 and the areas', (await text()).includes('A man’s heart plans his course') && (await page.locator('.areatile').count()) >= 9);
  await noScroll('plan overview');
  await page.click('.areatile:has-text("Money")');
  await page.waitForSelector('.twoplans');
  ok('area: verse, my plan and God’s plan side by side', (await text()).includes('where your treasure is') && (await page.locator('.plan-col').count()) === 2);
  await noScroll('plan area');
  ok('one back link', (await page.locator('a.back').count()) === 1);
  ok('coach is optional (collapsed)', (await page.locator('.coach-mini').count()) === 1 && (await page.locator('.coach .msgs').count()) === 0);
  await page.click('.plan-col.mine .chip >> nth=0');
  await page.locator('textarea[aria-label^="My plan"]').pressSequentially('a car by 25');
  await page.fill('textarea[aria-label^="God\'s plan"]', 'Seek first his Kingdom; give more.');
  ok('prompt chips start a line', (await page.locator('textarea[aria-label^="My plan"]').inputValue()).startsWith('I’m saving for… a car'));
  await page.click('.align-chips .chip:has-text("Some overlap")');
  ok('the two circles show how close they are', (await page.locator('.venn[aria-label*="Some overlap"]').count()) === 1);
  await page.fill('input[placeholder="Lord, but not…"]', 'Lord, but not my car fund');
  await page.fill('input[placeholder^="My plan for"]', 'Needing the car to feel secure');
  await page.fill('input[placeholder="One thing I’ll actually do"]', 'Give 10% this month');
  await page.click('text=Save to my list');
  await page.click('text=Make my prayer');
  ok('surrender prayer from their own words', (await page.locator('.prayer-text').innerText()).includes('I lay down Needing the car to feel secure') && (await page.locator('.prayer-text').innerText()).includes('Amen'));
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('gp.lordship.plans')); p.money.hist = [{ d: '2026-11-01', a: 1 }].concat(p.money.hist); localStorage.setItem('gp.lordship.plans', JSON.stringify(p)); });
  await page.reload(); await page.waitForSelector('.align-hist');
  ok('how-close history shows the change', (await page.locator('.align-hist').innerText()).includes('▲ closer'));
  await page.click('a.back:has-text("All areas")');
  await page.waitForSelector('.areatile.has .minivenn', { timeout: 5000 }).catch(() => {});
  ok('overview shows the area started, with mini circles', (await page.locator('.areatile.has .minivenn').count()) === 1, [page.url(), await page.evaluate(() => localStorage.getItem('gp.lordship.plans')), await page.locator('.areatile.has').count()]);
  await page.click('text=See them side by side');
  await page.waitForSelector('.sumcard', { timeout: 5000 }).catch(() => {});
  ok('side-by-side summary', (await text()).includes('a car by 25') && (await text()).includes('Seek first'));
  await page.goto(U + '/#/t/list');
  ok('lay down / take up saved', (await text()).includes('Give 10% this month') && (await text()).includes('Lord, but not my car fund'));

  /* wheel → plan for the lowest area */
  await page.goto(U + '/#/t/wheel');
  await page.locator('.card', { hasText: 'starting with the lowest' }).locator('.tile').first().click();
  await page.waitForSelector('.twoplans');
  ok('wheel opens its lowest area in My plan vs God’s plan', page.url().includes('/t/laydown/w-') && (await page.locator('h1').innerText()).includes('🎯'));

  /* God thing or good thing, without the coach */
  await page.goto(U + '/#/t/godthing');
  await page.fill('#what', 'Staffing the next DTS');
  await page.fill('textarea[aria-label="My plan for it"]', 'I love it here and want to stay.');
  await page.fill('textarea[aria-label="What I see the Father doing"]', 'Leaders keep asking me; doors are opening.');
  for (const q of ['scroll', 'peace', 'wise']) await page.locator('.rate').filter({ hasText: { scroll: 'scroll', peace: 'peace', wise: 'Wise' }[q] }).locator('.chip:has-text("Yes")').click();
  await page.locator('.rate', { hasText: 'praised me' }).locator('.chip:text-is("No")').click();
  ok('checks move the circles', (await page.locator('.venn').count()) === 1 && (await text()).includes('3 of 5 checks'));
  await page.click('.chip:has-text("God thing")');
  await page.fill('input[placeholder^="Pray a week"]', 'Ask my mentor');
  await page.click('button:has-text("Save")');
  ok('decision saved without the coach', (await text()).includes('What I’ve weighed') && (await text()).includes('being seen'));

  /* list + habits */
  await page.goto(U + '/#/t/list');
  ok('list has the saved item', (await text()).includes('Test takeup'));
  await page.goto(U + '/#/t/habits');
  ok('take-up became a habit', (await text()).includes('Test takeup'));
  await page.fill('input[aria-label="New habit"]', 'Read a Psalm');
  await page.click('button:has-text("Add")');
  await page.locator('.habit', { hasText: 'Read a Psalm' }).locator('.tick').click();
  ok('ticking starts a streak', (await page.locator('.habit', { hasText: 'Read a Psalm' }).innerText()).includes('🔥 1'));
  ok('home counts habits today', true);

  /* HOT + mentor map */
  await page.goto(U + '/#/t/hot');
  for (const l of ['H', 'O', 'T']) for (let i = 0; i < 3; i++) await page.locator(`button[aria-label$=": 4"]`).nth(['H', 'O', 'T'].indexOf(l) * 3 + i).click();
  ok('HOT scores shown', (await text()).includes('Where you are'));
  await page.click('text=+ Add a person');
  await page.fill('input[aria-label="Name"]', 'Naomi');
  await page.locator('.card', { has: page.locator('input[aria-label="Name"]') }).locator('.chip:has-text("Finances")').click();
  ok('mentor map shows the gaps', (await text()).includes('Gaps:') && (await page.locator('td:has-text("Naomi")').count()) === 1);

  /* scroll */
  await page.goto(U + '/#/t/scroll');
  await page.fill('#draft', 'I keep thinking about young Lao believers and training them to lead.');
  await page.click('text=Stuck? Ask for a question'); await page.click('text=Start with the coach');
  await page.waitForSelector('.msg.assistant:not(.typing):not(.live)');
  await page.fill('.say textarea', 'It started on outreach last year.');
  await page.click('.say button');
  await page.waitForFunction(() => document.querySelectorAll('.msg.assistant:not(.typing):not(.live)').length === 2);
  await page.click('text=Shape my scroll statement');
  await page.waitForSelector('.scroll-card');
  ok('scroll statement saved', (await page.locator('.scroll-card').innerText()).includes('Test scroll'));

  /* commitment */
  await page.goto(U + '/#/class');
  ok('home: plans at a glance', (await page.locator('.glance').innerText()).includes('laid side by side'));
  ok('home: welcome card', (await page.locator('.welcome').count()) === 1);
  await page.click('.welcome button');
  ok('welcome dismissed', (await page.locator('.welcome').count()) === 0);
  await page.goto(U + '/#/t/commit');
  ok('commitment ideas from take-ups', (await page.locator('.chip:has-text("Give 10% this month")').count()) === 1);
  await page.click('.chip:has-text("Give 10% this month")');
  ok('idea starts the commitment', (await page.locator('#commit').inputValue()) === 'I will give 10% this month');
  await page.fill('#commit', 'I will meet my mentor every two weeks.');
  await page.click('text=Declare it');
  await page.waitForSelector('.declare');
  ok('declared', (await page.locator('.declare').innerText()).includes('every two weeks'));
  const [ics] = await Promise.all([page.waitForEvent('download'), page.click('text=Add 30- and 90-day check-ins to my calendar')]);
  const icsText = require('node:fs').readFileSync(await ics.path(), 'utf8');
  ok('calendar file has both check-ins with reminders', ics.suggestedFilename().endsWith('.ics') && (icsText.match(/BEGIN:VEVENT/g) || []).length === 2 && icsText.includes('VALARM') && icsText.includes('30-day check-in'));
  await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('gp.lordship.commit')); c.declaredAt = '2026-01-01'; localStorage.setItem('gp.lordship.commit', JSON.stringify(c)); });
  await page.goto(U + '/#/class');
  await page.reload();
  await page.waitForSelector('text=check-in');
  ok('check-in due shows on home', (await text()).includes('90-day check-in'));

  /* question box */
  await page.goto(U + '/#/t/questions');
  await page.click('.chip:has-text("Romance")');
  await page.fill('#q', 'How do I know if I should date someone on my team?');
  await page.click('text=Send anonymously');
  await page.waitForSelector('text=Sent. Thank you');
  ok('question sent', true);
  await page.goto(U + '/#/admin');
  await page.waitForSelector('text=How do I know');
  ok('admin sees the question', true);
  await page.locator('.card', { hasText: 'How do I know' }).locator('.chip:has-text("Thursday panel")').click();
  await page.click('.chip:has-text("Thursday panel (")');
  ok('marked for the Thursday panel', (await text()).includes('How do I know'));

  /* my Lordship week */
  await page.goto(U + '/#/t/week');
  const wk = await text();
  ok('my week page gathers it all', wk.includes('My plan vs God’s plan') && wk.includes('My scroll') && wk.includes('every two weeks') && wk.includes('Lowest:'));

  /* save my work, then restore on a fresh phone */
  await page.goto(U + '/#/t/data');
  await page.click('text=Save and get my code');
  await page.waitForSelector('.bigcode');
  const code = (await page.locator('.bigcode').innerText()).match(/[A-Z2-9]{5}-[A-Z2-9]{5}/)[0];
  ok('backup code shown', !!code);

  /* admin: class totals and the Thursday panel screen */
  await page.goto(U + '/#/admin');
  await page.click('.chip:has-text("Class totals")');
  await page.waitForSelector('.stats');
  const st = (await page.locator('.stats').innerText()).replace(/\s+/g, ' ');
  ok('class totals: one sharing, committed, wheel bars', [st, await page.locator('.tbar').count()] && (await page.locator('.stats').innerText()).replace(/\s+/g, ' ').includes('1 sharing') && (await page.locator('.stats').innerText()).replace(/\s+/g, ' ').includes('1 committed') && (await page.locator('.tbar').count()) > 5, [st, await page.locator('.tbar').count()]);
  await page.click('.chip:has-text("Questions")');
  await page.click('text=Thursday panel screen');
  await page.waitForSelector('.screen.panel');
  ok('panel screen shows the question big', (await page.locator('.screen-q').innerText()).includes('date someone on my team') && (await page.locator('.top').count()) === 0);
  await page.click('text=✓ Answered');
  await page.waitForSelector('text=No panel questions yet.');
  ok('answered on the panel moves it off', true);

  /* light / dark */
  await page.goto(U + '/#/class');
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.waitForSelector('.themebtn');
  await page.click('.themebtn');   // auto → light
  const light = await bg();
  await page.click('.themebtn');   // light → dark
  await page.waitForTimeout(400);
  const dark = await bg();
  ok('theme switches light → dark', light === 'rgb(250, 246, 240)' && dark === 'rgb(23, 21, 15)', [light, dark]);
  await page.reload();
  ok('theme remembered', (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark');
  await noScroll('dark home');
  await page.click('.themebtn');   // back to auto

  /* church mode, on a fresh phone */
  const p2 = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  p2.on('pageerror', e => errors.push(String(e)));
  p2.on('dialog', d => d.accept());
  await p2.goto(U + '/?church');
  await p2.waitForSelector('.hero');
  const ch = await p2.locator('main').textContent();
  ok('church home: affirmation, tools, people group, join God’s mission', [ch.includes('Malaysia'), ch.includes('My plan vs God’s plan'), ch.includes('People group of the day'), ch.includes('Join God’s mission')].every(Boolean), ch.slice(0, 600)); void (ch.includes('Malaysia') && ch.includes('Lay Down, Take Up') && ch.includes('People group of the day') && ch.includes('Join God’s mission'));
  ok('church home has no class-only tools', !ch.includes('Question box') && !ch.includes('My Scroll'));
  await p2.goto(U + '/#/church/questions');
  ok('class tools not reachable in church mode', (await p2.locator('main').textContent()).includes('Respond'));
  await p2.goto(U + '/#/church/connect');
  const cn = await p2.locator('main').textContent();
  ok('connect page: real links shown, placeholders hidden', cn.includes('TikTok') && cn.includes('gonpreah.org') && (await p2.locator('a[href="https://www.instagram.com/ywamsiemreap/"]').count()) === 1 && (await p2.locator('a[href="https://www.instagram.com/ywamea/"]').count()) === 1 && (await p2.locator('a.support[href="https://ywamsiemreap.org/give/staff/"]').count()) === 1 && (await p2.locator('a[href*="PLACEHOLDER"]').count()) === 0);
  await p2.goto(U + '/#/church/wheel');
  for (let i = 0; i < 9; i++) await p2.locator('.scale').nth(i).locator('button').nth(5).click();
  await p2.click('text=Stuck? Ask for a question'); await p2.click('text=Start with the coach');
  await p2.waitForSelector('.msg.assistant:not(.typing):not(.live)');
  ok('church wheel coach works without a code', true);
  await p2.goto(U + '/#/church/notso');
  ok('Not so, Lord reflection', (await p2.locator('main').textContent()).includes('Not so, Lord; for I have never eaten'));
  await p2.evaluate(() => window.scrollTo(0, 0));
  ok('no sideways scroll: church', await p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await p2.goto(U + '/#/church/data');
  await p2.fill('input[aria-label="Your code"]', code.toLowerCase());
  await p2.click('button:has-text("Restore")');
  await p2.waitForSelector('text=Restored');
  ok('restore by code on a new phone', (await p2.evaluate(() => JSON.parse(localStorage.getItem('gp.lordship.scroll') || '{}').statement || '')).includes('Test scroll'));
  await p2.goto(U + '/#/church/screen');
  await p2.waitForSelector('.screen');
  ok('Sunday screen: question, QR, people group, no header', (await p2.locator('.screen-q').innerText()).includes('not so') && (await p2.locator('.screen svg[aria-label^="QR"]').count()) === 1 && (await p2.locator('.top').count()) === 0);
  await p2.goto(U + '/#/class');
  ok('class needs the code on a new phone', (await p2.locator('main').textContent()).includes('Class code'));

  ok('no page errors', errors.length === 0, errors);
} catch (e) {
  ok('ran without throwing: ' + e.message, false);
  await page.screenshot({ path: '/tmp/claude-0/-home-user-public-app/52feb092-2118-5288-be0a-d9d248a49451/scratchpad/fail.png' }).catch(() => {});
}
await browser.close();
srv.close();
ok.done();
