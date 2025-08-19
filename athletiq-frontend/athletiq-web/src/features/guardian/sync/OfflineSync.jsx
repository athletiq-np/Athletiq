import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaWifi, 
  FaWifiSlash, 
  FaSync, 
  FaCloudUpload,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock
} from 'react-icons/fa';
import { useTranslation } from '../i18n/translations';

const OfflineSync = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      if (pendingSyncs.length > 0) {
        setTimeout(() => syncPendingData(), 2000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending syncs from localStorage
    loadPendingSyncs();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingSyncs = () => {
    const stored = localStorage.getItem('athletiq_pending_syncs');
    if (stored) {
      try {
        const syncs = JSON.parse(stored);
        setPendingSyncs(syncs);
      } catch (error) {
        console.error('Failed to load pending syncs:', error);
      }
    }

    const lastSync = localStorage.getItem('athletiq_last_sync');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }
  };

  const addPendingSync = (data) => {
    const syncItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: data.type, // 'search', 'form_data', 'document_upload', 'registration'
      data: data,
      retryCount: 0,
      status: 'pending'
    };

    const updatedSyncs = [...pendingSyncs, syncItem];
    setPendingSyncs(updatedSyncs);
    localStorage.setItem('athletiq_pending_syncs', JSON.stringify(updatedSyncs));

    // If online, try to sync immediately
    if (isOnline) {
      setTimeout(() => syncSpecificItem(syncItem), 1000);
    }
  };

  const syncPendingData = async () => {
    if (!isOnline || pendingSyncs.length === 0) return;

    setSyncStatus('syncing');

    try {
      const successfulSyncs = [];
      const failedSyncs = [];

      for (const syncItem of pendingSyncs.filter(s => s.status === 'pending')) {
        try {
          await syncSpecificItem(syncItem);
          successfulSyncs.push(syncItem.id);
        } catch (error) {
          console.error('Sync failed for item:', syncItem.id, error);
          failedSyncs.push({
            ...syncItem,
            retryCount: syncItem.retryCount + 1,
            lastError: error.message
          });
        }
      }

      // Update pending syncs
      const updatedSyncs = pendingSyncs
        .filter(sync => !successfulSyncs.includes(sync.id))
        .map(sync => {
          const failed = failedSyncs.find(f => f.id === sync.id);
          return failed || sync;
        });

      setPendingSyncs(updatedSyncs);
      localStorage.setItem('athletiq_pending_syncs', JSON.stringify(updatedSyncs));

      if (successfulSyncs.length > 0) {
        setLastSyncTime(new Date());
        localStorage.setItem('athletiq_last_sync', new Date().toISOString());
      }

      setSyncStatus(failedSyncs.length > 0 ? 'error' : 'success');
      
      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);

    } catch (error) {
      console.error('Sync process failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const syncSpecificItem = async (syncItem) => {
    const { type, data } = syncItem;

    switch (type) {
      case 'search':
        // Sync search analytics
        await fetch('/api/analytics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        break;

      case 'form_data':
        // Sync form progress
        await fetch('/api/guardian/forms/save-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        break;

      case 'document_upload':
        // Retry document upload
        const formData = new FormData();
        formData.append('document', data.file);
        formData.append('athlete_id', data.athlete_id);
        formData.append('document_type', data.document_type);

        await fetch('/api/guardian/documents/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        break;

      case 'registration':
        // Complete athlete registration
        await fetch('/api/guardian/athletes/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        break;

      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  };

  const clearPendingSyncs = () => {
    setPendingSyncs([]);
    localStorage.removeItem('athletiq_pending_syncs');
  };

  const retrySyncItem = async (syncItem) => {
    try {
      await syncSpecificItem(syncItem);
      
      // Remove from pending syncs
      const updatedSyncs = pendingSyncs.filter(s => s.id !== syncItem.id);
      setPendingSyncs(updatedSyncs);
      localStorage.setItem('athletiq_pending_syncs', JSON.stringify(updatedSyncs));
      
      setLastSyncTime(new Date());
      localStorage.setItem('athletiq_last_sync', new Date().toISOString());
      
    } catch (error) {
      console.error('Retry sync failed:', error);
      // Update retry count
      const updatedSyncs = pendingSyncs.map(s => 
        s.id === syncItem.id 
          ? { ...s, retryCount: s.retryCount + 1, lastError: error.message }
          : s
      );
      setPendingSyncs(updatedSyncs);
      localStorage.setItem('athletiq_pending_syncs', JSON.stringify(updatedSyncs));
    }
  };

  const formatSyncItemTitle = (syncItem) => {
    switch (syncItem.type) {
      case 'search':
        return 'Search Query';
      case 'form_data':
        return 'Form Progress';
      case 'document_upload':
        return 'Document Upload';
      case 'registration':
        return 'Athlete Registration';
      default:
        return 'Data Sync';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <FaSync className="w-4 h-4 animate-spin" />;
      case 'success':
        return <FaCheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <FaExclamationTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <FaCloudUpload className="w-4 h-4" />;
    }
  };

  // Don't show if online and no pending syncs
  if (isOnline && pendingSyncs.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 z-40"
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center space-x-3 ${
        isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isOnline ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isOnline ? (
            <FaWifi className="w-4 h-4 text-green-600" />
          ) : (
            <FaWifiSlash className="w-4 h-4 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${
            isOnline ? 'text-green-800' : 'text-red-800'
          }`}>
            {isOnline ? 'Online' : 'Offline Mode'}
          </h3>
          <p className={`text-xs ${
            isOnline ? 'text-green-600' : 'text-red-600'
          }`}>
            {isOnline 
              ? `${pendingSyncs.length} items to sync`
              : 'Changes saved locally'
            }
          </p>
        </div>
        {isOnline && pendingSyncs.length > 0 && (
          <button
            onClick={syncPendingData}
            disabled={syncStatus === 'syncing'}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            {getSyncStatusIcon()}
          </button>
        )}
      </div>

      {/* Pending Items */}
      {pendingSyncs.length > 0 && (
        <div className="p-4">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {pendingSyncs.slice(0, 5).map(syncItem => (
              <div
                key={syncItem.id}
                className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {formatSyncItemTitle(syncItem)}
                  </p>
                  <p className="text-gray-500">
                    {new Date(syncItem.timestamp).toLocaleTimeString()}
                  </p>
                  {syncItem.lastError && (
                    <p className="text-red-500 text-xs mt-1">
                      {syncItem.lastError}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {syncItem.retryCount > 0 && (
                    <span className="text-yellow-600 text-xs">
                      Retry {syncItem.retryCount}
                    </span>
                  )}
                  {isOnline && syncItem.lastError && (
                    <button
                      onClick={() => retrySyncItem(syncItem)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <FaSync className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pendingSyncs.length > 5 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              +{pendingSyncs.length - 5} more items
            </p>
          )}

          {/* Actions */}
          <div className="flex space-x-2 mt-3 pt-3 border-t">
            {isOnline && (
              <button
                onClick={syncPendingData}
                disabled={syncStatus === 'syncing'}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {getSyncStatusIcon()}
                <span>Sync All</span>
              </button>
            )}
            <button
              onClick={clearPendingSyncs}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 text-xs border border-gray-300 rounded"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Last Sync Time */}
      {lastSyncTime && (
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
          Last sync: {lastSyncTime.toLocaleString()}
        </div>
      )}
    </motion.div>
  );
};

// Hook for components to add offline data
export const useOfflineSync = () => {
  const [offlineSyncRef, setOfflineSyncRef] = useState(null);

  const addToOfflineQueue = (data) => {
    if (offlineSyncRef) {
      offlineSyncRef.addPendingSync(data);
    } else {
      // Fallback: save directly to localStorage
      const stored = localStorage.getItem('athletiq_pending_syncs');
      const existing = stored ? JSON.parse(stored) : [];
      const syncItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...data,
        retryCount: 0,
        status: 'pending'
      };
      existing.push(syncItem);
      localStorage.setItem('athletiq_pending_syncs', JSON.stringify(existing));
    }
  };

  return { addToOfflineQueue, setOfflineSyncRef };
};

export default OfflineSync;
