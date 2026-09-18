const http = require('http');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = 3001;
const WEB_DIR = path.join(__dirname, '..', 'web');

const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  secure: false,
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.removeHeader('origin');
    },
    error: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.writeHead(502);
      res.end('Proxy error: ' + err.message);
    },
  },
});

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/books') || req.url.startsWith('/oauth_redirect') || req.url.startsWith('/voiceover')) {
    return proxy(req, res, (err) => {
      if (err) { res.writeHead(500); res.end(String(err)); }
    });
  }

  let filePath = path.join(WEB_DIR, req.url === '/' ? 'index.html' : req.url);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(WEB_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Web preview: http://localhost:${PORT}`);
  console.log(`API proxy:   /api, /books, /oauth_redirect, /voiceover, /voiceover_books → http://localhost:3000`);
});
