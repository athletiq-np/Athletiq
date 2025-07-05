// Minimal test for aiRoutes loading
const express = require('express');
const router = express.Router();

console.log('Creating basic router test...');

try {
  // Test middleware imports
  const { protect: authMiddleware } = require('./src/middlewares/authMiddleware');
  console.log('✅ authMiddleware loaded');
  
  const authorizeRoles = require('./src/middlewares/authorizeRoles');
  console.log('✅ authorizeRoles loaded');
  
  // Test simple route
  router.get('/test', authMiddleware, authorizeRoles(['super_admin']), (req, res) => {
    res.json({ message: 'test' });
  });
  
  console.log('✅ Simple route created successfully');
  console.log('✅ All tests passed!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
