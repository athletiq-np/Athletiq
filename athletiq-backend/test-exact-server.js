// Test with the exact server setup to reproduce the issue
require('dotenv').config();

console.log('🧪 Testing with exact server setup...');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Use the exact same middleware order as the real server
const { corsOptions } = require('./src/middlewares/security');
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Register auth routes exactly like the server
app.use('/api/auth', require('./src/routes/authRoutes'));

console.log('✅ Server setup complete, starting test server...');

const server = app.listen(5001, () => {
  console.log('🚀 Test server running on port 5001');
  
  // Test the login endpoint using axios like the frontend does
  const axios = require('axios');
  
  setTimeout(async () => {
    try {
      console.log('📧 Testing login endpoint...');
      
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email: 'superadmin@athletiq.com',
        password: 'admin123'
      }, {
        timeout: 10000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Test server login successful!');
      console.log('Status:', response.status);
      console.log('Data:', response.data);
      
    } catch (error) {
      console.log('❌ Test server login failed');
      console.log('Error:', error.message);
      
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Error data:', error.response.data);
      }
    } finally {
      server.close();
      process.exit(0);
    }
  }, 1000);
});

server.on('error', (error) => {
  console.log('❌ Test server error:', error.message);
});
