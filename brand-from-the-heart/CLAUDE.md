# Brand From the Heart (brand-from-the-heart/)

A separate app from GonPreah, living in this folder of the repo. It has its own Netlify site (base
directory `brand-from-the-heart`), Blobs store (`bfh`) and env vars. It is for a YWAM Social Media
School class: students build a personal or ministry brand in English and Khmer, with Claude.
GonPreah's "no YWAM on screen" rule does **not** apply here: the Inspiration gallery shows YWAM's
logo, by Uriah's choice (Nov 2026: "load em").

- README.md: what it does, setup, deploy, the class flow.
- Uriah's decisions (Nov 2026):
  - load the real brand logos from the web (teacher uploads can replace them);
  - a new Netlify site;
  - all students are over 18, so peer comments are fine, and the teacher can hide them.
- Claude is called only in `netlify/functions/lib/claude.js` (structured outputs, cached system
  prompt, `claude-opus-5-5` by default). Jobs run in `generate-background.js` and the page polls
  `api.js job`.
- Only class members can start Claude jobs. Classes need `BFH_TEACHER_PASSWORD`.
- Every `t()` key in app.js/brand.js must exist in `public/i18n.js` with Khmer
  (tests/test-data.mjs checks this). All Khmer is Claude's draft, unreviewed.
- Logos are shown unaltered: never add CSS filters or recolouring to `.logo`.
- Tests: `node tests/test-data.mjs`, `node tests/test-api.mjs`, `node tests/test-ui.mjs`.
- Deploy only when Uriah says so (same rule as GonPreah).
