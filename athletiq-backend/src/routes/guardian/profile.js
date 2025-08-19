const express = require('express');
const router = express.Router();
const multer = require('multer');
const { pool } = require('../../config/database');
const { createLogger } = require('../../utils/logger');
const { authenticateGuardian } = require('../../middlewares/guardianAuth');

const logger = createLogger('guardian-profile');

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// GET /api/guardian/profile - Get guardian profile
router.get('/', authenticateGuardian, async (req, res) => {
  try {
    const guardianId = req.user.id;
    
    // Get guardian details
    const guardianResult = await pool.query(
      `SELECT id, email, phone, full_name, auth_provider, profile_photo_url,
              notification_preferences, address, created_at, is_verified
       FROM guardians WHERE id = $1`,
      [guardianId]
    );
    
    if (guardianResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found'
      });
    }
    
    const guardian = guardianResult.rows[0];
    
    // Get emergency contacts
    const contactsResult = await pool.query(
      'SELECT * FROM guardian_emergency_contacts WHERE guardian_id = $1 ORDER BY created_at ASC',
      [guardianId]
    );
    
    res.json({
      success: true,
      profile: {
        ...guardian,
        emergency_contacts: contactsResult.rows
      }
    });
    
  } catch (error) {
    logger.error('Get profile error', { error: error.message, guardianId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// PUT /api/guardian/profile - Update guardian profile
router.put('/', authenticateGuardian, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const guardianId = req.user.id;
    const {
      full_name, email, phone, address, notification_preferences, emergency_contacts
    } = req.body;
    
    // Update guardian basic info
    const updateResult = await client.query(
      `UPDATE guardians SET 
       full_name = $1, email = $2, phone = $3, address = $4,
       notification_preferences = $5, updated_at = NOW()
       WHERE id = $6 
       RETURNING *`,
      [
        full_name, email, phone, address,
        JSON.stringify(notification_preferences),
        guardianId
      ]
    );
    
    // Update emergency contacts
    if (emergency_contacts && Array.isArray(emergency_contacts)) {
      // Delete existing contacts
      await client.query(
        'DELETE FROM guardian_emergency_contacts WHERE guardian_id = $1',
        [guardianId]
      );
      
      // Insert new contacts
      for (const contact of emergency_contacts) {
        if (contact.name && contact.phone) {
          await client.query(
            `INSERT INTO guardian_emergency_contacts (
              guardian_id, name, relationship, phone, email, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              guardianId, contact.name, contact.relationship,
              contact.phone, contact.email
            ]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    logger.info('Profile updated successfully', { guardianId });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updateResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Update profile error', { error: error.message, guardianId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  } finally {
    client.release();
  }
});

// POST /api/guardian/profile/photo - Upload profile photo
router.post('/photo', authenticateGuardian, upload.single('profile_photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file provided'
      });
    }
    
    const guardianId = req.user.id;
    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    
    // Update guardian profile photo URL
    await pool.query(
      'UPDATE guardians SET profile_photo_url = $1, updated_at = NOW() WHERE id = $2',
      [photoUrl, guardianId]
    );
    
    logger.info('Profile photo updated', { guardianId, photoUrl });
    
    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      photo_url: photoUrl
    });
    
  } catch (error) {
    logger.error('Upload profile photo error', { 
      error: error.message, 
      guardianId: req.user.id 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile photo'
    });
  }
});

// GET /api/guardian/notifications - Get guardian notifications
router.get('/notifications', authenticateGuardian, async (req, res) => {
  try {
    const guardianId = req.user.id;
    const { limit = 20, offset = 0, unread_only = false } = req.query;
    
    let query = `
      SELECT * FROM notifications 
      WHERE recipient_type = 'guardian' AND recipient_id = $1
    `;
    const params = [guardianId];
    
    if (unread_only === 'true') {
      query += ` AND read_at IS NULL`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get unread count
    const unreadResult = await pool.query(
      `SELECT COUNT(*) as unread_count 
       FROM notifications 
       WHERE recipient_type = 'guardian' AND recipient_id = $1 AND read_at IS NULL`,
      [guardianId]
    );
    
    res.json({
      success: true,
      notifications: result.rows,
      unread_count: parseInt(unreadResult.rows[0].unread_count),
      total_count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Get notifications error', { error: error.message, guardianId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// PUT /api/guardian/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', authenticateGuardian, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const guardianId = req.user.id;
    
    const result = await pool.query(
      `UPDATE notifications 
       SET read_at = NOW() 
       WHERE id = $1 AND recipient_type = 'guardian' AND recipient_id = $2
       RETURNING id`,
      [notificationId, guardianId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    logger.error('Mark notification read error', { 
      error: error.message, 
      notificationId: req.params.id,
      guardianId: req.user.id 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// POST /api/guardian/forms/save-progress - Save form progress for offline sync
router.post('/forms/save-progress', authenticateGuardian, async (req, res) => {
  try {
    const guardianId = req.user.id;
    const { form_type, form_data, step, completion_percentage } = req.body;
    
    await pool.query(
      `INSERT INTO guardian_form_progress (
        guardian_id, form_type, form_data, current_step, 
        completion_percentage, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (guardian_id, form_type) DO UPDATE SET
        form_data = $2, current_step = $4, 
        completion_percentage = $5, updated_at = NOW()`,
      [
        guardianId, form_type, JSON.stringify(form_data),
        step, completion_percentage
      ]
    );
    
    logger.info('Form progress saved', { guardianId, formType: form_type, step });
    
    res.json({
      success: true,
      message: 'Form progress saved'
    });
    
  } catch (error) {
    logger.error('Save form progress error', { error: error.message, guardianId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Failed to save form progress'
    });
  }
});

module.exports = router;
