# VidPull v3 — Railway Deployment Guide

## Why Railway instead of Vercel?
Vercel is "serverless" — it can't run yt-dlp (a system binary).
Railway gives you a real server with Docker, so yt-dlp + ffmpeg work perfectly.

---

## 🚀 Deploy on Railway (FREE, 5 minutes)

### Step 1 — Push code to GitHub
1. Go to github.com → New repository → name it `vidpull` → Create
2. Open terminal in this folder and run:
```
git init
git add .
git commit -m "VidPull v3"
git remote add origin https://github.com/YOUR_USERNAME/vidpull.git
git push -u origin main
```

### Step 2 — Deploy on Railway
1. Go to **railway.app** → Sign up free with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `vidpull` repo
4. Railway auto-detects the Dockerfile and builds it
5. Click **"Generate Domain"** under Settings → Networking
6. Your app is live at `https://vidpull-xxxx.railway.app` 🎉

### Step 3 — Update your frontend API URL
In `public/index.html`, the fetch call uses `/api/download` (relative path).
Since frontend and backend are on the same server, this works automatically. ✓

---

## 🍪 Fix Age-Restricted YouTube Videos (Cookies)

### Get cookies.txt from your browser:
1. Install Chrome extension: **"Get cookies.txt LOCALLY"**
2. Log into YouTube in Chrome
3. Go to youtube.com
4. Click the extension → Export → Save as `cookies.txt`

### Upload cookies.txt to Railway:
Option A — Add as environment variable:
- In Railway dashboard → Variables → add `COOKIES_BASE64`
- Base64 encode your cookies: `base64 cookies.txt` (on Linux/Mac)
- Paste the result as the value

Option B — Include in your repo (⚠ keep repo PRIVATE if doing this):
- Put `cookies.txt` in the project root
- Remove `cookies.txt` from `.gitignore`
- Push to GitHub → Railway auto-deploys

---

## 🌍 Fix Region-Blocked Videos (Proxy)

In Railway dashboard → Variables, add:
```
PROXY_URL=http://username:password@proxyhost:port
```

Free proxy options:
- webshare.io (free tier available)
- proxyscrape.com

---

## 🔧 Environment Variables

| Variable      | Description                        | Required |
|---------------|------------------------------------|----------|
| `PORT`        | Server port (Railway sets this)    | Auto     |
| `PROXY_URL`   | HTTP proxy for geo-blocked videos  | Optional |

---

## 📁 Project Structure

```
vidpull-railway/
├── server.js          ← Express backend + yt-dlp integration
├── Dockerfile         ← Installs Node, Python, ffmpeg, yt-dlp
├── railway.json       ← Railway deployment config
├── package.json
├── cookies.txt        ← (optional) YouTube auth cookies
└── public/
    ├── index.html     ← Frontend PWA
    ├── manifest.json  ← PWA manifest
    └── sw.js          ← Service worker
```

---

## 🧪 Test your deployment

Visit: `https://your-app.railway.app/api/health`

You should see:
```json
{
  "status": "ok",
  "ytdlp": "2024.x.x",
  "cookies": "not set",
  "proxy": "none (using --geo-bypass)"
}
```

---

## Supported Sites
YouTube, YouTube Shorts, TikTok, Twitter/X, Instagram, Facebook, Reddit, Vimeo, Dailymotion, and 1000+ more via yt-dlp.
