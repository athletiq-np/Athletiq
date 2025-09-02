// routes/search.js
const express = require('express');
const router = express.Router();
const db = require('../src/config/db');
const { logger } = require('../src/utils/logger');

/**
 * 🔍 Global Search Routes
 * Comprehensive search functionality across all Athletiq entities
 */

/**
 * POST /api/search/global
 * Performs comprehensive search across multiple entity types
 */
router.post('/global', authenticateToken, async (req, res) => {
  const { query, filters = {}, limit = 50 } = req.body;
  const userId = req.user.id;

  try {
    // Validate input
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters long'
      });
    }

    const searchQuery = `%${query.trim()}%`;
    const results = {};

    // Default filters
    const activeFilters = {
      categories: {
        athletes: true,
        schools: true,
        tournaments: true,
        users: true,
        documents: true,
        events: true,
        ...filters.categories
      },
      dateRange: filters.dateRange || 'all',
      status: filters.status || 'all',
      verification: filters.verification || 'all'
    };

    // Search Athletes/Players
    if (activeFilters.categories.athletes) {
      const athleteQuery = `
        SELECT DISTINCT 
          p.id,
          p.first_name || ' ' || p.last_name as name,
          p.email,
          p.photo_url,
          s.name as school_name,
          p.grade,
          p.date_of_birth,
          p.created_at,
          'athlete' as entity_type
        FROM players p
        LEFT JOIN schools s ON p.school_id = s.id
        WHERE (
          LOWER(p.first_name || ' ' || p.last_name) LIKE LOWER($1) OR
          LOWER(p.email) LIKE LOWER($1) OR
          LOWER(s.name) LIKE LOWER($1)
        )
        ${activeFilters.verification !== 'all' ? 'AND p.verified = $2' : ''}
        ORDER BY p.created_at DESC
        LIMIT $${activeFilters.verification !== 'all' ? '3' : '2'}
      `;

      const athleteParams = [searchQuery];
      if (activeFilters.verification !== 'all') {
        athleteParams.push(activeFilters.verification === 'verified');
      }
      athleteParams.push(Math.min(limit, 20));

      const athleteResult = await db.query(athleteQuery, athleteParams);
      results.athletes = athleteResult.rows;
    }

    // Search Schools
    if (activeFilters.categories.schools) {
      const schoolQuery = `
        SELECT DISTINCT 
          s.id,
          s.name,
          s.email,
          s.address,
          s.phone,
          COUNT(p.id) as player_count,
          s.created_at,
          'school' as entity_type
        FROM schools s
        LEFT JOIN players p ON s.id = p.school_id
        WHERE (
          LOWER(s.name) LIKE LOWER($1) OR
          LOWER(s.email) LIKE LOWER($1) OR
          LOWER(s.address) LIKE LOWER($1)
        )
        ${activeFilters.verification !== 'all' ? 'AND s.verified = $2' : ''}
        GROUP BY s.id, s.name, s.email, s.address, s.phone, s.created_at
        ORDER BY s.created_at DESC
        LIMIT $${activeFilters.verification !== 'all' ? '3' : '2'}
      `;

      const schoolParams = [searchQuery];
      if (activeFilters.verification !== 'all') {
        schoolParams.push(activeFilters.verification === 'verified');
      }
      schoolParams.push(Math.min(limit, 15));

      const schoolResult = await db.query(schoolQuery, schoolParams);
      results.schools = schoolResult.rows;
    }

    // Search Tournaments
    if (activeFilters.categories.tournaments) {
      const tournamentQuery = `
        SELECT DISTINCT 
          t.id,
          t.name,
          t.description,
          t.sport_type,
          t.tournament_type,
          t.start_date,
          t.end_date,
          t.status,
          t.created_at,
          'tournament' as entity_type
        FROM tournaments t
        WHERE (
          LOWER(t.name) LIKE LOWER($1) OR
          LOWER(t.description) LIKE LOWER($1) OR
          LOWER(t.sport_type) LIKE LOWER($1)
        )
        ${activeFilters.status !== 'all' ? 'AND t.status = $2' : ''}
        ORDER BY t.start_date DESC
        LIMIT $${activeFilters.status !== 'all' ? '3' : '2'}
      `;

      const tournamentParams = [searchQuery];
      if (activeFilters.status !== 'all') {
        tournamentParams.push(activeFilters.status);
      }
      tournamentParams.push(Math.min(limit, 15));

      const tournamentResult = await db.query(tournamentQuery, tournamentParams);
      results.tournaments = tournamentResult.rows;
    }

    // Search Users (Admin/Staff)
    if (activeFilters.categories.users && req.user.role === 'super_admin') {
      const userQuery = `
        SELECT DISTINCT 
          u.id,
          u.first_name || ' ' || u.last_name as full_name,
          u.email,
          u.role,
          u.last_login,
          u.created_at,
          'user' as entity_type
        FROM users u
        WHERE (
          LOWER(u.first_name || ' ' || u.last_name) LIKE LOWER($1) OR
          LOWER(u.email) LIKE LOWER($1) OR
          LOWER(u.role) LIKE LOWER($1)
        )
        AND u.id != $2
        ORDER BY u.last_login DESC NULLS LAST
        LIMIT $3
      `;

      const userResult = await db.query(userQuery, [searchQuery, userId, Math.min(limit, 10)]);
      results.users = userResult.rows;
    }

    // Search Documents (if document system exists)
    if (activeFilters.categories.documents) {
      try {
        const documentQuery = `
          SELECT DISTINCT 
            d.id,
            d.title,
            d.description,
            d.file_type,
            d.file_size,
            d.created_at,
            u.first_name || ' ' || u.last_name as uploaded_by,
            'document' as entity_type
          FROM documents d
          LEFT JOIN users u ON d.uploaded_by = u.id
          WHERE (
            LOWER(d.title) LIKE LOWER($1) OR
            LOWER(d.description) LIKE LOWER($1) OR
            LOWER(d.file_type) LIKE LOWER($1)
          )
          ORDER BY d.created_at DESC
          LIMIT $2
        `;

        const documentResult = await db.query(documentQuery, [searchQuery, Math.min(limit, 10)]);
        results.documents = documentResult.rows;
      } catch (error) {
        // Documents table might not exist, skip silently
        results.documents = [];
      }
    }

    // Search Events
    if (activeFilters.categories.events) {
      try {
        const eventQuery = `
          SELECT DISTINCT 
            e.id,
            e.title,
            e.description,
            e.event_type,
            e.start_date,
            e.end_date,
            e.location,
            e.created_at,
            'event' as entity_type
          FROM events e
          WHERE (
            LOWER(e.title) LIKE LOWER($1) OR
            LOWER(e.description) LIKE LOWER($1) OR
            LOWER(e.event_type) LIKE LOWER($1) OR
            LOWER(e.location) LIKE LOWER($1)
          )
          ${activeFilters.status !== 'all' ? 'AND e.status = $2' : ''}
          ORDER BY e.start_date DESC
          LIMIT $${activeFilters.status !== 'all' ? '3' : '2'}
        `;

        const eventParams = [searchQuery];
        if (activeFilters.status !== 'all') {
          eventParams.push(activeFilters.status);
        }
        eventParams.push(Math.min(limit, 10));

        const eventResult = await db.query(eventQuery, eventParams);
        results.events = eventResult.rows;
      } catch (error) {
        // Events table might not exist, skip silently
        results.events = [];
      }
    }

    // Log search activity
    try {
      await db.query(
        'INSERT INTO search_logs (user_id, query, results_count, filters, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [
          userId,
          query,
          Object.values(results).reduce((acc, arr) => acc + arr.length, 0),
          JSON.stringify(activeFilters)
        ]
      );
    } catch (logError) {
      // Log table might not exist, continue without logging
      console.warn('Search logging failed:', logError.message);
    }

    res.json(results);

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/search/suggestions
 * Get search suggestions based on recent searches and popular terms
 */
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const suggestions = {
      recent: [],
      popular: [],
      categories: [
        { id: 'athletes', label: 'Athletes', count: 0 },
        { id: 'schools', label: 'Schools', count: 0 },
        { id: 'tournaments', label: 'Tournaments', count: 0 }
      ]
    };

    // Get recent searches for this user
    try {
      const recentQuery = `
        SELECT DISTINCT query
        FROM search_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `;
      const recentResult = await db.query(recentQuery, [req.user.id]);
      suggestions.recent = recentResult.rows.map(row => row.query);
    } catch (error) {
      // Search logs table might not exist
    }

    // Get popular search terms
    try {
      const popularQuery = `
        SELECT query, COUNT(*) as search_count
        FROM search_logs
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY query
        ORDER BY search_count DESC
        LIMIT 5
      `;
      const popularResult = await db.query(popularQuery);
      suggestions.popular = popularResult.rows.map(row => ({
        query: row.query,
        count: parseInt(row.search_count)
      }));
    } catch (error) {
      // Search logs table might not exist
    }

    // Get entity counts
    try {
      const countsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM players) as athletes_count,
          (SELECT COUNT(*) FROM schools) as schools_count,
          (SELECT COUNT(*) FROM tournaments) as tournaments_count
      `;
      const countsResult = await db.query(countsQuery);
      const counts = countsResult.rows[0];
      
      suggestions.categories = [
        { id: 'athletes', label: 'Athletes', count: parseInt(counts.athletes_count) || 0 },
        { id: 'schools', label: 'Schools', count: parseInt(counts.schools_count) || 0 },
        { id: 'tournaments', label: 'Tournaments', count: parseInt(counts.tournaments_count) || 0 }
      ];
    } catch (error) {
      // Continue with default counts
    }

    res.json(suggestions);

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      error: 'Failed to get search suggestions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/search/history
 * Get user's search history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const historyQuery = `
      SELECT 
        query,
        results_count,
        filters,
        created_at
      FROM search_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await db.query(historyQuery, [req.user.id, parseInt(limit)]);
    
    res.json({
      history: result.rows.map(row => ({
        query: row.query,
        resultsCount: row.results_count,
        filters: row.filters,
        timestamp: row.created_at
      }))
    });

  } catch (error) {
    console.error('Search history error:', error);
    // If search_logs table doesn't exist, return empty history
    res.json({ history: [] });
  }
});

/**
 * DELETE /api/search/history
 * Clear user's search history
 */
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM search_logs WHERE user_id = $1', [req.user.id]);
    
    res.json({ message: 'Search history cleared successfully' });

  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({
      error: 'Failed to clear search history',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
