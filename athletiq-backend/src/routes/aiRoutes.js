/**
 * AI Processing Routes
 * Handles AI-driven features: athlete ID generation, processing queue management, 
 * and intelligent data processing
 */

const express = require('express');
const router = express.Router();
const { body, param, query: queryValidator, validationResult } = require('express-validator');

// Import middleware
const { protect: authMiddleware } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

// Import services
const AthleteIdGenerator = require('../services/ai/athleteIdGenerator');
const QueueProcessor = require('../services/queue/queueProcessor');
const OCRService = require('../services/ai/ocrService');
const { pool, query } = require('../config/db');

// Initialize service instances
const athleteIdGenerator = new AthleteIdGenerator();
// const queueProcessor = new QueueProcessor(); // Disabled temporarily due to Redis dependency
const ocrService = new OCRService();

// Mock queue processor for testing
const queueProcessor = {
  retryFailedJobs: async () => ({ retried: 0, message: 'Redis not available' }),
  retryJobs: async (ids) => ({ retried: 0, message: 'Redis not available' })
};

/**
 * @swagger
 * /api/ai/athlete-ids/generate:
 *   post:
 *     summary: Generate athlete IDs for players
 *     description: Generate unique athlete IDs for players who don't have them
 *     tags: [AI Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               player_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Specific player IDs to generate IDs for (optional)
 *               school_id:
 *                 type: integer
 *                 description: Generate IDs for all players in a school (optional)
 *               batch_size:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 10
 *                 description: Number of IDs to generate in one batch
 *     responses:
 *       200:
 *         description: Athlete IDs generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     generated_count:
 *                       type: integer
 *                     skipped_count:
 *                       type: integer
 *                     generated_ids:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           player_id:
 *                             type: integer
 *                           athlete_id:
 *                             type: string
 *                           metadata:
 *                             type: object
 *       400:
 *         description: Invalid request parameters
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/athlete-ids/generate',
  authMiddleware,
  authorizeRoles(['super_admin', 'organization_admin', 'school_admin']),
  [
    body('player_ids').optional().isArray().withMessage('Player IDs must be an array'),
    body('school_id').optional().isInt({ min: 1 }).withMessage('School ID must be a positive integer'),
    body('batch_size').optional().isInt({ min: 1, max: 100 }).withMessage('Batch size must be between 1 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { player_ids, school_id, batch_size = 10 } = req.body;
      const user_id = req.user.id;

      // Validate user permissions for school access
      if (school_id && req.user.role === 'school_admin') {
        const schoolCheck = await query(
          'SELECT id FROM schools WHERE id = $1 AND created_by = $2',
          [school_id, user_id]
        );
        
        if (schoolCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You can only generate IDs for your own school'
          });
        }
      }

      // Generate athlete IDs
      const result = await athleteIdGenerator.generateBatchIds({
        player_ids,
        school_id,
        batch_size,
        generated_by: user_id
      });

      res.json({
        success: true,
        message: `Generated ${result.generated_count} athlete IDs`,
        data: result
      });

    } catch (error) {
      console.error('Athlete ID generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate athlete IDs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/athlete-ids/stats:
 *   get:
 *     summary: Get athlete ID statistics
 *     description: Retrieve statistics about athlete ID generation and usage
 *     tags: [AI Processing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_players:
 *                       type: integer
 *                     players_with_ids:
 *                       type: integer
 *                     players_without_ids:
 *                       type: integer
 *                     current_sequence:
 *                       type: integer
 *                     completion_percentage:
 *                       type: number
 *                     by_school:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           school_id:
 *                             type: integer
 *                           school_name:
 *                             type: string
 *                           total_players:
 *                             type: integer
 *                           players_with_ids:
 *                             type: integer
 *       403:
 *         description: Insufficient permissions
 */
router.get('/athlete-ids/stats',
  authMiddleware,
  authorizeRoles(['super_admin', 'organization_admin', 'school_admin']),
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const user_role = req.user.role;

      // Build query based on user role
      let statsQuery = `
        SELECT 
          COUNT(*) as total_players,
          COUNT(CASE WHEN athlete_id IS NOT NULL THEN 1 END) as players_with_ids,
          COUNT(CASE WHEN athlete_id IS NULL THEN 1 END) as players_without_ids
        FROM players p
        LEFT JOIN schools s ON p.school_id = s.id
      `;

      let bySchoolQuery = `
        SELECT 
          s.id as school_id,
          s.name as school_name,
          COUNT(p.id) as total_players,
          COUNT(CASE WHEN p.athlete_id IS NOT NULL THEN 1 END) as players_with_ids
        FROM schools s
        LEFT JOIN players p ON s.id = p.school_id
      `;

      let queryParams = [];

      // Add role-based filtering
      if (user_role === 'school_admin') {
        statsQuery += ' WHERE s.created_by = $1';
        bySchoolQuery += ' WHERE s.created_by = $1';
        queryParams = [user_id];
      }

      bySchoolQuery += ' GROUP BY s.id, s.name ORDER BY s.name';

      // Execute queries
      const [statsResult, bySchoolResult, sequenceResult] = await Promise.all([
        query(statsQuery, queryParams),
        query(bySchoolQuery, queryParams),
        query("SELECT nextval('athlete_id_seq') as current_sequence")
      ]);

      const stats = statsResult.rows[0];
      const completion_percentage = stats.total_players > 0 
        ? (stats.players_with_ids / stats.total_players) * 100 
        : 0;

      res.json({
        success: true,
        data: {
          total_players: parseInt(stats.total_players),
          players_with_ids: parseInt(stats.players_with_ids),
          players_without_ids: parseInt(stats.players_without_ids),
          current_sequence: parseInt(sequenceResult.rows[0].current_sequence),
          completion_percentage: Math.round(completion_percentage * 100) / 100,
          by_school: bySchoolResult.rows.map(row => ({
            school_id: row.school_id,
            school_name: row.school_name,
            total_players: parseInt(row.total_players),
            players_with_ids: parseInt(row.players_with_ids)
          }))
        }
      });

    } catch (error) {
      console.error('Athlete ID stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve athlete ID statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/queue/status:
 *   get:
 *     summary: Get AI processing queue status
 *     description: Retrieve current status of the AI processing queue
 *     tags: [AI Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: queue_type
 *         schema:
 *           type: string
 *           enum: [document_processing, athlete_id_generation, all]
 *         description: Type of queue to check
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *         description: Filter by processing status
 *     responses:
 *       200:
 *         description: Queue status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     queue_stats:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                         processing:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *                     recent_jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           job_type:
 *                             type: string
 *                           status:
 *                             type: string
 *                           progress:
 *                             type: integer
 *                           created_at:
 *                             type: string
 *                           updated_at:
 *                             type: string
 *       403:
 *         description: Insufficient permissions
 */
router.get('/queue/status',
  authMiddleware,
  authorizeRoles(['super_admin', 'organization_admin']),
  [
    queryValidator('queue_type').optional().isIn(['document_processing', 'athlete_id_generation', 'all']).withMessage('Invalid queue type'),
    queryValidator('status').optional().isIn(['pending', 'processing', 'completed', 'failed']).withMessage('Invalid status filter')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { queue_type = 'all', status } = req.query;

      // Build query filters
      let typeFilter = '';
      let statusFilter = '';
      let queryParams = [];

      if (queue_type !== 'all') {
        typeFilter = 'AND job_type = $1';
        queryParams.push(queue_type);
      }

      if (status) {
        statusFilter = `AND status = $${queryParams.length + 1}`;
        queryParams.push(status);
      }

      // Get queue statistics
      const statsQuery = `
        SELECT 
          status,
          COUNT(*) as count
        FROM ai_processing_queue
        WHERE 1=1 ${typeFilter}
        GROUP BY status
      `;

      // Get recent jobs
      const recentJobsQuery = `
        SELECT 
          id, job_type, status, progress, error_message,
          created_at, updated_at
        FROM ai_processing_queue
        WHERE 1=1 ${typeFilter} ${statusFilter}
        ORDER BY created_at DESC
        LIMIT 20
      `;

      const [statsResult, recentJobsResult] = await Promise.all([
        query(statsQuery, queue_type !== 'all' ? [queue_type] : []),
        query(recentJobsQuery, queryParams)
      ]);

      // Process statistics
      const queue_stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };

      statsResult.rows.forEach(row => {
        queue_stats[row.status] = parseInt(row.count);
      });

      res.json({
        success: true,
        data: {
          queue_stats,
          recent_jobs: recentJobsResult.rows.map(job => ({
            id: job.id,
            job_type: job.job_type,
            status: job.status,
            progress: job.progress,
            error_message: job.error_message,
            created_at: job.created_at,
            updated_at: job.updated_at
          }))
        }
      });

    } catch (error) {
      console.error('Queue status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve queue status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/queue/retry:
 *   post:
 *     summary: Retry failed AI processing jobs
 *     description: Retry failed jobs in the AI processing queue
 *     tags: [AI Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               job_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific job IDs to retry
 *               retry_failed_all:
 *                 type: boolean
 *                 description: Retry all failed jobs
 *     responses:
 *       200:
 *         description: Jobs queued for retry
 *       400:
 *         description: Invalid request parameters
 *       403:
 *         description: Insufficient permissions
 */
router.post('/queue/retry',
  authMiddleware,
  authorizeRoles(['super_admin', 'organization_admin']),
  [
    body('job_ids').optional().isArray().withMessage('Job IDs must be an array'),
    body('retry_failed_all').optional().isBoolean().withMessage('Retry all flag must be boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { job_ids, retry_failed_all } = req.body;
      const user_id = req.user.id;

      let retryResult;

      if (retry_failed_all) {
        // Retry all failed jobs
        retryResult = await queueProcessor.retryFailedJobs();
      } else if (job_ids && job_ids.length > 0) {
        // Retry specific jobs
        retryResult = await queueProcessor.retryJobs(job_ids);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either job_ids or retry_failed_all must be provided'
        });
      }

      // Log the retry action
      await query(
        'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [
          user_id,
          'queue_retry',
          JSON.stringify({ retry_failed_all, job_ids, result: retryResult }),
          req.ip
        ]
      );

      res.json({
        success: true,
        message: 'Jobs queued for retry',
        data: retryResult
      });

    } catch (error) {
      console.error('Queue retry error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry jobs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/ocr/templates:
 *   get:
 *     summary: Get OCR document templates
 *     description: Retrieve available OCR templates for different document types
 *     tags: [AI Processing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OCR templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     templates:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           fields:
 *                             type: array
 *                             items:
 *                               type: string
 *                           validation:
 *                             type: object
 *                           confidence_threshold:
 *                             type: number
 *       403:
 *         description: Insufficient permissions
 */
router.get('/ocr/templates',
  authMiddleware,
  authorizeRoles(['super_admin', 'organization_admin', 'school_admin']),
  async (req, res) => {
    try {
      const templates = ocrService.getDocumentTemplates();
      
      res.json({
        success: true,
        data: {
          templates
        }
      });

    } catch (error) {
      console.error('OCR templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve OCR templates',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;
