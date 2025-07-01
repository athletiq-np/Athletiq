// src/components/DashboardLayout.js

import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/**
 * DashboardLayout: wraps dashboard pages with a sidebar and topbar.
 * Props:
 *  - user: current user object (for user info, role, etc)
 *  - school: school info (optional, for school dashboards)
 *  - sidebarLinks: array of { label, icon, onClick, active }
 *  - onLogout: function to call on logout
 *  - children: main page content
 */
export default function DashboardLayout({
  user,
  school,
  sidebarLinks = [],
  onLogout,
  children,
}) {
  return (
    <div className="min-h-screen flex bg-athletiq-cream">
      {/* Sidebar */}
      <Sidebar
        user={user}
        school={school}
        links={sidebarLinks}
        onLogout={onLogout}
      />
      {/* Main Area */}
      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <Topbar user={user} school={school} onLogout={onLogout} />
        {/* Page Content */}
        <main className="flex-1 p-8 bg-athletiq-cream">{children}</main>
      </div>
    </div>
  );
}
