// Test Page for PDF Functionality
import React, { useState, useEffect } from 'react';
import KnockoutBracket from '../components/tournament/bracket/visualizations/KnockoutBracket';
import { generatePlaceholderBracket } from '../utils/bracketGenerator';

const PDFTestPage = () => {
  const [bracketSize, setBracketSize] = useState(8);
  const [backendStatus, setBackendStatus] = useState({
    status: 'checking',
    message: 'Checking backend connection...',
    className: 'text-gray-700'
  });
  
  // Check backend status on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/pdf/status');
        if (response.ok) {
          setBackendStatus({
            status: 'online',
            message: '✅ Backend is running and PDF service is available',
            className: 'text-green-700'
          });
        } else {
          setBackendStatus({
            status: 'issues',
            message: '❌ Backend is running but PDF service has issues',
            className: 'text-red-700'
          });
        }
      } catch (error) {
        setBackendStatus({
          status: 'offline',
          message: '❌ Backend is not running. Start the backend server on port 5000.',
          className: 'text-red-700'
        });
      }
    };

    // Check status after a short delay
    const timer = setTimeout(checkBackendStatus, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Generate test tournament data
  const testTournament = {
    id: 'test-tournament-001',
    name: 'Test Football Tournament',
    sport: 'football',
    maxParticipants: bracketSize,
    status: 'active',
    format: 'knockout',
    location: 'Test Stadium',
    date: new Date().toISOString()
  };

  // Generate test bracket
  const testBracket = generatePlaceholderBracket(bracketSize, 'knockout');

  const handleBracketSizeChange = (newSize) => {
    setBracketSize(newSize);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 PDF Generation Test Page
          </h1>
          <p className="text-gray-600 mb-4">
            This page allows you to test the PDF scoresheet generation functionality.
            Use the buttons in the bracket header to download PDFs.
          </p>
          
          <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <label htmlFor="bracketSize" className="font-medium text-blue-900">
              Bracket Size:
            </label>
            <select
              id="bracketSize"
              value={bracketSize}
              onChange={(e) => handleBracketSizeChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={4}>4 Teams</option>
              <option value={8}>8 Teams</option>
              <option value={16}>16 Teams</option>
              <option value={32}>32 Teams</option>
            </select>
            
            <div className="ml-auto text-sm text-blue-700">
              <strong>Instructions:</strong> Look for "Round Scoresheets" and "All Scoresheets" buttons in the bracket header
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <KnockoutBracket
            bracket={testBracket}
            tournament={testTournament}
            isLocked={false}
            onTeamUpdate={() => {}}
            onScoreUpdate={() => {}}
            onBracketSizeChange={handleBracketSizeChange}
          />
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Test Instructions:</h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li>Click "Round Scoresheets" to download PDFs for the current round</li>
            <li>Click "All Scoresheets" to download all tournament scoresheets as a ZIP</li>
            <li>Check your browser's Downloads folder for the generated files</li>
            <li>Open the browser's developer console to see any error messages</li>
            <li>The backend server must be running on port 5000 for PDF generation to work</li>
          </ul>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Backend Status Check:</h3>
          <div className={backendStatus.className}>
            {backendStatus.message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFTestPage;
