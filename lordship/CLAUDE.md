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
- **Privacy**: student data only in localStorage (`gp.lordship.*`); questions keep text, topic, day, status.
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
- Scripture was checked against the WEB text from bible-api.com (Nov 2026).
- Tests: `node tests/test-api.mjs`, `npm run build && node tests/test-ui.mjs`.
- Deploy only when Uriah says so (same rule as GonPreah).
