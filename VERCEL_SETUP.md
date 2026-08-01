# Birthday:Vault — Vercel Deployment Setup

## ✅ What's Already Done

The project is now **Vercel-ready** with:
- `vercel.json` — deployment config (build command, output dir, rewrites, headers)
- `build.js` — injects env vars (`BV_NAME`, `BV_BIRTHDAY`) into `config.js` at build time
- `package.json` — `vercel-build` script runs `npm run build`
- GitHub repo: `https://github.com/LEADRACER/Birthday-Vault.git`
- Pushed to `main` branch

---

## 🚀 Deploy to Vercel (3 Options)

### Option 1: Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `LEADRACER/Birthday-Vault`
3. **Environment Variables** (click "Environment Variables" before deploying):
   ```
   BV_NAME = "Akhil"
   BV_BIRTHDAY = "2002-04-11"
   ```
4. Click **Deploy** — done.

### Option 2: Vercel CLI
```bash
cd "/root/Builds/Birthday:Vault"
npm install -g vercel
vercel
# Follow prompts, it will read vercel.json automatically
# For production:
vercel --prod
```

### Option 3: GitHub Actions (Auto-deploy on push)
The repo is already connected. Any push to `main` triggers a Vercel deploy.

---

## ⚙️ How It Works

### Config Injection Flow
```
Vercel Environment Variables (BV_NAME, BV_BIRTHDAY)
        ↓
    build.js runs at build time (npm run vercel-build)
        ↓
    Writes window.BV_ENV_CONFIG into config.js
        ↓
    app.js loads it via loadBuildConfig() on page load
        ↓
    BV_CONFIG gets the values → hero shows name + age badge
```

### For Local Development
```bash
cd "/root/Builds/Birthday:Vault"
npm install
npm run dev
# → http://localhost:3000
```
- No env vars needed locally — edit `BV_CONFIG` directly in `app.js` (lines 11-14)
- Or create `.env` from `.env.example` and run `BV_NAME="Akhil" BV_BIRTHDAY="2002-04-11" npm run build`

---

## 📁 Project Structure (Vercel-relevant)

```
Birthday:Vault/
├── index.html        # Entry point (static)
├── styles.css        # All styles
├── app.js            # Core logic, loads BV_ENV_CONFIG
├── config.js         # Generated at build time (gitignored)
├── build.js          # Build script — replaces __BV_NAME__ / __BV_BIRTHDAY__
├── package.json      # npm scripts + vercel-build
├── vercel.json       # Vercel deployment config
├── .env.example      # Template for local env vars
├── assets/           # Static assets (demo SVGs)
└── *.js              # UI modules (gallery, reel, wishes, etc.)
```

---

## 🔧 Vercel.json Explained

| Setting | Value | Purpose |
|---------|-------|---------|
| `buildCommand` | `npm run build` | Runs `build.js` to inject env vars |
| `outputDirectory` | `.` | Serves root folder (index.html at /) |
| `devCommand` | `npm run dev` | Local dev with `npx serve .` |
| `rewrites` | `/(.*)` → `/index.html` | SPA fallback (not strictly needed but safe) |
| `headers` | Security + cache headers | X-Content-Type-Options, cache for /assets/ |

---

## ✅ Verification Checklist

After deploy, verify:
- [ ] Hero shows **"A celebration of Akhil"** and **"✦ Turning 27"**
- [ ] Countdown to next birthday works
- [ ] Gallery loads (demo samples appear)
- [ ] Reel auto-plays
- [ ] Wishes wall accepts submissions
- [ ] Upload modal works (drag & drop, Drive links)
- [ ] Export/Import backup works
- [ ] No console errors

---

## 🛠 Troubleshooting

| Issue | Fix |
|-------|-----|
| Name/badge not showing | Check Vercel env vars are set + rebuild |
| `config.js` not updated | Verify `vercel-build` runs `npm run build` |
| 404 on refresh | `vercel.json` rewrites handle this |
| Assets not loading | Check `outputDirectory: "."` is correct |
| Build fails | Check Vercel build logs for `build.js` errors |

---

## 📝 Customization

Change the birthday person:
1. **Vercel Dashboard** → Project Settings → Environment Variables
2. Update `BV_NAME` and `BV_BIRTHDAY`
3. Redeploy (or push empty commit to trigger)

Or locally:
```bash
# Edit app.js lines 11-14 directly for quick testing
var BV_CONFIG = {
  name: "Your Name",
  birthday: "YYYY-MM-DD"
};
```