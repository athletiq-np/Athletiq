// src/components/features/admin/GlobalSidebar.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaUserGraduate, FaSchool, FaTrophy, FaChartLine, FaCogs, FaSignOutAlt,
  FaUserCircle, FaChevronDown, FaChevronRight, FaMoon, FaSun, FaLanguage,
  FaBell, FaQuestionCircle, FaLifeRing, FaBook, FaVideo, FaNewspaper
} from 'react-icons/fa';
import { MdDashboard, MdAnalytics, MdSettings, MdNotifications, MdHelp } from 'react-icons/md';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useUserStore from '@/store/userStore';
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
 * 🚀 Global Sidebar Component
 * - Responsive collapsible sidebar
 * - Multi-level navigation
 * - User profile section
 * - Theme toggle
 * - Language switcher
 * - Quick actions
 * - Help and support section
 * - Tooltip support for collapsed state
 */
export default function GlobalSidebar({
  collapsed,
  setCollapsed,
  activeTab,
  setActiveTab,
  tabs,
  user,
  darkMode,
  setDarkMode,
  onLanguageChange,
  currentLanguage
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useUserStore();
  
  const [expandedSections, setExpandedSections] = useState({
    management: true,
    analytics: false,
    settings: false,
    help: false
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('auth.logout.success'));
      navigate('/login');
    } catch (error) {
      toast.error(t('auth.logout.error'));
    }
  };

  // Navigation sections
  const navigationSections = [
    {
      id: 'management',
      title: t('sidebar.sections.management'),
      icon: MdDashboard,
      items: [
        { id: 'overview', label: t('sidebar.items.overview'), icon: MdDashboard },
        { id: 'players', label: t('sidebar.items.players'), icon: FaUserGraduate, badge: '120' },
        { id: 'schools', label: t('sidebar.items.schools'), icon: FaSchool, badge: '45' },
        { id: 'tournaments', label: t('sidebar.items.tournaments'), icon: FaTrophy, badge: '8' },
      ]
    },
    {
      id: 'analytics',
      title: t('sidebar.sections.analytics'),
      icon: MdAnalytics,
      items: [
        { id: 'analytics', label: t('sidebar.items.analytics'), icon: FaChartLine },
        { id: 'reports', label: t('sidebar.items.reports'), icon: FaNewspaper },
        { id: 'insights', label: t('sidebar.items.insights'), icon: MdAnalytics },
      ]
    },
    {
      id: 'settings',
      title: t('sidebar.sections.settings'),
      icon: MdSettings,
      items: [
        { id: 'settings', label: t('sidebar.items.settings'), icon: FaCogs },
        { id: 'notifications', label: t('sidebar.items.notifications'), icon: MdNotifications },
        { id: 'preferences', label: t('sidebar.items.preferences'), icon: FaCogs },
      ]
    },
    {
      id: 'help',
      title: t('sidebar.sections.help'),
      icon: MdHelp,
      items: [
        { id: 'documentation', label: t('sidebar.items.documentation'), icon: FaBook },
        { id: 'tutorials', label: t('sidebar.items.tutorials'), icon: FaVideo },
        { id: 'support', label: t('sidebar.items.support'), icon: FaLifeRing },
      ]
    }
  ];

  // Languages
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 shadow-xl"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    key="logo-full"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center space-x-3"
                  >
                    <img src={athletiqLogo} alt="ATHLETIQ" className="w-8 h-8" />
                    <div>
                      <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                        ATHLETIQ
                      </h1>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Admin Panel
                      </p>
                    </div>
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
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-athletiq-green to-green-500 flex items-center justify-center">
                <FaUserCircle className="text-white text-xl" />
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
                      {user?.name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.role?.toUpperCase() || 'ADMIN'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigationSections.map((section) => (
              <div key={section.id}>
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <section.icon className="text-gray-500 dark:text-gray-400 group-hover:text-athletiq-green transition-colors" size={20} />
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          key={`section-${section.id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          {section.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.div
                        key={`chevron-${section.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {expandedSections[section.id] ? (
                          <FaChevronDown size={12} className="text-gray-400" />
                        ) : (
                          <FaChevronRight size={12} className="text-gray-400" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                {/* Section Items */}
                <AnimatePresence>
                  {(expandedSections[section.id] || collapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`space-y-1 ${collapsed ? '' : 'ml-4 mt-2'}`}>
                        {section.items.map((item) => (
                          <Tooltip
                            key={item.id}
                            content={item.label}
                            show={collapsed}
                            position="right"
                          >
                            <button
                              onClick={() => setActiveTab(item.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group ${
                                activeTab === item.id
                                  ? 'bg-gradient-to-r from-athletiq-green to-green-500 text-white shadow-lg'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <item.icon
                                  className={`transition-colors ${
                                    activeTab === item.id
                                      ? 'text-white'
                                      : 'text-gray-500 dark:text-gray-400 group-hover:text-athletiq-green'
                                  }`}
                                  size={18}
                                />
                                <AnimatePresence mode="wait">
                                  {!collapsed && (
                                    <motion.span
                                      key={`item-${item.id}`}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -20 }}
                                      className="text-sm font-medium"
                                    >
                                      {item.label}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>
                              
                              {/* Badge */}
                              <AnimatePresence mode="wait">
                                {!collapsed && item.badge && (
                                  <motion.span
                                    key={`badge-${item.id}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      activeTab === item.id
                                        ? 'bg-white/20 text-white'
                                        : 'bg-athletiq-green/20 text-athletiq-green'
                                    }`}
                                  >
                                    {item.badge}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </button>
                          </Tooltip>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            >
              {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    key="theme-toggle"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-sm font-medium"
                  >
                    {darkMode ? t('sidebar.lightMode') : t('sidebar.darkMode')}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Language Switcher */}
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  key="language-switcher"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative"
                >
                  <select
                    value={currentLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-athletiq-green focus:border-transparent appearance-none"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  <FaLanguage className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
            >
              <FaSignOutAlt size={18} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    key="logout"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-sm font-medium"
                  >
                    {t('sidebar.logout')}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 lg:hidden z-30"
            onClick={() => setCollapsed(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
