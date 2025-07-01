import React from "react";
import { Navigate } from "react-router-dom";

// roles: pass as array, e.g. ["school_admin"]
export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    // User logged in but wrong role
    return <Navigate to="/" replace />;
  }
  return children;
}
