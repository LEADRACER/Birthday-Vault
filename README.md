# Birthday:Vault ✦

A private, self-hosted birthday celebration site — a vault of photos, videos and
wishes. No backend, no Supabase, no accounts. Everything runs in the browser and
persists in IndexedDB on whatever device opens it.

## Run it

```bash
cd "/root/Builds/Birthday:Vault"
python3 -m http.server 8080
# → http://localhost:8080
```

Works from a plain file:// double-click too (Google Fonts just need internet;
the rest is fully offline).

## Set the birthday person

Open `app.js`, edit the `BV_CONFIG` block at the top:

```js
var BV_CONFIG = {
  name: "Akhil",          // shown in the hero
  birthday: "2002-04-11"  // powers the "Turning N" badge + countdown
};
```

## Features

- Hero with age badge + "next lap" countdown + floating sparks
- Masonry gallery with All / Photos / Videos filters
- Auto timeline ("Year by year") built from your items' dates
- Video hall for uploaded + Drive-linked videos
- Wishes wall (guestbook, kept in the vault)
- Add memories two ways:
  - Upload — drag & drop photos/videos; photos are auto-compressed
    (max 1920px, JPEG) before being stored
  - Google Drive — paste any `drive.google.com/file/d/<ID>/view` link;
    photos embed via Drive's thumbnail CDN, videos embed as a player
- Lightbox viewer: ← → keys to navigate, Esc to close
- Export / Import JSON backup (photos and small videos included;
  big videos are skipped by export — Drive links survive exports)
- Confetti on first visit, film grain, dark matte + amber/gold design,
  fully responsive, `prefers-reduced-motion` respected

## Where data lives

- IndexedDB database `birthday-vault` (stores: `items`, `wishes`)
- Sample artwork ships in `assets/demo/` and is auto-seeded on first run —
  remove it anytime with **Clear samples** in the gallery toolbar

## Deploy anywhere static

Upload the folder to Vercel / Netlify / GitHub Pages / n8n static host — no
server code needed. Each visitor gets their own local vault, so for a shared
event have one person curate, then **Export** and share the JSON, or just share
the link for a personal vault.
