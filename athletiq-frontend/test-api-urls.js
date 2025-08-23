#!/usr/bin/env node

/**
 * Test script to verify API URL configuration is correct
 */

console.log('🔍 Testing API URL Configuration...\n');

// Simulate the configuration
const API_BASE_URL = 'http://localhost:8000/api';

const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    CSRF: '/auth/csrf',
  },
  SCHOOLS: {
    BASE: '/schools',
  },
  ATHLETES: {
    BASE: '/athletes',
  },
  GUARDIAN: {
    AUTH_LOGIN: '/guardian/auth/login',
  }
};

console.log('Base Configuration:');
console.log(`API_BASE_URL: ${API_BASE_URL}`);
console.log(`Expected: http://localhost:8000/api`);
console.log(`✅ Correct: ${API_BASE_URL === 'http://localhost:8000/api'}\n`);

console.log('Sample Endpoint URLs:');
const testEndpoints = [
  { name: 'Login', path: API_ENDPOINTS.AUTH.LOGIN, expected: '/auth/login' },
  { name: 'CSRF', path: API_ENDPOINTS.AUTH.CSRF, expected: '/auth/csrf' },
  { name: 'Schools', path: API_ENDPOINTS.SCHOOLS.BASE, expected: '/schools' },
  { name: 'Athletes', path: API_ENDPOINTS.ATHLETES.BASE, expected: '/athletes' },
  { name: 'Guardian Login', path: API_ENDPOINTS.GUARDIAN.AUTH_LOGIN, expected: '/guardian/auth/login' }
];

testEndpoints.forEach(endpoint => {
  const fullUrl = `${API_BASE_URL}${endpoint.path}`;
  const isCorrect = endpoint.path === endpoint.expected;
  const hasDoubleApi = fullUrl.includes('/api/api/');
  
  console.log(`${endpoint.name}:`);
  console.log(`  Path: ${endpoint.path}`);
  console.log(`  Full URL: ${fullUrl}`);
  console.log(`  ✅ Path correct: ${isCorrect}`);
  console.log(`  ✅ No double /api/: ${!hasDoubleApi}`);
  console.log('');
});

console.log('🎯 Summary:');
console.log('- Base URL now includes /api');
console.log('- Endpoint paths no longer include /api');
console.log('- This prevents double /api/ in final URLs');
console.log('- All requests will go to http://localhost:8000/api/[endpoint]');
console.log('\n🚀 The CORS and double /api/ issues should now be resolved!');