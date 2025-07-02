//
// 🧠 ATHLETIQ - Protected Route (Upgraded for Zustand)
//
// This component acts as a gatekeeper for pages that require a user
// to be logged in. It now uses the central Zustand store as its single
// source of truth for authentication status, instead of localStorage.
//

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useUserStore from '@/store/userStore';

/**
 * @desc    A component to protect routes based on user authentication and roles.
 * @param   {React.ReactNode} children - The component/page to render if authorized.
 * @param   {Array<string>} [roles] - An optional array of roles permitted to access this route.
 */
export default function ProtectedRoute({ children, roles }) {
  // 1. Get user and loading state directly from our global Zustand store.
  const { user, isLoading } = useUserStore();
  const location = useLocation();

  // 2. Handle the initial loading state.
  // While our app is checking for a logged-in user on startup, we show a
  // simple loading indicator. This prevents the app from redirecting to the
  // login page before the check is complete.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // 3. Handle the "Not Authenticated" case.
  // If the loading check is finished and there is still no user object in our
  // store, we redirect the user to the login page. We also pass the original
  // location they were trying to visit, so we can send them back there after login.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Handle the "Not Authorized" (Wrong Role) case.
  // If the route requires specific roles and the logged-in user's role
  // is not included in the list, we redirect them to a dedicated "Unauthorized" page.
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 5. If all checks pass, the user is authenticated and authorized.
  // We render the child component (the actual page they wanted to visit).
  return children;
}