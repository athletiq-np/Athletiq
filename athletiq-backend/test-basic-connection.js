const http = require('http');

function testConnection() {
  console.log('Testing basic connection to localhost:5000...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server responded with status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response data:', data);
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.error('❌ Connection error:', err.message);
    console.error('This means the server is not running on port 5000');
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('❌ Connection timeout');
    req.destroy();
    process.exit(1);
  });

  req.end();
}

testConnection();