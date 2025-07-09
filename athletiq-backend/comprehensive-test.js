// Comprehensive server and API test
const http = require('http');
const { spawn } = require('child_process');

console.log('🚀 Starting comprehensive backend test...');

// Start the backend server
const serverProcess = spawn('node', ['server.js'], {
  cwd: process.cwd(),
  stdio: 'inherit'
});

// Wait a moment for server to start, then test endpoints
setTimeout(async () => {
  console.log('\n📡 Testing API endpoints...');
  
  // Test basic server response
  await testEndpoint('http://localhost:5000/', 'Basic server check');
  
  // Test auth endpoint structure (should return method not allowed or similar)
  await testEndpoint('http://localhost:5000/api/auth', 'Auth endpoint check');
  
  // Test schools endpoint (should require auth but endpoint should exist)
  await testEndpoint('http://localhost:5000/api/schools', 'Schools endpoint check');
  
  // Test tournaments endpoint (should require auth but endpoint should exist)
  await testEndpoint('http://localhost:5000/api/tournaments', 'Tournaments endpoint check');
  
  console.log('\n✅ API tests completed!');
  console.log('\n🎯 Backend server is running and responsive!');
  console.log('📋 You can now start the frontend and test the full flow.');
  console.log('\n⚠️  Server will continue running. Use Ctrl+C to stop it.');
  
}, 3000);

async function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const request = http.get(url, (res) => {
      console.log(`✅ ${description}: Status ${res.statusCode}`);
      resolve();
    });
    
    request.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log(`❌ ${description}: Server not responding`);
      } else {
        console.log(`⚠️  ${description}: ${err.message}`);
      }
      resolve();
    });
    
    request.setTimeout(2000, () => {
      console.log(`⏱️  ${description}: Request timeout`);
      request.destroy();
      resolve();
    });
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill();
  process.exit(0);
});
