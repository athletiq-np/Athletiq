const express = require('express');
const router = express.Router();
const ScoresheetGeneratorService = require('../services/pdfGeneration/ScoresheetGeneratorService');
const { sendResponse } = require('../utils/response');

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
  sendResponse(res, { message: 'Supported sports fetched', data: { sports, count: sports.length } });
  } catch (error) {
    console.error('Error getting sports list:', error);
  sendResponse(res, { success: false, status: 500, message: 'Failed to get sports list', errors: [{ msg: error.message }] });
  }
});

/**
 * GET /api/pdf/status
 * Get service status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await ScoresheetGeneratorService.getStatus();
  sendResponse(res, { message: 'PDF service status', data: { status } });
  } catch (error) {
    console.error('Error getting service status:', error);
  sendResponse(res, { success: false, status: 500, message: 'Failed to get service status', errors: [{ msg: error.message }] });
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
  return sendResponse(res, { success: false, status: 400, message: 'Sport is required' });
    }

    const html = ScoresheetGeneratorService.generatePreview(sport, data, options);
    
  sendResponse(res, { message: 'Preview generated', data: { html, sport, generated: new Date().toISOString() } });
  } catch (error) {
    console.error('Error generating preview:', error);
  sendResponse(res, { success: false, status: 500, message: 'Failed to generate preview', errors: [{ msg: error.message }] });
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
  return sendResponse(res, { success: false, status: 400, message: 'Sport is required' });
    }

    if (!data) {
  return sendResponse(res, { success: false, status: 400, message: 'Data is required' });
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
  sendResponse(res, { success: false, status: 500, message: 'Failed to generate PDF', errors: [{ msg: error.message }] });
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
  return sendResponse(res, { success: false, status: 400, message: 'Scoresheets array is required and must not be empty' });
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
  sendResponse(res, { success: false, status: 500, message: 'Failed to generate batch PDFs', errors: [{ msg: error.message }] });
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
  return sendResponse(res, { success: false, status: 400, message: 'Sport is required' });
    }

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
  return sendResponse(res, { success: false, status: 400, message: 'Matches array is required and must not be empty' });
    }

    if (!tournament) {
  return sendResponse(res, { success: false, status: 400, message: 'Tournament information is required' });
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
  sendResponse(res, { success: false, status: 500, message: 'Failed to generate round PDFs', errors: [{ msg: error.message }] });
  }
});

/**
 * GET /api/pdf/preview/:sport
 * Generate a preview scoresheet with database data (GET method for easier testing)
 */
router.get('/preview/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { format = 'blank', matchId } = req.query;

    // Get template data from database
    const templateData = await ScoresheetGeneratorService.templateService.getTemplateData(sport, matchId);
    
    const pdfBuffer = await ScoresheetGeneratorService.generateSingleScoresheet(sport, templateData, {
      format
    });
    
    // Set headers for PDF download
    const filename = `${sport}_preview_scoresheet_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating preview PDF:', error);
  sendResponse(res, { success: false, status: 500, message: 'Failed to generate preview PDF', errors: [{ msg: error.message }] });
  }
});

/**
 * POST /api/pdf/generate
 * Generate a scoresheet with real match data
 */
router.post('/generate', async (req, res) => {
  try {
    const { sport, matchId, format, options } = req.body;

    if (!sport) {
  return sendResponse(res, { success: false, status: 400, message: 'Sport is required' });
    }

    if (!matchId) {
  return sendResponse(res, { success: false, status: 400, message: 'Match ID is required for scoresheet generation' });
    }

    // Get real match data from database
    const ScoreSheetDataService = require('../services/pdfGeneration/ScoreSheetDataService');
    const matchData = await ScoreSheetDataService.getRealMatchData(matchId);
    
    const pdfBuffer = await ScoresheetGeneratorService.generateSingleScoresheet(sport, matchData, {
      ...options,
      format: format || 'blank'
    });
    
    // Set headers for PDF download
    const filename = `${sport}_scoresheet_match_${matchId}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating scoresheet PDF:', error);
  sendResponse(res, { success: false, status: 500, message: 'Failed to generate scoresheet PDF', errors: [{ msg: error.message }] });
  }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
  console.error('PDF API Error:', error);
  sendResponse(res, { success: false, status: 500, message: 'Internal server error', errors: [{ msg: error.message }] });
});

module.exports = router;
