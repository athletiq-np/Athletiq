//
// 🧠 ATHLETIQ - App.js (Enhanced with Error Boundaries & Code Splitting)
//
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import useUserStore from '@/store/userStore';

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
import SchoolDashboard from '@/pages/school/SchoolDashboard';

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
            path="/admin/settings"
            element={
              <ErrorBoundary title="Admin Dashboard Error">
                <ProtectedRoute roles={['SuperAdmin']}>
                  <Settings />
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

          {/* --- 404 Not Found --- */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;