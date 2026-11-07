# GonPreah — the public app (app.gonpreah.org)

For Cambodian (and some Western) youth, mostly 18–25 but some younger, in seminars,
school clubs, YWAM bases, churches and youth groups: find out how God made you
(personality type, GP Strengths), build a life plan, keep on track with habits and
goals, and do it together in teams that can see each other's progress — never the
details. Khmer first, English second. Uriah asked for it, Nov 2026.

It is a separate app from the YWAM GP Impact app (`gonpreah/YWAM-gp-impact`, the
staff app at impact.gonpreah.org): its own repo, Netlify site, Blobs store ("gpa")
and accounts. Some files are copied from Impact and kept in step by hand:
`logo.js`, `fonts/`, `personality.js`, `gpstrengths.js`, `km.js`, the theme tokens
in index.html's head and the core of `app.css` — and, since Nov 2026, `learn.js` (Impact's
teams/15-khmer.js), `khmer-vocab.js`, `khmer-grammar.js`, `library-app.js` (Impact's Library
code from teams/03-library-org.js) and their styles at the end of app.css. Fix a bug there in
both apps. The Library's BOOKS (`library.js`, `library-km.js`) are this app's own (below).

## The name — and no YWAM
On screen it is **GonPreah** / **កូនព្រះ**. **Nothing on screen says YWAM** (Uriah, Nov 2026:
"leave out ywam stuff"): the header shows the round GonPreah seal (`GP_LOGO`), not the wide
"YWAM Gon Preah" mark (`GP_LOGO_WIDE`, kept in logo.js only because the file is shared); the
Library's books name no YWAM (the faith shelf's authors are "who started a worldwide mission
for young people" and the like); Learn Khmer leaves out the KBC book's "YWAM life" list.
tests/test-library.mjs and test-app-ui.mjs hold this. Comments in the code may still say where
a file came from.

## Files
- `public/index.html` — the page: head, fonts, theme tokens, splash, header, scripts.
- `public/app.js` — the whole app: state `S`, `render()`, a function per screen, `bind()`.
- `public/app.css`, `public/km-app.js` (Khmer drafts for this app's own words — see Khmer),
  `public/sw.js` (network first; bump SHELL when PRECACHE changes), `public/manifest.json`.
- `netlify/functions/api.js` — the backend: one POST endpoint, `{fn, args}` → HANDLERS.
- `tests/` — `test-api.mjs` (server rules), `test-app-ui.mjs` (the app in a phone browser),
  `env.mjs` (in-memory store, a stand-in for Google, a local server), `serve.mjs` (preview).

## Accounts
A **username and password** (`registerPassword` / `loginPassword`; Nov 2026, Uriah: "a basic
login besides Google") or Google sign-in (`loginGoogle` / `register`), then a username (unique,
3–20 of a-z 0-9 _ .), a name and a birth year. Passwords: 8+ characters, kept only as a salted
scrypt hash (`u.pw`); 8 wrong tries lock the account 15 minutes; Me → Password changes it (or
adds one to a Google account). No email, so the admin resets a forgotten one (Me → Reports →
Reset a password: a one-time password, and every old sign-in ends). The Google button shows
only when `GPA_GOOGLE_CLIENT_ID` is set. An admin is named by Google email (`GPA_ADMIN_EMAILS`)
or by username (`GPA_ADMIN_USERNAMES` — set only after that account exists). A phone keeps a random device token (hashed on the account); every
signed-in call is `(uid, token, …)` and starts with `auth_`. Telegram sign-in is planned.
`GPA_GOOGLE_CLIENT_ID` (Netlify env) must be a Google OAuth web client with
https://app.gonpreah.org as an authorised JavaScript origin; without it the button says so.

## Safety and privacy — the rules that must never loosen
Held by tests/test-api.mjs against the real handlers.
- **Under 18** = anyone who could still be 17 this year (`isMinor_`: thisYear − birthYear − 1 < 18).
  Never in the search; their card only for people who share a team; first name only; nobody
  can add or invite them — they join with a leader's code; they can't start a team or be a
  leader (a leader holds the code). **Under 13 can't make an account.**
- **Progress, not details** (`cardOut_`): others see a streak, the week's %, type, Top 5,
  team count, and the life plan as counts (goals, steps this month, goals reached) — each
  behind its own switch (`share.*`). Never goals, the why, steps, tasks, habit names,
  answers, scores, birth year or email.
- **Team tasks** are set only by leaders (adults) and every member sees every one — no
  private channel between two people, on purpose. Members tick only tasks for everyone or for them.
- The page sends test answers; the server scores strengths (`gsScore_`) and refuses
  personality bars that disagree with the letters (`cleanPScores_`).
- **1-on-1s** are the one place two people write to each other. A coach is an adult who
  leads a team both are in, and both agree. With an **under-18**, it is never private between
  two people: every leader of that team can read it (not the coach's own notes), the team must
  have a second leader before anyone can coach them, and the screens say so. If the coach stops
  leading the team or either leaves it, the coach loses access at once; the mentee keeps history.
- **No direct messages and no comments** (Uriah, Nov 2026: "limit direct messaging"). The feed
  is 👏 only, and its moments carry no one's own words (`addPost_`: a streak milestone, a goal
  reached, a test taken, a week at 100%, joining a team), each behind the person's matching
  switch and their `share.feed`. Only people in a team with you see your moments or can 👏.
- **Report and block.** Anyone can report a person they can see (photo, name, the line about
  them, something else) or a team they're in; reports wait in `reports` for the **admin** —
  whoever's Google email is in `GPA_ADMIN_EMAILS` (Netlify env; accounts keep only its hash,
  `eh`; Uriah is the admin). The admin can remove a photo or the line, suspend an account
  (signed out, hidden everywhere, can't sign in) or close a team. A team's leaders can remove a
  member's photo. Blocking works both ways (`blocked_`): neither sees the other's card, photo or
  moments, nor can 👏, coach or invite; a leader still sees every member of their own team.

## Khmer
`km.js` (copied from Impact: REVIEWED_KM read by native speakers, PENDING_KM not) wins;
`km-app.js` adds this app's own words — **all drafts by Claude, unreviewed**. Every `t()`
string must have Khmer; check before shipping a new screen. Have a native speaker review
km-app.js, the privacy promises first.

## Deploy
Push to `main` → Netlify builds and goes live. Work on a branch and open a pull request; CI
(`.github/workflows/tests.yml`) runs the tests on every PR. Run them locally first:
`node tests/test-api.mjs`, `node tests/test-library.mjs`, `node tests/test-reminders.mjs` and `node tests/test-app-ui.mjs`
(needs `npm install --no-save playwright`).

## The life plan (Plan tab)
`u.plan` = `{why, goals:[{id, area, title, measure, help, why, by:'YYYY-MM', done, steps:[{id, text,
when:'YYYY-MM'|'YYYY-Qn', done}]}]}`; `u.tasks` = a person's own tasks; `t.tasks` = team tasks
(`done` is a map of who ticked). Six areas of life (`AREAS`, the same six the 1-on-1s will use).
Up to 8 goals at once; Home shows this month's and this quarter's open steps and team tasks.

## 1-on-1s (in the Plan tab)
`c:<id>` = a coaching: coach, mentee, team, status asked/active/ended, next date, sharePlan
(the mentee lets the coach see their life plan), meetings (a check-in 1–5 on the six areas,
going well, hard, shared notes, the coach's own notes `priv`, follow-ups). Asked from a
person's card ("Ask … to be my coach" / "Offer to coach …"); answered on Home. Roles come
from `coachRole_`: coach, mentee, leader (read-only, under-18s only).

## The Learn tab (📚, view `grow`)
Two doors: the **Library** (`library-app.js`, view `library`) and **Learn Khmer / English**
(`learn.js`, view `learn`), both copied from the Impact app with small changes listed at the
top of each file. Both load their data only when opened (`libLoad_`, `khLoad_`); index.html
loads `library-app.js` and `learn.js` AFTER app.js (they use `S`), and app.js starts on
DOMContentLoaded. What you've read, where you are in a book, XP, badges and the level test
stay on the phone (localStorage `gpa-lib-*`, `gpa-kh-*`); nothing goes to the server. 🔊 is the
phone's own voice; the 🎧 book player stays off (`LIB_AUDIO_ON`).
- **The books** (Uriah: "focused on the Cambodian young people angle rather than YWAM GP"): 37
  of the Impact Library's 58, on five shelves (faith, habits, people, work, lead), Start here
  ten. Each summary is the Impact one with its "For us at YWAM GP" rewritten as **"For you"**
  (`forUs`, English and Khmer) for a young Cambodian, and lines that spoke to staff or a base
  changed. The staff and business books and the Made-at-YWAM-GP guides were left out. Drafts
  by Claude; tests/test-library.mjs checks the shape, the Khmer and that no staff wording is left.

## The feed (Teams tab) and cheers (Home)
`feed` — the moments of everyone in my teams over 14 days, newest first; `clap` toggles a 👏
(never on your own); Home shows who cheered you this week (`cheers` from boot). The admin's
page is Me → Reports (`adminReports`, `adminAct`); Me → People you've blocked (`blockedList`).

## Reminders on the phone (Me → Reminders; web push, copied from the Impact app)
One a day at the hour each person picks (05–22, Phnom Penh), only when there's something to
do: habits not ticked today, the plan's steps for now (Mondays), team tasks due by tomorrow, a
1-on-1 today. Right away (`pushNow_`, if "alerts" is on): a coaching ask or offer, a task a
leader gives you (the team's name only, never the task's words). `netlify/functions/reminders.js`
runs `runReminders` hourly; `pushRun` stops an hour sending twice. The app makes its own VAPID
key pair on first use (`pushKeys`, server only; GPA_VAPID_PUBLIC/PRIVATE in Netlify win if set).
Subscriptions in `pushSubs`, only for push services in `PUSH_HOSTS`; gone ones (404/410) are
dropped. No library: RFC 8291 encryption and RFC 8292 signing with node crypto. sw.js shows
the notification. iPhones need the app on the Home Screen. tests/test-reminders.mjs decrypts
what's sent as a phone would.

## Today (Home) — the daily rhythm (Nov 2026, Uriah: "the app every gen Z Cambodian wants to use every day")
Home opens with my **why**, then **Today's 3** (`saveTop`), the **focus timer** (view `focus`:
15/25/50 min; the phone keeps the session in `gpa-focus` so it survives the screen locking;
5+ minutes count, `logFocus`), habits, and from 5 pm the **evening check-in** (mood 1–5 and
one thing I'm thankful for, `saveCheckin`). Sunday and Monday show **Your week** (habit days,
focus, days all 3 done, steps, mood). Stored in `u.daily[date]` (120 days), all private: others
see only focus minutes this week (`share.focus`), and 2/5/10/20/30 focus hours in a week is a
feed moment.

## Planned, in order
1. ~~Life plan: SMART life goals with quarterly and monthly steps; tasks (shared in a team).~~ Done Nov 2026.
2. ~~1-on-1s with a coach or mentor (a check-in on six areas of life, notes, follow-ups).~~ Done Nov 2026.
3. ~~Learn Khmer / English (the Impact app's flashcards and game) and the Library (books for youth).~~ Done Nov 2026.
4. ~~A Strava-like feed with 👏, reporting and blocking; reminders on the phone~~ Done Nov 2026.
   Still to do: Telegram sign-in (needs a bot from @BotFather).
5. A daily Bible verse and more Christian content (Uriah: later).
