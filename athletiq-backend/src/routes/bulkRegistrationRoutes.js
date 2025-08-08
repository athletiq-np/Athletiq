// src/routes/bulkRegistrationRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BulkRegistrationService = require('../services/bulkRegistrationService');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiter');
const { sendResponse } = require('../utils/response');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/bulk/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `bulk-registration-${uniqueSuffix}.csv`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

const bulkService = new BulkRegistrationService();

/**
 * Download CSV template
 * GET /api/bulk-registration/template
 */
router.get('/template', protect, checkRole(['SchoolAdmin', 'SuperAdmin']), (req, res) => {
  try {
    const template = bulkService.generateCSVTemplate();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
    res.send(template.content);
    
  } catch (error) {
    sendResponse(res, { success: false, status: 500, message: 'Failed to generate template', errors: [{ msg: error.message }] });
  }
});

/**
 * Get template information and instructions
 * GET /api/bulk-registration/template-info
 */
router.get('/template-info', protect, checkRole(['SchoolAdmin', 'SuperAdmin']), (req, res) => {
  try {
    const template = bulkService.generateCSVTemplate();
    
    sendResponse(res, { data: { template: {
        filename: template.filename,
        instructions: template.instructions,
        required_columns: bulkService.requiredColumns,
        optional_columns: bulkService.optionalColumns,
        max_rows: 100
      } } });
    
  } catch (error) {
    sendResponse(res, { success: false, status: 500, message: 'Failed to get template info', errors: [{ msg: error.message }] });
  }
});

/**
 * Validate CSV file
 * POST /api/bulk-registration/validate
 */
router.post('/validate', 
  protect, 
  checkRole(['SchoolAdmin', 'SuperAdmin']),
  generalLimiter,
  upload.single('csvFile'),
  async (req, res) => {
    let filePath = null;
    
    try {
      if (!req.file) {
  return sendResponse(res, { success: false, status: 400, message: 'CSV file is required' });
      }

      filePath = req.file.path;
      
      // Validate the CSV file
      const validation = await bulkService.validateCSVFile(filePath);
      
      sendResponse(res, { data: { validation: {
          is_valid: validation.isValid,
          total_rows: validation.totalRows,
          errors: validation.errors,
          preview: validation.data.slice(0, 5) // Show first 5 rows as preview
        } } });

    } catch (error) {
      sendResponse(res, { success: false, status: 500, message: 'Validation failed', errors: [{ msg: error.message }] });
    } finally {
      // Cleanup uploaded file
      if (filePath) {
        await bulkService.cleanupTempFiles([filePath]);
      }
    }
  }
);

/**
 * Process bulk registration
 * POST /api/bulk-registration/process
 */
router.post('/process',
  protect,
  checkRole(['SchoolAdmin', 'SuperAdmin']),
  generalLimiter,
  upload.single('csvFile'),
  async (req, res) => {
    let filePath = null;
    
    try {
      if (!req.file) {
  return sendResponse(res, { success: false, status: 400, message: 'CSV file is required' });
      }

      filePath = req.file.path;
      const schoolId = req.body.school_id || req.user.school_id;
      
      if (!schoolId) {
  return sendResponse(res, { success: false, status: 400, message: 'School ID is required' });
      }

      // Validate the CSV file first
      const validation = await bulkService.validateCSVFile(filePath);
      
      if (!validation.isValid) {
  return sendResponse(res, { success: false, status: 400, message: 'CSV validation failed', errors: validation.errors });
      }

      // Process bulk registration
      const results = await bulkService.processBulkRegistration(
        validation.data,
        schoolId,
        req.user.id
      );

      // Get school name for report
      const pool = require('../config/db');
      const schoolQuery = 'SELECT name FROM schools WHERE id = $1';
      const schoolResult = await pool.query(schoolQuery, [schoolId]);
      const schoolName = schoolResult.rows[0]?.name || 'Unknown School';

      // Generate report
      const report = bulkService.generateReport(results, schoolName);

      sendResponse(res, { status: 201, message: `Bulk registration completed. ${results.successful}/${results.total} athletes registered successfully.`, data: { results: {
          summary: report.summary,
          successful_registrations: results.successful,
          failed_registrations: results.failed,
          total_processed: results.total
        }, report,
        athletes: results.athletes.map(athlete => ({
          nepal_id: athlete.athlete_id,
          name: athlete.full_name,
          grade: athlete.grade
        })) } });

    } catch (error) {
      console.error('Bulk registration error:', error);
      sendResponse(res, { success: false, status: 500, message: 'Bulk registration failed', errors: [{ msg: error.message }] });
    } finally {
      // Cleanup uploaded file
      if (filePath) {
        await bulkService.cleanupTempFiles([filePath]);
      }
    }
  }
);

/**
 * Get bulk registration history
 * GET /api/bulk-registration/history
 */
router.get('/history',
  protect,
  checkRole(['SchoolAdmin', 'SuperAdmin']),
  async (req, res) => {
    try {
      const schoolId = req.query.school_id || req.user.school_id;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const pool = require('../config/db');
      
      // Get bulk registration history (created players in batches)
      const query = `
        SELECT 
          DATE(created_at) as registration_date,
          COUNT(*) as athletes_registered,
          ARRAY_AGG(DISTINCT created_by) as created_by_users,
          MIN(created_at) as batch_start,
          MAX(created_at) as batch_end
        FROM players 
        WHERE school_id = $1 
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY registration_date DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [schoolId, limit, offset]);

      // Get user names for created_by
      const userIds = result.rows.flatMap(row => row.created_by_users);
      const userQuery = 'SELECT id, full_name FROM users WHERE id = ANY($1)';
      const userResult = await pool.query(userQuery, [userIds]);
      const userMap = Object.fromEntries(userResult.rows.map(u => [u.id, u.full_name]));

      const history = result.rows.map(row => ({
        ...row,
        created_by_names: row.created_by_users.map(id => userMap[id] || 'Unknown')
      }));

      sendResponse(res, { data: { history, pagination: {
          limit,
          offset,
          total: result.rowCount
        } } });

    } catch (error) {
      sendResponse(res, { success: false, status: 500, message: 'Failed to get history', errors: [{ msg: error.message }] });
    }
  }
);

module.exports = router;
