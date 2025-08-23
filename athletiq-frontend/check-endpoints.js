const axios = require('axios');

const endpoints = [
  '/api/auth/login',
  '/api/auth/csrf', 
  '/api/athletes',
  '/api/schools',
  '/api/schools/register',
  '/api/tournaments',
  '/api/guardian/auth/register',
  '/api/guardian/profile'
];

async function checkEndpoints() {
  console.log('Checking Django endpoints...');
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get('http://localhost:8000' + endpoint, {
        timeout: 5000,
        validateStatus: () => true,
        headers: { 'Accept': 'application/json' }
      });
      console.log(`${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`${endpoint}: ERROR - ${error.message}`);
    }
  }
}

checkEndpoints();