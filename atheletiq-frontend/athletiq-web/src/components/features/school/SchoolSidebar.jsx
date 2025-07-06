// src/components/features/school/SchoolSidebar.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserGraduate, FaSchool, FaTrophy, FaChartLine, FaCogs, FaSignOutAlt,
  FaUserCircle, FaChevronDown, FaChevronRight, FaMoon, FaSun, FaLanguage,
  FaBell, FaQuestionCircle, FaLifeRing, FaBook, FaVideo, FaNewspaper,
  FaUsers, FaBuilding, FaClipboardList, FaCalendarAlt, FaPlus, FaUser,
  FaShieldAlt, FaHandsHelping, FaHome
} from 'react-icons/fa';
import { MdDashboard, MdAnalytics, MdSettings, MdNotifications, MdHelp, MdSports, MdGroup } from 'react-icons/md';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useUserStore from '@/store/userStore';
import apiClient from '@/api/apiClient';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

/**
 * Tooltip component for collapsed sidebar items
 */
const Tooltip = ({ children, content, show, position = 'right' }) => {
  if (!show) return children;
  
  return (
    <div className="relative group">
      {children}
      <div className={`absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${position === 'right' ? 'left-full ml-2' : 'right-full mr-2'}`}>
        {content}
        <div className={`absolute top-1/2 transform -translate-y-1/2 w-0 h-0 ${position === 'right' ? '-left-1 border-r-4 border-r-gray-900' : '-right-1 border-l-4 border-l-gray-900'} border-t-2 border-b-2 border-t-transparent border-b-transparent`}></div>
      </div>
    </div>
  );
};

/**
 * 🏫 School Sidebar Component
 * - Collapsible sidebar with school-specific navigation
 * - Multi-level navigation for comprehensive school management
 * - User profile section with school context
 * - Quick actions for common tasks
 * - Help and support section
 */
export default function SchoolSidebar({
  collapsed,
  setCollapsed,
  activeTab,
  setActiveTab,
  user,
  school,
  darkMode,
  setDarkMode
}) {
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await apiClient.get('/auth/logout');
      clearUser();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 280 }}
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-900 shadow-lg z-50
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-70'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="logo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-3"
              >
                <img src={athletiqLogo} alt="Athletiq" className="h-8 w-8" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Athletiq
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {collapsed ? <HiMenuAlt3 size={20} /> : <HiX size={20} />}
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.firstName?.[0] || 'S'}
              </span>
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  key="user-info"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {school?.name || 'School Administrator'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <MdDashboard size={20} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  key="dashboard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-sm font-medium"
                >
                  Dashboard
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Student Management */}
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'students'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FaUserGraduate size={20} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  key="students"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-sm font-medium"
                >
                  Student Management
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Houses */}
          <button
            onClick={() => setActiveTab('houses')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'houses'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FaBuilding size={20} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  key="houses"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-sm font-medium"
                >
                  House Management
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Staff */}
          <button
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'staff'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FaUsers size={20} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  key="staff"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-sm font-medium"
                >
                  Staff Management
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Tournaments */}
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'tournaments'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FaTrophy size={20} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  key="tournaments"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-sm font-medium"
                >
                  Tournaments
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* School Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FaSchool size={20} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  key="profile"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-sm font-medium"
                >
                  School Profile
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <MdSettings size={20} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  key="settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-sm font-medium"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {collapsed ? (
            <div className="space-y-2">
              <Tooltip content="Toggle Dark Mode" show={collapsed}>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-full p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  {darkMode ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
                </button>
              </Tooltip>
              <Tooltip content="Logout" show={collapsed}>
                <button
                  onClick={handleLogout}
                  className="w-full p-2 rounded-lg hover:bg-gray-100 text-red-600 transition-colors"
                >
                  <FaSignOutAlt className="h-5 w-5" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
                <span className="text-sm font-medium">
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
              >
                <FaSignOutAlt size={18} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
