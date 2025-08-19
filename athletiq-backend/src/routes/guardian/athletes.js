const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const { createLogger } = require('../../utils/logger');
const { authenticateGuardian } = require('../../middlewares/guardianAuth');
const { validateInput } = require('../../middlewares/validation');

const logger = createLogger('guardian-athletes');

// Validation schemas
const athleteRegistrationSchema = {
  full_name: { required: true, minLength: 2 },
  father_name: { required: true, minLength: 2 },
  mother_name: { required: true, minLength: 2 },
  date_of_birth: { required: true, type: 'date' },
  grade: { required: true, type: 'number', min: 1, max: 12 },
  school: { required: true, type: 'object' }
};

const searchSchema = {
  query: { required: true, minLength: 2 },
  filters: { required: false, type: 'object' }
};

// Helper function to calculate match confidence
const calculateMatchConfidence = (searchTerm, athleteName, additionalFactors = {}) => {
  const normalizeText = (text) => text.toLowerCase().trim();
  const search = normalizeText(searchTerm);
  const name = normalizeText(athleteName);
  
  let confidence = 0;
  
  // Exact match
  if (search === name) {
    confidence = 1.0;
  }
  // Contains search term
  else if (name.includes(search) || search.includes(name)) {
    confidence = 0.8;
  }
  // Similar length and some matching characters
  else {
    const similarity = calculateSimilarity(search, name);
    confidence = similarity;
  }
  
  // Adjust confidence based on additional factors
  if (additionalFactors.hasSchoolMatch) confidence += 0.1;
  if (additionalFactors.hasGradeMatch) confidence += 0.05;
  if (additionalFactors.hasDistrictMatch) confidence += 0.05;
  
  return Math.min(confidence, 1.0);
};

// Simple string similarity calculation
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// POST /api/guardian/athletes/search - Smart search for children
router.post('/search', authenticateGuardian, validateInput(searchSchema), async (req, res) => {
  try {
    const { query, filters = {} } = req.body;
    const guardianId = req.user.id;
    
    // Log search for analytics
    await pool.query(
      `INSERT INTO search_analytics (
        guardian_id, search_query, search_filters, created_at
      ) VALUES ($1, $2, $3, NOW())`,
      [guardianId, query, JSON.stringify(filters)]
    );
    
    // Search in athletes table with fuzzy matching
    let searchQuery = `
      SELECT 
        a.id, a.full_name, a.father_name, a.mother_name, a.date_of_birth,
        a.grade, a.section, a.profile_status, a.guardian_id, a.athlete_id,
        a.profile_photo_url, a.created_at,
        s.name as school_name, s.district, s.address as school_address,
        CASE 
          WHEN a.guardian_id = $1 THEN 'owned'
          WHEN a.guardian_id IS NULL THEN 'unclaimed'
          ELSE 'claimed'
        END as ownership_status
      FROM athletes a
      LEFT JOIN schools s ON a.school_id = s.id
      WHERE (
        LOWER(a.full_name) ILIKE $2 OR
        LOWER(a.father_name) ILIKE $2 OR
        LOWER(a.mother_name) ILIKE $2 OR
        SOUNDEX(a.full_name) = SOUNDEX($3)
      )
    `;
    
    const searchParams = [guardianId, `%${query.toLowerCase()}%`, query];
    
    // Add filters
    if (filters.school_id) {
      searchQuery += ` AND a.school_id = $${searchParams.length + 1}`;
      searchParams.push(filters.school_id);
    }
    
    if (filters.grade) {
      searchQuery += ` AND a.grade = $${searchParams.length + 1}`;
      searchParams.push(filters.grade);
    }
    
    if (filters.district) {
      searchQuery += ` AND s.district ILIKE $${searchParams.length + 1}`;
      searchParams.push(`%${filters.district}%`);
    }
    
    searchQuery += ' ORDER BY a.created_at DESC LIMIT 20';
    
    const searchResult = await pool.query(searchQuery, searchParams);
    
    // Calculate confidence scores and determine suggested actions
    const results = searchResult.rows.map(athlete => {
      const confidence = calculateMatchConfidence(query, athlete.full_name, {
        hasSchoolMatch: filters.school_id && athlete.school_id === filters.school_id,
        hasGradeMatch: filters.grade && athlete.grade === filters.grade,
        hasDistrictMatch: filters.district && athlete.district?.toLowerCase().includes(filters.district.toLowerCase())
      });
      
      let suggestedAction = 'view';
      if (athlete.ownership_status === 'unclaimed') {
        suggestedAction = 'claim';
      } else if (athlete.ownership_status === 'owned') {
        suggestedAction = 'view';
      } else {
        suggestedAction = 'contact'; // Already claimed by someone else
      }
      
      return {
        ...athlete,
        match_confidence: confidence,
        suggested_action: suggestedAction,
        match_reasons: [
          confidence >= 0.9 ? 'Exact name match' : confidence >= 0.7 ? 'Close name match' : 'Partial name match',
          ...(filters.school_id && athlete.school_id === filters.school_id ? ['School match'] : []),
          ...(filters.grade && athlete.grade === filters.grade ? ['Grade match'] : [])
        ]
      };
    });
    
    // Sort by confidence score
    results.sort((a, b) => b.match_confidence - a.match_confidence);
    
    logger.info('Search completed', {
      guardianId,
      query,
      resultsCount: results.length,
      hasHighConfidenceMatch: results.length > 0 && results[0].match_confidence >= 0.8
    });
    
    res.json({
      success: true,
      query,
      results,
      total_results: results.length,
      search_suggestions: {
        should_create_new: results.length === 0 || (results.length > 0 && results[0].match_confidence < 0.6),
        high_confidence_match: results.length > 0 && results[0].match_confidence >= 0.8
      }
    });
    
  } catch (error) {
    logger.error('Search error', { error: error.message, guardianId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// POST /api/guardian/athletes/register - Register new athlete
router.post('/register', authenticateGuardian, validateInput(athleteRegistrationSchema), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const guardianId = req.user.id;
    const {
      full_name, father_name, mother_name, date_of_birth, grade, section,
      school, permanent_address, profile_photo_url, document_url, ocr_confidence
    } = req.body;
    
    // Handle school information
    let schoolId = null;
    if (school.verified_id) {
      // Use existing verified school
      schoolId = school.verified_id;
    } else if (school.google_place_id) {
      // Create/find school from Google Places data
      const schoolResult = await client.query(
        `INSERT INTO schools (
          name, address, district, google_place_id, location_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (google_place_id) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          district = EXCLUDED.district
        RETURNING id`,
        [
          school.name,
          school.address,
          school.district,
          school.google_place_id,
          JSON.stringify(school.location)
        ]
      );
      schoolId = schoolResult.rows[0].id;
    }
    
    // Generate athlete ID
    const athleteIdResult = await client.query(
      'SELECT COALESCE(MAX(CAST(SUBSTRING(athlete_id FROM 4) AS INTEGER)), 0) + 1 as next_id FROM athletes WHERE athlete_id IS NOT NULL'
    );
    const nextId = athleteIdResult.rows[0].next_id;
    const athleteId = `ATH${nextId.toString().padStart(6, '0')}`;
    
    // Create athlete record
    const athleteResult = await client.query(
      `INSERT INTO athletes (
        guardian_id, athlete_id, full_name, father_name, mother_name, 
        date_of_birth, grade, section, school_id, permanent_address,
        profile_photo_url, document_url, ocr_confidence_scores,
        profile_status, profile_completion, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING id`,
      [
        guardianId, athleteId, full_name, father_name, mother_name,
        date_of_birth, grade, section, schoolId, permanent_address,
        profile_photo_url, document_url, JSON.stringify(ocr_confidence),
        'pending_school_approval', 75
      ]
    );
    
    const newAthleteId = athleteResult.rows[0].id;
    
    // Create activity timeline entry
    await client.query(
      `INSERT INTO athlete_timeline (
        athlete_id, guardian_id, event_type, title, description, 
        event_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        newAthleteId, guardianId, 'registration',
        'Athlete Registration Submitted',
        `${full_name} has been registered and is pending school approval`,
        JSON.stringify({
          school_name: school.name,
          grade,
          section: section || null
        })
      ]
    );
    
    // Send notification to school admin (if school has admin)
    if (schoolId) {
      await client.query(
        `INSERT INTO notifications (
          recipient_type, recipient_id, title, message, 
          notification_type, data, created_at
        ) 
        SELECT 'school', $1, $2, $3, 'athlete_registration', $4, NOW()
        FROM schools WHERE id = $1`,
        [
          schoolId,
          'New Athlete Registration',
          `${full_name} (Grade ${grade}) has been registered for your school`,
          JSON.stringify({
            athlete_id: newAthleteId,
            guardian_id: guardianId,
            athlete_name: full_name
          })
        ]
      );
    }
    
    await client.query('COMMIT');
    
    // Get complete athlete data to return
    const completeAthleteResult = await client.query(
      `SELECT a.*, s.name as school_name, s.district
       FROM athletes a
       LEFT JOIN schools s ON a.school_id = s.id
       WHERE a.id = $1`,
      [newAthleteId]
    );
    
    logger.info('Athlete registered successfully', {
      athleteId: newAthleteId,
      guardianId,
      schoolId,
      athleteFullName: full_name
    });
    
    res.status(201).json({
      success: true,
      message: 'Athlete registered successfully',
      athlete: completeAthleteResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Athlete registration error', { 
      error: error.message, 
      guardianId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      message: 'Athlete registration failed'
    });
  } finally {
    client.release();
  }
});

// GET /api/guardian/athletes - Get guardian's athletes
router.get('/', authenticateGuardian, async (req, res) => {
  try {
    const guardianId = req.user.id;
    const { status, school_id } = req.query;
    
    let query = `
      SELECT a.*, s.name as school_name, s.district, s.address as school_address
      FROM athletes a
      LEFT JOIN schools s ON a.school_id = s.id
      WHERE a.guardian_id = $1
    `;
    const params = [guardianId];
    
    if (status) {
      query += ` AND a.profile_status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (school_id) {
      query += ` AND a.school_id = $${params.length + 1}`;
      params.push(school_id);
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const result = await pool.query(query, params);
    
    // Get status summary
    const statusSummary = await pool.query(
      `SELECT profile_status, COUNT(*) as count
       FROM athletes 
       WHERE guardian_id = $1 
       GROUP BY profile_status`,
      [guardianId]
    );
    
    res.json({
      success: true,
      athletes: result.rows,
      status_summary: statusSummary.rows.reduce((acc, row) => {
        acc[row.profile_status] = parseInt(row.count);
        return acc;
      }, {})
    });
    
  } catch (error) {
    logger.error('Get athletes error', { error: error.message, guardianId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch athletes'
    });
  }
});

// GET /api/guardian/athletes/:id/timeline - Get athlete activity timeline
router.get('/:id/timeline', authenticateGuardian, async (req, res) => {
  try {
    const athleteId = req.params.id;
    const guardianId = req.user.id;
    const { filter } = req.query;
    
    // Verify athlete belongs to guardian
    const athleteCheck = await pool.query(
      'SELECT id FROM athletes WHERE id = $1 AND guardian_id = $2',
      [athleteId, guardianId]
    );
    
    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }
    
    let query = `
      SELECT * FROM athlete_timeline 
      WHERE athlete_id = $1
    `;
    const params = [athleteId];
    
    if (filter && filter !== 'all') {
      query += ` AND event_type = $${params.length + 1}`;
      params.push(filter);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      timeline: result.rows
    });
    
  } catch (error) {
    logger.error('Get timeline error', { 
      error: error.message, 
      athleteId: req.params.id,
      guardianId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timeline'
    });
  }
});

// PUT /api/guardian/athletes/:id - Update athlete information
router.put('/:id', authenticateGuardian, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const athleteId = req.params.id;
    const guardianId = req.user.id;
    const updates = req.body;
    
    // Verify athlete belongs to guardian
    const athleteCheck = await client.query(
      'SELECT * FROM athletes WHERE id = $1 AND guardian_id = $2',
      [athleteId, guardianId]
    );
    
    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }
    
    // Build dynamic update query
    const allowedFields = [
      'full_name', 'father_name', 'mother_name', 'date_of_birth',
      'grade', 'section', 'permanent_address', 'profile_photo_url'
    ];
    
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 3; // Start after athleteId and guardianId
    
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field) && value !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    updateFields.push('updated_at = NOW()');
    
    const updateQuery = `
      UPDATE athletes 
      SET ${updateFields.join(', ')}
      WHERE id = $1 AND guardian_id = $2
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [athleteId, guardianId, ...updateValues]);
    
    // Add timeline entry
    await client.query(
      `INSERT INTO athlete_timeline (
        athlete_id, guardian_id, event_type, title, description, created_at
      ) VALUES ($1, $2, 'profile_update', 'Profile Updated', 'Athlete profile information was updated', NOW())`,
      [athleteId, guardianId]
    );
    
    await client.query('COMMIT');
    
    logger.info('Athlete updated successfully', { athleteId, guardianId });
    
    res.json({
      success: true,
      message: 'Athlete updated successfully',
      athlete: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Update athlete error', { 
      error: error.message, 
      athleteId: req.params.id,
      guardianId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update athlete'
    });
  } finally {
    client.release();
  }
});

module.exports = router;
