# Whoop Dashboard

A minimal personal dashboard that connects to your Whoop account and shows
your latest recovery, sleep, strain, and workouts — the same idea as the
"WHOOP runs my life" YouTube build, but written from scratch for you.

No database required: your Whoop login tokens are stored in an encrypted
browser cookie, so the only accounts you need are Whoop, GitHub, and Vercel
(all free).

---

## 0. What you need installed

- **Node.js** (v18 or later) — https://nodejs.org (download the LTS version, run the installer)
- **VS Code** (optional but recommended for viewing/editing code) — https://code.visualstudio.com
- A **GitHub** account — https://github.com/signup
- A **Vercel** account — https://vercel.com/signup (sign up with your GitHub account, it's easiest)
- A **Whoop** account with an active membership (required for API access)

---

## 1. Register a Whoop developer app

1. Go to https://developer-dashboard.whoop.com and log in with your Whoop account.
2. Create a new app (any name, e.g. "My Dashboard").
3. You'll be given a **Client ID** and **Client Secret** — copy both somewhere safe.
4. Under **Redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback` (for testing on your computer)
   - You'll add the real production URL here too, after step 4 below.

---

## 2. Run it on your computer first

Open a terminal in this folder and run:

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and fill in:

```
WHOOP_CLIENT_ID=<your client id from step 1>
WHOOP_CLIENT_SECRET=<your client secret from step 1>
WHOOP_REDIRECT_URI=http://localhost:3000/api/auth/callback
COOKIE_SECRET=<run: openssl rand -hex 32, and paste the output>
```

(No `openssl`? Any long random string works — e.g. mash your keyboard for 40+ characters.)

Then start it:

```bash
npm run dev
```

Visit http://localhost:3000, click **Connect Whoop**, log in and authorize.
You should land back on the dashboard with your real recovery/sleep/strain
numbers. If something looks off, check the terminal for error logs.

---

## 3. Put the code on GitHub

```bash
git init
git add .
git commit -m "Whoop dashboard"
```

Create a new empty repo at https://github.com/new (don't initialize it with a
README), then:

```bash
git remote add origin https://github.com/<your-username>/whoop-dashboard.git
git branch -M main
git push -u origin main
```

---

## 4. Deploy to Vercel

1. Go to https://vercel.com/new and import the GitHub repo you just pushed.
2. Before deploying, open **Environment Variables** and add the same four
   variables from your `.env.local`:
   - `WHOOP_CLIENT_ID`
   - `WHOOP_CLIENT_SECRET`
   - `WHOOP_REDIRECT_URI` — set this to `https://<your-project-name>.vercel.app/api/auth/callback`
     (Vercel shows you the project's URL before you finish deploying — if
     you're not sure yet, deploy once, copy the assigned URL, then edit this
     env var and redeploy.)
   - `COOKIE_SECRET`
3. Click **Deploy**.
4. Once deployed, go back to https://developer-dashboard.whoop.com, open your
   app, and add the production redirect URI
   (`https://<your-project-name>.vercel.app/api/auth/callback`) to the
   allowed list — Whoop will refuse the login otherwise.
5. Visit your live URL, click **Connect Whoop**, and you're done. Bookmark it
   or add it to your phone's home screen for a one-tap check-in.

---

## How it works (for when you want to extend it)

- `app/api/auth/login/route.js` — sends you to Whoop's login/consent screen.
- `app/api/auth/callback/route.js` — Whoop redirects here with a code; this
  exchanges it for an access token + refresh token and stores both
  (encrypted) in a cookie via `lib/crypto.js`.
- `app/api/whoop/data/route.js` — reads the cookie, refreshes the access
  token if it's about to expire, then calls the Whoop API for recovery,
  sleep, workouts, and cycles (`lib/whoop.js`).
- `app/page.jsx` — the dashboard UI; fetches `/api/whoop/data` and renders it.

Whoop's API occasionally tweaks field names on its endpoints — if a number
shows up as "—" that should have data, open your browser's dev tools →
Network tab → click the `/api/whoop/data` request → Response, and compare
the JSON field names against what `app/page.jsx` reads. Easiest fix: paste
that JSON into a chat with Claude Code and ask it to adjust `page.jsx` to
match.

### Ideas for what to add next

- A history chart (recovery/strain over the last 30 days) using a charting
  library like Recharts.
- Push notifications or a daily email summary of your recovery score.
- Combine with other trackers (gym log, water, supplements) — this is
  exactly what the YouTube video builds next; each new tracker is just
  another card on the same dashboard, backed by its own small database
  table (Supabase's free tier is the easiest way to add persistent storage
  once you outgrow the cookie-only approach here).
