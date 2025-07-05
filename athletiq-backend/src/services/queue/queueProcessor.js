// src/services/queue/queueProcessor.js - AI Job Queue Processing Service
require('dotenv').config();
const Queue = require('bull');
const Redis = require('ioredis');
const { pool, query } = require('../../config/db');
const { logger } = require('../../config/db');
const DocumentProcessor = require('../ai/documentProcessor');

class QueueProcessor {
  constructor() {
    // Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
    
    // Initialize queues
    this.documentQueue = new Queue('document processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || ''
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });
    
    this.aiQueue = new Queue('ai processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || ''
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000
        }
      }
    });
    
    // Initialize processors
    this.documentProcessor = new DocumentProcessor();
    
    // Set up queue processors
    this.setupQueueProcessors();
    
    // Set up queue event handlers
    this.setupQueueEventHandlers();
  }

  /**
   * Setup queue processors
   */
  setupQueueProcessors() {
    // Document processing queue
    this.documentQueue.process('process_document', 5, async (job) => {
      return this.processDocumentJob(job);
    });
    
    // AI processing queue
    this.aiQueue.process('ocr_extraction', 3, async (job) => {
      return this.processOCRJob(job);
    });
    
    this.aiQueue.process('data_validation', 2, async (job) => {
      return this.processDataValidationJob(job);
    });
    
    this.aiQueue.process('authenticity_check', 2, async (job) => {
      return this.processAuthenticityCheckJob(job);
    });
    
    logger.info('Queue processors initialized');
  }

  /**
   * Setup queue event handlers
   */
  setupQueueEventHandlers() {
    // Document queue events
    this.documentQueue.on('completed', (job, result) => {
      logger.info('Document processing job completed', { 
        jobId: job.id,
        documentId: job.data.documentId,
        processingTime: Date.now() - job.timestamp
      });
    });
    
    this.documentQueue.on('failed', (job, err) => {
      logger.error('Document processing job failed', { 
        jobId: job.id,
        documentId: job.data.documentId,
        error: err.message,
        attempts: job.attemptsMade
      });
    });
    
    this.documentQueue.on('stalled', (job) => {
      logger.warn('Document processing job stalled', { 
        jobId: job.id,
        documentId: job.data.documentId
      });
    });
    
    // AI queue events
    this.aiQueue.on('completed', (job, result) => {
      logger.info('AI processing job completed', { 
        jobId: job.id,
        jobType: job.name,
        processingTime: Date.now() - job.timestamp
      });
    });
    
    this.aiQueue.on('failed', (job, err) => {
      logger.error('AI processing job failed', { 
        jobId: job.id,
        jobType: job.name,
        error: err.message,
        attempts: job.attemptsMade
      });
    });
  }

  /**
   * Add document to processing queue
   */
  async addDocumentToQueue(documentId, priority = 5) {
    try {
      const job = await this.documentQueue.add('process_document', {
        documentId,
        queuedAt: new Date().toISOString()
      }, {
        priority: priority,
        delay: 0
      });
      
      // Update database record
      await this.updateAIProcessingQueue(documentId, 'document_processing', {
        jobId: job.id,
        priority,
        queuedAt: new Date().toISOString()
      });
      
      logger.info('Document added to processing queue', { 
        documentId, 
        jobId: job.id,
        priority
      });
      
      return job;
    } catch (error) {
      logger.error('Failed to add document to queue', { 
        documentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process document job
   */
  async processDocumentJob(job) {
    const { documentId } = job.data;
    
    try {
      // Update job status
      await this.updateJobStatus(documentId, 'processing');
      
      // Process the document
      const result = await this.documentProcessor.processDocument(documentId);
      
      // Update job status
      await this.updateJobStatus(documentId, 'completed', result);
      
      // Update job progress
      job.progress(100);
      
      return result;
    } catch (error) {
      await this.updateJobStatus(documentId, 'failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Process OCR job
   */
  async processOCRJob(job) {
    const { documentId, filePath, documentType } = job.data;
    
    try {
      job.progress(10);
      
      const ocrResult = await this.documentProcessor.ocrService.processDocument(
        filePath, 
        documentType
      );
      
      job.progress(100);
      
      return ocrResult;
    } catch (error) {
      logger.error('OCR job failed', { 
        documentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process data validation job
   */
  async processDataValidationJob(job) {
    const { documentId, extractedData } = job.data;
    
    try {
      job.progress(10);
      
      // Validate extracted data
      const validation = await this.validateExtractedData(extractedData);
      
      job.progress(100);
      
      return validation;
    } catch (error) {
      logger.error('Data validation job failed', { 
        documentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process authenticity check job
   */
  async processAuthenticityCheckJob(job) {
    const { documentId, filePath, extractedData } = job.data;
    
    try {
      job.progress(10);
      
      const authenticityResult = await this.documentProcessor.ocrService.validateDocumentAuthenticity(
        filePath, 
        extractedData
      );
      
      job.progress(100);
      
      return authenticityResult;
    } catch (error) {
      logger.error('Authenticity check job failed', { 
        documentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update AI processing queue in database
   */
  async updateAIProcessingQueue(entityId, jobType, payload) {
    try {
      await query(`
        INSERT INTO ai_processing_queue (entity_type, entity_id, job_type, payload, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (entity_type, entity_id, job_type) 
        DO UPDATE SET payload = $4, status = $5, updated_at = CURRENT_TIMESTAMP
      `, [
        'document',
        entityId,
        jobType,
        JSON.stringify(payload),
        'pending'
      ]);
    } catch (error) {
      logger.error('Failed to update AI processing queue', { 
        entityId, 
        jobType, 
        error: error.message 
      });
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(documentId, status, result = null) {
    try {
      await query(`
        UPDATE ai_processing_queue 
        SET status = $1, result = $2, updated_at = CURRENT_TIMESTAMP
        WHERE entity_id = $3 AND entity_type = 'document'
      `, [
        status,
        result ? JSON.stringify(result) : null,
        documentId
      ]);
    } catch (error) {
      logger.error('Failed to update job status', { 
        documentId, 
        status, 
        error: error.message 
      });
    }
  }

  /**
   * Validate extracted data
   */
  async validateExtractedData(data) {
    // Basic validation logic
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check for required fields
    if (!data.full_name) {
      validation.errors.push('Full name is required');
      validation.valid = false;
    }
    
    if (!data.date_of_birth) {
      validation.errors.push('Date of birth is required');
      validation.valid = false;
    }
    
    // Validate date format
    if (data.date_of_birth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date_of_birth)) {
        validation.errors.push('Invalid date format');
        validation.valid = false;
      }
    }
    
    // Check for suspicious patterns
    if (data.full_name && data.full_name.length < 3) {
      validation.warnings.push('Name seems too short');
    }
    
    return validation;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const docQueueStats = await this.documentQueue.getJobCounts();
      const aiQueueStats = await this.aiQueue.getJobCounts();
      
      return {
        documentQueue: docQueueStats,
        aiQueue: aiQueueStats,
        redis: {
          connected: this.redis.status === 'ready'
        }
      };
    } catch (error) {
      logger.error('Failed to get queue stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear failed jobs
   */
  async clearFailedJobs() {
    try {
      await this.documentQueue.clean(0, 'failed');
      await this.aiQueue.clean(0, 'failed');
      
      logger.info('Failed jobs cleared from queues');
    } catch (error) {
      logger.error('Failed to clear failed jobs', { error: error.message });
      throw error;
    }
  }

  /**
   * Retry failed jobs
   */
  async retryFailedJobs() {
    try {
      const failedDocJobs = await this.documentQueue.getFailed();
      const failedAIJobs = await this.aiQueue.getFailed();
      
      for (const job of failedDocJobs) {
        await job.retry();
      }
      
      for (const job of failedAIJobs) {
        await job.retry();
      }
      
      logger.info('Failed jobs retried', { 
        documentJobs: failedDocJobs.length,
        aiJobs: failedAIJobs.length
      });
    } catch (error) {
      logger.error('Failed to retry failed jobs', { error: error.message });
      throw error;
    }
  }

  /**
   * Get job details
   */
  async getJobDetails(jobId) {
    try {
      const docJob = await this.documentQueue.getJob(jobId);
      const aiJob = await this.aiQueue.getJob(jobId);
      
      return docJob || aiJob;
    } catch (error) {
      logger.error('Failed to get job details', { jobId, error: error.message });
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      await this.documentQueue.close();
      await this.aiQueue.close();
      await this.redis.disconnect();
      
      logger.info('Queue processor shutdown completed');
    } catch (error) {
      logger.error('Queue processor shutdown failed', { error: error.message });
    }
  }
}

module.exports = QueueProcessor;
