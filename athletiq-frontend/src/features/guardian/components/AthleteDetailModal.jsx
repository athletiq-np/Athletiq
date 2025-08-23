import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaUser, FaSchool, FaCalendarAlt, FaMapMarkerAlt, FaPhone, FaEnvelope, FaIdCard, FaCertificate, FaHeartbeat, FaMedal, FaEdit } from 'react-icons/fa';
import VerificationStatusBadge from '../../../components/common/VerificationStatusBadge';
import ProfileCompletionCircle from '../../../components/common/ProfileCompletionCircle';
import AthleteMatchesWidget from './AthleteMatchesWidget';

const AthleteDetailModal = ({ athlete, onClose, onEdit }) => {
  if (!athlete) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Unknown';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
          
          {/* Profile Section */}
          <div className="absolute -bottom-12 left-6 flex items-end space-x-4">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-100 flex items-center justify-center">
              {athlete.profile_photo_url ? (
                <img
                  src={athlete.profile_photo_url}
                  alt={athlete.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="pb-2">
              <h2 className="text-2xl font-bold text-white">{athlete.full_name}</h2>
              <p className="text-blue-100">{athlete.athlete_id}</p>
            </div>
          </div>

          <div className="absolute -bottom-4 right-6">
            <ProfileCompletionCircle percentage={athlete.profile_completion} size="lg" />
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 p-6">
          {/* Status and Actions */}
          <div className="flex justify-between items-center mb-6">
            <VerificationStatusBadge status={athlete.verification_status} />
            <button
              onClick={() => onEdit(athlete)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <FaEdit />
              <span>Edit</span>
            </button>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name (English)</label>
                  <p className="text-gray-900">{athlete.full_name}</p>
                </div>
                {athlete.full_name_nepali && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name (Nepali)</label>
                    <p className="text-gray-900">{athlete.full_name_nepali}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                  <p className="text-gray-900">{formatDate(athlete.date_of_birth)} ({calculateAge(athlete.date_of_birth)} years old)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Gender</label>
                  <p className="text-gray-900">{athlete.gender || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Nationality</label>
                  <p className="text-gray-900">{athlete.nationality || 'Nepali'}</p>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaSchool className="mr-2 text-green-500" />
                Academic Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">School</label>
                  <p className="text-gray-900">{athlete.school_name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Grade</label>
                  <p className="text-gray-900">Grade {athlete.grade}{athlete.section ? ` - Section ${athlete.section}` : ''}</p>
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaUser className="mr-2 text-purple-500" />
                Guardian Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Guardian Name</label>
                  <p className="text-gray-900">{athlete.guardian_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Relationship</label>
                  <p className="text-gray-900">{athlete.relationship_to_player}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900 flex items-center">
                    <FaPhone className="mr-2 text-gray-400" />
                    {athlete.guardian_phone}
                  </p>
                </div>
                {athlete.guardian_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900 flex items-center">
                      <FaEnvelope className="mr-2 text-gray-400" />
                      {athlete.guardian_email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-red-500" />
                Address Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">{athlete.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Province</label>
                  <p className="text-gray-900">{athlete.province}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">District</label>
                  <p className="text-gray-900">{athlete.district}</p>
                </div>
              </div>
            </div>

            {/* Sports Information */}
            {athlete.registered_sports && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaMedal className="mr-2 text-yellow-500" />
                  Sports Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registered Sports</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {JSON.parse(athlete.registered_sports).map((sport, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                  {athlete.primary_sport && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Primary Sport</label>
                      <p className="text-gray-900">{athlete.primary_sport}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Physical Information */}
            {(athlete.height_cm || athlete.weight_kg || athlete.blood_group) && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaHeartbeat className="mr-2 text-red-500" />
                  Physical Information
                </h3>
                <div className="space-y-3">
                  {athlete.height_cm && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Height</label>
                      <p className="text-gray-900">{athlete.height_cm} cm</p>
                    </div>
                  )}
                  {athlete.weight_kg && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Weight</label>
                      <p className="text-gray-900">{athlete.weight_kg} kg</p>
                    </div>
                  )}
                  {athlete.blood_group && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Blood Group</label>
                      <p className="text-gray-900">{athlete.blood_group}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Matches (placeholder using grouped tournament endpoint - integrate real athlete mapping later) */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaTrophy className="mr-2 text-yellow-600" />
                Recent / Upcoming Matches
              </h3>
              <AthleteMatchesWidget athleteId={athlete.athlete_id} />
              <p className="mt-2 text-[10px] text-gray-400">Using placeholder tournament grouping; refine once athlete-match linkage endpoint is available.</p>
            </div>

            {/* Documents */}
            <div className="bg-gray-50 rounded-lg p-6 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaCertificate className="mr-2 text-indigo-500" />
                Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Birth Certificate</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {athlete.birth_certificate_url ? (
                      <>
                        <span className="text-green-600">✓ Uploaded</span>
                        {athlete.birth_certificate_verified && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Verified</span>
                        )}
                      </>
                    ) : (
                      <span className="text-red-600">✗ Not uploaded</span>
                    )}
                  </div>
                </div>
                
                {athlete.birth_certificate_no && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Certificate Number</label>
                    <p className="text-gray-900">{athlete.birth_certificate_no}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AthleteDetailModal;
