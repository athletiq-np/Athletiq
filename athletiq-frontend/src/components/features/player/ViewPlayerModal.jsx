import React from 'react';
import { FaTimes, FaUser, FaIdCard, FaSchool, FaPhone, FaEnvelope, FaCalendarAlt, FaVenusMars, FaRunning, FaMapMarkerAlt, FaUserGraduate, FaWeight, FaRuler, FaFlag, FaAddressBook, FaShieldAlt, FaTrophy, FaMedal, FaClock, FaEdit, FaDownload, FaPrint } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ViewPlayerModal = ({ isOpen, onClose, player, schools = [] }) => {
  if (!isOpen || !player) return null;
  
  // Ensure player data is properly populated with defaults
  const enrichedPlayer = {
    ...player,
    // Basic Information
    full_name: player.full_name || player.name || 'N/A',
    full_name_nepali: player.full_name_nepali || '',
    athlete_id: player.athlete_id || player.id || 'N/A',
    email: player.email || '',
    phone: player.phone || '',
    date_of_birth: player.date_of_birth || '',
    gender: player.gender || '',
    nationality: player.nationality || '',
    address: player.address || '',
    
    // Athletic Information
    primary_sport: player.primary_sport || '',
    registered_sports: player.registered_sports || [],
    height_cm: player.height_cm || '',
    weight_kg: player.weight_kg || '',
    position: player.position || '',
    
    // School Information
    school_id: player.school_id || (player.school ? player.school.id : ''),
    school_name: player.school_name || (player.school ? player.school.name : ''),
    school_code: player.school_code || (player.school ? player.school.school_code : ''),
    grade: player.grade || '',
    section: player.section || '',
    
    // Guardian Information
    guardian_name: player.guardian_name || '',
    guardian_phone: player.guardian_phone || '',
    guardian_email: player.guardian_email || '',
    relationship_to_player: player.relationship_to_player || '',
    
    // Status and Verification
    is_active: typeof player.is_active === 'boolean' ? player.is_active : true,
    verification_status: player.verification_status || '',
    profile_completion: player.profile_completion || 0,
    
    // Additional Statistics
    tournaments_participated: player.tournaments_participated || 0,
    matches_played: player.matches_played || 0,
    achievements: player.achievements || 0,
    
    // Document Information
    profile_photo_url: player.profile_photo_url || '',
    birth_certificate_url: player.birth_certificate_url || '',
    birth_certificate_no: player.birth_certificate_no || '',
    additional_documents_count: player.additional_documents_count || 0,
    
    // Timestamps
    created_at: player.created_at || '',
    updated_at: player.updated_at || ''
  };

  const getSchoolName = (schoolId) => {
    if (!schoolId) return 'Not specified';
    const school = schools.find(s => 
      s.id === schoolId || 
      s.school_id === schoolId || 
      s.id === schoolId?.toString() || 
      s.school_id === schoolId?.toString()
    );
    return school ? school.name : 'Unknown School';
  };

  const getSchoolDetails = (schoolId) => {
    if (!schoolId) return { name: 'Not specified', code: 'N/A', id: 'N/A' };
    const school = schools.find(s => 
      s.id === schoolId || 
      s.school_id === schoolId || 
      s.id === schoolId?.toString() || 
      s.school_id === schoolId?.toString()
    );
    return school ? {
      name: school.name || 'Unknown School',
      code: school.school_code || school.code || 'N/A',
      id: school.id || school.school_id || 'N/A'
    } : { name: 'Unknown School', code: 'N/A', id: 'N/A' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
      inactive: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
      pending: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[status] || statusClasses.active}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        {status || 'Active'}
      </span>
    );
  };

  const getVerificationBadge = (status) => {
    const statusClasses = {
      verified: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      rejected: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
      requires_review: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
      pending: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
    };
    
    const statusText = {
      verified: '✓ Verified',
      rejected: '✗ Rejected',
      requires_review: '⏳ Review',
      pending: '⏳ Pending'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[status] || statusClasses.pending}`}>
        {statusText[status] || statusText.pending}
      </span>
    );
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <FaUserGraduate className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Player Details
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Comprehensive player information and statistics
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                    title="Print Details"
                  >
                    <FaPrint className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                    title="Download Details"
                  >
                    <FaDownload className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                    title="Close"
                  >
                    <FaTimes className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6 space-y-8">
                {/* Player Profile Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {player.profile_photo_url ? (
                        <img
                          src={`/uploads/${player.profile_photo_url}`}
                          alt="Profile"
                          className="h-20 w-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-xl"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                          <FaUserGraduate className="text-white text-2xl" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {enrichedPlayer.full_name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">
                        {enrichedPlayer.full_name_nepali && `${enrichedPlayer.full_name_nepali} • `}
                        ID: {enrichedPlayer.athlete_id}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        {getStatusBadge(player.is_active ? 'active' : 'inactive')}
                        {getVerificationBadge(player.verification_status)}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          <FaClock className="inline w-3 h-3 mr-1" />
                          Registered: {formatDate(player.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                      <FaUser className="mr-3 text-blue-500" />
                      Personal Information
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaEnvelope className="text-blue-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-gray-900 dark:text-white font-medium">{enrichedPlayer.email || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaPhone className="text-green-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="text-gray-900 dark:text-white font-medium">{enrichedPlayer.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaCalendarAlt className="text-purple-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</p>
                          <p className="text-gray-900 dark:text-white font-medium">{formatDate(player.date_of_birth)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Age: {calculateAge(player.date_of_birth)} years
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaVenusMars className="text-pink-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</p>
                          <p className="text-gray-900 dark:text-white font-medium capitalize">{enrichedPlayer.gender || 'Not specified'}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaFlag className="text-orange-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nationality</p>
                          <p className="text-gray-900 dark:text-white font-medium">{enrichedPlayer.nationality || 'Not specified'}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaAddressBook className="text-indigo-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                          <p className="text-gray-900 dark:text-white font-medium">{enrichedPlayer.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Athletic Information */}
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                      <FaRunning className="mr-3 text-green-500" />
                      Athletic Information
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaSchool className="text-blue-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">School</p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {getSchoolDetails(player.school_id || player.school?.id).name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {getSchoolDetails(player.school_id || player.school?.id).id} • Code: {getSchoolDetails(player.school_id || player.school?.id).code}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaRunning className="text-green-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Sport</p>
                          <p className="text-gray-900 dark:text-white font-medium">{enrichedPlayer.primary_sport || 'Not specified'}</p>
                          {enrichedPlayer.registered_sports && Array.isArray(enrichedPlayer.registered_sports) && enrichedPlayer.registered_sports.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              +{enrichedPlayer.registered_sports.length} additional sports
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaMapMarkerAlt className="text-purple-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</p>
                          <p className="text-gray-900 dark:text-white font-medium">{enrichedPlayer.position || 'Not specified'}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaRuler className="text-orange-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Height</p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {enrichedPlayer.height_cm ? `${enrichedPlayer.height_cm} cm` : 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaWeight className="text-red-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weight</p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {enrichedPlayer.weight_kg ? `${enrichedPlayer.weight_kg} kg` : 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaShieldAlt className="text-indigo-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Status</p>
                          <div className="mt-1">
                            {getVerificationBadge(player.verification_status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guardian Information */}
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <FaAddressBook className="mr-3 text-purple-500" />
                    Guardian Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaUser className="text-blue-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Guardian Name</p>
                          <p className="text-gray-900 dark:text-white font-medium">{enrichedPlayer.guardian_name || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaPhone className="text-green-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Guardian Phone</p>
                          <p className="text-gray-900 dark:text-white font-medium">{enrichedPlayer.guardian_phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaEnvelope className="text-purple-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Guardian Email</p>
                          <p className="text-gray-900 dark:text-white font-medium">{enrichedPlayer.guardian_email || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <FaUser className="text-orange-500 mr-4 w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Relationship</p>
                          <p className="text-gray-900 dark:text-white font-medium">{enrichedPlayer.relationship_to_player || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Statistics */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <FaTrophy className="mr-3 text-yellow-500" />
                    Performance Statistics
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {player.tournaments_participated || 0}
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tournaments</p>
                    </div>
                    <div className="text-center p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        {player.matches_played || 0}
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Matches</p>
                    </div>
                    <div className="text-center p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {player.achievements || 0}
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Achievements</p>
                    </div>
                    <div className="text-center p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl">
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                        {player.profile_completion || 0}%
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profile Complete</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 border-t border-gray-200/50 dark:border-gray-600/50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {formatDate(player.updated_at)}
                </div>
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200 font-medium flex items-center"
                  >
                    <FaEdit className="w-4 h-4 mr-2" />
                    Edit Player
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 font-medium"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViewPlayerModal;
