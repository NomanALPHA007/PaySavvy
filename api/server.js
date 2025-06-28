const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req;

  // Health check endpoints
  if (url === '/health' || url.endsWith('/health')) {
    res.status(200).json({ 
      status: 'healthy', 
      service: 'PaySavvy Server',
      timestamp: new Date().toISOString(),
      platform: 'Vercel'
    });
    return;
  }

  if (url === '/healthz' || url.endsWith('/healthz')) {
    res.status(200).send('OK');
    return;
  }

  if (url === '/ping' || url.endsWith('/ping')) {
    res.status(200).send('pong');
    return;
  }

  // API health endpoint
  if (url === '/api/health' || url.endsWith('/api/health')) {
    res.status(200).json({ 
      status: 'API healthy', 
      timestamp: new Date().toISOString(),
      platform: 'Vercel'
    });
    return;
  }

  // Default response for unmatched API routes
  res.status(404).json({ 
    error: 'API endpoint not found',
    availableEndpoints: ['/health', '/healthz', '/ping', '/api/health']
  });
};