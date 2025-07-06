const http = require('http');

// Test the school endpoint with a raw HTTP request
async function testSchoolEndpoint() {
  try {
    console.log('🔍 Testing /api/schools/me endpoint with raw HTTP...\n');

    // First, get a fresh token
    const loginData = JSON.stringify({
      email: 'admin@test.com',
      password: 'password123'
    });

    console.log('1. Getting fresh token...');
    
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

    const token = await new Promise((resolve, reject) => {
      const loginReq = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('Login response:', response);
            
            // Extract token from Set-Cookie header
            const setCookieHeader = res.headers['set-cookie'];
            if (setCookieHeader) {
              const tokenCookie = setCookieHeader.find(cookie => cookie.startsWith('token='));
              if (tokenCookie) {
                const token = tokenCookie.split(';')[0];
                console.log('Extracted token:', token);
                resolve(token);
              } else {
                reject(new Error('No token cookie found'));
              }
            } else {
              reject(new Error('No Set-Cookie header found'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      loginReq.on('error', reject);
      loginReq.write(loginData);
      loginReq.end();
    });

    console.log('\n2. Testing /api/schools/me with token...');

    // Now test the schools endpoint
    const schoolOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/schools/me',
      method: 'GET',
      headers: {
        'Cookie': token
      }
    };

    const schoolResponse = await new Promise((resolve, reject) => {
      const schoolReq = http.request(schoolOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({ status: res.statusCode, data: response });
          } catch (error) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });

      schoolReq.on('error', reject);
      schoolReq.setTimeout(5000, () => {
        schoolReq.destroy();
        reject(new Error('Request timeout'));
      });
      schoolReq.end();
    });

    console.log('School endpoint response:');
    console.log('Status:', schoolResponse.status);
    console.log('Data:', schoolResponse.data);

    if (schoolResponse.status === 200) {
      console.log('\n✅ Success! School data retrieved.');
    } else {
      console.log('\n❌ Failed to retrieve school data.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSchoolEndpoint();
