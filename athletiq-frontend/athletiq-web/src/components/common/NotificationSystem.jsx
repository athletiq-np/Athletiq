import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, 
  FaTimes, 
  FaCheck, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaEye,
  FaFilter,
  FaRefresh
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { useNotificationStore } from '../../store/notificationStore';

/**
 * 🔔 Real-time Notifications System
 * Comprehensive notification management with WebSocket integration
 * 
 * Features:
 * - Real-time notifications via WebSocket
 * - Multiple notification types (success, error, warning, info)
 * - Mark as read/unread functionality
 * - Bulk actions (mark all as read, delete all)
 * - Advanced filtering
 * - Sound notifications
 * - Desktop notifications
 * - Notification history
 * - Auto-cleanup of old notifications
 */
export default function NotificationSystem({ isOpen, onClose, position = 'top-right' }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef(null);
  const audioRef = useRef(null);

  // Zustand store integration
  const {
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getUnreadCount
  } = useNotificationStore();

  // Notification types configuration
  const notificationTypes = {
    success: {
      icon: FaCheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
      borderColor: 'border-green-200'
    },
    error: {
      icon: FaTimesCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
      borderColor: 'border-red-200'
    },
    warning: {
      icon: FaExclamationTriangle,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-200'
    },
    info: {
      icon: FaInfoCircle,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-200'
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    loadNotifications();
    requestNotificationPermission();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Update unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const connectWebSocket = () => {
    try {
      const token = localStorage.getItem('athletiq_token');
      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000'}/notifications?token=${token}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        logger.info('Notification WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          handleNewNotification(notification);
        } catch (error) {
          logger.error('Failed to parse WebSocket notification', error);
        }
      };

      wsRef.current.onclose = () => {
        logger.info('Notification WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        logger.error('WebSocket error', error);
      };

    } catch (error) {
      logger.error('Failed to connect WebSocket', error);
    }
  };

  const handleNewNotification = (notification) => {
    // Add to state
    setNotifications(prev => [notification, ...prev]);
    
    // Add to store
    addNotification(notification);

    // Play sound if enabled
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Sound play failed, ignore
      });
    }

    // Show desktop notification if enabled
    if (desktopEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data.notifications || []);
      
      logger.info('Notifications loaded', { count: response.data.notifications?.length || 0 });

    } catch (error) {
      logger.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setDesktopEnabled(permission === 'granted');
    } else if (Notification.permission === 'granted') {
      setDesktopEnabled(true);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      markAsRead(notificationId);
      
      logger.info('Notification marked as read', { notificationId });

    } catch (error) {
      logger.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/mark-all-read');
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      markAllAsRead();
      
      logger.info('All notifications marked as read');

    } catch (error) {
      logger.error('Failed to mark all notifications as read', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      deleteNotification(notificationId);
      
      logger.info('Notification deleted', { notificationId });

    } catch (error) {
      logger.error('Failed to delete notification', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await apiClient.delete('/notifications/clear-all');
      
      setNotifications([]);
      clearAllNotifications();
      
      logger.info('All notifications cleared');

    } catch (error) {
      logger.error('Failed to clear all notifications', error);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'read') return notifications.filter(n => n.read);
    return notifications.filter(n => n.type === filter);
  };

  const renderNotification = (notification) => {
    const typeConfig = notificationTypes[notification.type] || notificationTypes.info;
    const Icon = typeConfig.icon;

    return (
      <motion.div
        key={notification.id}
        layout
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`p-4 rounded-lg border ${typeConfig.bgColor} ${typeConfig.borderColor} ${
          !notification.read ? 'shadow-md' : 'opacity-75'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeConfig.bgColor}`}>
            <Icon className={`w-4 h-4 ${typeConfig.iconColor}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`font-medium ${typeConfig.textColor} ${!notification.read ? 'font-bold' : ''}`}>
                  {notification.title}
                </h4>
                <p className={`text-sm mt-1 ${typeConfig.textColor}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
              
              <div className="flex items-center space-x-1">
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title="Mark as read"
                  >
                    <FaCheck className="w-3 h-3 text-gray-600" />
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteNotification(notification.id)}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Delete notification"
                >
                  <FaTimes className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 flex items-start justify-end pt-16 pr-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                  <FaBell className="w-5 h-5 text-athletiq-blue" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadNotifications}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Refresh notifications"
                  >
                    <FaRefresh className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaTimes className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex items-center space-x-2 mt-3">
                <FaFilter className="w-4 h-4 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
              
              {/* Bulk Actions */}
              {notifications.length > 0 && (
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-athletiq-blue hover:text-athletiq-blue/80 transition-colors"
                  >
                    Mark all as read
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-athletiq-blue border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map(renderNotification)}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaBell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500 text-sm">
                    {filter === 'all' 
                      ? "You're all caught up!" 
                      : `No ${filter} notifications found`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <span>Sound alerts</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={desktopEnabled}
                    onChange={(e) => setDesktopEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <span>Desktop notifications</span>
                </label>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Sound Effect */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.wav" type="audio/wav" />
      </audio>
    </AnimatePresence>
  );
}
