// Test login and tournaments
const http = require('http');

async function testFlow() {
  console.log('🧪 Testing login and tournaments flow...');
  
  // Step 1: Login
  const loginData = JSON.stringify({
    email: "admin@test.com",
    password: "password123"
  });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  const loginResponse = await makeRequest(loginOptions, loginData);
  console.log('🔐 Login Status:', loginResponse.statusCode);
  
  if (loginResponse.statusCode === 200) {
    console.log('✅ Login successful!');
    
    // Extract cookie
    const setCookie = loginResponse.headers['set-cookie'];
    const tokenCookie = setCookie && setCookie.find(c => c.startsWith('token='));
    
    if (tokenCookie) {
      console.log('🍪 Cookie received');
      
      // Step 2: Test tournaments endpoint
      const tournamentsOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/schools/me/tournaments',
        method: 'GET',
        headers: {
          'Cookie': tokenCookie
        }
      };
      
      const tournamentsResponse = await makeRequest(tournamentsOptions);
      console.log('🏆 Tournaments Status:', tournamentsResponse.statusCode);
      
      if (tournamentsResponse.statusCode === 200) {
        console.log('✅ Tournaments endpoint accessible!');
        const data = JSON.parse(tournamentsResponse.body);
        console.log('📊 Response data:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ Tournaments failed:', tournamentsResponse.body);
      }
    } else {
      console.log('❌ No authentication cookie received');
    }
  } else {
    console.log('❌ Login failed:', loginResponse.body);
  }
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

testFlow().catch(console.error);
