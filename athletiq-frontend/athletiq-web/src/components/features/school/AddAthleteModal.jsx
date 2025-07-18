// src/components/features/school/AddAthleteModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes, FaUser, FaGraduationCap, FaHome, FaPhone, FaCalendarAlt, 
  FaMale, FaFemale, FaUpload, FaCamera, FaFileAlt, FaArrowRight, 
  FaArrowLeft, FaCheckCircle, FaSpinner, FaIdCard
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';

export default function AddAthleteModal({ 
  isOpen, 
  onClose, 
  onAthleteAdded, 
  school,
  defaultSchoolId 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'male',
    grade: '',
    section: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    address: '',
    school_id: defaultSchoolId || ''
  });
  const [files, setFiles] = useState({
    profile_photo: null,
    birth_certificate: null
  });
  const [previewUrls, setPreviewUrls] = useState({
    profile_photo: null,
    birth_certificate: null
  });
  const [generatedAthleteId, setGeneratedAthleteId] = useState('');

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Student details' },
    { id: 2, title: 'Guardian Info', description: 'Guardian contact' },
    { id: 3, title: 'Documents', description: 'Upload files' },
    { id: 4, title: 'Review', description: 'Confirm details' }
  ];

  const grades = [
    'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', 
    '6', '7', '8', '9', '10', '11', '12'
  ];

  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, defaultSchoolId]);

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      full_name: '',
      date_of_birth: '',
      gender: 'male',
      grade: '',
      section: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
      address: '',
      school_id: defaultSchoolId || ''
    });
    setFiles({ profile_photo: null, birth_certificate: null });
    setPreviewUrls({ profile_photo: null, birth_certificate: null });
    setGeneratedAthleteId('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (fileType === 'profile_photo' && !file.type.startsWith('image/')) {
        toast.error('Please select a valid image file for profile photo');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      setFiles(prev => ({ ...prev, [fileType]: file }));
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setPreviewUrls(prev => ({ ...prev, [fileType]: previewUrl }));
      }
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.full_name || !formData.date_of_birth || !formData.gender || !formData.grade) {
          toast.error('Please fill in all required basic information');
          return false;
        }
        // Validate age (must be between 3-20 years)
        const age = new Date().getFullYear() - new Date(formData.date_of_birth).getFullYear();
        if (age < 3 || age > 20) {
          toast.error('Student age must be between 3 and 20 years');
          return false;
        }
        return true;
      case 2:
        if (!formData.guardian_name || !formData.guardian_phone) {
          toast.error('Please provide guardian name and phone number');
          return false;
        }
        // Validate phone number format (Nepal)
        const phoneRegex = /^[+]?[977]?[98]\d{8}$/;
        if (!phoneRegex.test(formData.guardian_phone.replace(/\s+/g, ''))) {
          toast.error('Please enter a valid Nepal phone number');
          return false;
        }
        return true;
      case 3:
        // Files are optional but validate if provided
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return; // Final validation
    
    setLoading(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      // Add files if present
      if (files.profile_photo) {
        submitData.append('profile_photo_url', files.profile_photo);
      }
      if (files.birth_certificate) {
        submitData.append('birth_cert_url', files.birth_certificate);
      }

      // Submit to backend
      const response = await apiClient.post('/players/register', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setGeneratedAthleteId(response.data.player.athlete_id);
        toast.success(`Student registered successfully! Nepal Athlete ID: ${response.data.player.athlete_id}`);
        
        // Call parent callback
        if (onAthleteAdded) {
          onAthleteAdded(response.data.player);
        }
        
        // Show success step
        setCurrentStep(5);
        
        // Auto close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Failed to register athlete';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <FaIdCard className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Register New Athlete</h2>
                <p className="text-blue-100">Nepal Athlete ID System</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${currentStep >= step.id 
                      ? 'bg-white text-blue-600 border-white' 
                      : 'border-blue-300 text-blue-300'
                    }`}>
                    {currentStep > step.id ? <FaCheckCircle /> : step.id}
                  </div>
                  <div className="ml-3 text-sm">
                    <div className={`font-medium ${currentStep >= step.id ? 'text-white' : 'text-blue-300'}`}>
                      {step.title}
                    </div>
                    <div className={`${currentStep >= step.id ? 'text-blue-100' : 'text-blue-300'}`}>
                      {step.description}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-white' : 'bg-blue-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter student's full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === 'male'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <FaMale className="mr-1 text-blue-500" />
                        Male
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === 'female'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <FaFemale className="mr-1 text-pink-500" />
                        Female
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade *
                    </label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Grade</option>
                      {grades.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Section</option>
                      {sections.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian Name *
                    </label>
                    <input
                      type="text"
                      name="guardian_name"
                      value={formData.guardian_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter guardian's full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian Phone *
                    </label>
                    <input
                      type="tel"
                      name="guardian_phone"
                      value={formData.guardian_phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="98XXXXXXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian Email
                    </label>
                    <input
                      type="email"
                      name="guardian_email"
                      value={formData.guardian_email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="guardian@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter complete address"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Photo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      {previewUrls.profile_photo ? (
                        <div className="space-y-2">
                          <img
                            src={previewUrls.profile_photo}
                            alt="Profile preview"
                            className="w-24 h-24 object-cover rounded-full mx-auto"
                          />
                          <button
                            type="button"
                            onClick={() => setFiles(prev => ({ ...prev, profile_photo: null }))}
                            className="text-red-500 text-sm hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <FaCamera className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-2">
                            <label htmlFor="profile_photo" className="cursor-pointer">
                              <span className="text-blue-600 hover:text-blue-500">Upload photo</span>
                              <input
                                id="profile_photo"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'profile_photo')}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Birth Certificate Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Birth Certificate
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      {files.birth_certificate ? (
                        <div className="space-y-2">
                          <FaFileAlt className="mx-auto h-12 w-12 text-green-500" />
                          <p className="text-sm text-gray-600">{files.birth_certificate.name}</p>
                          <button
                            type="button"
                            onClick={() => setFiles(prev => ({ ...prev, birth_certificate: null }))}
                            className="text-red-500 text-sm hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-2">
                            <label htmlFor="birth_certificate" className="cursor-pointer">
                              <span className="text-blue-600 hover:text-blue-500">Upload certificate</span>
                              <input
                                id="birth_certificate"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange(e, 'birth_certificate')}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">PDF, PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Review & Confirm</h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Full Name:</span>
                      <p className="text-gray-900">{formData.full_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
                      <p className="text-gray-900">{formData.date_of_birth}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Gender:</span>
                      <p className="text-gray-900 capitalize">{formData.gender}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Grade & Section:</span>
                      <p className="text-gray-900">{formData.grade} {formData.section && `- ${formData.section}`}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Guardian:</span>
                      <p className="text-gray-900">{formData.guardian_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Guardian Phone:</span>
                      <p className="text-gray-900">{formData.guardian_phone}</p>
                    </div>
                  </div>
                  {formData.guardian_email && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Guardian Email:</span>
                      <p className="text-gray-900">{formData.guardian_email}</p>
                    </div>
                  )}
                  {formData.address && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Address:</span>
                      <p className="text-gray-900">{formData.address}</p>
                    </div>
                  )}
                  <div className="flex space-x-4">
                    {files.profile_photo && (
                      <div className="text-sm">
                        <span className="text-green-600">✓</span> Profile photo uploaded
                      </div>
                    )}
                    {files.birth_certificate && (
                      <div className="text-sm">
                        <span className="text-green-600">✓</span> Birth certificate uploaded
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <FaCheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Registration Successful!</h3>
                  <p className="text-gray-600 mt-2">Athlete has been successfully registered</p>
                </div>
                {generatedAthleteId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-center space-x-3">
                      <FaIdCard className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Nepal Athlete ID Generated:</p>
                        <p className="text-2xl font-bold text-blue-600">{generatedAthleteId}</p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500">This window will close automatically...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {currentStep < 5 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={currentStep === 1 ? onClose : prevStep}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft />
              <span>{currentStep === 1 ? 'Cancel' : 'Previous'}</span>
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Next</span>
                <FaArrowRight />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    <span>Register Athlete</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
