// Quick server test
console.log('Starting server test...');

const express = require('express');
const app = express();

console.log('1. Express app created');

// Try loading essential routes
try {
  console.log('2. Loading auth routes...');
  app.use('/api/auth', require('./src/routes/authRoutes'));
  
  console.log('3. Loading school routes...');
  app.use('/api/schools', require('./src/routes/schoolRoutes'));
  
  console.log('4. Loading tournament routes...');
  app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
  
  console.log('✅ All routes loaded successfully');
  
  // Try starting server
  const server = app.listen(5001, () => {
    console.log('✅ Server started successfully on port 5001');
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });
  
  // Timeout to close if it hangs
  setTimeout(() => {
    console.log('❌ Server appears to be hanging');
    process.exit(1);
  }, 5000);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
