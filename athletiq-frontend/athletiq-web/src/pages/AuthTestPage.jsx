/**
 * Simple test page to verify authentication state
 */

import React, { useState, useEffect } from 'react';
import { createTournament } from '@api/tournamentApi';
import useUserStore from '@/store/userStore';

export default function AuthTestPage() {
  const { user } = useUserStore();
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('Testing authentication...');
      console.log('User from store:', user);
      console.log('Document cookies:', document.cookie);
      
      const tournamentData = {
        name: 'Auth Test Tournament',
        description: 'Testing authentication',
        start_date: '2024-08-01',
        end_date: '2024-08-03',
        location: 'Test Location',
        status: 'Draft',
        sports_config: []
      };

      const result = await createTournament(tournamentData);
      setTestResult({
        success: true,
        message: 'Tournament created successfully!',
        data: result
      });
    } catch (error) {
      console.error('Auth test failed:', error);
      setTestResult({
        success: false,
        message: error.message || 'Authentication failed',
        error: error.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Current User State:</h2>
        <pre className="text-sm">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Browser Cookies:</h2>
        <pre className="text-sm">
          {document.cookie || 'No cookies found'}
        </pre>
      </div>

      <button
        onClick={testAuth}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Authentication'}
      </button>

      {testResult && (
        <div className={`mt-6 p-4 rounded-lg ${testResult.success ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'} border`}>
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <p className="mb-2">{testResult.message}</p>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
