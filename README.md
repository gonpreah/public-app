# GonPreah

The public app at **app.gonpreah.org**: personality type, GP Strengths, habits, weekly
goals and teams, for youth in Cambodia. Khmer first. See CLAUDE.md for how it works.

## Run it on your computer
    npm install && npm install --no-save playwright
    node tests/test-api.mjs       # the server's rules
    node tests/test-app-ui.mjs    # the app in a phone-sized browser

## Going live (once)
1. Netlify → Add new site → Import from GitHub → `gonpreah/public-app`. Build settings
   come from netlify.toml.
2. Site configuration → Environment variables: `GPA_GOOGLE_CLIENT_ID` — a Google Cloud
   OAuth 2.0 *Web* client whose Authorised JavaScript origins include https://app.gonpreah.org.
   And `GPA_ADMIN_EMAILS` — the Google email(s) of the admin, who sees reports (comma-separated).
3. Domain management → Add domain → `app.gonpreah.org`, then add the CNAME record Netlify
   shows (app → <site>.netlify.app) where gonpreah.org's DNS is managed.
