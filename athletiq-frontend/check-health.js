const axios = require('axios');

async function checkHealth() {
  const endpoints = ['/api/health', '/health', '/api/monitoring/health', '/', '/api/auth/csrf'];
  
  console.log('Checking Django health endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get('http://localhost:8000' + endpoint, {
        timeout: 5000,
        validateStatus: () => true
      });
      console.log(`${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`${endpoint}: ERROR - ${error.message}`);
    }
  }
}

checkHealth();