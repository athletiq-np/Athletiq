// Focused test for login and tournament loading
const http = require('http');
const https = require('https');
const querystring = require('querystring');

console.log('🔧 Testing login and tournament loading...');

// Test data
const testUser = {
  email: 'admin@testschool.com',
  password: 'admin123'
};

// Helper function to make HTTP requests
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

async function testLogin() {
  console.log('\n1. Testing login endpoint...');
  
  const postData = JSON.stringify(testUser);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  try {
    const response = await makeRequest(options, postData);
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('   ✅ Login successful!');
      
      // Extract cookie for subsequent requests
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const tokenCookie = setCookie.find(cookie => cookie.startsWith('token='));
        console.log('   ✅ Authentication cookie received');
        return tokenCookie;
      }
    } else {
      console.log('   ❌ Login failed:', response.body);
    }
  } catch (error) {
    console.log('   ❌ Login error:', error.message);
  }
  
  return null;
}

async function testTournaments(cookie) {
  console.log('\n2. Testing tournaments endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/schools/tournaments',
    method: 'GET',
    headers: {}
  };
  
  if (cookie) {
    options.headers['Cookie'] = cookie;
  }
  
  try {
    const response = await makeRequest(options);
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('   ✅ Tournaments endpoint accessible!');
      const data = JSON.parse(response.body);
      console.log(`   ✅ Found ${data.data?.length || 0} tournaments`);
    } else {
      console.log('   ❌ Tournaments request failed:', response.body);
    }
  } catch (error) {
    console.log('   ❌ Tournaments error:', error.message);
  }
}

async function runTests() {
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const cookie = await testLogin();
  await testTournaments(cookie);
  
  console.log('\n✅ Test completed!');
}

runTests().catch(console.error);
