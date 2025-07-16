const { pool } = require('../config/db');
const { ApiResponse } = require('../utils/apiResponse');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const OpenAI = require('openai');

/**
 * @desc    Get all players for a school with comprehensive filtering
 * @route   GET /api/players
 * @access  Private (SchoolAdmin)
 */
exports.getPlayers = async (req, res) => {
  try {
    const schoolId = req.user?.school_id || 1; // Development fallback
    const { 
      page = 1, 
      limit = 20, 
      grade, 
      sport, 
      status, 
      verification_status, 
      search,
      sort_by = 'full_name',
      sort_order = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['school_id = $1'];
    let queryParams = [schoolId];
    let paramIndex = 2;

    // Apply filters
    if (grade && grade !== 'all') {
      whereConditions.push(`grade = $${paramIndex}`);
      queryParams.push(grade);
      paramIndex++;
    }

    if (sport && sport !== 'all') {
      whereConditions.push(`registered_sports ? $${paramIndex}`);
      queryParams.push(sport);
      paramIndex++;
    }

    if (status && status !== 'all') {
      whereConditions.push(`active_status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (verification_status && verification_status !== 'all') {
      whereConditions.push(`verification_status = $${paramIndex}`);
      queryParams.push(verification_status);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(full_name ILIKE $${paramIndex} OR full_name_nepali ILIKE $${paramIndex} OR guardian_name ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    const orderClause = `ORDER BY ${sort_by} ${sort_order}`;

    // Get players with pagination
    const playersQuery = `
      SELECT * FROM players 
      WHERE ${whereClause} 
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const { rows: players } = await pool.query(playersQuery, [...queryParams, limit, offset]);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM players WHERE ${whereClause}`;
    const { rows: countResult } = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult[0].total);

    ApiResponse.success(res, {
      players,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }, 'Players retrieved successfully');

  } catch (error) {
    console.error('Get players error:', error);
    ApiResponse.error(res, 'Failed to retrieve players', 500);
  }
};

/**
 * @desc    Create a new player with comprehensive data
 * @route   POST /api/players
 * @access  Private (SchoolAdmin)
 */
exports.createPlayer = async (req, res) => {
  try {
    const schoolId = req.user?.school_id || 1;
    const userId = req.user?.id || 1;
    
    const {
      // Core identification
      full_name,
      full_name_nepali,
      profile_photo_url,
      gender,
      date_of_birth,
      nationality = 'Nepali',
      citizenship_no,
      grade,
      section,
      
      // Guardian info
      guardian_name,
      relationship_to_player,
      guardian_phone,
      guardian_email,
      address,
      province,
      district,
      municipality_or_rural_municipality,
      ward_no,
      
      // School info
      admission_no,
      enrollment_status = 'Active',
      
      // Sports
      registered_sports = [],
      primary_sport,
      player_position = {},
      jersey_number = {},
      
      // Documents
      birth_certificate_url,
      citizenship_certificate_url,
      parent_national_id_url,
      parental_consent = false,
      
      // Health
      blood_group,
      medical_conditions = [],
      allergies = [],
      emergency_contact,
      
      // Profile extras
      nickname,
      bio,
      achievements = [],
      social_links = {}
    } = req.body;

    // Validation
    if (!full_name || !gender || !date_of_birth || !grade || !guardian_name || !guardian_phone || !address) {
      return ApiResponse.error(res, 'Missing required fields', 400);
    }

    const query = `
      INSERT INTO players (
        athlete_id, full_name, full_name_nepali, profile_photo_url, gender, date_of_birth,
        nationality, citizenship_no, grade, section, guardian_name, relationship_to_player,
        guardian_phone, guardian_email, address, province, district, 
        municipality_or_rural_municipality, ward_no, school_id, admission_no, enrollment_status,
        registered_sports, primary_sport, player_position, jersey_number, birth_certificate_url,
        citizenship_certificate_url, parent_national_id_url, parental_consent, blood_group,
        medical_conditions, allergies, emergency_contact, nickname, bio, achievements,
        social_links, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36,
        $37, $38, $39
      ) RETURNING *
    `;

    const values = [
      uuidv4(), full_name, full_name_nepali, profile_photo_url, gender, date_of_birth,
      nationality, citizenship_no, grade, section, guardian_name, relationship_to_player,
      guardian_phone, guardian_email, address, province, district,
      municipality_or_rural_municipality, ward_no, schoolId, admission_no, enrollment_status,
      JSON.stringify(registered_sports), primary_sport, JSON.stringify(player_position),
      JSON.stringify(jersey_number), birth_certificate_url, citizenship_certificate_url,
      parent_national_id_url, parental_consent, blood_group, JSON.stringify(medical_conditions),
      JSON.stringify(allergies), emergency_contact, nickname, bio, JSON.stringify(achievements),
      JSON.stringify(social_links), userId
    ];

    const { rows } = await pool.query(query, values);

    ApiResponse.success(res, rows[0], 'Player created successfully', 201);

  } catch (error) {
    console.error('Create player error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return ApiResponse.error(res, 'Player with this name and date of birth already exists for this school', 409);
    }
    ApiResponse.error(res, 'Failed to create player', 500);
  }
};
  try {
    const {
      full_name,
      dob,
      gender,
      father_name,
      mother_name,
      guardian_phone,
      guardian_email,
      address
    } = req.body;

    if (!full_name || !dob || !gender || !father_name || !guardian_phone)
      return res.status(400).json(apiResponse.error("Missing required fields.", 400));

    let photoFilename = null;
    let certFilename = null;
    if (req.files && req.files.photo) photoFilename = req.files.photo[0].filename;
    if (req.files && req.files.birthCertificate) certFilename = req.files.birthCertificate[0].filename;

    // Optional: Duplicate check logic here

    // Insert into DB
    const result = await pool.query(
      `INSERT INTO players (
        full_name, dob, gender, father_name, mother_name, guardian_phone, guardian_email, address, photo_url, birth_certificate_url, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING id`,
      [full_name, dob, gender, father_name, mother_name, guardian_phone, guardian_email, address, photoFilename, certFilename]
    );
    res.status(201).json(apiResponse.success(
      { player_id: result.rows[0].id }, 
      "Player registered successfully!"
    ));
  } catch (err) {
    console.error("Player registration error:", err);
    res.status(500).json(apiResponse.error("Server error during registration.", 500));
  }
};

// ========== 2. OCR WITH GPT-4o VISION HANDLER ==========

// Setup OpenAI client (requires OPENAI_API_KEY in your .env file)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OCR: Extract birth certificate data using GPT-4o Vision API.
 * Expects file field "certificate" (image/pdf).
 * Returns: { full_name, father_name, mother_name, dob_ad, dob_bs, address }
 */
exports.extractBirthCertificateData = async (req, res) => {
  try {
    // 1. Validate uploaded file
    if (!req.files || !req.files.certificate || !req.files.certificate[0]) {
      return res.status(400).json({ message: "No certificate file uploaded." });
    }
    const file = req.files.certificate[0];
    const filePath = file.path;
    const fileBuffer = fs.readFileSync(filePath);

    // 2. GPT-4o Vision API prompt
    const systemPrompt = `
You are an OCR assistant for Nepali birth certificates. 
Extract and return structured JSON data with the following keys:
- full_name (string)
- father_name (string)
- mother_name (string)
- dob_ad (string, YYYY-MM-DD)
- dob_bs (string, YYYY-MM-DD or Nepali format)
- address (string)

If any data is missing, use null. Only respond with JSON, no explanation.
`;

    // 3. Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      temperature: 0.0,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the birth certificate data from this image:" },
            { type: "image_file", image: fileBuffer }
          ]
        }
      ]
    });

    // 4. Parse JSON from GPT-4o output
    let data;
    try {
      data = JSON.parse(response.choices[0].message.content);
    } catch (e) {
      return res.status(500).json({ message: "Could not parse OCR response.", raw: response.choices[0].message.content });
    }

    res.json({
      message: "OCR extracted using GPT-4o.",
      data,
      file: { filePath, originalName: file.originalname }
    });
  } catch (err) {
    console.error("OCR extraction error:", err);
    res.status(500).json({ message: "Server error during OCR extraction.", error: err.message });
  }
};

/**
 * @desc    Get a single player by ID with full details
 * @route   GET /api/players/:id
 * @access  Private (SchoolAdmin)
 */
exports.getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user?.school_id || 1;

    const { rows } = await pool.query(
      'SELECT * FROM players WHERE id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (rows.length === 0) {
      return ApiResponse.error(res, 'Player not found', 404);
    }

    ApiResponse.success(res, rows[0], 'Player retrieved successfully');

  } catch (error) {
    console.error('Get player by ID error:', error);
    ApiResponse.error(res, 'Failed to retrieve player', 500);
  }
};

/**
 * @desc    Update a player with comprehensive data
 * @route   PUT /api/players/:id
 * @access  Private (SchoolAdmin)
 */
exports.updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user?.school_id || 1;
    
    // Check if player exists and belongs to school
    const existingPlayer = await pool.query(
      'SELECT * FROM players WHERE id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (existingPlayer.rows.length === 0) {
      return ApiResponse.error(res, 'Player not found', 404);
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Helper function to add field to update
    const addField = (fieldName, value) => {
      if (value !== undefined) {
        updateFields.push(`${fieldName} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    };

    // Add all possible fields from request body
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      
      // Handle JSONB fields
      if (['registered_sports', 'player_position', 'jersey_number', 'medical_conditions', 'allergies', 'achievements', 'social_links'].includes(key)) {
        addField(key, JSON.stringify(value));
      } else {
        addField(key, value);
      }
    });

    if (updateFields.length === 0) {
      return ApiResponse.error(res, 'No fields to update', 400);
    }

    const query = `
      UPDATE players 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND school_id = $${paramIndex + 1}
      RETURNING *
    `;

    values.push(id, schoolId);

    const { rows } = await pool.query(query, values);

    ApiResponse.success(res, rows[0], 'Player updated successfully');

  } catch (error) {
    console.error('Update player error:', error);
    if (error.code === '23505') {
      return ApiResponse.error(res, 'Player with this name and date of birth already exists for this school', 409);
    }
    ApiResponse.error(res, 'Failed to update player', 500);
  }
};

/**
 * @desc    Delete a player
 * @route   DELETE /api/players/:id
 * @access  Private (SchoolAdmin)
 */
exports.deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user?.school_id || 1;

    const { rows } = await pool.query(
      'DELETE FROM players WHERE id = $1 AND school_id = $2 RETURNING *',
      [id, schoolId]
    );

    if (rows.length === 0) {
      return ApiResponse.error(res, 'Player not found', 404);
    }

    ApiResponse.success(res, null, 'Player deleted successfully');

  } catch (error) {
    console.error('Delete player error:', error);
    ApiResponse.error(res, 'Failed to delete player', 500);
  }
};

/**
 * @desc    Get player statistics and analytics
 * @route   GET /api/players/statistics
 * @access  Private (SchoolAdmin)
 */
exports.getPlayerStatistics = async (req, res) => {
  try {
    const schoolId = req.user?.school_id || 1;

    const queries = await Promise.all([
      // Total players
      pool.query('SELECT COUNT(*) as total FROM players WHERE school_id = $1', [schoolId]),
      
      // By gender
      pool.query(`
        SELECT gender, COUNT(*) as count 
        FROM players 
        WHERE school_id = $1 
        GROUP BY gender
      `, [schoolId]),
      
      // By grade
      pool.query(`
        SELECT grade, COUNT(*) as count 
        FROM players 
        WHERE school_id = $1 
        GROUP BY grade 
        ORDER BY grade
      `, [schoolId]),
      
      // By status
      pool.query(`
        SELECT active_status, COUNT(*) as count 
        FROM players 
        WHERE school_id = $1 
        GROUP BY active_status
      `, [schoolId]),
      
      // Profile completion average
      pool.query(`
        SELECT AVG(profile_completion) as avg_completion 
        FROM players 
        WHERE school_id = $1
      `, [schoolId])
    ]);

    const statistics = {
      total: parseInt(queries[0].rows[0].total),
      byGender: queries[1].rows,
      byGrade: queries[2].rows,
      byStatus: queries[3].rows,
      averageProfileCompletion: Math.round(queries[4].rows[0].avg_completion || 0)
    };

    ApiResponse.success(res, statistics, 'Player statistics retrieved successfully');

  } catch (error) {
    console.error('Get statistics error:', error);
    ApiResponse.error(res, 'Failed to retrieve statistics', 500);
  }
};

// Keep existing functions for backward compatibility
exports.registerPlayer = exports.createPlayer;
