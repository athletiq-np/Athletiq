/**
 * Document Processing Routes
 * Handles document upload, OCR processing, and AI-driven verification
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

// Import middleware
const { protect: authMiddleware } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

// Import services
const fileUploadHandler = require('../services/ai/fileUploadHandler');
const documentProcessor = require('../services/ai/documentProcessor');
const ocrService = require('../services/ai/ocrService');
const { pool, query } = require('../config/db');

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload and process player documents
 *     description: Upload documents (birth certificate, citizenship, school ID) for OCR processing and validation
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload
 *               document_type:
 *                 type: string
 *                 enum: [birth_certificate, citizenship_certificate, school_id]
 *                 description: Type of document being uploaded
 *               player_id:
 *                 type: integer
 *                 description: ID of the player this document belongs to
 *               entity_type:
 *                 type: string
 *                 enum: [player, team, tournament]
 *                 description: Type of entity this document is for
 *               entity_id:
 *                 type: integer
 *                 description: ID of the entity this document belongs to
 *     responses:
 *       200:
 *         description: Document uploaded and queued for processing
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
 *                     upload_id:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     file_size:
 *                       type: integer
 *                     processing_status:
 *                       type: string
 *                     queue_position:
 *                       type: integer
 *       400:
 *         description: Invalid request or file validation failed
 *       403:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
router.post('/upload', 
  authMiddleware,
  authorizeRoles(['school_admin', 'super_admin', 'organization_admin']),
  [
    body('document_type')
      .isIn(['birth_certificate', 'citizenship_certificate', 'school_id'])
      .withMessage('Invalid document type'),
    body('entity_type')
      .isIn(['player', 'team', 'tournament'])
      .withMessage('Invalid entity type'),
    body('entity_id')
      .isInt({ min: 1 })
      .withMessage('Valid entity ID is required'),
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

      const { document_type, entity_type, entity_id } = req.body;
      const user_id = req.user.id;

      // Handle file upload and processing
      const result = await fileUploadHandler.handleDocumentUpload(req, {
        document_type,
        entity_type,
        entity_id,
        user_id
      });

      res.json({
        success: true,
        message: 'Document uploaded and queued for processing',
        data: result
      });

    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @swagger
 * /api/documents/{uploadId}/status:
 *   get:
 *     summary: Check document processing status
 *     description: Get the current processing status and results for a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document upload ID
 *     responses:
 *       200:
 *         description: Processing status retrieved
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
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed]
 *                     progress:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                     extracted_data:
 *                       type: object
 *                     confidence_score:
 *                       type: number
 *                     error_message:
 *                       type: string
 *       404:
 *         description: Document not found
 *       403:
 *         description: Unauthorized access
 */
router.get('/:uploadId/status',
  authMiddleware,
  authorizeRoles(['school_admin', 'super_admin', 'organization_admin']),
  [
    param('uploadId').isUUID().withMessage('Invalid upload ID format')
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

      const { uploadId } = req.params;
      const user_id = req.user.id;

      // Get document status from database
      const statusQuery = `
        SELECT 
          du.id, du.filename, du.file_size, du.document_type, du.entity_type, du.entity_id,
          du.upload_status, du.created_at, du.updated_at,
          apq.status as processing_status, apq.progress, apq.extracted_data, 
          apq.confidence_score, apq.error_message, apq.processing_attempts
        FROM document_uploads du
        LEFT JOIN ai_processing_queue apq ON du.id = apq.document_id
        WHERE du.id = $1 AND du.uploaded_by = $2
      `;

      const result = await query(statusQuery, [uploadId, user_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      const doc = result.rows[0];
      
      res.json({
        success: true,
        data: {
          id: doc.id,
          filename: doc.filename,
          file_size: doc.file_size,
          document_type: doc.document_type,
          entity_type: doc.entity_type,
          entity_id: doc.entity_id,
          upload_status: doc.upload_status,
          processing_status: doc.processing_status || 'pending',
          progress: doc.progress || 0,
          extracted_data: doc.extracted_data || null,
          confidence_score: doc.confidence_score || null,
          error_message: doc.error_message || null,
          processing_attempts: doc.processing_attempts || 0,
          created_at: doc.created_at,
          updated_at: doc.updated_at
        }
      });

    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check document status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @swagger
 * /api/documents/{uploadId}/approve:
 *   post:
 *     summary: Approve processed document
 *     description: Admin approval of OCR-processed document data
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document upload ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               corrections:
 *                 type: object
 *                 description: Any corrections to the extracted data
 *               approval_notes:
 *                 type: string
 *                 description: Admin notes for the approval
 *     responses:
 *       200:
 *         description: Document approved successfully
 *       400:
 *         description: Invalid request or document not ready for approval
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Document not found
 */
router.post('/:uploadId/approve',
  authMiddleware,
  authorizeRoles(['super_admin', 'organization_admin']),
  [
    param('uploadId').isUUID().withMessage('Invalid upload ID format'),
    body('corrections').optional().isObject().withMessage('Corrections must be an object'),
    body('approval_notes').optional().isString().withMessage('Approval notes must be a string')
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

      const { uploadId } = req.params;
      const { corrections, approval_notes } = req.body;
      const user_id = req.user.id;

      // Process document approval
      const result = await documentProcessor.approveDocument(uploadId, {
        approved_by: user_id,
        corrections,
        approval_notes
      });

      res.json({
        success: true,
        message: 'Document approved and data updated',
        data: result
      });

    } catch (error) {
      console.error('Document approval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve document',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @swagger
 * /api/documents/bulk/process:
 *   post:
 *     summary: Bulk process documents
 *     description: Process multiple documents in batch for efficiency
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               document_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of document IDs to process
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high]
 *                 description: Processing priority
 *     responses:
 *       200:
 *         description: Bulk processing initiated
 *       400:
 *         description: Invalid request parameters
 *       403:
 *         description: Insufficient permissions
 */
router.post('/bulk/process',
  authMiddleware,
  authorizeRoles(['super_admin', 'organization_admin']),
  [
    body('document_ids').isArray({ min: 1 }).withMessage('Document IDs array is required'),
    body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('Invalid priority level')
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

      const { document_ids, priority = 'normal' } = req.body;
      const user_id = req.user.id;

      // Process documents in bulk
      const result = await documentProcessor.bulkProcessDocuments(document_ids, {
        priority,
        initiated_by: user_id
      });

      res.json({
        success: true,
        message: 'Bulk processing initiated',
        data: result
      });

    } catch (error) {
      console.error('Bulk processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate bulk processing',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @swagger
 * /api/documents/analytics:
 *   get:
 *     summary: Get document processing analytics
 *     description: Retrieve analytics and statistics for document processing
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *         description: Time frame for analytics
 *       - in: query
 *         name: document_type
 *         schema:
 *           type: string
 *           enum: [birth_certificate, citizenship_certificate, school_id]
 *         description: Filter by document type
 *     responses:
 *       200:
 *         description: Analytics data retrieved
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
 *                     total_documents:
 *                       type: integer
 *                     processed_documents:
 *                       type: integer
 *                     failed_documents:
 *                       type: integer
 *                     average_processing_time:
 *                       type: number
 *                     confidence_scores:
 *                       type: object
 *                     document_types:
 *                       type: object
 *       403:
 *         description: Insufficient permissions
 */
router.get('/analytics',
  authMiddleware,
  authorizeRoles(['super_admin', 'organization_admin']),
  async (req, res) => {
    try {
      const { timeframe = 'month', document_type } = req.query;
      
      // Build time filter
      let timeFilter = '';
      switch (timeframe) {
        case 'day':
          timeFilter = "AND du.created_at >= NOW() - INTERVAL '1 day'";
          break;
        case 'week':
          timeFilter = "AND du.created_at >= NOW() - INTERVAL '1 week'";
          break;
        case 'month':
          timeFilter = "AND du.created_at >= NOW() - INTERVAL '1 month'";
          break;
        case 'year':
          timeFilter = "AND du.created_at >= NOW() - INTERVAL '1 year'";
          break;
      }

      // Build document type filter
      let typeFilter = '';
      if (document_type) {
        typeFilter = `AND du.document_type = '${document_type}'`;
      }

      const analyticsQuery = `
        SELECT 
          COUNT(*) as total_documents,
          COUNT(CASE WHEN apq.status = 'completed' THEN 1 END) as processed_documents,
          COUNT(CASE WHEN apq.status = 'failed' THEN 1 END) as failed_documents,
          AVG(CASE WHEN apq.status = 'completed' THEN apq.confidence_score END) as avg_confidence,
          AVG(CASE WHEN apq.status = 'completed' THEN EXTRACT(EPOCH FROM (apq.updated_at - apq.created_at)) END) as avg_processing_time,
          du.document_type,
          COUNT(*) as type_count
        FROM document_uploads du
        LEFT JOIN ai_processing_queue apq ON du.id = apq.document_id
        WHERE 1=1 ${timeFilter} ${typeFilter}
        GROUP BY du.document_type
      `;

      const result = await query(analyticsQuery);
      
      const analytics = {
        total_documents: 0,
        processed_documents: 0,
        failed_documents: 0,
        average_processing_time: 0,
        average_confidence: 0,
        document_types: {}
      };

      result.rows.forEach(row => {
        analytics.total_documents += parseInt(row.total_documents);
        analytics.processed_documents += parseInt(row.processed_documents);
        analytics.failed_documents += parseInt(row.failed_documents);
        analytics.document_types[row.document_type] = parseInt(row.type_count);
      });

      if (result.rows.length > 0) {
        analytics.average_processing_time = result.rows.reduce((sum, row) => sum + parseFloat(row.avg_processing_time || 0), 0) / result.rows.length;
        analytics.average_confidence = result.rows.reduce((sum, row) => sum + parseFloat(row.avg_confidence || 0), 0) / result.rows.length;
      }

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;
