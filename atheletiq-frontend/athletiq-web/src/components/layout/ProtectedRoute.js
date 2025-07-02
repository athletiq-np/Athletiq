import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useUserStore from '@/store/userStore';

export default function ProtectedRoute({ children, roles }) {
  const { user, isLoading } = useUserStore();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- THIS IS THE FIX ---
  // We compare roles in lowercase to avoid case-sensitivity issues.
  const userRole = user.role.toLowerCase();
  const allowedRoles = roles.map(role => role.toLowerCase());

  if (roles && roles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If all checks pass, render the child component.
  return children;
}