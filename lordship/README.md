# ✳︎ Lordship: All In, Full of Joy

A mobile-first web app for Uriah and Naomi Lyford's 5-day DTS teaching on Lordship (GonPreah).
React + Vite, Netlify Functions + Blobs, Claude for the coaching tools. It's built as a self-contained
module (`src/teachings/lordship/`) so it can be merged later into one GonPreah teaching hub with the
Call of God and Brand Builder apps.

## What's in it
**Class view** (opened with the class link `/?class=CODE`, or by typing the code):
1. **Daily sessions** Mon–Fri: title, big idea, scripture with the full text (World English Bible, public
   domain), breakout questions, the day's slides (viewed in the app, PDF download, PPTX download if
   uploaded, or a link), and my notes.
2. **Heart, Soul, Mind & Strength wheel** (Mark 12:30): 9 outer areas (coaching) and 9 inner areas
   (counselling), rated 1–10, drawn as two wheels coloured by heart/soul/mind/strength. The coach helps
   pick one thing to lay down and one to take up.
3. **Lay Down, Take Up coach**: money, romance, health, where I live, my role on team, education, mentors.
   Saved to a personal list.
4. **Stay HOT**: a 9-question honesty check + a **mentor map** showing gaps.
5. **My Scroll** (Luke 4): write what you sense God calling you to; the coach asks discernment questions
   and shapes a short statement.
6. **God thing or good thing?** (John 5:19 + your scroll).
7. **Self-Development Plan**: 2/5/10 years × skills, language, education, health, with idea chips.
8. **Daily habits** from your take-ups, with streaks.
9. **Throw-down commitment**: write, declare (full-screen), share with a mentor; check-ins at 30 and 90 days.
10. **Anonymous question box**: only the words, a topic and the date are stored.
11. **People group of the day** (Cambodia, Laos, South-East Asia) with a prayer prompt.

**Church mode** (`/?church` — no code): the "Not so, Lord" reflection, the wheel, Lay Down Take Up, the people
group, ways to join God's mission, and a small Connect page with the "Support a Cambodian Leader" button.

**Admin** (`/#/admin`, password): class name, code and week start; upload each day's PDF/PPTX (up to 60 MB,
sent in 3 MB parts) or a link; QR codes for the class and church links; the question box — mark
"Answer in class", "Thursday panel", "Answered", hide or delete.

**Also:** each day ends with a "Respond" step that opens that day's tools; calendar reminders for the
30/90-day check-ins; "Save my work" (a backup code or a file); wheel history; the coach's replies appear as they're
written; a "Need to talk to someone?" page on every coach; anonymous class totals (opt-in); a Thursday panel screen
and a Sunday screen for the projector; works offline once opened; light and dark mode.

## Privacy
Everything students write stays in their phone's localStorage (`gp.lordship.*`). The server keeps a coaching
turn only until it's answered, then deletes it. Questions keep no name, account, device or IP.

## Set up on Netlify (a new site)
1. Add new site → this repo → **Base directory `lordship`** (build `npm run build`, publish `dist`, from netlify.toml).
2. Environment variables:
   - `ANTHROPIC_API_KEY` (secret) — the same key setup as Brand From the Heart.
   - `LS_WORKSPACE_ID` — if the key is an organization key not scoped to a workspace (like BFH_WORKSPACE_ID).
   - `LS_ADMIN_PASSWORD` — the admin page's password.
   - Optional: `LS_CLASS_CODE` (a code before you set one on the admin page), `LS_MODEL` (default
     `claude-opus-5-5`), `LS_EFFORT` (default `low`), `LS_CAP_DAY` (coach turns a day, 3000),
     `LS_CAP_CHURCH` (church turns a day, 1000), `LS_CHURCH_COACH=off` (church mode without the coach),
     `LS_FALLBACKS=off`.
3. Fill in the Connect links in `src/teachings/lordship/content.js` (`LINKS`, all marked PLACEHOLDER).

## Develop and test
```
cd lordship && npm install
npm run preview          # build + local server with a stand-in coach: http://localhost:8890 (code TEST1, admin "admin")
node tests/test-api.mjs  # server rules
npm run build && node tests/test-ui.mjs   # the app in a phone-sized browser (needs playwright)
```
