# Lordship (lordship/)

A separate app from GonPreah, in this folder of the repo: its own Netlify site (base directory `lordship`),
Blobs store (`lordship`), env vars (`LS_*`), tests and CI (`.github/workflows/lordship-tests.yml`).
Uriah & Naomi's 5-day DTS teaching "Lordship: All In, Full of Joy" (Nov 2026). Students 18–25, mostly
Western, English only. GonPreah's "no YWAM on screen" rule does **not** apply here.

- README.md: features, setup, env vars.
- **React + Vite** (Uriah's brief). `src/core/` is shared (api, store, router, Coach, theme); the teaching is
  a module in `src/teachings/lordship/` (`index.jsx` lists its tools; `content.js` holds every word, the
  scripture, people groups and the Connect links) — ready for a multi-teaching hub.
- **Uriah's brand**: tokens and components copied from Brand From the Heart's app.css (Paper/Ink,
  Cobalt points, Marigold warms; Archivo, Hanken Grotesk, one Caveat line; the spark).
- **Claude** only in `netlify/functions/lib/claude.js` (the BFH setup: cached system prompt, fallbacks,
  `claude-opus-5-5`, effort `low` for short coaching turns). Prompts in `lib/prompts.js`: Uriah's coach
  prompt + one per tool; `distill` schemas turn a chat into something to save. Turns run in
  `coach-background.js`; the page polls `api.js coachJob`; the job is deleted once read.
- **Access**: the class code (admin page, or `LS_CLASS_CODE`) for everything; church mode (no code) only
  for tools marked `church` (wheel, laydown, notso) on the server and in `index.jsx`.
- **Privacy**: student data in localStorage (`gp.lordship.*`), and — once they join — synced to their own account (`sd:<sid>`,
  loaded only with their key). Uriah sees names, never answers. Questions keep text, topic, day, status (never the account).
- Scripture is the World English Bible (public domain) — keep it that way unless a licence is in hand.
- **Nov 2026, second round** (Uriah: "do them all … more dynamic … light, dark"):
  - each day ends with **Respond** (`respond` in content.js → tools) and "I've responded today" (`lordship.daysDone`, the ring on Home);
  - the commitment's 30/90-day check-ins download as a calendar file with reminders (`core/ics.js`);
  - **Save my work** (`data` tool): a backup found only by its code (`backupSave`/`backupLoad`, `bk:<code>`, 180 days) or a file;
  - the coach's reply shows while it's written (`partial` on the job, polled every 0.7 s);
  - wheel history (`lordship.wheelHistory`, a dashed line for the last check, ▲▼ changes);
  - **anonymous class totals**, opt-in on the wheel page (`shareTotals`/`adminTotals`, `an:<class>:<random id>`: numbers only);
  - "Need to talk to someone?" on every coach (`help` tool, `HELP` in content.js);
  - the **Thursday panel screen** (`#/panel`) and the **Sunday screen** (`#/church/screen`) for the projector;
  - offline: `public/sw.js` (app shell) and slides kept in Cache "ls-slides";
  - light / dark / follow the phone (`core/theme.jsx`, `gp.theme`, `<html data-theme>`), and livelier visuals (day colours, a glowing hero, wheels that grow, little bursts).
- **My plan vs God's plan** (Nov 2026, Uriah: "all about my plan versus God's plan … I don't really love the coach thing"):
  the centre of the app. The `laydown` tool (id kept for the server's church list) is now My plan vs God's plan (Proverbs 16:9):
  nine areas (`LIFE_AREAS`: each with a WEB verse and prompts for "my plan" and "God's plan"), two columns, "How close are they?"
  (two circles that move together, `Venn`, `ALIGN`), then "Not so, Lord" / lay down / take up → the list (`lordship.plans`).
  The wheel sends its lowest spokes there (`openFromWheel`, custom areas `lordship.planAreas`); My Scroll is "my plan for my
  life" vs "what God might have written"; God thing or good thing is my plan vs what the Father is doing, five checks, my own
  verdict. **The coach is optional everywhere**: collapsed to "Stuck? Ask for a question" (`Coach optional`, default on).
- **More (Nov 2026):** a surrender prayer per area made from their own words (`prayerFor`, no AI); how-close history per
  area (`p.hist`); "My plan vs God's plan" at a glance on Home (`PlansGlance`); a first-visit "How this works" card
  (`lordship.welcomed`); commitment ideas from their take-ups; **My Lordship week** (`week` tool): everything they wrote on
  one page to share or print/PDF (`@media print`).
- **People group photos** (Nov 2026, Uriah: "add photos to the people groups"): `public/people/<id>.jpg` (≤960px), each
  CC BY / CC BY-SA from Flickr via Openverse, credited on the card (`photo` in `PEOPLE_GROUPS`: caption, by, licence, link).
  Some show where a group lives, not its people (Kuy, Tai Dam, Brao…) — the caption says what's shown. tests/test-data.mjs
  checks every group has one. A better photo (one Uriah took, with permission) can replace any file.
- **Install** (Nov 2026, Uriah: "really easy to add to their homepage"): an install card on Home (`core/Install.jsx`):
  one tap where the browser allows (`beforeinstallprompt`, caught early in main.jsx), the three iPhone taps with an arrow
  to Share, and "copy the link, open Safari/Chrome" in Instagram/Facebook in-app browsers. The manifest is made per link
  (`netlify/functions/manifest.js` at `/app.webmanifest?class=CODE` / `?church=1`) so the Home Screen app opens straight
  into the class — an iPhone's Home Screen app doesn't share Safari's storage. PNG icons in `public/`. Admin → Class & links
  → "Download QR for slides". The live class code is **LORDSHIP** (set Nov 2026; change it on the admin page each new class).
- **Accounts + Day 1 game** (Nov 2026, Uriah: "a day one fun game … an icebreaker … their name and a basic 4-pin thing"):
  - **Join the class** (`core/Join.jsx`, required in class mode): name + 4-digit PIN (`join`/`signIn`; PIN as salted scrypt,
    one name per class, 8 wrong tries locks the name for the hour; the admin sets a new PIN from Admin → Class list).
    `core/account.js` saves every change to the account 2.5 s later (`syncSave`/`syncLoad`; the newer copy wins on sign-in),
    so a new phone or the iPhone Home Screen app gets their answers. Then one fun fact (`setFact`).
  - **Day 1 game** (`lib/game.js`): Admin → "Day 1 game & join wall" (`#/game`, projector): names pop up as they join, then
    rounds alternate "Who wrote this?" (a fun fact; tap a name; a right guess scores) and this-or-that polls (`POLLS`, counts
    only); Reveal, Next, a leaderboard. Phones: the `game` tool (polls `gameState` every 2.5 s) and a banner on Home while
    it's on. The lobby has "Ask Uriah anything for the week" (the anonymous box).
- **Lordship profile quiz** (Nov 2026, Uriah: "a short lordship test that's kind of funny … I'll die for Jesus but don't
  take away Netflix"): `quiz` tool (class + church), 8 questions (`QUIZ`), 8 profiles (`PROFILES`: Netflix Martyr, Bentley
  Believer, Ring by Spring, Sahara Saint, Gym-Exempt Missionary, Wi-Fi Warrior, Plan A Planner, People-Pleaser Prophet — each
  a joke with a true edge: "Not so, Lord", lay down, take up). "Show your neighbour" (full screen), and in class "Put it on the
  big screen" (`quizSave`, `qz:<class>:<sid>`) → the game screen's quiz phase (`gameAdmin` 'quiz'): names + profiles pop up
  with a tally. Phones in the game get the quiz automatically.
- **Simpler (Nov 2026, Uriah: "so many functions … a lot of typing"):** Home shows six tools (quiz, game, my plan vs God's
  plan, wheel, commitment, ask); the rest sit under "More tools" (`more: true`). Gone from class: the standalone "Not so, Lord" (it's a field in My plan vs God's plan; church keeps it), Save my work (accounts sync; it's
  under Me). Bottom bar: Home · Sessions · My plan · Ask.
- **The teaching as taught** (Nov 23 2026, from Uriah's Lordship Week slides): the week lives in James — one chapter a day
  (`d.james`, Mon 1 … Fri 5; the James card on Home and each day, "I read it" in `lordship.james`), memory verse James 1:22,
  Tue–Fri check-in "What did you lay down or take up since yesterday?", a Say · Mean · Do study card (`WEEK` in content.js).
  Each day has the slides' title, sticky line (`d.sticky`, the yellow note), scripture, breakout questions, a listening prayer
  (`d.listen`) and the response. Wednesday: **Lay down a right** (`rights`, `RIGHTS`, saved to the list). Thursday: the mentor
  map is Paul / Barnabas / Timothy (`MENTOR_ROLES`, `m.kind`) with one name circled to invite this month. Tuesday: daily acts
  of obedience as habit chips (`DAILY_OBEDIENCE`). Friday: **My 2 · 5 · 10** is back (`growth`): firm foundations, force for
  change, frontier missions (`HORIZONS`). The wheel's rest is in Strength (body, rest & finances).
- **Base-wide profile quiz** (Nov 2026, Uriah: both classes "do the profile all together … while we watch the live results"):
  `/?quiz` → `#/quiz` (tools/PubQuiz.jsx): no class code, PIN or account — a first name and DTS / DBS / Staff / Visitor, then
  the profile quiz; the result goes straight to the big screen (`pubQuiz`). `#/quiz-results` is the projector: a bar per
  profile, live every 3 s, All / DTS / DBS / Staff tabs, the latest first names (Hide names), Reset behind the admin password
  (`pubQuizReset`). Everything is in the blob key (`pq:<phone id>:<time>:<group>:<profile>:<name>`), so the results are one
  list call and a retake replaces; never in the class list. Each profile has a cartoon (tools/Avatars.jsx, SVG).
- **More than one class** (Nov 2026, Uriah: both classes joined under LORDSHIP — "move to a DTS class that I can view, just
  them"): the main class (`cfg`) plus more in `classes` ({CODE: {name, weekStart}}); every class's data is under its code.
  Admin: a class picker at the top (class list, totals and the Day 1 game follow it, `cls`; sessionStorage `ls-admin-cls`),
  "+ New class" (`adminClassAdd`, its link + QR), select students → Move (`adminMove`). Students: Me → Move to another class
  with its code (`moveClass`); opening the new class link while signed in offers "Move me to …"; "I've joined before" with the
  new link and their name + PIN moves them (`signIn`). `moveStudent` moves the account, name, keys and quiz result (answers
  are keyed by student) and leaves `mv:`/`mvn:` pointers, so a phone or Home Screen app on the old class follows them
  (`classCheck` → `moved`, `student()` follows the pointer).
- **Live polls** (Nov 2026, Uriah: a Zoom call with "mostly strangers" — "no sign-in … live results"; surrender "but not have
  it be shameful"): `/?poll=<id>` → `#/poll/<id>` (tools/LivePoll.jsx), no name or account, one tap a question; the shared
  screen is `#/poll-results/<id>` (the link big with "Copy link for the chat", both questions as bars in %, live every 3 s,
  Reset behind the admin password). Words in `LIVE_POLLS` (content.js), option ids in `LIVE_POLL_IDS` (lib/game.js; the
  data test checks they match). Keys `lp:<poll>:<phone id>:<time>:<answers…>` — a retake replaces, nothing else is kept.
  First poll `never` ("Never, Lord", Matthew 16:22): twelve ordinary areas (plans, money, phone, marriage … "something just
  between me and God") — no sins listed, on purpose — then "if Jesus asked today you'd say…"; it ends with John 21:17.
  Second poll `staff` ("Pick it back up", Moses' staff, Exodus 4:2–4, 4:20; Uriah: "picking up that exact same thing, but in
  a redeeming way"): what's in your hand (the same twelve areas; their "Never, Lord" pick is marked, `from: 'never'`), then
  that area picked back up God's way (`PICK_UP`: a title, how, a WEB verse, a question to ask God, one small step), then how
  they'll pick it up this week. The shared screen adds "Most in our hands: … → picked back up: …".
  **In class** (Nov 24, Uriah: "put them in the app so I can easily do them again today as a class"): Home → "Live class polls"
  (tools `never`, `staff`; `poll: true`) runs them with `room` = the class code — results only that class's (`lp:<poll>@<class>:…`,
  `pollKey`), apart from the Zoom run. Admin: buttons for the picked class's results (`#/poll-results/<id>/<class>`); the
  room link is `/?poll=<id>&room=<class>`.
  In class the done screen keeps it: "Never, Lord" → "Put it on my lay down list" (`addToList`); Pick it back up → "Daily
  habit: …" (`PICK_UP[area].habit`, `addHabit`).
- **Small things (Nov 24):** Home's today card shows today's response tools as one-tap chips; projector screens (game, panel,
  quiz and poll results) have a ⛶ full-screen button (`FullScreen` in App.jsx); Admin → Class list has "Find a name" and
  "Select shown" for moving people.
- Scripture was checked against the WEB text from bible-api.com (Nov 2026).
- Tests: `node tests/test-api.mjs`, `npm run build && node tests/test-ui.mjs`.
- Deploy only when Uriah says so (same rule as GonPreah).
