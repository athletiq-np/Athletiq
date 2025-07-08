// Quick login test now that backend is running
const axios = require('axios');

console.log('🧪 Testing login with running backend...');

async function testLogin() {
  try {
    console.log('📡 Attempting login...');
    
    const loginData = {
      email: 'superadmin@athletiq.com',
      password: 'admin123'
    };
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('Response data:', response.data);
    
    // Check if cookie was set
    if (response.headers['set-cookie']) {
      console.log('🍪 Cookie set:', response.headers['set-cookie']);
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Login failed');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', error.response.data);
    }
    
    return false;
  }
}

testLogin()
  .then(success => {
    if (success) {
      console.log('\n🎉 Backend login is working! Your frontend should now work too.');
    } else {
      console.log('\n🚨 Backend login still has issues. Check the error details above.');
    }
  });
