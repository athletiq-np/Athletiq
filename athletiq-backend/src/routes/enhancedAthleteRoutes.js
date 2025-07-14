const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const { generateShortCode } = require('../utils/codeGenerator');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const { 
  validateAthleteRegistration,
  validateSchoolAthleteRegistration,
  validateGuardianAthleteRegistration,
  validateDirectAthleteRegistration,
  validateAthleteProfileClaim,
  validateAthleteProfileUpdate,
  validateSportsAssignment,
  validateEventNomination,
  validateAthleteStats,
  validateAthleteTransfer,
  validateBulkAthleteUpload
} = require('../middlewares/validation');
const { generalLimiter } = require('../middlewares/rateLimiter');
const apiResponse = require('../utils/apiResponse');

// Enhanced Multer Setup for athlete documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subfolder = file.fieldname === 'birth_certificate' ? 'documents' : 'photos';
    cb(null, `uploads/athletes/${subfolder}/`);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, "_");
    cb(null, `athlete-${timestamp}-${originalName}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profile_photo') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Profile photo must be an image file'), false);
      }
    } else if (file.fieldname === 'birth_certificate') {
      if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Birth certificate must be PDF or image file'), false);
      }
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ========== 1. ENTRY POINTS: ATHLETE REGISTRATION ==========

/**
 * @route   POST /api/athletes/register/school
 * @desc    Register athlete via school admin (Entry Point A)
 * @access  Private (SchoolAdmin)
 */
router.post(
  '/register/school',
  generalLimiter,
  protect,
  checkRole(['SchoolAdmin', 'SuperAdmin']),
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "birth_certificate", maxCount: 1 }
  ]),
  validateSchoolAthleteRegistration,
  async (req, res, next) => {
    try {
      const { 
        full_name, 
        date_of_birth, 
        school_id, 
        gender, 
        class: studentClass, 
        section,
        guardian_name,
        guardian_phone,
        guardian_email,
        address,
        interested_sports
      } = req.body;
      
      const created_by = req.user.id;

      // Check for duplicates
      const exists = await pool.query(
        "SELECT id FROM players WHERE LOWER(full_name)=LOWER($1) AND date_of_birth=$2 AND school_id=$3",
        [full_name.trim(), date_of_birth, school_id]
      );
      
      if (exists.rowCount > 0) {
        const error = new Error('An athlete with this name and date of birth is already registered for this school.');
        error.statusCode = 409;
        throw error;
      }

      // Generate athlete ID and claim code
      const claim_code = await generateShortCode('CLAIM', 12);
      
      const photo_url = req.files?.profile_photo?.[0]?.filename || null;
      const birth_cert_url = req.files?.birth_certificate?.[0]?.filename || null;

      const insertQuery = `
        INSERT INTO players (
          athlete_id, full_name, date_of_birth, school_id, gender, class, section,
          guardian_name, guardian_phone, guardian_email, address,
          profile_photo_url, birth_cert_url, created_by, is_active,
          status, claim_code, interested_sports
        ) VALUES (
          generate_athlete_id(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE,
          'pending_verification', $14, $15
        )
        RETURNING *;
      `;
      
      const values = [
        full_name.trim(), date_of_birth, school_id, gender, studentClass, section,
        guardian_name, guardian_phone, guardian_email, address,
        photo_url, birth_cert_url, created_by, claim_code,
        JSON.stringify(interested_sports || [])
      ];
      
      const result = await pool.query(insertQuery, values);
      const athlete = result.rows[0];

      // TODO: Send SMS/Email with claim code to guardian/athlete
      // await sendClaimNotification(athlete.athlete_id, claim_code, guardian_phone, guardian_email);

      res.status(201).json({
        success: true,
        message: "Athlete registered successfully via school admin.",
        athlete: {
          ...athlete,
          claim_url: `${process.env.FRONTEND_URL}/claim/${claim_code}`
        }
      });

    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   POST /api/athletes/register/guardian
 * @desc    Guardian/Parent self-registration (Entry Point B)
 * @access  Public (with rate limiting)
 */
router.post(
  '/register/guardian',
  generalLimiter,
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "birth_certificate", maxCount: 1 }
  ]),
  validateGuardianAthleteRegistration,
  async (req, res, next) => {
    try {
      const {
        athlete_name,
        athlete_dob,
        guardian_name,
        guardian_phone,
        guardian_email,
        school_id,
        registration_code,
        interested_sports
      } = req.body;

      // Validate registration code if provided
      if (registration_code) {
        const codeCheck = await pool.query(
          "SELECT school_id FROM registration_codes WHERE code = $1 AND is_active = TRUE AND expires_at > NOW()",
          [registration_code]
        );
        
        if (codeCheck.rowCount === 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid or expired registration code."
          });
        }
      }

      const photo_url = req.files?.profile_photo?.[0]?.filename || null;
      const birth_cert_url = req.files?.birth_certificate?.[0]?.filename || null;

      const insertQuery = `
        INSERT INTO players (
          athlete_id, full_name, date_of_birth, school_id,
          guardian_name, guardian_phone, guardian_email,
          profile_photo_url, birth_cert_url, is_active,
          status, registration_method, interested_sports
        ) VALUES (
          generate_athlete_id(), $1, $2, $3, $4, $5, $6, $7, $8, TRUE,
          'pending_approval', 'guardian_registration', $9
        )
        RETURNING *;
      `;
      
      const values = [
        athlete_name.trim(), athlete_dob, school_id,
        guardian_name, guardian_phone, guardian_email,
        photo_url, birth_cert_url,
        JSON.stringify(interested_sports || [])
      ];
      
      const result = await pool.query(insertQuery, values);

      res.status(201).json({
        success: true,
        message: "Athlete registration submitted for school approval.",
        athlete: result.rows[0]
      });

    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   POST /api/athletes/register/direct
 * @desc    Direct athlete self-registration (Entry Point C)
 * @access  Public (with rate limiting)
 */
router.post(
  '/register/direct',
  generalLimiter,
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "birth_certificate", maxCount: 1 }
  ]),
  validateDirectAthleteRegistration,
  async (req, res, next) => {
    try {
      const {
        full_name,
        date_of_birth,
        email,
        phone,
        school_id,
        invitation_code,
        interested_sports
      } = req.body;

      // Validate invitation code if provided
      if (invitation_code) {
        const codeCheck = await pool.query(
          "SELECT school_id FROM invitation_codes WHERE code = $1 AND is_active = TRUE AND expires_at > NOW()",
          [invitation_code]
        );
        
        if (codeCheck.rowCount === 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid or expired invitation code."
          });
        }
      }

      const photo_url = req.files?.profile_photo?.[0]?.filename || null;
      const birth_cert_url = req.files?.birth_certificate?.[0]?.filename || null;

      const insertQuery = `
        INSERT INTO players (
          athlete_id, full_name, date_of_birth, school_id, email, contact_no,
          profile_photo_url, birth_cert_url, is_active,
          status, registration_method, interested_sports
        ) VALUES (
          generate_athlete_id(), $1, $2, $3, $4, $5, $6, $7, TRUE,
          'pending_verification', 'direct_registration', $8
        )
        RETURNING *;
      `;
      
      const values = [
        full_name.trim(), date_of_birth, school_id, email, phone,
        photo_url, birth_cert_url,
        JSON.stringify(interested_sports || [])
      ];
      
      const result = await pool.query(insertQuery, values);

      res.status(201).json({
        success: true,
        message: "Athlete registration submitted for verification.",
        athlete: result.rows[0]
      });

    } catch (err) {
      next(err);
    }
  }
);

// ========== 2. PROFILE CLAIM & ENHANCEMENT ==========

/**
 * @route   POST /api/athletes/claim
 * @desc    Claim athlete profile using secure claim code
 * @access  Public
 */
router.post(
  '/claim',
  generalLimiter,
  validateAthleteProfileClaim,
  async (req, res, next) => {
    try {
      const { claim_code, verification_method } = req.body;

      const athlete = await pool.query(
        "SELECT * FROM players WHERE claim_code = $1 AND status = 'pending_verification'",
        [claim_code]
      );

      if (athlete.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Invalid claim code or profile already claimed."
        });
      }

      // TODO: Send verification code via SMS/Email
      // const verificationCode = await sendVerificationCode(athlete.rows[0], verification_method);

      res.status(200).json({
        success: true,
        message: `Verification code sent via ${verification_method}.`,
        athlete_id: athlete.rows[0].athlete_id
      });

    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   PUT /api/athletes/:athleteId/profile
 * @desc    Update athlete profile (guardian/athlete enhanced profile)
 * @access  Private (Guardian/Athlete)
 */
router.put(
  '/:athleteId/profile',
  generalLimiter,
  protect,
  validateAthleteProfileUpdate,
  async (req, res, next) => {
    try {
      const { athleteId } = req.params;
      const {
        guardian_contacts,
        medical_notes,
        interested_sports,
        privacy_settings,
        emergency_contact
      } = req.body;

      const updateQuery = `
        UPDATE players SET
          guardian_contacts = $1,
          medical_notes = $2,
          interested_sports = $3,
          privacy_settings = $4,
          emergency_contact = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE athlete_id = $6
        RETURNING *;
      `;

      const values = [
        JSON.stringify(guardian_contacts),
        medical_notes,
        JSON.stringify(interested_sports),
        JSON.stringify(privacy_settings),
        JSON.stringify(emergency_contact),
        athleteId
      ];

      const result = await pool.query(updateQuery, values);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Athlete not found."
        });
      }

      res.status(200).json({
        success: true,
        message: "Athlete profile updated successfully.",
        athlete: result.rows[0]
      });

    } catch (err) {
      next(err);
    }
  }
);

// ========== 3. SPORTS & TEAMS ASSIGNMENT ==========

/**
 * @route   POST /api/athletes/:athleteId/sports
 * @desc    Assign athlete to sports/teams
 * @access  Private (SchoolAdmin/Coach)
 */
router.post(
  '/:athleteId/sports',
  generalLimiter,
  protect,
  checkRole(['SchoolAdmin', 'Coach']),
  validateSportsAssignment,
  async (req, res, next) => {
    try {
      const { athleteId } = req.params;
      const { sport_id, age_group, team_id, skill_level, position } = req.body;

      // Check if athlete exists and is verified
      const athlete = await pool.query(
        "SELECT * FROM players WHERE athlete_id = $1 AND status = 'verified'",
        [athleteId]
      );

      if (athlete.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Athlete not found or not verified."
        });
      }

      const assignmentQuery = `
        INSERT INTO athlete_sport_assignments (
          athlete_id, sport_id, age_group, team_id, skill_level, position, assigned_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (athlete_id, sport_id) 
        DO UPDATE SET
          age_group = EXCLUDED.age_group,
          team_id = EXCLUDED.team_id,
          skill_level = EXCLUDED.skill_level,
          position = EXCLUDED.position,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const values = [athleteId, sport_id, age_group, team_id, skill_level, position, req.user.id];
      const result = await pool.query(assignmentQuery, values);

      res.status(201).json({
        success: true,
        message: "Athlete assigned to sport successfully.",
        assignment: result.rows[0]
      });

    } catch (err) {
      next(err);
    }
  }
);

// ========== 4. BULK OPERATIONS ==========

/**
 * @route   POST /api/athletes/bulk-upload
 * @desc    Bulk upload athletes via CSV/Excel
 * @access  Private (SchoolAdmin)
 */
router.post(
  '/bulk-upload',
  generalLimiter,
  protect,
  checkRole(['SchoolAdmin']),
  validateBulkAthleteUpload,
  async (req, res, next) => {
    try {
      const { athletes, school_id, auto_generate_codes } = req.body;
      const created_by = req.user.id;
      
      const client = await pool.connect();
      await client.query('BEGIN');

      const results = [];
      const errors = [];

      for (let i = 0; i < athletes.length; i++) {
        const athlete = athletes[i];
        
        try {
          // Check for duplicates
          const exists = await client.query(
            "SELECT id FROM players WHERE LOWER(full_name)=LOWER($1) AND date_of_birth=$2 AND school_id=$3",
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

          const claim_code = auto_generate_codes ? await generateShortCode('CLAIM', 12) : null;

          const insertQuery = `
            INSERT INTO players (
              athlete_id, full_name, date_of_birth, school_id, gender, class,
              created_by, is_active, status, claim_code
            ) VALUES (
              generate_athlete_id(), $1, $2, $3, $4, $5, $6, TRUE, 'pending_verification', $7
            )
            RETURNING athlete_id, full_name, claim_code;
          `;
          
          const values = [
            athlete.full_name.trim(),
            athlete.date_of_birth,
            school_id,
            athlete.gender || null,
            athlete.class || null,
            created_by,
            claim_code
          ];
          
          const result = await client.query(insertQuery, values);
          results.push(result.rows[0]);

        } catch (error) {
          errors.push({
            row: i + 1,
            name: athlete.full_name,
            error: error.message
          });
        }
      }

      await client.query('COMMIT');
      client.release();

      res.status(201).json({
        success: true,
        message: `Bulk upload completed. ${results.length} athletes created, ${errors.length} errors.`,
        data: {
          successful: results,
          errors: errors,
          summary: {
            total: athletes.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });

    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      next(err);
    }
  }
);

// ========== 5. ATHLETE TRANSFER ==========

/**
 * @route   POST /api/athletes/transfer
 * @desc    Request athlete transfer between schools
 * @access  Private (Guardian/SchoolAdmin)
 */
router.post(
  '/transfer',
  generalLimiter,
  protect,
  validateAthleteTransfer,
  async (req, res, next) => {
    try {
      const {
        athlete_id,
        current_school_id,
        target_school_id,
        transfer_reason,
        guardian_approval,
        effective_date
      } = req.body;

      const transferQuery = `
        INSERT INTO athlete_transfers (
          athlete_id, current_school_id, target_school_id, transfer_reason,
          guardian_approval, effective_date, requested_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *;
      `;

      const values = [
        athlete_id,
        current_school_id,
        target_school_id,
        transfer_reason,
        guardian_approval,
        effective_date || null,
        req.user.id
      ];

      const result = await pool.query(transferQuery, values);

      res.status(201).json({
        success: true,
        message: "Transfer request submitted successfully.",
        transfer: result.rows[0]
      });

    } catch (err) {
      next(err);
    }
  }
);

// ========== 6. ATHLETE SEARCH & VERIFICATION ==========

/**
 * @route   GET /api/athletes/search
 * @desc    Search athletes with various filters
 * @access  Private
 */
router.get('/search', protect, async (req, res, next) => {
  try {
    const {
      query,
      school_id,
      sport,
      age_group,
      status,
      page = 1,
      limit = 25
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    let baseQuery = `
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
      LEFT JOIN athlete_sport_assignments asa ON p.athlete_id = asa.athlete_id
      LEFT JOIN sports sp ON asa.sport_id = sp.id
    `;

    if (query) {
      conditions.push(`(p.full_name ILIKE $${paramIndex} OR p.athlete_id ILIKE $${paramIndex})`);
      values.push(`%${query}%`);
      paramIndex++;
    }

    if (school_id) {
      conditions.push(`p.school_id = $${paramIndex}`);
      values.push(school_id);
      paramIndex++;
    }

    if (sport) {
      conditions.push(`sp.name ILIKE $${paramIndex}`);
      values.push(`%${sport}%`);
      paramIndex++;
    }

    if (age_group) {
      conditions.push(`asa.age_group = $${paramIndex}`);
      values.push(age_group);
      paramIndex++;
    }

    if (status) {
      conditions.push(`p.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Get total count
    const totalResult = await pool.query(`SELECT COUNT(DISTINCT p.id) ${baseQuery}`, values);
    const total = parseInt(totalResult.rows[0].count, 10);

    // Get athletes
    const athletesQuery = `
      SELECT DISTINCT
        p.athlete_id,
        p.full_name,
        p.date_of_birth,
        p.gender,
        p.class,
        p.status,
        s.name AS school_name,
        s.school_code,
        p.profile_photo_url,
        p.created_at
      ${baseQuery}
      ORDER BY p.full_name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(athletesQuery, [...values, limit, offset]);

    res.status(200).json({
      success: true,
      data: {
        athletes: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
