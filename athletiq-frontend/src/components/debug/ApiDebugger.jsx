// src/components/debug/ApiDebugger.jsx
import React, { useState } from 'react';
import { registerPlayer } from '@/api/playerApi';
import { authStorage } from '@/config/auth.config';
import apiClient from '@/utils/apiClient';

const ApiDebugger = () => {
  const [logs, setLogs] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const checkAuth = async () => {
    try {
      const token = authStorage.getToken();
      const user = authStorage.getUser();
      
      addLog(`Token exists: ${!!token}`, token ? 'success' : 'error');
      addLog(`User data: ${user ? JSON.stringify(user) : 'None'}`, user ? 'success' : 'error');

      if (token) {
        // Test API call with authentication
        const response = await apiClient.get('/auth/unified/verify');
        addLog(`Auth verification successful: ${JSON.stringify(response.data)}`, 'success');
        setIsAuthenticated(true);
      } else {
        addLog('No authentication token found', 'error');
        setIsAuthenticated(false);
      }
    } catch (error) {
      addLog(`Auth check failed: ${error.message}`, 'error');
      setIsAuthenticated(false);
    }
  };

  const testAthletesEndpoint = async () => {
    try {
      addLog('Testing athletes endpoint (GET)...', 'info');
      const response = await apiClient.get('/athletes/');
      addLog(`Athletes endpoint successful: ${JSON.stringify(response.data)}`, 'success');
    } catch (error) {
      addLog(`Athletes endpoint failed: ${error.message}`, 'error');
      console.error('Athletes endpoint error:', error);
    }
  };

  const testAthleteCreation = async () => {
    try {
      addLog('Testing athlete creation...', 'info');
      
      const formData = new FormData();
      formData.append('full_name', 'Test Player');
      formData.append('full_name_nepali', 'टेस्ट प्लेयर');
      formData.append('date_of_birth', '2000-01-01');
      formData.append('gender', 'Male');
      formData.append('primary_sport', 'Basketball');
      formData.append('guardian_name', 'Test Guardian');
      formData.append('guardian_contact', '9800000000');
      formData.append('citizenship_no', 'TEST123456');
      
      const response = await registerPlayer(formData);
      addLog(`Athlete creation successful: ${JSON.stringify(response)}`, 'success');
    } catch (error) {
      addLog(`Athlete creation failed: ${error.message}`, 'error');
      console.error('Athlete creation error:', error);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">API Debugger</h2>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={checkAuth}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Check Authentication
        </button>
        
        <button
          onClick={testAthletesEndpoint}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={!isAuthenticated}
        >
          Test Athletes Endpoint (GET)
        </button>
        
        <button
          onClick={testAthleteCreation}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          disabled={!isAuthenticated}
        >
          Test Athlete Creation (POST)
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Logs
        </button>
      </div>

      {/* Authentication Status */}
      <div className={`p-4 rounded mb-4 ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        Authentication Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>

      {/* Logs */}
      <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
        <h3 className="font-semibold mb-3">Debug Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet. Click buttons above to test API calls.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${
                  log.type === 'success' ? 'bg-green-200 text-green-800' :
                  log.type === 'error' ? 'bg-red-200 text-red-800' :
                  'bg-blue-200 text-blue-800'
                }`}
              >
                <span className="font-mono text-xs text-gray-600">[{log.timestamp}]</span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiDebugger;