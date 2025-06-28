const express = require('express');
const path = require('path');
const { createServer } = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
// Serve static files but exclude problematic JS files
app.use(express.static(__dirname, {
  index: false,  // Don't auto-serve index files
  dotfiles: 'ignore',
  etag: false,
  extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'],  // Remove js and css
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now());
    // Add cache-busting headers for all files
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// Multiple health check endpoints for different deployment platforms
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

// Root endpoint - serve main application with environment variables injected
app.get('/', (req, res) => {
  // Add cache-busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  const fs = require('fs');
  let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  
  // Inject environment variables and cache buster into the HTML
  const timestamp = Date.now();
  const envScript = `
    <script>
      window.ENV = {
        VITE_OPENAI_API_KEY: '${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}'
      };
      window.VITE_OPENAI_API_KEY = '${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}';
      window.OPENAI_API_KEY = '${process.env.OPENAI_API_KEY || ''}';
      window.APP_VERSION = '${timestamp}';
      console.log('PaySavvy Production v${timestamp} loaded - API key:', window.ENV.VITE_OPENAI_API_KEY ? 'Present' : 'Missing');
    </script>
  `;
  
  // Insert the script before the closing </head> tag
  html = html.replace('</head>', `${envScript}</head>`);
  
  console.log('Serving production app - API key:', process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
  
  res.send(html);
});

// Dashboard endpoint
app.get('/dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'public', 'dashboard.html');
  res.sendFile(dashboardPath, (err) => {
    if (err) {
      console.log('Dashboard file not found, serving production app');
      const fs = require('fs');
      let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
      const envScript = `<script>window.ENV = {VITE_OPENAI_API_KEY: '${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}'};window.VITE_OPENAI_API_KEY = '${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}';window.OPENAI_API_KEY = '${process.env.OPENAI_API_KEY || ''}';</script>`;
      html = html.replace('</head>', `${envScript}</head>`);
      res.send(html);
    }
  });
});

// API endpoints for future database operations
app.get('/api/health', (req, res) => {
  res.json({ status: 'API healthy', timestamp: new Date().toISOString() });
});

// Block all modular JavaScript files that cause import.meta errors
const blockedFiles = [
  '/main.js', '/style.css', '/src/main.js', '/src/ai.js', '/src/ai/gptScan.js',
  '/src/utils/language.js', '/src/utils/regexRules.js', '/src/utils/fingerprint.js',
  '/src/utils/redirectTrace.js', '/src/utils/multilingualMatcher.js', '/src/utils/localHeatmap.js',
  '/src/utils/qrDecode.js', '/src/utils/fallback.js', '/src/components/InputScanner.js',
  '/src/components/PreferencesPanel.js', '/src/components/QRScanner.js', '/src/components/ResultBox.js'
];

blockedFiles.forEach(file => {
  app.get(file, (req, res) => {
    res.status(404).send('Legacy module files disabled - using production version');
  });
});

app.get('/style.css', (req, res) => {
  res.status(404).send('Legacy files disabled');
});

// Handle 404 for non-existent routes (except API routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // For all other routes, serve the simplified main app with aggressive cache-busting
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': Date.now().toString()
  });
  
  const fs = require('fs');
  let html = fs.readFileSync(path.join(__dirname, 'app-simple.html'), 'utf8');
  
  // Inject environment variables with timestamp
  const timestamp = Date.now();
  const envScript = `
    <script>
      // Force cache clear
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      window.ENV = {
        VITE_OPENAI_API_KEY: '${process.env.VITE_OPENAI_API_KEY || ''}'
      };
      window.VITE_OPENAI_API_KEY = '${process.env.VITE_OPENAI_API_KEY || ''}';
      window.APP_CLEAN_VERSION = '${timestamp}';
      console.log('Clean PaySavvy v${timestamp} - cache forced clear');
    </script>
  `;
  
  html = html.replace('</head>', `${envScript}</head>`);
  res.send(html);
});

// Create HTTP server
const server = createServer(app);

// WebSocket server for real-time features
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'scan_alert':
          // Broadcast scan alerts to all connected clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server with enhanced error handling
server.listen(PORT, '0.0.0.0', (err) => {
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
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});