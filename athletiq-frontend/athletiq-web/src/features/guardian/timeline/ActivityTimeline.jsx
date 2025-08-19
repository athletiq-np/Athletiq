import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaClock, 
  FaCheck, 
  FaUpload, 
  FaPhone, 
  FaExclamationTriangle,
  FaCalendarAlt,
  FaUser,
  FaSchool
} from 'react-icons/fa';
import { useTranslation } from '../i18n/translations';

const ActivityTimeline = ({ athleteId, onClose }) => {
  const { t } = useTranslation();
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, documents, approvals, notifications

  useEffect(() => {
    loadTimeline();
  }, [athleteId, filter]);

  const loadTimeline = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      
      const response = await fetch(`/api/guardian/athletes/${athleteId}/timeline?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline || []);
      }
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'registration':
        return FaUser;
      case 'document_upload':
        return FaUpload;
      case 'school_approval':
        return FaSchool;
      case 'approval':
        return FaCheck;
      case 'rejection':
        return FaExclamationTriangle;
      case 'notification':
        return FaPhone;
      default:
        return FaClock;
    }
  };

  const getEventColor = (type, status) => {
    switch (type) {
      case 'approval':
        return 'text-green-600 bg-green-100';
      case 'rejection':
        return 'text-red-600 bg-red-100';
      case 'document_upload':
        return 'text-blue-600 bg-blue-100';
      case 'school_approval':
        return 'text-purple-600 bg-purple-100';
      case 'notification':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const TimelineEvent = ({ event, isLast }) => {
    const Icon = getEventIcon(event.type);
    const colorClasses = getEventColor(event.type, event.status);

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative flex items-start space-x-4 pb-6"
      >
        {/* Timeline Line */}
        {!isLast && (
          <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200" />
        )}
        
        {/* Event Icon */}
        <div className={`relative z-10 w-12 h-12 rounded-full ${colorClasses} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        
        {/* Event Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">
                {event.title}
              </h4>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatDate(event.created_at)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {event.description}
            </p>
            
            {/* Event Details */}
            {event.details && (
              <div className="text-xs text-gray-500 space-y-1">
                {event.details.map((detail, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-gray-400 rounded-full" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Status Badge */}
            {event.status && (
              <div className="mt-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  event.status === 'completed' ? 'bg-green-100 text-green-800' :
                  event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  event.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
            )}
            
            {/* Action Button */}
            {event.action_url && (
              <div className="mt-3">
                <a
                  href={event.action_url}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {event.action_text || 'View Details'} →
                </a>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('timeline.activityTimeline')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Track all activities and status changes
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              ✕
            </button>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-4 mt-4">
            {[
              { key: 'all', label: 'All' },
              { key: 'documents', label: 'Documents' },
              { key: 'approvals', label: 'Approvals' },
              { key: 'notifications', label: 'Notifications' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  filter === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : timeline.length > 0 ? (
            <div className="space-y-0">
              {timeline.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  isLast={index === timeline.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaCalendarAlt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Activity Yet
              </h3>
              <p className="text-gray-600">
                Activity and status changes will appear here
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last updated: {new Date().toLocaleString()}</span>
            <button
              onClick={loadTimeline}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ActivityTimeline;
