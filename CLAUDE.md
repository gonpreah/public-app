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
in index.html's head and the core of `app.css`. Fix a bug there in both apps.

## The name
On screen it is **GonPreah** / **កូនព្រះ**. "YWAM GP" rules from the Impact app don't
apply here, except that the shared personality and strengths files say "YWAM GP's own".

## Files
- `public/index.html` — the page: head, fonts, theme tokens, splash, header, scripts.
- `public/app.js` — the whole app: state `S`, `render()`, a function per screen, `bind()`.
- `public/app.css`, `public/km-app.js` (Khmer drafts for this app's own words — see Khmer),
  `public/sw.js` (network first; bump SHELL when PRECACHE changes), `public/manifest.json`.
- `netlify/functions/api.js` — the backend: one POST endpoint, `{fn, args}` → HANDLERS.
- `tests/` — `test-api.mjs` (server rules), `test-app-ui.mjs` (the app in a phone browser),
  `env.mjs` (in-memory store, a stand-in for Google, a local server), `serve.mjs` (preview).

## Accounts
Google sign-in (`loginGoogle` / `register`), then a username (unique, 3–20 of a-z 0-9 _ .),
a name and a birth year. A phone keeps a random device token (hashed on the account); every
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
- No comments or private messages yet: with under-18s on the app, those need reporting,
  blocking and a safeguarding contact first.

## Khmer
`km.js` (copied from Impact: REVIEWED_KM read by native speakers, PENDING_KM not) wins;
`km-app.js` adds this app's own words — **all drafts by Claude, unreviewed**. Every `t()`
string must have Khmer; check before shipping a new screen. Have a native speaker review
km-app.js, the privacy promises first.

## Deploy
Push to `main` → Netlify builds and goes live. CI (`.github/workflows/tests.yml`) runs both
tests on every PR. Run them locally before pushing: `node tests/test-api.mjs` and
`node tests/test-app-ui.mjs` (needs `npm install --no-save playwright`).

## The life plan (Plan tab)
`u.plan` = `{why, goals:[{id, area, title, measure, help, why, by:'YYYY-MM', done, steps:[{id, text,
when:'YYYY-MM'|'YYYY-Qn', done}]}]}`; `u.tasks` = a person's own tasks; `t.tasks` = team tasks
(`done` is a map of who ticked). Six areas of life (`AREAS`, the same six the 1-on-1s will use).
Up to 8 goals at once; Home shows this month's and this quarter's open steps and team tasks.

## Planned, in order
1. ~~Life plan: SMART life goals with quarterly and monthly steps; tasks (shared in a team).~~ Done Nov 2026.
2. 1-on-1s with a coach or mentor (a check-in on six areas of life, notes, follow-ups).
3. Learn Khmer / English (the Impact app's flashcards and game) and the Library (books for youth).
4. A Strava-like feed with 👏, reminders on the phone, Telegram sign-in, reporting and blocking.
5. A daily Bible verse and more Christian content (Uriah: later).
