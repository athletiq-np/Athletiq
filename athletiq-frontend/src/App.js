//
// 🧠 ATHLETIQ - App.js (Enhanced with Error Boundaries & Code Splitting)
//
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Removed Zustand store - using useAuth hook instead

// Import i18n configuration
import i18n from './i18n';

// Import Theme Provider
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/hooks/useAuth';

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
  GuardianAuthProvider,
} from '@/features/guardian';

// Import unified routes
import AppRoutes from '@/routes/AppRoutes';

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
  // Using AuthProvider context instead of Zustand store

  // Wrap the app with Router at the top level
  return (
    <Router>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AuthProvider>
            <GuardianAuthProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </GuardianAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nextProvider>
    </Router>
  );
}

export default App;