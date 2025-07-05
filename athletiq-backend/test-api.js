// test-api.js - Simple API test
const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${description}: ${res.statusCode} - ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.error(`❌ ${description}: ${err.message}`);
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testAPI() {
  console.log('🔍 Testing API endpoints...');
  
  try {
    await testEndpoint('/', 'Root endpoint');
    await testEndpoint('/api/health', 'Health endpoint');
    await testEndpoint('/api/ai/athlete-ids/stats', 'AI stats endpoint (should fail without auth)');
    await testEndpoint('/api/documents/upload', 'Document upload endpoint (should fail without auth)');
    
    console.log('✅ API tests completed!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
  
  process.exit(0);
}

testAPI();
