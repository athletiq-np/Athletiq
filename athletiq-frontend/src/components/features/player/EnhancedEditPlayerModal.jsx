import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaUser, FaEdit, FaExclamationTriangle, FaSpinner, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { adminApi } from '@/api/adminApi';

// Enhanced validation schema - based on Django model fields
const VALIDATION_SCHEMA = {
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
  // Note: relationship_to_player, allergies, medical_conditions are NOT in validation schema
  // because they are optional fields in Django model (blank=True, null=True)
};

// Field validation function
const validateField = (name, value, schema = VALIDATION_SCHEMA) => {
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

  // Length validation
  if (rules.minLength && value.length < rules.minLength) {
    return `${rules.label} must be at least ${rules.minLength} characters`;
  }
  if (rules.maxLength && value.length > rules.maxLength) {
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
  const baseInputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
    error 
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

// Main Enhanced Edit Player Modal
const EnhancedEditPlayerModal = ({ isOpen, playerId, onClose, onUpdated, schools = [] }) => {
  const [loading, setLoading] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [player, setPlayer] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Load player data
  useEffect(() => {
    if (isOpen && playerId) {
      loadPlayerData();
    }
  }, [isOpen, playerId]);

  const loadPlayerData = async () => {
    setLoadingPlayer(true);
    try {
      // Fetch player data from API
      const response = await adminApi.getAthletes({ limit: 1000 });
      const playerData = response.results?.find(p => p.id === playerId) || response.data?.find(p => p.id === playerId);
      
      if (!playerData) {
        throw new Error('Player not found');
      }

      setPlayer(playerData);
      
      // Initialize form data
      setFormData({
        full_name: playerData.full_name || '',
        full_name_nepali: playerData.full_name_nepali || '',
        gender: playerData.gender || 'Male',
        date_of_birth: playerData.date_of_birth ? playerData.date_of_birth.split('T')[0] : '',
        nationality: playerData.nationality || 'Nepali',
        citizenship_no: playerData.citizenship_no || '',
        school_id: playerData.school_id || playerData.school?.id || playerData.school?.school_id || '',
        grade: playerData.grade || '',
        section: playerData.section || '',
        address: playerData.address || '',
        province: playerData.province || '',
        district: playerData.district || '',
        municipality_or_rural_municipality: playerData.municipality_or_rural_municipality || '',
        ward_no: playerData.ward_no || '',
        guardian_name: playerData.guardian_name || '',
        relationship_to_player: playerData.relationship_to_player || '',
        guardian_phone: playerData.guardian_phone || '',
        guardian_email: playerData.guardian_email || '',
        height_cm: playerData.height_cm || '',
        weight_kg: playerData.weight_kg || '',
        blood_group: playerData.blood_group || '',
        primary_sport: playerData.primary_sport || '',
        father_name: playerData.father_name || '',
        mother_name: playerData.mother_name || '',
        medical_conditions: playerData.medical_conditions || '',
        allergies: playerData.allergies || '',
        emergency_contact: playerData.emergency_contact || '',
        medical_notes: playerData.medical_notes || ''
      });
      
      // Clear any previous errors and touched state
      setErrors({});
      setTouched({});
    } catch (error) {
      console.error('Error loading player:', error);
      toast.error('Failed to load player data');
      onClose();
    } finally {
      setLoadingPlayer(false);
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
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    const fieldsToValidate = Object.keys(VALIDATION_SCHEMA);
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Clear any errors for fields not in validation schema
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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
      await adminApi.updateAthlete(playerId, cleanedData);
      
      toast.success('Player updated successfully!');
      onUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating player:', error);
      
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
          toast.error(apiErrors.message || 'Failed to update player');
        }
      } else {
        toast.error('Failed to update player. Please try again.');
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
              <h2 className="text-xl font-bold">Edit Player</h2>
              {player && (
                <p className="text-blue-100 text-sm">
                  {player.full_name} ({player.athlete_id})
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
        {loadingPlayer ? (
          <div className="p-8 text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p>Loading player data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="p-6 space-y-8">
              {/* Validation Summary */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                  <div className="flex">
                    <FaExclamationTriangle className="text-red-400 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">
                        Please fix the following errors:
                      </h3>
                      <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                        {Object.entries(errors).map(([field, error]) => (
                          <li key={field}>
                            <strong>{VALIDATION_SCHEMA[field]?.label || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {error}
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
                    label="Relationship to Player"
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
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
              <div className="text-sm text-gray-600">
                {Object.keys(errors).length > 0 ? (
                  <span className="text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''} found
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
                  disabled={loading || Object.keys(errors).length > 0}
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
                      Update Player
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

export default EnhancedEditPlayerModal;