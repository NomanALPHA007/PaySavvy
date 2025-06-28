const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Static file serving with cache control
app.use(express.static(__dirname, {
  index: false,
  dotfiles: 'ignore',
  etag: false,
  extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'],
  setHeaders: function (res, path, stat) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'PaySavvy Server',
    port: PORT,
    uptime: process.uptime()
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Block legacy files
app.get('/main.js', (req, res) => {
  res.status(404).send('Legacy files disabled');
});

app.get('/style.css', (req, res) => {
  res.status(404).send('Legacy files disabled');
});

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'API healthy', timestamp: new Date().toISOString() });
});

// Root endpoint - serve production app
app.get('/', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  const fs = require('fs');
  let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  
  // Inject environment variables
  const timestamp = Date.now();
  const envScript = `
    <script>
      window.ENV = {
        VITE_OPENAI_API_KEY: '${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}'
      };
      window.VITE_OPENAI_API_KEY = '${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}';
      window.OPENAI_API_KEY = '${process.env.OPENAI_API_KEY || ''}';
      console.log('PaySavvy Production v${timestamp} - API key:', window.ENV.VITE_OPENAI_API_KEY ? 'Present' : 'Missing');
    </script>
  `;
  
  html = html.replace('</head>', `${envScript}</head>`);
  res.send(html);
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.redirect('/');
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`PaySavvy Server running on port ${PORT}`);
  console.log(`Health check available at http://0.0.0.0:${PORT}/health`);
  console.log(`Application available at http://0.0.0.0:${PORT}/`);
  console.log(`Server ready to accept connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});