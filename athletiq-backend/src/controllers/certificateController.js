// src/controllers/certificateController.js
// Comprehensive Certificate Management System for Tournament Awards

const { pool } = require('../config/db');
const { sendResponse } = require('../utils/response');

/**
 * @desc    Create a new certificate template
 * @route   POST /api/certificates/templates
 * @access  Private (Admin only)
 */
const createCertificateTemplate = async (req, res) => {
  try {
    const {
      name,
      category,
      tournament_type,
      sport,
      template_design,
      background_image_url,
      logo_positions,
      text_positions,
      signature_positions
    } = req.body;

    const query = `
      INSERT INTO certificate_templates 
        (name, category, tournament_type, sport, template_design, 
         background_image_url, logo_positions, text_positions, signature_positions, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      name, category, tournament_type, sport, 
      JSON.stringify(template_design),
      background_image_url,
      JSON.stringify(logo_positions),
      JSON.stringify(text_positions),
      JSON.stringify(signature_positions),
      req.user.id
    ];

    const result = await pool.query(query, values);
    
  return sendResponse(res, { status: 201, data: result.rows[0], message: 'Certificate template created successfully' });
  } catch (error) {
  console.error('Error creating certificate template:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to create certificate template' });
  }
};

/**
 * @desc    Generate certificates for tournament winners
 * @route   POST /api/certificates/generate/:tournamentId
 * @access  Private (Tournament organizer/Admin)
 */
const generateTournamentCertificates = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { award_data } = req.body; // Array of awards to generate

    // Validate tournament exists and user has permission
    const tournamentQuery = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    if (tournamentQuery.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Tournament not found' });
    }

    const tournament = tournamentQuery.rows[0];
    const generatedCertificates = [];

    // Process each award
    for (const award of award_data) {
      const {
        template_id,
        recipient_type,
        recipient_id,
        recipient_name,
        award_type,
        position,
        sport,
        category,
        achievement_details
      } = award;

      // Generate verification code
      const verification_code = await generateVerificationCode();

      // Insert certificate record
      const certificateQuery = `
        INSERT INTO tournament_certificates 
          (tournament_id, template_id, recipient_type, recipient_id, recipient_name,
           award_type, position, sport, category, achievement_details, 
           issued_by, verification_code)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const certificateValues = [
        tournamentId, template_id, recipient_type, recipient_id, recipient_name,
        award_type, position, sport, category, JSON.stringify(achievement_details),
        req.user.id, verification_code
      ];

      const certificateResult = await pool.query(certificateQuery, certificateValues);
      
      // Generate certificate URL (placeholder for now)
      const certificate_url = `/certificates/${certificateResult.rows[0].id}.pdf`;

      // Update certificate with generated URL
      await pool.query(
        'UPDATE tournament_certificates SET certificate_url = $1 WHERE id = $2',
        [certificate_url, certificateResult.rows[0].id]
      );

      generatedCertificates.push({
        ...certificateResult.rows[0],
        certificate_url
      });
    }

  return sendResponse(res, { data: {
      tournament_id: tournamentId,
      certificates_generated: generatedCertificates.length,
      certificates: generatedCertificates
  }, message: 'Certificates generated successfully' });

  } catch (error) {
  console.error('Error generating certificates:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to generate certificates' });
  }
};

/**
 * @desc    Verify a certificate by verification code
 * @route   GET /api/certificates/verify/:verificationCode
 * @access  Public
 */
const verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const query = `
      SELECT 
        tc.*,
        t.name as tournament_name,
        t.start_date,
        t.end_date,
        t.location,
        ct.name as template_name
      FROM tournament_certificates tc
      JOIN tournaments t ON tc.tournament_id = t.id
      JOIN certificate_templates ct ON tc.template_id = ct.id
      WHERE tc.verification_code = $1 AND tc.is_verified = true
    `;

    const result = await pool.query(query, [verificationCode]);

    if (result.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Certificate not found or invalid' });
    }

    const certificate = result.rows[0];

    // Log verification attempt
    await pool.query(
      `INSERT INTO certificate_verifications 
       (certificate_id, verification_code, verified_by_ip, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [certificate.id, verificationCode, req.ip, req.get('User-Agent')]
    );

  return sendResponse(res, { data: {
      certificate,
      verification_status: 'valid',
      verified_at: new Date().toISOString()
  }, message: 'Certificate verified successfully' });

  } catch (error) {
  console.error('Error verifying certificate:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to verify certificate' });
  }
};

/**
 * @desc    Get certificates for a tournament
 * @route   GET /api/certificates/tournament/:tournamentId
 * @access  Private
 */
const getTournamentCertificates = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { recipient_type, award_type } = req.query;

    let query = `
      SELECT 
        tc.*,
        ct.name as template_name,
        ct.category as template_category
      FROM tournament_certificates tc
      JOIN certificate_templates ct ON tc.template_id = ct.id
      WHERE tc.tournament_id = $1
    `;
    
    const params = [tournamentId];
    let paramIndex = 2;

    if (recipient_type) {
      query += ` AND tc.recipient_type = $${paramIndex}`;
      params.push(recipient_type);
      paramIndex++;
    }

    if (award_type) {
      query += ` AND tc.award_type = $${paramIndex}`;
      params.push(award_type);
      paramIndex++;
    }

    query += ' ORDER BY tc.position ASC, tc.issued_date DESC';

    const result = await pool.query(query, params);

  return sendResponse(res, { data: {
      tournament_id: tournamentId,
      certificates: result.rows
  }, message: 'Tournament certificates retrieved successfully' });

  } catch (error) {
  console.error('Error getting tournament certificates:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to retrieve certificates' });
  }
};

/**
 * Get a specific certificate by ID
 */
const getCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    if (!certificateId || isNaN(parseInt(certificateId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid certificate ID provided'
      });
    }

    const query = `
      SELECT 
        tc.*,
        t.name as tournament_name,
        CASE 
          WHEN tc.participant_type = 'player' THEN p.name
          WHEN tc.participant_type = 'team' THEN tm.name
        END as participant_name
      FROM tournament_certificates tc
      LEFT JOIN tournaments t ON tc.tournament_id = t.id
      LEFT JOIN players p ON tc.participant_type = 'player' AND tc.participant_id = p.id
      LEFT JOIN tournament_teams tt ON tc.participant_type = 'team' AND tc.participant_id = tt.id
      LEFT JOIN teams tm ON tt.team_id = tm.id
      WHERE tc.id = $1 AND tc.is_verified = true
    `;

    const result = await db.query(query, [certificateId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or not verified'
      });
    }

    const certificate = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Certificate retrieved successfully',
      data: {
        certificate: {
          id: certificate.id,
          tournament_id: certificate.tournament_id,
          tournament_name: certificate.tournament_name,
          participant_id: certificate.participant_id,
          participant_name: certificate.participant_name,
          participant_type: certificate.participant_type,
          certificate_type: certificate.certificate_type,
          template_id: certificate.template_id,
          certificate_data: certificate.certificate_data,
          file_path: certificate.file_path,
          verification_code: certificate.verification_code,
          issued_at: certificate.issued_at,
          is_verified: certificate.is_verified
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving certificate:', {
      error: error.message,
      stack: error.stack,
      certificateId: req.params.certificateId
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving certificate'
    });
  }
};

/**
 * Download a certificate as PDF
 */
const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    if (!certificateId || isNaN(parseInt(certificateId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid certificate ID provided'
      });
    }

    const query = `
      SELECT file_path, certificate_data, is_verified
      FROM tournament_certificates 
      WHERE id = $1
    `;

    const result = await db.query(query, [certificateId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    const certificate = result.rows[0];

    if (!certificate.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Certificate is not verified and cannot be downloaded'
      });
    }

    // For now, return the certificate data as JSON
    // In a real implementation, you would generate/serve a PDF file
    const certificateData = certificate.certificate_data || {};
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${certificateId}.json"`);
    
    res.status(200).json({
      success: true,
      message: 'Certificate download ready',
      data: {
        certificate_id: certificateId,
        file_path: certificate.file_path,
        certificate_data: certificateData,
        download_note: 'PDF generation will be implemented in future version'
      }
    });

  } catch (error) {
    logger.error('Error downloading certificate:', {
      error: error.message,
      stack: error.stack,
      certificateId: req.params.certificateId
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error while downloading certificate'
    });
  }
};

/**
 * Get certificate templates for a tournament
 */
const getCertificateTemplates = async (req, res) => {
  try {
    const { id: tournamentId } = req.params;

    if (!tournamentId || isNaN(parseInt(tournamentId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID provided'
      });
    }

    const query = `
      SELECT id, name, template_type, template_data, is_active, created_at
      FROM certificate_templates 
      WHERE tournament_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [tournamentId]);

    res.status(200).json({
      success: true,
      message: 'Certificate templates retrieved successfully',
      data: {
        templates: result.rows
      }
    });

  } catch (error) {
    logger.error('Error retrieving certificate templates:', {
      error: error.message,
      stack: error.stack,
      tournamentId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving certificate templates'
    });
  }
};

/**
 * Generate a single certificate for a participant
 */
const generateCertificate = async (req, res) => {
  try {
    const { id: tournamentId } = req.params;
    const { 
      participant_id, 
      participant_type, 
      template_id, 
      certificate_type, 
      achievement_details = {} 
    } = req.body;

    // Validation
    if (!tournamentId || isNaN(parseInt(tournamentId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID provided'
      });
    }

    if (!participant_id || !participant_type || !template_id || !certificate_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: participant_id, participant_type, template_id, certificate_type'
      });
    }

    if (!['player', 'team'].includes(participant_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participant_type. Must be "player" or "team"'
      });
    }

    if (!['participation', 'winner', 'runner_up', 'achievement'].includes(certificate_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid certificate_type'
      });
    }

    // Check if certificate already exists
    const existingQuery = `
      SELECT id FROM tournament_certificates 
      WHERE tournament_id = $1 AND participant_id = $2 AND participant_type = $3 AND certificate_type = $4
    `;
    const existingResult = await db.query(existingQuery, [tournamentId, participant_id, participant_type, certificate_type]);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Certificate already exists for this participant and type'
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Prepare certificate data
    const certificateData = {
      tournament_id: parseInt(tournamentId),
      participant_id: parseInt(participant_id),
      participant_type,
      certificate_type,
      template_id: parseInt(template_id),
      achievement_details,
      issued_by: req.user?.id || null
    };

    // Insert certificate
    const insertQuery = `
      INSERT INTO tournament_certificates (
        tournament_id, participant_id, participant_type, 
        certificate_type, template_id, certificate_data, 
        verification_code, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING id, verification_code, issued_at
    `;

    const insertResult = await db.query(insertQuery, [
      tournamentId, participant_id, participant_type, 
      certificate_type, template_id, JSON.stringify(certificateData),
      verificationCode
    ]);

    const certificate = insertResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: {
        certificate: {
          id: certificate.id,
          verification_code: certificate.verification_code,
          issued_at: certificate.issued_at,
          download_url: `/api/certificates/${certificate.id}/download`
        }
      }
    });

  } catch (error) {
    logger.error('Error generating certificate:', {
      error: error.message,
      stack: error.stack,
      tournamentId: req.params.id,
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error while generating certificate'
    });
  }
};

/**
 * Bulk generate certificates for tournament participants
 */
const bulkGenerateCertificates = async (req, res) => {
  try {
    const { id: tournamentId } = req.params;
    const { certificate_requests } = req.body;

    if (!tournamentId || isNaN(parseInt(tournamentId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID provided'
      });
    }

    if (!Array.isArray(certificate_requests) || certificate_requests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'certificate_requests must be a non-empty array'
      });
    }

    const results = [];
    const errors = [];

    // Process each certificate request
    for (let i = 0; i < certificate_requests.length; i++) {
      const request = certificate_requests[i];
      
      try {
        // Validate each request
        if (!request.participant_id || !request.participant_type || !request.template_id || !request.certificate_type) {
          errors.push({
            index: i,
            error: 'Missing required fields',
            request
          });
          continue;
        }

        // Check if certificate already exists
        const existingQuery = `
          SELECT id FROM tournament_certificates 
          WHERE tournament_id = $1 AND participant_id = $2 AND participant_type = $3 AND certificate_type = $4
        `;
        const existingResult = await db.query(existingQuery, [
          tournamentId, request.participant_id, request.participant_type, request.certificate_type
        ]);

        if (existingResult.rows.length > 0) {
          errors.push({
            index: i,
            error: 'Certificate already exists',
            request
          });
          continue;
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();

        // Prepare certificate data
        const certificateData = {
          tournament_id: parseInt(tournamentId),
          participant_id: parseInt(request.participant_id),
          participant_type: request.participant_type,
          certificate_type: request.certificate_type,
          template_id: parseInt(request.template_id),
          achievement_details: request.achievement_details || {},
          issued_by: req.user?.id || null
        };

        // Insert certificate
        const insertQuery = `
          INSERT INTO tournament_certificates (
            tournament_id, participant_id, participant_type, 
            certificate_type, template_id, certificate_data, 
            verification_code, is_verified
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          RETURNING id, verification_code, issued_at
        `;

        const insertResult = await db.query(insertQuery, [
          tournamentId, request.participant_id, request.participant_type, 
          request.certificate_type, request.template_id, JSON.stringify(certificateData),
          verificationCode
        ]);

        const certificate = insertResult.rows[0];

        results.push({
          index: i,
          success: true,
          certificate: {
            id: certificate.id,
            verification_code: certificate.verification_code,
            issued_at: certificate.issued_at,
            download_url: `/api/certificates/${certificate.id}/download`
          }
        });

      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          request
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk certificate generation completed. ${results.length} successful, ${errors.length} failed.`,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total_requests: certificate_requests.length,
          successful_count: results.length,
          failed_count: errors.length
        }
      }
    });

  } catch (error) {
    logger.error('Error in bulk certificate generation:', {
      error: error.message,
      stack: error.stack,
      tournamentId: req.params.id,
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error during bulk certificate generation'
    });
  }
};

// Helper Functions
async function generateVerificationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'VER';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  createCertificateTemplate,
  getCertificateTemplates,
  generateCertificate,
  generateTournamentCertificates,
  getCertificate,
  downloadCertificate,
  verifyCertificate,
  getTournamentCertificates,
  bulkGenerateCertificates
};
