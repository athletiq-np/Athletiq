// Frontend API test - simulates what frontend does
const axios = require('axios');

async function testFrontendFlow() {
  console.log('🎯 Testing frontend-like API calls...');
  
  try {
    // Create axios instance like frontend
    const apiClient = axios.create({
      baseURL: 'http://localhost:5000/api',
      withCredentials: true,
    });
    
    // Step 1: Login
    const loginRes = await apiClient.post('/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful:', loginRes.data.success);
    console.log('📝 User data:', loginRes.data.data);
    
    // Step 2: Fetch tournaments
    const tournamentsRes = await apiClient.get('/schools/me/tournaments');
    console.log('✅ Tournaments fetched:', tournamentsRes.data.success);
    
    const data = tournamentsRes.data.data;
    console.log('📊 Registered tournaments:', data.registered_tournaments.length);
    console.log('📊 Available tournaments:', data.available_tournaments.length);
    
    // Step 3: Filter managed tournaments (like frontend does)
    const managed = data.registered_tournaments.filter(t => t.relationship_type === 'organized');
    console.log('📊 Managed tournaments:', managed.length);
    
    console.log('\n🎯 Tournament Details:');
    managed.forEach(t => {
      console.log(`  - ${t.name} (${t.status}) - ${t.relationship_type}`);
    });
    
    if (managed.length === 0) {
      console.log('❌ No managed tournaments found!');
      console.log('🔍 All registered tournaments:');
      data.registered_tournaments.forEach(t => {
        console.log(`  - ${t.name} (${t.relationship_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFrontendFlow();
