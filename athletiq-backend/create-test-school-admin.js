const axios = require('axios');
const pool = require('./src/config/db');

async function createTestSchoolAdmin() {
  try {
    console.log('🔍 Creating test school admin...\n');

    // First, check if a school admin already exists
    const existingUsers = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@testschool.com']);
    
    if (existingUsers.rows.length > 0) {
      console.log('ℹ️  Test school admin already exists');
      
      // Check if the user has a school_id
      const user = existingUsers.rows[0];
      if (user.school_id) {
        console.log('✅ User has school_id:', user.school_id);
        return;
      } else {
        console.log('⚠️  User exists but has no school_id. Deleting and recreating...');
        await pool.query('DELETE FROM users WHERE email = $1', ['admin@testschool.com']);
      }
    }

    // Use the auth registration endpoint to create a complete school admin
    const registrationData = {
      adminFullName: 'Test School Admin',
      adminEmail: 'admin@testschool.com',
      password: 'TestPassword123!',
      schoolName: 'Test School',
      schoolCode: 'TEST2024',
      schoolAddress: '123 Test Street, Test City'
    };

    const response = await axios.post('http://localhost:5000/api/auth/register', registrationData);
    console.log('✅ School admin registration successful:', response.data.message);
    console.log('📧 Email:', registrationData.adminEmail);
    console.log('🔑 Password:', registrationData.password);
    console.log('🏫 School:', registrationData.schoolName);
    console.log('🏷️  School Code:', registrationData.schoolCode);

  } catch (error) {
    console.error('❌ Error creating test school admin:', error.response?.data || error.message);
  } finally {
    // Fix the pool.end() issue
    process.exit(0);
  }
}

createTestSchoolAdmin();
