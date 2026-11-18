# ❤ Brand From the Heart

A mobile-friendly web app for students at a Social Media School in Cambodia. **Khmer first**, with English one
tap away. Each student builds an authentic personal or ministry brand, then takes it to Claude (or any AI tool) to
make on-brand posters, graphics and Claude Motion videos.

**The journey:**
1. **Archetype quiz:** 14 situation questions in three parts (how you show up, what drives you, how you
   create). The result gives your archetype and your mix, how your brand may look and sound, content ideas
   and a verse. Claude gets the mix and every choice.
2. **Inspiration:** 25 well-known brands with their real logos, grouped into 7 archetypes.
   "I like this vibe" picks become taste signals.
3. **Heart interview:** 15 short questions in 6 sections, one per screen. Every typed question shows an
   example answer from one student, and there are follow-ups when an answer is short and seven visual
   "this or that" picks.
4. **Heart check:** Claude writes "this is who you are" in English and Khmer. The student edits it,
   and their version drives everything after.
5. **Five brand directions:** heart-true, bolder, softer, rooted in Cambodia, and a wildcard. Each has:
   - a palette of 5 colours with roles (adapted from a 56-palette library);
   - a font pairing with matching Khmer fonts (from 36 pairings);
   - 8 taglines, a bio, a mission statement and a "why I post" statement;
   - 5 content pillars, sample captions and hashtags;
   - voice do's and don'ts;
   - a poster preview.

   **Show me more like this** makes variations of any direction.
6. **Studio:**
   - mix and match colours, fonts and words from different directions;
   - swap any colour (tints and shades, library colours, or your own);
   - pick another font or tagline;
   - four sliders: warm↔cool, bold↔soft, modern↔classic, playful↔serious;
   - "Ask Claude" to make one part warmer, bolder, simpler, softer, more Khmer or more playful;
   - live mock-ups: Instagram post, story, poster, YouTube thumbnail, profile header.
7. **Brand package:**
   - the one-page brief and a ready-to-paste Claude Project block;
   - a universal AI prompt in English and Khmer;
   - a multi-page PDF guide;
   - a brand kit image for the camera roll;
   - a brand file (JSON) to re-load later;
   - from Claude: logo wordmark ideas, colour and type rules, do/don't examples, 5 Claude Motion
     prompts and 5 poster/graphics prompts;
   - a "save everything" checklist.
8. **Class:**
   - a personal link (no login);
   - sharing up to two directions with the class;
   - classmates vote and leave short encouraging comments.
9. **Teacher dashboard:**
   - every student's stage (not started, in interview, choosing direction, finished);
   - who looks stuck;
   - a gallery of finished briefs;
   - comment moderation;
   - optional logo uploads.

## The look

The app uses Uriah Lyford's brand:
- **Colours:** Paper `#faf6f0` and Ink `#17150f` do most of the work, Cobalt `#1f44ff` points (buttons,
  links, eyebrows), and Marigold `#ffb323` warms (highlights, and buttons on dark).
- **Type:**
  - Archivo for English headings and Hanken Grotesk for English text.
  - Koulen for Khmer headings and Kantumruy Pro for Khmer text.
  - One Caveat handwritten line.
- **Shapes and motion:** pill buttons, 14px cards with 2px inset lines, the asterisk spark as the mark,
  and a slow "rise" when a screen changes.
- **Themes:** the two brand themes, Paper (light) and Ink (dark).

## Also in the app (Nov 2026)

- **Classroom link and simple sign-in:**
  - The teacher's dashboard shows a QR code and a projector view for `/?class=CODE`.
  - Students open it and tap "I'm new" (type a name) or "I've been here" (tap their name).
  - No passwords, on purpose: students forget them. Each phone gets its own key, and a student
    can be signed in on several phones.
- **Speak your answers:**
  - 🎤 uses the phone's speech recognition: Khmer (`km-KH`) when the app is in Khmer, English when
    it's in English. Chrome on Android does Khmer well. On iPhone, students use the Gboard
    keyboard's 🎤 set to Khmer.
  - "Tidy with Claude" then fixes spelling and punctuation without changing their words, with Undo.
  - Claude itself can't hear audio; the phone turns speech into text first.
- **Your photo** in the thumbnail, story and profile-header mock-ups.
- **Logo files:** three PNGs of the name as a wordmark: main and "for dark photos" with
  see-through backgrounds, plus a square profile picture.
- **Is this on-brand?** Upload a screenshot of a post. Claude (vision) scores it 0–100 against the
  brand and lists what works and what to fix. The image is deleted after the check.
- **30-day content plan** from the content pillars, with a caption starter for each day.
- **Canva:** step-by-step for a Canva Brand Kit, plus copy buttons for the colours and the prompt.
- **Installable and offline-safe:** add to home screen (`manifest.json`, `sw.js`, `pwa.js`).
  Answers save on the phone and sync when the internet comes back.
- **For the teacher:**
  - Big screen mode with live votes on shared directions, a chart of the class's archetypes, and
    finished brands.
  - CSV export of every student and an all-briefs PDF.

## What's in the folder

```
brand-from-the-heart/
  netlify.toml, package.json
  public/                 the site (no build step)
    index.html, app.js, app.css     the student app
    teacher.html, teacher.js        the teacher dashboard
    brand.js                        colour maths, sliders, mock-ups, exports, kit image, PDF pages
    i18n.js                         every on-screen word, English + Khmer
    questions.js, quiz.js           the interview and the archetype quiz
    palettes.js, fonts.js, brands.js  the colour, font and inspiration libraries
  netlify/functions/
    api.js                          one POST endpoint: links, classes, saving, votes, comments, teacher
    generate-background.js          Claude jobs (background function, up to 15 minutes)
    lib/prompts.js                  what we ask Claude + the JSON schemas
    lib/claude.js                   the one place that calls the Anthropic API
  tests/                            node tests/test-*.mjs (see "Tests")
```

## Set up and deploy (Netlify)

1. **Make a new Netlify site** from this repository: *Add new site → Import an existing project*.
   - **Base directory:** `brand-from-the-heart`
   - **Build command:** leave empty
   - **Publish directory:** `brand-from-the-heart/public` (Netlify reads `netlify.toml`)

   Or deploy just this folder with the Netlify CLI: `cd brand-from-the-heart && npm install && npx netlify deploy --prod`.
2. **Add the environment variables** under *Site configuration → Environment variables*:

   | Variable | Required | What it is |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | yes | Your Claude API key from https://console.anthropic.com → API keys. Server only; it never reaches the page. |
   | `BFH_TEACHER_PASSWORD` | yes | The password a teacher types to make a class. Only people in a class can use Claude, which keeps your API bill to your students. |
   | `BFH_WORKSPACE_ID` | only for some keys | If your key starts `sk-ant-usr-` (an organization key not tied to a workspace), make a workspace in the Console and put its ID (`wrkspc_…`) here. |
   | `BFH_MODEL` | no | Default `claude-opus-5-5`. |
   | `BFH_MODEL_FAST` | no | Default `claude-sonnet-5-5`. Used for everything except the heart check and the five directions (about half the cost). |
   | `BFH_EFFORT` | no | Claude's effort: `low` · `medium` (default) · `high`. |
   | `BFH_STUDENT_DAILY` | no | Claude jobs per student per day (default 40). |
   | `BFH_CLASS_DAILY` | no | Per class per day (default 900). |
   | `BFH_DAILY_LIMIT` | no | The whole site per day (default 3000). |
   | `BFH_FALLBACKS` | no | `off` turns off Claude's server-side refusal fallback. |
3. **Redeploy** after adding variables, so the functions see them.
4. Netlify Blobs (the storage) is turned on automatically. Nothing else is needed.

**What it costs:** a full student run is about $0.50–$1 of Claude usage. That covers the heart check,
five directions, a couple of "more like this" and refinements, and the package. A class of 25
costs roughly $15–$25.

## In class

1. **The teacher** opens `https://<your-site>/teacher.html`, types a class name and the teacher
   password, and gets:
   - a **class code** (e.g. `K7QM3P`) and a join link `https://<your-site>/?class=K7QM3P`. Put it on
     the projector.
   - a **private dashboard link**. Bookmark it; it's the only key to the dashboard.
2. **Students** open the join link on their phones. They can take the quiz and browse Inspiration
   before joining, but Claude needs the class.
3. Each student's work saves on their phone and to their **personal link** (Class tab → "My personal
   link"). Ask them to copy it into their notes: it brings the brand back on any device.
4. **The dashboard** refreshes every 30 seconds:
   - who is where;
   - who looks stuck (no progress for 20 minutes, or a Claude error);
   - finished briefs;
   - comments (Hide anything unkind).

**Logos.** The Inspiration gallery loads each brand's real logo from the web (mostly Wikimedia
Commons), unaltered and credited to its owner, for teaching only. If one doesn't show, upload a
screenshot on the dashboard and it replaces the web logo for your class. Students are reminded to
take inspiration, not copy.

## Using the brand with Claude (what students do at the end)

1. Copy the **Universal AI brand prompt**.
2. In Claude, go to **Projects → New project**, and paste it into the project's **instructions**.
   Every chat in that project now starts on-brand.
3. Paste one of the **Claude Motion** or **poster** starter prompts into a chat and fill in the
   `[brackets]`.

The same prompt works pasted at the start of a chat in ChatGPT, Gemini or Canva AI.

## Tests

```
cd brand-from-the-heart
npm install
node tests/test-data.mjs      # the libraries' shape; every on-screen string has Khmer
node tests/test-api.mjs       # server rules, jobs, privacy (stand-in Claude, in-memory store)
npm install --no-save playwright && npx playwright install chromium
node tests/test-ui.mjs        # the whole journey in a phone-sized browser
node tests/serve.mjs          # a local preview with a stand-in Claude; teacher password "teach"
```

## Privacy

- A student's answers, heart check and drafts are theirs. Classmates see only the directions a
  student chooses to share: name, colours, fonts and one tagline.
- Votes and comments are seen by the student they're for and by the teacher.
- The teacher sees progress and finished briefs, never the interview answers.
- Personal links and teacher links are random keys; only their hashes are stored.
- Answers are sent to Claude (Anthropic's API) to make the brand.

## Khmer

All Khmer on screen and in the libraries is a draft by Claude. Have a native speaker read
`public/i18n.js` and `public/questions.js` first, then the libraries. Claude writes the generated
brand text in both languages. The teacher dashboard is English only.
