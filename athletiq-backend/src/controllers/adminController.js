const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * @desc    Admin changes the password for a school's primary admin user.
 * @route   PUT /api/admin/schools/:schoolId/change-password
 * @access  Private (SuperAdmin)
 */
exports.changeSchoolPassword = async (req, res) => {
  // First, verify the user making the request is a SuperAdmin.
  // This is a double-check, as the route middleware should also enforce this.
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Permission denied. Super admin access required.' });
  }

  const { schoolId } = req.params;
  const { newPassword } = req.body;

  // Validate the new password input
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  const client = await pool.connect();

  try {
    // Find the school to get its assigned admin_user_id
    const schoolResult = await client.query(
      'SELECT admin_user_id FROM schools WHERE school_id = $1',
      [schoolId]
    );

    if (schoolResult.rows.length === 0) {
      return res.status(404).json({ message: 'School not found.' });
    }

    const adminUserId = schoolResult.rows[0].admin_user_id;
    if (!adminUserId) {
      return res.status(404).json({ message: 'This school does not have an assigned admin user to update.' });
    }

    // Securely hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update the password_hash in the 'users' table for the correct user
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
      [passwordHash, adminUserId]
    );
    
    res.status(200).json({ message: 'School admin password updated successfully.' });

  } catch (error) {
    console.error('Error changing school password:', error);
    res.status(500).json({ message: 'Server error while changing password.' });
  } finally {
    // Always release the database client back to the pool
    if (client) {
      client.release();
    }
  }
};