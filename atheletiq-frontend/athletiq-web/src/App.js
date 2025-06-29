// src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import dashboards
import Login from "./pages/Login";
import SchoolDashboard from "./pages/SchoolDashboard";
import SuperAdminDashboard from "./pages/AdminDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import RefereeDashboard from "./pages/RefereeDashboard";
import OrgDashboard from "./pages/OrgDashboard";
import TournamentsPage from "./pages/TournamentsPage";
import TournamentSetup from "./pages/TournamentSetup"; // ✅ NEW

// Get role from localStorage
function getUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

// Private route wrapper
function PrivateRoute({ children, role }) {
  const userRole = getUserRole();
  if (!userRole) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <PrivateRoute role="super_admin">
              <SuperAdminDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/tournaments"
          element={
            <PrivateRoute role="super_admin">
              <TournamentsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/superadmin/tournaments/:id/setup"
          element={
            <PrivateRoute role="super_admin">
              <TournamentSetup />
            </PrivateRoute>
          }
        />

        <Route
          path="/school-dashboard"
          element={
            <PrivateRoute role="school_admin">
              <SchoolDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/player-dashboard"
          element={
            <PrivateRoute role="player">
              <PlayerDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/coach-dashboard"
          element={
            <PrivateRoute role="coach">
              <CoachDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/referee-dashboard"
          element={
            <PrivateRoute role="referee">
              <RefereeDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/org-dashboard"
          element={
            <PrivateRoute role="organization">
              <OrgDashboard />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
