//
// 🏅 ATHLETIQ - DashboardLayout
// Universal layout for all dashboard roles (SuperAdmin, SchoolAdmin, etc.)
// Features: Branded sidebar, topbar, language switch, profile, and responsive design.
//

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useUserStore from '@/store/userStore';
import {
  FaHome, FaSchool, FaUserGraduate, FaTrophy, FaCog, FaSignOutAlt, FaBars, FaTimes
} from 'react-icons/fa';

import athletiqLogo from '@/assets/logos/athletiq-logo.png'; // Update path as needed

const navLinks = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: <FaHome />,
    roles: ['SuperAdmin', 'SchoolAdmin'], // Show for both
  },
  {
    label: 'Schools',
    path: '/admin/schools',
    icon: <FaSchool />,
    roles: ['SuperAdmin'],
  },
  {
    label: 'Players',
    path: '/admin/players',
    icon: <FaUserGraduate />,
    roles: ['SuperAdmin', 'SchoolAdmin'],
  },
  {
    label: 'Tournaments',
    path: '/admin/tournaments',
    icon: <FaTrophy />,
    roles: ['SuperAdmin', 'SchoolAdmin'],
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: <FaCog />,
    roles: ['SuperAdmin', 'SchoolAdmin'],
  },
];

export default function DashboardLayout({ children }) {
  const { user, clearUser } = useUserStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Logout handler
  const handleLogout = async () => {
    // Call logout endpoint if you have one, then clear local state
    await fetch('/api/auth/logout', { method: 'GET', credentials: 'include' });
    clearUser();
    navigate('/login');
  };

  // Language switcher
  const switchLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'np' : 'en');
  };

  return (
    <div className="min-h-screen bg-athletiq-bg flex text-athletiq-navy">
      {/* --- Sidebar --- */}
      <aside className={`fixed z-40 top-0 left-0 h-full bg-white dark:bg-athletiq-navy shadow-lg transition-all duration-200
        ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="flex items-center gap-3 h-20 px-4 border-b border-athletiq-bg">
          <img src={athletiqLogo} alt="ATHLETIQ" className="h-10" />
          <span className={`font-extrabold text-xl tracking-wide text-athletiq-green transition-all
            ${sidebarOpen ? 'opacity-100 ml-2' : 'opacity-0 ml-0'} duration-300`}>
            ATHLETIQ
          </span>
        </div>
        <nav className="flex-1 px-2 py-6 space-y-2">
          {navLinks.filter(link => !link.roles || link.roles.includes(user?.role)).map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition 
                 ${isActive ? 'bg-athletiq-green text-white' : 'hover:bg-athletiq-bg'}
                 ${sidebarOpen ? 'justify-start' : 'justify-center'}`
              }
              title={t(link.label)}
              end
            >
              <span className="text-xl">{link.icon}</span>
              <span className={`transition-all ${sidebarOpen ? 'opacity-100 ml-1' : 'opacity-0 ml-0'} duration-300`}>
                {t(link.label)}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="mb-6 px-4">
          <button
            className={`flex items-center w-full gap-3 px-4 py-2 rounded-xl bg-athletiq-navy text-white hover:bg-blue-900
              transition ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span className={`transition-all ${sidebarOpen ? 'opacity-100 ml-1' : 'opacity-0 ml-0'} duration-300`}>
              {t('Logout')}
            </span>
          </button>
        </div>
        {/* Sidebar toggler */}
        <button
          className="absolute top-4 right-[-20px] w-8 h-8 flex items-center justify-center bg-athletiq-green text-white rounded-full shadow-lg focus:outline-none"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </aside>

      {/* --- Main Content --- */}
      <div className={`flex-1 min-h-screen ml-20 md:ml-64 transition-all duration-300`}>
        {/* --- Top Bar --- */}
        <header className="flex items-center justify-between px-8 py-4 bg-white dark:bg-athletiq-navy border-b border-athletiq-bg shadow-sm sticky top-0 z-30">
          {/* School/Org Branding */}
          <div className="flex items-center gap-4">
            {/* Optional: School logo */}
            {/* <img src="/assets/logos/sample-school.png" alt="School Logo" className="h-8 rounded-full" /> */}
            <div className="font-bold text-athletiq-navy text-xl">
              {user?.role === 'SuperAdmin'
                ? t('ATHLETIQ Admin')
                : user?.school_name || ''}
            </div>
            <span className="ml-2 px-3 py-1 bg-athletiq-green/20 text-athletiq-green rounded-full text-xs font-bold">
              {user?.role}
            </span>
          </div>
          {/* Topbar actions */}
          <div className="flex items-center gap-6">
            {/* Language Switcher */}
            <button
              className="text-athletiq-green font-bold px-3 py-1 border rounded-xl hover:bg-athletiq-bg transition"
              onClick={switchLanguage}
            >
              {i18n.language === 'en' ? 'नेपाली' : 'EN'}
            </button>
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-bold">{user?.full_name}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-athletiq-green flex items-center justify-center text-white font-bold text-lg">
                {/* User Initials */}
                {user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
            </div>
          </div>
        </header>
        {/* --- Page Content --- */}
        <main className="p-6 md:p-10 bg-athletiq-bg min-h-[calc(100vh-70px)]">{children}</main>
        {/* --- Footer --- */}
        <footer className="text-center text-xs text-gray-400 py-6">
          ATHLETIQ &copy; {new Date().getFullYear()} — Track the Rise. Train the Future.
        </footer>
      </div>
    </div>
  );
}
