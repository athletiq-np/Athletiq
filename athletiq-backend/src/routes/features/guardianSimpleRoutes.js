// src/routes/guardianSimpleRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const GuardianRegistrationService = require('../../services/guardianRegistrationService');
const pool = require('../../config/db');
const { 
  convertBSToAD, 
  convertNepaliNumeralsToEnglish, 
  parseNepaliAddress, 
  normalizeGender,
  assessExtractionConfidence 
} = require('../../utils/nepaliDateConverter');

const router = express.Router();
const guardianService = new GuardianRegistrationService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

// Middleware to verify JWT token
const authenticateGuardian = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const guardian = await pool.query('SELECT * FROM guardians WHERE id = $1', [decoded.guardianId]);
    
    if (guardian.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    req.guardian = guardian.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * @route POST /api/guardian-simple/register
 * @desc Register new guardian account
 */
router.post('/register', async (req, res) => {
  try {
    console.log('=== Guardian Registration Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      fullName, 
      email, 
      phone, 
      password, 
      address, 
      relationship,
      // Optional child-related fields (for future use)
      schoolName,
      schoolId,
      studentName,
      dateOfBirth
    } = req.body;

    console.log('Extracted fields:', { 
      fullName, 
      email, 
      phone, 
      password: password ? '[REDACTED]' : 'missing', 
      address, 
      relationship,
      schoolName,
      schoolId,
      studentName,
      dateOfBirth
    });

    // Validation
    if (!fullName || !email || !phone || !password) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Full name, email, phone, and password are required'
      });
    }

    const result = await guardianService.registerGuardian({
      fullName,
      email,
      phone,
      password,
      address,
      relationship
    });

    if (result.success) {
      // If student information was provided during registration, create a pending athlete record
      if (studentName && dateOfBirth && schoolName) {
        try {
          console.log('Creating pending athlete during registration...');
          const childResult = await guardianService.addChildToAccount({
            guardianId: result.data.guardianId,
            childFullName: studentName,
            dateOfBirth: dateOfBirth,
            gender: '', // Not provided during registration
            grade: '', // Not provided during registration
            schoolName: schoolName,
            schoolId: schoolId || null,
            additionalInfo: { createdDuringRegistration: true }
          });
          
          console.log('Child registration result:', childResult.success ? 'Success' : 'Failed');
          console.log('Child data:', childResult.data ? `ID: ${childResult.data.id}` : 'No data');
        } catch (childError) {
          console.error('Failed to create child record during registration:', childError);
          // Don't fail the guardian registration if child creation fails
        }
      }
      // Generate JWT token for auto-login after registration
      const token = jwt.sign(
        { guardianId: result.data.guardianId, email: email },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      console.log('Generated token for auto-login:', token ? 'Yes' : 'No');

      // Return success with token for auto-login
      const responseData = {
        success: true,
        data: {
          token,
          guardian: {
            id: result.data.guardianId,
            fullName: result.data.fullName,
            email: result.data.email,
            phone: result.data.phone,
            accountStatus: result.data.accountStatus
          }
        },
        message: result.message
      };

      console.log('Sending registration response:', JSON.stringify(responseData, null, 2));
      res.status(201).json(responseData);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Guardian registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/guardian-simple/login
 * @desc Guardian login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Get guardian from database
    const guardianQuery = 'SELECT * FROM guardians WHERE email = $1';
    const guardianResult = await pool.query(guardianQuery, [email]);

    if (guardianResult.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const guardian = guardianResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, guardian.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { guardianId: guardian.id, email: guardian.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        guardian: {
          id: guardian.id,
          fullName: guardian.full_name,
          email: guardian.email,
          phone: guardian.phone,
          accountStatus: guardian.account_status,
          emailVerified: guardian.email_verified
        }
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Guardian login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/guardian-simple/add-child
 * @desc Add child to guardian account
 */
router.post('/add-child', authenticateGuardian, async (req, res) => {
  try {
    const { childFullName, dateOfBirth, gender, grade, schoolName, schoolId, additionalInfo } = req.body;

    if (!childFullName || !dateOfBirth || !gender || !schoolName) {
      return res.status(400).json({
        success: false,
        message: 'Child name, date of birth, gender, and school name are required'
      });
    }

    const result = await guardianService.addChildToAccount({
      guardianId: req.guardian.id,
      childFullName,
      dateOfBirth,
      gender,
      grade,
      schoolName,
      schoolId,
      additionalInfo
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/guardian-simple/children
 * @desc Get guardian's children
 */
router.get('/children', authenticateGuardian, async (req, res) => {
  try {
    console.log('=== Get Children Request ===');
    console.log('Guardian ID:', req.guardian.id);
    
    const result = await guardianService.getGuardianChildren(req.guardian.id);
    
    console.log('Children result:', JSON.stringify(result, null, 2));
    res.json(result);

  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/guardian-simple/schools
 * @desc Get list of schools for dropdown
 */
router.get('/schools', async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT DISTINCT 
        COALESCE(s.name, p.school_name) as school_name,
        COUNT(p.id) as student_count,
        s.id as school_id
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE COALESCE(s.name, p.school_name) IS NOT NULL
    `;
    
    let params = [];
    
    if (search) {
      query += ` AND LOWER(COALESCE(s.name, p.school_name)) LIKE LOWER($1)`;
      params.push(`%${search}%`);
    }
    
    query += `
      GROUP BY COALESCE(s.name, p.school_name), s.id
      ORDER BY student_count DESC, school_name ASC
      LIMIT 50
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      message: 'Schools list retrieved successfully'
    });

  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/guardian-simple/profile
 * @desc Get guardian profile
 */
router.get('/profile', authenticateGuardian, async (req, res) => {
  try {
    const guardian = { ...req.guardian };
    delete guardian.password_hash; // Remove sensitive data

    res.json({
      success: true,
      data: guardian,
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/guardian-simple/child/:childId
 * @desc Update child information
 */
router.put('/child/:childId', authenticateGuardian, async (req, res) => {
  try {
    const { childId } = req.params;
    const { fullName, dateOfBirth, gender, grade, schoolName, schoolId, additionalInfo } = req.body;

    // Verify the child belongs to this guardian
    const childCheck = await pool.query(
      'SELECT id FROM guardian_children WHERE id = $1 AND guardian_id = $2',
      [childId, req.guardian.id]
    );

    if (childCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or access denied'
      });
    }

    // Update child information
    const updateQuery = `
      UPDATE guardian_children 
      SET 
        full_name = COALESCE($1, full_name),
        date_of_birth = COALESCE($2, date_of_birth),
        gender = COALESCE($3, gender),
        grade = COALESCE($4, grade),
        school_name = COALESCE($5, school_name),
        school_id = COALESCE($6, school_id),
        updated_at = NOW()
      WHERE id = $7 AND guardian_id = $8
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      fullName, dateOfBirth, gender, grade, schoolName, schoolId, childId, req.guardian.id
    ]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Child information updated successfully'
    });

  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/guardian-simple/athlete-profile/:id
 * @desc Get complete athlete profile
 */
router.get('/athlete-profile/:id', authenticateGuardian, async (req, res) => {
  try {
    const athleteId = req.params.id;
    const guardianId = req.guardian.id;

    // Verify this athlete belongs to the guardian
    const athleteResult = await pool.query(`
      SELECT 
        p.*,
        s.name as school_name 
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE p.id = $1 AND p.guardian_id = $2
    `, [athleteId, guardianId]);

    if (athleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found or access denied'
      });
    }

    const athlete = athleteResult.rows[0];

    // Get uploaded documents
    const documentsResult = await pool.query(`
      SELECT document_type, file_path, original_name, upload_date
      FROM athlete_documents 
      WHERE athlete_id = $1
      ORDER BY upload_date DESC
    `, [athleteId]);

    const documents = documentsResult.rows.map(doc => ({
      type: doc.document_type,
      name: doc.original_name,
      path: doc.file_path,
      uploadDate: doc.upload_date
    }));

    // Parse sports interests if stored as JSON
    let sportsInterests = [];
    try {
      sportsInterests = athlete.sports_interests ? JSON.parse(athlete.sports_interests) : [];
    } catch (e) {
      sportsInterests = [];
    }

    const profileData = {
      // Basic info
      id: athlete.id,
      fullName: athlete.full_name,
      dateOfBirth: athlete.date_of_birth,
      gender: athlete.gender,
      grade: athlete.grade,
      schoolName: athlete.school_name,
      schoolId: athlete.school_id,
      
      // Extended profile
      address: athlete.address,
      nationality: athlete.nationality,
      blood_group: athlete.blood_group,
      height: athlete.height,
      weight: athlete.weight,
      emergency_contact: athlete.emergency_contact,
      medical_conditions: athlete.medical_conditions,
      sports_interests: sportsInterests,
      achievements: athlete.achievements,
      
      // Status info
      verification_status: athlete.verification_status,
      athlete_id: athlete.nepal_athlete_id,
      
      // Documents
      documents: documents
    };

    res.json({
      success: true,
      data: profileData,
      message: 'Athlete profile retrieved successfully'
    });

  } catch (error) {
    console.error('Get athlete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve athlete profile',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/guardian-simple/athlete-profile/:id
 * @desc Update complete athlete profile
 */
router.put('/athlete-profile/:id', authenticateGuardian, async (req, res) => {
  try {
    const athleteId = req.params.id;
    const guardianId = req.guardian.id;
    
    const {
      fullName, dateOfBirth, gender, grade, schoolName, schoolId,
      address, nationality, bloodGroup, height, weight, emergencyContact,
      medicalConditions, sportsInterests, achievements
    } = req.body;

    // Verify this athlete belongs to the guardian
    const verifyResult = await pool.query(
      'SELECT id FROM players WHERE id = $1 AND guardian_id = $2',
      [athleteId, guardianId]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found or access denied'
      });
    }

    // Normalize grade
    let normalizedGrade = grade || '1';
    if (typeof normalizedGrade === 'string') {
      const gradeMatch = normalizedGrade.match(/\d+/);
      if (gradeMatch) {
        normalizedGrade = gradeMatch[0];
      }
    }

    // Convert JSON fields properly
    const sportsInterestsJson = JSON.stringify(sportsInterests || []);
    const medicalConditionsJson = JSON.stringify(medicalConditions ? [medicalConditions] : []);
    const achievementsJson = JSON.stringify(achievements ? [achievements] : []);

    // Update athlete profile
    const updateResult = await pool.query(`
      UPDATE players SET
        full_name = $1,
        date_of_birth = $2,
        gender = $3,
        grade = $4,
        school_name = $5,
        school_id = $6,
        address = $7,
        nationality = $8,
        blood_group = $9,
        height = $10,
        weight = $11,
        emergency_contact = $12,
        medical_conditions = $13,
        sports_interests = $14,
        achievements = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16 AND guardian_id = $17
      RETURNING *
    `, [
      fullName, dateOfBirth, gender, normalizedGrade, schoolName, schoolId,
      address, nationality, bloodGroup, height, weight, emergencyContact,
      medicalConditionsJson, sportsInterestsJson, achievementsJson,
      athleteId, guardianId
    ]);

    if (updateResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update athlete profile'
      });
    }

    res.json({
      success: true,
      data: updateResult.rows[0],
      message: 'Athlete profile updated successfully'
    });

  } catch (error) {
    console.error('Update athlete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update athlete profile',
      error: error.message
    });
  }
});

/**
 * @route POST /api/guardian-simple/process-birth-certificate
 * @desc Process Nepali birth certificate using OpenAI GPT Vision with comprehensive field extraction and auto-population
 */
router.post('/process-birth-certificate', authenticateGuardian, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file uploaded'
      });
    }

    const { athleteId } = req.body;
    const filePath = req.file.path;
    const fs = require('fs');
    
    // Read file as base64
    const fileBuffer = fs.readFileSync(filePath);
    
    // Check if this is a test file (JSON) for development/testing
    let extractedData;
    const isTestFile = req.file.originalname.toLowerCase().includes('test') || 
                      req.file.mimetype === 'application/json' ||
                      filePath.endsWith('.json');
    
    if (isTestFile) {
      console.log('🧪 Test mode detected - using mock OCR data');
      try {
        // For test files, read the JSON content directly
        const testData = JSON.parse(fileBuffer.toString());
        
        // Convert test data to the expected format
        extractedData = {
          childName: {
            nepali: testData.full_name_nepali || "राम बहादुर शर्मा",
            english: testData.full_name_english || "Ram Bahadur Sharma"
          },
          dateOfBirth: {
            bikramSambat: testData.birth_date_nepali || "२०६५-०३-१५",
            gregorian: testData.birth_date_english || "2008-06-30"
          },
          placeOfBirth: {
            province: testData.birth_place_province || "बागमती प्रदेश",
            district: testData.birth_place_district || "काठमाडौं",
            municipality: testData.birth_place_municipality || "काठमाडौं महानगरपालिका",
            wardNumber: testData.birth_place_ward || "५",
            village: null
          },
          gender: testData.gender === "पुरुष" ? "Male" : (testData.gender === "महिला" ? "Female" : testData.gender),
          fatherName: {
            nepali: testData.father_name || "श्याम बहादुर शर्मा",
            english: "Shyam Bahadur Sharma"
          },
          motherName: {
            nepali: testData.mother_name || "सीता देवी शर्मा",
            english: "Sita Devi Sharma"
          },
          grandfatherName: {
            nepali: testData.grandfather_name || "हरि प्रसाद शर्मा",
            english: "Hari Prasad Sharma"
          },
          permanentAddress: {
            province: testData.birth_place_province || "बागमती प्रदेश",
            district: testData.birth_place_district || "काठमाडौं", 
            municipality: testData.birth_place_municipality || "काठमाडौं महानगरपालिका",
            wardNumber: testData.birth_place_ward || "५",
            tole: null
          },
          fatherCitizenship: testData.father_citizenship_no || "15-01-65-12345",
          motherCitizenship: testData.mother_citizenship_no || "15-01-67-56789",
          birthCertificateNumber: testData.birth_certificate_no || "BC-2065-KTM-001234",
          registrationDate: {
            bikramSambat: "२०६५-०३-२०",
            gregorian: "2008-07-05"
          },
          issuingOffice: "काठमाडौं जिल्ला प्रशासन कार्यालय",
          confidence: {
            overall: 0.98,
            uncertainFields: []
          }
        };
        
        console.log('✅ Test OCR data processed successfully');
        
      } catch (error) {
        console.error('❌ Failed to parse test data:', error);
        throw new Error('Invalid test data format');
      }
      
    } else {
      // Real OCR processing for actual images
      const base64Image = fileBuffer.toString('base64');
    
    // Enhanced OCR prompt for comprehensive Nepali birth certificate extraction
    const ocrPrompt = `You are an expert OCR system specialized in extracting data from Nepali birth certificates. 
Extract ALL the following fields in the exact JSON format specified below.

REQUIRED FIELDS TO EXTRACT:
1. Child's Full Name (both Nepali Devanagari and English if present)
2. Date of Birth (both Bikram Sambat BS and Gregorian AD - convert if needed)
3. Place of Birth (Province, District, Municipality/Rural Municipality, Ward Number)
4. Gender (Male/Female/Other)
5. Father's Name (Nepali and English)
6. Mother's Name (Nepali and English)
7. Grandfather's Name (if present)
8. Permanent Address (Province, District, Municipality, Ward, Tole/Village)
9. Father/Mother Citizenship Number (if present)
10. Birth Registration Number/Certificate Number
11. Registration Date (BS and AD)
12. Issuing Office Name

IMPORTANT CONVERSION RULES:
- If date is only in BS (Bikram Sambat), convert to AD (Gregorian)
- Extract both scripts when available (Nepali Devanagari and English)
- For uncertain/missing fields, use null values
- Convert common Nepali terms: पुरुष=Male, महिला=Female, बागमती=Bagmati, etc.

Return ONLY this JSON structure:
{
  "childName": {
    "nepali": "नेपाली नाम",
    "english": "English Name"
  },
  "dateOfBirth": {
    "bikramSambat": "२०७१-०४-१७",
    "gregorian": "2014-08-02"
  },
  "placeOfBirth": {
    "province": "बागमती प्रदेश",
    "district": "काठमाण्डौ",
    "municipality": "काठमाण्डौ महानगरपालिका",
    "wardNumber": "७",
    "village": null
  },
  "gender": "Male",
  "fatherName": {
    "nepali": "पिताको नाम",
    "english": "Father Name"
  },
  "motherName": {
    "nepali": "आमाको नाम", 
    "english": "Mother Name"
  },
  "grandfatherName": {
    "nepali": "बाजेको नाम",
    "english": "Grandfather Name"
  },
  "permanentAddress": {
    "province": "बागमती प्रदेश",
    "district": "काठमाण्डौ",
    "municipality": "काठमाण्डौ महानगरपालिका",
    "wardNumber": "७",
    "tole": "टोल/गाउँ"
  },
  "parentCitizenship": {
    "fatherCitizenshipNo": "23456789",
    "motherCitizenshipNo": null
  },
  "registrationDetails": {
    "registrationNumber": "56789",
    "registrationDate": {
      "bikramSambat": "२०७१-०४-२०",
      "gregorian": "2014-08-05"
    },
    "issuingOffice": "वडा कार्यालय, काठमाडौं"
  },
  "extractionConfidence": {
    "overall": 0.95,
    "uncertainFields": []
  }
}

Extract all data accurately from the birth certificate image.`;
    
    // Call OpenAI GPT Vision API with enhanced prompt
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: ocrPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${req.file.mimetype};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1 // Low temperature for precise extraction
      })
    });

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || !openaiData.choices[0]) {
      throw new Error('Invalid response from OCR service');
    }

    // Parse the extracted data
    let extractedData;
    try {
      const content = openaiData.choices[0].message.content;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
        
        // Post-process the extracted data with utility functions
        if (extractedData.dateOfBirth) {
          // Convert BS to AD if needed
          if (extractedData.dateOfBirth.bikramSambat && !extractedData.dateOfBirth.gregorian) {
            extractedData.dateOfBirth.gregorian = convertBSToAD(extractedData.dateOfBirth.bikramSambat);
          }
          
          // Convert numerals in dates
          if (extractedData.dateOfBirth.bikramSambat) {
            extractedData.dateOfBirth.bikramSambat = convertNepaliNumeralsToEnglish(extractedData.dateOfBirth.bikramSambat);
          }
        }
        
        // Normalize gender
        if (extractedData.gender) {
          extractedData.gender = normalizeGender(extractedData.gender);
        }
        
        // Parse addresses
        if (extractedData.placeOfBirth && typeof extractedData.placeOfBirth === 'string') {
          extractedData.placeOfBirth = parseNepaliAddress(extractedData.placeOfBirth);
        }
        
        if (extractedData.permanentAddress && typeof extractedData.permanentAddress === 'string') {
          extractedData.permanentAddress = parseNepaliAddress(extractedData.permanentAddress);
        }
        
        // Convert numerals in ward numbers
        if (extractedData.placeOfBirth?.wardNumber) {
          extractedData.placeOfBirth.wardNumber = convertNepaliNumeralsToEnglish(extractedData.placeOfBirth.wardNumber);
        }
        
        if (extractedData.permanentAddress?.wardNumber) {
          extractedData.permanentAddress.wardNumber = convertNepaliNumeralsToEnglish(extractedData.permanentAddress.wardNumber);
        }
        
        // Convert citizenship numbers
        if (extractedData.parentCitizenship?.fatherCitizenshipNo) {
          extractedData.parentCitizenship.fatherCitizenshipNo = convertNepaliNumeralsToEnglish(extractedData.parentCitizenship.fatherCitizenshipNo);
        }
        
        if (extractedData.parentCitizenship?.motherCitizenshipNo) {
          extractedData.parentCitizenship.motherCitizenshipNo = convertNepaliNumeralsToEnglish(extractedData.parentCitizenship.motherCitizenshipNo);
        }
        
        // Convert registration numbers and dates
        if (extractedData.registrationDetails?.registrationNumber) {
          extractedData.registrationDetails.registrationNumber = convertNepaliNumeralsToEnglish(extractedData.registrationDetails.registrationNumber);
        }
        
        if (extractedData.registrationDetails?.registrationDate?.bikramSambat) {
          const bsRegDate = extractedData.registrationDetails.registrationDate.bikramSambat;
          extractedData.registrationDetails.registrationDate.bikramSambat = convertNepaliNumeralsToEnglish(bsRegDate);
          
          if (!extractedData.registrationDetails.registrationDate.gregorian) {
            extractedData.registrationDetails.registrationDate.gregorian = convertBSToAD(bsRegDate);
          }
        }
        
        // Assess extraction confidence
        const confidenceAssessment = assessExtractionConfidence(extractedData);
        extractedData.extractionConfidence = confidenceAssessment;
        
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse OCR response:', parseError);
      // Enhanced fallback structure for Nepali birth certificates
      extractedData = {
        childName: { nepali: null, english: null },
        dateOfBirth: { bikramSambat: null, gregorian: null },
        placeOfBirth: { province: null, district: null, municipality: null, wardNumber: null, village: null },
        gender: null,
        fatherName: { nepali: null, english: null },
        motherName: { nepali: null, english: null },
        grandfatherName: { nepali: null, english: null },
        permanentAddress: { province: null, district: null, municipality: null, wardNumber: null, tole: null },
        parentCitizenship: { fatherCitizenshipNo: null, motherCitizenshipNo: null },
        registrationDetails: { registrationNumber: null, registrationDate: { bikramSambat: null, gregorian: null }, issuingOffice: null },
        extractionConfidence: { overall: 0.0, uncertainFields: ["All fields - parsing failed"] },
        error: "OCR parsing failed",
        rawResponse: content
      };
    }
    
    } // End of else block for real OCR processing

    // AUTO-POPULATION AND CROSS-CHECKING LOGIC
    let crossCheckResults = {
      matches: [],
      discrepancies: [],
      newFields: [],
      autoPopulated: false
    };

    // If athleteId is provided, perform cross-checking and auto-population
    if (athleteId) {
      try {
        // Get existing athlete data
        const existingAthleteResult = await pool.query(`
          SELECT * FROM players WHERE id = $1 AND guardian_id = $2
        `, [athleteId, req.guardian.id]);

        if (existingAthleteResult.rows.length > 0) {
          const existingAthlete = existingAthleteResult.rows[0];
          
          // FIELD MAPPING AND CROSS-CHECKING
          const fieldMappings = [
            {
              certificateField: extractedData.childName?.english || extractedData.childName?.nepali,
              dbField: existingAthlete.full_name,
              fieldName: 'Full Name',
              dbColumn: 'full_name'
            },
            {
              certificateField: extractedData.childName?.nepali,
              dbField: existingAthlete.full_name_nepali,
              fieldName: 'Full Name (Nepali)',
              dbColumn: 'full_name_nepali'
            },
            {
              certificateField: extractedData.dateOfBirth?.gregorian,
              dbField: existingAthlete.date_of_birth?.toISOString()?.split('T')[0],
              fieldName: 'Date of Birth',
              dbColumn: 'date_of_birth'
            },
            {
              certificateField: extractedData.gender,
              dbField: existingAthlete.gender,
              fieldName: 'Gender',
              dbColumn: 'gender'
            },
            {
              certificateField: extractedData.permanentAddress?.province,
              dbField: existingAthlete.province,
              fieldName: 'Province',
              dbColumn: 'province'
            },
            {
              certificateField: extractedData.permanentAddress?.district,
              dbField: existingAthlete.district,
              fieldName: 'District',
              dbColumn: 'district'
            },
            {
              certificateField: extractedData.permanentAddress?.municipality,
              dbField: existingAthlete.municipality_or_rural_municipality,
              fieldName: 'Municipality',
              dbColumn: 'municipality_or_rural_municipality'
            },
            {
              certificateField: extractedData.permanentAddress?.wardNumber,
              dbField: existingAthlete.ward_no,
              fieldName: 'Ward Number',
              dbColumn: 'ward_no'
            },
            {
              certificateField: 'Nepali',
              dbField: existingAthlete.nationality,
              fieldName: 'Nationality',
              dbColumn: 'nationality'
            },
            {
              certificateField: extractedData.registrationDetails?.registrationNumber,
              dbField: existingAthlete.citizenship_no,
              fieldName: 'Birth Certificate Number',
              dbColumn: 'citizenship_no'
            }
          ];

          // Perform cross-checking
          const autoPopulationUpdates = {};
          
          fieldMappings.forEach(mapping => {
            if (mapping.certificateField && mapping.dbField) {
              // Check for exact matches
              if (mapping.certificateField.toString().toLowerCase() === mapping.dbField.toString().toLowerCase()) {
                crossCheckResults.matches.push({
                  field: mapping.fieldName,
                  value: mapping.certificateField,
                  status: 'VERIFIED'
                });
              } else {
                // Check for partial matches or discrepancies
                crossCheckResults.discrepancies.push({
                  field: mapping.fieldName,
                  certificateValue: mapping.certificateField,
                  existingValue: mapping.dbField,
                  status: 'DISCREPANCY',
                  recommendation: 'Manual review required'
                });
              }
            } else if (mapping.certificateField && !mapping.dbField) {
              // New field that can be auto-populated
              crossCheckResults.newFields.push({
                field: mapping.fieldName,
                value: mapping.certificateField,
                status: 'AUTO_POPULATE'
              });
              autoPopulationUpdates[mapping.dbColumn] = mapping.certificateField;
            }
          });

          // AUTO-POPULATE NEW FIELDS
          if (Object.keys(autoPopulationUpdates).length > 0) {
            const updateFields = [];
            const updateValues = [];
            let paramCounter = 1;

            // Build dynamic update query
            Object.entries(autoPopulationUpdates).forEach(([column, value]) => {
              updateFields.push(`${column} = $${paramCounter}`);
              updateValues.push(value);
              paramCounter++;
            });

            // Add special fields from birth certificate
            if (extractedData.fatherName?.english || extractedData.fatherName?.nepali) {
              updateFields.push(`father_name = $${paramCounter}`);
              updateValues.push(extractedData.fatherName?.english || extractedData.fatherName?.nepali);
              paramCounter++;
            }

            if (extractedData.motherName?.english || extractedData.motherName?.nepali) {
              updateFields.push(`mother_name = $${paramCounter}`);
              updateValues.push(extractedData.motherName?.english || extractedData.motherName?.nepali);
              paramCounter++;
            }

            if (extractedData.grandfatherName?.english || extractedData.grandfatherName?.nepali) {
              updateFields.push(`grandfather_name = $${paramCounter}`);
              updateValues.push(extractedData.grandfatherName?.english || extractedData.grandfatherName?.nepali);
              paramCounter++;
            }

            // Add birth certificate path
            updateFields.push(`birth_certificate_path = $${paramCounter}`);
            updateValues.push(req.file.path);
            paramCounter++;

            // Mark as document verified
            updateFields.push(`document_verified = $${paramCounter}`);
            updateValues.push(true);
            paramCounter++;

            // Update profile completion percentage
            updateFields.push(`profile_completion_percentage = $${paramCounter}`);
            updateValues.push(Math.min(100, (existingAthlete.profile_completion_percentage || 0) + 25));
            paramCounter++;

            // Add athlete ID and guardian ID for WHERE clause
            updateValues.push(athleteId, req.guardian.id);

            const updateQuery = `
              UPDATE players SET 
                ${updateFields.join(', ')},
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $${paramCounter - 1} AND guardian_id = $${paramCounter}
              RETURNING *
            `;

            const updateResult = await pool.query(updateQuery, updateValues);
            
            if (updateResult.rows.length > 0) {
              crossCheckResults.autoPopulated = true;
              crossCheckResults.updatedAthlete = updateResult.rows[0];
            }
          }
        }
      } catch (autoPopulationError) {
        console.error('Auto-population error:', autoPopulationError);
        crossCheckResults.error = 'Failed to auto-populate athlete profile';
      }
    } // End of if (athleteId) block

    // Save document record to database
    try {
      const documentRecord = await pool.query(`
        INSERT INTO athlete_documents 
        (athlete_id, document_type, file_path, original_name, mime_type, file_size, uploaded_by, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        athleteId || null,
        'birth_certificate',
        req.file.path,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.guardian.id,
        extractedData.extractionConfidence?.overall >= 0.8
      ]);

      extractedData.documentId = documentRecord.rows[0].id;
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Continue without saving to DB if it fails
    }

    // Keep file for manual review if confidence is low
    const shouldKeepFile = extractedData.extractionConfidence?.overall < 0.8;
    
    if (!shouldKeepFile) {
      // Clean up the temporary file
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      data: {
        extractedData,
        crossCheckResults,
        filePath: shouldKeepFile ? req.file.path : null,
        originalName: req.file.originalname,
        processingTimestamp: new Date().toISOString(),
        requiresManualReview: shouldKeepFile || crossCheckResults.discrepancies.length > 0,
        autoPopulated: crossCheckResults.autoPopulated,
        verificationStatus: {
          overallConfidence: extractedData.extractionConfidence?.overall || 0,
          fieldsMatched: crossCheckResults.matches.length,
          discrepancies: crossCheckResults.discrepancies.length,
          newFieldsPopulated: crossCheckResults.newFields.length
        }
      },
      message: crossCheckResults.autoPopulated 
        ? 'Birth certificate processed and athlete profile auto-populated successfully'
        : 'Birth certificate processed successfully with comprehensive data extraction'
    });

  } catch (error) {
    console.error('Birth certificate OCR error:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        require('fs').unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process Nepali birth certificate',
      error: error.message,
      details: error.response?.data || null
    });
  }
});

/**
 * @route POST /api/guardian-simple/upload-documents
 * @desc Upload athlete documents (profile photo, birth certificate, etc.)
 */
router.post('/upload-documents', authenticateGuardian, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 }
]), async (req, res) => {
  try {
    const { athleteId } = req.body;
    const guardianId = req.guardian.id;

    if (!athleteId) {
      return res.status(400).json({
        success: false,
        message: 'Athlete ID is required'
      });
    }

    // Verify athlete belongs to guardian
    const verifyResult = await pool.query(
      'SELECT id FROM players WHERE id = $1 AND guardian_id = $2',
      [athleteId, guardianId]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found or access denied'
      });
    }

    const uploadedDocs = [];

    // Process profile photo
    if (req.files.profilePhoto && req.files.profilePhoto[0]) {
      const profilePhoto = req.files.profilePhoto[0];
      
      // Save to database
      const docResult = await pool.query(`
        INSERT INTO athlete_documents (athlete_id, document_type, file_path, original_name, mime_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [athleteId, 'profile_photo', profilePhoto.path, profilePhoto.originalname, profilePhoto.mimetype]);

      uploadedDocs.push({
        type: 'profile_photo',
        name: profilePhoto.originalname,
        path: profilePhoto.path
      });

      // Update player record with profile photo path
      await pool.query(
        'UPDATE players SET profile_photo = $1 WHERE id = $2',
        [profilePhoto.path, athleteId]
      );
    }

    // Process birth certificate
    if (req.files.birthCertificate && req.files.birthCertificate[0]) {
      const birthCert = req.files.birthCertificate[0];
      
      // Save to database
      const docResult = await pool.query(`
        INSERT INTO athlete_documents (athlete_id, document_type, file_path, original_name, mime_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [athleteId, 'birth_certificate', birthCert.path, birthCert.originalname, birthCert.mimetype]);

      uploadedDocs.push({
        type: 'birth_certificate',
        name: birthCert.originalname,
        path: birthCert.path
      });
    }

    res.json({
      success: true,
      data: {
        documents: uploadedDocs
      },
      message: 'Documents uploaded successfully'
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
});

/**
 * @route POST /api/guardian-simple/test-birth-certificate
 * @desc Test endpoint for birth certificate field matching using mock data
 */
router.post('/test-birth-certificate', authenticateGuardian, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file uploaded'
      });
    }

    const { athleteId } = req.body;
    const filePath = req.file.path;
    const fs = require('fs');
    
    console.log('🧪 Processing test birth certificate for field matching...');
    
    // Read the test JSON file 
    const fileBuffer = fs.readFileSync(filePath);
    const testData = JSON.parse(fileBuffer.toString());
    
    // Convert test data to the expected OCR format
    const extractedData = {
      childName: {
        nepali: testData.full_name_nepali || "राम बहादुर शर्मा",
        english: testData.full_name_english || "Ram Bahadur Sharma"
      },
      dateOfBirth: {
        bikramSambat: testData.birth_date_nepali || "२०६५-०३-१५",
        gregorian: testData.birth_date_english || "2008-06-30"
      },
      placeOfBirth: {
        province: testData.birth_place_province || "बागमती प्रदेश",
        district: testData.birth_place_district || "काठमाडौं",
        municipality: testData.birth_place_municipality || "काठमाडौं महानगरपालिका",
        wardNumber: testData.birth_place_ward?.replace('वडा नं. ', '') || "५",
        village: null
      },
      gender: testData.gender === "पुरुष" ? "Male" : (testData.gender === "महिला" ? "Female" : testData.gender),
      fatherName: {
        nepali: testData.father_name || "श्याम बहादुर शर्मा",
        english: "Shyam Bahadur Sharma"
      },
      motherName: {
        nepali: testData.mother_name || "सीता देवी शर्मा",
        english: "Sita Devi Sharma"
      },
      grandfatherName: {
        nepali: testData.grandfather_name || "हरि प्रसाद शर्मा",
        english: "Hari Prasad Sharma"
      },
      permanentAddress: {
        province: testData.birth_place_province || "बागमती प्रदेश",
        district: testData.birth_place_district || "काठमाडौं", 
        municipality: testData.birth_place_municipality || "काठमाडौं महानगरपालिका",
        wardNumber: testData.birth_place_ward?.replace('वडा नं. ', '') || "५",
        tole: null
      },
      fatherCitizenship: testData.father_citizenship_no || "15-01-65-12345",
      motherCitizenship: testData.mother_citizenship_no || "15-01-67-56789",
      birthCertificateNumber: testData.birth_certificate_no || "BC-2065-KTM-001234",
      registrationDate: {
        bikramSambat: "२०६५-०३-२०",
        gregorian: "2008-07-05"
      },
      issuingOffice: "काठमाडौं जिल्ला प्रशासन कार्यालय",
      confidence: {
        overall: 0.98,
        uncertainFields: []
      }
    };
    
    console.log('✅ Test OCR data processed successfully');
    
    // Get current athlete data for comparison
    const currentAthleteResult = await pool.query(`
      SELECT * FROM players WHERE id = $1 AND guardian_id = $2
    `, [athleteId, req.guardian.id]);
    
    if (currentAthleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found or access denied'
      });
    }
    
    const currentAthlete = currentAthleteResult.rows[0];
    
    // Field mapping between OCR data and database fields
    const fieldMappings = [
      {
        field: 'full_name_english',
        certificateValue: extractedData.childName.english,
        existingValue: currentAthlete.full_name,
        dbColumn: 'full_name'
      },
      {
        field: 'full_name_nepali',
        certificateValue: extractedData.childName.nepali,
        existingValue: currentAthlete.full_name_nepali,
        dbColumn: 'full_name_nepali'
      },
      {
        field: 'father_name',
        certificateValue: extractedData.fatherName.nepali,
        existingValue: currentAthlete.father_name,
        dbColumn: 'father_name'
      },
      {
        field: 'mother_name', 
        certificateValue: extractedData.motherName.nepali,
        existingValue: currentAthlete.mother_name,
        dbColumn: 'mother_name'
      },
      {
        field: 'grandfather_name',
        certificateValue: extractedData.grandfatherName.nepali,
        existingValue: currentAthlete.grandfather_name,
        dbColumn: 'grandfather_name'
      },
      {
        field: 'birth_certificate_no',
        certificateValue: extractedData.birthCertificateNumber,
        existingValue: currentAthlete.birth_certificate_no,
        dbColumn: 'birth_certificate_no'
      },
      {
        field: 'father_citizenship_no',
        certificateValue: extractedData.fatherCitizenship,
        existingValue: currentAthlete.father_citizenship_no,
        dbColumn: 'father_citizenship_no'
      },
      {
        field: 'birth_place_district',
        certificateValue: extractedData.placeOfBirth.district,
        existingValue: currentAthlete.birth_place_district,
        dbColumn: 'birth_place_district'
      },
      {
        field: 'birth_place_municipality',
        certificateValue: extractedData.placeOfBirth.municipality,
        existingValue: currentAthlete.birth_place_municipality,
        dbColumn: 'birth_place_municipality'
      },
      {
        field: 'date_of_birth',
        certificateValue: extractedData.dateOfBirth.gregorian,
        existingValue: currentAthlete.date_of_birth,
        dbColumn: 'date_of_birth'
      }
    ];
    
    // Analyze field discrepancies and auto-population opportunities
    const discrepancies = [];
    const autoPopulatedFields = [];
    let fieldsExtracted = 0;
    let fieldsMatched = 0;
    
    for (const mapping of fieldMappings) {
      if (mapping.certificateValue) {
        fieldsExtracted++;
        
        if (!mapping.existingValue || mapping.existingValue === '') {
          // Field is empty, can auto-populate
          autoPopulatedFields.push({
            field: mapping.field,
            value: mapping.certificateValue,
            action: 'auto_populated'
          });
        } else if (mapping.existingValue !== mapping.certificateValue) {
          // Discrepancy detected
          discrepancies.push({
            field: mapping.field,
            certificateValue: mapping.certificateValue,
            existingValue: mapping.existingValue,
            confidence: 0.95
          });
        } else {
          // Values match
          fieldsMatched++;
        }
      }
    }
    
    // Auto-populate empty fields
    const updateFields = [];
    const updateValues = [];
    let updateIndex = 1;
    
    for (const field of autoPopulatedFields) {
      const mapping = fieldMappings.find(m => m.field === field.field);
      if (mapping && mapping.dbColumn) {
        updateFields.push(`${mapping.dbColumn} = $${updateIndex}`);
        updateValues.push(field.value);
        updateIndex++;
      }
    }
    
    if (updateFields.length > 0) {
      // Update athlete profile with auto-populated fields
      updateValues.push(athleteId); // Add athleteId for WHERE clause
      const updateQuery = `
        UPDATE players 
        SET ${updateFields.join(', ')},
            birth_certificate_verified = TRUE,
            ocr_confidence_score = $${updateIndex},
            profile_completion_percentage = (
              SELECT ROUND(
                (COUNT(CASE WHEN value IS NOT NULL AND value != '' THEN 1 END) * 100.0) / 15
              ) FROM (
                VALUES 
                  (full_name), (full_name_nepali), (father_name), (mother_name),
                  (birth_certificate_no), (date_of_birth), (gender), (grade),
                  (school_name), (address), (nationality), (sports_interests),
                  (emergency_contact), (height), (weight)
              ) AS profile_fields(value)
            ),
            updated_at = NOW()
        WHERE id = $${updateIndex + 1}
        RETURNING *
      `;
      
      updateValues.push(extractedData.confidence.overall); // OCR confidence
      await pool.query(updateQuery, updateValues);
    }
    
    // Create field verification records
    for (const mapping of fieldMappings) {
      if (mapping.certificateValue) {
        const status = !mapping.existingValue ? 'auto_populated' : 
                      mapping.existingValue === mapping.certificateValue ? 'verified' : 'discrepancy';
        
        await pool.query(`
          INSERT INTO field_verifications 
          (athlete_id, field_name, certificate_value, existing_value, verification_status, confidence_score, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          athleteId,
          mapping.field,
          mapping.certificateValue,
          mapping.existingValue,
          status,
          0.95
        ]);
      }
    }
    
    // Create OCR processing log
    await pool.query(`
      INSERT INTO ocr_processing_logs 
      (athlete_id, guardian_id, ocr_confidence, processing_time_ms, fields_extracted, 
       fields_matched, fields_discrepancies, auto_populated, requires_manual_review, processed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [
      athleteId,
      req.guardian.id,
      extractedData.confidence.overall,
      250, // Mock processing time
      fieldsExtracted,
      fieldsMatched,
      discrepancies.length,
      autoPopulatedFields.length > 0,
      discrepancies.length > 0
    ]);
    
    res.json({
      success: true,
      data: {
        fieldsExtracted,
        fieldsMatched,
        discrepancies,
        autoPopulated: autoPopulatedFields.length > 0,
        populatedFields: autoPopulatedFields,
        requiresManualReview: discrepancies.length > 0,
        ocrConfidence: extractedData.confidence.overall,
        processingTime: 250
      },
      message: 'Birth certificate processed and field matching completed successfully'
    });

  } catch (error) {
    console.error('Test birth certificate processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process test birth certificate',
      error: error.message
    });
  }
});

/**
 * @route GET /api/guardian-simple/athletes/:athleteId/field-verifications
 * @desc Get field verification records for an athlete
 */
router.get('/athletes/:athleteId/field-verifications', authenticateGuardian, async (req, res) => {
  try {
    const { athleteId } = req.params;
    const guardianId = req.guardian.id;

    // Verify the athlete belongs to this guardian
    const athleteCheck = await pool.query(
      'SELECT id FROM players WHERE id = $1 AND guardian_id = $2',
      [athleteId, guardianId]
    );

    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found or access denied'
      });
    }

    // Get field verification records
    const verificationsResult = await pool.query(`
      SELECT 
        fv.*,
        ad.document_type,
        ad.original_name as document_name
      FROM field_verifications fv
      LEFT JOIN athlete_documents ad ON fv.document_id = ad.id
      WHERE fv.athlete_id = $1
      ORDER BY fv.created_at DESC
    `, [athleteId]);

    // Get OCR processing logs
    const ocrLogsResult = await pool.query(`
      SELECT 
        opl.*,
        ad.document_type,
        ad.original_name as document_name
      FROM ocr_processing_logs opl
      LEFT JOIN athlete_documents ad ON opl.document_id = ad.id
      WHERE opl.athlete_id = $1
      ORDER BY opl.processed_at DESC
      LIMIT 10
    `, [athleteId]);

    res.json({
      success: true,
      data: {
        verifications: verificationsResult.rows,
        ocrLogs: ocrLogsResult.rows,
        summary: {
          totalVerifications: verificationsResult.rows.length,
          pendingVerifications: verificationsResult.rows.filter(v => v.verification_status === 'pending').length,
          verifiedFields: verificationsResult.rows.filter(v => v.verification_status === 'verified').length,
          discrepancies: verificationsResult.rows.filter(v => v.verification_status === 'discrepancy').length
        }
      },
      message: 'Field verifications retrieved successfully'
    });

  } catch (error) {
    console.error('Get field verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve field verifications',
      error: error.message
    });
  }
});

/**
 * @route POST /api/guardian-simple/athletes/:athleteId/verify-field
 * @desc Verify a specific field discrepancy
 */
router.post('/athletes/:athleteId/verify-field', authenticateGuardian, async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { fieldId, action, correctedValue, notes } = req.body;
    const guardianId = req.guardian.id;

    // Verify the athlete belongs to this guardian
    const athleteCheck = await pool.query(
      'SELECT id FROM players WHERE id = $1 AND guardian_id = $2',
      [athleteId, guardianId]
    );

    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found or access denied'
      });
    }

    // Update field verification status
    const updateResult = await pool.query(`
      UPDATE field_verifications 
      SET 
        verification_status = $1,
        verified_by = $2,
        verified_at = NOW(),
        notes = $3
      WHERE id = $4 AND athlete_id = $5
      RETURNING *
    `, [action, guardianId, notes, fieldId, athleteId]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Field verification record not found'
      });
    }

    const verification = updateResult.rows[0];

    // If action is to use certificate value, update the athlete profile
    if (action === 'use_certificate' && verification.certificate_value) {
      const fieldMapping = {
        'full_name_nepali': 'full_name_nepali',
        'father_name': 'father_name',
        'mother_name': 'mother_name',
        'birth_certificate_no': 'birth_certificate_no',
        'birth_place_district': 'birth_place_district',
        'father_citizenship_no': 'father_citizenship_no'
      };

      const dbField = fieldMapping[verification.field_name];
      if (dbField) {
        await pool.query(`
          UPDATE players 
          SET ${dbField} = $1, updated_at = NOW()
          WHERE id = $2
        `, [verification.certificate_value, athleteId]);
      }
    }

    // If action is to use corrected value, update both verification and athlete profile
    if (action === 'use_corrected' && correctedValue) {
      const fieldMapping = {
        'full_name_nepali': 'full_name_nepali',
        'father_name': 'father_name',
        'mother_name': 'mother_name',
        'birth_certificate_no': 'birth_certificate_no',
        'birth_place_district': 'birth_place_district',
        'father_citizenship_no': 'father_citizenship_no'
      };

      const dbField = fieldMapping[verification.field_name];
      if (dbField) {
        await pool.query(`
          UPDATE players 
          SET ${dbField} = $1, updated_at = NOW()
          WHERE id = $2
        `, [correctedValue, athleteId]);

        // Update the verification record with corrected value
        await pool.query(`
          UPDATE field_verifications 
          SET certificate_value = $1
          WHERE id = $2
        `, [correctedValue, fieldId]);
      }
    }

    res.json({
      success: true,
      data: verification,
      message: 'Field verification updated successfully'
    });

  } catch (error) {
    console.error('Verify field error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify field',
      error: error.message
    });
  }
});

module.exports = router;
