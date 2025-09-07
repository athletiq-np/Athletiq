import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaUser, FaEdit, FaExclamationTriangle, FaSpinner, FaCheck, FaUpload, FaImage, FaFileAlt, FaTrash, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { adminApi } from '@/api/adminApi';

// Enhanced validation schema - based on Django model fields
const ATHLETE_VALIDATION_SCHEMA = {
  // Required fields (no blank=True, null=True in Django model)
  full_name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    label: 'Full Name'
  },
  gender: {
    required: true,
    options: ['Male', 'Female', 'Other'],
    label: 'Gender'
  },
  date_of_birth: {
    required: true,
    type: 'date',
    label: 'Date of Birth'
  },
  school_id: {
    required: true,
    type: 'number',
    label: 'School'
  },

  // Optional fields (blank=True, null=True in Django model)
  guardian_phone: {
    pattern: /^[0-9+\-\s()]{10,15}$/,
    label: 'Guardian Phone'
  },
  guardian_email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    label: 'Guardian Email'
  },
  height_cm: {
    type: 'number',
    min: 50,
    max: 250,
    label: 'Height (cm)'
  },
  weight_kg: {
    type: 'number',
    min: 10,
    max: 200,
    label: 'Weight (kg)'
  },
  citizenship_no: {
    pattern: /^[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{5}$/,
    label: 'Citizenship Number'
  }
  // Note: relationship_to_athlete, allergies, medical_conditions are NOT in validation schema
  // because they are optional fields in Django model (blank=True, null=True)
};

// Field validation function
const validateField = (name, value, schema = ATHLETE_VALIDATION_SCHEMA) => {
  const rules = schema[name];

  // If field is not in validation schema, it's optional and doesn't need validation
  if (!rules) return null;

  console.log(`Validating field: ${name}, value: "${value}", rules:`, rules);

  // Required validation
  if (rules.required && (!value || value.toString().trim() === '')) {
    console.log(`Required validation failed for ${name}`);
    return `${rules.label} is required`;
  }

  // Skip other validations if empty and not required
  if (!value || value.toString().trim() === '') return null;

  const trimmedValue = value.toString().trim();

  // Length validation
  if (rules.minLength && trimmedValue.length < rules.minLength) {
    console.log(`Length validation failed for ${name}: trimmed length ${trimmedValue.length} < required ${rules.minLength}`);
    return `${rules.label} must be at least ${rules.minLength} characters`;
  }
  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    console.log(`Length validation failed for ${name}: trimmed length ${trimmedValue.length} > max ${rules.maxLength}`);
    return `${rules.label} must be no more than ${rules.maxLength} characters`;
  }

  // Number validation
  if (rules.type === 'number') {
    const num = parseFloat(value);
    if (isNaN(num)) return `${rules.label} must be a valid number`;
    if (rules.min && num < rules.min) return `${rules.label} must be at least ${rules.min}`;
    if (rules.max && num > rules.max) return `${rules.label} must be no more than ${rules.max}`;
  }

  // Date validation
  if (rules.type === 'date') {
    const date = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    if (date > today) return 'Date cannot be in the future';
    if (age < 5) return 'Athlete must be at least 5 years old';
    if (age > 25) return 'Athlete must be under 25 years old';
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    if (name === 'guardian_email') return 'Please enter a valid email address';
    if (name === 'guardian_phone') return 'Please enter a valid phone number';
    if (name === 'citizenship_no') return 'Format: XX-XX-XX-XXXXX';
    return `${rules.label} format is invalid`;
  }

  // Options validation
  if (rules.options && !rules.options.includes(value)) {
    return `${rules.label} must be one of: ${rules.options.join(', ')}`;
  }

  console.log(`Validation passed for ${name}`);
  return null;
};

// File Upload Component
const FileUploadField = ({
  name,
  label,
  accept = "*/*",
  multiple = false,
  currentFiles = [],
  onFileSelect,
  onFileRemove,
  uploading = false,
  type = 'document' // 'image' or 'document'
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragOver to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    console.log('Drop event triggered:', e.dataTransfer.files);
    const files = Array.from(e.dataTransfer.files);
    console.log('Files from drop:', files);
    onFileSelect(files);
  };

  const handleFileInput = (e) => {
    console.log('File input change triggered:', e.target.files);
    const files = Array.from(e.target.files);
    console.log('Converted to array:', files);
    onFileSelect(files);
    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${dragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          id={`file-${name}`}
        />

        <div className="flex flex-col items-center space-y-2">
          {type === 'image' ? (
            <FaImage className="h-8 w-8 text-gray-400" />
          ) : (
            <FaFileAlt className="h-8 w-8 text-gray-400" />
          )}

          <div>
            <label
              htmlFor={`file-${name}`}
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              onClick={(e) => {
                // Fallback click handler
                console.log('Label clicked for:', name);
                const input = document.getElementById(`file-${name}`);
                if (input) {
                  input.click();
                }
              }}
            >
              Choose files
            </label>
            <span className="text-gray-500"> or drag and drop</span>
          </div>

          <p className="text-xs text-gray-500">
            {type === 'image'
              ? 'PNG, JPG, JPEG up to 5MB'
              : 'PDF, DOC, DOCX, JPG, PNG up to 10MB'
            }
          </p>
        </div>
      </div>

      {/* Current Files */}
      {currentFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Current Files:</p>
          <div className="space-y-2">
            {currentFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div className="flex items-center space-x-2">
                  {type === 'image' ? (
                    <FaImage className="h-4 w-4 text-blue-500" />
                  ) : (
                    <FaFileAlt className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-sm text-gray-700 truncate">
                    {file.name || file.originalName || `File ${index + 1}`}
                  </span>
                  {file.size && (
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {file.url && (
                    <button
                      type="button"
                      onClick={() => window.open(file.url, '_blank')}
                      className="text-blue-600 hover:text-blue-700"
                      title="View file"
                    >
                      <FaDownload className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onFileRemove(index)}
                    className="text-red-600 hover:text-red-700"
                    title="Remove file"
                  >
                    <FaTrash className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center space-x-2 text-blue-600">
          <FaSpinner className="animate-spin h-4 w-4" />
          <span className="text-sm">Uploading...</span>
        </div>
      )}
    </div>
  );
};

// Form field component
const FormField = ({
  name,
  label,
  type = 'text',
  required = false,
  options = [],
  value,
  onChange,
  error,
  ...props
}) => {
  const baseInputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${error
    ? 'border-red-500 focus:ring-red-500 bg-red-50'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }`;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={baseInputClass}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          className={baseInputClass}
          rows={3}
          {...props}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={baseInputClass}
          {...props}
        />
      )}

      {error && (
        <div className="flex items-center text-red-600 text-sm mt-1">
          <FaExclamationTriangle className="w-3 h-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

// Main Enhanced Edit Athlete Modal
const EditAthleteModal = ({ isOpen, athleteId, onClose, onUpdated, schools = [] }) => {
  const [loading, setLoading] = useState(false);
  const [loadingAthlete, setLoadingAthlete] = useState(false);
  const [athlete, setAthlete] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // File upload states
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [birthCertificateFile, setBirthCertificateFile] = useState(null);
  const [existingProfileImage, setExistingProfileImage] = useState(null);
  const [existingBirthCertificate, setExistingBirthCertificate] = useState(null);

  // Load athlete data
  useEffect(() => {
    if (isOpen && athleteId) {
      loadAthleteData();
    }
  }, [isOpen, athleteId]);

  const loadAthleteData = async () => {
    setLoadingAthlete(true);
    try {
      // Fetch athlete data from API
      const response = await adminApi.getAthletes({ limit: 1000 });
      const athleteData = response.results?.find(p => p.id === athleteId) || response.data?.find(p => p.id === athleteId);

      if (!athleteData) {
        throw new Error('Athlete not found');
      }

      setAthlete(athleteData);

      // Initialize form data
      setFormData({
        full_name: athleteData.full_name || '',
        full_name_nepali: athleteData.full_name_nepali || '',
        gender: athleteData.gender || 'Male',
        date_of_birth: athleteData.date_of_birth ? athleteData.date_of_birth.split('T')[0] : '',
        nationality: athleteData.nationality || 'Nepali',
        citizenship_no: athleteData.citizenship_no || '',
        school_id: athleteData.school_id || athleteData.school?.id || athleteData.school?.school_id || '',
        grade: athleteData.grade || '',
        section: athleteData.section || '',
        address: athleteData.address || '',
        province: athleteData.province || '',
        district: athleteData.district || '',
        municipality_or_rural_municipality: athleteData.municipality_or_rural_municipality || '',
        ward_no: athleteData.ward_no || '',
        guardian_name: athleteData.guardian_name || '',
        relationship_to_player: athleteData.relationship_to_player || '',
        guardian_phone: athleteData.guardian_phone || '',
        guardian_email: athleteData.guardian_email || '',
        height_cm: athleteData.height_cm || '',
        weight_kg: athleteData.weight_kg || '',
        blood_group: athleteData.blood_group || '',
        primary_sport: athleteData.primary_sport || '',
        father_name: athleteData.father_name || '',
        mother_name: athleteData.mother_name || '',
        medical_conditions: athleteData.medical_conditions || '',
        allergies: athleteData.allergies || '',
        emergency_contact: athleteData.emergency_contact || '',
        medical_notes: athleteData.medical_notes || ''
      });

      // Clear any previous errors and touched state
      setErrors({});
      setTouched({});

      // Set existing files
      if (athleteData.profile_photo_url || athleteData.profile_image_url) {
        setExistingProfileImage({
          url: athleteData.profile_photo_url || athleteData.profile_image_url,
          name: 'Profile Photo'
        });
      } else {
        setExistingProfileImage(null);
      }

      if (athleteData.birth_certificate_url || athleteData.birth_certificate_file_url) {
        setExistingBirthCertificate({
          url: athleteData.birth_certificate_url || athleteData.birth_certificate_file_url,
          name: 'Birth Certificate'
        });
      } else {
        setExistingBirthCertificate(null);
      }

      // Clear new file selections
      setProfileImageFile(null);
      setBirthCertificateFile(null);
    } catch (error) {
      console.error('Error loading athlete:', error);
      toast.error('Failed to load athlete data');
      onClose();
    } finally {
      setLoadingAthlete(false);
    }
  };

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field
    const error = validateField(name, value);
    console.log(`Setting error for ${name}:`, error, `(type: ${typeof error})`);
    setErrors(prev => {
      const newErrors = { ...prev, [name]: error };
      console.log(`New error state:`, newErrors);
      return newErrors;
    });
  }, []);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    const fieldsToValidate = Object.keys(ATHLETE_VALIDATION_SCHEMA);

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      newErrors[field] = error; // Set to null if no error, or the error message if there is one
    });

    console.log('Form validation results:', newErrors);
    setErrors(newErrors);

    // Return true if no errors (all values are null)
    return Object.values(newErrors).every(error => !error);
  }, [formData]);

  // File upload handlers
  const handleProfileImageSelect = (files) => {
    console.log('Profile image selection triggered with files:', files);

    if (files.length === 0) {
      console.log('No files selected');
      return;
    }

    const file = files[0];
    console.log('Selected file:', file);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setProfileImageFile(file);
    toast.success('Profile image selected. It will be uploaded when you save the form.');
  };

  const handleProfileImageRemove = () => {
    setProfileImageFile(null);
    setExistingProfileImage(null);
    toast.success('Profile image removed');
  };

  const handleBirthCertificateSelect = (files) => {
    console.log('Birth certificate selection triggered with files:', files);

    if (files.length === 0) {
      console.log('No files selected');
      return;
    }

    const file = files[0];
    console.log('Selected file:', file);

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid document file (PDF, DOC, DOCX, JPG, PNG)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setBirthCertificateFile(file);
    toast.success('Birth certificate selected. It will be uploaded when you save the form.');
  };

  const handleBirthCertificateRemove = () => {
    setBirthCertificateFile(null);
    setExistingBirthCertificate(null);
    toast.success('Birth certificate removed');
  };

  // Prepare data for submission
  const prepareSubmissionData = (data) => {
    const cleaned = { ...data };

    // Convert school_id to integer
    if (cleaned.school_id) {
      cleaned.school_id = parseInt(cleaned.school_id, 10);
    }

    // Convert numeric fields
    ['height_cm', 'weight_kg'].forEach(field => {
      if (cleaned[field] === '' || cleaned[field] === null) {
        cleaned[field] = null;
      } else {
        const num = parseFloat(cleaned[field]);
        cleaned[field] = isNaN(num) ? null : num;
      }
    });

    // Convert empty strings to null for optional fields
    const optionalFields = [
      'full_name_nepali', 'citizenship_no', 'grade', 'section', 'address',
      'province', 'district', 'municipality_or_rural_municipality', 'ward_no',
      'guardian_name', 'relationship_to_player', 'guardian_phone', 'guardian_email',
      'blood_group', 'primary_sport', 'father_name', 'mother_name',
      'medical_conditions', 'allergies', 'emergency_contact', 'medical_notes'
    ];

    optionalFields.forEach(field => {
      if (cleaned[field] === '') {
        cleaned[field] = null;
      }
    });

    return cleaned;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form submission - Current formData:', formData);
    console.log('Form submission - Current errors before validation:', errors);

    // Check authentication status before proceeding
    const token = localStorage.getItem('athletiq_token');
    const userData = localStorage.getItem('athletiq_user');
    console.log('Authentication check:', {
      hasToken: !!token,
      hasUserData: !!userData,
      tokenLength: token ? token.length : 0
    });

    if (!token) {
      toast.error('You are not logged in. Please log in and try again.');
      return;
    }

    if (!validateForm()) {
      console.log('Form validation failed - Current errors:', errors);
      toast.error('Please fix the errors in the form');
      return;
    }

    console.log('Form validation passed');
    setLoading(true);
    try {
      const cleanedData = prepareSubmissionData(formData);
      console.log('Submitting cleaned data:', cleanedData);
      
      // Log selected files for debugging
      if (profileImageFile) {
        console.log('Profile image selected:', profileImageFile.name);
      }
      if (birthCertificateFile) {
        console.log('Birth certificate selected:', birthCertificateFile.name);
      }

      // Step 1: Update athlete data (JSON only)
      console.log('📝 Updating athlete data...');
      const updateResult = await adminApi.updateAthleteData(athleteId, cleanedData);
      console.log('✅ Athlete data updated successfully:', updateResult);
      
      // Step 2: Handle file uploads (parallel, non-blocking)
      const fileUploadResults = [];
      
      if (profileImageFile) {
        console.log('📷 Uploading profile image...');
        const profileFormData = new FormData();
        profileFormData.append('profile_photo', profileImageFile);
        
        fileUploadResults.push(
          adminApi.uploadAthleteProfileImage(athleteId, profileFormData)
            .then(result => ({ type: 'profile', success: true, result }))
            .catch(error => ({ type: 'profile', success: false, error: error.message }))
        );
      }
      
      if (birthCertificateFile) {
        console.log('📄 Uploading birth certificate...');
        const docFormData = new FormData();
        docFormData.append('document', birthCertificateFile);
        docFormData.append('document_type', 'birth_certificate');
        docFormData.append('title', 'Birth Certificate');
        docFormData.append('description', 'Birth certificate document');
        
        fileUploadResults.push(
          adminApi.uploadAthleteDocument(athleteId, docFormData)
            .then(result => ({ type: 'document', success: true, result }))
            .catch(error => ({ type: 'document', success: false, error: error.message }))
        );
      }
      
      // Step 3: Process file upload results
      if (fileUploadResults.length > 0) {
        console.log('📁 Processing file uploads...');
        const results = await Promise.allSettled(fileUploadResults);
        const uploadResults = results.map(r => r.value || r.reason);
        
        const failures = uploadResults.filter(r => !r.success);
        const successes = uploadResults.filter(r => r.success);
        
        console.log('📊 File upload results:', { successes: successes.length, failures: failures.length });
        
        if (failures.length > 0) {
          console.warn('⚠️ Some file uploads failed:', failures);
          const failedTypes = failures.map(f => f.type).join(', ');
          toast.warning(`Athlete data updated successfully, but ${failedTypes} upload(s) failed. Please try uploading the files again.`);
        } else {
          toast.success('Athlete data and files updated successfully!');
        }
      } else {
        toast.success('Athlete data updated successfully!');
      }
      
      console.log('🔄 Calling onUpdated...');
      onUpdated();
      console.log('🔄 Calling onClose...');
      onClose();
      console.log('✅ Success flow completed');
    } catch (error) {
      console.error('❌ Error updating athlete:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error.constructor.name);

      // Handle authentication errors specifically - only on actual 401 errors
      // TEMPORARILY DISABLED FOR DEBUGGING
      if (false && (error.response?.status === 401 || 
          (error.message.includes('session has expired') && error.message.includes('401')))) {
        console.log('Authentication error detected (401):', error.message);
        toast.error('Your session has expired. Please log in again.');
        // Clear invalid tokens
        localStorage.removeItem('athletiq_token');
        localStorage.removeItem('athletiq_refresh_token');
        localStorage.removeItem('athletiq_user');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      // Handle API validation errors
      if (error.response?.data) {
        const apiErrors = error.response.data;
        const newErrors = {};

        Object.keys(apiErrors).forEach(field => {
          if (Array.isArray(apiErrors[field])) {
            newErrors[field] = apiErrors[field][0];
          } else if (typeof apiErrors[field] === 'string') {
            newErrors[field] = apiErrors[field];
          }
        });

        if (Object.keys(newErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...newErrors }));
          toast.error('Please fix the highlighted errors');
        } else {
          toast.error(apiErrors.message || 'Failed to update athlete');
        }
      } else {
        toast.error(error.message || 'Failed to update athlete. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FaEdit className="mr-3 text-xl" />
            <div>
              <h2 className="text-xl font-bold">Edit Athlete</h2>
              {athlete && (
                <p className="text-blue-100 text-sm">
                  {athlete.full_name} ({athlete.athlete_id})
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Loading state */}
        {loadingAthlete ? (
          <div className="p-8 text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p>Loading athlete data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="p-6 space-y-8">
              {/* Validation Summary */}
              {Object.values(errors).some(error => error) && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                  <div className="flex">
                    <FaExclamationTriangle className="text-red-400 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">
                        Please fix the following errors:
                      </h3>
                      <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                        {Object.entries(errors).filter(([field, error]) => error).map(([field, error]) => (
                          <li key={field}>
                            <strong>{ATHLETE_VALIDATION_SCHEMA[field]?.label || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaUser className="mr-2 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="full_name"
                    label="Full Name"
                    required
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    error={errors.full_name}
                  />
                  <FormField
                    name="full_name_nepali"
                    label="Full Name (Nepali)"
                    value={formData.full_name_nepali || ''}
                    onChange={handleChange}
                    error={errors.full_name_nepali}
                  />
                  <FormField
                    name="gender"
                    label="Gender"
                    type="select"
                    required
                    value={formData.gender || ''}
                    onChange={handleChange}
                    error={errors.gender}
                    options={[
                      { value: '', label: 'Select Gender' },
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' }
                    ]}
                  />
                  <FormField
                    name="date_of_birth"
                    label="Date of Birth"
                    type="date"
                    required
                    value={formData.date_of_birth || ''}
                    onChange={handleChange}
                    error={errors.date_of_birth}
                  />
                  <FormField
                    name="nationality"
                    label="Nationality"
                    value={formData.nationality || ''}
                    onChange={handleChange}
                    error={errors.nationality}
                  />
                  <FormField
                    name="citizenship_no"
                    label="Citizenship Number"
                    placeholder="XX-XX-XX-XXXXX"
                    value={formData.citizenship_no || ''}
                    onChange={handleChange}
                    error={errors.citizenship_no}
                  />
                </div>
              </div>

              {/* School Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    name="school_id"
                    label="School"
                    type="select"
                    required
                    value={formData.school_id || ''}
                    onChange={handleChange}
                    error={errors.school_id}
                    options={[
                      { value: '', label: 'Select School' },
                      ...schools.map(school => ({
                        value: school.id || school.school_id,
                        label: `${school.name} (${school.school_code || school.id})`
                      }))
                    ]}
                  />
                  <FormField
                    name="grade"
                    label="Grade"
                    value={formData.grade || ''}
                    onChange={handleChange}
                    error={errors.grade}
                  />
                  <FormField
                    name="section"
                    label="Section"
                    value={formData.section || ''}
                    onChange={handleChange}
                    error={errors.section}
                  />
                </div>
              </div>

              {/* Guardian Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="guardian_name"
                    label="Guardian Name"
                    value={formData.guardian_name || ''}
                    onChange={handleChange}
                    error={errors.guardian_name}
                  />
                  <FormField
                    name="relationship_to_player"
                    label="Relationship to Athlete"
                    type="select"
                    value={formData.relationship_to_player || ''}
                    onChange={handleChange}
                    error={errors.relationship_to_player}
                    options={[
                      { value: '', label: 'Select Relationship' },
                      { value: 'Father', label: 'Father' },
                      { value: 'Mother', label: 'Mother' },
                      { value: 'Guardian', label: 'Guardian' },
                      { value: 'Uncle', label: 'Uncle' },
                      { value: 'Aunt', label: 'Aunt' },
                      { value: 'Other', label: 'Other' }
                    ]}
                  />
                  <FormField
                    name="guardian_phone"
                    label="Guardian Phone"
                    type="tel"
                    value={formData.guardian_phone || ''}
                    onChange={handleChange}
                    error={errors.guardian_phone}
                  />
                  <FormField
                    name="guardian_email"
                    label="Guardian Email"
                    type="email"
                    value={formData.guardian_email || ''}
                    onChange={handleChange}
                    error={errors.guardian_email}
                  />
                </div>
              </div>

              {/* Physical Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    name="height_cm"
                    label="Height (cm)"
                    type="number"
                    min="50"
                    max="250"
                    value={formData.height_cm || ''}
                    onChange={handleChange}
                    error={errors.height_cm}
                  />
                  <FormField
                    name="weight_kg"
                    label="Weight (kg)"
                    type="number"
                    min="10"
                    max="200"
                    step="0.1"
                    value={formData.weight_kg || ''}
                    onChange={handleChange}
                    error={errors.weight_kg}
                  />
                  <FormField
                    name="blood_group"
                    label="Blood Group"
                    type="select"
                    value={formData.blood_group || ''}
                    onChange={handleChange}
                    error={errors.blood_group}
                    options={[
                      { value: '', label: 'Select Blood Group' },
                      { value: 'A+', label: 'A+' },
                      { value: 'A-', label: 'A-' },
                      { value: 'B+', label: 'B+' },
                      { value: 'B-', label: 'B-' },
                      { value: 'O+', label: 'O+' },
                      { value: 'O-', label: 'O-' },
                      { value: 'AB+', label: 'AB+' },
                      { value: 'AB-', label: 'AB-' }
                    ]}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="primary_sport"
                    label="Primary Sport"
                    value={formData.primary_sport || ''}
                    onChange={handleChange}
                    error={errors.primary_sport}
                  />
                  <FormField
                    name="emergency_contact"
                    label="Emergency Contact"
                    value={formData.emergency_contact || ''}
                    onChange={handleChange}
                    error={errors.emergency_contact}
                  />
                  <FormField
                    name="father_name"
                    label="Father's Name"
                    value={formData.father_name || ''}
                    onChange={handleChange}
                    error={errors.father_name}
                  />
                  <FormField
                    name="mother_name"
                    label="Mother's Name"
                    value={formData.mother_name || ''}
                    onChange={handleChange}
                    error={errors.mother_name}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  <FormField
                    name="medical_conditions"
                    label="Medical Conditions"
                    type="textarea"
                    value={formData.medical_conditions || ''}
                    onChange={handleChange}
                    error={errors.medical_conditions}
                  />
                  <FormField
                    name="allergies"
                    label="Allergies"
                    type="textarea"
                    value={formData.allergies || ''}
                    onChange={handleChange}
                    error={errors.allergies}
                  />
                </div>
              </div>

              {/* Profile Image Upload */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaImage className="mr-2 text-blue-600" />
                  Profile Image
                </h3>

                <FileUploadField
                  name="profile_image"
                  label="Upload Profile Photo"
                  accept="image/*"
                  multiple={false}
                  type="image"
                  currentFiles={[
                    ...(existingProfileImage ? [existingProfileImage] : []),
                    ...(profileImageFile ? [{
                      name: profileImageFile.name,
                      size: profileImageFile.size,
                      url: URL.createObjectURL(profileImageFile),
                      isNew: true
                    }] : [])
                  ]}
                  onFileSelect={handleProfileImageSelect}
                  onFileRemove={handleProfileImageRemove}
                  uploading={false}
                />
                {(profileImageFile || existingProfileImage) && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ {profileImageFile ? 'New image selected' : 'Current image available'}
                  </div>
                )}
              </div>

              {/* Birth Certificate Upload */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaFileAlt className="mr-2 text-blue-600" />
                  Birth Certificate
                </h3>

                <FileUploadField
                  name="birth_certificate"
                  label="Upload Birth Certificate"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                  multiple={false}
                  type="document"
                  currentFiles={[
                    ...(existingBirthCertificate ? [existingBirthCertificate] : []),
                    ...(birthCertificateFile ? [{
                      name: birthCertificateFile.name,
                      size: birthCertificateFile.size,
                      url: URL.createObjectURL(birthCertificateFile),
                      isNew: true
                    }] : [])
                  ]}
                  onFileSelect={handleBirthCertificateSelect}
                  onFileRemove={handleBirthCertificateRemove}
                  uploading={false}
                />
                {(birthCertificateFile || existingBirthCertificate) && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ {birthCertificateFile ? 'New document selected' : 'Current document available'}
                  </div>
                )}
                <div className="mt-2 text-sm text-gray-600">
                  <p>• Upload birth certificate for verification</p>
                  <p>• Supported formats: PDF, DOC, DOCX, JPG, PNG</p>
                  <p>• Maximum file size: 10MB</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
              <div className="text-sm text-gray-600">
                {Object.values(errors).filter(error => error).length > 0 ? (
                  <span className="text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    {Object.values(errors).filter(error => error).length} error{Object.values(errors).filter(error => error).length !== 1 ? 's' : ''} found
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center">
                    <FaCheck className="mr-1" />
                    Form is valid
                  </span>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || Object.values(errors).some(error => error)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      Update Athlete
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditAthleteModal;