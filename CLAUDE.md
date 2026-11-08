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
`u.plan.vision` (the statement, up to 1500 characters with its line breaks) and `u.plan.word` (a
word for the year) come from the Life Journey (below).

## The Life Journey (Plan tab → view `journey`; my vision → view `vision`)
Nov 2026, Uriah: make the life plan "a fun Q&A journey" mixing self-authoring, Donald Miller,
the Hero's Journey and Living Forward. Seven stops in hero's-journey order (`JR_STOPS` in app.js):
where you come from (past: best moment, a hard time, what it taught), who you are (gifts, flow,
what holds you back), the call (what breaks your heart, who to help, the dream), the dragons (a
fear, the future to avoid, a truth to hold), your guides (who helped, who walks with me, who I'll
guide), the future you want (five years in each of the six areas, one year), your legacy (the
70th birthday, three words, a word for the year). One question a screen, chips (`JR_OPTS`, ids
only on the server) or a short text; every question can be skipped. In our own words: no text
from the books. The app writes the vision on the phone (`visionMake_`, in the person's language)
and a one-line why (`missionMake_`); they edit it, then `journey` 'vision' keeps it. Answers are
`u.story` = {a, done, finished} — only `selfOut_` sends them: no card, coach or leader ever sees
them; a coach the mentee shares their plan with sees the vision and word. XP: 20 a stop, 60 the
vision (once ever), 5 a day for reading it again. Home shows my vision (word, why, "Becoming",
one five-year line or the truth for today, rotating by day); the Plan tab offers each five-year
line as a goal ("Turn your dreams into goals"). Finishing is a feed moment (no words). In Khmer
the "dragons" are ឧបសគ្គ (obstacles): the naga is a good figure in Cambodia.
**The life wheel** (Living Forward's "where am I now"): the future stop opens with each area rated
1–5 (`a.wheel`); `journey` 'wheel' checks again (all six, 10 XP once a month), kept in
`u.story.wheels` (last 12, one a day); my vision shows the bars and the change since last time,
and Home nudges a month on. Each stop's done screen shows "What you said". **Share my word**
(view `share`, `S.shareKind='word'`): a 1080×1920 picture — first name, the word, "Becoming" —
nothing else from the vision. Sundays' reminder adds "read your vision again" (`vision`).

## Phones in a browser (iPhone Safari)
Safari zooms into a text box under 16px and leaves the page zoomed and sliding about, and zooms
on a quick double tap: so text boxes are 16px on touch screens (`pointer:coarse`) and the page is
`touch-action:manipulation` on buttons and chips only — not the whole page (pinch-zoom still works). While the keyboard is up (a text box has
focus and the visible screen is clearly shorter), `body.typing` hides the bottom bar so it can't
sit on the box. tests/test-app-ui.mjs holds both. **Debugging on a real phone**: open the app with
`?debug` — a panel shows taps, focus, clicks, redraws and errors, only while `?debug` is in the
address. **Staying up to date**: a Home Screen app stays in memory for days, so coming back to the
app it checks app.js's ETag (HEAD, past the service worker) and reloads if there's a new version,
and reloads anyway after 30 minutes away (never while typing or in a focus session; the tab is kept).

## The five gifts (APEST), and going deeper on every test (Me → How God made you)
Nov 2026, Uriah: "an APEST test for 5 fold ministry with explanation of results" and "a deeper
understanding part for each of the personality tests including what … career sphere their gift
might be most effective in". **Five gifts** (Ephesians 4:11; view `atest`, results `agift`):
`public/apest.js` — this app's own 30 statements (6 a gift, ids `a1`…`t6`, answered 1–5) and five
descriptions in English and Khmer (what it is, how it builds others up, at its best / unhealthy,
strengths, watch-outs, the gifts it needs, growth steps, spheres, example work, how Jesus showed it,
references only). The server scores (`apestScore_`, `saveApest`; 50 XP once): `u.apest` =
{answers, scores 0–100, top (all five, strongest first), share}. Others see only the two strongest,
behind `share.apest` and its own `share` flag; taking it is a feed moment naming only the gift.
Not copied from any published APEST test. **Going deeper**: `public/deeper-types.js` (`GP_PDEEP`:
for each of the 16 types — at your best, with people, under stress, with God, ways to grow, spheres
and why, example work) and `public/deeper-strengths.js` (`GP_GSDEEP`: for each of the 34 — use it,
a partner strength, spheres, example work), shown on my own results only (they speak to "you").
**Spheres** (`SPHERES` in app.js): family, church, education, government, media, arts, business,
health. Me → "Where your gifts may shine" adds up the spheres of my type, Top 5 and two strongest
gifts (`sphereVotes_`). These three files load only when a screen needs them (`needJs_`); they are
drafts by Claude, English and Khmer, unreviewed. tests/test-library.mjs checks their shape.

## The Sunday reset, badges, and the first day
**Sunday reset** (view `reset`; Home shows it Saturday to Monday until done, `resetWeek_`): five
steps — look back (the week's numbers, what went well), what was hard, look up (my word and why;
which part of life needs care), look ahead (three goals, with my plan's open steps to tap in),
give the week to God (a short prayer in our own words). It saves the week's goals (`saveWeek`)
and `weekReset` keeps `u.resets[monday]` = {good, hard, area} (26 weeks, private; 30 XP a week).
Sunday's reminder adds "Sunday reset" until it's done. **Badges** (Me → Badges, view `badges`):
twenty, worked out on the phone from what's already there (`badgeList_`: streaks, Today's 3,
focus hours, the three tests, the journey, vision reads, the wheel, resets, steps, goals,
devotionals, a reading plan, answered prayers, check-ins, a team, friends, level 10) — nothing new
stored or shared; a new one pops up once (`badgeWatch_`, the phone remembers `gpa-badges`). **The
walkthrough** offers the Life Journey for finding my why; it opens right after. Screens that slide
in slide only when the question changes (`body.still`), not on every redraw.

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

## Team challenges and the share card
**Challenges** (team page; `challenge` handler, `t.challenges`): a leader starts one — a title
(or one of `CH_IDEAS`), an emoji, 3–40 days, from today or tomorrow. Members choose to join and
tick each day; the team sees who's in and each one's day count, nothing more. Joined ones show
on Home ("Your challenges"); finishing every day is a feed moment (its title only for people in
that team). **Share my week** (📤 on Home, view `share`): a 1080×1920 picture drawn on the phone
(canvas) — first name, streak, focus this week, habit days, days all 3 done, and the type if
shared; never goals, habits or the why. The person shares or saves it themselves.

## XP, levels and the first-day walkthrough
**XP** (api.js "XP and levels"): a habit ticked 5, one of today's 3 done 5 (all three +10), focus
1 per 2 minutes, the check-in 5, a step 15, a goal 100, a challenge day 10, a week at 100% 30, a
test 50 — each once, by a key in `u.xpLog`, so undoing takes it back and ticking on and off earns
nothing. `u.xp` is the total; `levelOf_`: 100 XP to level 2, then 50 more each level; titles 🌱 Seed
→ 🏛️ Angkor (the same names as Learn Khmer's ranks). Home shows the level and a bar, pops "+n XP"
and celebrates a new level (`xpWatch_`). Others see the level behind `share.level`; every 5th
level and each new title is a feed moment. **Walkthrough** (view `welcome`): a new account with
no habits and no why, on a phone that hasn't seen it (`gpa-onboarded`) — welcome, my why, a few
habits, my team; every step can be skipped.

## Faith daily: Bible reading plans and a prayer list (Learn tab → Bible & prayer, view `faith`)
Plans (`READING_PLANS` in api.js, sent with boot) are **passages only** ("John 3") — the app
never carries the Bible's text, so nobody's translation is copied; people read in their own Bible
or Bible app and tick the day (`reading`: start/tick/stop; up to 3 at once; 10 XP a day, once).
Book names in Khmer come from the KBC list (`BOOKS_KM` in app.js). Home shows today's reading;
finishing a plan is a feed moment. The prayer list (`prayer`: add/answer/drop) is private.

## Streak freezes, the team's week, and smarter reminders
**Freezes 🧊** (`applyFreezes_`): every 7 days of streak earns one (keep 2, `u.freezes`); missed
days are covered by themselves at start-up or the next tick when there are enough freezes for all
of them (`u.frozen`), and the streak lives on (`streakOf_(days, frozen)`). **The team's week**:
`u.xpWeeks[week]` (8 weeks) feeds a top-5 "This week" on the team page — XP numbers only, from
people who show their level. **Reminders** also say: plan your day (a morning reminder with no
Today's 3 yet), today's Bible reading (a plan going, nothing read today), and challenges to tick.

## Friends, the leader's pulse, and today's devotional
**Friends** (`friendAsk`/`friendAnswer`/`friendDrop`/`friendsList`/`friendNudge`; Home and view
`friends`): both agree; adults ask adults by username, and with anyone **under 18** the two must
share a team — the friendship shows only while they do (`friendOk_`). Friends see each other's
streak, today, and their streak together (behind `share.streak`); a 👋 nudge is a fixed
notification, once a day — no messages. **Team pulse** (`teamPulse`, view `pulse`, leaders only):
each member's last day in the app (`u.seen`) and, behind their switches, streak, habit days, focus
and XP this week; a 💛 cheer (`leaderCheer`) is a fixed notification, once a day. **Today's
devotional** (`public/devotions.js`, 31 in our own words, English and Khmer — a passage to read,
a reflection, a question, a prayer; no Bible text): on Home by day of the month, view `devo`;
"Amen" marks it read (`devoDone`, 5 XP). tests/test-library.mjs checks the devotionals.

## Planned, in order
1. ~~Life plan: SMART life goals with quarterly and monthly steps; tasks (shared in a team).~~ Done Nov 2026.
2. ~~1-on-1s with a coach or mentor (a check-in on six areas of life, notes, follow-ups).~~ Done Nov 2026.
3. ~~Learn Khmer / English (the Impact app's flashcards and game) and the Library (books for youth).~~ Done Nov 2026.
4. ~~A Strava-like feed with 👏, reporting and blocking; reminders on the phone~~ Done Nov 2026.
   Still to do: Telegram sign-in (needs a bot from @BotFather).
5. ~~Christian content daily~~: reading plans and a prayer list, Nov 2026. A verse of the day
   with its text waits for a Bible translation we have permission to use.
