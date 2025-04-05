const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ 
  dev,
  dir: path.join(__dirname, '.')
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Block access to README.md
    if (pathname === '/README.md') {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    handle(req, res, parsedUrl);
  }).listen(80, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:80');
  });
}); 