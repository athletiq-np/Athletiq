import React, { useEffect } from 'react';
import { GuardianAuthProvider, useGuardianAuth } from '../hooks/useGuardianAuth';
import GuardianDashboard from '../components/GuardianDashboard';
import GuardianLogin from '../components/GuardianLogin';
import { FaInfoCircle } from 'react-icons/fa';

// Dashboard content that checks auth status
function DashboardContent() {
  const { isAuthenticated, loading } = useGuardianAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Guardian Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FaInfoCircle className="text-blue-600 mr-2" />
              <p className="text-blue-800 text-sm">
                Please log in to access the Guardian Dashboard
              </p>
            </div>
          </div>
          <GuardianLogin 
            onSuccess={() => {
              // Will automatically redirect to dashboard when authenticated
            }}
            onSwitchToRegister={() => {
              window.location.href = '/guardian';
            }}
          />
        </div>
      </div>
    );
  }

  return <GuardianDashboard />;
}

// Standalone dashboard wrapper with auth provider for direct access
export default function GuardianDashboardStandalone() {
  return (
    <GuardianAuthProvider>
      <DashboardContent />
    </GuardianAuthProvider>
  );
}
