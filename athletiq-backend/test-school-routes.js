// Test script to isolate routes issues
console.log('Testing essential routes loading...');

try {
  console.log('1. Loading express...');
  const express = require('express');
  
  console.log('2. Loading school controller...');
  const schoolController = require('./src/controllers/schoolController');
  
  console.log('3. Loading auth middleware...');
  const { protect, checkRole } = require('./src/middlewares/authMiddleware');
  
  console.log('4. Loading validation middleware...');
  const { validateSchoolRegistration } = require('./src/middlewares/validation');
  
  console.log('5. Loading rate limiter...');
  const { generalLimiter } = require('./src/middlewares/rateLimiter');
  
  console.log('6. Loading school routes...');
  const schoolRoutes = require('./src/routes/schoolRoutes');
  
  console.log('7. Loading tournament routes...');
  const tournamentRoutes = require('./src/routes/tournamentRoutes');
  
  console.log('✅ All essential route dependencies loaded successfully!');
  
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error('Stack trace:', error.stack);
}
