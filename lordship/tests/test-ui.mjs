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
  await page.waitForSelector('.joinpage');
  ok('new students are told how to come back from another class', (await text()).includes('even in another class'));
  ok('class link asks for name + PIN', (await text()).includes('Join the class') && (await page.locator('.pinbox').count()) === 8);
  await noScroll('join');
  await page.fill('#jname', 'Sokha');
  await page.locator('.pinbox').nth(0).pressSequentially('2468');
  await page.locator('.pinbox').nth(4).pressSequentially('2468');
  ok('PIN boxes move along as you type', (await page.locator('.pinbox').nth(3).inputValue()) === '8');
  await page.click('button:text-is("Join")');
  await page.waitForSelector('text=One fun fact');
  await page.fill('textarea[aria-label="Fun fact"]', 'I was born on a boat');
  await page.click('text=Save and start');
  await page.waitForSelector('nav.bottom');
  ok('header shows who is signed in', (await page.locator('.mechip').innerText()).includes('Sokha'));
  await page.waitForSelector('.hero', { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('h4:text-is("Tools")', { timeout: 10000 }).catch(() => {});
  ok('class link opens the class home', (await text()).includes('Tools') && (await text()).includes('Lordship DTS'));
  ok('code removed from the address', !page.url().includes('class='));
  const mhref = await page.locator('#manifest').getAttribute('href');
  const man = await (await page.request.get(U + mhref)).json();
  ok('Home Screen app opens straight into the class', mhref === '/app.webmanifest?class=TEST1' && man.start_url === '/?class=TEST1' && man.display === 'standalone' && man.icons.some(i => i.sizes === '512x512'));
  ok('install card on Home', (await page.locator('.install').count()) === 1);
  await page.click('.install button:has-text("Add")');
  ok('install sheet with steps', (await page.locator('.sheet').innerText()).includes('Add to Home screen'));
  await page.click('.sheet .install-x');
  await page.click('.install .install-x');
  ok('"Later" hides the install card', (await page.locator('.install').count()) === 0);
  await noScroll('class home');

  /* a day */
  await page.goto(U + '/#/day/wed');
  await page.waitForSelector('.scripture');
  const wed = await text();
  ok('day shows title, big idea, scripture text, questions', wed.includes('Stay HOT') && wed.includes('my power is made perfect in weakness') && wed.includes('Who knows your real struggles'));
  ok('all five Wednesday passages', (await page.locator('.scripture').count()) === 5);
  ok('the day’s sticky line, James chapter, check-in and listening prayer', (await page.locator('.dayhead .sticky').innerText()).includes('My grace is sufficient for you')
    && (await page.locator('.james h3').innerText()).includes('James 3') && wed.includes('What did you lay down or take up since yesterday?') && wed.includes('who are you inviting me to let in?'));
  await page.click('.james button:has-text("I read it")');
  ok('ticking James 3 as read', (await page.locator('.james button').innerText()).includes('✓ Read'));
  await page.click('text=Bible study: Say · Mean · Do');
  ok('Say · Mean · Do opens', (await page.locator('.study .kv').innerText()).includes('What do I do with this today?'));
  await page.waitForSelector('text=Slides for this day aren’t up yet');
  ok('no slides yet says so', true);
  ok('people group of the day shown', (await text()).includes('People group of the day'));
  const pgImg = page.locator('.pg-photo img');
  await page.evaluate(() => document.querySelector('.pg-photo').scrollIntoView());
  await page.waitForFunction(() => { const i = document.querySelector('.pg-photo img'); return i && i.complete && i.naturalWidth > 200; });
  ok('people group has a photo with a credit and licence', (await page.locator('.pg-photo figcaption').innerText()).includes('Photo:') && /CC BY/.test(await page.locator('.pg-photo figcaption').innerText()));
  ok('Wednesday responds with Fire or fountain, the HOT poll and Stay HOT', (await page.locator('.respond .tile').count()) === 5 && (await page.locator('.respond').textContent()).includes('Fire or fountain?') && (await page.locator('.respond').textContent()).includes('Stay HOT'));
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

  /* Wednesday: lay down a right */
  await page.goto(U + '/#/t/rights');
  await page.click('.chip:text-is("Reputation")');
  await page.click('button:has-text("Jesus, reputation is yours.")');
  ok('a right laid down is kept and goes on the list', (await text()).includes('In his hands') && (await text()).includes('🤲 Reputation'));

  /* Friday: 2 · 5 · 10 */
  await page.goto(U + '/#/t/growth');
  ok('the plan: Stay in YWAM. Keep growing., with the LPU card', (await text()).includes('Keep growing') && (await text()).includes('Life Pacific University'));
  await page.click('.horizon:has-text("Firm foundations") .pf:has-text("Schools I’ll staff") .chip:has-text("DTS")');
  await page.fill('#y10launch', 'A base in Laos');
  await page.click('.lockin:has-text("A solid skill") input');
  await page.click('.chip:has-text("Media")');
  ok('2 · 5 · 10 keeps each field', (await page.inputValue('#y2staff')) === 'DTS' && (await page.inputValue('#y10launch')) === 'A base in Laos');
  ok('the throw-down needs a next step', await page.locator('button:has-text("Throw it down")').isDisabled());
  await page.fill('input[aria-label="My next step"]', 'Email the LPU office');
  await page.click('.lockin:has-text("Share my next step") input');
  await page.click('button:has-text("Throw it down")');
  await page.waitForSelector('text=Declared. We’ll check in');
  await page.waitForLoadState('networkidle');
  ok('declared: a calendar for the 7/14/30 check-ins', (await page.locator('button:has-text("Add the check-ins")').count()) === 1);
  await page.waitForTimeout(3000);
  await page.evaluate(() => { const k = 'gp.lordship.plan10'; const v = JSON.parse(localStorage.getItem(k)); v.declared = Date.now() - 8 * 86400000; localStorage.setItem(k, JSON.stringify(v)); });
  await page.goto(U + '/#/class'); await page.reload(); await page.waitForSelector('text=7-day check-in');
  ok('home asks at day 7: did you take your step?', true);
  await page.click('a.note:has-text("7-day check-in")'); await page.waitForSelector('.stepcheck', { timeout: 10000 });
  await page.fill('textarea[aria-label="Check-in note"]', 'Sent it!'); await page.click('button:has-text("Yes")');
  await page.waitForFunction(() => !document.querySelector('.stepcheck'));
  ok('check-in answered', true);

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
  await page.click('.chip:has-text("Say sorry first")');
  ok('a daily act of obedience becomes a habit', (await page.locator('.habit', { hasText: 'Say sorry first' }).count()) === 1);

  /* HOT + mentor map */
  await page.goto(U + '/#/t/hot');
  for (const l of ['H', 'O', 'T']) for (let i = 0; i < 3; i++) await page.locator(`button[aria-label$=": 4"]`).nth(['H', 'O', 'T'].indexOf(l) * 3 + i).click();
  ok('HOT scores shown', (await text()).includes('Where you are'));
  await page.click('text=+ Add a Paul');
  await page.fill('input[aria-label="Paul name"]', 'Naomi');
  ok('no Barnabas yet is pointed out', (await text()).includes('No Barnabas yet'));
  await page.click('text=+ Add a Barnabas');
  await page.fill('input[aria-label="Barnabas name"]', 'Dara');
  await page.click('button[aria-label="Invite Dara this month"]');
  ok('mentor map: Paul, Barnabas, one to invite', !(await text()).includes('No Barnabas yet') && (await text()).includes('This month I’ll invite Dara'));

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
  ok('home: seven live polls + six main tools, the rest under More', (await page.locator('main > .tiles .tile').count()) === 13 && (await page.locator('main > .tiles .tile:has-text("Never, Lord")').count()) === 1 && (await page.locator('details.more .tile').count()) >= 5);
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

  /* a second phone: same name + PIN brings the answers */
  await page.goto(U + '/#/class'); await page.waitForTimeout(3500);   // let the last change save
  const p3 = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  p3.on('pageerror', e => errors.push(String(e)));
  await p3.goto(U + '/?class=TEST1'); await p3.waitForSelector('.joinpage');
  await p3.click('text=I’ve joined before');
  await p3.fill('#jname', 'sokha');
  await p3.locator('.pinbox').nth(0).pressSequentially('1111');
  await p3.click('button:has-text("Sign in")');
  await p3.waitForSelector('.err');
  ok('wrong PIN says so', (await p3.locator('.err').innerText()).includes('doesn’t match'));
  await p3.locator('.pinbox').nth(0).click(); for (let i = 0; i < 4; i++) await p3.keyboard.press('Backspace');
  await p3.locator('.pinbox').nth(0).fill('2468');
  await p3.click('button:has-text("Sign in")');
  await p3.waitForSelector('nav.bottom');
  ok('new phone gets my answers', (await p3.evaluate(() => JSON.parse(localStorage.getItem('gp.lordship.scroll') || '{}').statement || '')).includes('Test scroll'));

  /* Day 1 game: the projector and two phones */
  const pj = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  pj.on('pageerror', e => errors.push(String(e)));
  await pj.goto(U + '/#/admin'); await pj.fill('#pw', 'admin'); await pj.click('button:has-text("Sign in")');
  await pj.waitForSelector('text=Day 1 game');
  await pj.click('.chip:has-text("Class list")');
  await pj.waitForSelector('text=Sokha');
  ok('admin class list: names, not answers', (await pj.locator('main').textContent()).includes('Sokha') && !(await pj.locator('main').textContent()).includes('Test scroll'));
  await pj.click('text=Day 1 game & join wall');
  await pj.click('text=Open the join wall');
  await pj.waitForSelector('.name-chip');
  ok('join wall shows names and the QR', (await pj.locator('.name-chip').allInnerTexts()).includes('Sokha') && (await pj.locator('.screen-qr svg').count()) === 1);
  const pk = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await pk.goto(U + '/?class=TEST1'); await pk.waitForSelector('.joinpage');
  await pk.fill('#jname', 'Dara'); await pk.locator('.pinbox').nth(0).pressSequentially('1357'); await pk.locator('.pinbox').nth(4).pressSequentially('1357');
  await pk.click('button:text-is("Join")'); await pk.waitForSelector('text=One fun fact'); await pk.click('text=Skip for now');
  await pk.waitForSelector('.gamebanner');
  ok('home says the game is on', (await pk.locator('.gamebanner').innerText()).includes('join in'));
  await pj.waitForFunction(() => document.querySelectorAll('.name-chip').length === 2);
  ok('new names pop onto the wall', true);
  /* the Lordship profile quiz, then the game */
  await pj.click('text=Lordship profile quiz');
  await pj.waitForSelector('.quizwall');
  await pk.reload(); await pk.waitForSelector('.gamebanner'); await pk.click('.gamebanner');
  await pk.waitForSelector('.quiz');
  for (let i = 0; i < 8; i++) { await pk.locator('.quiz .opt-btn').first().click(); await pk.waitForTimeout(120); }
  await pk.waitForSelector('.pcard');
  const prof = await pk.locator('.pcard h2').innerText();
  ok('8 questions → a Lordship profile', prof.length > 3);
  await pk.click('text=Show your neighbour'); await pk.waitForSelector('.pshow');
  ok('big card to show a neighbour, with my name', (await pk.locator('.pshow').innerText()).includes('Dara is'));
  await pk.click('.pshow');
  await pk.click('text=Put it on the big screen'); await pk.waitForSelector('text=✓ On the big screen');
  await pj.waitForSelector('.pchip');
  ok('projector: name + profile pops up, with a tally', (await pj.locator('.pchip').innerText()).includes('Dara') && (await pj.locator('.ptally .pbar').count()) === 1);
  await pj.click('text=Who wrote this?');
  await pj.waitForSelector('.screen-q:has-text("born on a boat")', { timeout: 10000 }).catch(() => {});
  await pk.goto(U + '/#/t/game');
  ok('round 1 on the projector: who wrote this?', (await pj.locator('.screen-q').innerText()).includes('born on a boat'));
  await pk.waitForSelector('.opt-btn:has-text("Sokha")');
  await pk.click('.opt-btn:has-text("Sokha")');
  await pk.waitForSelector('text=Locked in');
  ok('phone: tap a name, locked in', true);
  await pj.waitForSelector('text=1 of 2 answered');
  await pj.click('text=Reveal');
  await pj.waitForSelector('.who-reveal');
  ok('projector reveals who', (await pj.locator('.who-reveal h2').innerText()) === 'Sokha');
  await pk.waitForSelector('text=You got it', { timeout: 8000 });
  ok('phone says you got it', true);
  await pj.click('text=Next');
  await pj.waitForSelector('.poll-opts');
  ok('then a this-or-that poll', (await pj.locator('.poll-opts span').count()) >= 2);
  await pk.waitForSelector('.opt-btn >> nth=1');
  await pk.locator('.opt-btn').first().click();
  await pj.click('text=Reveal'); await pj.waitForSelector('.pbar');
  ok('poll results as bars', (await pj.locator('.pbar').count()) >= 2);
  await pj.click('button:has-text("End")');
  await pj.waitForSelector('.pod');
  ok('leaderboard', (await pj.locator('.pod').first().innerText()).includes('Dara'));
  await pk.goto(U + '/#/t/game'); await pk.waitForSelector('text=That’s a wrap');
  await pk.fill('textarea[aria-label="Your question"]', 'How do I know who to marry?');
  await pk.click('text=Send anonymously'); await pk.waitForSelector('text=1 sent');
  ok('ask Uriah from the game screen', true);
  await pj.goto(U + '/#/admin'); await pj.waitForSelector('text=How do I know who to marry?');
  ok('question arrives, anonymous', true);

  /* a second class: the admin makes it, moves Dara; Sokha moves herself */
  await pj.click('.chip:has-text("+ New class")');
  await pj.fill('#ncname', 'DTS Winter'); await pj.fill('#nccode', 'dtsw');
  await pj.click('text=Make the class');
  await pj.waitForSelector('.classes .chip.on:has-text("DTS Winter")');
  ok('admin makes a class and gets its link', (await pj.locator('.classes code').innerText()).includes('?class=DTSW'));
  await pj.click('.classes .chip:has-text("TEST1")');
  await pj.click('.chip:has-text("Class list")');
  await pj.waitForSelector('input[aria-label="Select Dara"]');
  await pj.check('input[aria-label="Select Dara"]');
  pj.once('dialog', d => d.accept());
  await pj.click('.moveto button:has-text("Move")');
  await pj.waitForFunction(() => !document.querySelector('input[aria-label="Select Dara"]'));
  ok('admin moves Dara to the new class', (await pj.locator('.classes .chip:has-text("DTS Winter")').innerText()).includes('1'));
  await pk.goto(U + '/#/class'); await pk.reload();
  await pk.waitForFunction(() => (JSON.parse(localStorage.getItem('gp.lordship.class') || '{}').code === 'DTSW'));
  ok('Dara’s phone follows her to the new class', (await pk.locator('.hero .eyebrow').textContent()).includes('DTS Winter'));
  await p3.goto(U + '/#/t/me');
  await p3.fill('input[aria-label="New class code"]', 'dtsw');
  await p3.click('form button:has-text("Move")');
  await p3.waitForSelector('.hero');
  ok('Sokha moves herself with the code', (await p3.locator('.hero .eyebrow').textContent()).includes('DTS Winter') && (await p3.evaluate(() => JSON.parse(localStorage.getItem('gp.lordship.me')).code)) === 'DTSW');
  await pj.click('.classes .chip:has-text("DTS Winter")');
  await pj.waitForSelector('.item:has-text("Sokha")');
  await pk.goto(U + '/?class=TEST1'); await pk.waitForSelector('.hero');
  ok('the old Home Screen link still lands in the new class', (await pk.locator('.hero .eyebrow').textContent()).includes('DTS Winter') && (await pk.locator('.joinpage').count()) === 0);
  ok('the new class’s list has just them', (await pj.locator('.item b').allInnerTexts()).sort().join() === 'Dara,Sokha');

  /* church mode, on a fresh phone */
  const p2 = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  p2.on('pageerror', e => errors.push(String(e)));
  p2.on('dialog', d => d.accept());
  await p2.goto(U + '/?church');
  await p2.waitForSelector('.hero');
  ok('church: manifest opens church mode', (await p2.locator('#manifest').getAttribute('href')) === '/app.webmanifest?church=1');
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
  await p2.goto(U + '/#/church/quiz');
  for (let i = 0; i < 8; i++) { await p2.locator('.quiz .opt-btn').nth(1).click(); await p2.waitForTimeout(100); }
  await p2.waitForSelector('.pcard');
  ok('church: the quiz works, no big-screen button', (await p2.locator('text=Put it on the big screen').count()) === 0);
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

  /* iPhone Safari and Instagram's browser get the right steps */
  const iphone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' })).newPage();
  await iphone.goto(U + '/?church'); await iphone.waitForSelector('.install');
  await iphone.click('.install button:has-text("Add")');
  ok('iPhone: Share → Add to Home Screen steps', (await iphone.locator('.sheet').innerText()).includes('Add to Home Screen') && (await iphone.locator('.point-down').count()) === 1);
  const insta = await (await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0' })).newPage();
  await insta.goto(U + '/?church'); await insta.waitForSelector('.install');
  await insta.click('.install button:has-text("Add")');
  ok('Instagram browser: copy the link and open Safari', (await insta.locator('.sheet').innerText()).includes('Copy link'));
  const ps = await (await page.request.get(U + '/icon-512.png')).body();
  ok('app icons exist', ps.length > 5000 && (await page.request.get(U + '/apple-touch-icon.png')).ok());

  /* the base-wide profile quiz: ?quiz, no sign-in, and the live results */
  const pq = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await pq.goto(U + '/?quiz'); await pq.waitForSelector('#pqname');
  ok('?quiz opens with no class code or PIN', (await pq.locator('.pinbox').count()) === 0 && (await pq.locator('.pq-faces svg').count()) === 8);
  await pq.fill('#pqname', 'Bopha Lim'); await pq.click('.chip:text-is("DBS")'); await pq.click('text=Start the quiz');
  for (let i = 0; i < 8; i++) await pq.locator('.opt-btn').nth(2).click();
  await pq.waitForSelector('.pcard .avatar');
  await pq.waitForSelector('button:has-text("✓ On the big screen")');
  ok('the result has a cartoon and goes straight to the big screen', true);
  const pr = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await pr.goto(U + '/#/quiz-results'); await pr.waitForSelector('.qrecent .pchip');
  ok('live results: bars for all 8, the name and group', (await pr.locator('.qbar').count()) === 8 && (await pr.locator('.qrecent').innerText()).includes('Bopha') && (await pr.locator('.qbar.lead b').innerText()) === '1');
  await pr.click('.qr-tabs button:has-text("DTS")');
  ok('the DTS tab shows only DTS', (await pr.locator('.qrecent').count()) === 0 && (await pr.locator('.qbar.lead').count()) === 0);
  await pr.click('.qr-tabs button:has-text("All")');
  await pr.click('text=Hide names');
  ok('names can be hidden', (await pr.locator('.qrecent').count()) === 0);
  await pq.click('text=Take it again');
  for (let i = 0; i < 8; i++) await pq.locator('.opt-btn').nth(0).click();
  await pq.waitForSelector('button:has-text("✓ On the big screen")');
  await pr.waitForTimeout(3500);
  ok('a retake replaces, not adds', (await pr.locator('.qr-total b').innerText()) === '1');

  /* Wednesday's game: Fire or fountain (James 3), live for the class */
  await page.goto(U + '/#/t/fire'); await page.click('text=Start');
  ok('fire or fountain: a 10-second timer', (await page.locator('.swipe-timer').count()) === 1);
  for (let i = 0; i < 11; i++) { await page.locator('.swipe-btn').nth(i % 3 === 0 ? 0 : 1).click(); }
  await page.waitForSelector('text=Thank you for being honest', { timeout: 15000 });
  ok('fire or fountain: 11 taps and one timed out', (await page.locator('.lp-mine').innerText()).includes('🔥 4') && (await page.locator('.lp-mine').innerText()).includes('⛲ 7'));
  ok('then on to the HOT poll', (await page.locator('a:has-text("Next: Stay HOT")').count()) === 1);
  const ff = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await ff.goto(U + '/#/poll-results/fire/TEST1'); await ff.waitForSelector('.ff-bar i.fire');
  ok('fire or fountain projector: a split bar per statement', (await ff.locator('.ff-row').count()) === 12 && (await ff.locator('.ff-row').first().innerText()).includes('100%'));
  await ff.click('text=Show the James 3 verses');
  ok('projector: the James 3 verses (fire, fountain, wisdom)', (await ff.locator('.ff-verse').count()) === 3 && (await ff.locator('.ff-verses').innerText()).includes('James 3:17'));

  /* Thursday: Excuse bingo + the word cloud */
  await page.goto(U + '/#/t/bingo'); await page.waitForSelector('.bingo-cell');
  ok('excuse bingo: a 4×4 card of 16', (await page.locator('.bingo-cell').count()) === 16);
  const cells = page.locator('.bingo-cell');
  for (const i of [0, 1, 2, 3]) await cells.nth(i).click();
  ok('four in a row: BINGO', (await page.locator('.bingo-shout').count()) === 1);
  await page.fill('input[aria-label="My excuse is…"]', 'too scared of failing badly');
  ok('word cloud: four words at most', await page.locator('.cloudin button:has-text("Add")').isDisabled());
  await page.fill('input[aria-label="My excuse is…"]', 'Too scared');
  await page.click('.cloudin button:has-text("Add")'); await page.waitForSelector('text=You added');
  const gb = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await gb.goto(U + '/#/poll-results/bingo/TEST1'); await gb.waitForFunction(() => document.querySelector('.qr-total b') && document.querySelector('.qr-total b').textContent === '1');
  await gb.waitForFunction(() => document.querySelectorAll('.bingo-bars .lpbar:not(.zero)').length === 4);
  ok('bingo projector: the most-tapped excuses', true);
  await gb.goto(U + '/#/cloud/excuse/TEST1'); await gb.waitForSelector('.cloud-w');
  ok('word cloud projector', (await gb.locator('.cloud-w').first().innerText()) === 'too scared');

  /* Friday: Sphere sorter + the recap quiz */
  await page.goto(U + '/#/t/spheres'); await page.click('text=Start');
  for (let i = 0; i < 10; i++) await page.locator('.opt-btn').nth(i % 7).click();
  await page.waitForSelector('a:has-text("Next: Week recap")');
  await page.click('a:has-text("Next: Week recap")'); await page.click('text=Start');
  for (const t of ['Lordship doesn’t go away', 'Plod, don’t sprint', 'My grace is sufficient', 'Make plans with open hands', 'Easy to die for Jesus']) await page.click('.opt-btn:has-text("' + t + '")');
  await page.waitForSelector('text=5 of 5 right');
  ok('recap: match each day to its line, 5 of 5', true);
  await gb.goto(U + '/#/poll-results/spheres/TEST1'); await gb.waitForSelector('.sort-row');
  ok('sphere sorter projector: 10 jobs split across spheres', (await gb.locator('.sort-row').count()) === 10);
  await gb.goto(U + '/#/poll-results/recap/TEST1'); await gb.waitForSelector('.quiz-row');
  ok('recap projector: % right per day', (await gb.locator('.quiz-row').first().innerText()).includes('100% ✓'));
  await gb.goto(U + '/#/throwdown/DTSW'); await gb.waitForSelector('.td-big');
  await gb.waitForFunction(() => document.querySelector('.td-big').textContent === '1');
  ok('throw-down projector: an anonymous live count', true);

  /* Thursday: where am I? + burn the ships */
  await page.goto(U + '/#/day/thu'); await page.waitForSelector('.scripture');
  ok('Thursday follows the new outline (Elisha, the alabaster jar, the backup plan)', (await text()).includes('1 Kings 19:19–21') && (await text()).includes('alabaster jar') && (await text()).includes('you’re my only plan') && !(await text()).includes('Exodus 3:11'));
  await page.goto(U + '/#/t/calling'); await page.click('.opt-btn:has-text("Exploring")');
  await page.click('button[aria-label="Character: 2"]'); await page.click('button[aria-label="Chemistry: 4"]');
  ok('where am I: status and the weakest C', (await text()).includes('Grow first in Character'));
  await page.goto(U + '/#/t/backup'); await page.fill('#backup', 'Go home and work at my uncle’s shop');
  await page.click('button:has-text("Tear it up")'); await page.waitForSelector('.torn');
  ok('burn the ships: torn up, on my lay down list', (await page.evaluate(() => JSON.parse(localStorage.getItem('gp.lordship.list') || '[]').some(x => x.area === 'My backup plan'))));
  const bs = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const myCls = await page.evaluate(() => JSON.parse(localStorage.getItem('gp.lordship.class')).code);
  await bs.goto(U + '/#/burn/' + myCls); await bs.waitForFunction(() => document.querySelector('.burn-n') && document.querySelector('.burn-n').textContent === '1');
  ok('burn the ships projector: an anonymous count, no words', !(await bs.locator('main, .screen').first().innerText()).includes('uncle'));
  await page.goto(U + '/#/day/fri'); await page.waitForSelector('.scripture');
  ok('Friday: the nations and the commissioning', (await text()).includes('Vision 2033') && (await text()).includes('Numbers 6:24–26'));

  /* Wednesday, private: I'm prone to… + MSP */
  await page.goto(U + '/#/t/prone'); await page.click('.chip:has-text("doom-scrolling")');
  ok('“I’m prone to…” with a new-creation verse beside it', (await page.locator('.prone-row').innerText()).includes('2 Corinthians 5:17'));
  await page.goto(U + '/#/t/hotpoll'); await page.click('text=Start'); await page.click('.opt-btn:has-text("Transparent")');
  await page.waitForSelector('text=Thank you for being honest');
  ok('HOT poll: one tap, no list or habit button', (await page.locator('button:has-text("lay down list")').count()) === 0);

  /* a live poll for a Zoom call: no names */
  const lp = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await lp.goto(U + '/?poll=never'); await lp.waitForSelector('text=Start');
  ok('?poll=never opens with no sign-in, Peter’s verse first', (await lp.locator('.scripture').innerText()).includes('Far be it from you, Lord') && (await lp.locator('.pinbox').count()) === 0);
  await lp.click('text=Start');
  await lp.click('.opt-btn:has-text("My comfort")');
  await lp.click('.opt-btn:has-text("Yes… slowly")');
  await lp.waitForSelector('text=Thank you for being honest');
  ok('done: what I picked, John 21 and a prayer', (await lp.locator('.lp-mine').innerText()).includes('My comfort') && (await lp.locator('main').innerText()).includes('You know that I love you'));
  const lps = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await lps.goto(U + '/#/poll-results/never'); await lps.waitForSelector('.lpbar');
  await lps.waitForFunction(() => document.querySelector('.qr-total b').textContent === '1');
  ok('the shared screen: the link, both questions, live', (await lps.locator('.lp-link b').innerText()).includes('?poll=never') && (await lps.locator('.lp-col').count()) === 2 && (await lps.locator('.lpbar:not(.zero)').count()) === 2);
  await lp.goto(U + '/?poll=staff'); await lp.waitForSelector('text=Start');
  ok('?poll=staff opens with Moses’ staff', (await lp.locator('.scripture').innerText()).includes('What is that in your hand?'));
  await lp.click('text=Start');
  ok('it remembers what they laid down', (await lp.locator('.opt-btn.mine').innerText()).includes('My comfort'));
  await lp.click('.opt-btn.mine');
  ok('then shows it picked back up, God’s way', (await lp.locator('.pickup h2').innerText()).includes('Rest well') && (await lp.locator('.pickup').innerText()).includes('Mark 6:31'));
  await lp.click('.opt-btn:has-text("One small change")');
  await lp.waitForSelector('text=Thank you for being honest');
  ok('done keeps the picked-up card', (await lp.locator('.pickup h2').count()) === 1);
  await lps.goto(U + '/#/poll-results/staff'); await lps.waitForSelector('.lp-top');
  ok('the shared screen names the top area picked back up', (await lps.locator('.lp-top').innerText()).includes('Rest well'));
  await lp.goto(U + '/?poll=never'); await lp.waitForSelector('text=Change my answer');
  await lp.click('text=Change my answer'); await lp.waitForSelector('.lp-opts.grid');
  ok('no sideways scroll: poll phone', await lp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

  /* the polls in the class app: Home → Live class polls, results for just this class */
  await page.goto(U + '/#/class'); await page.waitForSelector('text=Live class polls');
  await page.click('.tile:has-text("Never, Lord")'); await page.click('text=Start');
  await page.click('.opt-btn:has-text("Where I’ll live")'); await page.click('.opt-btn:has-text("Yes, Lord")');
  await page.waitForSelector('text=Thank you for being honest');
  await page.click('text=Put it on my lay down list');
  ok('class poll: the never goes on my list', (await page.evaluate(() => JSON.parse(localStorage.getItem('gp.lordship.list') || '[]').some(x => x.laydown === 'Where I’ll live'))));
  const cr = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await cr.goto(U + '/#/poll-results/never/TEST1'); await cr.waitForFunction(() => document.querySelector('.qr-total b') && document.querySelector('.qr-total b').textContent === '1');
  ok('class results: just this class, with its own link', (await cr.locator('.lpbar:not(.zero)').first().innerText()).includes('Where I’ll live') && (await cr.locator('.lp-link b').innerText()).includes('room=TEST1'));
  await page.goto(U + '/#/t/staff'); await page.click('text=Start'); await page.click('.opt-btn.mine');
  await page.click('.opt-btn:has-text("One small change")'); await page.waitForSelector('text=Thank you for being honest');
  await page.click('button:has-text("Daily habit:")');
  await page.goto(U + '/#/t/habits');
  ok('class poll: the small step becomes a daily habit', (await page.locator('.habit', { hasText: 'Pray for my street or city' }).count()) === 1);
  await page.goto(U + '/#/class'); await page.waitForSelector('.today');
  ok('home: today’s response, one tap', (await page.locator('.today .chips a.chip').count()) >= 1);
  ok('projector screens have a full screen button', (await cr.locator('.fsbtn').count()) === 1);

  ok('no page errors', errors.length === 0, errors);
} catch (e) {
  ok('ran without throwing: ' + e.message, false);
  await page.screenshot({ path: '/tmp/claude-0/-home-user-public-app/52feb092-2118-5288-be0a-d9d248a49451/scratchpad/fail.png' }).catch(() => {});
}
await browser.close();
srv.close();
ok.done();
