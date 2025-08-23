// src/components/features/school/SchoolStatsCards.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  FaUserGraduate, FaBuilding, FaUsers, FaTrophy, FaExclamationCircle,
  FaCheckCircle, FaClipboardList, FaChartLine
} from 'react-icons/fa';
import { MdGroup, MdTrendingUp, MdWarning } from 'react-icons/md';

/**
 * 📊 School Stats Cards Component
 * Displays key school metrics in a visually appealing card layout
 */
export default function SchoolStatsCards({ summary }) {
  const stats = [
    {
      title: 'Registered Students',
      value: summary?.registeredStudents || 0,
      icon: FaUserGraduate,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Houses & Teams',
      value: summary?.houses || 0,
      icon: FaBuilding,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'Staff & Coaches',
      value: summary?.staff || 0,
      icon: FaUsers,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      change: '+3',
      changeType: 'positive'
    },
    {
      title: 'Active Tournaments',
      value: `${summary?.activeTournaments || 0}/${summary?.tournaments || 0}`,
      icon: FaTrophy,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      change: '+1',
      changeType: 'positive'
    },
    {
      title: 'Pending Documents',
      value: summary?.pendingDocuments || 0,
      icon: FaExclamationCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      change: '-5',
      changeType: 'negative'
    },
    {
      title: 'Completion Rate',
      value: `${summary?.completionRate || 0}%`,
      icon: FaCheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Active Teams',
      value: summary?.activeTeams || 0,
      icon: MdGroup,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'Monthly Growth',
      value: `${summary?.monthlyGrowth || 0}%`,
      icon: MdTrendingUp,
      color: 'bg-cyan-500',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    })
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className={`${stat.bgColor} rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
              </div>
              
              {/* Change indicator */}
              <div className="mt-3 flex items-center space-x-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    stat.changeType === 'positive'
                      ? 'bg-green-100 text-green-800'
                      : stat.changeType === 'negative'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {stat.changeType === 'positive' ? '↗' : stat.changeType === 'negative' ? '↘' : '→'} {stat.change}
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
