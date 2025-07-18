// src/pages/guardian/GuardianClaimPortal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import {
  FaUserShield, FaCheck, FaTimes, FaSpinner, FaUser, FaPhone,
  FaEnvelope, FaMapMarkerAlt, FaBriefcase, FaGraduationCap,
  FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaArrowLeft,
  FaFileAlt, FaCamera, FaUpload, FaEye, FaUserFriends, FaGoogle,
  FaCalendarAlt, FaSearch, FaSchool, FaUsers
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';

export default function GuardianClaimPortal() {
  const { claimCode } = useParams();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(claimCode ? 1 : 0); // Start at step 0 if no claim code
  const [loading, setLoading] = useState(!!claimCode);
  const [submitting, setSubmitting] = useState(false);
  const [claimData, setClaimData] = useState(null);
  const [claimMethod, setClaimMethod] = useState(claimCode ? 'code' : '');
  const [enteredClaimCode, setEnteredClaimCode] = useState('');
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [studentSearchData, setStudentSearchData] = useState({
    schoolName: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    dateFormat: 'english',
    guardianPhone: '',
    guardianEmail: ''
  });
  const [googleUser, setGoogleUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    occupation: '',
    education_level: '',
    relationship: 'parent',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    id_document_type: 'citizenship',
    id_document_number: ''
  });
  const [documents, setDocuments] = useState({
    id_document: null,
    photo: null
  });
  const [preview, setPreview] = useState({
    id_document: null,
    photo: null
  });

  useEffect(() => {
    if (claimCode) {
      verifyClaimCode();
    } else {
      loadSchools();
    }
  }, [claimCode]);

  const loadSchools = useCallback(async (searchTerm = '') => {
    try {
      console.log('Loading schools with search term:', searchTerm);
      setSchoolsLoading(true);
      const url = `/guardian/schools${searchTerm ? `?search=${searchTerm}` : ''}`;
      console.log('Making API call to:', url);
      const response = await apiClient.get(url);
      console.log('Schools API response:', response.data);
      if (response.data.success) {
        const schoolOptions = response.data.schools.map(school => ({
          value: school.school_name,
          label: `${school.school_name} (${school.student_count} students)`,
          ...school
        }));
        console.log('Processed school options:', schoolOptions);
        setSchools(schoolOptions);
      } else {
        console.error('Schools API returned unsuccessful response:', response.data);
        toast.error('Failed to load schools list');
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      toast.error('Error loading schools list');
    } finally {
      setSchoolsLoading(false);
    }
  }, []);

  const handleGoogleSignIn = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/guardian/google-auth', {
        googleToken: credentialResponse.credential
      });

      if (response.data.success) {
        setGoogleUser(response.data.guardian);
        setStudentSearchData(prev => ({
          ...prev,
          guardianEmail: response.data.guardian.email
        }));
        toast.success('Google authentication successful!');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(\+977|977)?[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/[-\s]/g, ''));
  };

  const verifyClaimCode = async (codeToVerify = claimCode) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/guardian/verify-claim', {
        claimCode: codeToVerify
      });

      if (response.data.success) {
        setClaimData(response.data.athlete);
        setStep(2);
        toast.success('Claim code verified successfully!');
      } else {
        toast.error('Invalid or expired claim code');
      }
    } catch (error) {
      console.error('Claim verification error:', error);
      toast.error('Error verifying claim code');
    } finally {
      setLoading(false);
    }
  };

  const claimByStudentDetails = async () => {
    try {
      setLoading(true);
      console.log('=== Frontend: Claiming student by details ===');
      console.log('studentSearchData:', JSON.stringify(studentSearchData, null, 2));

      // Validate required fields
      if (!studentSearchData.schoolName || !studentSearchData.firstName || 
          !studentSearchData.lastName || !studentSearchData.dateOfBirth || 
          !studentSearchData.guardianPhone) {
        console.log('Frontend validation failed - missing required fields');
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate phone number
      if (!validatePhoneNumber(studentSearchData.guardianPhone)) {
        console.log('Frontend phone validation failed');
        toast.error('Please provide a valid Nepali phone number (10 digits)');
        return;
      }

      console.log('Making API request to /guardian/claim-by-details');
      const response = await apiClient.post('/guardian/claim-by-details', studentSearchData);

      if (response.data.success) {
        setClaimData(response.data.athlete);
        setEnteredClaimCode(response.data.claimCode);
        setStep(2);
        
        if (response.data.isNewStudent) {
          toast.success('🎉 New student registration created! Your request is pending school approval.', {
            duration: 6000
          });
        } else if (response.data.requiresApproval) {
          toast.success('✅ Student found! Your claim is pending school approval.', {
            duration: 4000
          });
        } else {
          toast.success('✅ Student found and claim code generated!');
        }
      } else {
        console.log('API response error:', response.data);
        toast.error(response.data.message || 'Student not found with provided details');
      }
    } catch (error) {
      console.error('Student claim error:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Error searching for student. Please check the details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = type === 'photo' 
      ? ['image/jpeg', 'image/png', 'image/jpg']
      : ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Please upload ${type === 'photo' ? 'JPG/PNG' : 'JPG/PNG/PDF'} files only.`);
      return;
    }

    setDocuments(prev => ({
      ...prev,
      [type]: file
    }));

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(prev => ({
          ...prev,
          [type]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(prev => ({
        ...prev,
        [type]: null
      }));
    }
  };

  const validateForm = () => {
    const required = ['full_name', 'phone', 'email', 'address', 'relationship'];
    const missing = required.filter(field => !formData[field]?.trim());
    
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return false;
    }

    if (!documents.id_document) {
      toast.error('Please upload ID document');
      return false;
    }

    if (!documents.photo) {
      toast.error('Please upload your photo');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const submitData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Add files
      if (documents.id_document) {
        submitData.append('id_document', documents.id_document);
      }
      if (documents.photo) {
        submitData.append('photo', documents.photo);
      }

      const response = await apiClient.post(`/guardian/complete-profile/${claimCode}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setStep(4);
        toast.success('Profile completed successfully!');
      } else {
        toast.error(response.data.message || 'Profile completion failed');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error(error.response?.data?.message || 'Error completing profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendClaim = async () => {
    try {
      await apiClient.post('/guardian/resend-claim', {
        claim_code: claimCode
      });
      toast.success('Claim details resent to your contact information');
    } catch (error) {
      toast.error('Error resending claim details');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying claim code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
              <FaUserShield className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Guardian Claim Portal</h1>
            <p className="text-gray-600">Complete your guardian profile to manage your athlete's account</p>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Choose Claim Method */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">How would you like to claim your student?</h2>
                  <p className="text-gray-600">Choose one of the options below to get started</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Claim Code Option */}
                  <div 
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      claimMethod === 'code' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setClaimMethod('code')}
                  >
                    <div className="text-center">
                      <FaShieldAlt className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">I have a claim code</h3>
                      <p className="text-gray-600">Use the claim code provided by your school or received via SMS/email</p>
                    </div>
                  </div>

                  {/* Student Details Option */}
                  <div 
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      claimMethod === 'details' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      setClaimMethod('details');
                      // Load schools when user selects this method
                      if (schools.length === 0) {
                        loadSchools();
                      }
                    }}
                  >
                    <div className="text-center">
                      <FaUser className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Find my student</h3>
                      <p className="text-gray-600">Search using school name, student name, and date of birth</p>
                    </div>
                  </div>
                </div>

                {/* Claim Code Form */}
                {claimMethod === 'code' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6"
                  >
                    <div className="max-w-md mx-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Claim Code
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={enteredClaimCode}
                          onChange={(e) => setEnteredClaimCode(e.target.value.toUpperCase())}
                          placeholder="Enter your claim code"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          maxLength={10}
                        />
                        <button
                          onClick={() => verifyClaimCode(enteredClaimCode)}
                          disabled={!enteredClaimCode.trim() || loading}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {loading ? <FaSpinner className="animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Student Details Form */}
                {claimMethod === 'details' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6"
                  >
                    {/* Google Sign In Option */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">Optional: Sign in with Google</h4>
                          <p className="text-sm text-gray-600">Auto-fill your email address</p>
                        </div>
                        {!googleUser ? (
                          <button
                            type="button"
                            onClick={() => {
                              // This would trigger Google Sign-In
                              // For now, we'll simulate it
                              toast.info('Google Sign-In integration coming soon');
                            }}
                            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <FaGoogle className="mr-2 text-red-500" />
                            Sign in with Google
                          </button>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <FaCheckCircle className="mr-2" />
                            Signed in as {googleUser.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaSchool className="inline mr-1" />
                          School Name *
                        </label>
                        <Select
                          value={selectedSchool}
                          onChange={(selected) => {
                            setSelectedSchool(selected);
                            setStudentSearchData(prev => ({...prev, schoolName: selected?.value || ''}));
                          }}
                          onInputChange={(inputValue) => {
                            if (inputValue.length > 2) {
                              loadSchools(inputValue);
                            }
                          }}
                          onMenuOpen={() => {
                            // Load schools when dropdown opens if not already loaded
                            if (schools.length === 0) {
                              loadSchools();
                            }
                          }}
                          options={schools}
                          isLoading={schoolsLoading}
                          isSearchable
                          placeholder="Search and select school..."
                          className="react-select-container"
                          classNamePrefix="react-select"
                          noOptionsMessage={() => "No schools found"}
                          loadingMessage={() => "Searching schools..."}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaUser className="inline mr-1" />
                          Student First Name *
                        </label>
                        <input
                          type="text"
                          value={studentSearchData.firstName}
                          onChange={(e) => setStudentSearchData(prev => ({...prev, firstName: e.target.value}))}
                          placeholder="Enter student's first name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaUser className="inline mr-1" />
                          Student Last Name *
                        </label>
                        <input
                          type="text"
                          value={studentSearchData.lastName}
                          onChange={(e) => setStudentSearchData(prev => ({...prev, lastName: e.target.value}))}
                          placeholder="Enter student's last name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaCalendarAlt className="inline mr-1" />
                          Date Format
                        </label>
                        <select
                          value={studentSearchData.dateFormat}
                          onChange={(e) => setStudentSearchData(prev => ({...prev, dateFormat: e.target.value}))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="english">English Date (AD)</option>
                          <option value="nepali">Nepali Date (BS)</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaCalendarAlt className="inline mr-1" />
                          Date of Birth *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={studentSearchData.dateOfBirth}
                            onChange={(e) => setStudentSearchData(prev => ({...prev, dateOfBirth: e.target.value}))}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {studentSearchData.dateFormat === 'nepali' && (
                            <button
                              type="button"
                              onClick={() => toast.info('Nepali date converter coming soon')}
                              className="px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                            >
                              Convert BS/AD
                            </button>
                          )}
                        </div>
                        {studentSearchData.dateFormat === 'nepali' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Enter date in AD format for now. BS date support coming soon.
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaPhone className="inline mr-1" />
                          Your Phone Number * (Required)
                        </label>
                        <input
                          type="tel"
                          value={studentSearchData.guardianPhone}
                          onChange={(e) => setStudentSearchData(prev => ({...prev, guardianPhone: e.target.value}))}
                          placeholder="+977-9XXXXXXXXX"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter your 10-digit Nepali mobile number
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaEnvelope className="inline mr-1" />
                          Your Email {googleUser ? '(From Google)' : '(Optional)'}
                        </label>
                        <input
                          type="email"
                          value={studentSearchData.guardianEmail}
                          onChange={(e) => setStudentSearchData(prev => ({...prev, guardianEmail: e.target.value}))}
                          placeholder="your.email@example.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!!googleUser}
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <FaExclamationTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-semibold text-yellow-800">School Approval Required</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Claims made without a code require approval from your school administration. 
                            You will be notified once approved.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={claimByStudentDetails}
                        disabled={!studentSearchData.schoolName || !studentSearchData.firstName || 
                                !studentSearchData.lastName || !studentSearchData.dateOfBirth || 
                                !studentSearchData.guardianPhone || loading}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <FaSearch className="mr-2" />
                            Find Student & Submit for Approval
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 1: Invalid/Expired Claim */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8 text-center"
              >
                <FaExclamationTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Invalid Claim Code</h2>
                <p className="text-gray-600 mb-6">
                  This claim code is either invalid, expired, or has already been used.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleResendClaim}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Resend Claim Details
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="block mx-auto text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Return to Home
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Athlete Information Display */}
            {step === 2 && claimData && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                  <h2 className="text-2xl font-semibold mb-2">Athlete Information</h2>
                  <p className="text-green-100">Please verify this is your athlete before proceeding</p>
                </div>

                <div className="p-8">
                  <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center">
                        <FaUser className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{claimData.athlete_name}</h3>
                        <p className="text-gray-600">Nepal Athlete ID: {claimData.athlete_nepal_id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">School:</span>
                        <span className="ml-2 text-gray-600">{claimData.school_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Grade:</span>
                        <span className="ml-2 text-gray-600">{claimData.athlete_grade}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Registration Date:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(claimData.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Claim Expires:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(claimData.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => setStep(3)}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <FaCheckCircle />
                      <span>Yes, This is My Athlete</span>
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="mt-4 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      This is not my athlete
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Guardian Profile Form */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                  <h2 className="text-2xl font-semibold mb-2">Complete Your Guardian Profile</h2>
                  <p className="text-purple-100">Provide your information to manage your athlete's account</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <FaUser className="h-5 w-5 text-gray-600" />
                      <span>Personal Information</span>
                    </h3>
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
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relationship to Athlete *
                        </label>
                        <select
                          name="relationship"
                          value={formData.relationship}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="parent">Parent</option>
                          <option value="guardian">Guardian</option>
                          <option value="relative">Relative</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <FaPhone className="h-5 w-5 text-gray-600" />
                      <span>Contact Information</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+977-XXXXXXXXXX"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address *
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your complete address"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <FaBriefcase className="h-5 w-5 text-gray-600" />
                      <span>Professional Information</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Occupation
                        </label>
                        <input
                          type="text"
                          name="occupation"
                          value={formData.occupation}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your occupation"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Education Level
                        </label>
                        <select
                          name="education_level"
                          value={formData.education_level}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select education level</option>
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                          <option value="higher_secondary">Higher Secondary</option>
                          <option value="bachelors">Bachelor's Degree</option>
                          <option value="masters">Master's Degree</option>
                          <option value="phd">PhD</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <FaUserFriends className="h-5 w-5 text-gray-600" />
                      <span>Emergency Contact</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Emergency Contact Name
                        </label>
                        <input
                          type="text"
                          name="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Name of emergency contact"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Emergency Contact Phone
                        </label>
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+977-XXXXXXXXXX"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ID Document */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <FaFileAlt className="h-5 w-5 text-gray-600" />
                      <span>Identification</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Document Type
                        </label>
                        <select
                          name="id_document_type"
                          value={formData.id_document_type}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="citizenship">Citizenship Certificate</option>
                          <option value="passport">Passport</option>
                          <option value="driving_license">Driving License</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Document Number
                        </label>
                        <input
                          type="text"
                          name="id_document_number"
                          value={formData.id_document_number}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter document number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Uploads */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <FaUpload className="h-5 w-5 text-gray-600" />
                      <span>Document Uploads</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Document Photo *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          {preview.id_document ? (
                            <div className="space-y-3">
                              <img
                                src={preview.id_document}
                                alt="ID Document"
                                className="h-32 mx-auto object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => document.getElementById('id_document').click()}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Change Photo
                              </button>
                            </div>
                          ) : (
                            <div>
                              <FaFileAlt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <button
                                type="button"
                                onClick={() => document.getElementById('id_document').click()}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Upload ID Document
                              </button>
                              <p className="text-xs text-gray-500 mt-2">JPG, PNG, PDF up to 5MB</p>
                            </div>
                          )}
                          <input
                            id="id_document"
                            type="file"
                            onChange={(e) => handleFileChange(e, 'id_document')}
                            accept="image/*,.pdf"
                            className="hidden"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Photo *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          {preview.photo ? (
                            <div className="space-y-3">
                              <img
                                src={preview.photo}
                                alt="Guardian Photo"
                                className="h-32 w-32 mx-auto object-cover rounded-full"
                              />
                              <button
                                type="button"
                                onClick={() => document.getElementById('photo').click()}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Change Photo
                              </button>
                            </div>
                          ) : (
                            <div>
                              <FaCamera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <button
                                type="button"
                                onClick={() => document.getElementById('photo').click()}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Upload Your Photo
                              </button>
                              <p className="text-xs text-gray-500 mt-2">JPG, PNG up to 5MB</p>
                            </div>
                          )}
                          <input
                            id="photo"
                            type="file"
                            onChange={(e) => handleFileChange(e, 'photo')}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          <span>Completing Profile...</span>
                        </>
                      ) : (
                        <>
                          <FaCheckCircle />
                          <span>Complete Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8 text-center"
              >
                <FaCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Profile Complete!</h2>
                <p className="text-gray-600 mb-8">
                  Your guardian profile has been successfully completed. You now have access to manage your athlete's account and receive important updates.
                </p>
                
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
                  <ul className="text-left text-gray-600 space-y-2">
                    <li className="flex items-center space-x-2">
                      <FaCheck className="h-4 w-4 text-green-500" />
                      <span>Receive notifications about tournaments and events</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FaCheck className="h-4 w-4 text-green-500" />
                      <span>Access athlete performance reports</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FaCheck className="h-4 w-4 text-green-500" />
                      <span>Manage athlete registration details</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FaCheck className="h-4 w-4 text-green-500" />
                      <span>View competition schedules and results</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/')}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <FaArrowLeft />
                  <span>Return to Home</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
