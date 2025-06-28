const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'PaySavvy Server',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Block ALL JavaScript files except server files to prevent import.meta errors
app.get('/main.js', (req, res) => {
  res.status(404).send('Module files disabled - production version active');
});

app.get('/style.css', (req, res) => {
  res.status(404).send('Legacy CSS disabled - styles included in HTML');
});

// Block any remaining JavaScript module files
app.get('/database.js', (req, res) => {
  res.status(404).send('Module files disabled - production version active');
});

// Comprehensive module blocking
app.use((req, res, next) => {
  const path = req.path;
  if (path.endsWith('.js') && (path.includes('/src/') || path === '/main.js' || path === '/database.js')) {
    return res.status(404).send('Module files disabled - production version active');
  }
  next();
});

// Root endpoint - serve production app
app.get('/', (req, res) => {
  // Aggressive cache-busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"${Date.now()}"`,
    'Vary': '*'
  });
  
  try {
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    // Inject environment variables with cache-busting
    const timestamp = Date.now();
    const envScript = `
      <script>
        // Force complete cache clear
        if ('caches' in window) {
          caches.keys().then(names => names.forEach(name => caches.delete(name)));
        }
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => registration.unregister());
          });
        }
        
        // Environment configuration
        window.ENV = {
          VITE_OPENAI_API_KEY: '${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}'
        };
        window.VITE_OPENAI_API_KEY = '${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}';
        window.OPENAI_API_KEY = '${process.env.OPENAI_API_KEY || ''}';
        window.PAYSAVVY_VERSION = '${timestamp}';
        
        console.log('PaySavvy Production v${timestamp} - API key:', window.ENV.VITE_OPENAI_API_KEY ? 'Present' : 'Missing');
        console.log('Cache cleared, production version active');
      </script>
    `;
    
    html = html.replace('</head>', `${envScript}</head>`);
    res.send(html);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Server Error');
  }
});

// Dashboard fallback
app.get('/dashboard', (req, res) => {
  res.redirect('/');
});

// API health
app.get('/api/health', (req, res) => {
  res.json({ status: 'API healthy', timestamp: new Date().toISOString() });
});

// Static files (images only)
app.use(express.static(__dirname, {
  index: false,
  dotfiles: 'ignore',
  extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'],
  setHeaders: function (res) {
    res.set('Cache-Control', 'no-cache');
  }
}));

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PaySavvy Server running on port ${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`Application: http://0.0.0.0:${PORT}/`);
  console.log(`API Key configured: ${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));