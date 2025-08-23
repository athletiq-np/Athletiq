import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import apiClient from '../../../api/apiClient';

// Validation schema
const athleteSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  gender: yup.string().oneOf(['Male', 'Female'], 'Please select a valid gender').required('Gender is required'),
  grade: yup.string().required('Grade is required'),
  school: yup.string().required('School is required'),
  guardianRelationship: yup.string().required('Relationship is required')
});

const AthleteForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [schools, setSchools] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthCertificateFile, setBirthCertificateFile] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrData, setOcrData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: yupResolver(athleteSchema),
    defaultValues: initialData || {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      grade: '',
      school: '',
      guardianRelationship: ''
    }
  });

  // Set initial data when initialData prop changes
  useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach(key => {
        setValue(key, initialData[key]);
      });
    }
  }, [initialData, setValue]);

  // Load schools on component mount
  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const response = await apiClient.get('/api/guardian/schools');
      setSchools(response.data.schools || []);
    } catch (error) {
      console.error('Error loading schools:', error);
      setSchools([
        'Kathmandu Model School',
        'Budhanilkantha School',
        'St. Xavier\'s School',
        'Modern Indian School',
        'Little Angels School'
      ]);
    }
  };

  // Handle birth certificate file upload
  const handleBirthCertificateUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setBirthCertificateFile(file);
    
    // Process with OCR if it's an image
    if (file.type.startsWith('image/')) {
      await processBirthCertificateOCR(file);
    }
  };

  // Process birth certificate with OCR
  const processBirthCertificateOCR = async (file) => {
    try {
      setOcrProcessing(true);
      toast.info('Processing birth certificate with AI...');

      const formData = new FormData();
      formData.append('birthCertificate', file);

      const response = await apiClient.post('/api/guardian/process-birth-certificate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success && response.data.extractedData) {
        const { extractedData } = response.data;
        setOcrData(extractedData);

        // Auto-fill form with extracted data
        if (extractedData.firstName) {
          setValue('firstName', extractedData.firstName);
        }
        if (extractedData.lastName) {
          setValue('lastName', extractedData.lastName);
        }
        if (extractedData.dateOfBirth) {
          setValue('dateOfBirth', extractedData.dateOfBirth);
        }
        if (extractedData.gender) {
          setValue('gender', extractedData.gender);
        }

        toast.success('Birth certificate processed successfully! Form has been auto-filled.');
      } else {
        toast.warning('Could not extract data from birth certificate. Please fill the form manually.');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      toast.error('Failed to process birth certificate. Please fill the form manually.');
    } finally {
      setOcrProcessing(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Call the parent's onSubmit handler with the form data
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Fallback to original API call if no onSubmit prop
        const formData = new FormData();
        
        // Append form fields
        Object.keys(data).forEach(key => {
          if (data[key]) {
            formData.append(key, data[key]);
          }
        });

        // Append birth certificate if uploaded
        if (birthCertificateFile) {
          formData.append('birthCertificate', birthCertificateFile);
        }

        // Append OCR data if available
        if (ocrData) {
          formData.append('ocrData', JSON.stringify(ocrData));
        }

        // Add authentication header
        const token = localStorage.getItem('guardianToken');
        const response = await apiClient.post('/api/guardian/add-child', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          toast.success('Child registered successfully!');
          reset();
          setBirthCertificateFile(null);
          setOcrData(null);
        } else {
          toast.error(response.data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to register child';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    reset();
    setBirthCertificateFile(null);
    setOcrData(null);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Register New Athlete</h2>
      
      {/* Birth Certificate Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Birth Certificate (Optional - AI will auto-fill form)
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleBirthCertificateUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={ocrProcessing}
        />
        {ocrProcessing && (
          <div className="mt-2 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-600">Processing with AI...</span>
          </div>
        )}
        {birthCertificateFile && (
          <p className="mt-2 text-sm text-green-600">
            File uploaded: {birthCertificateFile.name}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              {...register('firstName')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.firstName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              {...register('lastName')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.lastName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              {...register('dateOfBirth')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender *
            </label>
            <select
              {...register('gender')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.gender ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade/Class *
            </label>
            <select
              {...register('grade')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.grade ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select grade</option>
              <option value="Nursery">Nursery</option>
              <option value="LKG">LKG</option>
              <option value="UKG">UKG</option>
              <option value="1">Class 1</option>
              <option value="2">Class 2</option>
              <option value="3">Class 3</option>
              <option value="4">Class 4</option>
              <option value="5">Class 5</option>
              <option value="6">Class 6</option>
              <option value="7">Class 7</option>
              <option value="8">Class 8</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
            {errors.grade && (
              <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
            )}
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Relationship to Child *
            </label>
            <select
              {...register('guardianRelationship')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.guardianRelationship ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select relationship</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
              <option value="Uncle">Uncle</option>
              <option value="Aunt">Aunt</option>
              <option value="Grandfather">Grandfather</option>
              <option value="Grandmother">Grandmother</option>
              <option value="Other">Other</option>
            </select>
            {errors.guardianRelationship && (
              <p className="mt-1 text-sm text-red-600">{errors.guardianRelationship.message}</p>
            )}
          </div>
        </div>

        {/* School */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School *
          </label>
          <select
            {...register('school')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.school ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select school</option>
            {schools.map((school, index) => (
              <option key={index} value={school}>
                {school}
              </option>
            ))}
          </select>
          {errors.school && (
            <p className="mt-1 text-sm text-red-600">{errors.school.message}</p>
          )}
        </div>

        {/* OCR Data Display */}
        {ocrData && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-green-800 mb-2">
              AI Extracted Information:
            </h3>
            <div className="text-sm text-green-700">
              {ocrData.firstName && <p>First Name: {ocrData.firstName}</p>}
              {ocrData.lastName && <p>Last Name: {ocrData.lastName}</p>}
              {ocrData.dateOfBirth && <p>Date of Birth: {ocrData.dateOfBirth}</p>}
              {ocrData.gender && <p>Gender: {ocrData.gender}</p>}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || ocrProcessing}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Registering...
              </div>
            ) : (
              'Register Athlete'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AthleteForm;
