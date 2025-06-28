const http = require('http');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const endpoints = [
  { path: '/', name: 'Root Application' },
  { path: '/health', name: 'Health Check' },
  { path: '/healthz', name: 'Health Check (K8s)' },
  { path: '/ping', name: 'Ping Check' }
];

async function checkEndpoint(path, name) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          name,
          status: res.statusCode,
          healthy: res.statusCode === 200,
          response: data.substring(0, 100)
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        name,
        status: 'ERROR',
        healthy: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        name,
        status: 'TIMEOUT',
        healthy: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function checkAllEndpoints() {
  console.log(`Checking server endpoints on ${HOST}:${PORT}...`);
  console.log('='.repeat(50));

  const results = await Promise.all(
    endpoints.map(endpoint => checkEndpoint(endpoint.path, endpoint.name))
  );

  let allHealthy = true;
  results.forEach(result => {
    const status = result.healthy ? '✓ HEALTHY' : '✗ FAILED';
    console.log(`${status} - ${result.name} (${result.path})`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    } else if (result.status) {
      console.log(`  Status: ${result.status}`);
    }
    if (!result.healthy) allHealthy = false;
  });

  console.log('='.repeat(50));
  console.log(`Overall Status: ${allHealthy ? '✓ ALL HEALTHY' : '✗ SOME ISSUES'}`);
  
  return allHealthy;
}

if (require.main === module) {
  checkAllEndpoints().then(healthy => {
    process.exit(healthy ? 0 : 1);
  });
}

module.exports = { checkAllEndpoints };