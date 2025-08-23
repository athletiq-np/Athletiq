import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle, 
  FaTimes, 
  FaEye, 
  FaUpload,
  FaPhone,
  FaSchool
} from 'react-icons/fa';
import { useTranslation } from '../i18n/translations';

const StatusCard = ({ athlete, onViewTimeline, onTakeAction }) => {
  const { t } = useTranslation();
  
  // Determine status configuration
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending_school_approval':
      case 'pending':
        return {
          icon: FaClock,
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          title: t('status.pending'),
          description: t('status.approvalTime'),
          actions: ['contact_school', 'view_timeline']
        };
      case 'active':
        return {
          icon: FaCheckCircle,
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          title: t('status.active'),
          description: 'All set! Athlete ID active and ready for tournaments',
          actions: ['view_timeline', 'manage_profile']
        };
      case 'action_required':
        return {
          icon: FaExclamationTriangle,
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          title: t('status.actionRequired'),
          description: 'Document verification needed',
          actions: ['reupload_document', 'view_details']
        };
      case 'rejected':
        return {
          icon: FaTimes,
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          title: t('status.rejected'),
          description: 'Application rejected - contact school for details',
          actions: ['contact_school', 'view_reason']
        };
      default:
        return {
          icon: FaClock,
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          title: 'Processing',
          description: 'Application being processed',
          actions: ['view_timeline']
        };
    }
  };

  const statusConfig = getStatusConfig(athlete.profile_status || athlete.status);
  const StatusIcon = statusConfig.icon;

  // Get next steps based on status
  const getNextSteps = () => {
    const status = athlete.profile_status || athlete.status;
    switch (status?.toLowerCase()) {
      case 'pending_school_approval':
      case 'pending':
        return [
          'School admin will review your application',
          'You\'ll receive SMS/email notification when approved',
          'Usually takes 1-3 school days'
        ];
      case 'active':
        return [
          'Participate in school sports events',
          'Receive tournament notifications',
          'Update profile as needed'
        ];
      case 'action_required':
        return [
          'Upload clearer documents',
          'Ensure all information is accurate',
          'Contact support if you need help'
        ];
      case 'rejected':
        return [
          'Review rejection reason',
          'Contact school administration',
          'Resubmit with corrections if applicable'
        ];
      default:
        return ['Application is being processed'];
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {athlete.profile_photo_url ? (
              <img
                src={athlete.profile_photo_url}
                alt={athlete.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {athlete.full_name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {athlete.full_name}
            </h3>
            <p className="text-sm text-gray-600">
              {athlete.athlete_id ? `ID: ${athlete.athlete_id}` : 'ID: Pending'}
            </p>
          </div>
        </div>
        
        <div className={`${statusConfig.iconColor} bg-white rounded-full p-2`}>
          <StatusIcon className="w-5 h-5" />
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <h4 className="font-semibold text-gray-900">{statusConfig.title}</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white ${statusConfig.iconColor}`}>
            {athlete.profile_status || athlete.status || 'pending'}
          </span>
        </div>
        <p className="text-sm text-gray-600">{statusConfig.description}</p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">School:</span>
          <p className="font-medium">{athlete.school_name || 'Not set'}</p>
        </div>
        <div>
          <span className="text-gray-500">Grade:</span>
          <p className="font-medium">
            {athlete.grade}{athlete.section ? ` - ${athlete.section}` : ''}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Registered:</span>
          <p className="font-medium">{formatDate(athlete.created_at)}</p>
        </div>
        <div>
          <span className="text-gray-500">Progress:</span>
          <p className="font-medium">{athlete.profile_completion || 0}% complete</p>
        </div>
      </div>

      {/* What's Next */}
      <div className="mb-6">
        <h5 className="font-medium text-gray-900 mb-2">{t('status.whatNext')}</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          {getNextSteps().map((step, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {statusConfig.actions.includes('contact_school') && (
          <button
            onClick={() => onTakeAction('contact_school')}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <FaPhone className="w-3 h-3" />
            <span>Contact School</span>
          </button>
        )}
        
        {statusConfig.actions.includes('reupload_document') && (
          <button
            onClick={() => onTakeAction('reupload_document')}
            className="flex items-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
          >
            <FaUpload className="w-3 h-3" />
            <span>Re-upload Document</span>
          </button>
        )}
        
        {statusConfig.actions.includes('view_timeline') && (
          <button
            onClick={onViewTimeline}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            <FaEye className="w-3 h-3" />
            <span>View Timeline</span>
          </button>
        )}
        
        {statusConfig.actions.includes('manage_profile') && (
          <button
            onClick={() => onTakeAction('manage_profile')}
            className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <FaSchool className="w-3 h-3" />
            <span>Manage Profile</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {athlete.profile_completion !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Profile Completion</span>
            <span>{athlete.profile_completion}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                athlete.profile_completion >= 80 ? 'bg-green-500' :
                athlete.profile_completion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${athlete.profile_completion}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StatusCard;
