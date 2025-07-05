// src/services/ai/documentProcessor.js - Document Processing Service
require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const { pool, query } = require('../../config/db');
const { logger } = require('../../config/db');
const OCRService = require('./ocrService');
const AthleteIdGenerator = require('./athleteIdGenerator');

class DocumentProcessor {
  constructor() {
    this.ocrService = new OCRService();
    this.athleteIdGenerator = new AthleteIdGenerator();
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.maxFileSize = process.env.MAX_FILE_SIZE || 5242880; // 5MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf'
    ];
  }

  /**
   * Process uploaded document
   */
  async processDocument(documentId) {
    try {
      logger.info('Starting document processing', { documentId });
      
      // Get document record
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Update status to processing
      await this.updateDocumentStatus(documentId, 'processing');
      
      // Verify file exists
      const filePath = path.join(this.uploadDir, document.file_path);
      await this.verifyFileExists(filePath);
      
      // Detect document type if not specified
      let documentType = document.document_type;
      if (!documentType || documentType === 'unknown') {
        documentType = await this.ocrService.detectDocumentType(filePath);
        await this.updateDocumentType(documentId, documentType);
      }
      
      // Process with OCR
      const ocrResult = await this.ocrService.processDocument(filePath, documentType);
      
      // Validate document authenticity
      const authenticityResult = await this.ocrService.validateDocumentAuthenticity(
        filePath, 
        ocrResult.extractedData
      );
      
      // Create processing result
      const processingResult = {
        documentId,
        documentType,
        ocrText: ocrResult.ocrText,
        extractedData: ocrResult.extractedData,
        confidence: ocrResult.confidence,
        authenticity: authenticityResult,
        processedAt: new Date().toISOString()
      };
      
      // Update document with results
      await this.updateDocumentWithResults(documentId, processingResult);
      
      // Handle post-processing based on document type
      await this.handlePostProcessing(document, processingResult);
      
      logger.info('Document processing completed', { 
        documentId,
        documentType,
        confidence: ocrResult.confidence.overall,
        authentic: authenticityResult.isAuthentic
      });
      
      return processingResult;
      
    } catch (error) {
      logger.error('Document processing failed', { 
        documentId, 
        error: error.message 
      });
      
      await this.updateDocumentStatus(documentId, 'failed');
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId) {
    try {
      const result = await query(
        'SELECT * FROM document_uploads WHERE id = $1',
        [documentId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get document', { documentId, error: error.message });
      throw error;
    }
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(documentId, status) {
    try {
      await query(
        'UPDATE document_uploads SET processing_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, documentId]
      );
    } catch (error) {
      logger.error('Failed to update document status', { 
        documentId, 
        status, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update document type
   */
  async updateDocumentType(documentId, documentType) {
    try {
      await query(
        'UPDATE document_uploads SET document_type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [documentType, documentId]
      );
    } catch (error) {
      logger.error('Failed to update document type', { 
        documentId, 
        documentType, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Verify file exists
   */
  async verifyFileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }
  }

  /**
   * Update document with processing results
   */
  async updateDocumentWithResults(documentId, results) {
    try {
      await query(
        `UPDATE document_uploads SET 
         processing_status = $1,
         ocr_text = $2,
         extracted_data = $3,
         ai_analysis = $4,
         verification_status = $5,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [
          'completed',
          results.ocrText,
          JSON.stringify(results.extractedData),
          JSON.stringify({
            confidence: results.confidence,
            authenticity: results.authenticity,
            processedAt: results.processedAt
          }),
          results.authenticity.recommendation === 'auto_approve' ? 'verified' : 'requires_review',
          documentId
        ]
      );
    } catch (error) {
      logger.error('Failed to update document with results', { 
        documentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Handle post-processing based on document type
   */
  async handlePostProcessing(document, results) {
    try {
      switch (document.document_type) {
        case 'birth_certificate':
          await this.handleBirthCertificateProcessing(document, results);
          break;
        case 'school_id':
          await this.handleSchoolIdProcessing(document, results);
          break;
        case 'citizenship_certificate':
          await this.handleCitizenshipProcessing(document, results);
          break;
        default:
          logger.info('No specific post-processing for document type', { 
            documentType: document.document_type 
          });
      }
    } catch (error) {
      logger.error('Post-processing failed', { 
        documentId: document.id,
        error: error.message 
      });
      // Don't throw error here, as main processing was successful
    }
  }

  /**
   * Handle birth certificate processing
   */
  async handleBirthCertificateProcessing(document, results) {
    try {
      if (document.entity_type === 'player') {
        const extractedData = results.extractedData;
        
        // Update player with extracted information
        await this.updatePlayerFromBirthCertificate(
          document.entity_id, 
          extractedData
        );
        
        // Generate athlete ID if not exists
        if (extractedData.full_name && extractedData.date_of_birth) {
          await this.generateAthleteIdForPlayer(document.entity_id);
        }
        
        // Create notification for admin
        await this.createNotificationForAdmin(
          document.entity_id,
          'birth_certificate_processed',
          'Birth certificate processed successfully'
        );
      }
    } catch (error) {
      logger.error('Birth certificate post-processing failed', { 
        documentId: document.id,
        error: error.message 
      });
    }
  }

  /**
   * Update player from birth certificate data
   */
  async updatePlayerFromBirthCertificate(playerId, extractedData) {
    try {
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      // Map extracted data to player fields
      if (extractedData.full_name) {
        updateFields.push(`full_name = $${paramIndex++}`);
        updateValues.push(extractedData.full_name);
      }
      
      if (extractedData.date_of_birth) {
        updateFields.push(`date_of_birth = $${paramIndex++}`);
        updateValues.push(extractedData.date_of_birth);
      }
      
      if (extractedData.father_name) {
        updateFields.push(`guardian_name = $${paramIndex++}`);
        updateValues.push(extractedData.father_name);
      }
      
      if (extractedData.place_of_birth) {
        updateFields.push(`address = $${paramIndex++}`);
        updateValues.push(extractedData.place_of_birth);
      }
      
      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(playerId);
        
        const updateQuery = `
          UPDATE players 
          SET ${updateFields.join(', ')} 
          WHERE id = $${paramIndex}
        `;
        
        await query(updateQuery, updateValues);
        
        logger.info('Player updated from birth certificate', { 
          playerId, 
          fieldsUpdated: updateFields.length - 1 
        });
      }
    } catch (error) {
      logger.error('Failed to update player from birth certificate', { 
        playerId, 
        error: error.message 
      });
    }
  }

  /**
   * Generate athlete ID for player
   */
  async generateAthleteIdForPlayer(playerId) {
    try {
      const result = await this.athleteIdGenerator.generateForPlayer(playerId);
      logger.info('Athlete ID generated during document processing', { 
        playerId, 
        athleteId: result.athleteId,
        isNew: result.isNew
      });
      return result;
    } catch (error) {
      logger.error('Failed to generate athlete ID during document processing', { 
        playerId, 
        error: error.message 
      });
    }
  }

  /**
   * Create notification for admin
   */
  async createNotificationForAdmin(entityId, type, message) {
    try {
      // Find school admin for the entity
      const adminResult = await query(`
        SELECT u.id 
        FROM users u 
        JOIN schools s ON u.school_id = s.id 
        JOIN players p ON p.school_id = s.id 
        WHERE p.id = $1 AND u.role = 'SchoolAdmin'
        LIMIT 1
      `, [entityId]);
      
      if (adminResult.rows.length > 0) {
        const adminId = adminResult.rows[0].id;
        
        await query(`
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          adminId,
          type,
          'Document Processing Complete',
          message,
          JSON.stringify({ entityId, entityType: 'player' })
        ]);
        
        logger.info('Notification created for admin', { 
          adminId, 
          entityId, 
          type 
        });
      }
    } catch (error) {
      logger.error('Failed to create admin notification', { 
        entityId, 
        type, 
        error: error.message 
      });
    }
  }

  /**
   * Handle school ID processing
   */
  async handleSchoolIdProcessing(document, results) {
    try {
      // Similar logic for school ID documents
      logger.info('Processing school ID document', { 
        documentId: document.id,
        extractedData: results.extractedData
      });
    } catch (error) {
      logger.error('School ID post-processing failed', { 
        documentId: document.id,
        error: error.message 
      });
    }
  }

  /**
   * Handle citizenship certificate processing
   */
  async handleCitizenshipProcessing(document, results) {
    try {
      // Similar logic for citizenship documents
      logger.info('Processing citizenship document', { 
        documentId: document.id,
        extractedData: results.extractedData
      });
    } catch (error) {
      logger.error('Citizenship post-processing failed', { 
        documentId: document.id,
        error: error.message 
      });
    }
  }

  /**
   * Validate uploaded file
   */
  async validateUploadedFile(file) {
    const validation = {
      valid: true,
      errors: []
    };
    
    // Check file size
    if (file.size > this.maxFileSize) {
      validation.valid = false;
      validation.errors.push(`File size too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
    }
    
    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      validation.valid = false;
      validation.errors.push(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }
    
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      validation.valid = false;
      validation.errors.push(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`);
    }
    
    return validation;
  }

  /**
   * Get processing queue status
   */
  async getProcessingQueueStatus() {
    try {
      const result = await query(`
        SELECT 
          processing_status,
          COUNT(*) as count
        FROM document_uploads
        GROUP BY processing_status
      `);
      
      const stats = {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };
      
      result.rows.forEach(row => {
        stats.total += parseInt(row.count);
        stats[row.processing_status] = parseInt(row.count);
      });
      
      return stats;
    } catch (error) {
      logger.error('Failed to get processing queue status', { error: error.message });
      throw error;
    }
  }

  /**
   * Reprocess failed documents
   */
  async reprocessFailedDocuments() {
    try {
      const failedDocs = await query(
        'SELECT id FROM document_uploads WHERE processing_status = $1',
        ['failed']
      );
      
      const results = [];
      
      for (const doc of failedDocs.rows) {
        try {
          await this.processDocument(doc.id);
          results.push({ documentId: doc.id, success: true });
        } catch (error) {
          results.push({ documentId: doc.id, success: false, error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Failed to reprocess failed documents', { error: error.message });
      throw error;
    }
  }
}

module.exports = DocumentProcessor;
