/* Phone reminders (web push, copied from the Impact app): the app makes its own keys on first
   use, a phone subscribes (only to a real push service), each message is encrypted to that
   phone (RFC 8291) and signed (VAPID, RFC 8292), and the hourly job sends one notification at
   each person's hour with only what applies. This decrypts what the server sends exactly as a
   phone would. Real api.js, in-memory store, the push services stood in for. */
import crypto from 'node:crypto';
import { memStore, fakeGoogle, checker } from './env.mjs';
globalThis.__gpaStore = memStore();
fakeGoogle();
delete process.env.GPA_VAPID_PUBLIC; delete process.env.GPA_VAPID_PRIVATE;
const { HANDLERS: H, runReminders, __test } = await import('../netlify/functions/api.js');
const ok = checker();
const mem = globalThis.__gpaStore._m, get = k => mem.has(k) ? JSON.parse(mem.get(k)) : null;
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
function phone(host) {
  const e = crypto.createECDH('prime256v1'); e.generateKeys(); const auth = crypto.randomBytes(16);
  return { ecdh: e, auth, sub: { endpoint: 'https://' + (host || 'fcm.googleapis.com') + '/fcm/send/' + crypto.randomBytes(6).toString('hex'), keys: { p256dh: b64u(e.getPublicKey()), auth: b64u(auth) } } };
}
function decrypt(ph, body) {
  const salt = body.subarray(0, 16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), ct = body.subarray(21 + idlen);
  const secret = ph.ecdh.computeSecret(asPub), hk = (s, i, info, n) => Buffer.from(crypto.hkdfSync('sha256', i, s, info, n));
  const ikm = hk(ph.auth, secret, Buffer.concat([Buffer.from('WebPush: info\0'), ph.ecdh.getPublicKey(), asPub]), 32);
  const cek = hk(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hk(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce); d.setAuthTag(ct.subarray(ct.length - 16));
  const pt = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  if (pt[pt.length - 1] !== 2) throw new Error('no last-record delimiter');
  return JSON.parse(pt.subarray(0, pt.length - 1).toString('utf8'));
}
let sent = [], answer = 201;
const google = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (/googleapis\.com\/(tokeninfo|oauth2)|openidconnect/.test(String(url)) || String(url).startsWith('https://oauth2.')) return google(url, opts);
  sent.push({ url: String(url), opts }); return { status: answer, ok: answer < 300 };
};
const Y = Number(__test.today_().slice(0, 4)), today = __test.today_();
const A = await H.register('test:sokha:Sokha Chan', { username: 'sokha', name: 'Sokha Chan', birthYear: 1995 });
const M = await H.register('test:mina:Mina Sok', { username: 'mina', name: 'Mina Sok', birthYear: Y - 16 });
const B = await H.register('test:dara:Dara Keo', { username: 'dara', name: 'Dara Keo', birthYear: 1999 });

/* ---------- 1. keys and subscribing ---------- */
let r = await H.boot(M.uid, M.token);
ok('the app makes its own key pair on first use, and the phone gets the public half', r.push && unb64u(r.push.key).length === 65 && !!get('pushKeys').priv && !JSON.stringify(r).includes(get('pushKeys').priv));
ok('… once: the next boot gets the same key', (await H.boot(A.uid, A.token)).push.key === r.push.key);
ok('the default reminder time is 7 pm, everything on', r.push.prefs.hour === 19 && r.push.prefs.habits && r.push.prefs.alerts);
const pm = phone();
ok('a phone can only subscribe to a real push service', (await H.pushSubscribe(M.uid, M.token, phone('evil.example.com').sub, 'km')).err === 'bad_endpoint');
ok('… with real keys', (await H.pushSubscribe(M.uid, M.token, { endpoint: pm.sub.endpoint, keys: { p256dh: 'x', auth: 'y' } }, 'km')).err === 'bad_keys');
ok('a phone subscribes', (await H.pushSubscribe(M.uid, M.token, pm.sub, 'en')).ok && get('pushSubs').length === 1);
ok('signed out, nobody can subscribe', (await H.pushSubscribe(M.uid, 'f'.repeat(48), pm.sub, 'en')).err === 'auth');
r = await H.pushSavePrefs(M.uid, M.token, { hour: 30, habits: true, plan: false, team: true, coach: true, alerts: true });
ok('an hour out of range falls back to 7 pm', r.prefs.hour === 19 && r.prefs.plan === false);

/* ---------- 2. a test message, decrypted as the phone would ---------- */
sent = [];
r = await H.pushTest(M.uid, M.token);
const msg = decrypt(pm, sent[0].opts.body);
ok('the test arrives, encrypted to this phone', r.ok && sent.length === 1 && sent[0].url === pm.sub.endpoint && /Reminders are on/.test(msg.body) && msg.title === 'GonPreah');
const [jh, jb, js] = sent[0].opts.headers.Authorization.replace(/^vapid t=/, '').split(', k=')[0].split('.');
const keys = get('pushKeys'), pub = unb64u(keys.pub);
const verifyKey = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, format: 'jwk' });
ok('… signed with the app’s key for that push service (VAPID)', crypto.verify('sha256', Buffer.from(jh + '.' + jb), { key: verifyKey, dsaEncoding: 'ieee-p1363' }, unb64u(js)) && JSON.parse(unb64u(jb)).aud === 'https://fcm.googleapis.com');

/* ---------- 3. the hourly reminder ---------- */
const at7pm = new Date(today + 'T12:00:00Z');   // 19:00 in Phnom Penh
await H.saveHabits(M.uid, M.token, [{ id: 'bible' }]);
sent = [];
r = await runReminders(at7pm);
ok('at her hour, with habits not ticked, she gets one reminder', r.ok && r.sent === 1 && /habits for today/.test(decrypt(pm, sent[0].opts.body).body));
ok('… and the same hour never sends twice', (await runReminders(at7pm)).skipped === 'already_ran');
sent = [];
r = await runReminders(new Date(today + 'T13:00:00Z'));
ok('another hour: nothing for her', r.sent === 0 && sent.length === 0);
await H.tickHabit(M.uid, M.token, today, 'bible', true);
mem.delete('pushRun');
sent = [];
r = await runReminders(at7pm);
ok('nothing to do, nothing sent', r.sent === 0 && sent.length === 0);
/* a team task due tomorrow, and a 1-on-1 today */
const T = await H.createTeam(A.uid, A.token, { name: 'Siem Reap Youth' });
await H.joinTeam(M.uid, M.token, T.team.code); await H.joinTeam(B.uid, B.token, T.team.code);
await H.teamManage(A.uid, A.token, T.team.id, 'lead', B.uid);
sent = [];
await H.teamTask(A.uid, A.token, T.team.id, 'add', { text: 'Bring the guitar', who: M.uid, due: today });
ok('a leader gives her a task: she hears right away — the team, not the words', sent.length === 1 && /new task for you in/.test(decrypt(pm, sent[0].opts.body).body) && !/guitar/.test(decrypt(pm, sent[0].opts.body).body));
const c = await H.coachAsk(A.uid, A.token, M.uid, T.team.id, 'coach');
ok('a coach’s offer reaches her right away', /offered to be your coach/.test(decrypt(pm, sent[sent.length - 1].opts.body).body));
await H.coachAnswer(M.uid, M.token, c.id, true);
await H.coachAct(M.uid, M.token, c.id, 'next', { date: today });
mem.delete('pushRun'); sent = [];
await runReminders(at7pm);
const body = decrypt(pm, sent[0].opts.body).body;
ok('the evening reminder lists the team task and today’s 1-on-1', /1 team tasks due soon/.test(body) && /1-on-1 with Sokha today/.test(body), body);
/* alerts off, a phone that's gone, Khmer */
await H.pushSavePrefs(M.uid, M.token, { hour: 19, alerts: false });
sent = [];
await H.teamTask(A.uid, A.token, T.team.id, 'add', { text: 'Another', who: M.uid });
ok('with alerts off, nothing comes right away', sent.length === 0);
answer = 410; mem.delete('pushRun');
await runReminders(at7pm);
ok('a phone the push service says is gone is dropped', get('pushSubs').length === 0);
answer = 201;
const pk = phone('web.push.apple.com');
await H.pushSubscribe(M.uid, M.token, pk.sub, 'km');
sent = []; await H.pushTest(M.uid, M.token);
ok('a phone in Khmer gets Khmer (an iPhone too)', /ការរំលឹក/.test(decrypt(pk, sent[0].opts.body).body) && decrypt(pk, sent[0].opts.body).title === 'កូនព្រះ');
ok('turning it off on a phone drops it', (await H.pushUnsubscribe(M.uid, M.token, pk.sub.endpoint)).ok && get('pushSubs').length === 0);
/* ---------- 4. a morning nudge, and today's Bible reading ---------- */
const pm2 = phone();
await H.pushSubscribe(M.uid, M.token, pm2.sub, 'en');
await H.pushSavePrefs(M.uid, M.token, { hour: 8 });
await H.reading(M.uid, M.token, 'start', { plan: 'john' });
mem.delete('pushRun'); sent = [];
await runReminders(new Date(today + 'T01:00:00Z'));   // 08:00 in Phnom Penh
const mb = decrypt(pm2, sent[0].opts.body).body;
ok('a morning reminder asks for today’s 3 and points to today’s reading', /3 things for today/.test(mb) && /Bible reading is waiting/.test(mb), mb);
await H.saveTop(M.uid, M.token, today, [{ text: 'Study' }]);
await H.reading(M.uid, M.token, 'tick', { plan: 'john', day: 0, done: true });
mem.delete('pushRun'); sent = [];
await runReminders(new Date(today + 'T01:00:00Z'));
const mb2 = sent.length ? decrypt(pm2, sent[0].opts.body).body : '';
ok('… and stops asking once they’re done', !/3 things for today/.test(mb2) && !/Bible reading/.test(mb2), mb2);
ok.done();
