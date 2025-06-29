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

// Social sharing image endpoint
app.get('/social-share-image', (req, res) => {
    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                <stop offset="30%" style="stop-color:#f0fdf4;stop-opacity:1" />
                <stop offset="70%" style="stop-color:#34d399;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="shield" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#34d399;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#6ee7b7;stop-opacity:1" />
            </linearGradient>
        </defs>
        
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <circle cx="100" cy="100" r="30" fill="rgba(255,255,255,0.4)"/>
        <circle cx="1100" cy="150" r="20" fill="rgba(255,255,255,0.3)"/>
        <circle cx="150" cy="500" r="25" fill="rgba(255,255,255,0.3)"/>
        <circle cx="1050" cy="500" r="35" fill="rgba(255,255,255,0.2)"/>
        
        <g transform="translate(150,70) scale(2.5)">
            <path d="M30 5 L50 15 L50 35 Q50 50 30 55 Q10 50 10 35 L10 15 Z" fill="url(#shield)" stroke="#065f46" stroke-width="2"/>
            <circle cx="30" cy="25" r="8" fill="rgba(255,255,255,0.3)" stroke="#ffffff" stroke-width="1.5"/>
            <path d="M26 25 L29 28 L34 21" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <text x="30" y="45" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="8" font-weight="bold">PS</text>
        </g>
        
        <text x="600" y="180" text-anchor="middle" fill="#065f46" font-family="Arial, sans-serif" font-size="72" font-weight="900">PaySavvy Pro</text>
        
        <text x="600" y="230" text-anchor="middle" fill="#065f46" font-family="Arial, sans-serif" font-size="28" opacity="0.8">Advanced AI-Powered Cybersecurity Platform for Malaysia</text>
        
        <g transform="translate(200, 300)">
            <rect x="0" y="0" width="180" height="60" rx="30" fill="rgba(255,255,255,0.9)" stroke="#10b981" stroke-width="2"/>
            <text x="30" y="38" fill="#065f46" font-family="Arial" font-size="16" font-weight="600">🧠 AI Analysis</text>
            
            <rect x="220" y="0" width="180" height="60" rx="30" fill="rgba(255,255,255,0.9)" stroke="#10b981" stroke-width="2"/>
            <text x="250" y="38" fill="#065f46" font-family="Arial" font-size="16" font-weight="600">📷 QR Scanner</text>
            
            <rect x="440" y="0" width="180" height="60" rx="30" fill="rgba(255,255,255,0.9)" stroke="#10b981" stroke-width="2"/>
            <text x="470" y="38" fill="#065f46" font-family="Arial" font-size="16" font-weight="600">🌐 Multilingual</text>
            
            <rect x="660" y="0" width="200" height="60" rx="30" fill="rgba(255,255,255,0.9)" stroke="#10b981" stroke-width="2"/>
            <text x="690" y="38" fill="#065f46" font-family="Arial" font-size="16" font-weight="600">⚡ Real-time Protection</text>
        </g>
        
        <text x="600" y="550" text-anchor="middle" fill="#065f46" font-family="Arial" font-size="20" font-weight="500">Protecting Malaysia from Payment Scams</text>
    </svg>`;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
});

// Coffee tip payment endpoint
app.post('/api/create-tip-payment', async (req, res) => {
  try {
    const { amount, currency = 'myr', description } = req.body;
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Payment system not configured. Please contact support.' 
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: 'PaySavvy Pro Coffee Tip',
            description: description,
            images: ['https://img.icons8.com/emoji/96/000000/coffee-emoji.png']
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/?payment=success`,
      cancel_url: `${req.protocol}://${req.get('host')}/?payment=cancelled`,
      metadata: {
        service: 'PaySavvy Pro Coffee Tip',
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
    
  } catch (error) {
    console.error('Stripe payment error:', error);
    res.status(500).json({ 
      error: 'Payment processing error. Please try again.' 
    });
  }
});

// Block ALL legacy JavaScript files to prevent import.meta errors
app.use((req, res, next) => {
  const path = req.path;
  if (path.endsWith('.js') && 
      (path.includes('/src/') || 
       path === '/main.js' || 
       path === '/database.js' || 
       path === '/ai.js' ||
       path.includes('/src_backup/') ||
       path.includes('/utils/') ||
       path.includes('/components/'))) {
    return res.status(404).send('Module files disabled - production version active');
  }
  next();
});

// Root endpoint - serve production app
app.get('/', (req, res) => {
  // Cache-busting headers with permissive CSP for QR scanner
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"${Date.now()}"`,
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' https: data: blob:; connect-src 'self' https://api.openai.com; font-src 'self' https://fonts.gstatic.com; object-src 'none'; base-uri 'self';",
    'Vary': '*'
  });
  
  try {
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    // Inject environment variables with cache-busting
    const timestamp = Date.now();
    const envScript = `
      <script>
        // Aggressive cache clearing and module prevention
        if ('caches' in window) {
          caches.keys().then(names => names.forEach(name => caches.delete(name)));
        }
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => registration.unregister());
          });
        }
        
        // Clear localStorage and sessionStorage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch(e) {}
        
        // Prevent any dynamic imports
        if (window.import) {
          delete window.import;
        }
        
        // Environment configuration with secure API key injection
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