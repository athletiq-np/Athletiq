// Test validation middleware
const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

console.log('Testing validation middleware...');

try {
  // Test middleware imports
  const { protect: authMiddleware } = require('./src/middlewares/authMiddleware');
  console.log('✅ authMiddleware loaded');
  
  const authorizeRoles = require('./src/middlewares/authorizeRoles');
  console.log('✅ authorizeRoles loaded');
  
  // Test route with validation array
  router.post('/test-validation',
    authMiddleware,
    authorizeRoles(['super_admin']),
    [
      body('test_field').optional().isString().withMessage('Test field must be string')
    ],
    (req, res) => {
      res.json({ message: 'test with validation' });
    }
  );
  
  console.log('✅ Route with validation array created successfully');
  console.log('✅ All tests passed!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
