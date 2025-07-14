import { useState, useCallback } from 'react';

// Custom hook for form validation
export const useFormValidation = (initialData = {}, validationRules = {}) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    for (const rule of rules) {
      const error = rule(value, data);
      if (error) return error;
    }
    return null;
  }, [validationRules, data]);

  const validateAllFields = useCallback(() => {
    const newErrors = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, data[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [data, validateField, validationRules]);

  const updateField = useCallback((fieldName, value) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  }, [errors]);

  const touchField = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate on blur
    const error = validateField(fieldName, data[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [data, validateField]);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  return {
    data,
    errors,
    touched,
    updateField,
    touchField,
    validateAllFields,
    resetForm,
    isValid: Object.keys(errors).length === 0
  };
};

// Validation rules
export const validationRules = {
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'This field is required';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },

  email: (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  date: (value) => {
    if (value && isNaN(Date.parse(value))) {
      return 'Please enter a valid date';
    }
    return null;
  },

  futureDate: (value) => {
    if (value && new Date(value) <= new Date()) {
      return 'Date must be in the future';
    }
    return null;
  },

  pastDate: (value) => {
    if (value && new Date(value) >= new Date()) {
      return 'Date must be in the past';
    }
    return null;
  },

  dateRange: (startField, endField) => (value, allData) => {
    if (value && allData[startField] && allData[endField]) {
      const start = new Date(allData[startField]);
      const end = new Date(allData[endField]);
      if (start >= end) {
        return 'End date must be after start date';
      }
    }
    return null;
  },

  arrayMinLength: (min) => (value) => {
    if (Array.isArray(value) && value.length < min) {
      return `Please select at least ${min} item${min > 1 ? 's' : ''}`;
    }
    return null;
  },

  arrayMaxLength: (max) => (value) => {
    if (Array.isArray(value) && value.length > max) {
      return `Please select no more than ${max} item${max > 1 ? 's' : ''}`;
    }
    return null;
  },

  numeric: (value) => {
    if (value && isNaN(Number(value))) {
      return 'Please enter a valid number';
    }
    return null;
  },

  min: (min) => (value) => {
    if (value && Number(value) < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },

  max: (max) => (value) => {
    if (value && Number(value) > max) {
      return `Must be no more than ${max}`;
    }
    return null;
  },

  url: (value) => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      return 'Please enter a valid URL';
    }
    return null;
  },

  phone: (value) => {
    if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  custom: (validator, message) => (value, allData) => {
    if (!validator(value, allData)) {
      return message;
    }
    return null;
  }
};

// Tournament-specific validation rules
export const tournamentValidationRules = {
  tournamentInfo: {
    name: [
      validationRules.required,
      validationRules.minLength(3),
      validationRules.maxLength(100)
    ],
    description: [
      validationRules.maxLength(500)
    ],
    startDate: [
      validationRules.required,
      validationRules.date,
      validationRules.futureDate
    ],
    endDate: [
      validationRules.required,
      validationRules.date,
      validationRules.dateRange('startDate', 'endDate')
    ],
    registrationDeadline: [
      validationRules.required,
      validationRules.date,
      validationRules.custom(
        (value, data) => {
          if (value && data.startDate) {
            return new Date(value) < new Date(data.startDate);
          }
          return true;
        },
        'Registration deadline must be before tournament start date'
      )
    ],
    venue: [
      validationRules.required,
      validationRules.minLength(3),
      validationRules.maxLength(200)
    ],
    maxTeamsPerSchool: [
      validationRules.required,
      validationRules.numeric,
      validationRules.min(1),
      validationRules.max(10)
    ]
  },

  tournamentSports: {
    selectedSports: [
      validationRules.arrayMinLength(1),
      validationRules.arrayMaxLength(20)
    ]
  },

  tournamentConfig: {
    format: [
      validationRules.required,
      validationRules.custom(
        (value) => ['knockout', 'league', 'round-robin'].includes(value),
        'Please select a valid tournament format'
      )
    ],
    ageCategories: [
      validationRules.arrayMinLength(1)
    ]
  }
};

// Error display component
export const ErrorMessage = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`text-red-600 text-sm mt-1 ${className}`}>
      {error}
    </div>
  );
};

// Field wrapper component with error handling
export const FieldWrapper = ({ 
  children, 
  error, 
  touched, 
  label, 
  required = false,
  className = '' 
}) => {
  const hasError = touched && error;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={hasError ? 'border-red-300' : ''}>
        {children}
      </div>
      <ErrorMessage error={hasError ? error : null} />
    </div>
  );
};

// Form validation summary
export const ValidationSummary = ({ errors, touched }) => {
  const visibleErrors = Object.keys(errors)
    .filter(key => touched[key] && errors[key])
    .map(key => errors[key]);

  if (visibleErrors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <h3 className="text-sm font-medium text-red-800 mb-2">
        Please fix the following errors:
      </h3>
      <ul className="text-sm text-red-700 space-y-1">
        {visibleErrors.map((error, index) => (
          <li key={index} className="flex items-start">
            <span className="text-red-500 mr-2">•</span>
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
};
