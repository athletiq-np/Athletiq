// test-route-access.js - Test route access with mock requests
require('dotenv').config();
const express = require('express');
const request = require('supertest');

console.log('Testing route access...');

async function testRoutes() {
  const app = express();
  
  // Basic middleware
  app.use(express.json());
  
  // Add routes
  try {
    console.log('Adding document routes...');
    app.use('/api/documents', require('./src/routes/documentRoutes'));
    console.log('✅ Document routes added');
    
    console.log('Adding AI routes...');
    app.use('/api/ai', require('./src/routes/aiRoutes'));
    console.log('✅ AI routes added');
    
    // Test making a request (this will fail due to auth, but shouldn't hang)
    console.log('Testing document upload endpoint...');
    const response = await request(app)
      .post('/api/documents/upload')
      .attach('document', Buffer.from('test'), 'test.jpg')
      .field('document_type', 'birth_certificate')
      .field('player_id', '1')
      .expect(401); // Should fail with unauthorized
    
    console.log('✅ Document upload endpoint responded (as expected with 401)');
    
  } catch (error) {
    console.error('❌ Error testing routes:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('Route access test completed!');
  process.exit(0);
}

// Handle hanging
setTimeout(() => {
  console.log('⚠️  Route access test taking too long, forcing exit...');
  process.exit(1);
}, 15000);

testRoutes().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
