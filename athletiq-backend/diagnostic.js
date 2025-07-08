// Diagnostic script to check backend dependencies and configuration
require('dotenv').config();

console.log('🔍 Athletiq Backend Diagnostic');
console.log('=====================================');

// 1. Check environment variables
console.log('\n📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');

// 2. Check required modules
console.log('\n📦 Checking required modules:');
const requiredModules = [
  'express',
  'cors',
  'cookie-parser',
  'pg',
  'bcryptjs',
  'jsonwebtoken',
  'dotenv'
];

let allModulesOk = true;
requiredModules.forEach(module => {
  try {
    require(module);
    console.log(`✅ ${module}: OK`);
  } catch (error) {
    console.log(`❌ ${module}: Missing - ${error.message}`);
    allModulesOk = false;
  }
});

// 3. Check database connection
console.log('\n🗄️  Checking database connection:');
try {
  const { Pool } = require('pg');
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  pool.connect()
    .then(client => {
      console.log('✅ Database connection: OK');
      return client.query('SELECT NOW()');
    })
    .then(result => {
      console.log('✅ Database query test: OK');
      console.log('   Current time:', result.rows[0].now);
      return pool.end();
    })
    .catch(error => {
      console.log('❌ Database connection failed:', error.message);
    });
} catch (error) {
  console.log('❌ Database module error:', error.message);
}

// 4. Check file paths
console.log('\n📁 Checking critical files:');
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'server.js',
  'src/routes/authRoutes.js',
  'src/controllers/authController.js',
  'src/config/db.js',
  'src/middlewares/errorHandler.js'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: Exists`);
  } else {
    console.log(`❌ ${file}: Missing`);
    allModulesOk = false;
  }
});

console.log('\n🎯 Summary:');
if (allModulesOk) {
  console.log('✅ All dependencies and files are present');
  console.log('🚀 Server should be able to start');
} else {
  console.log('❌ Some dependencies or files are missing');
  console.log('🔧 Please install missing dependencies and check file paths');
}
