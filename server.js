// Wrapper server: redirects root "/" to "/ainos/" before Next.js handles it
// This is needed because basePath: '/ainos' means Next.js only handles /ainos/* paths
const http = require('http');

const PORT = process.env.PORT || 3000;

// Start the Next.js standalone server as a child process
const { spawn } = require('child_process');
const path = require('path');

const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

const nextProcess = spawn('node', [standaloneServer], {
  env: { ...process.env, PORT: '3999' }, // Run Next.js on internal port
  stdio: 'inherit',
});

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js server:', err);
  process.exit(1);
});

// Create wrapper server that handles root redirect
const server = http.createServer((req, res) => {
  // Redirect root to /ainos/
  if (req.url === '/' || req.url === '') {
    res.writeHead(302, { Location: '/ainos/' });
    res.end();
    return;
  }

  // Proxy all other requests to Next.js internal server
  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: 3999,
    path: req.url,
    method: req.method,
    headers: req.headers,
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, () => {
  console.log(`> AINOS wrapper ready on http://localhost:${PORT}`);
  console.log(`> Root "/" redirects to "/ainos/"`);
});

// Cleanup on exit
process.on('SIGTERM', () => {
  nextProcess.kill();
  server.close();
});

process.on('SIGINT', () => {
  nextProcess.kill();
  server.close();
});
