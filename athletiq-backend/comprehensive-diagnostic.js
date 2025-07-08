// Comprehensive backend diagnostic and test script
require('dotenv').config();
const axios = require('axios');

console.log('🔍 COMPREHENSIVE BACKEND DIAGNOSTIC');
console.log('=====================================');

async function runDiagnostics() {
  // 1. Check if backend is responding
  console.log('\n🌐 Testing backend connectivity...');
  try {
    const response = await axios.get('http://localhost:5000/', { timeout: 5000 });
    console.log('✅ Backend is responding');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Backend not responding:', error.message);
    console.log('🛑 CRITICAL: Backend server is not running!');
    return false;
  }

  // 2. Test database imports and connection
  console.log('\n🗄️  Testing database configuration...');
  try {
    const { pool } = require('./src/config/db');
    console.log('✅ Database pool import successful');
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection working');
    console.log('Current time:', result.rows[0].current_time);
  } catch (error) {
    console.log('❌ Database issue:', error.message);
    return false;
  }

  // 3. Test ApiResponse import
  console.log('\n📡 Testing ApiResponse import...');
  try {
    const { ApiResponse } = require('./src/utils/apiResponse');
    console.log('✅ ApiResponse import successful');
    console.log('ApiResponse.success type:', typeof ApiResponse.success);
  } catch (error) {
    console.log('❌ ApiResponse issue:', error.message);
    return false;
  }

  // 4. Test auth controller directly
  console.log('\n🔐 Testing auth controller import...');
  try {
    const authController = require('./src/controllers/authController');
    console.log('✅ Auth controller import successful');
    console.log('Login function type:', typeof authController.login);
  } catch (error) {
    console.log('❌ Auth controller issue:', error.message);
    console.log('Error stack:', error.stack);
    return false;
  }

  // 5. Test login endpoint directly
  console.log('\n🧪 Testing login endpoint...');
  try {
    const loginData = {
      email: 'superadmin@athletiq.com',
      password: 'admin123'
    };
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
      timeout: 10000,
      validateStatus: () => true // Don't throw on error status
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.status === 200) {
      console.log('✅ Login successful!');
      return true;
    } else {
      console.log('❌ Login failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Login endpoint error:', error.message);
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', error.response.data);
    }
    return false;
  }
}

// Run diagnostics
runDiagnostics()
  .then(success => {
    if (success) {
      console.log('\n🎉 All tests passed! Backend is working correctly.');
    } else {
      console.log('\n🚨 Some tests failed. Please check the issues above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.log('\n💥 Diagnostic script failed:', error.message);
    process.exit(1);
  });
