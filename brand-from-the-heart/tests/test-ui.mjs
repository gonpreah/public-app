/* The app in a phone browser, end to end, with a stand-in Claude:
   quiz → inspiration → interview → heart check → 5 directions → studio → package → class feedback → teacher.
   node tests/test-ui.mjs   (needs playwright: npm install --no-save playwright) */
import { createRequire } from 'node:module';
import { startServer, checker, findChromium } from './env.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = require(require.resolve('playwright', { paths: [process.cwd(), '/usr/lib/node_modules', '/usr/local/lib/node_modules'] })); }
const ok = checker();
const { srv, base } = await startServer(0, { delay: 150 });
const exe = findChromium();
const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
const phone = { viewport: { width: 375, height: 740 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
const errors = [];
async function newPage(ctx) {
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com|wikimedia|google\.com\/s2|upload\.|\.svg$|\.png$/, r => r.request().resourceType() === 'image' ? r.fulfill({ status: 404, body: '' }) : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  return p;
}
const api = async (fn, args) => (await fetch(base + '/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ fn, args }) })).json();
const noSideScroll = async (p, name) => ok('no sideways scroll: ' + name, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
const tap = async (p, sel) => { await p.locator(sel).first().click(); };

try {
  const cls = await api('classCreate', { name: 'Test class', password: 'teach' });

  /* ---------- student A ---------- */
  const ctxA = await browser.newContext(Object.assign({ acceptDownloads: true }, phone));
  await ctxA.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const p = await newPage(ctxA);
  await p.goto(base + '/?class=' + cls.code);
  await p.waitForSelector('.hero');
  ok('home renders in English first', (await p.textContent('h1')) === 'Brand From the Heart');
  await noSideScroll(p, 'home');
  await tap(p, '.lang button:has-text("ខ្មែរ")');
  ok('Khmer one tap away', (await p.textContent('h1')) === 'ម៉ាកចេញពីបេះដូង' && await p.evaluate(() => document.documentElement.lang) === 'km');
  await tap(p, '.lang button:has-text("EN")');

  // quiz
  await tap(p, '[data-act="go"][data-arg="quiz"]');
  const nQuiz = await p.evaluate(() => window.BFH_QUIZ.length);
  ok('quiz shows its part and an intro', (await p.textContent('.qtop')).length > 3 && await p.locator('.sec-intro').count() === 1);
  for (let i = 0; i < nQuiz; i++) { await p.waitForSelector('.opt'); await p.locator('.opt').nth(i % 3).click(); }
  await p.waitForSelector('.result');
  ok('quiz gives a result card', (await p.textContent('.result h1')).length > 2);
  ok('result links to matching brands', await p.locator('.mini-brand').count() >= 3);
  ok('result shows the mix, brand look and content ideas', await p.locator('.mixbar').count() >= 2 && (await p.textContent('main')).includes('Content ideas for you'));

  // inspiration
  await tap(p, 'nav.bottom [data-arg="gallery"]');
  await p.waitForSelector('.brand-grid');
  ok('gallery lists 20+ brands', await p.locator('.brand-card').count() >= 20);
  ok('take inspiration, don\'t copy', (await p.textContent('.note')).includes("don't copy"));
  await noSideScroll(p, 'gallery');
  await tap(p, '.brand-card:has-text("Nike")');
  await p.waitForSelector('.sheet');
  ok('brand sheet: lesson, credit, official link', (await p.textContent('.sheet')).includes('A lesson to borrow') && (await p.textContent('.credit')).includes('Shown unaltered') && await p.locator('.sheet a[target=_blank]').count() === 1);
  ok('logo shown unaltered (no filter)', await p.evaluate(() => { const i = document.querySelector('.sheet .logo img, .sheet .logo'); return !i || getComputedStyle(i).filter === 'none'; }));
  await tap(p, '.sheet [data-act="like"]');
  ok('I like this vibe', (await p.textContent('.sheet [data-act="like"]')).includes('You like this vibe'));
  await tap(p, '.sheet .x');

  // interview
  await tap(p, 'nav.bottom [data-arg="mine"]');
  await p.waitForSelector('h2.q');
  ok('interview opens with progress', await p.locator('.bar i').count() === 1 && (await p.textContent('.qtop')).includes('1 of'));
  ok('encouragement on the screen', (await p.textContent('.cheer')).length > 5);
  ok('an example answer shows by itself', await p.locator('details.example[open] p').count() === 1 && (await p.textContent('details.example p')).length > 3);
  // first question: name — a short answer shows the follow-up
  await p.fill('.big-in', 'S');
  await tap(p, '[data-act="next"]');
  ok('a short answer gets a follow-up', await p.locator('.follow').count() === 1);
  await p.fill('.big-in', 'Sokha');
  ok('the follow-up goes once it is long enough', await p.locator('.follow').count() === 0);
  let guard = 0;
  while (guard++ < 40) {
    const h = await p.textContent('.qtop');
    if (await p.locator('.tots').count()) { for (const btn of await p.locator('.tot-card').all()) { /* pick the first of each pair */ } const n = await p.locator('.tot').count(); for (let i = 0; i < n; i++) await p.locator('.tot').nth(i).locator('.tot-card').first().click(); }
    else if (await p.locator('.words3').count()) { const ins = p.locator('.words3 input'); for (let i = 0; i < 3; i++) await ins.nth(i).fill(['kind', 'brave', 'funny'][i]); }
    else if (await p.locator('.chips.wrap .chip').count()) { await p.locator('.chips.wrap .chip').first().click(); await p.locator('.chips.wrap .chip').nth(1).click(); }
    else if (await p.locator('.opts .opt').count()) { await p.locator('.opts .opt').first().click(); }
    else if (await p.locator('textarea.big-in').count()) await p.fill('textarea.big-in', 'I grew up in Pailin and I want young people to know they are loved and not alone.');
    else if (await p.locator('input.big-in').count()) { if (!(await p.inputValue('input.big-in'))) await p.fill('input.big-in', 'Sokha Hope page'); }
    const last = /(\d+) of (\d+)/.exec(h);
    await tap(p, '[data-act="next"]');
    if (await p.locator('.follow').count()) await tap(p, '.follow [data-arg="force"]');
    if (last && last[1] === last[2]) break;
    await p.waitForTimeout(30);
  }
  ok('answers saved on the phone', await p.evaluate(() => JSON.parse(localStorage.getItem('bfh-state')).answers.name === 'Sokha'));

  // heart check (starts by itself in a class)
  await p.waitForSelector('textarea[data-heart="en"]', { timeout: 10000 });
  ok('heart check in English and Khmer', (await p.inputValue('textarea[data-heart="en"]')).includes('You are') && /[ក-៿]/.test(await p.inputValue('textarea[data-heart="km"]')));
  await p.fill('textarea[data-heart="en"]', 'You are Sokha, a listener who brings hope. EDITED');
  await tap(p, '[data-act="confirmHeart"]');
  await p.waitForSelector('.dir h3', { timeout: 15000 });
  await p.waitForFunction(() => !document.querySelector('.jobcard') && document.querySelectorAll('.dir [data-act="choose"]').length === 5, null, { timeout: 15000 });
  ok('five directions', await p.locator('.dir').count() === 5);
  ok('each with swatches, fonts, taglines, a poster', await p.locator('.dir .sws.big').count() === 5 && await p.locator('.dir .fprev').count() === 5 && await p.locator('.dir .mock-poster').count() === 5);
  await noSideScroll(p, 'directions');
  await p.locator('.dir [data-act="dirOpen"]').first().click();
  ok('all the words: bio, mission, why I post, pillars, captions, hashtags, voice', (await p.textContent('.details')).includes('Why I post') && await p.locator('.details ol li').count() === 5);
  await p.locator('.dir [data-act="more"]').nth(1).click();
  await p.waitForFunction(() => document.querySelectorAll('.dir [data-act="choose"]').length === 7, null, { timeout: 15000 });
  ok('show me more like this → 2 more', await p.locator('.dir').count() === 7);

  // studio
  await p.locator('.dir [data-act="choose"]').first().click();
  await p.waitForSelector('.studio');
  ok('studio with a live preview', await p.locator('.preview .mock-poster').count() === 1);
  await noSideScroll(p, 'studio');
  const bg0 = await p.evaluate(() => window.BFH_APP.brand().colors.primary);
  await p.locator('.mixrow').first().locator('.mixopt').nth(3).click();
  ok('mix: colours from another direction', await p.evaluate(() => window.BFH_APP.S.pick.pal) === 3);
  await p.locator('.mixrow').nth(1).locator('.mixopt').nth(2).click();
  await p.locator('.mixrow').nth(2).locator('.mixopt').nth(1).click();
  ok('mix: fonts and words from others too', await p.evaluate(() => { const P = window.BFH_APP.S.pick; return P.font === 2 && P.words === 1; }));
  await tap(p, '[data-act="tab"][data-arg="colours"]');
  await p.locator('.sw-row').first().locator('.sw-opt').first().click();
  ok('swap a colour', await p.evaluate(() => window.BFH_APP.S.pick.colors.primary !== window.BFH_APP.S.dirs[3].colors.primary));
  await tap(p, '[data-act="tab"][data-arg="tune"]');
  const before = await p.evaluate(() => JSON.stringify(window.BFH_APP.brand().colors));
  await p.locator('input[data-tune="warm"]').fill('80');
  await p.locator('input[data-tune="bold"]').fill('-60');
  ok('sliders change the palette live', await p.evaluate((b) => JSON.stringify(window.BFH_APP.brand().colors) !== b, before));
  ok('tuned text stays readable', await p.evaluate(() => { const c = window.BFH_APP.brand().colors; return window.BFH_BRAND.contrast(c.text, c.background) >= 4.5; }));
  await tap(p, '[data-act="tab"][data-arg="words"]');
  await p.locator('.opts .opt').nth(2).click();
  ok('choose a different tagline', await p.evaluate(() => window.BFH_APP.S.pick.tag) === 2);
  await tap(p, '[data-act="tab"][data-arg="colours"]');
  await p.locator('[data-act="refine"][data-arg^="palette|warmer"]').click();
  await p.waitForFunction(() => !document.querySelector('.refine .jobcard') && document.querySelector('[data-act="refine"]'), null, { timeout: 15000 });
  ok('make it warmer → Claude reworks the palette', !(await p.locator('.err').count()));
  await tap(p, '[data-act="tab"][data-arg="mockups"]');
  ok('five mock-ups: post, story, poster, thumbnail, header', await p.locator('.mk .mock').count() === 5);
  await noSideScroll(p, 'mock-ups');

  // package
  await tap(p, '[data-act="go"][data-arg="pack"]');
  await p.waitForSelector('.brief');
  ok('brief: name, mission, palette hex, fonts, Claude block', (await p.textContent('.brief')).includes('Sokha') && await p.locator('.hexes button').count() === 5 && (await p.textContent('#projblock')).includes('Always design with these colours'));
  ok('universal prompt has hex codes and rules', /#[0-9A-F]{6}/.test(await p.textContent('#uniprompt')) && (await p.textContent('#uniprompt')).includes('Always design with these colours and fonts'));
  await tap(p, '[data-act="packLang"][data-arg="km"]');
  ok('universal prompt in Khmer', /[ក-៿]/.test(await p.textContent('#uniprompt')));
  await tap(p, '[data-act="packLang"][data-arg="en"]');
  await tap(p, '[data-act="copyUni"]');
  ok('one-tap copy', (await p.evaluate(() => navigator.clipboard.readText())).includes('=== MY BRAND'));
  await tap(p, '[data-act="makePack"]');
  await p.waitForSelector('.pcard', { timeout: 15000 });
  ok('5 Claude Motion + 5 poster prompts', await p.locator('.pcard').count() === 10);
  ok('logo ideas, colour rules, type hierarchy', await p.locator('.marks div').count() === 3 && await p.locator('.hier').count() === 1);
  let dl = p.waitForEvent('download'); await tap(p, '[data-act="json"]'); const j = await dl;
  ok('brand file downloads', (await j.suggestedFilename()).endsWith('.brand.json'));
  dl = p.waitForEvent('download'); await tap(p, '[data-act="kit"]'); const k = await dl;
  ok('palette image downloads', (await k.suggestedFilename()).endsWith('.png'));
  await p.evaluate(() => { window.print = () => { window.__printed = document.querySelectorAll('#print .pp-page').length; }; });
  await tap(p, '[data-act="pdf"]');
  await p.waitForFunction(() => window.__printed, null, { timeout: 5000 });
  ok('PDF guide: 9 pages', await p.evaluate(() => window.__printed) === 9);
  ok('save guide checklist', await p.locator('.checklist input').count() === 6);
  await noSideScroll(p, 'package');

  // class: share
  await tap(p, 'nav.bottom [data-arg="cls"]');
  await p.waitForSelector('.opts');
  const link = await p.textContent('pre.copybox');
  ok('personal link shown', /#me=[a-z0-9]{12}\.[a-z0-9]{24}$/.test(link.trim()));
  await p.locator('[data-act="shareDir"]').nth(0).click();
  await p.locator('[data-act="shareDir"]').nth(1).click();
  await p.locator('input[data-act-change="shareOn"]').check();
  await p.waitForTimeout(300);

  /* ---------- student B: votes and encourages ---------- */
  const B = await api('start', { name: 'Dara', code: cls.code });
  const ctxB = await browser.newContext(phone);
  const pb = await newPage(ctxB);
  await pb.goto(base + '/#me=' + B.id + '.' + B.key);
  await tap(pb, 'nav.bottom [data-arg="cls"]');
  await pb.waitForSelector('.mate', { timeout: 5000 });
  ok('classmate sees the shared directions', await pb.locator('.mate-dir').count() === 2);
  await pb.locator('[data-act="vote"]').nth(1).click();
  await pb.waitForSelector('[data-act="vote"].primary');
  await pb.locator('.encourage .chip').first().click();
  await pb.locator('[data-act="comment"]').click();
  await pb.waitForSelector('.comments.mine li');
  ok('vote + encouraging comment', await pb.locator('.comments.mine li').count() === 1);

  await p.reload();
  await tap(p, 'nav.bottom [data-arg="cls"]');
  await p.waitForSelector('.comments li');
  ok('student sees their votes and encouragement', (await p.textContent('.votes')).includes('👍 1') && (await p.textContent('.comments')).includes('heart'));

  /* ---------- the personal link brings the brand back on another phone ---------- */
  const ctxC = await browser.newContext(phone);
  const pc = await newPage(ctxC);
  await pc.goto(base + '/' + link.trim().replace(/^.*\//, ''));
  await pc.waitForSelector('.brief', { timeout: 5000 });
  ok('personal link restores the brand', (await pc.textContent('.brief')).includes('Sokha'));

  /* ---------- teacher ---------- */
  const pt = await newPage(await browser.newContext({ viewport: { width: 1100, height: 900 } }));
  await pt.goto(base + '/teacher.html#c=' + cls.code + '&t=' + cls.tkey);
  await pt.waitForSelector('table');
  ok('teacher sees both students', await pt.locator('tbody tr').count() === 2);
  ok('teacher sees finished + statuses', (await pt.textContent('tbody')).includes('Finished') && (await pt.textContent('tbody')).includes('Not started'));
  ok('gallery of finished briefs', await pt.locator('.bcard').count() === 1);
  await pt.locator('.bcard').click();
  ok('brief opens with the universal prompt', (await pt.textContent('dialog')).includes('=== MY BRAND'));
  await pt.keyboard.press('Escape');
  ok('comment moderation', await pt.locator('.cm').count() === 1);
  await pt.locator('[data-hide]').click();
  await pt.waitForSelector('.cm.hidden');
  ok('teacher hides a comment', await pt.locator('.cm.hidden').count() === 1);
  const pt2 = await newPage(await browser.newContext({ viewport: { width: 1100, height: 900 } }));
  await pt2.goto(base + '/teacher.html');
  await pt2.fill('#cname', 'Second'); await pt2.fill('#cpw', 'wrong'); await pt2.click('#mk');
  await pt2.waitForFunction(() => document.querySelector('#msg').textContent);
  ok('teacher password checked', (await pt2.textContent('#msg')).includes('not right'));

  ok('no page errors', !errors.length, errors);
} catch (e) {
  console.log('FAIL crashed: ' + (e && e.stack || e));
  ok('test ran to the end', false);
} finally {
  await browser.close(); srv.close();
}
ok.done();
