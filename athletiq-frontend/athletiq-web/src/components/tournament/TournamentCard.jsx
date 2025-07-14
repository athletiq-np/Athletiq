// src/components/tournament/TournamentCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaTrophy, FaCalendarAlt, FaUsers, FaMapMarkerAlt, 
  FaFlag, FaEye, FaEdit, FaChartLine, FaRegClock,
  FaCrown, FaMedal, FaGamepad, FaFire
} from 'react-icons/fa';
import { MdSports } from 'react-icons/md';

const TournamentCard = ({ 
  tournament, 
  onView = () => {}, 
  onEdit = () => {}, 
  viewType = 'grid',
  isManaged = false 
}) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'ongoing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
      case 'finished':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'ongoing':
        return <FaFire className="w-3 h-3" />;
      case 'upcoming':
      case 'scheduled':
        return <FaRegClock className="w-3 h-3" />;
      case 'completed':
      case 'finished':
        return <FaCrown className="w-3 h-3" />;
      case 'cancelled':
        return <FaFlag className="w-3 h-3" />;
      case 'draft':
        return <FaEdit className="w-3 h-3" />;
      default:
        return <FaGamepad className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatParticipants = (participants) => {
    if (!participants || participants === 0) return 'No participants';
    return `${participants} participant${participants !== 1 ? 's' : ''}`;
  };

  if (viewType === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaTrophy className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {tournament.name || 'Unnamed Tournament'}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                  {getStatusIcon(tournament.status)}
                  <span className="ml-1">{tournament.status || 'Draft'}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <FaCalendarAlt className="w-3 h-3" />
                  <span>{formatDate(tournament.start_date)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaUsers className="w-3 h-3" />
                  <span>{formatParticipants(tournament.participants_count)}</span>
                </div>
                {tournament.location && (
                  <div className="flex items-center space-x-1">
                    <FaMapMarkerAlt className="w-3 h-3" />
                    <span className="truncate">{tournament.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView(tournament)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
            >
              <FaEye className="w-4 h-4" />
            </button>
            {isManaged && (
              <button
                onClick={() => onEdit(tournament)}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Edit Tournament"
              >
                <FaEdit className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaTrophy className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium">
              {tournament.sport || 'Tournament'}
            </span>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)} bg-white/20 text-white border-white/30`}>
            {getStatusIcon(tournament.status)}
            <span className="ml-1">{tournament.status || 'Draft'}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
          {tournament.name || 'Unnamed Tournament'}
        </h3>
        
        {tournament.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
            {tournament.description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <FaCalendarAlt className="w-4 h-4" />
            <span>{formatDate(tournament.start_date)}</span>
            {tournament.end_date && tournament.end_date !== tournament.start_date && (
              <span>- {formatDate(tournament.end_date)}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FaUsers className="w-4 h-4" />
            <span>{formatParticipants(tournament.participants_count)}</span>
            {tournament.max_participants && (
              <span className="text-gray-400">
                / {tournament.max_participants} max
              </span>
            )}
          </div>
          
          {tournament.location && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FaMapMarkerAlt className="w-4 h-4" />
              <span className="truncate">{tournament.location}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {tournament.stats && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {tournament.stats.matches_played !== undefined && (
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {tournament.stats.matches_played}
                </div>
                <div className="text-xs text-gray-500">Matches</div>
              </div>
            )}
            {tournament.stats.rounds_completed !== undefined && (
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {tournament.stats.rounds_completed}
                </div>
                <div className="text-xs text-gray-500">Rounds</div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onView(tournament)}
            className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
          >
            <FaEye className="w-4 h-4" />
            <span>View</span>
          </button>
          
          {isManaged && (
            <button
              onClick={() => onEdit(tournament)}
              className="flex-1 bg-green-50 text-green-600 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <FaEdit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TournamentCard;
