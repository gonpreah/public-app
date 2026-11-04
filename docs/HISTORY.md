# How GonPreah started — the first session's history (Nov 2026)

A summary of the conversation with Uriah that set up this app, for any later session
to pick up from. CLAUDE.md has the rules; this file has the decisions and why.

## What Uriah asked for
> "I want to start building another app with some of the functions and much of the
> form from this app [the YWAM GP Impact app] and upload it to a new subdomain."

**Who it's for:** Cambodian and occasionally Western youth, 18–25 — and some under 18
(youth groups, school clubs). They take personality tests and walk through a process to
understand how God created them, build a life plan, then have practical tools to keep on
track while learning to overcome obstacles, including reading and language training.

**The social side is NOT staff-style.** Sign in with Google or Telegram and pick a
username; a searchable database of users you can build a team with; join a team at
sign-up, be in several teams, or share with just two or three friends. For seminars,
school clubs, YWAM bases, church groups and youth groups: team building, coaching, small
groups, accountability — see how a team works together and how each person progresses
toward their life goals.

**Strava-like:** profiles show name and photo, strengths and personality, and progress
people can show off — never the details.

**Christian influence:** a daily Bible verse and a few other things — "we'll work on
that one later".

## Decisions
- **Name:** GonPreah (កូនព្រះ). **Address:** app.gonpreah.org. **Repo:** gonpreah/public-app
  ("Public App", so it isn't confused with the Impact app).
- **Look:** "mostly the brand, font, colors etc." of the Impact app — copied, not shared.
- **Separate everything:** its own repo, Netlify site, Blobs store and accounts. No staff data.
- **Features chosen** (from the Impact app's list; ★ = Claude's picks, Uriah: "Stars plus 19"):
  1 brand · 2 Khmer-first · 3 installs as a phone app, offline · 4 reminders on the phone ·
  5 Google sign-in (+ Telegram, new) · 6 personality types · 7 GP Strengths ·
  8 the team's mix of types and strengths · 10 life goals (SMART, quarterly and monthly steps) ·
  11 weekly goals · 12 habit tracker · 13 tasks (shared in a team) ·
  14 1-on-1s with a coach or mentor · 18 Learn Khmer / English · **19 the Library**.
  Not chosen: 360 reviews, the staff weekly health check-in, the Google Calendar feed,
  prayer requests, Made-at-YWAM-GP guides, and all staff tools (ministry numbers, OKRs,
  HR, finance, hospitality, schedules, the portal, leave).
- **Under 18 — "some people under 18 will use it, ok":** Claude proposed, Uriah agreed:
  birth year at sign-up; under-18s never in the public search; found only inside teams
  they've joined; join only with a leader's code or link; first name only; teams with
  under-18s led by an adult the organisation knows; report and block, with reports to a
  safeguarding contact Uriah names (not built yet). Feed with 👏, no comments or private
  messages at first.
- **Repo private or public:** Claude suggested private (an app with minors; mistakes stay
  private; public → private can't be undone). Uriah asked why; either works. The repo as
  created is public.

## What the first version has (commit 3280b0c)
Google sign-in → username / name / birth year / team code; Home (streak, today's habits,
three weekly goals with sliders, invites); Teams (start one, join by code or link, the
team's people and mix, leader tools, invite adults found in the search); a person's card;
Me (photo, name, line about you, what others see — one switch each, language, theme);
the personality test and GP Strengths, ported from the Impact app; Khmer for every
screen (km-app.js drafts, unreviewed). Tests: 65 server checks, 23 in the browser.

## Next, in order
1. Life plan: SMART life goals with quarterly and monthly steps; tasks, shared in a team.
2. 1-on-1s with a coach or mentor.
3. Learn Khmer / English and the Library (books chosen for youth).
4. A Strava-like feed with 👏, reminders, Telegram sign-in, reporting and blocking + a safeguarding contact.
5. A daily Bible verse and more Christian content.

## Still to do to go live
- Netlify: new site from gonpreah/public-app; env `GPA_GOOGLE_CLIENT_ID` (a Google OAuth
  web client with https://app.gonpreah.org as an authorised origin); domain
  app.gonpreah.org + its CNAME record.
- A native Khmer speaker reviews public/km-app.js (privacy and safety lines first).
- Whether the header keeps the YWAM GP logo or GonPreah gets its own.

## Why the first session couldn't push
The session's GitHub connection is the account **swizzylee1599**, which could read the new
repo but not push (new org repos don't give members write automatically). Fix: the repo's
Settings → Collaborators and teams → add that account with Write — or connect Claude to
the account that owns the repo.

## Second session (4 Nov 2026)
- This session could push: the first version went up on the branch `first-version`.
- Built step 1, **the life plan**: a Plan tab with "my why", up to 8 SMART life goals in six
  areas of life (faith, family & friends, study & work, health, money, serving others), steps
  for each quarter and month, my own tasks, and team tasks set by leaders. Home shows the steps
  for now. Others see counts only, behind a new switch. Khmer drafts added (unreviewed).
  Tests: 93 server checks, 35 in the browser.
- Merged `first-version` into `main` (PR #1, tests green on GitHub). From here: one branch
  and one pull request per feature.
- Built step 2, **1-on-1s**, on the branch `one-on-ones`: ask a leader to be your coach (or
  offer to coach), a check-in on the six areas of life with 😟–😄, notes, the coach's own
  notes, follow-ups, the next date, and the mentee can let the coach see their life plan.
  For under-18s the team needs two leaders, and the other leaders can read (not write) the
  1-on-1s. Tests: 122 server checks, 48 in the browser.
- Merged the 1-on-1s (PR #2). Built step 3 on the branch `learn-library`: a **Learn** tab with
  the Impact app's Library reader and its Learn Khmer / English game. The Library is 37 of the
  Impact's 58 books, chosen for Cambodian young people, each "For us at YWAM GP" rewritten as
  "For you" in English and Khmer (six helpers wrote the rewrites in parallel). The game came
  across as it is; its level test stays on the phone. km.js brought up to date from Impact.
- Uriah: "Leave out ywam stuff." The header's YWAM GP logo became the GonPreah seal; the
  "YWAM life" word list left Learn Khmer; the faith books' 20 YWAM sentences (and their Khmer)
  were rewritten without the name. The books themselves stay.
- Uriah: no safeguarding contact needed — "limit direct messaging"; he is the admin. Built
  (branch `feed-safety`): the 👏 feed of the team's moments (no words of anyone's own), cheers
  on Home, report a person or a team, block (both ways), leaders remove a member's photo, and
  the admin's Reports page (remove a photo or line, suspend, close a team). The under-18 rules
  stay as they were. The admin is set by GPA_ADMIN_EMAILS in Netlify.
