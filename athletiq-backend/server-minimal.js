// server-minimal.js - Minimal server for testing
require('dotenv').config();

console.log('🔍 Starting minimal server...');

const express = require('express');
const app = express();

console.log('✅ Express loaded');

// Basic middleware
app.use(express.json());
console.log('✅ JSON middleware added');

// Test routes
app.get('/', (req, res) => {
  console.log('Root endpoint called');
  res.send('Minimal server running');
});

app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'Test successful', timestamp: new Date().toISOString() });
});

console.log('✅ Routes added');

const PORT = 5001;
console.log(`🔧 Starting server on port ${PORT}...`);

const server = app.listen(PORT, () => {
  console.log(`🚀 Minimal server started successfully on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  process.exit(1);
});

// Test after 2 seconds
setTimeout(() => {
  console.log('✅ Server is running successfully');
}, 2000);
