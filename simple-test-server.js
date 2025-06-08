// Simple test server to verify basic functionality
const http = require('http');
const port = 5001; // Use different port to avoid conflicts

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  if (req.url === '/test') {
    res.end(JSON.stringify({
      status: 'OK',
      message: 'Simple test server is working',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.end(JSON.stringify({
      status: 'OK',
      message: 'Test server root',
      url: req.url
    }));
  }
});

server.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
  console.log(`Test endpoint: http://localhost:${port}/test`);
});

// Keep the server running
process.on('SIGINT', () => {
  console.log('\nShutting down test server...');
  server.close(() => {
    process.exit(0);
  });
});
