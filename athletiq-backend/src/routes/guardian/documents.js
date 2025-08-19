const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { pool } = require('../../config/database');
const { createLogger } = require('../../utils/logger');
const { authenticateGuardian } = require('../../middlewares/guardianAuth');
const { validateInput } = require('../../middlewares/validation');

const logger = createLogger('guardian-documents');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// OCR Processing function (placeholder - integrate with Google Vision API)
const processOCR = async (imagePath, documentType) => {
  try {
    // This would integrate with Google Vision API or other OCR service
    // For now, return mock data for development
    
    if (documentType === 'birth_certificate') {
      return {
        extracted_data: {
          full_name: 'रोहन शर्मा', // This would be extracted from the image
          father_name: 'राम शर्मा',
          mother_name: 'सीता शर्मा',
          date_of_birth: '2010-05-15',
          place_of_birth: 'काठमाडौं',
          permanent_address: 'काठमाडौं महानगरपालिका-10',
          citizenship_number: '1234567890'
        },
        confidence_scores: {
          full_name: 0.95,
          father_name: 0.87,
          mother_name: 0.91,
          date_of_birth: 0.89,
          place_of_birth: 0.82,
          permanent_address: 0.78,
          citizenship_number: 0.93
        },
        overall_confidence: 0.88
      };
    }
    
    return {
      extracted_data: {},
      confidence_scores: {},
      overall_confidence: 0
    };
    
  } catch (error) {
    logger.error('OCR processing failed', { error: error.message, imagePath });
    throw error;
  }
};

// POST /api/guardian/documents/upload-ocr - Upload document with OCR processing
router.post('/upload-ocr', authenticateGuardian, upload.single('document'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }
    
    const { document_type = 'birth_certificate', extract_fields } = req.body;
    const guardianId = req.user.id;
    const filePath = req.file.path;
    const documentUrl = `/uploads/documents/${req.file.filename}`;
    
    await client.query('BEGIN');
    
    // Store document record
    const documentResult = await client.query(
      `INSERT INTO guardian_documents (
        guardian_id, file_path, file_url, document_type, 
        original_filename, file_size, mime_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
      RETURNING id`,
      [
        guardianId, filePath, documentUrl, document_type,
        req.file.originalname, req.file.size, req.file.mimetype
      ]
    );
    
    const documentId = documentResult.rows[0].id;
    
    // Process OCR
    logger.info('Starting OCR processing', { documentId, documentType: document_type });
    const ocrResult = await processOCR(filePath, document_type);
    
    // Store OCR results
    await client.query(
      `UPDATE guardian_documents SET 
       ocr_data = $1, ocr_confidence = $2, processed_at = NOW()
       WHERE id = $3`,
      [
        JSON.stringify(ocrResult.extracted_data),
        JSON.stringify(ocrResult.confidence_scores),
        documentId
      ]
    );
    
    await client.query('COMMIT');
    
    logger.info('Document uploaded and processed successfully', {
      documentId,
      guardianId,
      overallConfidence: ocrResult.overall_confidence
    });
    
    res.json({
      success: true,
      message: 'Document processed successfully',
      document_id: documentId,
      document_url: documentUrl,
      extracted_data: ocrResult.extracted_data,
      confidence_scores: ocrResult.confidence_scores,
      overall_confidence: ocrResult.overall_confidence
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Document upload error', { 
      error: error.message, 
      guardianId: req.user?.id,
      filename: req.file?.filename 
    });
    
    res.status(500).json({
      success: false,
      message: 'Document processing failed'
    });
  } finally {
    client.release();
  }
});

// POST /api/guardian/documents/upload - Simple document upload without OCR
router.post('/upload', authenticateGuardian, upload.single('document'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }
    
    const { athlete_id, document_type } = req.body;
    const guardianId = req.user.id;
    const filePath = req.file.path;
    const documentUrl = `/uploads/documents/${req.file.filename}`;
    
    await client.query('BEGIN');
    
    // Verify athlete belongs to guardian
    if (athlete_id) {
      const athleteCheck = await client.query(
        'SELECT id FROM athletes WHERE id = $1 AND guardian_id = $2',
        [athlete_id, guardianId]
      );
      
      if (athleteCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'Athlete not found or access denied'
        });
      }
    }
    
    // Store document record
    const documentResult = await client.query(
      `INSERT INTO guardian_documents (
        guardian_id, athlete_id, file_path, file_url, document_type,
        original_filename, file_size, mime_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
      RETURNING id`,
      [
        guardianId, athlete_id, filePath, documentUrl, document_type,
        req.file.originalname, req.file.size, req.file.mimetype
      ]
    );
    
    await client.query('COMMIT');
    
    logger.info('Document uploaded successfully', {
      documentId: documentResult.rows[0].id,
      guardianId,
      athleteId: athlete_id
    });
    
    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document_id: documentResult.rows[0].id,
      document_url: documentUrl
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Document upload error', { 
      error: error.message, 
      guardianId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      message: 'Document upload failed'
    });
  } finally {
    client.release();
  }
});

// GET /api/guardian/documents - Get guardian's documents
router.get('/', authenticateGuardian, async (req, res) => {
  try {
    const guardianId = req.user.id;
    const { athlete_id, document_type } = req.query;
    
    let query = `
      SELECT d.*, a.full_name as athlete_name
      FROM guardian_documents d
      LEFT JOIN athletes a ON d.athlete_id = a.id
      WHERE d.guardian_id = $1
    `;
    const params = [guardianId];
    
    if (athlete_id) {
      query += ' AND d.athlete_id = $2';
      params.push(athlete_id);
    }
    
    if (document_type) {
      query += ` AND d.document_type = $${params.length + 1}`;
      params.push(document_type);
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      documents: result.rows
    });
    
  } catch (error) {
    logger.error('Get documents error', { error: error.message, guardianId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
});

// DELETE /api/guardian/documents/:id - Delete document
router.delete('/:id', authenticateGuardian, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const documentId = req.params.id;
    const guardianId = req.user.id;
    
    await client.query('BEGIN');
    
    // Verify document belongs to guardian
    const documentCheck = await client.query(
      'SELECT file_path FROM guardian_documents WHERE id = $1 AND guardian_id = $2',
      [documentId, guardianId]
    );
    
    if (documentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Delete from database
    await client.query(
      'DELETE FROM guardian_documents WHERE id = $1',
      [documentId]
    );
    
    // TODO: Delete physical file
    // const fs = require('fs');
    // fs.unlinkSync(documentCheck.rows[0].file_path);
    
    await client.query('COMMIT');
    
    logger.info('Document deleted successfully', { documentId, guardianId });
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Delete document error', { 
      error: error.message, 
      documentId: req.params.id,
      guardianId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  } finally {
    client.release();
  }
});

module.exports = router;
