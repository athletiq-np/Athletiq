import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaExclamationTriangle, FaClock, FaCheckCircle, FaPlus, FaBell } from 'react-icons/fa';
import { useTranslation } from '../i18n/translations';
import StatusCard from './StatusCard';
import TimelineView from './TimelineView';
import LanguageToggle from '../i18n/LanguageToggle';
import apiClient from '@/api/apiClient';

const StatusDrivenDashboard = ({ guardian, onAddChild, onLogout }) => {
  const { t } = useTranslation();
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Load guardian's athletes and their statuses
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load athletes
      const athletesResponse = await apiClient.get('/guardian/athletes');
      const athletesList = athletesResponse.data?.data?.athletes || athletesResponse.data?.athletes || [];
      
      // Load notifications
      const notificationsResponse = await apiClient.get('/guardian/notifications');
      const notificationsList = notificationsResponse.data?.data?.notifications || [];
      
      setAthletes(athletesList);
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Get status summary
  const getStatusSummary = () => {
    const summary = {
      total: athletes.length,
      pending: 0,
      active: 0,
      actionRequired: 0,
      rejected: 0
    };
    
    athletes.forEach(athlete => {
      const status = athlete.profile_status || athlete.status;
      switch (status) {
        case 'PENDING_SCHOOL_APPROVAL':
        case 'pending':
          summary.pending++;
          break;
        case 'ACTIVE':
        case 'active':
          summary.active++;
          break;
        case 'ACTION_REQUIRED':
        case 'action_required':
          summary.actionRequired++;
          break;
        case 'REJECTED':
        case 'rejected':
          summary.rejected++;
          break;
        default:
          summary.pending++;
      }
    });
    
    return summary;
  };

  const statusSummary = getStatusSummary();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Guardian Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {guardian?.full_name || guardian?.fullName}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                  <FaBell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Language Toggle */}
              <LanguageToggle />
              
              {/* Logout */}
              <button 
                onClick={onLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaUser className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Athletes</p>
                <p className="text-2xl font-semibold text-gray-900">{statusSummary.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-semibold text-gray-900">{statusSummary.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaClock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{statusSummary.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Action Required</p>
                <p className="text-2xl font-semibold text-gray-900">{statusSummary.actionRequired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Athletes Status Cards */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Your Athletes</h2>
            <button
              onClick={onAddChild}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Child</span>
            </button>
          </div>
          
          {athletes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FaUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No athletes yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by adding your first child to the system
              </p>
              <button
                onClick={onAddChild}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Add Your First Child
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {athletes.map((athlete) => (
                <StatusCard
                  key={athlete.id}
                  athlete={athlete}
                  onViewTimeline={() => {
                    setSelectedAthlete(athlete);
                    setShowTimeline(true);
                  }}
                  onTakeAction={(action) => handleStatusAction(athlete, action)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Notifications Panel */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Notifications</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className={`w-2 h-2 rounded-full ${
                        notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' :
                        notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Modal */}
      <AnimatePresence>
        {showTimeline && selectedAthlete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowTimeline(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <TimelineView 
                athlete={selectedAthlete}
                onClose={() => setShowTimeline(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Handle status actions
const handleStatusAction = async (athlete, action) => {
  try {
    const response = await apiClient.post(`/guardian/athletes/${athlete.id}/action`, {
      action,
      timestamp: new Date().toISOString()
    });
    
    if (response.data.success) {
      // Refresh dashboard data
      window.location.reload(); // Simple approach for now
    }
  } catch (error) {
    console.error('Error handling status action:', error);
  }
};

export default StatusDrivenDashboard;
