// src/components/layout/DashboardLayout.jsx

import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaUserPlus,
  FaSchool,
  FaTrophy,
  FaListAlt,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';
import useUserStore from '@/store/userStore';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

const NAV_LINKS = [
  {
    to: '/admin/dashboard',
    icon: <FaHome />,
    label: { en: 'Dashboard', np: 'ड्यासबोर्ड' },
  },
  {
    to: '/admin/players',
    icon: <FaUsers />,
    label: { en: 'Player Roster', np: 'खिलाडी सूची' },
  },
  {
    to: '/admin/players/add',
    icon: <FaUserPlus />,
    label: { en: 'Add Player', np: 'नयाँ खेलाडी' },
  },
  {
    to: '/admin/schools',
    icon: <FaSchool />,
    label: { en: 'Schools', np: 'विद्यालय' },
  },
  {
    to: '/admin/tournaments',
    icon: <FaTrophy />,
    label: { en: 'Tournaments', np: 'टूर्नामेन्ट' },
  },
  {
    to: '/admin/stats',
    icon: <FaListAlt />,
    label: { en: 'Stats', np: 'स्ट्याट्स' },
  },
  {
    to: '/admin/settings',
    icon: <FaCog />,
    label: { en: 'Settings', np: 'सेटिङ' },
  },
];

export default function DashboardLayout() {
  const { user } = useUserStore();
  const location = useLocation();
  const lang = 'en';

  // Logout logic (replace with real API call & Zustand reset as needed)
  const handleLogout = () => {
    // Optionally call /api/auth/logout and clear Zustand state
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-white border-r shadow-md fixed md:relative z-20 h-screen">
        <div className="flex items-center justify-center h-20 border-b">
          <img
            src={athletiqLogo}
            alt="ATHLETIQ"
            className="h-12 w-auto"
            draggable={false}
          />
        </div>
        <nav className="flex-1 py-6 space-y-2">
          {NAV_LINKS.map((link) => (
            <NavLink
              to={link.to}
              key={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isActive || location.pathname.startsWith(link.to)
                    ? 'bg-athletiq-green text-white shadow'
                    : 'text-athletiq-navy hover:bg-athletiq-green/20'
                }`
              }
              end
            >
              <span className="text-xl">{link.icon}</span>
              <span>{link.label[lang]}</span>
            </NavLink>
          ))}
        </nav>
        {/* User Info & Logout */}
        <div className="mt-auto border-t px-6 py-5 flex items-center gap-3 bg-gray-50">
          <div className="flex flex-col">
            <span className="font-semibold text-athletiq-navy">
              {user?.full_name || 'Admin User'}
            </span>
            <span className="text-xs text-gray-500">{user?.email}</span>
          </div>
          <button
            title="Logout"
            className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-full"
            onClick={handleLogout}
          >
            <FaSignOutAlt size={18} />
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 bg-gray-50 min-h-screen p-4 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
