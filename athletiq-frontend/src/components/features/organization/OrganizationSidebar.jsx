// src/components/features/organization/OrganizationSidebar.jsx

import React from 'react';
import { motion } from 'framer-motion';
import {
  FaHome, FaUsers, FaTrophy, FaSchool, FaFileAlt, FaUser, FaCertificate,
  FaChartLine, FaCogs, FaSignOutAlt, FaBuilding, FaHandshake
} from 'react-icons/fa';
import { MdDashboard, MdPending, MdVerified } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';
import { useAuth } from '@/hooks/useAuth';

/**
 * Organization Sidebar Component
 * Provides navigation for all organization dashboard sections
 */
export default function OrganizationSidebar({
  collapsed,
  onToggle,
  activeSection,
  onSectionChange,
  organizationData,
  notificationsCount = 0
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Navigation items for organization dashboard
  const navigationItems = [
    {
      id: 'overview',
      label: t('organization.sidebar.overview', 'Overview'),
      icon: FaHome,
      description: t('organization.sidebar.overviewDesc', 'Dashboard overview'),
      badge: null
    },
    {
      id: 'athletes',
      label: t('organization.sidebar.athletes', 'Athletes'),
      icon: FaUsers,
      description: t('organization.sidebar.athletesDesc', 'Manage registered athletes'),
      badge: organizationData?.overview?.totalAthletes || 0
    },
    {
      id: 'tournaments',
      label: t('organization.sidebar.tournaments', 'Tournaments'),
      icon: FaTrophy,
      description: t('organization.sidebar.tournamentsDesc', 'Create and manage tournaments'),
      badge: organizationData?.overview?.activeTournaments || 0
    },
    {
      id: 'schools',
      label: t('organization.sidebar.schools', 'School Partnerships'),
      icon: FaHandshake,
      description: t('organization.sidebar.schoolsDesc', 'Partner with schools'),
      badge: organizationData?.overview?.activeSchoolPartnerships || 0
    },
    {
      id: 'documents',
      label: t('organization.sidebar.documents', 'Documents'),
      icon: FaFileAlt,
      description: t('organization.sidebar.documentsDesc', 'Manage organization documents'),
      badge: organizationData?.overview?.documentsUploaded || 0
    },
    {
      id: 'verification',
      label: t('organization.sidebar.verification', 'Verification'),
      icon: FaCertificate,
      description: t('organization.sidebar.verificationDesc', 'Organization verification status'),
      badge: organizationData?.overview?.verificationStatus === 'pending' ? 'PENDING' : null,
      badgeColor: organizationData?.overview?.verificationStatus === 'verified' ? 'green' : 
                  organizationData?.overview?.verificationStatus === 'pending' ? 'yellow' : 'red'
    },
    {
      id: 'analytics',
      label: t('organization.sidebar.analytics', 'Analytics'),
      icon: FaChartLine,
      description: t('organization.sidebar.analyticsDesc', 'Performance analytics'),
      badge: null
    },
    {
      id: 'profile',
      label: t('organization.sidebar.profile', 'Organization Profile'),
      icon: FaBuilding,
      description: t('organization.sidebar.profileDesc', 'Organization information'),
      badge: null
    },
    {
      id: 'settings',
      label: t('organization.sidebar.settings', 'Settings'),
      icon: FaCogs,
      description: t('organization.sidebar.settingsDesc', 'System settings'),
      badge: null
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSectionClick = (sectionId) => {
    onSectionChange(sectionId);
  };

  const getBadgeColor = (color) => {
    switch (color) {
      case 'green':
        return 'bg-green-500 text-white';
      case 'yellow':
        return 'bg-yellow-500 text-white';
      case 'red':
        return 'bg-red-500 text-white';
      default:
        return 'bg-athletiq-orange text-white';
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-xl z-40 border-r border-gray-200 dark:border-gray-700"
    >
      <div className="flex flex-col h-full">
        {/* Header with Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <img
              src={athletiqLogo}
              alt="Athletiq"
              className="h-8 w-8 rounded"
            />
            {!collapsed && (
              <div>
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                  {t('organization.sidebar.title', 'Organization')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('organization.sidebar.subtitle', 'Management Portal')}
                </p>
              </div>
            )}
          </div>
          
          {!collapsed && (
            <button
              onClick={onToggle}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-athletiq-orange text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={collapsed ? item.label : ''}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`} />
                  
                  {!collapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.label}
                        </p>
                        <p className="text-xs opacity-75 truncate">
                          {item.description}
                        </p>
                      </div>
                      
                      {item.badge !== null && item.badge !== undefined && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.badgeColor ? getBadgeColor(item.badgeColor) : 'bg-athletiq-orange text-white'
                        }`}>
                          {typeof item.badge === 'string' ? item.badge : item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {collapsed && item.badge !== null && item.badge !== undefined && (
                    <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-xs font-medium ${
                      item.badgeColor ? getBadgeColor(item.badgeColor) : 'bg-athletiq-orange text-white'
                    }`}>
                      {typeof item.badge === 'number' && item.badge > 99 ? '99+' : 
                       typeof item.badge === 'string' ? '!' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Organization Info and Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {!collapsed && organizationData?.profile && (
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-8 w-8 bg-athletiq-orange rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {organizationData.profile.name?.charAt(0).toUpperCase() || 'O'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {organizationData.profile.name || t('organization.sidebar.unnamed', 'Unnamed Organization')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {organizationData.profile.type || t('organization.sidebar.unknownType', 'Unknown Type')}
                  </p>
                </div>
              </div>
              
              {/* Verification Status Indicator */}
              <div className={`flex items-center space-x-2 px-2 py-1 rounded text-xs ${
                organizationData.overview?.verificationStatus === 'verified'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : organizationData.overview?.verificationStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {organizationData.overview?.verificationStatus === 'verified' ? (
                  <MdVerified className="h-3 w-3" />
                ) : (
                  <MdPending className="h-3 w-3" />
                )}
                <span className="capitalize">
                  {t(`organization.verification.status.${organizationData.overview?.verificationStatus}`, 
                     organizationData.overview?.verificationStatus || 'unknown')}
                </span>
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="flex items-center space-x-3 mb-4">
            {!collapsed && (
              <>
                <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <FaUser className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.full_name || user?.username || t('organization.sidebar.admin', 'Admin')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || t('organization.sidebar.organizationAdmin', 'Organization Admin')}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? t('common.logout', 'Logout') : ''}
          >
            <FaSignOutAlt className="h-4 w-4" />
            {!collapsed && (
              <span className="text-sm font-medium">
                {t('common.logout', 'Logout')}
              </span>
            )}
          </button>
        </div>

        {/* Collapse/Expand Button (when collapsed) */}
        {collapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onToggle}
              className="w-full p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              title={t('organization.sidebar.expand', 'Expand Sidebar')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}