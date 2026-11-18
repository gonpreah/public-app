/* The libraries' shape and the words on screen: node tests/test-data.mjs */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, checker } from './env.mjs';

const ok = checker();
const W = {};
const ctx = vm.createContext({ window: W, console });
for (const f of ['i18n.js', 'palettes.js', 'fonts.js', 'brands.js', 'quiz.js', 'questions.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'public', f), 'utf8'), ctx, { filename: f });
const KM = /[ក-៿]/;
const bi = (o) => o && typeof o.en === 'string' && o.en.trim() && typeof o.km === 'string' && KM.test(o.km);

/* palettes */
const P = W.BFH_PALETTES, C = W.BFH_COLOR;
ok('40–60 palettes', P.length >= 40 && P.length <= 60, P.length);
ok('9 moods, Khmer-inspired among them', W.BFH_MOODS.length === 9 && W.BFH_MOODS.some(m => m.id === 'khmer'));
ok('every mood used', W.BFH_MOODS.every(m => P.some(p => p.mood === m.id)));
ok('palette ids unique', new Set(P.map(p => p.id)).size === P.length);
const badHex = P.filter(p => !['primary', 'secondary', 'accent', 'background', 'text'].every(r => /^#[0-9A-F]{6}$/.test(p.colors[r])));
ok('5 roles, uppercase hex', !badHex.length, badHex.map(p => p.id));
const lowC = P.filter(p => C.contrast(p.colors.text, p.colors.background) < 7);
ok('text on background ≥ 7:1', !lowC.length, lowC.map(p => p.id));
ok('palette names bilingual', P.every(p => bi(p.name) && bi(p.feel)));
ok('tints and shades', C.tints('#336699').length === 4 && C.shades('#336699').length === 4);

/* fonts */
const F = W.BFH_FONTS;
ok('30–40 font pairings', F.length >= 30 && F.length <= 40, F.length);
ok('7 personalities, each used', W.BFH_FONT_STYLES.length === 7 && W.BFH_FONT_STYLES.every(s => F.some(f => f.style === s.id)));
ok('every pairing has a Khmer heading and body font', F.every(f => f.khHeading.family && f.khBody.family && f.heading.family && f.body.family));
ok('font URL helper', F.every(f => /^https:\/\/fonts\.googleapis\.com\/css2\?family=/.test(W.BFH_FONT_URL(f))));
ok('font ids unique', new Set(F.map(f => f.id)).size === F.length);

/* brands */
const BR = W.BFH_BRANDS, A = W.BFH_ARCHETYPES;
ok('20–30 brands', BR.length >= 20 && BR.length <= 30, BR.length);
ok('7 archetypes, each with brands', A.length === 7 && A.every(a => BR.some(b => b.archetype === a.id)));
for (const want of ['nike', 'apple', 'airbnb', 'patagonia', 'ywam', 'hillsong']) ok('has ' + want, BR.some(b => b.id === want));
ok('every brand has all the teaching fields in both languages', BR.every(b => ['stands', 'feeling', 'colour', 'type', 'voice', 'lesson'].every(k => bi(b[k]))), BR.filter(b => !['stands', 'feeling', 'colour', 'type', 'voice', 'lesson'].every(k => bi(b[k]))).map(b => b.id));
ok('every brand has a logo source and an official page, https only', BR.every(b => /^https:\/\//.test(b.logo || b.favicon) && /^https:\/\//.test(b.brandPage || b.site) && b.owner));
ok('brand colours are hex', BR.every(b => (b.colours || []).every(h => /^#[0-9A-Fa-f]{6}$/.test(h))));

/* quiz */
ok('a deeper quiz: 12–16 questions in parts', W.BFH_QUIZ.length >= 12 && W.BFH_QUIZ.length <= 16 && W.BFH_QUIZ.every(q => bi(q.q) && q.options.length >= 3 && q.options.every(o => bi(o)) && (W.BFH_QUIZ_PARTS || []).some(p => p.id === q.part)));
ok('quiz results go deeper: brand look, content ideas, blend', A.every(a => { const R = W.BFH_QUIZ_RESULTS[a.id]; return R && bi(R.brand) && bi(R.blend) && R.content.length === 3 && R.content.every(bi) && R.strengths.length === 3; }));
ok('a result for each archetype', A.every(a => W.BFH_QUIZ_RESULTS[a.id] && bi(W.BFH_QUIZ_RESULTS[a.id].title) && bi(W.BFH_QUIZ_RESULTS[a.id].text)));
const r = W.BFH_quizScore(Object.fromEntries(W.BFH_QUIZ.map(q => [q.id, q.options[0].id])));
ok('quiz scores to an archetype with a mix', A.some(a => a.id === r.top) && r.second && Math.abs(Object.values(r.pct).reduce((x, y) => x + y, 0) - 100) <= 3);

/* interview */
const Q = W.BFH_QUESTIONS;
ok('a shorter interview: 12–16 questions in 6 sections', Q.length >= 12 && Q.length <= 16 && W.BFH_SECTIONS.length === 6 && W.BFH_SECTIONS.every(sc => Q.some(q => q.section === sc.id)));
ok('every typed question shows an example answer', Q.filter(q => ['short', 'long', 'words3'].includes(q.type)).every(q => bi(q.example)));
ok('at most 6 long answers', Q.filter(q => q.type === 'long').length <= 6);
ok('the original ten are there', ['name', 'story', 'heart', 'person', 'outcome', 'friends3', 'never3', 'moods', 'things', 'verse'].every(id => Q.some(q => q.id === id)));
ok('moods chips are the eleven', JSON.stringify(Q.find(q => q.id === 'moods').options.map(o => o.id)) === JSON.stringify(['joyful', 'calm', 'bold', 'gentle', 'hopeful', 'playful', 'serious', 'warm', 'modern', 'traditional', 'adventurous']));
ok('every question bilingual with an encouragement line', Q.every(q => bi(q.q) && bi(q.cheer)));
ok('text questions have a follow-up', Q.filter(q => ['short', 'long', 'words3'].includes(q.type) && !q.optional).every(q => bi(q.follow)));
ok('this-or-that picks', W.BFH_TOT.length >= 5 && W.BFH_TOT.every(p => bi(p.q) && p.a.art && p.b.art && p.a.signal && p.b.signal));

/* every word on screen has Khmer */
const T = W.BFH_T;
const src = fs.readFileSync(path.join(ROOT, 'public', 'app.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'public', 'brand.js'), 'utf8');
const used = new Set([...src.matchAll(/\b[tT]\('([a-zA-Z0-9_]+)'/g)].map(m => m[1]));
for (const [pre, list] of Object.entries({ lane_: ['heart', 'bold', 'soft', 'khmer', 'wild', 'more'], tab_: ['mix', 'colours', 'type', 'words', 'tune', 'mockups'], how_: ['warmer', 'bolder', 'simpler', 'softer', 'khmer', 'playful'], role_: ['primary', 'secondary', 'accent', 'background', 'text'], job_: ['heart', 'more', 'refine', 'package'] })) list.forEach(k => used.add(pre + k));
['chk1', 'chk2', 'chk3', 'chk4', 'chk5', 'chk6', 'enc1', 'enc2', 'enc3', 'enc4', 'step1', 'step2', 'step3', 'step4', 'step5', 'navHome', 'navInspire', 'navBrand', 'navClass', 'warm', 'cool', 'bold', 'soft', 'modern', 'classic', 'playful', 'serious', 'mkPost', 'mkStory', 'mkPoster', 'mkThumb', 'mkHeader', 'errNoKey', 'errLimit', 'errRefused', 'errStudent', 'errTimeout', 'errBusyClaude', 'enoughComments'].forEach(k => used.add(k));
['lane_', 'tab_', 'how_', 'role_', 'job_'].forEach(k => used.delete(k));
const missing = [...used].filter(k => !T[k]);
ok('every key used on screen exists', !missing.length, missing);
const noKm = Object.keys(T).filter(k => !bi(T[k]));
ok('every string has English and Khmer', !noKm.length, noKm);

/* no logo is ever filtered or recoloured */
const css = fs.readFileSync(path.join(ROOT, 'public', 'app.css'), 'utf8');
ok('logos are never filtered or recoloured', !/\.logo[^{]*\{[^}]*(filter|mix-blend|opacity)/.test(css));

ok.done();
