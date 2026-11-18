# Brand From the Heart (brand-from-the-heart/)

A separate app from GonPreah, living in this folder of the repo. It has its own Netlify site (base
directory `brand-from-the-heart`), Blobs store (`bfh`) and env vars. It is for a YWAM Social Media
School class: students build a personal or ministry brand in English and Khmer, with Claude.
GonPreah's "no YWAM on screen" rule does **not** apply here: the Inspiration gallery shows YWAM's
logo, by Uriah's choice (Nov 2026: "load em").

- README.md: what it does, setup, deploy, the class flow.
- **Khmer first** (Uriah, Nov 2026): a new phone opens in Khmer (`fresh()` lang 'km'); ខ្មែរ comes first in
  the switch. The teacher page is English.
- **Uriah's brand** (Nov 2026, from his "Uriah's Brand — What It Is & Why" deck): Paper/Ink with Cobalt
  pointing and Marigold warming (Marigold points on Ink). Archivo + Hanken Grotesk, Koulen + Kantumruy Pro
  for Khmer, one Caveat line (never on Khmer, which it can't draw). Pill buttons, 14px cards, the spark.
  The tokens are at the top of app.css.
- **Quiz and interview** (Uriah: "too many questions … too much answering in the storyline", "the
  archetype too basic"): the quiz has 14 questions in 3 parts with a deeper result; the interview has 15
  questions, each typed one with an `example` shown open.
- **Sign-in is simple on purpose** (Uriah: "keep security to a minimum as students often forget
  passwords"):
  - The class link shows the class roster (names only), and a student taps their name
    (`classRoster`, `signIn`).
  - `signIn` adds a key to `s.khs` (one per phone, last 10; `keyOk` checks `kh` or `khs`).
  - No PINs or passwords, and don't add any.
- **Simple login + class board** (Uriah: "a simple login process so they don't lose their info and the class
  can see each other's progress"):
  - The home screen leads with the class code; the phone remembers it (`bfh-lastclass`).
  - Students tap their name to sign in, and can sign out from the Class tab.
  - `classProgress` gives class members each other's name, stage, progress, archetype and finished brand
    (title, tagline, colours). Never answers.
- **Voice** (Uriah: "make sure Claude can listen to their voice in Khmer"): the Messages API can't take
  audio. The phone's SpeechRecognition (`km-KH`) writes the text, and the `tidy` job (Sonnet) cleans it
  up. On iPhone, students use the Gboard 🎤 in Khmer.
- **Models:**
  - `claude-opus-5-5` for the heart check and the directions.
  - `claude-sonnet-5-5` (`{fast:true}` → `BFH_MODEL_FAST`) for more, refine, package, plan,
    check and tidy.
  - `BFH_WORKSPACE_ID` is sent as `anthropic-workspace-id`, because the live key is an
    organization key not scoped to a workspace.
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
