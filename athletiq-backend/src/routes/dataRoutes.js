const express = require('express');
const router = express.Router();
const DatabaseService = require('../services/DatabaseService');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiter');
const { sendResponse } = require('../utils/response');

/**
 * @swagger
 * tags:
 *   name: Data
 *   description: Database-driven data endpoints
 */

/**
 * @swagger
 * /api/data/dashboard:
 *   get:
 *     summary: Get dashboard statistics from database
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/dashboard', generalLimiter, protect, async (req, res) => {
  try {
    const stats = await DatabaseService.getDashboardStats();
    sendResponse(res, {
      data: stats,
      message: 'Dashboard statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    sendResponse(res, {
      success: false,
      status: 500,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * @swagger
 * /api/data/schools:
 *   get:
 *     summary: Get all schools from database
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Schools retrieved successfully
 */
router.get('/schools', generalLimiter, protect, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const schools = await DatabaseService.getAllSchools(parseInt(limit), parseInt(offset));
    
    sendResponse(res, {
      data: {
        schools,
        count: schools.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      message: 'Schools retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    sendResponse(res, {
      success: false,
      status: 500,
      message: 'Failed to fetch schools'
    });
  }
});

/**
 * @swagger
 * /api/data/players:
 *   get:
 *     summary: Get all players from database
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Players retrieved successfully
 */
router.get('/players', generalLimiter, protect, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const players = await DatabaseService.getAllPlayers(parseInt(limit), parseInt(offset));
    
    sendResponse(res, {
      data: {
        players,
        count: players.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      message: 'Players retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    sendResponse(res, {
      success: false,
      status: 500,
      message: 'Failed to fetch players'
    });
  }
});

/**
 * @swagger
 * /api/data/tournaments:
 *   get:
 *     summary: Get all tournaments from database
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Tournaments retrieved successfully
 */
router.get('/tournaments', generalLimiter, protect, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const tournaments = await DatabaseService.getAllTournaments(parseInt(limit), parseInt(offset));
    
    sendResponse(res, {
      data: {
        tournaments,
        count: tournaments.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      message: 'Tournaments retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    sendResponse(res, {
      success: false,
      status: 500,
      message: 'Failed to fetch tournaments'
    });
  }
});

/**
 * @swagger
 * /api/data/matches:
 *   get:
 *     summary: Get all matches from database
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Matches retrieved successfully
 */
router.get('/matches', generalLimiter, protect, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const matches = await DatabaseService.getAllMatches(parseInt(limit), parseInt(offset));
    
    sendResponse(res, {
      data: {
        matches,
        count: matches.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      message: 'Matches retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    sendResponse(res, {
      success: false,
      status: 500,
      message: 'Failed to fetch matches'
    });
  }
});

/**
 * @swagger
 * /api/data/teams:
 *   get:
 *     summary: Get all teams from database
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 */
router.get('/teams', generalLimiter, protect, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const teams = await DatabaseService.getAllTeams(parseInt(limit), parseInt(offset));
    
    sendResponse(res, {
      data: {
        teams,
        count: teams.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      message: 'Teams retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    sendResponse(res, {
      success: false,
      status: 500,
      message: 'Failed to fetch teams'
    });
  }
});

/**
 * @swagger
 * /api/data/sports:
 *   get:
 *     summary: Get all sports from database
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sports retrieved successfully
 */
router.get('/sports', generalLimiter, protect, async (req, res) => {
  try {
    const sports = await DatabaseService.getAllSports();
    
    sendResponse(res, {
      data: {
        sports,
        count: sports.length
      },
      message: 'Sports retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching sports:', error);
    sendResponse(res, {
      success: false,
      status: 500,
      message: 'Failed to fetch sports'
    });
  }
});

/**
 * @swagger
 * /api/data/search:
 *   get:
 *     summary: Global search across all entities
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', generalLimiter, protect, async (req, res) => {
  try {
    const { q: searchTerm, limit = 20 } = req.query;
    
    if (!searchTerm) {
      return sendResponse(res, {
        success: false,
        status: 400,
        message: 'Search term is required'
      });
    }

    const results = await DatabaseService.globalSearch(searchTerm, parseInt(limit));
    
    sendResponse(res, {
      data: {
        results,
        count: results.length,
        searchTerm,
        limit: parseInt(limit)
      },
      message: 'Search completed successfully'
    });
  } catch (error) {
    console.error('Error performing search:', error);
    sendResponse(res, {
      success: false,
      status: 500,
      message: 'Search failed'
    });
  }
});

/**
 * @swagger
 * /api/data/validate:
 *   get:
 *     summary: Validate database connection and schema
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database validation completed
 */
router.get('/validate', generalLimiter, protect, checkRole(['SuperAdmin']), async (req, res) => {
  try {
    const validation = await DatabaseService.validateDatabase();
    
    sendResponse(res, {
      data: validation,
      message: validation.connected ? 'Database validation successful' : 'Database validation failed'
    });
  } catch (error) {
    console.error('Error validating database:', error);
    sendResponse(res, {
      success: false,
      status: 500,
      message: 'Database validation failed'
    });
  }
});

module.exports = router;