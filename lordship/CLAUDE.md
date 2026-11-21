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
- Tests: `node tests/test-api.mjs`, `npm run build && node tests/test-ui.mjs`.
- Deploy only when Uriah says so (same rule as GonPreah).
