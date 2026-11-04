The app's two typefaces, served from here instead of Google Fonts (Oct 2026) so they are
ready before My Home draws and work offline — kept by the service worker (sw.js).

- Koulen (headings and the big numbers) — koulen-latin.woff2, koulen-khmer.woff2
- Kantumruy Pro (everything else; one variable file per script covers 400–700) —
  kantumruy-latin.woff2, kantumruy-latin-ext.woff2, kantumruy-khmer.woff2

Both under the SIL Open Font License 1.1 (OFL-Koulen.txt, OFL-KantumruyPro.txt). The
files are Google Fonts' own subsets (Koulen v30, Kantumruy Pro v12), unchanged; the
@font-face rules with their unicode-ranges are in teams.html's head.
