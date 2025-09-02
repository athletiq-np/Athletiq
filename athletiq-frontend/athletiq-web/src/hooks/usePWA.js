import { useEffect, useState } from 'react';
import { logger } from '../../utils/logger';

/**
 * 📱 PWA Manager Hook
 * Manages Progressive Web App features including service worker registration,
 * offline detection, push notifications, and app installation
 */
export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistration, setSwRegistration] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    setupNetworkListeners();
    setupInstallPrompt();
    checkIfInstalled();
    checkPushNotificationStatus();
  }, []);

  // Register service worker
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        setSwRegistration(registration);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                showUpdateAvailableNotification();
              }
            });
          }
        });

        logger.info('Service Worker registered successfully', { scope: registration.scope });
      } catch (error) {
        logger.error('Service Worker registration failed', error);
      }
    }
  };

  // Setup network status listeners
  const setupNetworkListeners = () => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Network connection restored');
      
      // Notify service worker about network availability
      if (swRegistration?.active) {
        swRegistration.active.postMessage({ type: 'NETWORK_AVAILABLE' });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  // Setup app installation prompt
  const setupInstallPrompt = () => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
      logger.info('PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  };

  // Check if app is already installed
  const checkIfInstalled = () => {
    // Check if running in standalone mode (installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    
    setIsInstalled(isStandalone || isIOSStandalone);

    if (isStandalone || isIOSStandalone) {
      logger.info('PWA is running in installed mode');
    }
  };

  // Check push notification permission status
  const checkPushNotificationStatus = () => {
    if ('Notification' in window) {
      setPushNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  // Install PWA
  const installPWA = async () => {
    if (installPrompt) {
      try {
        const result = await installPrompt.prompt();
        logger.info('PWA installation prompt result', { outcome: result.outcome });
        
        if (result.outcome === 'accepted') {
          setCanInstall(false);
          setInstallPrompt(null);
          setIsInstalled(true);
        }
      } catch (error) {
        logger.error('PWA installation failed', error);
      }
    }
  };

  // Enable push notifications
  const enablePushNotifications = async () => {
    if (!('Notification' in window)) {
      throw new Error('Push notifications are not supported');
    }

    if (!swRegistration) {
      throw new Error('Service Worker not registered');
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        const subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
        });

        // Send subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('athletiq_token')}`
          },
          body: JSON.stringify(subscription)
        });

        setPushNotificationsEnabled(true);
        logger.info('Push notifications enabled successfully');
        
        return true;
      } else {
        logger.warn('Push notification permission denied');
        return false;
      }
    } catch (error) {
      logger.error('Failed to enable push notifications', error);
      throw error;
    }
  };

  // Disable push notifications
  const disablePushNotifications = async () => {
    if (swRegistration) {
      try {
        const subscription = await swRegistration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          
          // Remove subscription from server
          await fetch('/api/notifications/unsubscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('athletiq_token')}`
            },
            body: JSON.stringify(subscription)
          });
        }
        
        setPushNotificationsEnabled(false);
        logger.info('Push notifications disabled');
      } catch (error) {
        logger.error('Failed to disable push notifications', error);
        throw error;
      }
    }
  };

  // Update service worker
  const updateServiceWorker = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Cache specific URLs for offline access
  const cacheUrls = (urls) => {
    if (swRegistration?.active) {
      swRegistration.active.postMessage({
        type: 'CACHE_URLS',
        urls
      });
    }
  };

  // Show update available notification
  const showUpdateAvailableNotification = () => {
    // This would integrate with your notification system
    const event = new CustomEvent('pwa-update-available', {
      detail: { updateServiceWorker }
    });
    window.dispatchEvent(event);
  };

  // Get cached data when offline
  const getCachedData = async (cacheKey) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('athletiq-v1.0.0');
        const response = await cache.match(cacheKey);
        if (response) {
          return await response.json();
        }
      } catch (error) {
        logger.error('Failed to get cached data', error);
      }
    }
    return null;
  };

  // Store data for offline access
  const cacheData = async (cacheKey, data) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('athletiq-v1.0.0');
        const response = new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });
        await cache.put(cacheKey, response);
        logger.info('Data cached successfully', { cacheKey });
      } catch (error) {
        logger.error('Failed to cache data', error);
      }
    }
  };

  return {
    // State
    isOnline,
    canInstall,
    isInstalled,
    pushNotificationsEnabled,
    swRegistration,
    
    // Actions
    installPWA,
    enablePushNotifications,
    disablePushNotifications,
    updateServiceWorker,
    cacheUrls,
    getCachedData,
    cacheData
  };
}

/**
 * 📱 PWA Installation Banner Component
 */
export function PWAInstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-athletiq-blue text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          📱
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">Install Athletiq</h4>
          <p className="text-sm opacity-90">Get the full app experience</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onDismiss}
            className="text-white/70 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="mt-3 flex space-x-2">
        <button
          onClick={onInstall}
          className="flex-1 bg-white text-athletiq-blue py-2 px-4 rounded font-medium hover:bg-gray-100 transition-colors"
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 text-white/90 hover:text-white transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

/**
 * 🔄 PWA Update Banner Component
 */
export function PWAUpdateBanner({ onUpdate, onDismiss }) {
  return (
    <div className="fixed top-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          🔄
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">Update Available</h4>
          <p className="text-sm opacity-90">A new version is ready</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/70 hover:text-white p-1"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 flex space-x-2">
        <button
          onClick={onUpdate}
          className="flex-1 bg-white text-green-600 py-2 px-4 rounded font-medium hover:bg-gray-100 transition-colors"
        >
          Update Now
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 text-white/90 hover:text-white transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}
