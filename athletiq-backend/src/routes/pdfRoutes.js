const express = require('express');
const router = express.Router();
const ScoresheetGeneratorService = require('../services/pdfGeneration/ScoresheetGeneratorService');

/**
 * PDF Generation Routes
 * Handles API endpoints for scoresheet PDF generation
 */

/**
 * GET /api/pdf/sports
 * Get list of supported sports
 */
router.get('/sports', async (req, res) => {
  try {
    const sports = ScoresheetGeneratorService.getSupportedSports();
    res.json({
      success: true,
      data: sports,
      count: sports.length
    });
  } catch (error) {
    console.error('Error getting sports list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sports list',
      message: error.message
    });
  }
});

/**
 * GET /api/pdf/status
 * Get service status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await ScoresheetGeneratorService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status',
      message: error.message
    });
  }
});

/**
 * POST /api/pdf/preview
 * Generate HTML preview for a scoresheet
 */
router.post('/preview', async (req, res) => {
  try {
    const { sport, data, options } = req.body;

    if (!sport) {
      return res.status(400).json({
        success: false,
        error: 'Sport is required'
      });
    }

    const html = ScoresheetGeneratorService.generatePreview(sport, data, options);
    
    res.json({
      success: true,
      data: {
        html,
        sport,
        generated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview',
      message: error.message
    });
  }
});

/**
 * POST /api/pdf/single
 * Generate a single scoresheet PDF
 */
router.post('/single', async (req, res) => {
  try {
    const { sport, data, options } = req.body;

    if (!sport) {
      return res.status(400).json({
        success: false,
        error: 'Sport is required'
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }

    const pdfBuffer = await ScoresheetGeneratorService.generateSingleScoresheet(sport, data, options);
    
    // Set headers for PDF download
    const filename = `${sport}_scoresheet_${data.match?.id || 'single'}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating single PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
});

/**
 * POST /api/pdf/batch
 * Generate multiple scoresheets as ZIP
 */
router.post('/batch', async (req, res) => {
  try {
    const { scoresheets, options } = req.body;

    if (!scoresheets || !Array.isArray(scoresheets) || scoresheets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Scoresheets array is required and must not be empty'
      });
    }

    const zipBuffer = await ScoresheetGeneratorService.generateBatchScoresheets(scoresheets, options);
    
    // Set headers for ZIP download
    const filename = `scoresheets_batch_${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    
    res.send(zipBuffer);
  } catch (error) {
    console.error('Error generating batch PDFs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch PDFs',
      message: error.message
    });
  }
});

/**
 * POST /api/pdf/round
 * Generate scoresheets for an entire tournament round
 */
router.post('/round', async (req, res) => {
  try {
    const { sport, matches, tournament, options } = req.body;

    if (!sport) {
      return res.status(400).json({
        success: false,
        error: 'Sport is required'
      });
    }

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Matches array is required and must not be empty'
      });
    }

    if (!tournament) {
      return res.status(400).json({
        success: false,
        error: 'Tournament information is required'
      });
    }

    const zipBuffer = await ScoresheetGeneratorService.generateRoundScoresheets(sport, matches, tournament, options);
    
    // Set headers for ZIP download
    const filename = `${sport}_${tournament.round || 'round'}_scoresheets_${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    
    res.send(zipBuffer);
  } catch (error) {
    console.error('Error generating round PDFs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate round PDFs',
      message: error.message
    });
  }
});

/**
 * GET /api/pdf/sample/:sport
 * Generate a sample scoresheet with test data (GET method for easier testing)
 */
router.get('/sample/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { format = 'blank' } = req.query;

    // Get sample data for the sport
    const sampleData = ScoresheetGeneratorService.templateService.getSampleData(sport);
    
    const pdfBuffer = await ScoresheetGeneratorService.generateSingleScoresheet(sport, sampleData, {
      format
    });
    
    // Set headers for PDF download
    const filename = `${sport}_sample_scoresheet_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating sample PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sample PDF',
      message: error.message
    });
  }
});

/**
 * POST /api/pdf/sample
 * Generate a sample scoresheet with test data
 */
router.post('/sample', async (req, res) => {
  try {
    const { sport, format, options } = req.body;

    if (!sport) {
      return res.status(400).json({
        success: false,
        error: 'Sport is required'
      });
    }

    // Get sample data for the sport
    const sampleData = ScoresheetGeneratorService.templateService.getSampleData(sport);
    
    const pdfBuffer = await ScoresheetGeneratorService.generateSingleScoresheet(sport, sampleData, {
      ...options,
      format: format || 'blank'
    });
    
    // Set headers for PDF download
    const filename = `${sport}_sample_scoresheet_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating sample PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sample PDF',
      message: error.message
    });
  }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
  console.error('PDF API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

module.exports = router;
