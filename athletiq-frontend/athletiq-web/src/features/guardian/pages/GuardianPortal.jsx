import React, { useState } from 'react';
import { GuardianAuthProvider, useGuardianAuth } from '../hooks/useGuardianAuth';
import GuardianLogin from '../components/GuardianLogin';
import GuardianRegistrationNew from '../components/GuardianRegistrationNew';
import GuardianDashboard from '../components/GuardianDashboard';

function GuardianPortalContent() {
  const { isAuthenticated, guardian, loading } = useGuardianAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show dashboard
  if (isAuthenticated && guardian) {
    return <GuardianDashboard />;
  }

  // Show login or registration based on state
  if (showLogin) {
    return (
      <GuardianLogin
        onSuccess={() => {
          // Dashboard will be shown automatically when authentication state updates
        }}
        onSwitchToRegister={() => setShowLogin(false)}
      />
    );
  }

  return (
    <GuardianRegistrationNew
      onSuccess={() => {
        // Dashboard will be shown automatically when authentication state updates
      }}
      onSwitchToLogin={() => setShowLogin(true)}
    />
  );
}

export default function GuardianPortal() {
  return (
    <GuardianAuthProvider>
      <GuardianPortalContent />
    </GuardianAuthProvider>
  );
}
