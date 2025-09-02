// routes/liveMatches.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/config/db');
const logger = require('../src/utils/logger');
const WebSocket = require('ws');

/**
 * 🏆 Live Match Tracking Routes
 * Real-time match tracking with WebSocket integration
 */

// Store WebSocket connections for each match
const matchConnections = new Map();

/**
 * GET /api/matches/:id/live
 * Get live match data including events and comments
 */
router.get('/:id/live', authenticateToken, async (req, res) => {
  const { id: matchId } = req.params;
  const userId = req.user.id;

  try {
    // Get match details
    const matchQuery = `
      SELECT 
        m.*,
        t1.name as team1_name,
        t1.logo as team1_logo,
        t2.name as team2_name,
        t2.logo as team2_logo,
        tour.name as tournament_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN tournaments tour ON m.tournament_id = tour.id
      WHERE m.id = $1
    `;
    
    const matchResult = await db.query(matchQuery, [matchId]);
    
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = {
      ...matchResult.rows[0],
      team1: {
        id: matchResult.rows[0].team1_id,
        name: matchResult.rows[0].team1_name,
        logo: matchResult.rows[0].team1_logo
      },
      team2: {
        id: matchResult.rows[0].team2_id,
        name: matchResult.rows[0].team2_name,
        logo: matchResult.rows[0].team2_logo
      }
    };

    // Get live events
    const eventsQuery = `
      SELECT 
        me.*,
        p.first_name || ' ' || p.last_name as player_name
      FROM match_events me
      LEFT JOIN players p ON me.player_id = p.id
      WHERE me.match_id = $1
      ORDER BY me.minute DESC, me.created_at DESC
      LIMIT 50
    `;
    
    const eventsResult = await db.query(eventsQuery, [matchId]);

    // Get comments
    const commentsQuery = `
      SELECT 
        mc.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM match_comments mc
      LEFT JOIN users u ON mc.user_id = u.id
      WHERE mc.match_id = $1
      ORDER BY mc.created_at DESC
      LIMIT 50
    `;
    
    const commentsResult = await db.query(commentsQuery, [matchId]);

    // Get likes count
    const likesQuery = `
      SELECT COUNT(*) as like_count
      FROM match_likes
      WHERE match_id = $1
    `;
    
    const likesResult = await db.query(likesQuery, [matchId]);

    // Check if user is following this match
    const followQuery = `
      SELECT COUNT(*) as is_following
      FROM match_followers
      WHERE match_id = $1 AND user_id = $2
    `;
    
    const followResult = await db.query(followQuery, [matchId, userId]);

    res.json({
      match,
      events: eventsResult.rows,
      comments: commentsResult.rows,
      likes: parseInt(likesResult.rows[0].like_count),
      isFollowing: parseInt(followResult.rows[0].is_following) > 0
    });

  } catch (error) {
    console.error('Get live match error:', error);
    res.status(500).json({
      error: 'Failed to get live match data',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/matches/:id/events
 * Add a new live event to the match (admin only)
 */
router.post('/:id/events', authenticateToken, async (req, res) => {
  const { id: matchId } = req.params;
  const {
    type,
    minute,
    description,
    player_id,
    team_id,
    additional_data = {}
  } = req.body;

  // Check admin permissions
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    const eventId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const insertQuery = `
      INSERT INTO match_events (id, match_id, type, minute, description, player_id, team_id, additional_data, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    
    const result = await db.query(insertQuery, [
      eventId,
      matchId,
      type,
      minute,
      description,
      player_id,
      team_id,
      JSON.stringify(additional_data)
    ]);

    const event = result.rows[0];

    // Get player name if applicable
    if (player_id) {
      const playerQuery = `
        SELECT first_name || ' ' || last_name as player_name
        FROM players
        WHERE id = $1
      `;
      const playerResult = await db.query(playerQuery, [player_id]);
      if (playerResult.rows.length > 0) {
        event.player_name = playerResult.rows[0].player_name;
      }
    }

    // Broadcast to all connected clients for this match
    broadcastToMatch(matchId, {
      type: 'live_event',
      event
    });

    // Update match score if it's a goal
    if (type === 'goal') {
      await updateMatchScore(matchId, team_id);
    }

    res.status(201).json({ event });

  } catch (error) {
    console.error('Add match event error:', error);
    res.status(500).json({
      error: 'Failed to add match event',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/matches/:id/comments
 * Add a comment to the live match
 */
router.post('/:id/comments', authenticateToken, async (req, res) => {
  const { id: matchId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  try {
    const commentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const insertQuery = `
      INSERT INTO match_comments (id, match_id, user_id, text, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    
    const result = await db.query(insertQuery, [
      commentId,
      matchId,
      userId,
      text.trim()
    ]);

    // Get user name
    const userQuery = `
      SELECT first_name || ' ' || last_name as user_name
      FROM users
      WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);
    
    const comment = {
      ...result.rows[0],
      user_name: userResult.rows[0]?.user_name || 'Unknown User'
    };

    // Broadcast to all connected clients for this match
    broadcastToMatch(matchId, {
      type: 'comment',
      comment
    });

    res.status(201).json({ comment });

  } catch (error) {
    console.error('Add match comment error:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/matches/:id/like
 * Like/unlike a match
 */
router.post('/:id/like', authenticateToken, async (req, res) => {
  const { id: matchId } = req.params;
  const userId = req.user.id;

  try {
    // Check if already liked
    const existingLike = await db.query(
      'SELECT id FROM match_likes WHERE match_id = $1 AND user_id = $2',
      [matchId, userId]
    );

    let likeCount;
    
    if (existingLike.rows.length > 0) {
      // Unlike
      await db.query(
        'DELETE FROM match_likes WHERE match_id = $1 AND user_id = $2',
        [matchId, userId]
      );
    } else {
      // Like
      await db.query(
        'INSERT INTO match_likes (match_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [matchId, userId]
      );
    }

    // Get updated count
    const countResult = await db.query(
      'SELECT COUNT(*) as like_count FROM match_likes WHERE match_id = $1',
      [matchId]
    );
    
    likeCount = parseInt(countResult.rows[0].like_count);

    // Broadcast to all connected clients for this match
    broadcastToMatch(matchId, {
      type: 'like_update',
      count: likeCount
    });

    res.json({ likeCount });

  } catch (error) {
    console.error('Like match error:', error);
    res.status(500).json({
      error: 'Failed to like match',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/matches/:id/follow
 * Follow a match for notifications
 */
router.post('/:id/follow', authenticateToken, async (req, res) => {
  const { id: matchId } = req.params;
  const userId = req.user.id;

  try {
    await db.query(
      'INSERT INTO match_followers (match_id, user_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
      [matchId, userId]
    );

    res.json({ message: 'Successfully following match' });

  } catch (error) {
    console.error('Follow match error:', error);
    res.status(500).json({
      error: 'Failed to follow match',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * DELETE /api/matches/:id/follow
 * Unfollow a match
 */
router.delete('/:id/follow', authenticateToken, async (req, res) => {
  const { id: matchId } = req.params;
  const userId = req.user.id;

  try {
    await db.query(
      'DELETE FROM match_followers WHERE match_id = $1 AND user_id = $2',
      [matchId, userId]
    );

    res.json({ message: 'Successfully unfollowed match' });

  } catch (error) {
    console.error('Unfollow match error:', error);
    res.status(500).json({
      error: 'Failed to unfollow match',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * PATCH /api/matches/:id/status
 * Update match status (admin only)
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id: matchId } = req.params;
  const { status } = req.body;

  // Check admin permissions
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const validStatuses = ['scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await db.query(
      'UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, matchId]
    );

    // Broadcast status change to all connected clients
    broadcastToMatch(matchId, {
      type: 'status_change',
      status
    });

    res.json({ message: 'Match status updated successfully' });

  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({
      error: 'Failed to update match status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to update match score
async function updateMatchScore(matchId, teamId) {
  try {
    const matchResult = await db.query(
      'SELECT team1_id, team2_id, score FROM matches WHERE id = $1',
      [matchId]
    );

    if (matchResult.rows.length === 0) return;

    const match = matchResult.rows[0];
    let score = match.score || { team1: 0, team2: 0 };

    if (teamId === match.team1_id) {
      score.team1 = (score.team1 || 0) + 1;
    } else if (teamId === match.team2_id) {
      score.team2 = (score.team2 || 0) + 1;
    }

    await db.query(
      'UPDATE matches SET score = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(score), matchId]
    );

    // Broadcast score update
    broadcastToMatch(matchId, {
      type: 'match_update',
      match: { score }
    });

  } catch (error) {
    console.error('Update match score error:', error);
  }
}

// Helper function to broadcast message to all clients watching a specific match
function broadcastToMatch(matchId, message) {
  const connections = matchConnections.get(matchId);
  if (connections) {
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send WebSocket message:', error);
        }
      }
    });
  }
}

/**
 * Setup WebSocket server for live match tracking
 */
function setupMatchWebSocketServer(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/matches'
  });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const matchId = pathParts[pathParts.length - 1];
    const token = url.searchParams.get('token');

    if (!token || !matchId) {
      ws.close(1008, 'Token and match ID required');
      return;
    }

    try {
      // Verify token (implement your token verification logic)
      const userId = extractUserIdFromToken(token);
      
      if (userId) {
        // Add connection to match connections
        if (!matchConnections.has(matchId)) {
          matchConnections.set(matchId, new Set());
        }
        matchConnections.get(matchId).add(ws);

        console.log(`WebSocket connected for match ${matchId}, user ${userId}`);

        // Send current viewer count
        const viewerCount = matchConnections.get(matchId).size;
        broadcastToMatch(matchId, {
          type: 'viewer_count',
          count: viewerCount
        });

        ws.on('close', () => {
          const connections = matchConnections.get(matchId);
          if (connections) {
            connections.delete(ws);
            if (connections.size === 0) {
              matchConnections.delete(matchId);
            } else {
              // Update viewer count
              broadcastToMatch(matchId, {
                type: 'viewer_count',
                count: connections.size
              });
            }
          }
          console.log(`WebSocket disconnected for match ${matchId}, user ${userId}`);
        });

        ws.on('error', (error) => {
          console.error(`WebSocket error for match ${matchId}, user ${userId}:`, error);
        });

        // Send connection confirmation
        ws.send(JSON.stringify({
          type: 'connection',
          message: `Connected to live match ${matchId}`
        }));
      } else {
        ws.close(1008, 'Invalid token');
      }
    } catch (error) {
      console.error('Match WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });

  return wss;
}

// Mock function - replace with actual token verification
function extractUserIdFromToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
}

module.exports = {
  router,
  setupMatchWebSocketServer
};
