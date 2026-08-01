# Birthday:Vault ✦

A private, self-hosted birthday celebration site — a vault of photos, videos and wishes. No backend, no Supabase, no accounts. Everything runs in the browser and persists in IndexedDB on whatever device opens it.

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
cd "/root/Builds/Birthday:Vault"
npm install -g vercel
vercel
```

### Option 2: GitHub + Vercel Dashboard
1. Push this folder to a GitHub repo
2. Import the repo in Vercel
3. Deploy — no configuration needed (uses `vercel.json`)

### Option 3: Drag & Drop
```bash
cd "/root/Buildday:Vault"
vercel --prod
```

## Local Development

```bash
cd "/root/Builds/Birthday:Vault"
npm install
npm run dev
# → http://localhost:3000
```

Or with Python:
```bash
cd "/root/Builds/Birthday:Vault"
python3 -m http.server 8080
# → http://localhost:8080
```

Works from a plain `file://` double-click too (Google Fonts just need internet; the rest is fully offline).

## Configuration

Edit `app.js` to set the birthday person:

```js
var BV_CONFIG = {
  name: "Akhil",          // shown in the hero
  birthday: "2002-04-11"  // powers the "Turning N" badge + countdown
};
```

For Vercel deployments, you can also set these as environment variables:
- `BV_NAME` — the name shown in hero
- `BV_BIRTHDAY` — ISO date `YYYY-MM-DD`

The app will use env vars if present, otherwise falls back to `app.js` config.

## Features

- Hero with age badge + "next lap" countdown + floating sparks
- Masonry gallery with All / Photos / Videos filters
- Auto timeline ("Year by year") built from your items' dates
- Video hall for uploaded + Drive-linked videos
- Wishes wall (guestbook, kept in the vault)
- Add memories two ways:
  - Upload — drag & drop photos/videos; photos are auto-compressed (max 1920px, JPEG) before being stored
  - Google Drive — paste any `drive.google.com/file/d/<ID>/view` link; photos embed via Drive's thumbnail CDN, videos embed as a player
- Lightbox viewer: ← → keys to navigate, Esc to close
- Export / Import JSON backup (photos and small videos included; big videos are skipped by export — Drive links survive exports)
- Confetti on first visit, film grain, dark matte + amber/gold design, fully responsive, `prefers-reduced-motion` respected

## Where data lives

- IndexedDB database `birthday-vault` (stores: `items`, `wishes`)
- Sample artwork ships in `assets/demo/` and is auto-seeded on first run — remove it anytime with **Clear samples** in the gallery toolbar

## Deploy anywhere static

Upload the folder to Vercel / Netlify / GitHub Pages / n8n static host — no server code needed. Each visitor gets their own local vault, so for a shared event have one person curate, then **Export** and share the JSON, or just share the link for a personal vault.

## Project Structure

```
Birthday:Vault/
├── index.html        # Main HTML
├── styles.css        # All styles (light theme, confetti palette)
├── app.js            # Core: config, IndexedDB, utils, demo seed
├── main.js           # Boot, hero, confetti, export/import
├── ui-gallery.js     # Gallery, filters, toolbar
├── ui-lightbox.js    # Lightbox viewer
├── ui-upload.js      # Upload modal, compression, Drive embed
├── ui-wishes.js      # Wishes wall
├── ui-reel.js        # Animated reel showcase
├── assets/demo/      # Sample SVG artwork
├── package.json      # npm config for Vercel
├── vercel.json       # Vercel deployment config
└── README.md         # This file
```

## Browser Support

Modern browsers with IndexedDB support (Chrome 60+, Firefox 55+, Safari 14+, Edge 79+).