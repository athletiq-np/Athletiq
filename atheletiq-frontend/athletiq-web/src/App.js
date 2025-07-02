//
// 🧠 ATHLETIQ - App.js (Rewritten with Nested & Protected Layout Routes)
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
import SchoolDashboard from '@/pages/school/SchoolDashboard';
import NotFoundPage from '@/pages/public/NotFoundPage'; // A component for 404 errors

function App() {
  const { user, setUser, clearUser, isLoading, setLoading } = useUserStore();

  // This effect runs once on app load to check for a logged-in user
  useEffect(() => {
    const checkLoggedInUser = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        console.log('No active session found.');
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    checkLoggedInUser();
  }, [setUser, clearUser, setLoading]);

  // While checking auth, show a loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading Application...</div>
      </div>
    );
  }

  // Render the application routes
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- Protected Dashboard Routes (New Structure) --- */}
        <Route
          path="/"
          element={
            // 1. First, check if the user is logged in at all.
            <ProtectedRoute> 
              {/* 2. If logged in, render the main dashboard layout (sidebar, navbar, etc.) */}
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* All routes nested here will appear inside the DashboardLayout */}
          
          {/* Admin-only routes */}
          <Route 
            path="admin/dashboard" 
            element={
              <ProtectedRoute roles={['SuperAdmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* School-only routes */}
          <Route 
            path="school/dashboard" 
            element={
              <ProtectedRoute roles={['SchoolAdmin']}>
                <SchoolDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Add other dashboard pages for different roles here */}
        </Route>

        {/* --- Not Found Route --- */}
        {/* This catch-all route renders if no other route matches */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;