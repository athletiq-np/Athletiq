// test-individual-routes.js - Test each route individually
require('dotenv').config();

console.log('🔍 Testing individual routes...');

const express = require('express');
const app = express();
app.use(express.json());

const routes = [
  { name: 'schools', path: './src/routes/schoolRoutes' },
  { name: 'players', path: './src/routes/playerRoutes' },
  { name: 'tournaments', path: './src/routes/tournamentRoutes' },
  { name: 'admin', path: './src/routes/adminRoutes' },
  { name: 'teams', path: './src/routes/teamRoutes' },
  { name: 'registrations', path: './src/routes/registrationRoutes' },
  { name: 'health', path: './src/routes/health' },
  { name: 'upload', path: './src/routes/uploadRoutes' },
  { name: 'ocr', path: './src/routes/ocr' }
];

async function testRoute(route) {
  console.log(`🔧 Testing ${route.name} route...`);
  try {
    const routeModule = require(route.path);
    console.log(`✅ ${route.name} route loaded successfully`);
    
    // Try to use it
    app.use(`/api/${route.name}`, routeModule);
    console.log(`✅ ${route.name} route registered successfully`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error with ${route.name} route:`, error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

async function testAllRoutes() {
  for (const route of routes) {
    const success = await testRoute(route);
    if (!success) {
      console.log(`❌ Stopping at ${route.name} route due to error`);
      process.exit(1);
    }
    
    // Small delay to see progress
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✅ All routes tested successfully!');
  process.exit(0);
}

// Handle hanging
setTimeout(() => {
  console.log('⚠️  Route testing taking too long, forcing exit...');
  process.exit(1);
}, 30000);

testAllRoutes().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
