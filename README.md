# Inkfeed — Telegram Mini App comic reader

Dark-themed comic reader as a Telegram Mini App. No login for readers. You (admin)
manage comics from an `/admin` tab inside the same app, gated by your Telegram
account. Pages are stored for free on a private Telegram channel; thumbnails go
through Cloudinary; everything else lives in MongoDB. Deploys as one Vercel project.

## How it fits together

- **Frontend** (`/frontend`): React + Vite. Talks to the API at `/api/*` (same domain).
- **API** (`/api`): Vercel serverless functions, Node. Talks to MongoDB + Telegram Bot API.
- **Images**: comic *pages* are sent to a private Telegram channel via your bot →
  Telegram gives back a permanent `file_id` → we store that `file_id` in MongoDB →
  `/api/image/:fileId` fetches the bytes fresh from Telegram each time and streams
  them to the browser (with long-lived caching headers, so repeat views are fast).
  Comic *thumbnails* go straight to Cloudinary instead, so the library grid can use
  Cloudinary's resizing.
- **Admin access**: no password. Telegram Mini Apps hand your app a signed
  `initData` string proving who's using it. The backend verifies that signature and
  checks the Telegram numeric ID against `ADMIN_TELEGRAM_IDS`. If it matches, `/admin`
  unlocks; otherwise it shows "Admin only."

---

## 1. Create your Telegram bot

1. Open Telegram, message **@BotFather**.
2. `/newbot` -> give it a name and username (must end in `bot`, e.g. `inkfeed_bot`).
3. BotFather gives you a **token** like `123456789:AAExample...` -- save it, this is `TELEGRAM_BOT_TOKEN`.
4. Still with BotFather: `/mybots` -> your bot -> **Bot Settings** -> **Menu Button** --
   set it later once you have your Vercel URL (step 7 below covers this).

## 2. Create a private storage channel

1. In Telegram, create a new **channel**, set it to **Private**.
2. Add your bot as an **admin** of that channel (Channel settings -> Administrators -> Add Admin -> search your bot).
3. To get the channel's numeric ID: forward any message from the channel to **@userinfobot**
   (or @JsonDumpBot), or add the bot **@getidsbot** to the channel briefly. You want an
   ID like `-1001234567890`. That's `TELEGRAM_STORAGE_CHANNEL_ID`.

## 3. Get your own Telegram numeric ID (for admin access)

Message **@userinfobot** on Telegram -- it replies with your numeric ID. That goes in
`ADMIN_TELEGRAM_IDS` (comma-separate if more than one person should have admin access).

## 4. Set up MongoDB Atlas (free tier is fine)

1. https://www.mongodb.com/cloud/atlas -> create a free (M0) cluster.
2. Database Access -> add a user with a password.
3. Network Access -> allow access from anywhere (`0.0.0.0/0`) -- needed since Vercel's
   IPs aren't static.
4. Get your connection string (Connect -> Drivers) -> that's `MONGODB_URI`.

## 5. Set up Cloudinary (free tier)

1. https://cloudinary.com -> sign up -> note your **Cloud name** on the dashboard.
2. Settings -> Upload -> **Upload presets** -> Add upload preset -> set **Signing Mode**
   to **Unsigned** -> save, note the preset name.
3. These become `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET`.

## 6. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On https://vercel.com -> New Project -> import the repo. Vercel will detect
   `vercel.json` and build both the frontend and the API functions automatically.
3. In **Project Settings -> Environment Variables**, add everything from
   `.env.example` (root) **and** `frontend/.env.example`. Vite env vars must start
   with `VITE_` and are baked in at build time -- add them before deploying.
4. Deploy. You'll get a URL like `https://inkfeed.vercel.app`.

## 7. Point your bot at the deployed app

1. Back in @BotFather: `/mybots` -> your bot -> **Bot Settings** -> **Menu Button** ->
   **Configure Menu Button** -> send your Vercel URL (`https://inkfeed.vercel.app`).
   This makes a "menu" button open your app inside Telegram.
2. Optionally also set up `/newapp` under **Bot Settings -> Mini Apps** for a proper
   app entry with its own name/icon, shareable as `t.me/inkfeed_bot/appname`.
3. Open your bot in Telegram, tap the menu button -- the app should open, dark theme,
   showing "No comics yet."

## 8. Add your first comic

1. Inside the Mini App, tap **Admin** at the bottom.
2. Since your Telegram ID is in `ADMIN_TELEGRAM_IDS`, the panel unlocks.
3. Fill in title/description/tags, upload a thumbnail (goes to Cloudinary), add a
   chapter, upload page images (goes to your private Telegram channel), hit
   **Publish Comic**.
4. Go back to **Library** -- your comic shows up. Tap it, tap a chapter, read.

## 9. Add Monetag ads

1. Sign up at Monetag, register your Mini App / site, get your **zone ID** and script snippet.
2. Open `frontend/index.html`, uncomment and fill in the script tag near the bottom of `<head>`.
3. The app already reserves ad space every 6 pages in the reader and mid-grid on the
   home screen (`<AdSlot />` components) -- check Monetag's docs for whether they want
   a specific div/format for those in-feed slots, and adjust `AdSlot.jsx` accordingly.
   Redeploy after changes.

---

## Local development

```bash
# API deps (root)
npm install

# Frontend
cd frontend
npm install
cp .env.example .env   # fill in Cloudinary values
npm run dev
```

The Telegram SDK (`window.Telegram.WebApp`) won't exist in a plain browser tab, so
`isInsideTelegram` will be `false` and `/admin` will show "open inside Telegram."
To test admin locally, use the Vercel-deployed URL inside Telegram, or use
ngrok to tunnel your local dev server and set that as the bot's menu button URL
temporarily.

`vercel dev` (after `npm i -g vercel`, run from the root) will run the `/api`
functions locally too, alongside the Vite dev server, if you want the full stack
running on your machine.

## Notes / things you might want to change later

- **Image size limits**: Vercel's default request body limit is ~4.5MB. Page uploads
  are base64-encoded (about 33% bigger than the raw file), so keep source images under
  ~3MB. If you need bigger pages, switch the admin upload to multipart streaming or
  a signed direct-to-Cloudinary flow for pages too (like the thumbnail already does).
- **Chapter/page reordering**: currently pages upload in the order you select them;
  there's no drag-to-reorder UI yet -- remove and re-add in order if you need to fix it.
- **Search**: title-only regex search for now; add a text index in MongoDB
  (`db.comics.createIndex({ title: "text", tags: "text" })`) if the library grows large.
# comicworld
