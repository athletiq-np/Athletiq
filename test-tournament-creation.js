const axios = require('axios');

// Test tournament creation endpoint
async function testTournamentCreation() {
  try {
    console.log('Testing tournament creation...');
    
    const tournamentData = {
      name: 'Test Tournament',
      description: 'A test tournament for debugging',
      location: 'Test Location',
      start_date: '2025-08-01',
      end_date: '2025-08-15',
      level: 'school',
      hosted_by: 'Test School',
      sports_config: [
        {
          sport: 'football',
          categories: ['U12', 'U16'],
          format: 'knockout'
        }
      ]
    };

    console.log('Sending tournament data:', JSON.stringify(tournamentData, null, 2));

    // First test without authentication to see the authentication error
    try {
      const response = await axios.post('http://localhost:5000/api/tournaments', tournamentData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      console.log('Response:', response.data);
    } catch (error) {
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        console.log('✓ Authentication required (expected)');
      } else if (error.response?.status === 400) {
        console.log('✗ Validation error - checking details...');
        if (error.response?.data?.errors) {
          console.log('Validation errors:', error.response.data.errors);
        }
      } else {
        console.log('Unexpected error:', error.message);
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testTournamentCreation();
