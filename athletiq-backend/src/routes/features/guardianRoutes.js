// src/routes/guardianRoutes.js
const express = require('express');
const router = express.Router();
const GuardianNotificationService = require('../../services/guardianNotificationService');
const { generalLimiter } = require('../../middlewares/rateLimiter');
const apiResponse = require('../../utils/apiResponse');

const guardianService = new GuardianNotificationService();

/**
 * Verify claim code and get athlete information
 * POST /api/guardian/verify-claim
 */
router.post('/verify-claim', generalLimiter, async (req, res, next) => {
  try {
    const { claimCode } = req.body;

    if (!claimCode) {
      return res.status(400).json({
        success: false,
        message: 'Claim code is required'
      });
    }

    const result = await guardianService.verifyClaimCode(claimCode);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        athlete: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * Claim student by school name, student name, and date of birth
 * POST /api/guardian/claim-by-details
 */
router.post('/claim-by-details', generalLimiter, async (req, res, next) => {
  try {
    console.log('=== Guardian claim-by-details request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { schoolName, firstName, lastName, dateOfBirth, dateFormat, guardianPhone, guardianEmail } = req.body;

    console.log('Extracted fields:', {
      schoolName, firstName, lastName, dateOfBirth, dateFormat, guardianPhone, guardianEmail
    });

    if (!schoolName || !firstName || !lastName || !dateOfBirth || !guardianPhone) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'School name, first name, last name, date of birth, and guardian phone are required'
      });
    }

    // Validate phone number format
    const phoneRegex = /^(\+977|977)?[0-9]{10}$/;
    if (!phoneRegex.test(guardianPhone.replace(/[-\s]/g, ''))) {
      console.log('Phone validation failed for:', guardianPhone);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Nepali phone number'
      });
    }

    console.log('Calling guardianService.claimByStudentDetails...');
    const result = await guardianService.claimByStudentDetails({
      schoolName,
      firstName,
      lastName,
      dateOfBirth,
      dateFormat: dateFormat || 'english',
      guardianPhone,
      guardianEmail
    });

    console.log('Service result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('Sending success response');
      res.status(200).json({
        success: true,
        message: result.message,
        athlete: result.data,
        claimCode: result.claimCode,
        requiresApproval: result.requiresApproval || false
      });
    } else {
      console.log('Sending error response:', result.message);
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Guardian claim-by-details error:', error);
    next(error);
  }
});

/**
 * Google OAuth login for guardians
 * POST /api/guardian/google-auth
 */
router.post('/google-auth', generalLimiter, async (req, res, next) => {
  try {
    const { googleToken, guardianData } = req.body;

    if (!googleToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    // Check if guardian already exists
    const existingGuardian = await pool.query(
      'SELECT * FROM guardian_profiles WHERE email = $1',
      [email]
    );

    if (existingGuardian.rowCount > 0) {
      // Return existing guardian info
      res.status(200).json({
        success: true,
        guardian: existingGuardian.rows[0],
        message: 'Guardian authenticated successfully'
      });
    } else {
      // Create new guardian entry
      const newGuardian = await pool.query(
        `INSERT INTO guardian_profiles (email, full_name, auth_provider, google_id, created_at)
         VALUES ($1, $2, 'google', $3, NOW()) RETURNING *`,
        [email, name, payload.sub]
      );

      res.status(201).json({
        success: true,
        guardian: newGuardian.rows[0],
        isNewUser: true,
        message: 'Guardian account created successfully'
      });
    }

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});
router.get('/schools', generalLimiter, async (req, res, next) => {
  try {
    const { search } = req.query;
    const result = await guardianService.getSchoolsList(search);

    if (result.success) {
      res.status(200).json({
        success: true,
        schools: result.data,
        message: 'Schools list retrieved successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * Complete guardian profile
 * POST /api/guardian/complete-profile
 */
router.post('/complete-profile', generalLimiter, async (req, res, next) => {
  try {
    const { 
      claimCode, 
      guardian_name, 
      guardian_phone, 
      guardian_email,
      guardian_address,
      emergency_contact,
      relationship 
    } = req.body;

    // Validation
    if (!claimCode || !guardian_name || !guardian_phone) {
      return res.status(400).json({
        success: false,
        message: 'Claim code, guardian name, and phone number are required'
      });
    }

    // Verify claim code first
    const verifyResult = await guardianService.verifyClaimCode(claimCode);
    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired claim code'
      });
    }

    // Complete the claim
    const guardianData = {
      guardian_name,
      guardian_phone,
      guardian_email,
      guardian_address,
      emergency_contact,
      relationship
    };

    const result = await guardianService.completeClaim(claimCode, guardianData);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Guardian profile completed successfully',
        athlete: verifyResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * Resend claim code (if original was lost)
 * POST /api/guardian/resend-claim
 */
router.post('/resend-claim', generalLimiter, async (req, res, next) => {
  try {
    const { athleteId, guardianPhone } = req.body;

    if (!athleteId || !guardianPhone) {
      return res.status(400).json({
        success: false,
        message: 'Athlete ID and guardian phone number are required'
      });
    }

    // Find existing claim
    const pool = require('../config/db');
    const query = `
      SELECT gc.*, p.full_name, p.athlete_id, s.name as school_name
      FROM guardian_claims gc
      JOIN players p ON gc.athlete_id = p.athlete_id
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE gc.athlete_id = $1 AND gc.guardian_phone = $2 AND gc.status = 'pending'
      ORDER BY gc.created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [athleteId, guardianPhone]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No pending claim found for this athlete and phone number'
      });
    }

    const claimData = result.rows[0];
    
    // Generate new claim code and extend expiration
    const newClaimCode = guardianService.generateClaimCode();
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 24);

    // Update claim with new code
    await pool.query(
      'UPDATE guardian_claims SET claim_code = $1, expires_at = $2, reminder_sent = false WHERE id = $3',
      [newClaimCode, newExpiresAt, claimData.id]
    );

    // Send new notification
    const athleteData = {
      ...claimData,
      claim_code: newClaimCode
    };

    const notificationResult = await guardianService.sendRegistrationNotification(athleteData);

    res.status(200).json({
      success: true,
      message: 'New claim code sent successfully',
      notification: notificationResult
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get claim status
 * GET /api/guardian/claim-status/:claimCode
 */
router.get('/claim-status/:claimCode', generalLimiter, async (req, res, next) => {
  try {
    const { claimCode } = req.params;

    const pool = require('../config/db');
    const query = `
      SELECT 
        gc.status,
        gc.expires_at,
        gc.completed_at,
        p.full_name,
        p.athlete_id,
        s.name as school_name
      FROM guardian_claims gc
      JOIN players p ON gc.athlete_id = p.athlete_id
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE gc.claim_code = $1
    `;

    const result = await pool.query(query, [claimCode]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Claim code not found'
      });
    }

    const claimInfo = result.rows[0];
    const now = new Date();
    const isExpired = new Date(claimInfo.expires_at) < now;

    res.status(200).json({
      success: true,
      claim: {
        ...claimInfo,
        is_expired: isExpired,
        time_remaining: isExpired ? 0 : Math.max(0, new Date(claimInfo.expires_at) - now)
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
