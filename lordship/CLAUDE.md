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
- Scripture was checked against the WEB text from bible-api.com (Nov 2026).
- Tests: `node tests/test-api.mjs`, `npm run build && node tests/test-ui.mjs`.
- Deploy only when Uriah says so (same rule as GonPreah).
