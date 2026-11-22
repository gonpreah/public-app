/* The teaching's content: every people group has a photo that exists, a caption and an open licence with credit. */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, checker } from './env.mjs';
const ok = checker();
const C = await import('../src/teachings/lordship/content.js');
ok('14 people groups', C.PEOPLE_GROUPS.length === 14);
for (const g of C.PEOPLE_GROUPS) {
  const p = g.photo || {};
  const f = path.join(ROOT, 'public', p.src || 'missing');
  ok(`${g.name}: photo file, under 300 KB`, fs.existsSync(f) && fs.statSync(f).size < 300 * 1024);
  ok(`${g.name}: caption, credit, open licence`, p.caption && p.by && /^CC (BY|BY-SA) /.test(p.license) && /^https:\/\/creativecommons\.org\//.test(p.licenseUrl) && /^https:\/\//.test(p.link), p);
}
ok('every day has scripture, questions and a response', C.DAYS.every(d => d.scripture.length && d.questions.length >= 3 && d.respond.length));
ok('every plan area has a verse and prompts for both plans', C.LIFE_AREAS.every(a => a.verse && a.mine.length && a.gods.length));
ok.done();
