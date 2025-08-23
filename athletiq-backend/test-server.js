const axios = require('axios');

async function testServer() {
  try {
    console.log('Testing server connection...');
    
    // Test basic health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test tournament creation endpoint with proper auth
    const loginData = {
      email: 'admin@test.com',
      password: 'password123'
    };
    
    console.log('Attempting login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
    console.log('✅ Login successful');
    
    const token = loginResponse.data.token;
    
    // Test tournament creation
    const tournamentData = {
      name: 'API Test Tournament',
      description: 'Testing from API directly',
      sport: 'football',
      tournament_type: 'school',
      format: 'knockout',
      location: 'Test Location',
      start_date: '2025-08-27',
      end_date: '2025-08-29',
      max_teams: 8
    };
    
    console.log('Testing tournament creation...');
    const tournamentResponse = await axios.post(
      'http://localhost:5000/api/tournaments',
      tournamentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Tournament created:', tournamentResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    }
  }
}

testServer();