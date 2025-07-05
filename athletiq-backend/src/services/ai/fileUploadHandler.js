// src/services/ai/fileUploadHandler.js - File Upload and Management Service
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { pool, query } = require('../../config/db');
const { logger } = require('../../config/db');
const QueueProcessor = require('../queue/queueProcessor');

class FileUploadHandler {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf'
    ];
    
    this.queueProcessor = new QueueProcessor();
    
    // Initialize multer storage
    this.storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          const uploadPath = path.join(this.uploadDir);
          await this.ensureDirectoryExists(uploadPath);
          cb(null, uploadPath);
        } catch (error) {
          cb(error, null);
        }
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });
    
    // Configure multer
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: this.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`), false);
        }
      }
    });
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
      logger.info('Upload directory created', { dirPath });
    }
  }

  /**
   * Get upload middleware
   */
  getUploadMiddleware(fieldName = 'document', maxCount = 1) {
    if (maxCount === 1) {
      return this.upload.single(fieldName);
    } else {
      return this.upload.array(fieldName, maxCount);
    }
  }

  /**
   * Handle document upload from Express request
   */
  async handleDocumentUpload(req, metadata) {
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }

      logger.info('Processing document upload', { 
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        metadata
      });

      // Validate the uploaded file
      const validation = await this.validateFile(req.file);
      if (!validation.valid) {
        await this.cleanupFile(req.file.path);
        throw new Error(validation.errors.join(', '));
      }

      // Create document record
      const documentRecord = await this.createDocumentRecord(req.file, metadata);

      // Add to processing queue
      const queueResult = await this.queueProcessor.addDocumentToQueue(
        documentRecord.id,
        metadata.priority || 5
      );

      logger.info('Document upload processed successfully', { 
        documentId: documentRecord.id,
        filename: req.file.filename,
        queuePosition: queueResult.position
      });

      return {
        upload_id: documentRecord.id,
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        processing_status: 'queued',
        queue_position: queueResult.position,
        uploaded_at: documentRecord.created_at
      };

    } catch (error) {
      logger.error('Document upload failed', { 
        error: error.message,
        filename: req.file?.filename,
        metadata
      });

      // Cleanup file on error
      if (req.file?.path) {
        await this.cleanupFile(req.file.path);
      }

      throw error;
    }
  }

  /**
   * Handle file upload (legacy method)
   */
  async handleFileUpload(file, uploadData) {
    try {
      logger.info('Handling file upload', { 
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
      
      // Validate file
      const validation = await this.validateFile(file);
      if (!validation.valid) {
        await this.cleanupFile(file.path);
        throw new Error(validation.errors.join(', '));
      }
      
      // Create document record
      const documentRecord = await this.createDocumentRecord(file, uploadData);
      
      // Add to processing queue
      await this.queueProcessor.addDocumentToQueue(
        documentRecord.id,
        uploadData.priority || 5
      );
      
      logger.info('File upload handled successfully', { 
        documentId: documentRecord.id,
        filename: file.filename
      });
      
      return {
        documentId: documentRecord.id,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded'
      };
      
    } catch (error) {
      logger.error('File upload handling failed', { 
        error: error.message,
        filename: file?.filename
      });
      
      // Cleanup file on error
      if (file?.path) {
        await this.cleanupFile(file.path);
      }
      
      throw error;
    }
  }

  /**
   * Validate uploaded file
   */
  async validateFile(file) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check file size
    if (file.size > this.maxFileSize) {
      validation.valid = false;
      validation.errors.push(`File size too large. Maximum: ${this.maxFileSize / 1024 / 1024}MB`);
    }
    
    // Check file size minimum
    if (file.size < 1024) { // 1KB minimum
      validation.valid = false;
      validation.errors.push('File too small. Minimum size: 1KB');
    }
    
    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      validation.valid = false;
      validation.errors.push(`Invalid file type: ${file.mimetype}`);
    }
    
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      validation.valid = false;
      validation.errors.push(`Invalid file extension: ${fileExtension}`);
    }
    
    // Check if file exists and is readable
    try {
      await fs.access(file.path, fs.constants.R_OK);
    } catch (error) {
      validation.valid = false;
      validation.errors.push('File is not readable');
    }
    
    // Additional checks for image files
    if (file.mimetype.startsWith('image/')) {
      // Could add image-specific validation here
      validation.warnings.push('Image file detected - ensure good quality for better OCR results');
    }
    
    return validation;
  }

  /**
   * Create document record in database
   */
  async createDocumentRecord(file, uploadData) {
    try {
      const result = await query(`
        INSERT INTO document_uploads (
          entity_type, entity_id, document_type, original_filename, 
          file_path, file_size, mime_type, uploaded_by, processing_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        uploadData.entityType || 'player',
        uploadData.entityId,
        uploadData.documentType || 'unknown',
        file.originalname,
        file.filename, // Store relative path
        file.size,
        file.mimetype,
        uploadData.uploadedBy,
        'pending'
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create document record', { 
        error: error.message,
        uploadData
      });
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
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const document = result.rows[0];
      
      // Add full file path
      document.fullPath = path.join(this.uploadDir, document.file_path);
      
      // Check if file exists
      try {
        await fs.access(document.fullPath);
        document.fileExists = true;
      } catch (error) {
        document.fileExists = false;
      }
      
      return document;
    } catch (error) {
      logger.error('Failed to get document', { 
        documentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get documents for entity
   */
  async getDocumentsForEntity(entityType, entityId) {
    try {
      const result = await query(
        `SELECT * FROM document_uploads 
         WHERE entity_type = $1 AND entity_id = $2 
         ORDER BY created_at DESC`,
        [entityType, entityId]
      );
      
      return result.rows.map(doc => ({
        ...doc,
        fullPath: path.join(this.uploadDir, doc.file_path)
      }));
    } catch (error) {
      logger.error('Failed to get documents for entity', { 
        entityType, 
        entityId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId, deletedBy) {
    try {
      // Get document info
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Delete file from filesystem
      if (document.fileExists) {
        await this.cleanupFile(document.fullPath);
      }
      
      // Update database record (soft delete)
      await query(
        `UPDATE document_uploads 
         SET processing_status = 'deleted', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [documentId]
      );
      
      // Log the deletion
      logger.info('Document deleted', { 
        documentId, 
        filename: document.file_path,
        deletedBy
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to delete document', { 
        documentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Cleanup file from filesystem
   */
  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info('File cleaned up', { filePath });
    } catch (error) {
      logger.warn('Failed to cleanup file', { 
        filePath, 
        error: error.message 
      });
    }
  }

  /**
   * Get file download stream
   */
  async getFileStream(documentId) {
    try {
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      
      if (!document.fileExists) {
        throw new Error('File not found on filesystem');
      }
      
      return {
        stream: require('fs').createReadStream(document.fullPath),
        filename: document.original_filename,
        mimeType: document.mime_type,
        size: document.file_size
      };
    } catch (error) {
      logger.error('Failed to get file stream', { 
        documentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(documentId, status, additionalData = {}) {
    try {
      const updateFields = ['processing_status = $1', 'updated_at = CURRENT_TIMESTAMP'];
      const updateValues = [status];
      let paramIndex = 2;
      
      // Add additional fields if provided
      if (additionalData.verificationStatus) {
        updateFields.push(`verification_status = $${paramIndex++}`);
        updateValues.push(additionalData.verificationStatus);
      }
      
      if (additionalData.verifiedBy) {
        updateFields.push(`verified_by = $${paramIndex++}`);
        updateValues.push(additionalData.verifiedBy);
      }
      
      if (additionalData.rejectionReason) {
        updateFields.push(`rejection_reason = $${paramIndex++}`);
        updateValues.push(additionalData.rejectionReason);
      }
      
      updateValues.push(documentId);
      
      await query(
        `UPDATE document_uploads SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        updateValues
      );
      
      logger.info('Document status updated', { 
        documentId, 
        status, 
        additionalData 
      });
      
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
   * Get upload statistics
   */
  async getUploadStatistics() {
    try {
      const stats = await query(`
        SELECT 
          document_type,
          processing_status,
          COUNT(*) as count,
          AVG(file_size) as avg_size,
          SUM(file_size) as total_size
        FROM document_uploads 
        WHERE processing_status != 'deleted'
        GROUP BY document_type, processing_status
        ORDER BY document_type, processing_status
      `);
      
      const summary = await query(`
        SELECT 
          COUNT(*) as total_documents,
          SUM(file_size) as total_storage,
          AVG(file_size) as average_file_size,
          MAX(created_at) as latest_upload
        FROM document_uploads 
        WHERE processing_status != 'deleted'
      `);
      
      return {
        detailed: stats.rows,
        summary: summary.rows[0]
      };
    } catch (error) {
      logger.error('Failed to get upload statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Cleanup old files
   */
  async cleanupOldFiles(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const oldFiles = await query(
        `SELECT * FROM document_uploads 
         WHERE created_at < $1 AND (processing_status = 'failed' OR processing_status = 'deleted')`,
        [cutoffDate.toISOString()]
      );
      
      let cleanedCount = 0;
      
      for (const file of oldFiles.rows) {
        try {
          const filePath = path.join(this.uploadDir, file.file_path);
          await this.cleanupFile(filePath);
          cleanedCount++;
        } catch (error) {
          logger.warn('Failed to cleanup old file', { 
            fileId: file.id, 
            error: error.message 
          });
        }
      }
      
      logger.info('Old files cleanup completed', { 
        totalFiles: oldFiles.rows.length,
        cleanedCount,
        daysOld
      });
      
      return { totalFiles: oldFiles.rows.length, cleanedCount };
    } catch (error) {
      logger.error('Failed to cleanup old files', { error: error.message });
      throw error;
    }
  }
}

module.exports = FileUploadHandler;
