// test-endpoints.js - Test multiple endpoints
const http = require('http');

const endpoints = [
  { path: '/', description: 'Root endpoint' },
  { path: '/api/health', description: 'Health endpoint' },
  { path: '/api/ai/athlete-ids/stats', description: 'AI stats (should fail - no auth)' },
  { path: '/api/documents/upload', description: 'Document upload (should fail - no auth)' },
  { path: '/api-docs', description: 'API documentation' }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint.path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const truncatedData = data.length > 100 ? data.substring(0, 100) + '...' : data;
        console.log(`✅ ${endpoint.description}: ${res.statusCode} - ${truncatedData}`);
        resolve({ status: res.statusCode, data: truncatedData });
      });
    });

    req.on('error', (err) => {
      console.error(`❌ ${endpoint.description}: ${err.message}`);
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`⏱️ ${endpoint.description}: Request timeout`);
      resolve({ status: 'timeout', data: '' });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testing multiple API endpoints...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }
  
  console.log('\n✅ All endpoint tests completed!');
  process.exit(0);
}

testAllEndpoints().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
