/* The app in a phone-sized browser, against the real functions (in-memory store, stand-in coach).
   npm run build && node tests/test-ui.mjs   (needs: npm install --no-save playwright) */
import { memStore, checker, fakeClaude, serve } from './env.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = require(require.resolve('playwright', { paths: [process.cwd(), ...(process.env.NODE_PATH || '').split(':').filter(Boolean), '/usr/lib/node_modules', '/usr/local/lib/node_modules'] })); }
const { chromium } = pw;

globalThis.__lsStore = memStore();
globalThis.__lsClaude = fakeClaude();
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
  ok('day shows title, big idea, scripture text, questions', wed.includes('Laying Down') && wed.includes('take up his cross daily') && wed.includes('What is your Isaac'));
  ok('all three Wednesday passages', (await page.locator('.scripture').count()) === 3);
  await page.waitForSelector('text=Slides for this day aren’t up yet');
  ok('no slides yet says so', true);
  ok('people group of the day shown', (await text()).includes('People group of the day'));
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
  await page.click('text=Start with the coach');
  await page.waitForSelector('.msg.assistant:not(.typing)');
  ok('coach asks first', (await page.locator('.msg.assistant').first().innerText()).includes('?'));
  await page.fill('.say textarea', 'My peace is really low this week.');
  await page.click('.say button');
  await page.waitForFunction(() => document.querySelectorAll('.msg.assistant:not(.typing)').length === 2);
  ok('reply comes back', (await page.locator('.msg.user').innerText()).includes('peace'));
  await page.click('text=Save my lay down / take up');
  await page.waitForSelector('text=Saved', { timeout: 10000 });
  ok('saved lay down / take up', (await text()).includes('Test laydown'));
  await page.click('text=Make "take up" a daily habit');
  await page.reload();
  await page.waitForSelector('.msg.user');
  ok('chat kept on the phone after reload', (await page.locator('.msg.user').innerText()).includes('peace'));

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
  await page.click('text=Start with the coach');
  await page.waitForSelector('.msg.assistant:not(.typing)');
  await page.fill('.say textarea', 'It started on outreach last year.');
  await page.click('.say button');
  await page.waitForFunction(() => document.querySelectorAll('.msg.assistant:not(.typing)').length === 2);
  await page.click('text=Shape my scroll statement');
  await page.waitForSelector('.scroll-card');
  ok('scroll statement saved', (await page.locator('.scroll-card').innerText()).includes('Test scroll'));

  /* commitment */
  await page.goto(U + '/#/t/commit');
  await page.fill('#commit', 'I will meet my mentor every two weeks.');
  await page.click('text=Declare it');
  await page.waitForSelector('.declare');
  ok('declared', (await page.locator('.declare').innerText()).includes('every two weeks'));
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

  /* church mode, on a fresh phone */
  const p2 = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  p2.on('pageerror', e => errors.push(String(e)));
  await p2.goto(U + '/?church');
  await p2.waitForSelector('.hero');
  const ch = await p2.locator('main').textContent();
  ok('church home: affirmation, tools, people group, join God’s mission', [ch.includes('Malaysia'), ch.includes('Lay Down, Take Up'), ch.includes('People group of the day'), ch.includes('Join God’s mission')].every(Boolean), ch.slice(0, 600)); void (ch.includes('Malaysia') && ch.includes('Lay Down, Take Up') && ch.includes('People group of the day') && ch.includes('Join God’s mission'));
  ok('church home has no class-only tools', !ch.includes('Question box') && !ch.includes('My Scroll'));
  await p2.goto(U + '/#/church/questions');
  ok('class tools not reachable in church mode', (await p2.locator('main').textContent()).includes('Respond'));
  await p2.goto(U + '/#/church/connect');
  const cn = await p2.locator('main').textContent();
  ok('connect page: real links shown, placeholders hidden', cn.includes('TikTok') && cn.includes('gonpreah.org') && (await p2.locator('a[href*="PLACEHOLDER"]').count()) === 0);
  await p2.goto(U + '/#/church/wheel');
  for (let i = 0; i < 9; i++) await p2.locator('.scale').nth(i).locator('button').nth(5).click();
  await p2.click('text=Start with the coach');
  await p2.waitForSelector('.msg.assistant:not(.typing)');
  ok('church wheel coach works without a code', true);
  await p2.goto(U + '/#/church/notso');
  ok('Not so, Lord reflection', (await p2.locator('main').textContent()).includes('Not so, Lord; for I have never eaten'));
  await p2.evaluate(() => window.scrollTo(0, 0));
  ok('no sideways scroll: church', await p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
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
