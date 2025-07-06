// src/components/features/school/SchoolOverview.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  FaUserGraduate, FaBuilding, FaUsers, FaTrophy, FaExclamationCircle,
  FaCheckCircle, FaClipboardList, FaChartLine, FaCalendarAlt, FaBell,
  FaEye, FaEdit, FaPlus, FaDownload, FaSchool, FaNewspaper
} from 'react-icons/fa';
import { MdNotifications, MdTrendingUp, MdWarning } from 'react-icons/md';

/**
 * 🏫 School Overview Component
 * Main dashboard overview with key metrics, notifications, and quick actions
 */
export default function SchoolOverview({ school, summary, recentActivities, notifications }) {
  const quickActions = [
    {
      title: 'Add Student',
      description: 'Register new students to your school',
      icon: FaPlus,
      color: 'bg-blue-500',
      href: '#',
      onClick: () => console.log('Add Student')
    },
    {
      title: 'Create Tournament',
      description: 'Organize a new tournament',
      icon: FaTrophy,
      color: 'bg-green-500',
      href: '#',
      onClick: () => console.log('Create Tournament')
    },
    {
      title: 'Manage Houses',
      description: 'Organize students into houses',
      icon: FaBuilding,
      color: 'bg-purple-500',
      href: '#',
      onClick: () => console.log('Manage Houses')
    },
    {
      title: 'Export Data',
      description: 'Download school reports',
      icon: FaDownload,
      color: 'bg-orange-500',
      href: '#',
      onClick: () => console.log('Export Data')
    }
  ];

  const onboardingTasks = [
    {
      title: 'Complete School Profile',
      description: 'Add school details, logo, and contact information',
      completed: !!school?.name && !!school?.address,
      icon: FaSchool,
      link: '#profile'
    },
    {
      title: 'Add Students',
      description: 'Register students to your school roster',
      completed: (summary?.registeredStudents || 0) > 0,
      icon: FaUserGraduate,
      link: '#students'
    },
    {
      title: 'Create Houses',
      description: 'Organize students into houses for competitions',
      completed: (summary?.houses || 0) > 0,
      icon: FaBuilding,
      link: '#houses'
    },
    {
      title: 'Add Staff',
      description: 'Register teachers and coaches',
      completed: (summary?.staff || 0) > 0,
      icon: FaUsers,
      link: '#staff'
    },
    {
      title: 'Join Tournament',
      description: 'Participate in your first tournament',
      completed: (summary?.tournaments || 0) > 0,
      icon: FaTrophy,
      link: '#tournaments'
    }
  ];

  const completedTasks = onboardingTasks.filter(task => task.completed).length;
  const completionPercentage = Math.round((completedTasks / onboardingTasks.length) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-athletiq-blue to-athletiq-navy text-white rounded-lg p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome to {school?.name || 'Your School'} Dashboard
            </h2>
            <p className="text-blue-100 mb-4">
              Manage your school's sports activities, tournaments, and student records all in one place.
            </p>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-semibold">{summary?.registeredStudents || 0}</span> Students
              </div>
              <div className="text-sm">
                <span className="font-semibold">{summary?.houses || 0}</span> Houses
              </div>
              <div className="text-sm">
                <span className="font-semibold">{summary?.staff || 0}</span> Staff
              </div>
              <div className="text-sm">
                <span className="font-semibold">{summary?.tournaments || 0}</span> Tournaments
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{completionPercentage}%</div>
            <div className="text-sm text-blue-100">Setup Complete</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaPlus className="h-5 w-5 mr-2 text-athletiq-blue" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <button
                key={action.title}
                onClick={action.onClick}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className={`${action.color} p-2 rounded-lg`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{action.title}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Onboarding Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaCheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Setup Progress
          </h3>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-athletiq-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {onboardingTasks.map((task, index) => (
              <div
                key={task.title}
                className={`flex items-center space-x-3 p-2 rounded-lg ${
                  task.completed ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <div className={`p-1 rounded-full ${
                  task.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <task.icon className={`h-3 w-3 ${
                    task.completed ? 'text-white' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    task.completed ? 'text-green-800' : 'text-gray-700'
                  }`}>
                    {task.title}
                  </p>
                  <p className={`text-xs ${
                    task.completed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {task.description}
                  </p>
                </div>
                {task.completed && (
                  <FaCheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activities & Notifications */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaBell className="h-5 w-5 mr-2 text-yellow-500" />
            Recent Activity
          </h3>
          
          <div className="space-y-3">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-athletiq-blue rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <FaNewspaper className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activities</p>
                <p className="text-xs text-gray-400">Activities will appear here as you use the system</p>
              </div>
            )}
          </div>

          {/* Notifications */}
          {notifications && notifications.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Notifications</h4>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <MdNotifications className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-500">{notification.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Alerts and Warnings */}
      {(summary?.pendingDocuments > 0 || summary?.completionRate < 50) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <MdWarning className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Action Required</h4>
              <div className="text-sm text-yellow-700 mt-1">
                {summary?.pendingDocuments > 0 && (
                  <p>• {summary.pendingDocuments} documents pending verification</p>
                )}
                {summary?.completionRate < 50 && (
                  <p>• School setup is incomplete ({summary.completionRate}% complete)</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
