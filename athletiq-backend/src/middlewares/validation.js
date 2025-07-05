// src/middlewares/validation.js
const { body, validationResult, param } = require('express-validator');

/**
 * Middleware to check validation results and return errors
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const validateUserRegistration = [
  body('full_name')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  validateRequest
];

/**
 * Validation rules for user login
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validateRequest
];

/**
 * Validation rules for player registration
 */
const validatePlayerRegistration = [
  body('full_name')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  
  body('date_of_birth')
    .isDate()
    .withMessage('Valid date of birth is required')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      if (age < 5 || age > 25) {
        throw new Error('Player age must be between 5 and 25 years');
      }
      return true;
    }),
  
  body('school_id')
    .isInt({ min: 1 })
    .withMessage('Valid school ID is required'),
  
  validateRequest
];

/**
 * Validation rules for school registration
 */
const validateSchoolRegistration = [
  body('name')
    .notEmpty()
    .withMessage('School name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('School name must be between 2 and 200 characters'),
  
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  
  body('admin_name')
    .notEmpty()
    .withMessage('Admin name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Admin name must be between 2 and 100 characters'),
  
  body('admin_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid admin email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Phone number can only contain digits, spaces, hyphens, plus signs, and parentheses'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid school email is required'),
  
  validateRequest
];

/**
 * Validation rules for tournament creation
 */
const validateTournamentCreation = [
  body('name')
    .notEmpty()
    .withMessage('Tournament name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Tournament name must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('level')
    .optional()
    .isIn(['District', 'Province', 'National', 'International'])
    .withMessage('Level must be one of: District, Province, National, International'),
  
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.start_date && value) {
        const startDate = new Date(req.body.start_date);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  
  validateRequest
];

/**
 * Sanitize HTML input to prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  const escapeHtml = (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = escapeHtml(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

/**
 * Tournament validation rules
 */
const validateTournament = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tournament name must be between 3 and 100 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
    .escape(),
  body('level')
    .optional()
    .isIn(['school', 'district', 'provincial', 'national', 'international'])
    .withMessage('Invalid tournament level'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format'),
  body('logo_url')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL'),
  body('sports_config')
    .optional()
    .isArray()
    .withMessage('Sports config must be an array'),
  validateRequest
];

const validateTournamentId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Tournament ID must be a positive integer'),
  validateRequest
];

module.exports = {
  validateRequest,
  validateUserRegistration,
  validateUserLogin,
  validatePlayerRegistration,
  validateSchoolRegistration,
  validateTournamentCreation,
  validateTournament,
  validateTournamentId,
  sanitizeInput
};
