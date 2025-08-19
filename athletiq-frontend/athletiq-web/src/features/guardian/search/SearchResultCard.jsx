import React from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaSchool, FaCalendarAlt, FaMapMarkerAlt, FaEye } from 'react-icons/fa';
import { useTranslation } from '../i18n/translations';

const SearchResultCard = ({ match, onSelect, searchQuery }) => {
  const { t } = useTranslation();
  
  // Calculate confidence score based on various factors
  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Highlight matching parts in text
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Profile Photo */}
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {match.profilePhotoUrl ? (
              <img
                src={match.profilePhotoUrl}
                alt={match.fullName}
                className="w-full h-full object-cover filter blur-sm"
                title="Photo will be unblurred after verification"
              />
            ) : (
              <FaUser className="w-6 h-6 text-gray-400" />
            )}
          </div>
          
          {/* Basic Info */}
          <div>
            <h3 
              className="text-lg font-semibold text-gray-900"
              dangerouslySetInnerHTML={{
                __html: highlightMatch(match.fullName, searchQuery.childName)
              }}
            />
            <p className="text-sm text-gray-600">
              Nepal Athlete ID: {match.athleteId || 'Pending'}
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(match.confidence)}`}>
          {match.confidence}% match
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FaCalendarAlt className="w-4 h-4" />
          <span>DOB: {formatDate(match.dateOfBirth)}</span>
          {match.dateOfBirth === searchQuery.dateOfBirth && (
            <span className="text-green-600 font-medium">✓ Exact match</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FaSchool className="w-4 h-4" />
          <span 
            dangerouslySetInnerHTML={{
              __html: highlightMatch(match.schoolName, searchQuery.schoolHint)
            }}
          />
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FaUser className="w-4 h-4" />
          <span>Grade {match.grade}{match.section ? ` - ${match.section}` : ''}</span>
        </div>
        
        {match.address && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FaMapMarkerAlt className="w-4 h-4" />
            <span>{match.address}</span>
          </div>
        )}
      </div>

      {/* Match Reasons */}
      {match.matchReasons && match.matchReasons.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Why this might be your child:</p>
          <div className="flex flex-wrap gap-2">
            {match.matchReasons.map((reason, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${
            match.status === 'active' ? 'bg-green-500' :
            match.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
          }`} />
          <span className="text-sm text-gray-600 capitalize">
            {match.status} {match.status === 'pending' && '(Awaiting school approval)'}
          </span>
        </div>
        
        <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
          <FaEye className="w-4 h-4" />
          <span>{t('claim.isThisYourChild')}</span>
        </button>
      </div>

      {/* Registration Date */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Registered on {formatDate(match.createdAt)}
          {match.registeredBy && ` by ${match.registeredBy}`}
        </p>
      </div>
    </motion.div>
  );
};

export default SearchResultCard;
