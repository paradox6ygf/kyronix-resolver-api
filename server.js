const http = require('http');
const url = require('url');
const instagramHandler = require('./api/instagram');

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  req.query = parsed.query;

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  if (parsed.pathname === '/api/instagram') {
    return instagramHandler(req, res);
  }

  res.status(200).json({ status: 'ok', name: 'KyronixPlayer High-Throughput Media Resolver' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`KyronixPlayer Resolver listening on port ${PORT}`);
});

