import React from 'react';
import { FaTimes, FaUser, FaIdCard, FaSchool, FaPhone, FaEnvelope, FaCalendarAlt, FaVenusMars, FaRunning, FaMapMarkerAlt } from 'react-icons/fa';

const ViewPlayerModal = ({ isOpen, onClose, player, schools = [] }) => {
  if (!isOpen || !player) return null;

  const getSchoolName = (schoolId) => {
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : 'Unknown School';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || statusClasses.active}`}>
        {status || 'Active'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaUser className="mr-2 text-blue-500" />
            Player Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {player.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Player ID: {player.player_id}
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge(player.status)}
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Registered: {formatDate(player.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Personal Information
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <FaEnvelope className="text-gray-400 mr-3 w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{player.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaPhone className="text-gray-400 mr-3 w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white">{player.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaCalendarAlt className="text-gray-400 mr-3 w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(player.date_of_birth)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaVenusMars className="text-gray-400 mr-3 w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                    <p className="text-gray-900 dark:text-white capitalize">{player.gender || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Athletic Information
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <FaSchool className="text-gray-400 mr-3 w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">School</p>
                    <p className="text-gray-900 dark:text-white">{getSchoolName(player.school_id)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaRunning className="text-gray-400 mr-3 w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sport</p>
                    <p className="text-gray-900 dark:text-white">{player.sport || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-gray-400 mr-3 w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
                    <p className="text-gray-900 dark:text-white">{player.position || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaIdCard className="text-gray-400 mr-3 w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Verification Status</p>
                    <p className="text-gray-900 dark:text-white">
                      {player.is_verified ? 
                        <span className="text-green-600 dark:text-green-400">✓ Verified</span> : 
                        <span className="text-yellow-600 dark:text-yellow-400">⏳ Pending</span>
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          {(player.tournaments_participated || player.matches_played || player.achievements) && (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Performance Statistics
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {player.tournaments_participated || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tournaments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {player.matches_played || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Matches</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {player.achievements || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Achievements</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPlayerModal;
