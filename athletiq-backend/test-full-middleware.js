// Test with full middleware chain to isolate the issue
require('dotenv').config();
const express = require('express');

async function testFullMiddlewareChain() {
  console.log('🧪 Testing full middleware chain...');
  
  try {
    const app = express();
    app.use(express.json());
    
    // Import middleware in the same order as the auth route
    const { authLimiter } = require('./src/middlewares/rateLimiter');
    const { validateUserLogin } = require('./src/middlewares/validation');
    const authController = require('./src/controllers/authController');
    
    console.log('✅ All middleware imported successfully');
    
    // Create mock request/response
    const req = {
      body: {
        email: 'superadmin@athletiq.com',
        password: 'admin123'
      },
      ip: '127.0.0.1',
      get: () => 'test-agent'
    };
    
    const res = {
      locals: {},
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
    
    let middlewareIndex = 0;
    const next = function(error) {
      if (error) {
        console.log(`❌ Error in middleware ${middlewareIndex}:`, error.message);
        return;
      }
      console.log(`✅ Middleware ${middlewareIndex} completed`);
      middlewareIndex++;
    };
    
    console.log('📧 Testing with rate limiter...');
    middlewareIndex = 1;
    await new Promise((resolve) => {
      authLimiter(req, res, (err) => {
        next(err);
        resolve();
      });
    });
    
    console.log('📧 Testing with validation...');
    middlewareIndex = 2;
    // Validation middleware is an array, so we need to run each one
    for (const validator of validateUserLogin) {
      await new Promise((resolve) => {
        validator(req, res, (err) => {
          if (err) next(err);
          resolve();
        });
      });
    }
    console.log('✅ All validation middleware completed');
    
    console.log('📧 Testing auth controller...');
    middlewareIndex = 3;
    await authController.login(req, res, next);
    
    console.log('🎉 Full middleware chain test completed!');
    
  } catch (error) {
    console.log('❌ Middleware chain test failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

testFullMiddlewareChain();
