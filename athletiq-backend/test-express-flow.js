// Test that simulates the exact Express request flow
require('dotenv').config();
const express = require('express');

async function testExpressFlow() {
  console.log('🧪 Testing Express request flow...');
  
  try {
    // Create minimal Express app like the server
    const app = express();
    app.use(express.json());
    
    // Import auth controller
    const authController = require('./src/controllers/authController');
    
    // Create mock request/response
    const req = {
      body: {
        email: 'superadmin@athletiq.com',
        password: 'admin123'
      }
    };
    
    const res = {
      status: function(code) {
        console.log('Response status:', code);
        return this;
      },
      cookie: function(name, value, options) {
        console.log('Setting cookie:', name);
        return this;
      },
      json: function(data) {
        console.log('Response data:', data);
        return this;
      }
    };
    
    const next = function(error) {
      if (error) {
        console.log('❌ Error in middleware:', error.message);
        console.log('Stack:', error.stack);
      } else {
        console.log('✅ Middleware completed successfully');
      }
    };
    
    console.log('📧 Testing login with mock request...');
    
    // Call the login function directly
    await authController.login(req, res, next);
    
    console.log('🎉 Express flow test completed!');
    
  } catch (error) {
    console.log('❌ Express flow test failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

testExpressFlow();
