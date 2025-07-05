// test-server-startup.js - Test server startup with routes
require('dotenv').config();
console.log('Testing server startup...');

const express = require('express');
const app = express();

// Test basic middleware
app.use(express.json());

// Test basic route
app.get('/', (req, res) => res.send('Test server is running'));

// Test importing the problematic routes
console.log('Testing document routes import...');
try {
  const documentRoutes = require('./src/routes/documentRoutes');
  console.log('✅ Document routes imported successfully');
  
  // Try to use them
  app.use('/api/documents', documentRoutes);
  console.log('✅ Document routes registered successfully');
} catch (error) {
  console.error('❌ Error importing document routes:', error.message);
  console.error('Stack:', error.stack);
}

console.log('Testing AI routes import...');
try {
  const aiRoutes = require('./src/routes/aiRoutes');
  console.log('✅ AI routes imported successfully');
  
  app.use('/api/ai', aiRoutes);
  console.log('✅ AI routes registered successfully');
} catch (error) {
  console.error('❌ Error importing AI routes:', error.message);
  console.error('Stack:', error.stack);
}

// Try to start server
const PORT = 5001;
console.log(`Attempting to start server on port ${PORT}...`);

const server = app.listen(PORT, () => {
  console.log(`✅ Test server started successfully on port ${PORT}`);
  // Close server after 2 seconds
  setTimeout(() => {
    console.log('Closing test server...');
    server.close(() => {
      console.log('Test server closed');
      process.exit(0);
    });
  }, 2000);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  process.exit(1);
});

// Handle hanging
setTimeout(() => {
  console.log('⚠️  Server startup taking too long, forcing exit...');
  process.exit(1);
}, 10000);
