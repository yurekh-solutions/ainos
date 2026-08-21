// Custom server for AINOS: handles root redirect + Next.js
// Required because basePath: '/ainos' means Next.js only handles /ainos/* paths
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '10000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // Redirect root "/" to "/ainos" (dashboard entry point)
      if (parsedUrl.pathname === '/') {
        res.writeHead(302, { Location: '/ainos' });
        res.end();
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> AINOS ready on http://${hostname}:${port}`);
    console.log(`> Root "/" redirects to "/ainos/"`);
  });
});
