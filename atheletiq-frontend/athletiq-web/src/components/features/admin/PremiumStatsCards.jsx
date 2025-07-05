// src/components/features/admin/PremiumStatsCards.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaUserGraduate, FaSchool, FaTrophy, FaCheckCircle, FaExclamationCircle,
  FaArrowUp, FaArrowDown, FaDollarSign, FaChartLine, FaUsers, FaCalendarAlt
} from 'react-icons/fa';
import { MdPending, MdTrending } from 'react-icons/md';

/**
 * 📊 Premium Stats Cards Component
 * - Animated and responsive stat cards
 * - Trend indicators
 * - Gradient backgrounds
 * - Internationalization support
 * - Dark mode support
 */
export default function PremiumStatsCards({ summary, loading, formatDate }) {
  const { t } = useTranslation();

  const statsCards = [
    {
      key: 'players',
      title: t('dashboard.stats.registeredPlayers'),
      value: summary.registeredPlayers,
      icon: FaUserGraduate,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/20',
      change: '+12%',
      changeType: 'positive',
      subtitle: t('dashboard.stats.thisMonth')
    },
    {
      key: 'schools',
      title: t('dashboard.stats.schools'),
      value: summary.schools,
      icon: FaSchool,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/20',
      change: '+8%',
      changeType: 'positive',
      subtitle: t('dashboard.stats.activeSchools')
    },
    {
      key: 'tournaments',
      title: t('dashboard.stats.tournaments'),
      value: summary.tournaments,
      icon: FaTrophy,
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-500/20',
      change: '+15%',
      changeType: 'positive',
      subtitle: t('dashboard.stats.totalTournaments')
    },
    {
      key: 'activeTournaments',
      title: t('dashboard.stats.activeTournaments'),
      value: summary.activeTournaments,
      icon: FaCheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-500/20',
      change: '+3%',
      changeType: 'positive',
      subtitle: t('dashboard.stats.currentlyActive')
    },
    {
      key: 'pendingVerifications',
      title: t('dashboard.stats.pendingVerifications'),
      value: summary.pendingVerifications,
      icon: MdPending,
      gradient: 'from-amber-500 to-yellow-500',
      iconBg: 'bg-amber-500/20',
      change: '-5%',
      changeType: 'negative',
      subtitle: t('dashboard.stats.needsReview')
    },
    {
      key: 'missingDocs',
      title: t('dashboard.stats.missingDocs'),
      value: summary.missingDocs,
      icon: FaExclamationCircle,
      gradient: 'from-red-500 to-pink-500',
      iconBg: 'bg-red-500/20',
      change: '-2%',
      changeType: 'negative',
      subtitle: t('dashboard.stats.requiresAttention')
    },
    {
      key: 'revenue',
      title: t('dashboard.stats.totalRevenue'),
      value: summary.totalRevenue,
      icon: FaDollarSign,
      gradient: 'from-indigo-500 to-blue-500',
      iconBg: 'bg-indigo-500/20',
      change: '+18%',
      changeType: 'positive',
      subtitle: t('dashboard.stats.thisQuarter'),
      isPrice: true
    },
    {
      key: 'growth',
      title: t('dashboard.stats.monthlyGrowth'),
      value: summary.monthlyGrowth,
      icon: FaChartLine,
      gradient: 'from-teal-500 to-cyan-500',
      iconBg: 'bg-teal-500/20',
      change: '+7%',
      changeType: 'positive',
      subtitle: t('dashboard.stats.comparedToLastMonth'),
      isPercentage: true
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {statsCards.map((card) => (
        <motion.div
          key={card.key}
          variants={item}
          whileHover={{ scale: 1.02 }}
          className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
        >
          {/* Gradient overlay on hover */}
          <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
          
          {/* Card content */}
          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.iconBg} dark:bg-gray-700/50 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300`}>
                <card.icon
                  className={`w-6 h-6 bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}
                />
              </div>
              
              {/* Trend indicator */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
                card.changeType === 'positive' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {card.changeType === 'positive' ? (
                  <FaArrowUp className="w-3 h-3" />
                ) : (
                  <FaArrowDown className="w-3 h-3" />
                )}
                <span>{card.change}</span>
              </div>
            </div>

            {/* Value */}
            <div className="mb-2">
              <div className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
                ) : (
                  <>
                    {card.isPrice && '$'}
                    {card.value?.toLocaleString() || '0'}
                    {card.isPercentage && '%'}
                  </>
                )}
              </div>
            </div>

            {/* Title and subtitle */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {card.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {card.subtitle}
              </p>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Bottom accent line */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Alternative compact stats card for mobile
export function CompactStatsCard({ icon: Icon, title, value, change, changeType, gradient }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} text-white`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
        
        <div className={`text-sm font-semibold ${
          changeType === 'positive' 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {change}
        </div>
      </div>
    </motion.div>
  );
}

// Stats card with chart preview
export function ChartStatsCard({ title, value, change, changeType, chartData, gradient }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className={`text-sm font-semibold ${
          changeType === 'positive' 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {change}
        </div>
      </div>
      
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {value}
      </div>
      
      {/* Mini chart placeholder */}
      <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-end justify-center space-x-1 p-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className={`w-2 rounded-sm bg-gradient-to-t ${gradient}`}
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
