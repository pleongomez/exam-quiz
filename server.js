/* ──────────────────────────────────────────
   Exam Quiz · server.js
   Simple static + API server (Node.js, no deps)
─────────────────────────────────────────── */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT         = process.env.PORT || 3000;
const ROOT         = __dirname;
const BANKS_DIR    = path.join(ROOT, 'questions');

// ── MIME types ────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ── API: list question banks ──────────────
function handleApiBanks(res) {
  fs.readdir(BANKS_DIR, (err, files) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Could not read questions directory.' }));
      return;
    }

    const banks = files
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        label: labelFromFilename(f),
        path:  `questions/${f}`,
      }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(banks));
  });
}

// Convert filename to a readable label
// e.g. "gh-200-github-actions.json" → "Gh 200 Github Actions"
function labelFromFilename(filename) {
  return filename
    .replace(/\.json$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ── Static file handler ───────────────────
function handleStatic(urlPath, res) {
  // Default to index.html
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // Security: prevent path traversal outside ROOT
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ── Main server ───────────────────────────
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0]; // strip query string

  if (urlPath === '/api/question-banks' && req.method === 'GET') {
    handleApiBanks(res);
  } else {
    handleStatic(urlPath, res);
  }
});

server.listen(PORT, () => {
  console.log(`✅ Exam Quiz server running at http://localhost:${PORT}`);
});
