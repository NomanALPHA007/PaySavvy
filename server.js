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

// Block legacy files that cause import.meta errors
app.get('/main.js', (req, res) => {
  res.status(404).send('Legacy files disabled');
});

app.get('/style.css', (req, res) => {
  res.status(404).send('Legacy files disabled');
});

// Root endpoint - serve production app
app.get('/', (req, res) => {
  // Cache-busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    // Inject environment variables
    const envScript = `
      <script>
        window.ENV = {
          VITE_OPENAI_API_KEY: '${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}'
        };
        window.VITE_OPENAI_API_KEY = '${process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}';
        window.OPENAI_API_KEY = '${process.env.OPENAI_API_KEY || ''}';
        console.log('PaySavvy Production - API key:', window.ENV.VITE_OPENAI_API_KEY ? 'Present' : 'Missing');
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