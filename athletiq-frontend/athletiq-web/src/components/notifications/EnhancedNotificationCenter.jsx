import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBell,
  FaTimes,
  FaCheck,
  FaTrash,
  FaFilter,
  FaCalendarAlt,
  FaTrophy,
  FaUsers,
  FaInfoCircle,
  FaExclamationTriangle,
  FaHeart,
  FaComment,
  FaStar,
  FaEllipsisV,
  FaShare,
  FaVolumeMute,
  FaVolumeUp,
  FaWifi
} from 'react-icons/fa';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { usePWA } from '../../hooks/usePWA';

/**
 * 🔔 Enhanced Notifications Center
 * Comprehensive notification management with real-time updates
 * 
 * Features:
 * - Real-time notification updates via WebSocket
 * - Push notification management
 * - Categorized notifications (matches, tournaments, social, system)
 * - Notification preferences and settings
 * - Batch operations (mark all read, delete multiple)
 * - Offline notification caching
 * - Rich notification content with images and actions
 * - Sound and vibration preferences
 * - Smart grouping and filtering
 */
export default function EnhancedNotificationCenter({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    push_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
    email_enabled: false,
    categories: {
      matches: true,
      tournaments: true,
      social: true,
      system: true
    }
  });
  const [ws, setWs] = useState(null);
  
  const { isOnline, cacheData, getCachedData } = usePWA();

  // Notification categories
  const categories = [
    { id: 'all', label: 'All', icon: FaBell },
    { id: 'matches', label: 'Matches', icon: FaTrophy },
    { id: 'tournaments', label: 'Tournaments', icon: FaCalendarAlt },
    { id: 'social', label: 'Social', icon: FaUsers },
    { id: 'system', label: 'System', icon: FaInfoCircle }
  ];

  useEffect(() => {
    loadNotifications();
    loadPreferences();
    setupWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const setupWebSocket = () => {
    if (!isOnline) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        logger.info('Notification WebSocket connected');
        setWs(websocket);
      };
      
      websocket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          handleNewNotification(notification);
        } catch (error) {
          logger.error('Failed to parse notification data', error);
        }
      };
      
      websocket.onerror = (error) => {
        logger.error('Notification WebSocket error', error);
      };
      
      websocket.onclose = () => {
        logger.info('Notification WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      };
      
    } catch (error) {
      logger.error('Failed to setup notification WebSocket', error);
    }
  };

  const loadNotifications = async () => {
    try {
      // Load cached notifications first
      const cached = await getCachedData('notifications');
      if (cached) {
        setNotifications(cached);
        setLoading(false);
      }

      if (isOnline) {
        const response = await apiClient.get('/notifications', {
          params: { limit: 50 }
        });
        
        const notificationData = response.data.notifications || [];
        setNotifications(notificationData);
        
        // Cache notifications
        await cacheData('notifications', notificationData);
      }
    } catch (error) {
      logger.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const cached = await getCachedData('notification_preferences');
      if (cached) {
        setPreferences(cached);
      }

      if (isOnline) {
        const response = await apiClient.get('/notifications/preferences');
        setPreferences(response.data.preferences || preferences);
        await cacheData('notification_preferences', response.data.preferences || preferences);
      }
    } catch (error) {
      logger.error('Failed to load notification preferences', error);
    }
  };

  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Show push notification if enabled
    if (preferences.push_enabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: notification.id,
        renotify: false
      });
    }
    
    // Play sound if enabled
    if (preferences.sound_enabled) {
      playNotificationSound();
    }
    
    // Vibrate if enabled and supported
    if (preferences.vibration_enabled && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Update cache
    cacheData('notifications', [notification, ...notifications]);
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    } catch (error) {
      // Ignore audio errors
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      if (isOnline) {
        await apiClient.patch(`/notifications/${notificationId}/read`);
      }
    } catch (error) {
      logger.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      if (isOnline) {
        await apiClient.patch('/notifications/mark-all-read');
      }
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      if (isOnline) {
        await apiClient.delete(`/notifications/${notificationId}`);
      }
    } catch (error) {
      logger.error('Failed to delete notification', error);
    }
  };

  const deleteSelected = async () => {
    try {
      const selectedIds = Array.from(selectedNotifications);
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
      setSelectedNotifications(new Set());

      if (isOnline) {
        await apiClient.post('/notifications/delete-batch', {
          notification_ids: selectedIds
        });
      }
    } catch (error) {
      logger.error('Failed to delete selected notifications', error);
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      setPreferences(newPreferences);
      await cacheData('notification_preferences', newPreferences);

      if (isOnline) {
        await apiClient.put('/notifications/preferences', newPreferences);
      }
    } catch (error) {
      logger.error('Failed to update preferences', error);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.category === filter);
  };

  const getNotificationIcon = (notification) => {
    const iconMap = {
      match: FaTrophy,
      tournament: FaCalendarAlt,
      social: FaUsers,
      like: FaHeart,
      comment: FaComment,
      follow: FaStar,
      system: FaInfoCircle,
      warning: FaExclamationTriangle
    };
    return iconMap[notification.type] || FaBell;
  };

  const getNotificationColor = (notification) => {
    const colorMap = {
      match: 'text-blue-500 bg-blue-50',
      tournament: 'text-green-500 bg-green-50',
      social: 'text-purple-500 bg-purple-50',
      like: 'text-red-500 bg-red-50',
      comment: 'text-indigo-500 bg-indigo-50',
      follow: 'text-yellow-500 bg-yellow-50',
      system: 'text-gray-500 bg-gray-50',
      warning: 'text-orange-500 bg-orange-50'
    };
    return colorMap[notification.type] || 'text-gray-500 bg-gray-50';
  };

  const getTimeLabel = (timestamp) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const renderNotification = (notification, index) => {
    const Icon = getNotificationIcon(notification);
    const colorClass = getNotificationColor(notification);
    const isSelected = selectedNotifications.has(notification.id);
    
    return (
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`p-4 border-b border-gray-100 ${
          !notification.read ? 'bg-blue-50/50' : 'bg-white'
        } ${isSelected ? 'bg-athletiq-blue/10' : ''} transition-colors`}
      >
        <div className="flex items-start space-x-3">
          {/* Selection Checkbox */}
          <button
            onClick={() => toggleNotificationSelection(notification.id)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected 
                ? 'bg-athletiq-blue border-athletiq-blue text-white' 
                : 'border-gray-300 hover:border-athletiq-blue'
            }`}
          >
            {isSelected && <FaCheck className="w-3 h-3" />}
          </button>
          
          {/* Notification Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          
          {/* Notification Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                
                {/* Notification Image */}
                {notification.image_url && (
                  <img 
                    src={notification.image_url} 
                    alt="Notification" 
                    className="mt-2 w-full max-w-xs rounded-lg"
                  />
                )}
                
                {/* Action Buttons */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex space-x-2 mt-3">
                    {notification.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => handleNotificationAction(notification.id, action)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          action.primary 
                            ? 'bg-athletiq-blue text-white hover:bg-athletiq-blue-dark'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{getTimeLabel(notification.created_at)}</span>
                  {notification.category && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full capitalize">
                      {notification.category}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Notification Actions */}
              <div className="flex items-center space-x-2 ml-2">
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Mark as read"
                  >
                    <FaCheck className="w-4 h-4 text-green-500" />
                  </button>
                )}
                
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Delete"
                >
                  <FaTrash className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const handleNotificationAction = async (notificationId, action) => {
    try {
      if (isOnline) {
        await apiClient.post(`/notifications/${notificationId}/action`, {
          action: action.id
        });
      }
      
      // Mark as read after action
      markAsRead(notificationId);
      
      // Handle specific actions
      if (action.url) {
        window.open(action.url, '_blank');
      }
    } catch (error) {
      logger.error('Failed to handle notification action', error);
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const selectedCount = selectedNotifications.size;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Preferences"
              >
                <FaFilter className="w-5 h-5 text-gray-600" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaTimes className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setFilter(category.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-full whitespace-nowrap transition-colors ${
                    filter === category.id
                      ? 'bg-athletiq-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span className="text-sm">{category.label}</span>
                </button>
              ))}
            </div>
            
            {selectedCount > 0 ? (
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-sm text-gray-600">{selectedCount} selected</span>
                <button
                  onClick={deleteSelected}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            ) : unreadCount > 0 ? (
              <button
                onClick={markAllAsRead}
                className="ml-4 px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors whitespace-nowrap"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {/* Offline Indicator */}
          {!isOnline && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-700">
                <FaWifi className="w-4 h-4" />
                <span className="text-sm">Showing cached notifications (offline)</span>
              </div>
            </div>
          )}
        </div>

        {/* Preferences Panel */}
        <AnimatePresence>
          {showPreferences && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Notification Preferences</h3>
                
                <div className="space-y-3">
                  {/* General Settings */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaBell className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Push Notifications</span>
                    </div>
                    <button
                      onClick={() => updatePreferences({
                        ...preferences,
                        push_enabled: !preferences.push_enabled
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        preferences.push_enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        preferences.push_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaVolumeUp className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Sound</span>
                    </div>
                    <button
                      onClick={() => updatePreferences({
                        ...preferences,
                        sound_enabled: !preferences.sound_enabled
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        preferences.sound_enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        preferences.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-athletiq-blue border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-600">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => 
                renderNotification(notification, index)
              )}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12">
              <FaBell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You're all caught up!" 
                  : `No ${filter} notifications found`}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
