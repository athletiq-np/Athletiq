// Test script to isolate school routes issue
console.log('Testing school routes loading...');

try {
  console.log('1. Loading express...');
  const express = require('express');
  
  console.log('2. Loading school controller...');
  const schoolController = require('./athletiq-backend/src/controllers/schoolController');
  
  console.log('3. Loading auth middleware...');
  const { protect, checkRole } = require('./athletiq-backend/src/middlewares/authMiddleware');
  
  console.log('4. Loading validation middleware...');
  const { validateSchoolRegistration } = require('./athletiq-backend/src/middlewares/validation');
  
  console.log('5. Loading rate limiter...');
  const { generalLimiter } = require('./athletiq-backend/src/middlewares/rateLimiter');
  
  console.log('6. Loading school routes...');
  const schoolRoutes = require('./athletiq-backend/src/routes/schoolRoutes');
  
  console.log('✅ All school route dependencies loaded successfully!');
  
} catch (error) {
  console.error('❌ Error loading school routes:', error.message);
  console.error('Stack trace:', error.stack);
}
