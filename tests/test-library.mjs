/* The Library's books (public/library.js, library-km.js): every book whole, on a shelf, in
   Khmer with the same shape, and written for young people — not for YWAM GP staff. */
import fs from 'node:fs'; import vm from 'node:vm';
import { checker } from './env.mjs';
const ok = checker();
const ctx = {}; vm.createContext(ctx);   // km.js declares its objects with const: read as var below
for (const f of ['library.js', 'library-km.js', 'km.js', 'km-app.js']) vm.runInContext(fs.readFileSync(new URL('../public/' + f, import.meta.url), 'utf8').replace(/^(const|let) /gm, 'var '), ctx);
const L = ctx.GP_LIBRARY, K = ctx.GP_LIBRARY_KM, B = L.books;
const shelfIds = L.shelves.map(s => s.id);
ok('37 books on five shelves', B.length === 37 && shelfIds.join() === 'faith,habits,people,work,lead');
ok('ids are unique', new Set(B.map(b => b.id)).size === B.length);
ok('every book is on a shelf, and every shelf has books', B.every(b => shelfIds.includes(b.shelf)) && shelfIds.every(s => B.some(b => b.shelf === s)));
ok('Start here: ten books that are in the Library', L.startHere.length === 10 && L.startHere.every(id => B.some(b => b.id === id)));
const parts = ['title', 'author', 'vibe', 'bigIdea', 'insights', 'tryThis', 'forUs', 'oneLine'];
const bad = B.filter(b => !parts.every(p => b[p] && b[p].length) || !b.insights.every(i => i.title && i.body) || !b.cover);
ok('every book has every part and a cover', bad.length === 0, bad.map(b => b.id).join(' '));
const kmBad = B.filter(b => { const k = K[b.id]; return !k || k.insights.length !== b.insights.length || k.tryThis.length !== b.tryThis.length || !parts.every(p => k[p] && k[p].length) || !/[ក-៿]/.test(k.forUs + k.title); });
ok('every book is in Khmer with the same shape', kmBad.length === 0 && Object.keys(K).length === B.length, kmBad.map(b => b.id).join(' '));
const txt = b => JSON.stringify(Object.assign({}, b, { cover: null }));
const staffy = B.filter(b => /YWAM GP|GonPreah staff|on the base|our base|mission base|\bDTS\b/.test(txt(b)));
ok('nothing speaks to YWAM GP staff or a mission base', staffy.length === 0, staffy.map(b => b.id).join(' '));
const staffyKm = B.filter(b => /YWAM GP|DTS|មូលដ្ឋានបេសកកម្ម|បុគ្គលិក YWAM/.test(JSON.stringify(K[b.id])));
ok('… in Khmer too', staffyKm.length === 0, staffyKm.map(b => b.id).join(' '));
const words = B.map(b => b.forUs.split(/\s+/).length);
ok('every "For you" is a real section (140–260 words)', words.every(n => n >= 140 && n <= 260), words.join(' '));
const KMW = Object.assign({}, ctx.BUILTIN_KM, ctx.APP_KM);
ok('every shelf name has Khmer', L.shelves.every(s => KMW[s.name]), L.shelves.filter(s => !KMW[s.name]).map(s => s.name).join(', '));
const ywam = B.filter(b => /YWAM|Youth With A Mission/i.test(txt(b)) || /YWAM|អង្គការយុវជន/.test(JSON.stringify(K[b.id])));
ok('no YWAM in any book, English or Khmer (Uriah: "leave out ywam stuff")', ywam.length === 0, ywam.map(b => b.id).join(' '));
vm.runInContext(fs.readFileSync(new URL('../public/khmer-vocab.js', import.meta.url), 'utf8'), ctx);
ok('… nor in Learn Khmer’s word lists', !/YWAM/i.test(JSON.stringify(ctx.GP_KHMER_VOCAB)) && !ctx.GP_KHMER_VOCAB.cats.some(c => c.id === 'ywam'));
/* the daily devotionals (public/devotions.js) */
vm.runInContext(fs.readFileSync(new URL('../public/devotions.js', import.meta.url), 'utf8'), ctx);
const DV = ctx.GP_DEVOS, BOOKS = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Songs','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'];
ok('a devotional for each day of the month, in order', DV.length === 31 && DV.every((d, i) => d.day === i + 1));
ok('… each with a real passage to read (a reference only)', DV.every(d => BOOKS.includes(d.ref.replace(/\s+\d.*$/, ''))), DV.filter(d => !BOOKS.includes(d.ref.replace(/\s+\d.*$/, ''))).map(d => d.ref).join(' '));
ok('… in English and Khmer, every part', DV.every(d => ['title', 'body', 'ask', 'pray'].every(k => d[k + '_en'] && /[ក-៿]/.test(d[k + '_km']))));
ok('… quoting no Bible text', DV.every(d => !/["“”]/.test(d.body_en)));
ok('none of the staff guides came across', !B.some(b => b.original || b.shelf === 'gp' || b.shelf === 'ywam'));
ok.done();
