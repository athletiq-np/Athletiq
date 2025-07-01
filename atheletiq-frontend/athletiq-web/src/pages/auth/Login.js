// src/pages/Login.js

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/**
 * ATHLETIQ Universal Login Page
 * Supports: super_admin, school_admin, player, coach, referee, organization, etc.
 * 
 * - Use email or phone as identifier.
 * - Stores JWT token and user info in localStorage.
 * - Redirects user to dashboard based on role.
 * - Error handling and loading states.
 * 
 * ONBOARDING NOTES:
 * - The /api/auth/login endpoint expects: { identifier, password }
 * - Returns: { token, user: { id, role, email, ... } }
 * - Add routes for "/admin", "/school-dashboard", "/player-dashboard" in App.js
 */

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // Email or phone
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Submit login form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // POST to backend
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: identifier.trim(),
        password,
      });

      const { token, user } = res.data;
      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Route based on role (customize as needed)
      if (user.role === "super_admin") {
        navigate("/admin");
      } else if (user.role === "school_admin") {
        navigate("/school-dashboard");
      } else if (user.role === "player") {
        navigate("/player-dashboard");
      } else if (user.role === "coach") {
        navigate("/coach-dashboard");
      } else if (user.role === "referee") {
        navigate("/referee-dashboard");
      } else if (user.role === "organization") {
        navigate("/org-dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      setErr(
        error?.response?.data?.message ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">ATHLETIQ Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 font-medium">
              Email or Phone
            </label>
            <input
              className="w-full border p-2 rounded"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              placeholder="Enter email or phone"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Password</label>
            <input
              className="w-full border p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter password"
            />
          </div>
          {err && <div className="text-red-500">{err}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded py-2"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {/* Optional: add registration or forgot password links here */}
      </div>
    </div>
  );
}
