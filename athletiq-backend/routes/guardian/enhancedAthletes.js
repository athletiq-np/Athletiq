const express = require('express');
const router = express.Router();
// NOTE: This guardian-specific enhanced athletes route is DEPRECATED.
// New implementations should use /api/enhanced-athletes (src/routes/enhancedAthleteRoutes.js)
// with unified sendResponse + documented Swagger schemas. This file remains temporarily
// for backward compatibility with existing guardian portal calls and will be removed
// after frontend migration is complete.
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const rateLimit = require('express-rate-limit');
const sharp = require('sharp');
const { body, validationResult } = require('express-validator');
const pool = require('../../src/config/db');
const authenticateGuardian = require('../../middleware/guardianAuth');
const { 
  processOCRDocument, 
  validateOCRResults,
  calculateConfidenceScore,
  mapOCRFieldsToAthlete 
} = require('../../src/services/ai/ocrService');
const { 
  generateAthleteId,
  calculateProfileCompletion,
  validateAthleteData 
} = require('../../services/athleteService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (file.fieldname === 'profile_photo') {
      uploadPath = 'uploads/athlete-photos';
    } else if (file.fieldname === 'birth_certificate') {
      uploadPath = 'uploads/birth-certificates';
    } else {
      uploadPath = 'uploads/documents';
    }

    // Ensure directory exists
  // create directory async (fire and forget, minimal impact if race)
  fsp.mkdir(uploadPath, { recursive: true }).catch(()=>{});
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'profile_photo') {
      // Only allow images for profile photos
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Profile photo must be an image file'));
      }
    } else if (file.fieldname === 'birth_certificate') {
      // Allow images and PDFs for birth certificates
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Birth certificate must be an image or PDF file'));
      }
    } else {
      cb(null, true);
    }
  }
});

// Validation rules for athlete registration
const athleteValidation = [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('date_of_birth').isDate().withMessage('Valid date of birth is required'),
  body('gender').isIn(['Male', 'Female']).withMessage('Valid gender is required'),
  body('grade').notEmpty().withMessage('Grade is required'),
  body('school_id').isInt().withMessage('Valid school selection is required'),
  body('guardian_name').notEmpty().withMessage('Guardian name is required'),
  body('relationship_to_player').notEmpty().withMessage('Relationship is required'),
  body('guardian_phone').notEmpty().withMessage('Guardian phone is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('province').notEmpty().withMessage('Province is required'),
  body('district').notEmpty().withMessage('District is required')
];

// Standard response helper
function sendResponse(res, { success=true, status=200, message='', data=null, errors=null, meta=null }) {
  return res.status(status).json({ success, message, data, errors, meta });
}

// Field mapping middleware (frontend -> backend contract)
function mapAthleteRequest(req, _res, next) {
  // relationship field alias
  if (!req.body.relationship_to_player && req.body.guardian_relationship) {
    req.body.relationship_to_player = req.body.guardian_relationship;
  }
  // school handling: allow school_name only scenarios (fallback) but still require ID for validation
  if (!req.body.school_id && req.body.school_name && !isNaN(parseInt(req.body.school_name_id))) {
    req.body.school_id = parseInt(req.body.school_name_id);
  }
  next();
}

// Basic rate limiter for OCR & upload heavy endpoints
const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Rate limit exceeded for OCR/Upload operations' }
});

/**
 * @route POST /api/guardian/athletes
 * @desc Create new athlete with comprehensive data collection
 * @access Guardian Protected
 */
router.post('/athletes', 
  authenticateGuardian,
  upload.fields([
    { name: 'profile_photo', maxCount: 1 },
    { name: 'birth_certificate', maxCount: 1 }
  ]),
  mapAthleteRequest,
  athleteValidation,
  async (req, res) => {
  // Soft deprecation header so clients can see migration path
  res.set('Deprecation', 'true');
  res.set('Link', '</api/enhanced-athletes/register/guardian>; rel="successor-version"');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendResponse(res, { success: false, status: 400, message: 'Validation failed', errors: errors.array() });
      }

      const guardianId = req.guardian.id;
      const athleteData = req.body;
      const files = req.files;

      // Generate unique athlete ID
      const athleteId = await generateAthleteId();

      // Process profile photo if uploaded
      let profilePhotoUrl = null;
      if (files.profile_photo && files.profile_photo[0]) {
        profilePhotoUrl = await processProfilePhoto(files.profile_photo[0]);
      }

      // Process birth certificate if uploaded
      let birthCertificateUrl = null;
      let ocrResults = null;
      if (files.birth_certificate && files.birth_certificate[0]) {
        birthCertificateUrl = files.birth_certificate[0].path;
        
        // Process OCR if it's an image
        if (files.birth_certificate[0].mimetype.startsWith('image/')) {
          try {
            ocrResults = await processOCRDocument(files.birth_certificate[0].path);
            
            // Validate OCR results against form data
            const validationResults = validateOCRResults(ocrResults, athleteData);
            if (validationResults.hasConflicts) {
              console.log('OCR validation conflicts:', validationResults.conflicts);
            }
          } catch (ocrError) {
            console.error('OCR processing failed:', ocrError);
            // Continue without OCR - don't fail the entire registration
          }
        }
      }

      // Calculate profile completion percentage
      const profileCompletion = calculateProfileCompletion(athleteData, {
        hasProfilePhoto: !!profilePhotoUrl,
        hasBirthCertificate: !!birthCertificateUrl,
        hasOCRData: !!ocrResults
      });

      // Prepare athlete data for database
      const dbAthleteData = {
        athlete_id: athleteId,
        guardian_id: guardianId,
        full_name: athleteData.full_name,
        full_name_nepali: athleteData.full_name_nepali || null,
        profile_photo_url: profilePhotoUrl,
        date_of_birth: athleteData.date_of_birth,
        gender: athleteData.gender,
        nationality: athleteData.nationality || 'Nepali',
        citizenship_no: athleteData.citizenship_no || null,
        
        // Academic Information
        grade: athleteData.grade,
        section: athleteData.section || null,
        school_id: athleteData.school_id,
        
        // Guardian Information
        guardian_name: athleteData.guardian_name,
        relationship_to_player: athleteData.relationship_to_player,
        guardian_phone: athleteData.guardian_phone,
        guardian_email: athleteData.guardian_email || null,
        
        // Address Information
        address: athleteData.address,
        province: athleteData.province,
        district: athleteData.district,
        municipality_or_rural_municipality: athleteData.municipality_or_rural_municipality || null,
        ward_no: athleteData.ward_no || null,
        
        // Physical Information
        height_cm: athleteData.height_cm || null,
        weight_kg: athleteData.weight_kg || null,
        blood_group: athleteData.blood_group || null,
        
        // Sports Information
        registered_sports: JSON.stringify(athleteData.registered_sports || []),
        primary_sport: athleteData.primary_sport || null,
        
        // Document Information
        birth_certificate_url: birthCertificateUrl,
        birth_certificate_verified: false,
        
        // OCR extracted data
        father_name: athleteData.father_name || (ocrResults?.father_name) || null,
        mother_name: athleteData.mother_name || (ocrResults?.mother_name) || null,
        birth_certificate_no: athleteData.birth_certificate_no || (ocrResults?.certificate_number) || null,
        birth_certificate_date: athleteData.birth_certificate_date || (ocrResults?.issue_date) || null,
        birth_certificate_office: athleteData.birth_certificate_office || (ocrResults?.issuing_office) || null,
        
        // Medical Information
        medical_conditions: JSON.stringify(athleteData.medical_conditions || []),
        allergies: JSON.stringify(athleteData.allergies || []),
        emergency_contact: athleteData.emergency_contact || athleteData.guardian_phone,
        medical_notes: athleteData.medical_notes || null,
        
        // System fields
        profile_completion: profileCompletion,
        profile_status: profileCompletion >= 80 ? 'Complete' : 'Incomplete',
        verification_status: 'pending',
        document_verified: false,
        requires_manual_review: ocrResults ? (ocrResults.confidence < 0.8) : false,
        is_active: true
      };

      // Insert athlete into database
      const insertQuery = `
        INSERT INTO players (
          athlete_id, guardian_id, full_name, full_name_nepali, profile_photo_url,
          date_of_birth, gender, nationality, citizenship_no, grade, section, school_id,
          guardian_name, relationship_to_player, guardian_phone, guardian_email,
          address, province, district, municipality_or_rural_municipality, ward_no,
          height_cm, weight_kg, blood_group, registered_sports, primary_sport,
          birth_certificate_url, birth_certificate_verified, father_name, mother_name,
          birth_certificate_no, birth_certificate_date, birth_certificate_office,
          medical_conditions, allergies, emergency_contact, medical_notes,
          profile_completion, profile_status, verification_status, document_verified,
          requires_manual_review, is_active, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, NOW(), NOW()
        )
        RETURNING id, athlete_id, full_name, profile_completion, verification_status
      `;

      const insertValues = [
        dbAthleteData.athlete_id, dbAthleteData.guardian_id, dbAthleteData.full_name,
        dbAthleteData.full_name_nepali, dbAthleteData.profile_photo_url, dbAthleteData.date_of_birth,
        dbAthleteData.gender, dbAthleteData.nationality, dbAthleteData.citizenship_no,
        dbAthleteData.grade, dbAthleteData.section, dbAthleteData.school_id,
        dbAthleteData.guardian_name, dbAthleteData.relationship_to_player, dbAthleteData.guardian_phone,
        dbAthleteData.guardian_email, dbAthleteData.address, dbAthleteData.province,
        dbAthleteData.district, dbAthleteData.municipality_or_rural_municipality, dbAthleteData.ward_no,
        dbAthleteData.height_cm, dbAthleteData.weight_kg, dbAthleteData.blood_group,
        dbAthleteData.registered_sports, dbAthleteData.primary_sport, dbAthleteData.birth_certificate_url,
        dbAthleteData.birth_certificate_verified, dbAthleteData.father_name, dbAthleteData.mother_name,
        dbAthleteData.birth_certificate_no, dbAthleteData.birth_certificate_date, dbAthleteData.birth_certificate_office,
        dbAthleteData.medical_conditions, dbAthleteData.allergies, dbAthleteData.emergency_contact,
        dbAthleteData.medical_notes, dbAthleteData.profile_completion, dbAthleteData.profile_status,
        dbAthleteData.verification_status, dbAthleteData.document_verified, dbAthleteData.requires_manual_review,
        dbAthleteData.is_active
      ];

      const result = await client.query(insertQuery, insertValues);
      const newAthlete = result.rows[0];

      // Store OCR processing results if available
      if (ocrResults) {
        await storeOCRProcessingResults(client, newAthlete.id, ocrResults, files.birth_certificate[0]);
      }

      // Log athlete creation activity
      await logAthleteActivity(client, newAthlete.id, guardianId, 'athlete_created', {
        profile_completion: profileCompletion,
        has_profile_photo: !!profilePhotoUrl,
        has_birth_certificate: !!birthCertificateUrl,
        ocr_processed: !!ocrResults
      });

      await client.query('COMMIT');

      sendResponse(res, {
        status: 201,
        message: 'Athlete registered successfully',
        data: {
          athlete: newAthlete,
          profile_completion: profileCompletion,
          ocr_processed: !!ocrResults,
          requires_manual_review: dbAthleteData.requires_manual_review
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Athlete registration error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          if (file.path) {
            fsp.unlink(file.path).catch(()=>{});
          }
        });
      }

      sendResponse(res, {
        success: false,
        status: 500,
        message: 'Failed to register athlete',
        errors: process.env.NODE_ENV === 'development' ? [{ msg: error.message }] : null
      });
    } finally {
      client.release();
    }
  }
);

/**
 * @route GET /api/guardian/schools
 * @desc Get all schools for selection
 * @access Guardian Protected
 */
router.get('/schools', authenticateGuardian, async (req, res) => {
  try {
    const { search, province, district } = req.query;
    
    let query = `
      SELECT id, school_id, school_code, name, address, province, district, 
             latitude, longitude, phone, email, is_active
      FROM schools 
      WHERE is_active = true
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR school_code ILIKE $${paramCount} OR address ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (province) {
      paramCount++;
      query += ` AND province = $${paramCount}`;
      params.push(province);
    }

    if (district) {
      paramCount++;
      query += ` AND district = $${paramCount}`;
      params.push(district);
    }

    query += ` ORDER BY name ASC LIMIT 100`;

    try {
      const result = await pool.query(query, params);

      if (result.rows.length > 0) {
        return sendResponse(res, {
          message: 'Schools fetched successfully',
          data: { schools: result.rows, total: result.rows.length }
        });
      }

      // Return mock schools if no results from database
      const mockSchools = generateMockSchools(search);
      return sendResponse(res, {
        message: 'Schools fetched successfully (mock)',
        data: { schools: mockSchools, total: mockSchools.length, is_mock: true }
      });
    } catch (dbError) {
      console.error('Database error, using mock schools:', dbError);
      // Return mock schools if database error
      const mockSchools = generateMockSchools(search);
      return sendResponse(res, {
        message: 'Schools fetched successfully (mock fallback)',
        data: { schools: mockSchools, total: mockSchools.length, is_mock: true },
        meta: { fallback: 'database_error' }
      });
    }

  } catch (error) {
    console.error('Schools fetch error:', error);
    return sendResponse(res, {
      success: false,
      status: 500,
      message: 'Failed to fetch schools',
      errors: process.env.NODE_ENV === 'development' ? [{ msg: error.message }] : null
    });
  }
});

/**
 * @route POST /api/guardian/schools/search
 * @desc Search for school in database or suggest adding new one
 * @access Guardian Protected
 */
router.post('/schools/search', authenticateGuardian, async (req, res) => {
  try {
    const { name, address, place_id } = req.body;

    // Search for existing school
    const existingSchool = await pool.query(`
      SELECT id, school_id, school_code, name, address, latitude, longitude
      FROM schools 
      WHERE name ILIKE $1 OR address ILIKE $2 OR google_place_id = $3
      LIMIT 1
    `, [`%${name}%`, `%${address}%`, place_id]);

    if (existingSchool.rows.length > 0) {
      return sendResponse(res, {
        message: 'School found',
        data: { school: existingSchool.rows[0], found: true }
      });
    }

    // School not found, could suggest adding
    return sendResponse(res, {
      message: 'School not found',
      data: {
        school: null,
        found: false,
        suggestion: {
          name,
          address,
          place_id,
          message: 'School not in database. Contact admin to request addition.'
        }
      }
    });

  } catch (error) {
    console.error('School search error:', error);
    return sendResponse(res, {
      success: false,
      status: 500,
      message: 'Failed to search schools',
      errors: process.env.NODE_ENV === 'development' ? [{ msg: error.message }] : null
    });
  }
});

/**
 * @route POST /api/guardian/ocr/birth-certificate-test
 * @desc Test OCR endpoint without authentication
 * @access Public (for testing)
 */
router.post('/ocr/birth-certificate-test', ocrLimiter, upload.single('birth_certificate'), async (req, res) => {
  try {
    console.log('🔍 OCR Test endpoint called');
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'Birth certificate image is required'
      });
    }

    console.log('📁 File received:', req.file.originalname, req.file.mimetype);

    // Check if it's an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are supported for OCR processing'
      });
    }

    // Return mock OCR data for testing
    const mockOcrData = {
      full_name: 'Ram Bahadur Sharma',
      full_name_english: 'Ram Bahadur Sharma',
      full_name_nepali: 'राम बहादुर शर्मा',
      date_of_birth: '2000-05-15',
      gender: 'Male',
      citizenship_number: '12-45-67-89012',
      nationality: 'Nepali',
      father_name: 'Krishna Bahadur Sharma',
      mother_name: 'Sita Kumari Sharma',
      birth_place: 'Kathmandu, Nepal'
    };

    console.log('✅ Returning mock OCR data:', mockOcrData);

    sendResponse(res, {
      message: 'Birth certificate processed successfully (TEST MODE)',
      data: {
        ...mockOcrData,
        is_mock: true,
        confidence_scores: {
          name: 0.89,
          date_of_birth: 0.92,
          gender: 0.85,
          citizenship_number: 0.87
        }
      }
    });

  } catch (error) {
    console.error('Test OCR processing error:', error);
    sendResponse(res, {
      success: false,
      status: 500,
      message: 'Failed to process birth certificate (test mode)',
      errors: process.env.NODE_ENV === 'development' ? [{ msg: error.message }] : null
    });
  }
});

// Mock school generator for testing
function generateMockSchools(searchTerm = '') {
  const schoolTypes = ['School', 'Higher Secondary School', 'English School', 'Academy', 'Model School', 'Public School'];
  const prefixes = ['Shree', 'New', 'Modern', 'Trinity', 'Nepal', 'Bright', 'Global', 'Future'];
  const locations = [
    { district: 'Kathmandu', province: 'Bagmati Province' },
    { district: 'Lalitpur', province: 'Bagmati Province' },
    { district: 'Bhaktapur', province: 'Bagmati Province' },
    { district: 'Pokhara', province: 'Gandaki Province' },
    { district: 'Chitwan', province: 'Bagmati Province' },
    { district: 'Butwal', province: 'Lumbini Province' },
    { district: 'Dharan', province: 'Province 1' },
    { district: 'Birgunj', province: 'Madhesh Province' }
  ];

  const mockSchools = [];
  const baseNames = searchTerm ? [searchTerm] : ['Kathmandu', 'Lalitpur', 'Nepal', 'Modern', 'Trinity', 'Global'];

  baseNames.forEach((baseName, index) => {
    schoolTypes.forEach((type, typeIndex) => {
      if (mockSchools.length < 10) { // Limit to 10 schools
        const location = locations[Math.floor(Math.random() * locations.length)];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const usePrefix = Math.random() > 0.5;
        
        const schoolName = usePrefix ? `${prefix} ${baseName} ${type}` : `${baseName} ${type}`;
        
        mockSchools.push({
          id: index * 10 + typeIndex + 1000, // Unique ID starting from 1000
          school_id: `SCH${1000 + index * 10 + typeIndex}`,
          school_code: `${baseName.substring(0, 3).toUpperCase()}${typeIndex + 1}`,
          name: schoolName,
          address: `Ward ${Math.floor(Math.random() * 35) + 1}, ${location.district}, ${location.province}`,
          province: location.province,
          district: location.district,
          latitude: 27.7172 + (Math.random() - 0.5) * 0.1, // Around Kathmandu
          longitude: 85.3240 + (Math.random() - 0.5) * 0.1,
          phone: `01-${Math.floor(Math.random() * 9000000) + 1000000}`,
          email: `info@${baseName.toLowerCase().replace(/\s+/g, '')}school.edu.np`,
          is_active: true
        });
      }
    });
  });

  return mockSchools;
}

// Helper functions

/**
 * Process and optimize profile photo
 */
async function processProfilePhoto(file) {
  try {
    const outputPath = file.path.replace(path.extname(file.path), '_optimized.jpg');
    
    await sharp(file.path)
      .resize(400, 400, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 85,
        progressive: true
      })
      .toFile(outputPath);

    // Remove original file
    if (file?.path) {
      fsp.unlink(file.path).catch(()=>{});
    }

    return outputPath;
  } catch (error) {
    console.error('Photo processing error:', error);
    return file.path; // Return original if processing fails
  }
}

/**
 * Store OCR processing results
 */
async function storeOCRProcessingResults(client, athleteId, ocrResults, file) {
  try {
    // Store in athlete_documents table
    await client.query(`
      INSERT INTO athlete_documents (
        athlete_id, document_type, file_path, file_name, file_size,
        ocr_processed, ocr_confidence, ocr_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      athleteId,
      'birth_certificate',
      file.path,
      file.originalname,
      file.size,
      true,
      ocrResults.confidence || 0,
      JSON.stringify(ocrResults)
    ]);

    // Store field verifications
    if (ocrResults.fields) {
      for (const [fieldName, fieldData] of Object.entries(ocrResults.fields)) {
        await client.query(`
          INSERT INTO field_verifications (
            athlete_id, field_name, extracted_value, confidence,
            requires_verification, verification_status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          athleteId,
          fieldName,
          fieldData.value,
          fieldData.confidence || 0,
          fieldData.confidence < 0.8,
          'pending'
        ]);
      }
    }

    console.log('OCR results stored successfully for athlete:', athleteId);
  } catch (error) {
    console.error('Error storing OCR results:', error);
    // Don't throw - OCR storage failure shouldn't fail the entire registration
  }
}

/**
 * Log athlete activity
 */
async function logAthleteActivity(client, athleteId, guardianId, activityType, metadata = {}) {
  try {
    await client.query(`
      INSERT INTO athlete_activity_logs (
        athlete_id, guardian_id, activity_type, metadata, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `, [athleteId, guardianId, activityType, JSON.stringify(metadata)]);
  } catch (error) {
    console.error('Error logging athlete activity:', error);
    // Don't throw - logging failure shouldn't fail the main operation
  }
}

module.exports = router;
