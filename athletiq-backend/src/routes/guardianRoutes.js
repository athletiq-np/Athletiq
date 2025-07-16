// src/routes/guardianRoutes.js
const express = require('express');
const router = express.Router();
const GuardianNotificationService = require('../services/guardianNotificationService');
const { generalLimiter } = require('../middlewares/rateLimiter');
const apiResponse = require('../utils/apiResponse');

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
