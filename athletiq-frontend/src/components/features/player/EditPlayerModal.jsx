import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaTimes, FaUser, FaEdit, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { adminApi } from '@/api/adminApi';

// FormField component moved outside to prevent re-creation on each render
const FormField = React.memo(({ 
  label, 
  name, 
  type = 'text', 
  required = false, 
  readonly = false,
  options = [], 
  placeholder = '', 
  rows = null,
  min = null,
  max = null,
  step = null,
  className = '',
  value,
  onChange,
  onBlur,
  hasError,
  validationRules
}) => {
  const isRequired = validationRules?.[name]?.required || required;
  
  const baseInputClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white transition-colors ${
    readonly 
      ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed'
      : hasError 
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
  } ${className}`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
        {readonly && <span className="text-gray-500 ml-1 text-xs">(Read-only)</span>}
      </label>
      
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={isRequired}
          disabled={readonly}
          className={baseInputClass}
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
          onBlur={onBlur}
          rows={rows || 2}
          required={isRequired}
          readOnly={readonly}
          className={baseInputClass}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={isRequired}
          readOnly={readonly}
          min={min}
          max={max}
          step={step}
          className={baseInputClass}
          placeholder={placeholder}
        />
      )}
      
      {hasError && (
        <div className="mt-1 flex items-center text-red-600 text-sm">
          <FaExclamationTriangle className="mr-1 h-3 w-3" />
          {hasError}
        </div>
      )}
    </div>
  );
});

// Field display names mapping - moved outside component to prevent recreation
const fieldDisplayNames = {
  full_name: 'Full Name',
  full_name_nepali: 'Full Name (Nepali)',
  athlete_id: 'Athlete ID',
  gender: 'Gender',
  date_of_birth: 'Date of Birth',
  nationality: 'Nationality',
  citizenship_no: 'Citizenship Number',
  school_id: 'School',
  grade: 'Grade',
  section: 'Section',
  address: 'Address',
  province: 'Province',
  district: 'District',
  municipality_or_rural_municipality: 'Municipality/Rural Municipality',
  ward_no: 'Ward Number',
  guardian_name: 'Guardian Name',
  relationship_to_player: 'Relationship to Player',
  guardian_phone: 'Guardian Phone',
  guardian_email: 'Guardian Email',
  height_cm: 'Height (cm)',
  weight_kg: 'Weight (kg)',
  blood_group: 'Blood Group',
  primary_sport: 'Primary Sport',
  father_name: "Father's Name",
  mother_name: "Mother's Name",
  medical_conditions: 'Medical Conditions',
  allergies: 'Allergies',
  emergency_contact: 'Emergency Contact',
  medical_notes: 'Medical Notes'
};

// Validation rules - moved outside component to prevent recreation
const validationRules = {
  full_name: { required: true, minLength: 2, maxLength: 100 },
  gender: { required: true },
  date_of_birth: { required: true, type: 'date' },
  school_id: { required: true },
  guardian_phone: { type: 'phone', pattern: /^[0-9+\-\s()]+$/ },
  guardian_email: { type: 'email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  height_cm: { type: 'number', min: 50, max: 250 },
  weight_kg: { type: 'number', min: 10, max: 200 },
  citizenship_no: { pattern: /^[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{5}$/ }
};

const EditPlayerModal = ({ isOpen, onClose, onSubmit, onUpdated, player, schools = [] }) => {
  // Early return if modal shouldn't render
  if (!isOpen || !player) {
    return null;
  }

  const [formData, setFormData] = useState({
    // Basic Information
    full_name: '',
    full_name_nepali: '',
    athlete_id: '',
    gender: 'Male',
    date_of_birth: '',
    nationality: 'Nepali',
    citizenship_no: '',
    
    // School Information
    school_id: '',
    grade: '',
    section: '',
    
    // Address Information
    address: '',
    province: '',
    district: '',
    municipality_or_rural_municipality: '',
    ward_no: '',
    
    // Guardian Information
    guardian_name: '',
    relationship_to_player: '',
    guardian_phone: '',
    guardian_email: '',
    
    // Physical Information
    height_cm: '',
    weight_kg: '',
    blood_group: '',
    
    // Sports Information
    primary_sport: '',
    registered_sports: [],
    
    // Family Information
    father_name: '',
    mother_name: '',
    
    // Medical Information
    medical_conditions: '',
    allergies: '',
    emergency_contact: '',
    medical_notes: '',
    
    // Status Information
    verification_status: 'pending'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (player) {
      setFormData({
        // Basic Information
        full_name: player.full_name || player.name || '',
        full_name_nepali: player.full_name_nepali || '',
        athlete_id: player.athlete_id || player.id || '',
        gender: player.gender || 'Male',
        date_of_birth: player.date_of_birth ? player.date_of_birth.split('T')[0] : '',
        nationality: player.nationality || 'Nepali',
        citizenship_no: player.citizenship_no || '',
        
        // School Information
        school_id: player.school_id || player.school?.id || player.school?.school_id || '',
        grade: player.grade || '',
        section: player.section || '',
        
        // Address Information
        address: player.address || '',
        province: player.province || '',
        district: player.district || '',
        municipality_or_rural_municipality: player.municipality_or_rural_municipality || '',
        ward_no: player.ward_no || '',
        
        // Guardian Information
        guardian_name: player.guardian_name || '',
        relationship_to_player: player.relationship_to_player || '',
        guardian_phone: player.guardian_phone || '',
        guardian_email: player.guardian_email || '',
        
        // Physical Information
        height_cm: player.height_cm ? String(player.height_cm) : '',
        weight_kg: player.weight_kg ? String(player.weight_kg) : '',
        blood_group: player.blood_group || '',
        
        // Sports Information
        primary_sport: player.primary_sport || '',
        registered_sports: player.registered_sports || [],
        
        // Family Information
        father_name: player.father_name || '',
        mother_name: player.mother_name || '',
        
        // Medical Information
        medical_conditions: player.medical_conditions || '',
        allergies: player.allergies || '',
        emergency_contact: player.emergency_contact || '',
        medical_notes: player.medical_notes || '',
        
        // Status Information
        verification_status: player.verification_status || 'pending'
      });
    }
  }, [player]); // Simplified dependency



  // Validate individual field - memoized to prevent re-creation
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    const displayName = fieldDisplayNames[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Required field validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      return `${displayName} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') return '';

    // Length validations
    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`;
    }

    // Number validations
    if (rules.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return 'Must be a valid number';
      if (rules.min && numValue < rules.min) return `Must be at least ${rules.min}`;
      if (rules.max && numValue > rules.max) return `Must be no more than ${rules.max}`;
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

    // Pattern validations
    if (rules.pattern && !rules.pattern.test(value)) {
      if (rules.type === 'email') return 'Please enter a valid email address';
      if (rules.type === 'phone') return 'Please enter a valid phone number';
      if (name === 'citizenship_no') return 'Format: XX-XX-XX-XXXXX';
      return 'Invalid format';
    }

    return '';
  }, [validationRules, fieldDisplayNames]);

  // Validate all fields - memoized to prevent re-creation
  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateField, formData]); // Include formData dependency for proper validation

  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    
    let processedValue = value;
    
    if (type === 'number') {
      if (value === '') {
        processedValue = '';
      } else {
        processedValue = value;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, [validateField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('EditPlayerModal handleSubmit called');
    
    // Validate form before submission
    if (!validateForm()) {
      console.log('Form validation failed');
      toast.error('Please fix the errors in the form before submitting');
      return;
    }

    console.log('Form validation passed, submitting...');
    setLoading(true);
    try {
      // Prepare and validate data before sending
      const cleanedData = prepareDataForSubmission(formData);
      console.log('Cleaned data for submission:', cleanedData);
      
      // Use adminApi to update the player
      console.log('Updating player with ID:', player.id);
      await adminApi.updateAthlete(player.id, cleanedData);
      
      toast.success('Player updated successfully!');
      
      // Call the appropriate callback
      if (onSubmit) {
        await onSubmit(player.id, cleanedData);
      }
      if (onUpdated) {
        onUpdated();
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating player:', error);
      
      // Parse Django validation errors
      let errorMessage = 'Failed to update player. Please try again.';
      const newErrors = {};
      
      console.log('Error response:', error.response);
      console.log('Error data:', error.response?.data);
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        // Handle Django REST framework validation errors
        if (typeof responseData === 'object' && !responseData.message && !responseData.success) {
          Object.keys(responseData).forEach(field => {
            if (Array.isArray(responseData[field])) {
              newErrors[field] = responseData[field][0];
            } else if (typeof responseData[field] === 'string') {
              newErrors[field] = responseData[field];
            }
          });
          
          if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            errorMessage = 'Please fix the highlighted errors';
          }
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
      } else if (error.message) {
        // Check for specific field validation errors
        if (error.message.includes('full_name')) {
          errorMessage = 'Full name is required and must be at least 2 characters';
          newErrors.full_name = 'Full name is required';
        } else if (error.message.includes('height_cm')) {
          errorMessage = 'Please enter a valid height in centimeters (or leave empty)';
        } else if (error.message.includes('weight_kg')) {
          errorMessage = 'Please enter a valid weight in kilograms (or leave empty)';
        } else if (error.message.includes('school_id')) {
          errorMessage = 'Please select a valid school';
          newErrors.school_id = 'Please select a valid school';
        } else if (error.message.includes('date_of_birth')) {
          errorMessage = 'Please enter a valid date of birth';
          newErrors.date_of_birth = 'Please enter a valid date of birth';
        } else {
          errorMessage = error.message;
        }
        
        if (Object.keys(newErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...newErrors }));
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Function to clean and validate data before submission
  const prepareDataForSubmission = (data) => {
    const cleaned = { ...data };
    
    // Convert numeric fields - send null if empty, otherwise convert to number
    const numericFields = ['height_cm', 'weight_kg'];
    numericFields.forEach(field => {
      if (cleaned[field] === '' || cleaned[field] === null || cleaned[field] === undefined) {
        cleaned[field] = null;
      } else {
        const numValue = parseFloat(cleaned[field]);
        cleaned[field] = isNaN(numValue) ? null : numValue;
      }
    });
    
    // Convert integer fields
    const integerFields = ['school_id'];
    integerFields.forEach(field => {
      if (cleaned[field] === '' || cleaned[field] === null || cleaned[field] === undefined) {
        cleaned[field] = null;
      } else {
        const intValue = parseInt(cleaned[field]);
        cleaned[field] = isNaN(intValue) ? null : intValue;
      }
    });
    
    // Clean string fields - convert empty strings to null for optional fields
    const optionalStringFields = [
      'full_name_nepali', 'citizenship_no', 'grade', 'section', 'address', 
      'province', 'district', 'municipality_or_rural_municipality', 'ward_no',
      'guardian_name', 'relationship_to_player', 'guardian_phone', 'guardian_email',
      'blood_group', 'primary_sport', 'father_name', 'mother_name',
      'medical_conditions', 'allergies', 'emergency_contact', 'medical_notes'
    ];
    
    optionalStringFields.forEach(field => {
      if (cleaned[field] === '') {
        cleaned[field] = null;
      }
    });
    
    // Ensure required fields are not empty
    const requiredFields = ['full_name', 'gender', 'date_of_birth'];
    requiredFields.forEach(field => {
      if (!cleaned[field] || cleaned[field].trim() === '') {
        const displayName = fieldDisplayNames[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        throw new Error(`${displayName} is required`);
      }
    });
    
    // Remove athlete_id from the data since it's read-only and shouldn't be updated
    delete cleaned.athlete_id;
    
    // Validate school_id is provided
    if (!cleaned.school_id) {
      throw new Error('School selection is required');
    }
    
    console.log('Cleaned data for submission:', cleaned);
    return cleaned;
  };



  // Helper function to create FormField with common props
  const createFormField = (props) => (
    <FormField
      {...props}
      value={formData[props.name]}
      onChange={handleChange}
      onBlur={handleBlur}
      hasError={errors[props.name]}
      validationRules={validationRules}
    />
  );





  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaEdit className="mr-2 text-blue-500" />
            Edit Player
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Form Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Please fix the following errors:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>
                        <strong>{fieldDisplayNames[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaUser className="mr-2 text-blue-500" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {createFormField({
                label: "Full Name",
                name: "full_name",
                placeholder: "Enter player's full name",
                required: true
              })}

              {createFormField({
                label: "Full Name (Nepali)",
                name: "full_name_nepali",
                placeholder: "नेपालीमा नाम"
              })}

              {createFormField({
                label: "Athlete ID",
                name: "athlete_id",
                placeholder: "Auto-generated athlete ID",
                readonly: true
              })}

              {createFormField({
                label: "Date of Birth",
                name: "date_of_birth",
                type: "date",
                required: true
              })}

              {createFormField({
                label: "Gender",
                name: "gender",
                type: "select",
                required: true,
                options: [
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' }
                ]
              })}

              {createFormField({
                label: "Nationality",
                name: "nationality",
                placeholder: "Nationality"
              })}

              {createFormField({
                label: "Citizenship Number",
                name: "citizenship_no",
                placeholder: "XX-XX-XX-XXXXX"
              })}
            </div>
          </div>

          {/* School Information Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              School Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {createFormField({
                label: "School",
                name: "school_id",
                type: "select",
                required: true,
                options: [
                  { value: '', label: 'Select School' },
                  ...schools.map(school => ({
                    value: school.id || school.school_id,
                    label: `${school.name} (${school.school_code || school.code || school.id || school.school_id})`
                  }))
                ]
              })}

              {createFormField({
                label: "Grade",
                name: "grade",
                placeholder: "Grade/Class"
              })}

              {createFormField({
                label: "Section",
                name: "section",
                placeholder: "Section"
              })}
            </div>
          </div>

          {/* Address Information Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                {createFormField({
                  label: "Address",
                  name: "address",
                  type: "textarea",
                  rows: 2,
                  placeholder: "Complete address"
                })}
              </div>

              {createFormField({
                label: "Province",
                name: "province",
                placeholder: "Province"
              })}

              {createFormField({
                label: "District",
                name: "district",
                placeholder: "District"
              })}

              {createFormField({
                label: "Municipality/Rural Municipality",
                name: "municipality_or_rural_municipality",
                placeholder: "Municipality/Rural Municipality"
              })}

              {createFormField({
                label: "Ward Number",
                name: "ward_no",
                placeholder: "Ward No."
              })}
            </div>
          </div>

          {/* Guardian Information Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {createFormField({
                label: "Guardian Name",
                name: "guardian_name",
                placeholder: "Guardian's full name"
              })}

              {createFormField({
                label: "Relationship to Player",
                name: "relationship_to_player",
                type: "select",
                options: [
                  { value: '', label: 'Select Relationship' },
                  { value: 'Father', label: 'Father' },
                  { value: 'Mother', label: 'Mother' },
                  { value: 'Guardian', label: 'Guardian' },
                  { value: 'Uncle', label: 'Uncle' },
                  { value: 'Aunt', label: 'Aunt' },
                  { value: 'Grandfather', label: 'Grandfather' },
                  { value: 'Grandmother', label: 'Grandmother' },
                  { value: 'Other', label: 'Other' }
                ]
              })}

              {createFormField({
                label: "Guardian Phone",
                name: "guardian_phone",
                type: "tel",
                placeholder: "Guardian's phone number"
              })}

              {createFormField({
                label: "Guardian Email",
                name: "guardian_email",
                type: "email",
                placeholder: "guardian@example.com"
              })}
            </div>
          </div>

          {/* Physical Information Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Physical Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {createFormField({
                label: "Height (cm)",
                name: "height_cm",
                type: "number",
                min: 50,
                max: 250,
                placeholder: "Height in cm"
              })}

              {createFormField({
                label: "Weight (kg)",
                name: "weight_kg",
                type: "number",
                min: 10,
                max: 200,
                step: 0.1,
                placeholder: "Weight in kg"
              })}

              {createFormField({
                label: "Blood Group",
                name: "blood_group",
                type: "select",
                options: [
                  { value: '', label: 'Select Blood Group' },
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' }
                ]
              })}
            </div>
          </div>

          {/* Sports Information Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sports Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {createFormField({
                label: "Primary Sport",
                name: "primary_sport",
                placeholder: "e.g., Football, Basketball, Cricket"
              })}
            </div>
          </div>

          {/* Family Information Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Family Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {createFormField({
                label: "Father's Name",
                name: "father_name",
                placeholder: "Father's full name"
              })}

              {createFormField({
                label: "Mother's Name",
                name: "mother_name",
                placeholder: "Mother's full name"
              })}
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Medical Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {createFormField({
                label: "Medical Conditions",
                name: "medical_conditions",
                type: "textarea",
                rows: 2,
                placeholder: "Any medical conditions or health issues"
              })}

              {createFormField({
                label: "Allergies",
                name: "allergies",
                type: "textarea",
                rows: 2,
                placeholder: "Any known allergies"
              })}

              {createFormField({
                label: "Emergency Contact",
                name: "emergency_contact",
                placeholder: "Emergency contact person and phone"
              })}

              {createFormField({
                label: "Medical Notes",
                name: "medical_notes",
                type: "textarea",
                rows: 2,
                placeholder: "Additional medical notes or instructions"
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {Object.keys(errors).length > 0 ? (
                <span className="text-red-600 flex items-center">
                  <FaExclamationTriangle className="mr-1 h-3 w-3" />
                  {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''} found
                </span>
              ) : (
                <span className="text-green-600">Form is valid</span>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Player'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

EditPlayerModal.displayName = 'EditPlayerModal';

export default EditPlayerModal;
