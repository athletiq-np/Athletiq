// Test Tournament Page - No Authentication Required
import React from 'react';
import TournamentDashboard from '../components/dashboard/TournamentDashboard';

export default function TestTournamentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tournament System Test</h1>
          <p className="mt-2 text-gray-600">Testing tournament dashboard functionality without authentication</p>
        </div>
        <TournamentDashboard />
      </div>
    </div>
  );
}
