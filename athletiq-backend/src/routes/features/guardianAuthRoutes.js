// Guardian Authentication Routes
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../../config/db');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware for token verification
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.guardian = decoded;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

// Guardian Registration
router.post('/register', async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      address,
      occupation,
      education_level,
      relationship,
      emergency_contact_name,
      emergency_contact_phone,
      id_document_type,
      id_document_number
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if guardian already exists
    const existingGuardian = await pool.query(
      'SELECT id FROM guardians WHERE email = $1',
      [email]
    );

    if (existingGuardian.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Guardian with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create guardian
    const result = await pool.query(
      `INSERT INTO guardians (
        full_name, email, password_hash, phone, address, occupation,
        education_level, relationship, emergency_contact_name,
        emergency_contact_phone, id_document_type, id_document_number,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', NOW())
      RETURNING id, full_name, email, phone, status`,
      [
        full_name, email, hashedPassword, phone, address, occupation,
        education_level, relationship, emergency_contact_name,
        emergency_contact_phone, id_document_type, id_document_number
      ]
    );

    const guardian = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: guardian.id, email: guardian.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Guardian registered successfully',
      guardian: {
        id: guardian.id,
        full_name: guardian.full_name,
        email: guardian.email,
        phone: guardian.phone,
        status: guardian.status
      },
      token
    });

  } catch (error) {
    console.error('Guardian registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Guardian Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find guardian
    const result = await pool.query(
      'SELECT id, full_name, email, password_hash, phone, status FROM guardians WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const guardian = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, guardian.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: guardian.id, email: guardian.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      guardian: {
        id: guardian.id,
        full_name: guardian.full_name,
        email: guardian.email,
        phone: guardian.phone,
        status: guardian.status
      },
      token
    });

  } catch (error) {
    console.error('Guardian login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Google OAuth Login
router.post('/google-login', async (req, res) => {
  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if guardian exists
    let guardian;
    const existingGuardian = await pool.query(
      'SELECT id, full_name, email, phone, status FROM guardians WHERE email = $1',
      [email]
    );

    if (existingGuardian.rows.length > 0) {
      guardian = existingGuardian.rows[0];
    } else {
      // Create new guardian with Google info
      const result = await pool.query(
        `INSERT INTO guardians (
          full_name, email, google_id, auth_provider, status, created_at
        ) VALUES ($1, $2, $3, 'google', 'active', NOW())
        RETURNING id, full_name, email, phone, status`,
        [name, email, payload.sub]
      );
      guardian = result.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: guardian.id, email: guardian.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Google login successful',
      guardian: {
        id: guardian.id,
        full_name: guardian.full_name,
        email: guardian.email,
        phone: guardian.phone,
        status: guardian.status
      },
      token
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

// Get Guardian Profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, phone, address, occupation, education_level,
              relationship, emergency_contact_name, emergency_contact_phone,
              id_document_type, id_document_number, status, created_at
       FROM guardians WHERE id = $1`,
      [req.guardian.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found'
      });
    }

    res.json({
      success: true,
      guardian: result.rows[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update Guardian Profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const {
      full_name,
      phone,
      address,
      occupation,
      education_level,
      emergency_contact_name,
      emergency_contact_phone
    } = req.body;

    const result = await pool.query(
      `UPDATE guardians SET 
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        address = COALESCE($3, address),
        occupation = COALESCE($4, occupation),
        education_level = COALESCE($5, education_level),
        emergency_contact_name = COALESCE($6, emergency_contact_name),
        emergency_contact_phone = COALESCE($7, emergency_contact_phone),
        updated_at = NOW()
      WHERE id = $8
      RETURNING id, full_name, email, phone, address, occupation, education_level`,
      [full_name, phone, address, occupation, education_level, 
       emergency_contact_name, emergency_contact_phone, req.guardian.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      guardian: result.rows[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
