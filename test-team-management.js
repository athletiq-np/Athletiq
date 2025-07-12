const axios = require('axios');

// Test the team management system
async function testTeamManagement() {
  try {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('🏆 Testing Team Management System...\n');
    
    // First, login as a school admin to get token
    console.log('1. Logging in as school admin...');
    
    // Test credentials - you may need to adjust these
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@school1.edu', // Replace with actual school admin email
      password: 'password123'
    }).catch(err => {
      console.log('❌ Login failed. Please check credentials or start the backend server.');
      console.log('Error:', err.message);
      return null;
    });
    
    if (!loginResponse) {
      console.log('Please ensure:');
      console.log('1. Backend server is running on port 5000');
      console.log('2. You have a school admin account created');
      console.log('3. The credentials in this test script are correct');
      return;
    }
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Login successful\n');
    
    // Test getting sports configuration
    console.log('2. Getting sports configuration...');
    const sportsResponse = await axios.get(`${baseURL}/schools/me/teams/sports`, { headers });
    console.log('✅ Sports config retrieved:', sportsResponse.data.data.length, 'sports available\n');
    
    // Test getting current teams
    console.log('3. Getting current teams...');
    const teamsResponse = await axios.get(`${baseURL}/schools/me/teams`, { headers });
    console.log('✅ Current teams:', teamsResponse.data.data.length, 'teams found\n');
    
    // Test creating a new team
    console.log('4. Creating a new football team...');
    const newTeam = {
      name: 'Lions Football Team',
      sport: 'football',
      maxPlayers: 11,
      minPlayers: 7
    };
    
    const createTeamResponse = await axios.post(`${baseURL}/schools/me/teams`, newTeam, { headers });
    console.log('✅ Team created successfully:', createTeamResponse.data.data.name);
    const teamId = createTeamResponse.data.data.id;
    
    // Test adding a player to the team
    console.log('5. Adding a player to the team...');
    const newPlayer = {
      name: 'John Doe',
      studentId: 'STU001',
      grade: '10',
      position: 'Forward'
    };
    
    const addPlayerResponse = await axios.post(`${baseURL}/schools/me/teams/${teamId}/players`, newPlayer, { headers });
    console.log('✅ Player added successfully:', addPlayerResponse.data.data.name);
    
    // Test getting updated teams list
    console.log('6. Getting updated teams list...');
    const updatedTeamsResponse = await axios.get(`${baseURL}/schools/me/teams`, { headers });
    console.log('✅ Updated teams count:', updatedTeamsResponse.data.data.length);
    
    const createdTeam = updatedTeamsResponse.data.data.find(t => t.id === teamId);
    if (createdTeam) {
      console.log('✅ Team has', createdTeam.player_count, 'players');
    }
    
    console.log('\n🎉 Team Management System is working correctly!');
    console.log('\nFeatures tested:');
    console.log('✅ Sports configuration retrieval');
    console.log('✅ Team creation');
    console.log('✅ Player addition');
    console.log('✅ Team listing with player counts');
    console.log('\nYou can now use the frontend Teams tab to manage your school teams!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n📝 Please start the backend server first:');
      console.log('cd e:\\Athletiq\\athletiq-backend && npm start');
    }
  }
}

testTeamManagement();
