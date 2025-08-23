import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUser, FaCalendarAlt, FaMapMarkerAlt, FaSchool, FaCamera,
  FaUpload, FaIdCard, FaHeartbeat, FaMedal, FaCheck, FaSpinner,
  FaExclamationTriangle, FaEdit, FaTrash, FaSearch, FaGlobe
} from 'react-icons/fa';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import apiClient from '../../../api/apiClient';

// Validation schema
const athleteSchema = yup.object({
  // Core Information
  full_name: yup.string().required('Full name is required'),
  full_name_nepali: yup.string(),
  date_of_birth: yup.date().required('Date of birth is required'),
  gender: yup.string().oneOf(['Male', 'Female'], 'Please select a valid gender').required(),
  
  // Academic Information
  grade: yup.string().required('Grade is required'),
  section: yup.string(),
  school_id: yup.number().required('Please select a school'),
  
  // Guardian Information
  guardian_name: yup.string().required('Guardian name is required'),
  relationship_to_player: yup.string().required('Relationship is required'),
  guardian_phone: yup.string().required('Guardian phone is required'),
  guardian_email: yup.string().email('Invalid email'),
  
  // Address Information
  address: yup.string().required('Address is required'),
  province: yup.string().required('Province is required'),
  district: yup.string().required('District is required'),
  
  // Optional fields
  citizenship_no: yup.string(),
  blood_group: yup.string(),
  height_cm: yup.number().positive(),
  weight_kg: yup.number().positive()
});

const GOOGLE_MAPS_LIBRARIES = ['places'];

const EnhancedAthleteForm = ({ 
  onSubmit, 
  onCancel, 
  initialData = null,
  isEdit = false 
}) => {
  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: yupResolver(athleteSchema),
    defaultValues: initialData || {}
  });

  // Component state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
  
  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(initialData?.profile_photo_url);
  const fileInputRef = useRef(null);
  
  // Birth certificate state
  const [birthCertificate, setBirthCertificate] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [fieldMismatches, setFieldMismatches] = useState([]);
  
  // Google Maps state
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedSchoolFromMaps, setSelectedSchoolFromMaps] = useState(null);

  const totalSteps = 4;

  // Load schools on component mount
  useEffect(() => {
    loadSchools();
  }, []);

  // Filter schools based on search term
  useEffect(() => {
    if (schoolSearchTerm) {
      const filtered = schools.filter(school =>
        school.name.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||
        school.school_code.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||
        school.address?.toLowerCase().includes(schoolSearchTerm.toLowerCase())
      );
      setFilteredSchools(filtered);
    } else {
      setFilteredSchools(schools);
    }
  }, [schoolSearchTerm, schools]);

  const loadSchools = async () => {
    try {
      const response = await apiClient.get('/guardian/schools');
      const list = response?.data?.data || response?.data?.schools || response?.data || [];
      setSchools(list);
      setFilteredSchools(list);
    } catch (error) {
      console.error('Error loading schools:', error);
      toast.error('Failed to load schools');
    }
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setProfilePhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle birth certificate upload with OCR
  const handleBirthCertificateUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image or PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setBirthCertificate(file);
    
    // Process with OCR if it's an image
    if (file.type.startsWith('image/')) {
      await processBirthCertificateOCR(file);
    }
  };

  // OCR Processing
  const processBirthCertificateOCR = async (file) => {
    setOcrProcessing(true);
    try {
      const formData = new FormData();
      formData.append('birth_certificate', file);

  const response = await apiClient.post('/ocr/birth-certificate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setOcrData(response.data.extractedData);
        await autoFillFromOCR(response.data.extractedData);
        toast.success('Birth certificate processed successfully!');
      } else {
        toast.warning('OCR processing completed with limited results');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      toast.error('Failed to process birth certificate');
    } finally {
      setOcrProcessing(false);
    }
  };

  // Auto-fill form from OCR data
  const autoFillFromOCR = async (ocrData) => {
    const mismatches = [];
    
    // Auto-fill and check for mismatches
    if (ocrData.full_name) {
      const currentName = watch('full_name');
      if (currentName && currentName !== ocrData.full_name) {
        mismatches.push({
          field: 'full_name',
          current: currentName,
          ocr: ocrData.full_name
        });
      } else {
        setValue('full_name', ocrData.full_name);
      }
    }

    if (ocrData.full_name_nepali) {
      setValue('full_name_nepali', ocrData.full_name_nepali);
    }

    if (ocrData.date_of_birth) {
      const currentDob = watch('date_of_birth');
      if (currentDob && currentDob !== ocrData.date_of_birth) {
        mismatches.push({
          field: 'date_of_birth',
          current: currentDob,
          ocr: ocrData.date_of_birth
        });
      } else {
        setValue('date_of_birth', ocrData.date_of_birth);
      }
    }

    if (ocrData.father_name) {
      setValue('father_name', ocrData.father_name);
    }

    if (ocrData.mother_name) {
      setValue('mother_name', ocrData.mother_name);
    }

    setFieldMismatches(mismatches);
    
    if (mismatches.length > 0) {
      toast.warning(`Found ${mismatches.length} potential mismatches. Please review.`);
    }
  };

  // Handle school selection from Google Maps
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        setSelectedSchoolFromMaps({
          name: place.name,
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          place_id: place.place_id
        });
        
        // Check if school exists in database
        checkExistingSchool(place);
      }
    }
  };

  // Check if school exists in database
  const checkExistingSchool = async (place) => {
    try {
      const response = await apiClient.get(`/guardian/schools`, { params: { search: place.name } });
      const schools = response?.data?.data || response?.data?.schools || [];
      const match = schools.find(s => s.name?.toLowerCase() === place.name?.toLowerCase());
      if (match) {
        setValue('school_id', match.id);
        toast.success('School found in database!');
      } else {
        // Suggest adding new school
        toast.info('School not found. Would you like to request adding this school?');
      }
    } catch (error) {
      console.error('Error checking school:', error);
    }
  };

  // Form submission
  const onFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Add form data
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });

      // Add files
      if (profilePhoto) {
        formData.append('profile_photo', profilePhoto);
      }
      
      if (birthCertificate) {
        formData.append('birth_certificate', birthCertificate);
      }

      // Add OCR data if available
      if (ocrData) {
        formData.append('ocr_data', JSON.stringify(ocrData));
      }

      await onSubmit(formData);
      toast.success('Athlete saved successfully!');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save athlete');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderSchoolInfoStep();
      case 3:
        return renderDocumentsStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Step 1: Basic Information
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      {/* Profile Photo */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
            {profilePhotoPreview ? (
              <img
                src={profilePhotoPreview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUser className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
          >
            <FaCamera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePhotoUpload}
            className="hidden"
          />
        </div>
        <p className="text-sm text-gray-600">Click to upload profile photo</p>
      </div>

      {/* Basic Information Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name (English) *
          </label>
          <input
            {...register('full_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter full name"
          />
          {errors.full_name && (
            <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name (Nepali)
          </label>
          <input
            {...register('full_name_nepali')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="नेपालीमा नाम"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            {...register('date_of_birth')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.date_of_birth && (
            <p className="text-red-500 text-sm mt-1">{errors.date_of_birth.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            {...register('gender')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Step 2: School Information
  const renderSchoolInfoStep = () => (
    <div className="space-y-6">
      {/* Google Maps School Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search School (Google Maps)
        </label>
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={GOOGLE_MAPS_LIBRARIES}>
          <Autocomplete
            onLoad={setAutocomplete}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              placeholder="Search for school using Google Maps..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </Autocomplete>
        </LoadScript>
      </div>

      {/* Database School Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or Select from Database *
        </label>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search schools..."
            value={schoolSearchTerm}
            onChange={(e) => setSchoolSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {schoolSearchTerm && (
          <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                onClick={() => {
                  setValue('school_id', school.id);
                  setSchoolSearchTerm(school.name);
                }}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
              >
                <div className="font-medium">{school.name}</div>
                <div className="text-sm text-gray-600">{school.school_code}</div>
                <div className="text-sm text-gray-500">{school.address}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Academic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade *
          </label>
          <select
            {...register('grade')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Grade</option>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          {errors.grade && (
            <p className="text-red-500 text-sm mt-1">{errors.grade.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section
          </label>
          <input
            {...register('section')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., A, B, C"
          />
        </div>
      </div>
    </div>
  );

  // Step 3: Documents
  const renderDocumentsStep = () => (
    <div className="space-y-6">
      {/* Birth Certificate Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Birth Certificate
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleBirthCertificateUpload}
            className="hidden"
            id="birth-certificate-input"
          />
          <label htmlFor="birth-certificate-input" className="cursor-pointer">
            <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Click to upload birth certificate</p>
            <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
          </label>
        </div>

        {ocrProcessing && (
          <div className="flex items-center justify-center space-x-2 mt-4 text-blue-600">
            <FaSpinner className="animate-spin" />
            <span>Processing document with OCR...</span>
          </div>
        )}

        {fieldMismatches.length > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FaExclamationTriangle className="text-yellow-600" />
              <span className="font-medium text-yellow-800">Field Mismatches Detected</span>
            </div>
            {fieldMismatches.map((mismatch, index) => (
              <div key={index} className="mb-2 p-2 bg-white rounded border">
                <div className="font-medium">{mismatch.field}</div>
                <div className="text-sm text-gray-600">
                  Current: {mismatch.current}
                </div>
                <div className="text-sm text-gray-600">
                  OCR: {mismatch.ocr}
                </div>
                <button
                  type="button"
                  onClick={() => setValue(mismatch.field, mismatch.ocr)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Use OCR Value
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Step 4: Review
  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Review Athlete Information</h3>
        {/* Review content will be added here */}
        <div className="text-center text-gray-600">
          Please review all information before submitting...
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6"
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < currentStep ? <FaCheck /> : step}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={currentStep === 1 ? onCancel : prevStep}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Athlete</span>
              )}
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default EnhancedAthleteForm;
