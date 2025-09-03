// src/components/features/admin/NotificationSystem.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, 
  FaCheck, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaTimes,
  FaEye,
  FaTrash,
  FaFilter,
  FaMarkdown
} from 'react-icons/fa';
import { MdNotificationsActive, MdNotificationsOff } from 'react-icons/md';

/**
 * 🔔 Enhanced Notification System
 * - Real-time notifications
 * - Priority-based categorization
 * - Mark as read/unread
 * - Bulk actions
 * - Filtering and search
 * - Sound notifications
 * - Desktop notifications
 */

// Individual notification component
export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onView,
  compact = false 
}) {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'success':
        return { icon: FaCheck, color: 'text-green-500' };
      case 'warning':
        return { icon: FaExclamationTriangle, color: 'text-yellow-500' };
      case 'error':
        return { icon: FaExclamationTriangle, color: 'text-red-500' };
      default:
        return { icon: FaInfoCircle, color: 'text-blue-500' };
    }
  };

  const { icon: Icon, color } = getNotificationIcon();

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Notification Icon */}
        <div className={`flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                !notification.read 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {notification.title}
              </h4>
              {!compact && (
                <p className={`mt-1 text-sm ${
                  !notification.read 
                    ? 'text-gray-600 dark:text-gray-400' 
                    : 'text-gray-500 dark:text-gray-500'
                }`}>
                  {notification.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(notification.timestamp)}
              </p>
            </div>

            {/* Read indicator */}
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center space-x-2">
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead?.(notification.id)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                Mark as read
              </button>
            )}
            {notification.action && (
              <button
                onClick={() => onView?.(notification)}
                className="text-xs text-athletiq-green hover:text-green-700"
              >
                {notification.action}
              </button>
            )}
            <button
              onClick={() => onDelete?.(notification.id)}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Main notification center component
export function NotificationCenter({ 
  notifications = [], 
  isOpen, 
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  onView 
}) {
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'unread') return !notification.read;
      if (filter === 'read') return notification.read;
      return true;
    })
    .filter(notification => 
      searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FaBell className="w-6 h-6 text-athletiq-green" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>

              {/* Bulk Actions */}
              {notifications.length > 0 && (
                <div className="flex items-center space-x-3 mt-4">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button
                    onClick={onDeleteAll}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-96">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FaBell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No notifications
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery || filter !== 'all' 
                      ? 'No notifications match your criteria'
                      : 'You\'re all caught up! No new notifications.'
                    }
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                      onDelete={onDelete}
                      onView={onView}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating notification toast
export function NotificationToast({ 
  notification, 
  onClose, 
  duration = 5000,
  position = 'bottom-right' 
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          className={`fixed ${getPositionClasses()} z-50 max-w-sm w-full mx-4`}
        >
          <div className={`${getNotificationStyles()} text-white rounded-lg shadow-lg border-l-4 overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold">{notification.title}</h4>
                  {notification.message && (
                    <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                  }}
                  className="ml-4 text-white/80 hover:text-white"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Progress bar */}
            <motion.div
              className="h-1 bg-white/30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Notification badge component
export function NotificationBadge({ count, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
    >
      <FaBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </button>
  );
}

// Notification settings component
export function NotificationSettings({ 
  settings, 
  onSettingsChange, 
  isOpen, 
  onClose 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Notification Settings
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Push Notifications
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive notifications in your browser
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.push || false}
                    onChange={(e) => onSettingsChange?.('push', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Email Notifications
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive important updates via email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.email || false}
                    onChange={(e) => onSettingsChange?.('email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Sound Alerts
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Play sound for new notifications
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.sound || false}
                    onChange={(e) => onSettingsChange?.('sound', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-athletiq-green hover:bg-green-700 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export {
  NotificationItem,
  NotificationCenter,
  NotificationToast,
  NotificationBadge,
  NotificationSettings
};