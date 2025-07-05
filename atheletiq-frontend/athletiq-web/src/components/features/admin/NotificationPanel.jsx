// src/components/features/admin/NotificationPanel.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaBell, FaTimes, FaCheck, FaExclamationTriangle, FaInfo, FaUserGraduate,
  FaSchool, FaTrophy, FaCheckCircle, FaTimesCircle, FaTrash, FaMarkdown
} from 'react-icons/fa';
import { HiOutlineX } from 'react-icons/hi';

/**
 * 🔔 Notification Panel Component
 * - Real-time notifications
 * - Multiple notification types
 * - Mark as read functionality
 * - Notification categories
 * - Slide-out panel design
 */
export default function NotificationPanel({ 
  isOpen, 
  onClose, 
  notifications, 
  formatDate 
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [readNotifications, setReadNotifications] = useState(new Set());

  // Mock notifications if none provided
  const mockNotifications = notifications.length === 0 ? [
    {
      id: 1,
      type: 'info',
      title: 'New Player Registration',
      message: 'John Doe has registered for football tournament',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      category: 'players',
      read: false
    },
    {
      id: 2,
      type: 'warning',
      title: 'Document Verification Required',
      message: '3 players need document verification',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      category: 'verification',
      read: false
    },
    {
      id: 3,
      type: 'success',
      title: 'Tournament Updated',
      message: 'Football Championship schedule has been updated',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      category: 'tournaments',
      read: true
    },
    {
      id: 4,
      type: 'error',
      title: 'School Registration Failed',
      message: 'Error processing ABC School registration',
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      category: 'schools',
      read: false
    }
  ] : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return FaCheckCircle;
      case 'warning': return FaExclamationTriangle;
      case 'error': return FaTimesCircle;
      default: return FaInfo;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'players': return FaUserGraduate;
      case 'schools': return FaSchool;
      case 'tournaments': return FaTrophy;
      case 'verification': return FaCheckCircle;
      default: return FaBell;
    }
  };

  const markAsRead = (notificationId) => {
    setReadNotifications(prev => new Set([...prev, notificationId]));
  };

  const markAllAsRead = () => {
    const unreadIds = mockNotifications.filter(n => !n.read).map(n => n.id);
    setReadNotifications(prev => new Set([...prev, ...unreadIds]));
  };

  const deleteNotification = (notificationId) => {
    // In a real app, this would make an API call
    console.log('Delete notification:', notificationId);
  };

  const filteredNotifications = mockNotifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read && !readNotifications.has(notification.id);
    return notification.category === filter;
  });

  const unreadCount = mockNotifications.filter(n => !n.read && !readNotifications.has(n.id)).length;

  const filterOptions = [
    { value: 'all', label: t('notifications.filters.all') },
    { value: 'unread', label: t('notifications.filters.unread') },
    { value: 'players', label: t('notifications.filters.players') },
    { value: 'schools', label: t('notifications.filters.schools') },
    { value: 'tournaments', label: t('notifications.filters.tournaments') },
    { value: 'verification', label: t('notifications.filters.verification') }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-athletiq-navy to-athletiq-blue text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FaBell className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">
                        {t('notifications.title')}
                      </h2>
                      <p className="text-sm text-white/80">
                        {unreadCount > 0 
                          ? t('notifications.unreadCount', { count: unreadCount })
                          : t('notifications.allRead')
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <HiOutlineX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFilter(option.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filter === option.value
                            ? 'bg-athletiq-green text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-athletiq-green hover:text-athletiq-navy transition-colors font-medium"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence>
                  {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <FaBell className="w-12 h-12 mb-4 opacity-30" />
                      <p className="text-lg font-medium mb-2">
                        {t('notifications.empty.title')}
                      </p>
                      <p className="text-sm text-center">
                        {t('notifications.empty.message')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {filteredNotifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        const CategoryIcon = getCategoryIcon(notification.category);
                        const isRead = notification.read || readNotifications.has(notification.id);

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                              isRead 
                                ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75' 
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              {/* Icon */}
                              <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                                <Icon className="w-4 h-4" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className={`text-sm font-semibold ${
                                    isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {notification.title}
                                  </h3>
                                  <div className="flex items-center space-x-1">
                                    <CategoryIcon className="w-3 h-3 text-gray-400" />
                                    {!isRead && (
                                      <div className="w-2 h-2 bg-athletiq-green rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                                
                                <p className={`text-sm mb-2 ${
                                  isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(notification.timestamp)}
                                  </span>
                                  
                                  <div className="flex items-center space-x-2">
                                    {!isRead && (
                                      <button
                                        onClick={() => markAsRead(notification.id)}
                                        className="text-xs text-athletiq-green hover:text-athletiq-navy transition-colors"
                                      >
                                        {t('notifications.markRead')}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => deleteNotification(notification.id)}
                                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                    >
                                      <FaTrash className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button
                  onClick={onClose}
                  className="w-full py-2 px-4 bg-athletiq-green text-white rounded-lg hover:bg-athletiq-green/90 transition-colors font-medium"
                >
                  {t('notifications.close')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Notification toast component for inline notifications
export function NotificationToast({ notification, onClose }) {
  const { t } = useTranslation();
  const Icon = getNotificationIcon(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`fixed top-4 right-4 max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 ${
        notification.type === 'success' ? 'border-green-500' :
        notification.type === 'warning' ? 'border-yellow-500' :
        notification.type === 'error' ? 'border-red-500' : 'border-blue-500'
      } z-50`}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`p-1 rounded-full ${getNotificationColor(notification.type)}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {notification.message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Helper function (moved outside component to avoid redefinition)
function getNotificationIcon(type) {
  switch (type) {
    case 'success': return FaCheckCircle;
    case 'warning': return FaExclamationTriangle;
    case 'error': return FaTimesCircle;
    default: return FaInfo;
  }
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
  }
}
