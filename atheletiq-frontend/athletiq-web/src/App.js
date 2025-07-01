// src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import dashboards and general pages
import Login from "./pages/auth/Login";
import SchoolDashboard from '@/pages/school/SchoolDashboard';
import AdminDashboard from "./pages/admin/AdminDashboard";
import PlayerDashboard from "./pages/player/PlayerDashboard";

// Tournament specific pages - based on your provided file structure
import TournamentListPage from "./pages/admin/tournaments/TournamentListPage";
import TournamentCreate from "./pages/admin/tournaments/TournamentCreate";
import TournamentSetup from "./pages/admin/tournaments/TournamentSetup";

// Get role from localStorage
function getUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.role || null;
  } catch (error) {
    console.error("Error fetching user role from localStorage:", error);
    // Return null or handle the error appropriately, perhaps clearing localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
}

/**
 * A wrapper component for private routes that enforces authentication and role-based access.
 * @param {object} props - The props for the PrivateRoute.
 * @param {React.ReactNode} props.children - The child components to render if authorized.
 * @param {string[]} props.allowedRoles - An array of roles allowed to access this route.
 */
function PrivateRoute({ children, allowedRoles }) {
  const userRole = getUserRole(); // Get the current user's role from local storage

  // --- ADDED FOR DEBUGGING ---
  console.log("PrivateRoute Check:");
  console.log("  Current Path:", window.location.pathname);
  console.log("  User Role from localStorage:", userRole);
  console.log("  Allowed Roles for this route:", allowedRoles);
  // --- END DEBUGGING ---

  // If no user role is found (meaning not logged in or localStorage problem), redirect to login
  if (!userRole) {
    console.log("  Redirecting to login: No user role found.");
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and the user's role is not in the allowed list, redirect to login
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log(`  Redirecting to login: User role '${userRole}' not allowed. Required: ${allowedRoles.join(', ')}.`);
    // Optionally, you might navigate to an /unauthorized page instead of /login
    return <Navigate to="/login" replace />;
  }

  // If authorized, render the children components
  console.log("  Access GRANTED.");
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Private Routes requiring specific roles */}

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={["super_admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Tournaments List Page */}
        <Route
          path="/admin/tournaments"
          element={
            <PrivateRoute allowedRoles={["super_admin"]}>
              <TournamentListPage />
            </PrivateRoute>
          }
        />

        {/* Route for creating a NEW tournament using the wizard */}
        <Route
          path="/admin/tournaments/create"
          element={
            <PrivateRoute allowedRoles={["super_admin"]}>
              <TournamentCreate />
            </PrivateRoute>
          }
        />

        {/* Route for setting up an EXISTING tournament after creation. */}
        <Route
          path="/admin/tournaments/:id/setup"
          element={
            <PrivateRoute allowedRoles={["super_admin"]}>
              <TournamentSetup />
            </PrivateRoute>
          }
        />

        {/* School Admin Dashboard */}
        <Route
          path="/school-dashboard"
          element={
            <PrivateRoute allowedRoles={["school_admin"]}>
              <SchoolDashboard />
            </PrivateRoute>
          }
        />

        {/* Player Dashboard */}
        <Route
          path="/player-dashboard"
          element={
            <PrivateRoute allowedRoles={["player"]}>
              <PlayerDashboard />
            </PrivateRoute>
          }
        />

      
        {/* Catch-all route: Redirects any unmatched paths to the login page */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
