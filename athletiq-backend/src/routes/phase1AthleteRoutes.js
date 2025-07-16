const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middlewares/authMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiter');
const {
  bulkRegisterWithInvitations,
  searchClaimableAthletes,
  claimAthleteProfile,
  completeAthleteProfile,
  getAthleteStatus
} = require('../controllers/phase1AthleteController');

/**
 * @desc    Phase 1: Hybrid Registration Flow Routes
 * @purpose School bulk registration + guardian claim/complete workflow
 */

// ========== SCHOOL BULK REGISTRATION ==========

/**
 * @route   POST /api/athletes/phase1/bulk-register
 * @desc    Bulk register athletes with guardian invitation codes
 * @access  Private (SchoolAdmin)
 */
router.post(
  '/bulk-register',
  generalLimiter,
  protect,
  checkRole(['SchoolAdmin']),
  bulkRegisterWithInvitations
);

/**
 * @route   POST /api/athletes/phase1/test-bulk-register
 * @desc    Test version of bulk register (no auth required)
 * @access  Public (for testing only)
 */
router.post(
  '/test-bulk-register',
  generalLimiter,
  bulkRegisterWithInvitations
);

// ========== GUARDIAN CLAIM/COMPLETE WORKFLOW ==========

/**
 * @route   GET /api/athletes/phase1/search-claimable
 * @desc    Search for athletes that can be claimed by guardian
 * @access  Public (with rate limiting)
 */
router.get(
  '/search-claimable',
  generalLimiter,
  searchClaimableAthletes
);

/**
 * @route   POST /api/athletes/phase1/claim/:claimCode
 * @desc    Claim athlete profile using claim code
 * @access  Public (with rate limiting)
 */
router.post(
  '/claim/:claimCode',
  generalLimiter,
  claimAthleteProfile
);

/**
 * @route   PUT /api/athletes/phase1/complete/:athleteId
 * @desc    Complete athlete profile after claiming
 * @access  Public (with rate limiting) - Later can be protected
 */
router.put(
  '/complete/:athleteId',
  generalLimiter,
  completeAthleteProfile
);

// ========== STATUS MANAGEMENT ==========

/**
 * @route   GET /api/athletes/phase1/status/:athleteId
 * @desc    Get athlete registration status and next steps
 * @access  Public
 */
router.get(
  '/status/:athleteId',
  getAthleteStatus
);

// ========== ADDITIONAL HELPER ROUTES ==========

/**
 * @route   GET /api/athletes/phase1/validate-claim/:claimCode
 * @desc    Validate claim code without claiming (for UI feedback)
 * @access  Public
 */
router.get('/validate-claim/:claimCode', generalLimiter, async (req, res) => {
  try {
    const { claimCode } = req.params;
    
    const result = await require('../config/db').pool.query(
      `SELECT athlete_id, full_name, school_id, verification_status 
       FROM players 
       WHERE claim_code = $1`,
      [claimCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid claim code',
        valid: false
      });
    }

    const athlete = result.rows[0];
    
    if (athlete.verification_status !== 'pending_guardian_completion') {
      return res.status(400).json({
        success: false,
        message: 'This athlete profile has already been claimed or is not available for claiming',
        valid: false,
        status: athlete.verification_status
      });
    }

    res.json({
      success: true,
      message: 'Valid claim code',
      valid: true,
      athlete: {
        name: athlete.full_name,
        status: athlete.verification_status
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate claim code',
      valid: false
    });
  }
});

/**
 * @route   GET /api/athletes/phase1/bulk-template
 * @desc    Download CSV template for bulk upload
 * @access  Private (SchoolAdmin)
 */
router.get('/bulk-template', protect, checkRole(['SchoolAdmin']), (req, res) => {
  const csvTemplate = `full_name,full_name_nepali,date_of_birth,gender,grade,section,guardian_name,guardian_phone,guardian_email,address
Ram Bahadur Thapa,राम बहादुर थापा,2008-03-15,Male,10,A,Gopal Thapa,9841234567,gopal@email.com,"Kathmandu, Nepal"
Sita Maya Gurung,सिता माया गुरुङ,2009-07-22,Female,9,B,Krishna Gurung,9876543210,krishna@email.com,"Pokhara, Nepal"`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=bulk_athlete_template.csv');
  res.send(csvTemplate);
});

module.exports = router;
