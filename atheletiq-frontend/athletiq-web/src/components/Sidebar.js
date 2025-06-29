// src/components/Sidebar.js

import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook
import Topbar from "./Topbar"; // Ensure Topbar is correctly imported
// Assuming Sidebar is at src/components/Sidebar.js
// and other dashboard components like DashboardLayout, Topbar are also in src/components/

/**
 * Sidebar navigation for dashboard.
 * Props:
 * - user: current user object
 * - school: school object (for logo/school name), optional
 * - links: [{label, icon, onClick, active}]
 * - onLogout: logout handler
 */
export default function Sidebar({ user, school, links = [], onLogout }) {
  const navigate = useNavigate(); // Initialize useNavigate hook

  return (
    <aside className="w-64 min-h-screen bg-athletiq-navy flex flex-col justify-between shadow-xl">
      {/* Top: Logo and School/User Info */}
      <div>
        <div className="flex items-center gap-3 p-6">
          {/* ATHLETIQ Logo */}
          <img
            src="/assets/logo.png" // or process.env.PUBLIC_URL + "/logo.png"
            alt="Athletiq Logo"
            className="h-12 w-40 object-contain rounded bg-white"
          />
          <div>
            {school && (
              <div className="text-sm text-athletiq-green font-semibold flex items-center gap-2">
                {school.logo_url && (
                  <img
                    src={`http://localhost:5000/uploads/${school.logo_url}`}
                    alt="School"
                    className="h-6 w-6 object-cover rounded-full border border-white"
                  />
                )}
                <span>{school.name}</span>
              </div>
            )}
            {!school && user && (
              <div className="text-xs text-athletiq-cream">{user.role?.replace("_", " ")}</div>
            )}
          </div>
        </div>
        {/* Sidebar Links */}
        <nav className="flex flex-col gap-1 mt-6">
          {links.map((link, i) => (
            <button
              key={link.label}
              onClick={link.onClick}
              className={`flex items-center gap-2 px-6 py-2 text-base rounded-lg font-semibold text-left transition
                ${link.active
                  ? "bg-athletiq-green text-white"
                  : "bg-athletiq-navy text-white hover:bg-athletiq-blue/40"}`
              }
              style={{ outline: "none" }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}
          {/* Add Tournament Button - FIXED: Using useNavigate for client-side routing */}
          <button
            className="flex items-center gap-2 px-6 py-2 text-base rounded-lg font-semibold text-left transition
              hover:bg-athletiq-blue/40 bg-athletiq-navy text-white"
            onClick={() => navigate('/admin/tournaments')} // Use navigate instead of window.location.href
          >
            <span>🏆</span>
            <span>Add Tournament</span>
          </button>
        </nav>
      </div>
      {/* Bottom: Logout */}
      <div className="p-6">
        <button
          className="w-full py-2 px-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-700 transition"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
