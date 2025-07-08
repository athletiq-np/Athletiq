// Simple test to start the backend and check for errors
console.log('🚀 Testing backend startup...');

// Set working directory
process.chdir(__dirname);

try {
  console.log('📂 Working directory:', process.cwd());
  
  // Load environment
  require('dotenv').config();
  console.log('✅ Environment loaded');
  
  // Test basic requires
  const express = require('express');
  console.log('✅ Express loaded');
  
  const cors = require('cors');
  console.log('✅ CORS loaded');
  
  // Test database config
  const { pool } = require('./src/config/db');
  console.log('✅ Database config loaded');
  
  // Test auth routes
  const authRoutes = require('./src/routes/authRoutes');
  console.log('✅ Auth routes loaded');
  
  // Create minimal server
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  
  const server = app.listen(5000, () => {
    console.log('✅ Server started successfully on port 5000');
    console.log('🧪 Testing login endpoint...');
    
    // Test the database connection
    pool.query('SELECT NOW()')
      .then(result => {
        console.log('✅ Database connection test successful');
        console.log('⏰ Server time:', result.rows[0].now);
        
        // Close server after test
        setTimeout(() => {
          server.close(() => {
            console.log('🔚 Test completed - server stopped');
            process.exit(0);
          });
        }, 2000);
      })
      .catch(error => {
        console.log('❌ Database connection test failed:', error.message);
        server.close();
        process.exit(1);
      });
  });
  
  server.on('error', (error) => {
    console.log('❌ Server error:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.log('💥 Startup error:', error.message);
  console.log('📍 Stack trace:', error.stack);
  process.exit(1);
}
