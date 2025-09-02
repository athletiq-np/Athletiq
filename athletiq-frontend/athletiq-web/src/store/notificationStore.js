import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 🔔 Notification Store
 * Zustand store for managing notification state
 */
export const useNotificationStore = create(
  persist(
    (set, get) => ({
      // State
      notifications: [],
      unreadCount: 0,
      soundEnabled: true,
      desktopEnabled: false,
      
      // Actions
      addNotification: (notification) => set((state) => {
        const newNotification = {
          id: notification.id || Date.now().toString(),
          type: notification.type || 'info',
          title: notification.title,
          message: notification.message,
          read: false,
          created_at: notification.created_at || new Date().toISOString(),
          data: notification.data || {}
        };
        
        const updatedNotifications = [newNotification, ...state.notifications];
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return {
          notifications: updatedNotifications,
          unreadCount
        };
      }),
      
      markAsRead: (notificationId) => set((state) => {
        const updatedNotifications = state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return {
          notifications: updatedNotifications,
          unreadCount
        };
      }),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      })),
      
      deleteNotification: (notificationId) => set((state) => {
        const updatedNotifications = state.notifications.filter(n => n.id !== notificationId);
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return {
          notifications: updatedNotifications,
          unreadCount
        };
      }),
      
      clearAllNotifications: () => set(() => ({
        notifications: [],
        unreadCount: 0
      })),
      
      getUnreadCount: () => get().unreadCount,
      
      setSoundEnabled: (enabled) => set(() => ({ soundEnabled: enabled })),
      
      setDesktopEnabled: (enabled) => set(() => ({ desktopEnabled: enabled })),
      
      // Load notifications from server
      setNotifications: (notifications) => set(() => {
        const unreadCount = notifications.filter(n => !n.read).length;
        return {
          notifications,
          unreadCount
        };
      })
    }),
    {
      name: 'athletiq-notifications',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        desktopEnabled: state.desktopEnabled
      })
    }
  )
);
