// server.js — VidPull backend (Node.js + Express + yt-dlp)
const express  = require('express');
const cors     = require('cors');
const { exec } = require('child_process');
const path     = require('path');
const fs       = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function escapeShell(url) {
  return `'${url.replace(/'/g, "'\\''")}'`;
}

function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/.test(url))  return 'youtube';
  if (/twitter\.com|x\.com/.test(url))     return 'twitter';
  if (/instagram\.com/.test(url))          return 'instagram';
  if (/tiktok\.com/.test(url))             return 'tiktok';
  if (/facebook\.com|fb\.watch/.test(url)) return 'facebook';
  if (/reddit\.com|redd\.it/.test(url))    return 'reddit';
  if (/vimeo\.com/.test(url))              return 'vimeo';
  return 'generic';
}

function friendlyError(stderr) {
  const s = (stderr || '').toLowerCase();
  if (s.includes('age') || s.includes('sign in'))    return 'Age-restricted video — upload a cookies.txt to the server to bypass this.';
  if (s.includes('private'))                         return 'This video is private and cannot be downloaded.';
  if (s.includes('not available') || s.includes('unavailable')) return 'Video unavailable or removed.';
  if (s.includes('unsupported url') || s.includes('no suitable')) return 'URL not supported. Try YouTube, TikTok, Twitter, Instagram, or Facebook.';
  if (s.includes('geo') || s.includes('region'))     return 'Video is region-blocked. Enable a proxy in server config.';
  if (s.includes('rate') || s.includes('429'))       return 'Rate limited by platform. Wait a moment and retry.';
  if (s.includes('copyright') || s.includes('blocked')) return 'Video is blocked due to copyright.';
  return 'Failed to fetch this video. Check the URL and try again.';
}

// ── POST /api/download ────────────────────────────────────────
app.post('/api/download', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url.' });

  try { new URL(url.trim()); }
  catch { return res.status(400).json({ error: 'Invalid URL format.' }); }

  const platform = detectPlatform(url);
  const cookies  = fs.existsSync('./cookies.txt') ? '--cookies cookies.txt' : '';
  const proxy    = process.env.PROXY_URL ? `--proxy "${process.env.PROXY_URL}"` : '--geo-bypass';

  const cmd = [
    'yt-dlp',
    '--dump-json',
    '--no-playlist',
    '--no-check-certificate',
    proxy,
    cookies,
    '--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0"',
    '--add-header "Accept-Language:en-US,en;q=0.9"',
    '--socket-timeout 30',
    escapeShell(url.trim()),
  ].filter(Boolean).join(' ');

  console.log(`[VidPull] ${platform} →`, url.slice(0, 80));

  exec(cmd, { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) {
      console.error('[VidPull] error:', stderr.slice(0, 400));
      return res.status(500).json({ error: friendlyError(stderr) });
    }

    let info;
    try { info = JSON.parse(stdout.trim().split('\n')[0]); }
    catch { return res.status(500).json({ error: 'Could not parse video info.' }); }

    const allFormats = (info.formats || []).filter(f => f.url && f.url.startsWith('http'));
    const bestUrl = info.url || allFormats.slice(-1)[0]?.url;

    if (!bestUrl) return res.status(422).json({ error: 'No download URL found.' });

    const seen = new Set();
    const formats = allFormats
      .map(f => ({
        url:      f.url,
        ext:      f.ext || 'mp4',
        quality:  f.format_note || (f.height ? `${f.height}p` : f.format_id) || 'video',
        filesize: f.filesize || f.filesize_approx || null,
      }))
      .filter(f => { if (seen.has(f.quality)) return false; seen.add(f.quality); return true; })
      .slice(-16).reverse();

    res.json({
      title:     info.title     || 'video',
      url:       bestUrl,
      ext:       info.ext       || 'mp4',
      duration:  info.duration  || null,
      thumbnail: info.thumbnail || null,
      filesize:  info.filesize  || info.filesize_approx || null,
      uploader:  info.uploader  || null,
      platform,
      formats,
    });
  });
});

// ── GET /api/health ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  exec('yt-dlp --version', (e, out) => {
    res.json({
      status:  'ok',
      ytdlp:   e ? 'NOT FOUND — run: pip install yt-dlp' : out.trim(),
      cookies: fs.existsSync('./cookies.txt') ? 'present ✓' : 'not set',
      proxy:   process.env.PROXY_URL || 'none (using --geo-bypass)',
    });
  });
});

// ── Fallback → serve frontend ─────────────────────────────────
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
  console.log(`✅  VidPull on http://localhost:${PORT}`);
  exec('yt-dlp --version', (e, v) =>
    console.log(e ? '⚠  yt-dlp not found!' : `✅  yt-dlp ${v.trim()}`)
  );
});
