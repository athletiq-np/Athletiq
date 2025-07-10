//
// 🧠 ATHLETIQ - Certificate Routes
//
// This file defines the API endpoints for certificate management
// Global certificate operations (view, download, verify)
//

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: Certificate management endpoints
 */

const express = require("express");
const router = express.Router();

// Middleware imports
const { generalLimiter } = require("../middlewares/rateLimiter");

// Import certificate controller functions
const {
  getCertificate,
  downloadCertificate,
  verifyCertificate,
} = require("../controllers/certificateController");

// =====================================================
// GLOBAL CERTIFICATE ROUTES
// =====================================================

/**
 * @swagger
 * /api/certificates/{certificateId}:
 *   get:
 *     summary: Get a specific certificate
 *     tags: [Certificates]
 *     parameters:
 *       - name: certificateId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Certificate ID
 *     responses:
 *       200:
 *         description: Certificate retrieved successfully
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
 *                     certificate:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         tournament_id:
 *                           type: integer
 *                         participant_id:
 *                           type: integer
 *                         participant_type:
 *                           type: string
 *                           enum: [player, team]
 *                         certificate_type:
 *                           type: string
 *                           enum: [participation, winner, runner_up, achievement]
 *                         template_id:
 *                           type: integer
 *                         certificate_data:
 *                           type: object
 *                         file_path:
 *                           type: string
 *                         verification_code:
 *                           type: string
 *                         issued_at:
 *                           type: string
 *                           format: date-time
 *                         is_verified:
 *                           type: boolean
 *       404:
 *         description: Certificate not found
 *       500:
 *         description: Server error
 */
// @route   GET /api/certificates/:certificateId
// @desc    Get a specific certificate
// @access  Public (with proper verification)
router.get("/:certificateId", generalLimiter, getCertificate);

/**
 * @swagger
 * /api/certificates/{certificateId}/download:
 *   get:
 *     summary: Download a certificate as PDF
 *     tags: [Certificates]
 *     parameters:
 *       - name: certificateId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Certificate ID
 *     responses:
 *       200:
 *         description: Certificate PDF download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Certificate not found
 *       500:
 *         description: Server error
 */
// @route   GET /api/certificates/:certificateId/download
// @desc    Download a certificate as PDF
// @access  Public (with proper verification)
router.get("/:certificateId/download", generalLimiter, downloadCertificate);

/**
 * @swagger
 * /api/certificates/verify/{verificationCode}:
 *   get:
 *     summary: Verify a certificate using verification code
 *     tags: [Certificates]
 *     parameters:
 *       - name: verificationCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Certificate verification code
 *     responses:
 *       200:
 *         description: Certificate verification successful
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
 *                     certificate:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         tournament_name:
 *                           type: string
 *                         participant_name:
 *                           type: string
 *                         participant_type:
 *                           type: string
 *                         certificate_type:
 *                           type: string
 *                         issued_at:
 *                           type: string
 *                           format: date-time
 *                         is_verified:
 *                           type: boolean
 *                         verification_timestamp:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Invalid verification code
 *       404:
 *         description: Certificate not found
 *       500:
 *         description: Server error
 */
// @route   GET /api/certificates/verify/:verificationCode
// @desc    Verify a certificate using verification code
// @access  Public
router.get("/verify/:verificationCode", generalLimiter, verifyCertificate);

module.exports = router;
