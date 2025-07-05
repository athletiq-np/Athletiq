// src/utils/validation.js

/**
 * Frontend validation utilities
 */

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (matches backend requirements)
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Phone number validation
export const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Name validation
export const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s]+$/;
  return nameRegex.test(name) && name.trim().length >= 2 && name.trim().length <= 100;
};

// Date of birth validation
export const validateDateOfBirth = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const age = now.getFullYear() - date.getFullYear();
  
  return {
    isValid: age >= 5 && age <= 25 && date < now,
    age
  };
};

// School name validation
export const validateSchoolName = (name) => {
  return name.trim().length >= 2 && name.trim().length <= 200;
};

// Address validation
export const validateAddress = (address) => {
  return address.trim().length >= 5 && address.trim().length <= 500;
};

// Tournament name validation
export const validateTournamentName = (name) => {
  return name.trim().length >= 2 && name.trim().length <= 200;
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  } = options;

  const errors = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize HTML input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
};

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];
    const fieldErrors = [];

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      fieldErrors.push(`${rule.label || field} is required`);
    }

    // Skip other validations if field is empty and not required
    if (!value && !rule.required) return;

    // Email validation
    if (rule.type === 'email' && value && !validateEmail(value)) {
      fieldErrors.push('Please enter a valid email address');
    }

    // Password validation
    if (rule.type === 'password' && value) {
      const passwordValidation = validatePassword(value);
      if (!passwordValidation.isValid) {
        fieldErrors.push(...passwordValidation.errors);
      }
    }

    // Phone validation
    if (rule.type === 'phone' && value && !validatePhone(value)) {
      fieldErrors.push('Please enter a valid phone number');
    }

    // Name validation
    if (rule.type === 'name' && value && !validateName(value)) {
      fieldErrors.push('Name can only contain letters and spaces (2-100 characters)');
    }

    // Date validation
    if (rule.type === 'date' && value) {
      const dateValidation = validateDateOfBirth(value);
      if (!dateValidation.isValid) {
        fieldErrors.push('Please enter a valid date (age must be between 5-25 years)');
      }
    }

    // Min/Max length validation
    if (rule.minLength && value && value.toString().length < rule.minLength) {
      fieldErrors.push(`${rule.label || field} must be at least ${rule.minLength} characters`);
    }

    if (rule.maxLength && value && value.toString().length > rule.maxLength) {
      fieldErrors.push(`${rule.label || field} must not exceed ${rule.maxLength} characters`);
    }

    // Custom validation
    if (rule.custom && value) {
      const customResult = rule.custom(value, data);
      if (customResult !== true) {
        fieldErrors.push(customResult);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      isValid = false;
    }
  });

  return {
    isValid,
    errors
  };
};

// Real-time validation hook
export const useValidation = (initialData = {}, rules = {}) => {
  const [data, setData] = React.useState(initialData);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = React.useCallback((field, value) => {
    if (!rules[field]) return;

    const fieldRule = { [field]: rules[field] };
    const fieldData = { ...data, [field]: value };
    const validation = validateForm(fieldData, fieldRule);

    setErrors(prev => ({
      ...prev,
      [field]: validation.errors[field] || []
    }));
  }, [data, rules]);

  const handleChange = React.useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Validate if field has been touched
    if (touched[field]) {
      validateField(field, value);
    }
  }, [validateField, touched]);

  const handleBlur = React.useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, data[field]);
  }, [validateField, data]);

  const validateAll = React.useCallback(() => {
    const validation = validateForm(data, rules);
    setErrors(validation.errors);
    
    // Mark all fields as touched
    const allTouched = Object.keys(rules).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    return validation;
  }, [data, rules]);

  const reset = React.useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};
