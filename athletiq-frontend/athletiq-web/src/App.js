//
// 🧠 ATHLETIQ - App.js (Enhanced with Error Boundaries & Code Splitting)
//
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import apiClient from '@/api/apiClient';
import useUserStore from '@/store/userStore';

// Import i18n configuration
import i18n from './i18n';

// Import Theme Provider
import { ThemeProvider } from '@/contexts/ThemeContext';

// Import Error Boundary
import ErrorBoundary from '@/components/common/ErrorBoundary';

// --- Import Layouts and Common Components ---
import ProtectedRoute from '@/components/layout/ProtectedRoute';

// Immediate load components (critical path)
import Home from '@/pages/public/Home';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import NotFoundPage from '@/pages/public/NotFoundPage';

// Import admin components directly (simple and clean)
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Settings from '@/pages/admin/Settings';
import NepalAthleteMonitor from '@/pages/admin/NepalAthleteMonitor'; // Nepal Athlete System Monitor
import SchoolDashboard from '@/pages/school/SchoolDashboard';

// Import athlete components
import AthleteRegister from '@/pages/athlete/AthleteRegister';
import AthleteList from '@/pages/athlete/AthleteList';
import AthleteProfile from '@/pages/athlete/AthleteProfile';

// Import guardian components
import { 
  GuardianClaimPortal,
  ModernGuardianPortal, 
  SimpleGuardianPortal,
  GuardianDashboard,
  GuardianAuthProvider,
  GuardianRegistrationNew
} from '@/features/guardian';
import GuardianPortal from '@/features/guardian/pages/GuardianPortal';
import GuardianDashboardStandalone from '@/features/guardian/pages/GuardianDashboardStandalone';
import GuardianTestPage from '@/pages/test/GuardianTestPage';

// Tournament creation component
import TournamentCreate from '@/pages/admin/tournaments/TournamentCreate';

// Test pages
import PDFTestPage from '@/pages/PDFTestPage';

// Loading component
const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-athletiq-green mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

function App() {
  const { setUser, clearUser, isLoading, setLoading } = useUserStore();

  // Removed auto-login check - users must manually login
  useEffect(() => {
    clearUser(); // Clear any existing user data
    setLoading(false); // Set loading to false immediately
  }, [clearUser, setLoading]);

  // While checking auth, show a loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading Application...</div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <GuardianAuthProvider>
          <ErrorBoundary 
            title="Application Error"
            description="Something went wrong with the Athletiq application. We're working to fix this issue."
          >
            <Router>
            <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* --- Guardian Routes --- */}
            <Route path="/guardian" element={<GuardianPortal />} />
            <Route path="/guardian/register" element={<GuardianRegistrationNew />} />
            <Route path="/guardian/dashboard" element={<GuardianDashboardStandalone />} />
            <Route path="/guardian/claim/:claimCode" element={<GuardianClaimPortal />} />
            <Route path="/guardian-claim" element={<GuardianClaimPortal />} />
            <Route path="/guardian-modern" element={<SimpleGuardianPortal />} />
            <Route path="/guardian-dashboard" element={<GuardianDashboardStandalone />} />
            <Route path="/guardian-test" element={<GuardianTestPage />} />
            
            {/* --- Test Routes --- */}
            <Route path="/test/pdf" element={<PDFTestPage />} />

            {/* --- Protected Admin Routes --- */}
            <Route
              path="/admin"
            element={
              <ErrorBoundary title="Admin Dashboard Error">
                <ProtectedRoute roles={['SuperAdmin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ErrorBoundary title="Admin Dashboard Error">
                <ProtectedRoute roles={['SuperAdmin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/tournaments/create"
            element={
              <ErrorBoundary title="Tournament Creation Error">
                <ProtectedRoute roles={['SuperAdmin']}>
                  <TournamentCreate />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ErrorBoundary title="Admin Dashboard Error">
                <ProtectedRoute roles={['SuperAdmin']}>
                  <Settings />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/nepal-athlete-monitor"
            element={
              <ErrorBoundary title="Nepal Athlete Monitor Error">
                <ProtectedRoute roles={['SuperAdmin']}>
                  <NepalAthleteMonitor />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />

          {/* --- Protected School Routes --- */}
          <Route
            path="/school"
            element={
              <ErrorBoundary title="School Dashboard Error">
                <ProtectedRoute roles={['SchoolAdmin']}>
                  <SchoolDashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/school/tournaments/create"
            element={
              <ErrorBoundary title="Tournament Creation Error">
                <ProtectedRoute roles={['SchoolAdmin']}>
                  <TournamentCreate />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />

          {/* --- Athlete Routes --- */}
          <Route
            path="/athlete/register"
            element={
              <ErrorBoundary title="Athlete Registration Error">
                <ProtectedRoute roles={['SuperAdmin', 'SchoolAdmin']}>
                  <AthleteRegister />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/athletes"
            element={
              <ErrorBoundary title="Athletes List Error">
                <ProtectedRoute roles={['SuperAdmin', 'SchoolAdmin']}>
                  <AthleteList />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/athlete/:id"
            element={
              <ErrorBoundary title="Athlete Profile Error">
                <ProtectedRoute roles={['SuperAdmin', 'SchoolAdmin', 'Athlete']}>
                  <AthleteProfile />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/athlete/profile"
            element={
              <ErrorBoundary title="Athlete Profile Error">
                <ProtectedRoute roles={['Athlete']}>
                  <AthleteProfile />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />

          {/* --- 404 Not Found --- */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
            </ErrorBoundary>
        </GuardianAuthProvider>
    </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;