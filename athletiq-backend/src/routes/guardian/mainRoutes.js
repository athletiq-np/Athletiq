// Guardian Main Routes - Clean and Organized
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Joi = require('joi');
// NOTE: db.js exports an object { pool, query, ... } so we must destructure
const { pool } = require('../../config/db');

const router = express.Router();

// ===== CONFIGURATION =====

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/documents/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// ===== MIDDLEWARE =====

// JWT Authentication Middleware
const authenticateGuardian = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Support both legacy guardian tokens and unified tokens
    let guardianId;
    if (decoded.guardianId) {
      // Legacy token format
      guardianId = decoded.guardianId;
    } else if (decoded.user && decoded.user.role === 'Guardian') {
      // Unified token format
      guardianId = decoded.user.id;
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format.' 
      });
    }
    
    const guardian = await pool.query('SELECT * FROM guardians WHERE id = $1', [guardianId]);
    
    if (guardian.rowCount === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Guardian not found.' 
      });
    }

    req.guardian = guardian.rows[0];
    next();
  } catch (error) {
    console.error('Guardian authentication error:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// ===== VALIDATION SCHEMAS =====

const schemas = {
  register: Joi.object({
    fullName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+977[0-9]{10}$/).required().messages({
      'string.pattern.base': 'Phone must be in format +977XXXXXXXXXX (Nepal mobile number)'
    }),
    password: Joi.string().min(8).max(50).required(),
    address: Joi.string().max(255).allow('').optional(),
    relationship: Joi.string().valid('parent', 'guardian', 'relative', 'other').required(),
    schoolName: Joi.string().min(2).max(100).required(),
    schoolId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    athleteName: Joi.string().min(2).max(100).required(),
    dateOfBirth: Joi.string().required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  addAthlete: Joi.object({
    athleteName: Joi.string().min(2).max(100).required(),
    dateOfBirth: Joi.string().required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    grade: Joi.string().max(10),
    schoolName: Joi.string().min(2).max(100).required(),
    schoolId: Joi.alternatives().try(Joi.string(), Joi.number()),
    additionalInfo: Joi.string().max(500).allow('')
  })
};

// Validation middleware
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    next();
  };
};

// ===== HELPER FUNCTIONS =====

const generateJWT = (guardianId) => {
  return jwt.sign(
    { guardianId },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '24h' }
  );
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// ===== ROUTES =====

/**
 * @route POST /register
 * @desc Register a new guardian
 */
router.post('/register', validateBody(schemas.register), async (req, res) => {
  try {
    const {
      fullName, email, phone, password, address, relationship,
      schoolName, schoolId, athleteName, dateOfBirth
    } = req.body;

    // Check if guardian already exists
    const existingGuardian = await pool.query(
      'SELECT id FROM guardians WHERE email = $1',
      [email]
    );

    if (existingGuardian.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Guardian with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert guardian
    const guardianResult = await pool.query(
      `INSERT INTO guardians 
       (full_name, email, phone, password_hash, address, relationship, 
        status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW()) 
       RETURNING id, full_name, email, phone, status`,
      [fullName, email, phone, hashedPassword, address, relationship]
    );

    const guardian = guardianResult.rows[0];

    // Add athlete to guardian account
    await pool.query(
      `INSERT INTO guardian_children 
       (guardian_id, full_name, date_of_birth, school_name, school_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [guardian.id, athleteName, dateOfBirth, schoolName, schoolId]
    );

    // Generate token
    const token = generateJWT(guardian.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        guardian: {
          id: guardian.id,
          fullName: guardian.full_name,
          email: guardian.email,
          phone: guardian.phone,
          accountStatus: guardian.status
        }
      },
      message: 'Guardian registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /login
 * @desc Guardian login
 */
router.post('/login', validateBody(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find guardian
    const guardianResult = await pool.query(
      'SELECT * FROM guardians WHERE email = $1',
      [email]
    );

    if (guardianResult.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const guardian = guardianResult.rows[0];

    // Check password
    const validPassword = await comparePassword(password, guardian.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check account status (using correct column name)
    if (guardian.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Generate token
    const token = generateJWT(guardian.id);

    res.json({
      success: true,
      data: {
        token,
        guardian: {
          id: guardian.id,
          fullName: guardian.full_name,
          email: guardian.email,
          phone: guardian.phone,
          accountStatus: guardian.status
        }
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /profile
 * @desc Get guardian profile
 */
router.get('/profile', authenticateGuardian, async (req, res) => {
  try {
    const guardian = req.guardian;
    
    res.json({
      success: true,
      data: {
        id: guardian.id,
        fullName: guardian.full_name,
        email: guardian.email,
        phone: guardian.phone,
        address: guardian.address,
        relationship: guardian.relationship,
        accountStatus: guardian.status,
        createdAt: guardian.created_at,
        lastLogin: guardian.last_login
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

/**
 * @route GET /athletes
 * @desc Get guardian's athletes
 */
router.get('/athletes', authenticateGuardian, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM guardian_children WHERE guardian_id = $1 ORDER BY created_at DESC',
      [req.guardian.id]
    );

    res.json({
      success: true,
      data: {
        athletes: result.rows.map(athlete => ({
          id: athlete.id,
          athleteName: athlete.full_name,
          dateOfBirth: athlete.date_of_birth,
          schoolName: athlete.school_name,
          schoolId: athlete.school_id,
          grade: athlete.grade,
          gender: athlete.gender,
          athleteId: athlete.athlete_id,
          verificationStatus: athlete.verification_status || 'pending_school_approval',
          additionalInfo: athlete.additional_info,
          createdAt: athlete.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Athletes fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch athletes'
    });
  }
});

/**
 * @route POST /add-athlete
 * @desc Add an athlete to guardian account
 */
router.post('/add-athlete', authenticateGuardian, validateBody(schemas.addAthlete), async (req, res) => {
  try {
    const { athleteName, dateOfBirth, gender, grade, schoolName, schoolId, additionalInfo } = req.body;

    const result = await pool.query(
      `INSERT INTO guardian_children 
       (guardian_id, full_name, date_of_birth, gender, grade, school_name, school_id, additional_info, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
       RETURNING *`,
      [req.guardian.id, athleteName, dateOfBirth, gender, grade, schoolName, schoolId, additionalInfo]
    );

    const athlete = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: athlete.id,
        athleteName: athlete.full_name,
        dateOfBirth: athlete.date_of_birth,
        gender: athlete.gender,
        grade: athlete.grade,
        schoolName: athlete.school_name,
        schoolId: athlete.school_id,
        additionalInfo: athlete.additional_info
      },
      message: 'Athlete added successfully'
    });

  } catch (error) {
    console.error('Add athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add athlete'
    });
  }
});

/**
 * @route GET /schools
 * @desc Get list of schools with optional search
 */
router.get('/schools', async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    
    let query = `
      SELECT id, name, address, email, mobile, 
             city, district, province, 
             is_active, verification_status
      FROM schools 
      WHERE is_active = true
    `;
    let params = [];

    if (search) {
      query += ` AND (name ILIKE $1 OR address ILIKE $1 OR city ILIKE $1 OR district ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY name LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(school => ({
        id: school.id,
        name: school.name,
        address: school.address,
        municipality: school.city,
        district: school.district,
        zone: school.province,
        contactEmail: school.email,
        contactPhone: school.mobile,
        status: school.is_active ? 'active' : 'inactive',
        verificationStatus: school.verification_status
      })),
      total: result.rowCount
    });

  } catch (error) {
    console.error('Schools fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools'
    });
  }
});

/**
 * @route PUT /profile
 * @desc Update guardian profile
 */
router.put('/profile', authenticateGuardian, async (req, res) => {
  try {
    const { fullName, phone, address, relationship } = req.body;
    
    // Basic validation
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be at least 2 characters'
      });
    }

    const result = await pool.query(
      `UPDATE guardians 
       SET full_name = $1, phone = $2, address = $3, relationship = $4, updated_at = NOW()
       WHERE id = $5 
       RETURNING id, full_name, email, phone, address, relationship, status`,
      [fullName, phone, address, relationship, req.guardian.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found'
      });
    }

    const guardian = result.rows[0];

    res.json({
      success: true,
      data: {
        id: guardian.id,
        fullName: guardian.full_name,
        email: guardian.email,
        phone: guardian.phone,
        address: guardian.address,
        relationship: guardian.relationship,
        accountStatus: guardian.status
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route GET /athlete/:athleteId/status
 * @desc Get athlete approval status and details
 */
router.get('/athlete/:athleteId/status', authenticateGuardian, async (req, res) => {
  try {
    const { athleteId } = req.params;

    const result = await pool.query(
      `SELECT gc.*, s.name as school_name, s.email, s.mobile
       FROM guardian_children gc
       LEFT JOIN schools s ON gc.school_id = s.id
       WHERE gc.id = $1 AND gc.guardian_id = $2`,
      [athleteId, req.guardian.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    const athlete = result.rows[0];

    res.json({
      success: true,
      data: {
        id: athlete.id,
        athleteName: athlete.full_name,
        dateOfBirth: athlete.date_of_birth,
        gender: athlete.gender,
        grade: athlete.grade,
        schoolName: athlete.school_name,
        schoolId: athlete.school_id,
        athleteId: athlete.athlete_id,
        athleteIdStatus: athlete.athlete_id_status || 'pending',
        verificationStatus: athlete.verification_status || 'pending_school_approval',
        linkedPlayerId: athlete.linked_player_id,
        additionalInfo: athlete.additional_info,
        createdAt: athlete.created_at,
        school: {
          contactEmail: athlete.email,
          contactPhone: athlete.mobile
        }
      }
    });

  } catch (error) {
    console.error('Athlete status fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch athlete status'
    });
  }
});

/**
 * @route POST /simplified-register
 * @desc Simplified guardian registration (guardian only, child later)
 */
router.post('/simplified-register', async (req, res) => {
  try {
    const { fullName, email, phone, password, address = '', relationship = 'parent' } = req.body;

    // Basic validation
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, phone, and password are required'
      });
    }

    // Check if guardian already exists
    const existingGuardian = await pool.query(
      'SELECT id FROM guardians WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingGuardian.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Guardian with this email or phone already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert guardian
    const guardianResult = await pool.query(
      `INSERT INTO guardians 
       (full_name, email, phone, password_hash, address, relationship, 
        status, email_verified, profile_completed, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, 'active', false, true, NOW(), NOW()) 
       RETURNING id, full_name, email, phone, status`,
      [fullName, email, phone, hashedPassword, address, relationship.toLowerCase()]
    );

    const guardian = guardianResult.rows[0];

    // Generate token
    const token = generateJWT(guardian.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        guardian: {
          id: guardian.id,
          fullName: guardian.full_name,
          email: guardian.email,
          phone: guardian.phone,
          accountStatus: guardian.status
        }
      },
      message: 'Guardian registered successfully! You can now add children to your account.'
    });

  } catch (error) {
    console.error('Simplified registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== BACKWARD COMPATIBILITY ROUTES =====
// These routes maintain compatibility with existing frontend code

/**
 * @route GET /children (backward compatibility)
 * @desc Get guardian's children - redirects to /athletes
 */
router.get('/children', authenticateGuardian, async (req, res) => {
  // Forward to athletes endpoint but return data in old format for compatibility
  try {
    const result = await pool.query(
      'SELECT * FROM guardian_children WHERE guardian_id = $1 ORDER BY created_at DESC',
      [req.guardian.id]
    );

    res.json({
      success: true,
      data: result.rows.map(athlete => ({
        id: athlete.id,
        childFullName: athlete.full_name, // Keep old format for compatibility
        dateOfBirth: athlete.date_of_birth,
        schoolName: athlete.school_name,
        schoolId: athlete.school_id,
        grade: athlete.grade,
        gender: athlete.gender,
        additionalInfo: athlete.additional_info,
        createdAt: athlete.created_at
      }))
    });

  } catch (error) {
    console.error('Children fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch children'
    });
  }
});

/**
 * @route POST /add-child (backward compatibility)
 * @desc Add a child to guardian account - redirects to /add-athlete
 */
router.post('/add-child', authenticateGuardian, async (req, res) => {
  try {
    // Map old field names to new ones
    const { childFullName, dateOfBirth, gender, grade, schoolName, schoolId, additionalInfo } = req.body;

    const result = await pool.query(
      `INSERT INTO guardian_children 
       (guardian_id, full_name, date_of_birth, gender, grade, school_name, school_id, additional_info, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
       RETURNING *`,
      [req.guardian.id, childFullName, dateOfBirth, gender, grade, schoolName, schoolId, additionalInfo]
    );

    const athlete = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: athlete.id,
        childFullName: athlete.full_name, // Keep old format for compatibility
        dateOfBirth: athlete.date_of_birth,
        gender: athlete.gender,
        grade: athlete.grade,
        schoolName: athlete.school_name,
        schoolId: athlete.school_id,
        additionalInfo: athlete.additional_info
      },
      message: 'Child added successfully'
    });

  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add child'
    });
  }
});

/**
 * @desc Get athlete status
 * @route GET /athlete/:id/status
 * @access Private (Guardian only)
 */
router.get('/athlete/:id/status', authenticateGuardian, async (req, res) => {
  try {
    const athleteId = req.params.id;
    const guardianId = req.guardian.id;

    // Verify athlete belongs to guardian and get status
    const athleteQuery = `
      SELECT gc.id, gc.full_name, gc.status, gc.date_of_birth, gc.school_name
      FROM guardian_children gc
      WHERE gc.id = $1 AND gc.guardian_id = $2
    `;

    const result = await pool.query(athleteQuery, [athleteId, guardianId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found or access denied'
      });
    }

    const athlete = result.rows[0];

    res.json({
      success: true,
      data: {
        id: athlete.id,
        athleteName: athlete.full_name,
        status: athlete.status || 'active', // Default to active if no status
        dateOfBirth: athlete.date_of_birth,
        schoolName: athlete.school_name
      },
      message: 'Athlete status retrieved successfully'
    });

  } catch (error) {
    console.error('Get athlete status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get athlete status'
    });
  }
});

module.exports = router;