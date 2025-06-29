// src/components/Topbar.js

import React from "react";
import { Bell, Globe, UserCircle2 } from "lucide-react";

/**
 * Topbar for all dashboards (future-proof, role-aware)
 * Props:
 * - user: logged in user object
 * - pageTitle: title to show (Dashboard, Players, Schools, etc.)
 * - onLanguageChange: (future) callback for language selector
 * - notifications: (future) array or count of notifications
 */
export default function Topbar({
  user,
  pageTitle = "Dashboard",
  onLanguageChange,
  notifications = [],
}) {
  return (
    <header className="w-full h-16 flex items-center justify-between px-8 bg-white border-b border-athletiq-blue/20 shadow-sm z-10">
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold text-athletiq-navy">{pageTitle}</span>
        {/* Optional: Breadcrumbs/Back button in future */}
      </div>

      {/* Right: Notification, Language, User */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative text-athletiq-blue hover:text-athletiq-green transition">
          <Bell size={22} />
          {/* Badge for unread count */}
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-athletiq-green text-white rounded-full px-1.5 text-xs font-bold">
              {notifications.length}
            </span>
          )}
        </button>
        {/* Language Switcher */}
        <select
          className="bg-athletiq-blue text-white rounded px-2 py-1 text-sm focus:outline-none"
          style={{ minWidth: 70 }}
          onChange={(e) => onLanguageChange?.(e.target.value)}
          defaultValue="en"
          disabled
        >
          <option value="en">EN</option>
          <option value="np">ने</option>
        </select>

        {/* User avatar & name */}
        <div className="flex items-center gap-3">
          {/* Avatar: fallback to initials if no image */}
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border border-athletiq-blue"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-athletiq-gray flex items-center justify-center text-white font-bold text-lg border border-athletiq-blue">
              {user?.full_name ? user.full_name[0].toUpperCase() : <UserCircle2 />}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-athletiq-navy font-bold text-sm">{user?.full_name || user?.email}</span>
            <span className="text-athletiq-gray text-xs capitalize">{user?.role?.replace("_", " ")}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * ONBOARDING NOTES:
 * - Use this Topbar for all dashboards (super admin, school admin, player, etc.)
 * - Page title can be set from each page/layout
 * - Notification icon & badge are ready for integration
 * - Language selector is a placeholder (Nepali/English), wire up onLanguageChange when ready
 * - Avatar falls back to initial or generic icon
 * - Style matches ATHLETIQ blue/green/navy theme
 */
