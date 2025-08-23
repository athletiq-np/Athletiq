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
  body('adminFullName')
    .notEmpty()
    .withMessage('Admin full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Admin full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Admin full name can only contain letters and spaces'),
  
  body('adminEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid admin email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('schoolName')
    .notEmpty()
    .withMessage('School name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('School name must be between 2 and 100 characters'),
  
  body('schoolCode')
    .notEmpty()
    .withMessage('School code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('School code must be between 2 and 20 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('School code can only contain letters and numbers'),
  
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
const validateAthleteRegistration = [
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
      const age = now.getFullYear() - date.getFullYear();        if (age < 5 || age > 25) {
        throw new Error('Athlete age must be between 5 and 25 years');
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
  body('sport')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sport must be between 1 and 50 characters'),
  body('tournament_type')
    .optional()
    .isIn(['school', 'district', 'provincial', 'national', 'international'])
    .withMessage('Invalid tournament type'),
  body('format')
    .optional()
    .isIn(['knockout', 'round_robin', 'league', 'swiss'])
    .withMessage('Invalid tournament format'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must be less than 200 characters'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format'),
  body('registration_deadline')
    .optional()
    .isISO8601()
    .withMessage('Registration deadline must be in ISO 8601 format'),
  body('max_teams')
    .optional()
    .isInt({ min: 2, max: 1000 })
    .withMessage('Max teams must be between 2 and 1000'),
  body('organizer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Organizer ID must be a positive integer'),
  body('organizer_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Organizer name must be less than 100 characters'),
  validateRequest
];

const validateTournamentId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Tournament ID must be a positive integer'),
  validateRequest
];

// Generic pagination & filtering validation (query params)
const validatePagination = [
  (req, res, next) => { // defaults
    if (req.query.page === undefined) req.query.page = '1';
    if (req.query.limit === undefined) req.query.limit = '25';
    next();
  },
  
  // page
  param('page').optional(), // placeholder to avoid express-validator warning (we validate via custom below)
  body('page').optional(), // ensure no body conflict
  // custom manual checks (simpler than mixing query() needing import)
  (req, res, next) => {
    const errors = [];
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    if (isNaN(page) || page < 1 || page > 10000) {
      errors.push({ msg: 'page must be an integer between 1 and 10000', param: 'page', location: 'query' });
    }
    if (isNaN(limit) || limit < 1 || limit > 200) {
      errors.push({ msg: 'limit must be an integer between 1 and 200', param: 'limit', location: 'query' });
    }
    if (req.query.status && !['scheduled','live','completed','cancelled','postponed'].includes(req.query.status)) {
      errors.push({ msg: 'status filter invalid', param: 'status', location: 'query' });
    }
    if (req.query.from && isNaN(Date.parse(req.query.from))) {
      errors.push({ msg: 'from must be ISO date', param: 'from', location: 'query' });
    }
    if (req.query.to && isNaN(Date.parse(req.query.to))) {
      errors.push({ msg: 'to must be ISO date', param: 'to', location: 'query' });
    }
    if (req.query.from && req.query.to && Date.parse(req.query.from) > Date.parse(req.query.to)) {
      errors.push({ msg: 'from must be before to', param: 'from', location: 'query' });
    }
    if (errors.length) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    return next();
  }
];

/**
 * Validation rules for athlete registration via school admin
 */
const validateSchoolAthleteRegistration = [
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
        throw new Error('Athlete age must be between 5 and 25 years');
      }
      return true;
    }),
  
  body('school_id')
    .isInt({ min: 1 })
    .withMessage('Valid school ID is required'),

  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),

  body('class')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Class must be between 1 and 10 characters'),

  body('section')
    .optional()
    .isLength({ min: 1, max: 5 })
    .withMessage('Section must be between 1 and 5 characters'),

  body('guardian_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Guardian name must be between 2 and 100 characters'),

  body('guardian_phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Guardian phone must be a valid phone number'),

  body('guardian_email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Guardian email must be valid'),

  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),

  body('interested_sports')
    .optional()
    .isArray()
    .withMessage('Interested sports must be an array'),

  validateRequest
];

/**
 * Validation rules for guardian/parent self-registration
 */
const validateGuardianAthleteRegistration = [
  body('athlete_name')
    .notEmpty()
    .withMessage('Athlete name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Athlete name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Athlete name can only contain letters and spaces'),
  
  body('athlete_dob')
    .isDate()
    .withMessage('Valid date of birth is required'),

  body('guardian_name')
    .notEmpty()
    .withMessage('Guardian name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Guardian name must be between 2 and 100 characters'),

  body('guardian_phone')
    .notEmpty()
    .withMessage('Guardian phone is required')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Guardian phone must be a valid phone number'),

  body('guardian_email')
    .notEmpty()
    .withMessage('Guardian email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Guardian email must be valid'),

  body('school_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid school ID is required'),

  body('registration_code')
    .optional()
    .isLength({ min: 6, max: 20 })
    .withMessage('Registration code must be between 6 and 20 characters'),

  validateRequest
];

/**
 * Validation rules for direct athlete self-registration
 */
const validateDirectAthleteRegistration = [
  body('full_name')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('date_of_birth')
    .isDate()
    .withMessage('Valid date of birth is required')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      if (age < 13) {
        throw new Error('Direct registration requires athlete to be at least 13 years old');
      }
      return true;
    }),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Phone must be a valid phone number'),

  body('school_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid school ID is required'),

  body('invitation_code')
    .optional()
    .isLength({ min: 6, max: 20 })
    .withMessage('Invitation code must be between 6 and 20 characters'),

  validateRequest
];

/**
 * Validation rules for athlete profile claim
 */
const validateAthleteProfileClaim = [
  body('claim_code')
    .notEmpty()
    .withMessage('Claim code is required')
    .isLength({ min: 8, max: 32 })
    .withMessage('Claim code must be between 8 and 32 characters'),

  body('verification_method')
    .isIn(['sms', 'email', 'guardian_phone'])
    .withMessage('Invalid verification method'),

  validateRequest
];

/**
 * Validation rules for athlete profile update
 */
const validateAthleteProfileUpdate = [
  body('guardian_contacts')
    .optional()
    .isArray()
    .withMessage('Guardian contacts must be an array'),

  body('medical_notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Medical notes must not exceed 1000 characters'),

  body('interested_sports')
    .optional()
    .isArray()
    .withMessage('Interested sports must be an array'),

  body('privacy_settings')
    .optional()
    .isObject()
    .withMessage('Privacy settings must be an object'),

  body('emergency_contact')
    .optional()
    .isObject()
    .withMessage('Emergency contact must be an object'),

  validateRequest
];

/**
 * Validation rules for sports and team assignment
 */
const validateSportsAssignment = [
  body('athlete_id')
    .notEmpty()
    .withMessage('Athlete ID is required')
    .isLength({ min: 10, max: 15 })
    .withMessage('Invalid athlete ID format'),

  body('sport_id')
    .isInt({ min: 1 })
    .withMessage('Valid sport ID is required'),

  body('age_group')
    .optional()
    .isIn(['U-10', 'U-12', 'U-14', 'U-16', 'U-18', 'U-21', 'Open'])
    .withMessage('Invalid age group'),

  body('team_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid team ID is required'),

  body('skill_level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Elite'])
    .withMessage('Invalid skill level'),

  body('position')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Position must not exceed 50 characters'),

  validateRequest
];

/**
 * Validation rules for tournament/event nomination
 */
const validateEventNomination = [
  body('athlete_ids')
    .isArray({ min: 1 })
    .withMessage('At least one athlete ID is required'),

  body('event_id')
    .isInt({ min: 1 })
    .withMessage('Valid event ID is required'),

  body('nomination_type')
    .isIn(['individual', 'team', 'relay'])
    .withMessage('Invalid nomination type'),

  body('coach_approval')
    .optional()
    .isBoolean()
    .withMessage('Coach approval must be boolean'),

  validateRequest
];

/**
 * Validation rules for athlete stats input
 */
const validateAthleteStats = [
  body('athlete_id')
    .notEmpty()
    .withMessage('Athlete ID is required'),

  body('match_id')
    .isInt({ min: 1 })
    .withMessage('Valid match ID is required'),

  body('stats')
    .isObject()
    .withMessage('Stats must be an object'),

  body('stats.*.value')
    .optional()
    .isNumeric()
    .withMessage('Stat values must be numeric'),

  validateRequest
];

/**
 * Validation rules for athlete transfer request
 */
const validateAthleteTransfer = [
  body('athlete_id')
    .notEmpty()
    .withMessage('Athlete ID is required'),

  body('current_school_id')
    .isInt({ min: 1 })
    .withMessage('Valid current school ID is required'),

  body('target_school_id')
    .isInt({ min: 1 })
    .withMessage('Valid target school ID is required'),

  body('transfer_reason')
    .notEmpty()
    .withMessage('Transfer reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Transfer reason must be between 10 and 500 characters'),

  body('guardian_approval')
    .isBoolean()
    .withMessage('Guardian approval is required'),

  body('effective_date')
    .optional()
    .isISO8601()
    .withMessage('Effective date must be valid'),

  validateRequest
];

/**
 * Validation rules for bulk athlete upload
 */
const validateBulkAthleteUpload = [
  body('athletes')
    .isArray({ min: 1, max: 100 })
    .withMessage('Athletes array must contain 1-100 entries'),

  body('athletes.*.full_name')
    .notEmpty()
    .withMessage('Full name is required for each athlete'),

  body('athletes.*.date_of_birth')
    .isDate()
    .withMessage('Valid date of birth is required for each athlete'),

  body('school_id')
    .isInt({ min: 1 })
    .withMessage('Valid school ID is required'),

  body('auto_generate_codes')
    .optional()
    .isBoolean()
    .withMessage('Auto generate codes must be boolean'),

  validateRequest
];

/**
 * Validation rules for player registration (alias for athlete registration)
 */
const validatePlayerRegistration = [
  body('full_name')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
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

module.exports = {
  validateRequest,
  validateUserRegistration,
  validateUserLogin,
  validateAthleteRegistration,
  validateSchoolRegistration,
  validateTournamentCreation,
  validateTournament,
  validateTournamentId,
  sanitizeInput,
  validatePlayerRegistration,
  validateSchoolAthleteRegistration,
  validateGuardianAthleteRegistration,
  validateDirectAthleteRegistration,
  validateAthleteProfileClaim,
  validateAthleteProfileUpdate,
  validateSportsAssignment,
  validateEventNomination,
  validateAthleteStats,
  validateAthleteTransfer,
  validateBulkAthleteUpload,
  validatePagination,
  // Inline bulk match creation validation (kept light – deeper rules can be added later)
  validateBulkMatchCreate: [
    body('matches').isArray({ min: 1, max: 200 }).withMessage('matches must be an array of 1-200 items'),
    body('matches.*.tournament_id').isInt({ min:1 }).withMessage('tournament_id required'),
    body('matches.*.home_team_id').isInt({ min:1 }).withMessage('home_team_id required'),
    body('matches.*.away_team_id').isInt({ min:1 }).withMessage('away_team_id required'),
    body('matches.*.sport_id').optional().isInt({ min:1 }).withMessage('sport_id must be int'),
    body('matches.*.scheduled_at').optional().isISO8601().withMessage('scheduled_at must be ISO date'),
    body('matches.*.venue').optional().isLength({ max:200 }).withMessage('venue too long'),
    validateRequest
  ]
};
