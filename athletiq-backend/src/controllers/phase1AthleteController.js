const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { sendResponse } = require('../utils/response');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiter');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Phase 1: Hybrid Registration Flow Controller
 * @purpose Implements school bulk registration + guardian claim/complete workflow
 */

// ========== SCHOOL BULK REGISTRATION WITH INVITATION GENERATION ==========

/**
 * @desc    Bulk register athletes with guardian invitation codes
 * @route   POST /api/athletes/phase1/bulk-register
 * @access  Private (SchoolAdmin)
 */
exports.bulkRegisterWithInvitations = async (req, res) => {
  try {
    const { athletes, schoolId, send_invitations = true } = req.body;
    
    // Handle authenticated and test modes
    const school_id = req.user?.school_id || schoolId;
    const created_by = req.user?.id || 1; // Default to user ID 1 for testing
    
    if (!school_id) {
      return sendResponse(res, { success: false, status: 400, message: 'School ID is required' });
    }

    
    if (!school_id) {
      return sendResponse(res, { success: false, status: 400, message: 'School ID is required' });
    }

    if (!athletes || !Array.isArray(athletes) || athletes.length === 0) {
      return sendResponse(res, { success: false, status: 400, message: 'Athletes array is required' });
    }

    const client = await pool.connect();
    await client.query('BEGIN');

    const results = [];
    const errors = [];

    for (let i = 0; i < athletes.length; i++) {
      const athlete = athletes[i];
      
      try {
        // Check for duplicates
        const exists = await client.query(
          `SELECT id FROM players WHERE LOWER(full_name) = LOWER($1) 
           AND date_of_birth = $2 AND school_id = $3`,
          [athlete.full_name.trim(), athlete.date_of_birth, school_id]
        );
        
        if (exists.rowCount > 0) {
          errors.push({
            row: i + 1,
            name: athlete.full_name,
            error: 'Duplicate athlete found'
          });
          continue;
        }

        // Generate shorter claim code (8 chars max)
        const claim_code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const athlete_id = uuidv4();

        const insertQuery = `
          INSERT INTO players (
            athlete_id, full_name, full_name_nepali, date_of_birth, gender, 
            grade, section, school_id, guardian_name, guardian_phone, guardian_email,
            address, claim_code, registration_method, verification_status,
            created_by, created_at, updated_at, active_status, profile_status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
            'bulk', 'pending', $14, NOW(), NOW(), 
            'Active', 'Incomplete'
          )
          RETURNING athlete_id, full_name, claim_code, guardian_phone, guardian_email;
        `;
        
        const values = [
          athlete_id,
          athlete.full_name.trim(),
          athlete.full_name_nepali || null,
          athlete.date_of_birth,
          athlete.gender || 'Male',
          athlete.grade || '10',
          athlete.section || 'A',
          school_id,
          athlete.guardian_name || `Guardian of ${athlete.full_name}`,
          athlete.guardian_phone || null,
          athlete.guardian_email || null,
          athlete.address || null,
          claim_code,
          created_by
        ];
        
        const result = await client.query(insertQuery, values);
        const createdAthlete = result.rows[0];

        // Add invitation details for SMS/Email sending
        results.push({
          ...createdAthlete,
          invitation_message: send_invitations ? 
            `Hello! ${athlete.full_name} has been registered at our school. Complete their profile using code: ${claim_code}. Visit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/claim/${claim_code}` : 
            'No invitation sent',
          invitation_sent: send_invitations && (athlete.guardian_phone || athlete.guardian_email)
        });

      } catch (error) {
        console.error('Individual athlete registration error:', error);
        errors.push({
          row: i + 1,
          name: athlete.full_name,
          error: error.message
        });
      }
    }

    await client.query('COMMIT');
    client.release();

    return sendResponse(res, { status: 201, message: `Bulk registration completed. ${results.length} athletes registered, ${errors.length} errors.`, data: {
      successful: results,
      errors: errors,
      summary: {
        total: athletes.length,
        successful: results.length,
        failed: errors.length,
        invitations_to_send: results.filter(r => r.invitation_sent).length
      }
    }});

  } catch (error) {
    console.error('Bulk registration error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to process bulk registration' });
  }
};

// ========== GUARDIAN CLAIM/COMPLETE WORKFLOW ==========

/**
 * @desc    Search for athletes that can be claimed by guardian
 * @route   GET /api/athletes/phase1/search-claimable
 * @access  Public (with rate limiting)
 */
exports.searchClaimableAthletes = async (req, res) => {
  try {
    const { name, date_of_birth, school_name, phone } = req.query;

    if (!name && !phone) {
      return sendResponse(res, { success: false, status: 400, message: 'Either athlete name or guardian phone is required' });
    }

    let searchQuery = `
      SELECT 
        p.athlete_id,
        p.full_name,
        p.full_name_nepali,
        p.date_of_birth,
        p.grade,
        p.section,
        p.claim_code,
        p.verification_status,
        s.name as school_name,
        s.school_code,
        CASE 
          WHEN p.verification_status = 'pending_guardian_completion' THEN true
          ELSE false
        END as can_claim
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE p.verification_status = 'pending_guardian_completion'
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    if (name) {
      searchQuery += ` AND LOWER(p.full_name) LIKE LOWER($${paramIndex})`;
      queryParams.push(`%${name}%`);
      paramIndex++;
    }

    if (date_of_birth) {
      searchQuery += ` AND p.date_of_birth = $${paramIndex}`;
      queryParams.push(date_of_birth);
      paramIndex++;
    }

    if (school_name) {
      searchQuery += ` AND LOWER(s.name) LIKE LOWER($${paramIndex})`;
      queryParams.push(`%${school_name}%`);
      paramIndex++;
    }

    if (phone) {
      searchQuery += ` AND p.guardian_phone LIKE $${paramIndex}`;
      queryParams.push(`%${phone}%`);
      paramIndex++;
    }

    searchQuery += ` ORDER BY p.created_at DESC LIMIT 10`;

    const result = await pool.query(searchQuery, queryParams);

    return sendResponse(res, { data: {
      athletes: result.rows,
      count: result.rows.length
    }, message: result.rows.length > 0 ? 'Found claimable athletes' : 'No claimable athletes found' });

  } catch (error) {
    console.error('Search claimable athletes error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to search athletes' });
  }
};

/**
 * @desc    Claim athlete profile using claim code
 * @route   POST /api/athletes/phase1/claim/:claimCode
 * @access  Public (with rate limiting)
 */
exports.claimAthleteProfile = async (req, res) => {
  try {
    const { claimCode } = req.params;
    const { guardian_verification } = req.body;

    // Find athlete with claim code
    const athleteQuery = `
      SELECT 
        p.*,
        s.name as school_name
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE p.claim_code = $1 AND p.verification_status = 'pending_guardian_completion'
    `;

    const result = await pool.query(athleteQuery, [claimCode]);

    if (result.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Invalid claim code or athlete already claimed' });
    }

    const athlete = result.rows[0];

    // For Phase 1, we'll do basic verification
    // In later phases, we can add SMS/email OTP verification
    if (guardian_verification) {
      const { guardian_name, guardian_phone, verified } = guardian_verification;
      
      // Basic verification - check if provided info matches
      if (verified && guardian_phone && athlete.guardian_phone && 
          athlete.guardian_phone.includes(guardian_phone.slice(-4))) {
        
        // Mark as claimed and ready for completion
        const updateQuery = `
          UPDATE players SET 
            verification_status = 'claimed',
            profile_status = 'In Progress',
            updated_at = NOW()
          WHERE athlete_id = $1
          RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [athlete.athlete_id]);

        return sendResponse(res, { message: 'Athlete profile claimed successfully', data: {
          athlete: updateResult.rows[0],
          next_step: 'complete_profile'
        }});
      }
    }

    // Return athlete info for guardian to verify
    return sendResponse(res, { data: {
      athlete: {
        athlete_id: athlete.athlete_id,
        full_name: athlete.full_name,
        full_name_nepali: athlete.full_name_nepali,
        date_of_birth: athlete.date_of_birth,
        grade: athlete.grade,
        section: athlete.section,
        school_name: athlete.school_name,
        guardian_phone_hint: athlete.guardian_phone ? `***${athlete.guardian_phone.slice(-4)}` : null
      },
      requires_verification: true
    }, message: 'Verify guardian details to claim profile' });

  } catch (error) {
    console.error('Claim athlete profile error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to claim athlete profile' });
  }
};

/**
 * @desc    Complete athlete profile after claiming
 * @route   PUT /api/athletes/phase1/complete/:athleteId
 * @access  Public (with rate limiting) - Later can be protected
 */
exports.completeAthleteProfile = async (req, res) => {
  try {
    const { athleteId } = req.params;
    const profileData = req.body;

    // Validate athlete can be completed
    const athlete = await pool.query(
      `SELECT * FROM players WHERE athlete_id = $1 AND verification_status IN ('claimed', 'pending_guardian_completion')`,
      [athleteId]
    );

    if (athlete.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Athlete not found or cannot be completed' });
    }

    // Build update query dynamically based on provided data
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Personal Information
    if (profileData.full_name_nepali) {
      updateFields.push(`full_name_nepali = $${paramIndex}`);
      updateValues.push(profileData.full_name_nepali);
      paramIndex++;
    }

    if (profileData.nationality) {
      updateFields.push(`nationality = $${paramIndex}`);
      updateValues.push(profileData.nationality);
      paramIndex++;
    }

    if (profileData.citizenship_no) {
      updateFields.push(`citizenship_no = $${paramIndex}`);
      updateValues.push(profileData.citizenship_no);
      paramIndex++;
    }

    // Guardian Information
    if (profileData.guardian_name) {
      updateFields.push(`guardian_name = $${paramIndex}`);
      updateValues.push(profileData.guardian_name);
      paramIndex++;
    }

    if (profileData.guardian_email) {
      updateFields.push(`guardian_email = $${paramIndex}`);
      updateValues.push(profileData.guardian_email);
      paramIndex++;
    }

    if (profileData.relationship_to_player) {
      updateFields.push(`relationship_to_player = $${paramIndex}`);
      updateValues.push(profileData.relationship_to_player);
      paramIndex++;
    }

    // Address Information
    if (profileData.address) {
      updateFields.push(`address = $${paramIndex}`);
      updateValues.push(profileData.address);
      paramIndex++;
    }

    if (profileData.province) {
      updateFields.push(`province = $${paramIndex}`);
      updateValues.push(profileData.province);
      paramIndex++;
    }

    if (profileData.district) {
      updateFields.push(`district = $${paramIndex}`);
      updateValues.push(profileData.district);
      paramIndex++;
    }

    // Sports Information
    if (profileData.registered_sports) {
      updateFields.push(`registered_sports = $${paramIndex}`);
      updateValues.push(JSON.stringify(profileData.registered_sports));
      paramIndex++;
    }

    if (profileData.primary_sport) {
      updateFields.push(`primary_sport = $${paramIndex}`);
      updateValues.push(profileData.primary_sport);
      paramIndex++;
    }

    // Medical Information
    if (profileData.blood_group) {
      updateFields.push(`blood_group = $${paramIndex}`);
      updateValues.push(profileData.blood_group);
      paramIndex++;
    }

    if (profileData.medical_conditions) {
      updateFields.push(`medical_conditions = $${paramIndex}`);
      updateValues.push(JSON.stringify(profileData.medical_conditions || []));
      paramIndex++;
    }

    if (profileData.allergies) {
      updateFields.push(`allergies = $${paramIndex}`);
      updateValues.push(JSON.stringify(profileData.allergies || []));
      paramIndex++;
    }

    if (profileData.emergency_contact) {
      updateFields.push(`emergency_contact = $${paramIndex}`);
      updateValues.push(profileData.emergency_contact);
      paramIndex++;
    }

    // Profile metadata
    updateFields.push(`verification_status = $${paramIndex}`);
    updateValues.push('pending_verification');
    paramIndex++;

    updateFields.push(`profile_status = $${paramIndex}`);
    updateValues.push('Completed');
    paramIndex++;

    updateFields.push(`updated_at = NOW()`);

    // Add athlete_id for WHERE clause
    updateValues.push(athleteId);

    const updateQuery = `
      UPDATE players SET 
        ${updateFields.join(', ')}
      WHERE athlete_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, updateValues);

    // Calculate profile completion percentage
    const completedAthlete = result.rows[0];
    const requiredFields = ['full_name', 'date_of_birth', 'gender', 'guardian_name', 'guardian_phone'];
    const optionalFields = ['full_name_nepali', 'guardian_email', 'address', 'primary_sport', 'blood_group'];
    
    let completionScore = 0;
    requiredFields.forEach(field => {
      if (completedAthlete[field]) completionScore += 20;
    });
    optionalFields.forEach(field => {
      if (completedAthlete[field]) completionScore += 5;
    });

    // Update completion score
    await pool.query(
      'UPDATE players SET profile_completion = $1 WHERE athlete_id = $2',
      [Math.min(completionScore, 100), athleteId]
    );

    return sendResponse(res, { message: 'Athlete profile completed successfully', data: {
      athlete: completedAthlete,
      profile_completion: Math.min(completionScore, 100),
      status: 'ready_for_verification'
    }});

  } catch (error) {
    console.error('Complete athlete profile error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to complete athlete profile' });
  }
};

// ========== STATUS MANAGEMENT ==========

/**
 * @desc    Get athlete registration status and next steps
 * @route   GET /api/athletes/phase1/status/:athleteId
 * @access  Public
 */
exports.getAthleteStatus = async (req, res) => {
  try {
    const { athleteId } = req.params;

    const result = await pool.query(`
      SELECT 
        p.*,
        s.name as school_name,
        s.school_code
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE p.athlete_id = $1
    `, [athleteId]);

    if (result.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Athlete not found' });
    }

    const athlete = result.rows[0];
    
    // Determine next steps based on status
    let nextSteps = [];
    switch (athlete.verification_status) {
      case 'pending_guardian_completion':
        nextSteps = [
          'Guardian needs to claim profile using claim code',
          'Complete comprehensive athlete information',
          'Upload required documents'
        ];
        break;
      case 'claimed':
        nextSteps = [
          'Complete comprehensive athlete information',
          'Upload required documents',
          'Submit for verification'
        ];
        break;
      case 'pending_verification':
        nextSteps = [
          'School admin/federation review in progress',
          'Document verification',
          'Wait for approval'
        ];
        break;
      case 'verified':
        nextSteps = [
          'Profile ready for tournament registration',
          'Sports team assignments available',
          'Can participate in events'
        ];
        break;
      default:
        nextSteps = ['Contact administrator for status update'];
    }

    return sendResponse(res, { data: {
      athlete: {
        athlete_id: athlete.athlete_id,
        full_name: athlete.full_name,
        verification_status: athlete.verification_status,
        profile_status: athlete.profile_status,
        profile_completion: athlete.profile_completion || 0,
        school_name: athlete.school_name,
        created_at: athlete.created_at,
        updated_at: athlete.updated_at
      },
      next_steps: nextSteps,
      workflow_stage: this.getWorkflowStage(athlete.verification_status)
    }});

  } catch (error) {
    console.error('Get athlete status error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to get athlete status' });
  }
};

// Helper function to determine workflow stage
exports.getWorkflowStage = (status) => {
  const stages = {
    'pending_guardian_completion': 'awaiting_claim',
    'claimed': 'profile_completion',
    'pending_verification': 'under_review',
    'verified': 'active',
    'rejected': 'requires_attention'
  };
  return stages[status] || 'unknown';
};

module.exports = {
  bulkRegisterWithInvitations: exports.bulkRegisterWithInvitations,
  searchClaimableAthletes: exports.searchClaimableAthletes,
  claimAthleteProfile: exports.claimAthleteProfile,
  completeAthleteProfile: exports.completeAthleteProfile,
  getAthleteStatus: exports.getAthleteStatus
};
