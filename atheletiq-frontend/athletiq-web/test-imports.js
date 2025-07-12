// Test import to verify TeamsManagement component
import React from 'react';

// Test importing the TeamsManagement component
try {
  const TeamsManagement = require('../src/components/features/school/TeamsManagement.jsx');
  console.log('✅ TeamsManagement component imports successfully');
  console.log('Component type:', typeof TeamsManagement.default);
} catch (error) {
  console.error('❌ Import error:', error.message);
}

// Test importing the API client
try {
  const apiClient = require('../src/api/apiClient.js');
  console.log('✅ API Client imports successfully');
  console.log('API Client type:', typeof apiClient.default);
} catch (error) {
  console.error('❌ API Client import error:', error.message);
}
