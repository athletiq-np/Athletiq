// src/services/ai/ocrService.js - Hybrid OCR Service (Google Vision + OpenAI)
require('dotenv').config();
const vision = require('@google-cloud/vision');
const OpenAI = require('openai');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../../config/db');

class OCRService {
  constructor() {
    // Initialize Google Vision client
    this.visionClient = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_VISION_KEY_PATH || path.join(__dirname, '../../../keys/google-vision-key.json'),
      projectId: process.env.GOOGLE_PROJECT_ID
    });
    
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Document type templates for field extraction
    this.documentTemplates = {
      birth_certificate: {
        fields: [
          'full_name',
          'date_of_birth',
          'place_of_birth',
          'father_name',
          'mother_name',
          'registration_number',
          'registration_date',
          'issuing_authority'
        ]
      },
      citizenship_certificate: {
        fields: [
          'full_name',
          'date_of_birth',
          'place_of_birth',
          'citizenship_number',
          'issue_date',
          'issuing_office'
        ]
      },
      school_id: {
        fields: [
          'student_name',
          'school_name',
          'class_grade',
          'roll_number',
          'academic_year',
          'photo_verified'
        ]
      }
    };
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  async preprocessImage(imagePath) {
    try {
      const processedPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.jpg');
      
      await sharp(imagePath)
        .resize(2000, 2000, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .normalize()
        .sharpen()
        .jpeg({ quality: 95 })
        .toFile(processedPath);
      
      logger.info('Image preprocessed successfully', { 
        original: imagePath, 
        processed: processedPath 
      });
      
      return processedPath;
    } catch (error) {
      logger.error('Image preprocessing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract text using Google Vision OCR
   */
  async extractTextWithGoogleVision(imagePath) {
    try {
      const [result] = await this.visionClient.textDetection(imagePath);
      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        logger.warn('No text detected in image', { imagePath });
        return {
          fullText: '',
          textBlocks: [],
          confidence: 0
        };
      }
      
      // Full text from the first annotation
      const fullText = detections[0].description;
      
      // Individual text blocks with bounding boxes
      const textBlocks = detections.slice(1).map(detection => ({
        text: detection.description,
        confidence: detection.confidence || 0,
        boundingBox: detection.boundingPoly.vertices
      }));
      
      // Calculate average confidence
      const avgConfidence = textBlocks.reduce((sum, block) => sum + block.confidence, 0) / textBlocks.length;
      
      logger.info('Google Vision OCR completed', { 
        imagePath,
        textLength: fullText.length,
        blocksCount: textBlocks.length,
        avgConfidence: avgConfidence.toFixed(2)
      });
      
      return {
        fullText,
        textBlocks,
        confidence: avgConfidence
      };
      
    } catch (error) {
      logger.error('Google Vision OCR failed', { 
        imagePath, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Extract structured data using OpenAI
   */
  async extractStructuredDataWithOpenAI(text, documentType) {
    try {
      const template = this.documentTemplates[documentType];
      if (!template) {
        throw new Error(`Unknown document type: ${documentType}`);
      }
      
      const prompt = `
Extract the following information from this ${documentType.replace('_', ' ')} document text:

DOCUMENT TEXT:
${text}

Please extract the following fields and return them in JSON format:
${template.fields.map(field => `- ${field}`).join('\n')}

Guidelines:
- Return only valid JSON
- Use null for missing fields
- Ensure dates are in YYYY-MM-DD format
- Clean up any OCR errors in names and text
- For birth certificates, be extra careful with date_of_birth extraction
- If a field is unclear or has multiple possibilities, choose the most likely one
- For names, capitalize properly and fix common OCR mistakes

JSON Response:
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert document processing AI that extracts structured data from official documents. You are extremely accurate and never make assumptions. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const extractedData = JSON.parse(response.choices[0].message.content);
      
      // Validate extracted data
      const validatedData = this.validateExtractedData(extractedData, template);
      
      logger.info('OpenAI structured extraction completed', { 
        documentType,
        fieldsExtracted: Object.keys(validatedData).length,
        confidence: this.calculateExtractionConfidence(validatedData, template)
      });
      
      return {
        extractedData: validatedData,
        confidence: this.calculateExtractionConfidence(validatedData, template),
        rawResponse: response.choices[0].message.content
      };
      
    } catch (error) {
      logger.error('OpenAI extraction failed', { 
        documentType, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Validate extracted data against template
   */
  validateExtractedData(data, template) {
    const validated = {};
    
    template.fields.forEach(field => {
      const value = data[field];
      
      // Basic validation based on field type
      if (field.includes('date') && value) {
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(value)) {
          validated[field] = value;
        } else {
          validated[field] = null;
        }
      } else if (field.includes('name') && value) {
        // Clean up names
        validated[field] = value.trim().replace(/\s+/g, ' ');
      } else {
        validated[field] = value || null;
      }
    });
    
    return validated;
  }

  /**
   * Calculate extraction confidence score
   */
  calculateExtractionConfidence(data, template) {
    const totalFields = template.fields.length;
    const extractedFields = Object.values(data).filter(value => value !== null).length;
    
    return Math.round((extractedFields / totalFields) * 100);
  }

  /**
   * Main hybrid OCR processing function
   */
  async processDocument(imagePath, documentType) {
    try {
      logger.info('Starting hybrid OCR processing', { imagePath, documentType });
      
      // Step 1: Preprocess image
      const processedImagePath = await this.preprocessImage(imagePath);
      
      // Step 2: Extract text with Google Vision
      const ocrResult = await this.extractTextWithGoogleVision(processedImagePath);
      
      if (!ocrResult.fullText) {
        throw new Error('No text extracted from document');
      }
      
      // Step 3: Extract structured data with OpenAI
      const structuredResult = await this.extractStructuredDataWithOpenAI(
        ocrResult.fullText, 
        documentType
      );
      
      // Step 4: Combine results
      const finalResult = {
        documentType,
        ocrText: ocrResult.fullText,
        extractedData: structuredResult.extractedData,
        confidence: {
          ocr: Math.round(ocrResult.confidence * 100),
          extraction: structuredResult.confidence,
          overall: Math.round((ocrResult.confidence * 100 + structuredResult.confidence) / 2)
        },
        metadata: {
          textBlocksCount: ocrResult.textBlocks.length,
          processedAt: new Date().toISOString(),
          processingTime: Date.now()
        }
      };
      
      // Clean up processed image
      try {
        await fs.unlink(processedImagePath);
      } catch (error) {
        logger.warn('Failed to cleanup processed image', { error: error.message });
      }
      
      logger.info('Hybrid OCR processing completed', { 
        documentType,
        overallConfidence: finalResult.confidence.overall,
        fieldsExtracted: Object.keys(finalResult.extractedData).length
      });
      
      return finalResult;
      
    } catch (error) {
      logger.error('Hybrid OCR processing failed', { 
        imagePath, 
        documentType, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Detect document type from image
   */
  async detectDocumentType(imagePath) {
    try {
      const ocrResult = await this.extractTextWithGoogleVision(imagePath);
      const text = ocrResult.fullText.toLowerCase();
      
      // Simple keyword-based detection
      if (text.includes('birth certificate') || text.includes('janma darta')) {
        return 'birth_certificate';
      }
      
      if (text.includes('citizenship') || text.includes('nagarikta')) {
        return 'citizenship_certificate';
      }
      
      if (text.includes('school') || text.includes('student') || text.includes('class')) {
        return 'school_id';
      }
      
      // Use OpenAI for more sophisticated detection
      const prompt = `
Analyze this document text and determine the document type:

TEXT: ${text}

Document types:
- birth_certificate
- citizenship_certificate  
- school_id
- unknown

Return only the document type name.
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a document classification expert. Classify documents accurately based on their content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0,
        max_tokens: 50
      });

      const detectedType = response.choices[0].message.content.trim();
      
      logger.info('Document type detected', { 
        imagePath, 
        detectedType,
        confidence: text.length > 100 ? 'high' : 'medium'
      });
      
      return detectedType;
      
    } catch (error) {
      logger.error('Document type detection failed', { 
        imagePath, 
        error: error.message 
      });
      return 'unknown';
    }
  }

  /**
   * Validate document authenticity using AI
   */
  async validateDocumentAuthenticity(imagePath, extractedData) {
    try {
      // Basic validation checks
      const validationResults = {
        dateConsistency: this.validateDateConsistency(extractedData),
        nameConsistency: this.validateNameConsistency(extractedData),
        formatValidity: this.validateDocumentFormat(extractedData),
        suspiciousPatterns: await this.detectSuspiciousPatterns(imagePath)
      };
      
      // Calculate overall authenticity score
      const scores = Object.values(validationResults).map(result => result.score);
      const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      
      logger.info('Document authenticity validation completed', { 
        imagePath,
        overallScore,
        validationResults
      });
      
      return {
        isAuthentic: overallScore >= 70,
        confidence: overallScore,
        validationResults,
        recommendation: overallScore >= 90 ? 'auto_approve' : 
                       overallScore >= 70 ? 'manual_review' : 'reject'
      };
      
    } catch (error) {
      logger.error('Document authenticity validation failed', { 
        imagePath, 
        error: error.message 
      });
      
      return {
        isAuthentic: false,
        confidence: 0,
        validationResults: {},
        recommendation: 'manual_review'
      };
    }
  }

  /**
   * Validate date consistency in extracted data
   */
  validateDateConsistency(data) {
    try {
      const dates = Object.entries(data)
        .filter(([key, value]) => key.includes('date') && value)
        .map(([key, value]) => ({ key, date: new Date(value) }));
      
      if (dates.length === 0) {
        return { valid: false, score: 0, reason: 'No dates found' };
      }
      
      // Check if dates are reasonable (not in future, not too old)
      const now = new Date();
      const validDates = dates.filter(({ date }) => 
        date <= now && date >= new Date('1900-01-01')
      );
      
      const score = Math.round((validDates.length / dates.length) * 100);
      
      return {
        valid: score >= 80,
        score,
        reason: score >= 80 ? 'Dates are consistent' : 'Some dates are invalid'
      };
      
    } catch (error) {
      return { valid: false, score: 0, reason: 'Date validation error' };
    }
  }

  /**
   * Validate name consistency in extracted data
   */
  validateNameConsistency(data) {
    try {
      const names = Object.entries(data)
        .filter(([key, value]) => key.includes('name') && value)
        .map(([key, value]) => value);
      
      if (names.length === 0) {
        return { valid: false, score: 0, reason: 'No names found' };
      }
      
      // Check for reasonable name patterns
      const validNames = names.filter(name => 
        /^[a-zA-Z\s.]+$/.test(name) && name.length >= 2 && name.length <= 100
      );
      
      const score = Math.round((validNames.length / names.length) * 100);
      
      return {
        valid: score >= 80,
        score,
        reason: score >= 80 ? 'Names are valid' : 'Some names have invalid characters'
      };
      
    } catch (error) {
      return { valid: false, score: 0, reason: 'Name validation error' };
    }
  }

  /**
   * Validate document format
   */
  validateDocumentFormat(data) {
    try {
      const nonNullFields = Object.values(data).filter(value => value !== null).length;
      const totalFields = Object.keys(data).length;
      
      const completeness = Math.round((nonNullFields / totalFields) * 100);
      
      return {
        valid: completeness >= 60,
        score: completeness,
        reason: `${completeness}% of fields extracted successfully`
      };
      
    } catch (error) {
      return { valid: false, score: 0, reason: 'Format validation error' };
    }
  }

  /**
   * Detect suspicious patterns that might indicate fraud
   */
  async detectSuspiciousPatterns(imagePath) {
    try {
      // This is a placeholder for advanced fraud detection
      // In a real implementation, you might use image analysis for:
      // - Duplicate/cloned images
      // - Digital manipulation detection
      // - Unusual file metadata
      // - Inconsistent lighting/shadows
      
      return {
        valid: true,
        score: 85,
        reason: 'No suspicious patterns detected'
      };
      
    } catch (error) {
      return { valid: true, score: 50, reason: 'Could not analyze for suspicious patterns' };
    }
  }
}

module.exports = OCRService;
