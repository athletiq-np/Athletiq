import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleBasedRouter from '@/components/auth/RoleBasedRouter';

// Auth components
import Login from '@/pages/auth/Login';

// Dashboard components
import GlobalAdminDashboard from '@/components/features/admin/GlobalAdminDashboard';
import SchoolDashboard from '@/pages/school/SchoolDashboard';
import GuardianDashboard from '@/features/guardian/components/GuardianDashboard';

// Error pages
const UnauthorizedPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
      <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
      <button 
        onClick={() => window.history.back()}
        className="bg-athletiq-green text-white px-4 py-2 rounded-md hover:bg-green-700"
      >
        Go Back
      </button>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <Navigate to="/" replace />
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route 
        path="/test-modal" 
        element={
          <Suspense fallback={<div>Loading test page...</div>}>
            {React.createElement(React.lazy(() => import('@/components/TestModalPage')))}
          </Suspense>
        } 
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes with role-based access */}
      <Route path="/" element={
        <ProtectedRoute>
          <RoleBasedRouter>
            <Navigate to="/dashboard" replace />
          </RoleBasedRouter>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute requiredRoles={['superadmin', 'super_admin', 'super-admin', 'admin']}>
          <Routes>
            <Route path="" element={<GlobalAdminDashboard />} />
            <Route path="dashboard" element={<GlobalAdminDashboard />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* School Admin routes */}
      <Route path="/school/*" element={
        <ProtectedRoute requiredRoles={['schooladmin', 'school_admin', 'school-admin', 'SchoolAdmin']}>
          <Routes>
            <Route path="" element={<SchoolDashboard />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Guardian routes */}
      <Route path="/guardian/*" element={
        <ProtectedRoute requiredUserTypes={['guardian']} requiredRoles={['Guardian']}>
          <Routes>
            <Route path="" element={<GuardianDashboard />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Coach routes */}
      <Route path="/coach/*" element={
        <ProtectedRoute requiredRoles={['Coach']}>
          <Routes>
            <Route path="dashboard" element={<div>Coach Dashboard - Coming Soon</div>} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Referee routes */}
      <Route path="/referee/*" element={
        <ProtectedRoute requiredRoles={['Referee']}>
          <Routes>
            <Route path="dashboard" element={<div>Referee Dashboard - Coming Soon</div>} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Organization routes */}
      <Route path="/organization/*" element={
        <ProtectedRoute requiredRoles={['Organization']}>
          <Routes>
            <Route path="dashboard" element={
              <Suspense fallback={<div>Loading Organization Dashboard...</div>}>
                {React.createElement(React.lazy(() => import('@/pages/organization/OrganizationDashboard')))}
              </Suspense>
            } />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Generic dashboard route - will redirect based on role */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <RoleBasedRouter>
            <div>Redirecting...</div>
          </RoleBasedRouter>
        </ProtectedRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;