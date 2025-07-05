//
// 🧠 ATHLETIQ - App.js (Corrected with Proper Nested Routing)
//
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import useUserStore from '@/store/userStore';

// --- Import Layouts and Page Components ---
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Home from '@/pages/public/Home';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Settings from '@/pages/admin/Settings';
import SchoolDashboard from '@/pages/school/SchoolDashboard';
import NotFoundPage from '@/pages/public/NotFoundPage';

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
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- THIS IS THE FIX --- */}
        {/* All protected dashboard routes are now children of the DashboardLayout. */}
        {/* The path is now correctly defined at the top level. */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['SuperAdmin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* The 'index' route makes AdminDashboard the default page for '/admin' */}
          <Route index element={<AdminDashboard />} />
          {/* Add dashboard route for tab navigation */}
          <Route path="dashboard" element={<AdminDashboard />} />
          {/* Add settings route */}
          <Route path="settings" element={<Settings />} />
          {/* Add other admin-specific pages here, e.g., path="schools" */}
        </Route>

        <Route
          path="/school"
          element={
            <ProtectedRoute roles={['SchoolAdmin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SchoolDashboard />} />
        </Route>

        {/* --- 404 Not Found --- */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;