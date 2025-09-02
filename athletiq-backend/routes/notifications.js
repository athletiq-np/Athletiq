// routes/notifications.js
const express = require('express');
const router = express.Router();
const db = require('../src/config/db');
const { logger } = require('../src/utils/logger');
const WebSocket = require('ws');

/**
 * 🔔 Notification Routes
 * Real-time notification system with WebSocket support
 */

/**
 * GET /api/notifications
 * Get user's notifications with pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    filter = 'all',
    type 
  } = req.query;
  const userId = req.user.id;

  try {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE user_id = $1';
    let params = [userId];
    let paramIndex = 2;

    // Apply filters
    if (filter === 'unread') {
      whereClause += ` AND read = false`;
    } else if (filter === 'read') {
      whereClause += ` AND read = true`;
    }

    if (type) {
      whereClause += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    const query = `
      SELECT 
        id,
        type,
        title,
        message,
        data,
        read,
        created_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get unread count
    const unreadQuery = `
      SELECT COUNT(*) as unread
      FROM notifications
      WHERE user_id = $1 AND read = false
    `;
    
    const unreadResult = await db.query(unreadQuery, [userId]);
    const unreadCount = parseInt(unreadResult.rows[0].unread);

    res.json({
      notifications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification (admin only)
 */
router.post('/', authenticateToken, async (req, res) => {
  const { 
    user_id, 
    user_ids = [], 
    type = 'info', 
    title, 
    message, 
    data = {},
    send_to_all = false 
  } = req.body;

  try {
    // Validate admin permissions for bulk notifications
    if ((send_to_all || user_ids.length > 1) && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions for bulk notifications' });
    }

    let targetUsers = [];

    if (send_to_all) {
      // Send to all users
      const usersResult = await db.query('SELECT id FROM users WHERE active = true');
      targetUsers = usersResult.rows.map(row => row.id);
    } else if (user_ids.length > 0) {
      // Send to specific users
      targetUsers = user_ids;
    } else if (user_id) {
      // Send to single user
      targetUsers = [user_id];
    } else {
      return res.status(400).json({ error: 'No target users specified' });
    }

    const notifications = [];
    const insertPromises = [];

    for (const targetUserId of targetUsers) {
      const notificationData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        user_id: targetUserId,
        type,
        title,
        message,
        data,
        read: false,
        created_at: new Date()
      };

      notifications.push(notificationData);

      const insertPromise = db.query(
        `INSERT INTO notifications (id, user_id, type, title, message, data, read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          notificationData.id,
          notificationData.user_id,
          notificationData.type,
          notificationData.title,
          notificationData.message,
          JSON.stringify(notificationData.data),
          notificationData.read,
          notificationData.created_at
        ]
      );

      insertPromises.push(insertPromise);
    }

    await Promise.all(insertPromises);

    // Send real-time notifications via WebSocket
    notifications.forEach(notification => {
      broadcastNotification(notification);
    });

    res.status(201).json({
      message: 'Notifications created successfully',
      count: notifications.length,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message
      }))
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      error: 'Failed to create notification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await db.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications as read for user
 */
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
      [userId]
    );

    res.json({
      message: 'All notifications marked as read',
      count: result.rowCount
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * DELETE /api/notifications/clear-all
 * Clear all notifications for user
 */
router.delete('/clear-all', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { older_than_days = 30 } = req.query;

  try {
    let query = 'DELETE FROM notifications WHERE user_id = $1';
    let params = [userId];

    if (older_than_days && parseInt(older_than_days) > 0) {
      query += ' AND created_at < NOW() - INTERVAL $2 DAY';
      params.push(parseInt(older_than_days));
    }

    const result = await db.query(query, params);

    res.json({
      message: 'Notifications cleared successfully',
      count: result.rowCount
    });

  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({
      error: 'Failed to clear notifications',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics for user
 */
router.get('/stats', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE read = false) as unread,
        COUNT(*) FILTER (WHERE read = true) as read,
        COUNT(*) FILTER (WHERE type = 'success') as success_count,
        COUNT(*) FILTER (WHERE type = 'error') as error_count,
        COUNT(*) FILTER (WHERE type = 'warning') as warning_count,
        COUNT(*) FILTER (WHERE type = 'info') as info_count,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_7d
      FROM notifications
      WHERE user_id = $1
    `;

    const result = await db.query(statsQuery, [userId]);
    const stats = result.rows[0];

    // Convert string counts to numbers
    Object.keys(stats).forEach(key => {
      stats[key] = parseInt(stats[key]) || 0;
    });

    res.json({
      stats,
      percentages: {
        read_percentage: stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0,
        unread_percentage: stats.total > 0 ? Math.round((stats.unread / stats.total) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      error: 'Failed to get notification statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// WebSocket connection storage
const wsConnections = new Map();

/**
 * Broadcast notification to user via WebSocket
 */
function broadcastNotification(notification) {
  const userWs = wsConnections.get(notification.user_id);
  if (userWs && userWs.readyState === WebSocket.OPEN) {
    try {
      userWs.send(JSON.stringify(notification));
    } catch (error) {
      console.error('Failed to send WebSocket notification:', error);
      // Remove broken connection
      wsConnections.delete(notification.user_id);
    }
  }
}

/**
 * Setup WebSocket server for real-time notifications
 */
function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/notifications'
  });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Token required');
      return;
    }

    // Verify token and get user ID
    // This would use your existing token verification logic
    try {
      // Mock user ID extraction - replace with actual token verification
      const userId = extractUserIdFromToken(token);
      
      if (userId) {
        wsConnections.set(userId, ws);
        console.log(`WebSocket connected for user ${userId}`);

        ws.on('close', () => {
          wsConnections.delete(userId);
          console.log(`WebSocket disconnected for user ${userId}`);
        });

        ws.on('error', (error) => {
          console.error(`WebSocket error for user ${userId}:`, error);
          wsConnections.delete(userId);
        });

        // Send connection confirmation
        ws.send(JSON.stringify({
          type: 'connection',
          message: 'Connected to notification service'
        }));
      } else {
        ws.close(1008, 'Invalid token');
      }
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });

  return wss;
}

// Mock function - replace with actual token verification
function extractUserIdFromToken(token) {
  // This should use your existing JWT verification logic
  // For now, return a mock user ID
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
  setupWebSocketServer,
  broadcastNotification
};
