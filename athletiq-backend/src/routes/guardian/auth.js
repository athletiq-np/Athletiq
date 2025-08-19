const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const { createLogger } = require('../../utils/logger');
const { validateInput } = require('../../middlewares/validation');
const rateLimit = require('express-rate-limit');

const logger = createLogger('guardian-auth');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per window
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // Max 1 OTP per minute
  message: { error: 'Please wait before requesting another OTP.' }
});

// Validation schemas
const signupSchema = {
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 6 },
  full_name: { required: true, minLength: 2 },
  auth_provider: { required: true, enum: ['email', 'google', 'phone'] }
};

const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true }
};

const phoneOtpSchema = {
  phone: { required: true, pattern: /^\+977[0-9]{10}$/ },
  method: { required: true, enum: ['sms', 'whatsapp'] },
  full_name: { required: false }
};

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const formatPhoneNumber = (phone) => {
  // Ensure phone number is in +977XXXXXXXXXX format
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('977')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+977' + cleaned.substring(1);
  } else if (cleaned.length === 10) {
    return '+977' + cleaned;
  }
  return phone;
};

// Send OTP via SMS/WhatsApp (placeholder - integrate with actual service)
const sendOTP = async (phone, otp, method) => {
  try {
    // This would integrate with your SMS/WhatsApp service
    // For now, we'll log it for development
    logger.info(`OTP sent via ${method}`, { phone, otp: otp.substring(0, 2) + '****' });
    
    // In production, integrate with services like:
    // - Twilio for SMS
    // - WhatsApp Business API
    // - Local Nepal SMS providers
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to send OTP', { error: error.message, phone, method });
    return { success: false, error: error.message };
  }
};

// POST /api/auth/signup - Email/password signup
router.post('/signup', authLimiter, validateInput(signupSchema), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { email, password, full_name, auth_provider } = req.body;
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM guardians WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create guardian account
    const result = await client.query(
      `INSERT INTO guardians (
        email, password_hash, full_name, auth_provider, 
        created_at, updated_at, is_verified
      ) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5) 
      RETURNING id, email, full_name, auth_provider, created_at`,
      [email.toLowerCase(), hashedPassword, full_name, auth_provider, false]
    );
    
    const user = result.rows[0];
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    await client.query('COMMIT');
    
    logger.info('Guardian account created', { userId: user.id, email: user.email });
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        auth_provider: user.auth_provider
      },
      token
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Signup error', { error: error.message, email: req.body.email });
    res.status(500).json({
      success: false,
      message: 'Account creation failed'
    });
  } finally {
    client.release();
  }
});

// POST /api/auth/login - Email/password login
router.post('/login', authLimiter, validateInput(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, auth_provider, is_verified,
              phone, profile_photo_url, notification_preferences
       FROM guardians WHERE email = $1`,
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const user = result.rows[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Get user's athletes
    const athletesResult = await pool.query(
      `SELECT a.*, s.name as school_name, s.district 
       FROM athletes a 
       LEFT JOIN schools s ON a.school_id = s.id 
       WHERE a.guardian_id = $1 
       ORDER BY a.created_at DESC`,
      [user.id]
    );
    
    logger.info('Guardian login successful', { userId: user.id, email: user.email });
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        auth_provider: user.auth_provider,
        phone: user.phone,
        profile_photo_url: user.profile_photo_url,
        notification_preferences: user.notification_preferences,
        athletes: athletesResult.rows
      },
      token
    });
    
  } catch (error) {
    logger.error('Login error', { error: error.message, email: req.body.email });
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// POST /api/auth/send-otp - Send OTP for phone verification
router.post('/send-otp', otpLimiter, validateInput(phoneOtpSchema), async (req, res) => {
  try {
    const { phone, method, full_name } = req.body;
    const formattedPhone = formatPhoneNumber(phone);
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP in database
    await pool.query(
      `INSERT INTO guardian_otps (phone, otp_code, method, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (phone) DO UPDATE SET
       otp_code = $2, method = $3, expires_at = $4, created_at = NOW()`,
      [formattedPhone, otp, method, expiresAt]
    );
    
    // Send OTP
    const sendResult = await sendOTP(formattedPhone, otp, method);
    
    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
    
    logger.info('OTP sent successfully', { phone: formattedPhone, method });
    
    res.json({
      success: true,
      message: `OTP sent via ${method.toUpperCase()}`,
      expires_in: 600 // 10 minutes in seconds
    });
    
  } catch (error) {
    logger.error('Send OTP error', { error: error.message, phone: req.body.phone });
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// POST /api/auth/verify-otp - Verify OTP and create/login user
router.post('/verify-otp', authLimiter, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { phone, otp, full_name, auth_provider = 'phone' } = req.body;
    const formattedPhone = formatPhoneNumber(phone);
    
    // Verify OTP
    const otpResult = await client.query(
      'SELECT * FROM guardian_otps WHERE phone = $1 AND otp_code = $2 AND expires_at > NOW()',
      [formattedPhone, otp]
    );
    
    if (otpResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Check if user exists
    let user;
    const existingUser = await client.query(
      'SELECT * FROM guardians WHERE phone = $1',
      [formattedPhone]
    );
    
    if (existingUser.rows.length > 0) {
      // Existing user - login
      user = existingUser.rows[0];
      
      // Update last login
      await client.query(
        'UPDATE guardians SET updated_at = NOW() WHERE id = $1',
        [user.id]
      );
    } else {
      // New user - create account
      if (!full_name) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required for new accounts'
        });
      }
      
      const createResult = await client.query(
        `INSERT INTO guardians (
          phone, full_name, auth_provider, created_at, updated_at, is_verified
        ) VALUES ($1, $2, $3, NOW(), NOW(), true) 
        RETURNING *`,
        [formattedPhone, full_name, auth_provider]
      );
      
      user = createResult.rows[0];
    }
    
    // Delete used OTP
    await client.query('DELETE FROM guardian_otps WHERE phone = $1', [formattedPhone]);
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Get user's athletes
    const athletesResult = await client.query(
      `SELECT a.*, s.name as school_name, s.district 
       FROM athletes a 
       LEFT JOIN schools s ON a.school_id = s.id 
       WHERE a.guardian_id = $1 
       ORDER BY a.created_at DESC`,
      [user.id]
    );
    
    await client.query('COMMIT');
    
    logger.info('Phone OTP verification successful', { 
      userId: user.id, 
      phone: formattedPhone,
      isNewUser: existingUser.rows.length === 0
    });
    
    res.json({
      success: true,
      message: 'Phone verification successful',
      user: {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        auth_provider: user.auth_provider,
        email: user.email,
        profile_photo_url: user.profile_photo_url,
        notification_preferences: user.notification_preferences,
        athletes: athletesResult.rows
      },
      token
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('OTP verification error', { error: error.message, phone: req.body.phone });
    res.status(500).json({
      success: false,
      message: 'Phone verification failed'
    });
  } finally {
    client.release();
  }
});

// POST /api/auth/google - Google OAuth authentication
router.post('/google', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id_token, auth_provider = 'google' } = req.body;
    
    // Verify Google ID token (you'll need to implement this)
    // const googleUser = await verifyGoogleToken(id_token);
    
    // For now, assume token verification is successful
    // In production, use Google's client library to verify
    const googleUser = {
      email: 'test@gmail.com', // This would come from token verification
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      sub: 'google_user_id'
    };
    
    // Check if user exists
    let user;
    const existingUser = await client.query(
      'SELECT * FROM guardians WHERE email = $1 OR google_id = $2',
      [googleUser.email, googleUser.sub]
    );
    
    if (existingUser.rows.length > 0) {
      // Existing user
      user = existingUser.rows[0];
      
      // Update Google info if not set
      if (!user.google_id) {
        await client.query(
          'UPDATE guardians SET google_id = $1, profile_photo_url = $2 WHERE id = $3',
          [googleUser.sub, googleUser.picture, user.id]
        );
      }
    } else {
      // New user
      const createResult = await client.query(
        `INSERT INTO guardians (
          email, full_name, auth_provider, google_id, profile_photo_url,
          created_at, updated_at, is_verified
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), true) 
        RETURNING *`,
        [googleUser.email, googleUser.name, auth_provider, googleUser.sub, googleUser.picture]
      );
      
      user = createResult.rows[0];
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Get user's athletes
    const athletesResult = await client.query(
      `SELECT a.*, s.name as school_name, s.district 
       FROM athletes a 
       LEFT JOIN schools s ON a.school_id = s.id 
       WHERE a.guardian_id = $1 
       ORDER BY a.created_at DESC`,
      [user.id]
    );
    
    await client.query('COMMIT');
    
    logger.info('Google authentication successful', { 
      userId: user.id, 
      email: user.email,
      isNewUser: existingUser.rows.length === 0
    });
    
    res.json({
      success: true,
      message: 'Google authentication successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        auth_provider: user.auth_provider,
        phone: user.phone,
        profile_photo_url: user.profile_photo_url,
        notification_preferences: user.notification_preferences,
        athletes: athletesResult.rows
      },
      token
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Google auth error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  } finally {
    client.release();
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      `SELECT id, email, phone, full_name, auth_provider, profile_photo_url,
              notification_preferences, address, created_at, is_verified
       FROM guardians WHERE id = $1`,
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = result.rows[0];
    
    // Get user's athletes
    const athletesResult = await pool.query(
      `SELECT a.*, s.name as school_name, s.district 
       FROM athletes a 
       LEFT JOIN schools s ON a.school_id = s.id 
       WHERE a.guardian_id = $1 
       ORDER BY a.created_at DESC`,
      [user.id]
    );
    
    // Get emergency contacts
    const contactsResult = await pool.query(
      'SELECT * FROM guardian_emergency_contacts WHERE guardian_id = $1',
      [user.id]
    );
    
    res.json({
      success: true,
      user: {
        ...user,
        athletes: athletesResult.rows,
        emergency_contacts: contactsResult.rows
      }
    });
    
  } catch (error) {
    logger.error('Get user info error', { error: error.message });
    res.status(401).json({
      success: false,
      message: 'Invalid authentication'
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
