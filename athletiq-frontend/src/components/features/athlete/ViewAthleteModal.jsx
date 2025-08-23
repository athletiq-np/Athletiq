// src/components/features/athlete/ViewAthleteModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaUser, FaGraduationCap, FaHome, FaPhone, FaCalendarAlt, 
  FaMale, FaFemale, FaIdCard, FaHeart, FaUserGraduate, FaEnvelope,
  FaCheckCircle, FaBirthdayCake
} from 'react-icons/fa';
import { HiOutlinePhone, HiOutlineUser, HiOutlineCalendar } from 'react-icons/hi';

export default function ViewAthleteModal({ isOpen, onClose, student }) {
  if (!isOpen || !student) return null;

  const genderStyle = student.gender?.toLowerCase() === 'male' 
    ? { bgColor: 'bg-blue-50', textColor: 'text-blue-800', borderColor: 'border-blue-200', iconColor: 'text-blue-600' }
    : { bgColor: 'bg-pink-50', textColor: 'text-pink-800', borderColor: 'border-pink-200', iconColor: 'text-pink-600' };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Modal Header */}
          <div className={`relative p-8 ${genderStyle.bgColor} rounded-t-3xl`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            >
              <FaTimes className="h-4 w-4 text-gray-600" />
            </button>

            <div className="flex items-center space-x-6">
              <div className={`w-24 h-24 rounded-full border-4 ${genderStyle.borderColor} overflow-hidden shadow-lg`}>
                {student.photo ? (
                  <img 
                    src={student.photo} 
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-white flex items-center justify-center`}>
                    <FaUserGraduate className={`h-12 w-12 ${genderStyle.iconColor}`} />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h2 className={`text-3xl font-bold ${genderStyle.textColor}`}>
                  {student.name}
                </h2>
                <p className="text-lg text-gray-700 mt-1">{student.nameNepali}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white ${genderStyle.textColor}`}>
                    Roll #{student.rollNumber}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white ${genderStyle.textColor}`}>
                    {student.house}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaBirthdayCake className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <HiOutlineCalendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium">{student.age} years old</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {student.gender === 'Male' ? (
                      <FaMale className="h-5 w-5 text-blue-600" />
                    ) : (
                      <FaFemale className="h-5 w-5 text-pink-600" />
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium">{student.gender}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FaGraduationCap className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Class</p>
                      <p className="font-medium">Grade {student.grade} - Section {student.section}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FaHome className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{student.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Guardian Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <HiOutlineUser className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Guardian Name</p>
                      <p className="font-medium">{student.guardianName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <HiOutlinePhone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium">{student.guardianPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{student.guardianEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FaPhone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Emergency Contact</p>
                      <p className="font-medium">{student.emergencyContact}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Medical Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaHeart className="h-5 w-5 text-red-400" />
                    <div>
                      <p className="text-sm text-gray-500">Blood Group</p>
                      <p className="font-medium">{student.bloodGroup}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FaIdCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Medical Conditions</p>
                      <p className="font-medium">{student.medicalConditions || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sports & Activities */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Sports & Activities</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <FaUserGraduate className="h-5 w-5 text-yellow-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Sports Interests</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {student.sportsInterests?.map((sport, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {sport}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Documents</h3>
              <div className="flex flex-wrap gap-3">
                {student.documents?.map((doc, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center space-x-2"
                  >
                    <FaCheckCircle className="h-4 w-4" />
                    <span>{doc}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
