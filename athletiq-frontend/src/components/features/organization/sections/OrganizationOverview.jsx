// src/components/features/organization/sections/OrganizationOverview.jsx

import React from 'react';
import { motion } from 'framer-motion';
import {
  FaUsers, FaTrophy, FaSchool, FaFileAlt, FaCertificate, FaChartLine,
  FaCheckCircle, FaExclamationTriangle, FaClock, FaPlus, FaEye, FaHandshake
} from 'react-icons/fa';
import { MdVerified, MdPending } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

/**
 * Organization Overview Section
 * Main dashboard overview showing key metrics and statistics
 */
export default function OrganizationOverview({ data, loading, error, onRefresh, onDataUpdate }) {
  const { t } = useTranslation();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  // Stats cards configuration
  const statsCards = [
    {
      title: t('organization.overview.totalAthletes', 'Total Athletes'),
      value: data?.overview?.totalAthletes || 0,
      icon: FaUsers,
      color: 'bg-blue-500',
      description: t('organization.overview.athletesDesc', 'Registered athletes'),
      trend: '+12% from last month'
    },
    {
      title: t('organization.overview.activeTournaments', 'Active Tournaments'),
      value: data?.overview?.activeTournaments || 0,
      icon: FaTrophy,
      color: 'bg-yellow-500',
      description: t('organization.overview.tournamentsDesc', 'Currently running'),
      trend: '+5% from last month'
    },
    {
      title: t('organization.overview.schoolPartnerships', 'School Partnerships'),
      value: data?.overview?.activeSchoolPartnerships || 0,
      icon: FaHandshake,
      color: 'bg-green-500',
      description: t('organization.overview.partnershipsDesc', 'Active partnerships'),
      trend: '+8% from last month'
    },
    {
      title: t('organization.overview.documents', 'Documents'),
      value: data?.overview?.documentsUploaded || 0,
      icon: FaFileAlt,
      color: 'bg-purple-500',
      description: t('organization.overview.documentsDesc', 'Uploaded documents'),
      trend: '+3% from last month'
    }
  ];

  // Quick actions
  const quickActions = [
    {
      title: t('organization.overview.registerAthlete', 'Register New Athlete'),
      description: t('organization.overview.registerAthleteDesc', 'Add a new athlete to your organization'),
      icon: FaUsers,
      color: 'bg-blue-500',
      action: () => console.log('Navigate to athlete registration')
    },
    {
      title: t('organization.overview.createTournament', 'Create Tournament'),
      description: t('organization.overview.createTournamentDesc', 'Organize a new tournament'),
      icon: FaTrophy,
      color: 'bg-yellow-500',
      action: () => console.log('Navigate to tournament creation')
    },
    {
      title: t('organization.overview.addPartnership', 'Add School Partnership'),
      description: t('organization.overview.addPartnershipDesc', 'Partner with a new school'),
      icon: FaSchool,
      color: 'bg-green-500',
      action: () => console.log('Navigate to partnership creation')
    },
    {
      title: t('organization.overview.uploadDocument', 'Upload Documents'),
      description: t('organization.overview.uploadDocumentDesc', 'Add organization documents'),
      icon: FaFileAlt,
      color: 'bg-purple-500',
      action: () => console.log('Navigate to document upload')
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('organization.overview.title', 'Organization Overview')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('organization.overview.subtitle', 'Monitor your organization\'s performance and activities')}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-2 bg-athletiq-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{t('common.refresh', 'Refresh')}</span>
        </button>
      </div>

      {/* Verification Status Alert */}
      {data?.overview?.verificationStatus !== 'verified' && (
        <motion.div
          variants={itemVariants}
          className={`p-4 rounded-lg border-l-4 ${
            data?.overview?.verificationStatus === 'pending'
              ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-500'
              : 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-500'
          }`}
        >
          <div className="flex items-start space-x-3">
            {data?.overview?.verificationStatus === 'pending' ? (
              <MdPending className="h-5 w-5 text-yellow-500 mt-0.5" />
            ) : (
              <FaExclamationTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            )}
            <div>
              <h3 className={`font-medium ${
                data?.overview?.verificationStatus === 'pending'
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {data?.overview?.verificationStatus === 'pending'
                  ? t('organization.overview.verificationPending', 'Verification Pending')
                  : t('organization.overview.verificationRejected', 'Verification Required')
                }
              </h3>
              <p className={`text-sm mt-1 ${
                data?.overview?.verificationStatus === 'pending'
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {data?.overview?.verificationStatus === 'pending'
                  ? t('organization.overview.verificationPendingDesc', 'Your organization verification is being reviewed. You can continue using basic features.')
                  : t('organization.overview.verificationRejectedDesc', 'Your organization needs to be verified to access all features. Please check the verification section.')
                }
              </p>
              <button className={`mt-2 text-sm font-medium underline ${
                data?.overview?.verificationStatus === 'pending'
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {t('organization.overview.viewVerification', 'View Verification Status')}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <FaEye className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {card.description}
                </p>
                {card.trend && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {card.trend}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('organization.overview.quickActions', 'Quick Actions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-athletiq-orange dark:hover:border-athletiq-orange transition-all text-left group"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-athletiq-orange">
                      {action.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                  <FaPlus className="h-3 w-3 text-gray-400 group-hover:text-athletiq-orange transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activities */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Athletes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('organization.overview.recentAthletes', 'Recent Athletes')}
            </h3>
            <button className="text-athletiq-orange hover:text-orange-600 text-sm font-medium">
              {t('common.viewAll', 'View All')}
            </button>
          </div>
          
          <div className="space-y-3">
            {data?.athletes?.slice(0, 5).map((athlete, index) => (
              <div key={athlete.id || index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {athlete.full_name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {athlete.full_name || athlete.name || 'Unknown Athlete'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {athlete.school_name || athlete.sport || 'No school assigned'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  athlete.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {athlete.status || 'Active'}
                </span>
              </div>
            )) || (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <FaUsers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('organization.overview.noAthletes', 'No athletes registered yet')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Tournaments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('organization.overview.recentTournaments', 'Recent Tournaments')}
            </h3>
            <button className="text-athletiq-orange hover:text-orange-600 text-sm font-medium">
              {t('common.viewAll', 'View All')}
            </button>
          </div>
          
          <div className="space-y-3">
            {data?.tournaments?.slice(0, 5).map((tournament, index) => (
              <div key={tournament.id || index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center text-white">
                  <FaTrophy className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {tournament.name || tournament.title || 'Unknown Tournament'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tournament.sport || tournament.type || 'Multiple Sports'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tournament.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : tournament.status === 'upcoming'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {tournament.status || 'Upcoming'}
                </span>
              </div>
            )) || (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <FaTrophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('organization.overview.noTournaments', 'No tournaments created yet')}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Organization Profile Summary */}
      {data?.profile && (
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('organization.overview.profileSummary', 'Organization Profile')}
            </h3>
            <button className="text-athletiq-orange hover:text-orange-600 text-sm font-medium">
              {t('common.edit', 'Edit')}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('organization.overview.organizationName', 'Organization Name')}
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {data.profile.name || 'Not specified'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('organization.overview.organizationType', 'Type')}
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {data.profile.type || 'Not specified'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('organization.overview.location', 'Location')}
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {data.profile.city && data.profile.province 
                  ? `${data.profile.city}, ${data.profile.province}`
                  : 'Not specified'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}