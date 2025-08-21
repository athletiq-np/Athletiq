const Joi = require('joi');
const { createLogger } = require('../utils/logger');

const logger = createLogger('guardian-validation-middleware');

// Guardian registration validation
const guardianRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number and one special character'
    }),
  fullName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  preferredLanguage: Joi.string().valid('en', 'np').default('en')
});

// Guardian login validation
const guardianLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// OTP verification validation
const otpVerificationSchema = Joi.object({
  contact: Joi.string().required(),
  otpCode: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  purpose: Joi.string().valid('signup', 'login', 'reset_password').required()
});

// Athlete registration validation
const athleteRegistrationSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  fullNameNepali: Joi.string().min(2).max(100).optional(),
  dateOfBirth: Joi.date().max('now').required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  gradeLevel: Joi.string().required(),
  section: Joi.string().optional(),
  rollNumber: Joi.string().optional(),
  schoolId: Joi.number().integer().required(),
  birthCertificateNumber: Joi.string().optional(),
  birthCertificateIssuedDistrict: Joi.string().optional(),
  citizenshipNumber: Joi.string().optional(),
  citizenshipIssuedDistrict: Joi.string().optional(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  heightCm: Joi.number().integer().min(50).max(250).optional(),
  weightKg: Joi.number().min(10).max(200).optional(),
  medicalConditions: Joi.string().max(1000).optional(),
  allergies: Joi.string().max(1000).optional(),
  emergencyMedicalInfo: Joi.string().max(1000).optional(),
  sportsInterests: Joi.array().items(Joi.string()).optional()
});

// School creation validation
const schoolCreationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  nameNepali: Joi.string().min(2).max(255).optional(),
  address: Joi.string().min(10).max(500).required(),
  addressNepali: Joi.string().min(10).max(500).optional(),
  district: Joi.string().required(),
  districtNepali: Joi.string().optional(),
  municipality: Joi.string().optional(),
  municipalityNepali: Joi.string().optional(),
  wardNumber: Joi.number().integer().min(1).max(35).optional(),
  phone: Joi.string().pattern(/^[0-9\-+\s()]+$/).optional(),
  email: Joi.string().email().optional(),
  level: Joi.string().valid('primary', 'secondary', 'higher_secondary').required(),
  type: Joi.string().valid('public', 'private', 'community').required(),
  principalName: Joi.string().optional(),
  establishedYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  websiteUrl: Joi.string().uri().optional()
});

// Profile update validation
const profileUpdateSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  emergencyContactName: Joi.string().min(2).max(100).optional(),
  emergencyContactPhone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  emergencyContactRelationship: Joi.string().max(100).optional(),
  preferredLanguage: Joi.string().valid('en', 'np').optional(),
  notificationPreferences: Joi.object({
    email: Joi.boolean().optional(),
    sms: Joi.boolean().optional(),
    push: Joi.boolean().optional()
  }).optional()
});

// Validation middleware function
const validateGuardianRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      logger.warn('Guardian validation failed', {
        endpoint: req.path,
        errors: errorDetails,
        body: req.body
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// File upload validation
const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      });
    }

    next();
  };
};

// Query parameter validation
const validateSearchQuery = (req, res, next) => {
  const schema = Joi.object({
    q: Joi.string().min(1).max(100).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    district: Joi.string().optional(),
    level: Joi.string().valid('primary', 'secondary', 'higher_secondary').optional(),
    type: Joi.string().valid('public', 'private', 'community').optional()
  });

  const { error, value } = schema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: error.details
    });
  }

  req.query = value;
  next();
};

module.exports = {
  validateGuardianRequest,
  validateFileUpload,
  validateSearchQuery,
  guardianSchemas: {
    guardianRegistration: guardianRegistrationSchema,
    guardianLogin: guardianLoginSchema,
    otpVerification: otpVerificationSchema,
    athleteRegistration: athleteRegistrationSchema,
    schoolCreation: schoolCreationSchema,
    profileUpdate: profileUpdateSchema
  }
};
