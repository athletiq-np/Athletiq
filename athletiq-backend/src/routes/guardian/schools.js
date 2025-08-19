const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('schools');

// GET /api/schools/verified - Get verified schools
router.get('/verified', async (req, res) => {
  try {
    const { district, search, limit = 50 } = req.query;
    
    let query = `
      SELECT id, name, address, district, google_place_id, 
             location_data, is_verified, created_at
      FROM schools 
      WHERE is_verified = true
    `;
    const params = [];
    
    if (district) {
      query += ` AND LOWER(district) = LOWER($${params.length + 1})`;
      params.push(district);
    }
    
    if (search) {
      query += ` AND LOWER(name) ILIKE $${params.length + 1}`;
      params.push(`%${search.toLowerCase()}%`);
    }
    
    query += ` ORDER BY name ASC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      schools: result.rows
    });
    
  } catch (error) {
    logger.error('Get verified schools error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools'
    });
  }
});

// GET /api/schools/districts - Get list of districts with schools
router.get('/districts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT district, COUNT(*) as school_count
       FROM schools 
       WHERE district IS NOT NULL AND district != ''
       GROUP BY district 
       ORDER BY district ASC`
    );
    
    res.json({
      success: true,
      districts: result.rows
    });
    
  } catch (error) {
    logger.error('Get districts error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts'
    });
  }
});

// POST /api/schools - Create/register new school
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      name, address, district, google_place_id, location_data,
      contact_email, contact_phone, principal_name
    } = req.body;
    
    // Check if school already exists
    const existingSchool = await client.query(
      'SELECT id FROM schools WHERE google_place_id = $1 OR (LOWER(name) = LOWER($2) AND LOWER(district) = LOWER($3))',
      [google_place_id, name, district]
    );
    
    if (existingSchool.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'School already exists'
      });
    }
    
    // Create school
    const result = await client.query(
      `INSERT INTO schools (
        name, address, district, google_place_id, location_data,
        contact_email, contact_phone, principal_name, 
        is_verified, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        name, address, district, google_place_id, 
        JSON.stringify(location_data),
        contact_email, contact_phone, principal_name,
        false // New schools start as unverified
      ]
    );
    
    await client.query('COMMIT');
    
    logger.info('School created successfully', {
      schoolId: result.rows[0].id,
      schoolName: name,
      district
    });
    
    res.status(201).json({
      success: true,
      message: 'School registered successfully',
      school: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Create school error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to register school'
    });
  } finally {
    client.release();
  }
});

// GET /api/schools/:id - Get school details
router.get('/:id', async (req, res) => {
  try {
    const schoolId = req.params.id;
    
    const result = await pool.query(
      `SELECT s.*, 
              COUNT(a.id) as total_athletes,
              COUNT(CASE WHEN a.profile_status = 'active' THEN 1 END) as active_athletes
       FROM schools s
       LEFT JOIN athletes a ON s.id = a.school_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [schoolId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    res.json({
      success: true,
      school: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Get school details error', { error: error.message, schoolId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school details'
    });
  }
});

module.exports = router;
