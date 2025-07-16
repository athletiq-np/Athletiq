// Super Admin Authorization Middleware
// Ensures only super admin users can access enterprise endpoints

/**
 * @desc    Require Super Admin role for access
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object  
 * @param   {Function} next - Express next middleware function
 * @access  Protected routes only (must be used after protect middleware)
 */
const requireSuperAdmin = (req, res, next) => {
  try {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    // Check if user has super admin role
    const userRole = req.user.role?.toLowerCase();
    const isSuperAdmin = userRole === 'superadmin' || userRole === 'super_admin' || userRole === 'super admin';

    if (!isSuperAdmin) {
      console.log(`Access denied for user ${req.user.id || 'unknown'} with role: ${userRole}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin privileges required.',
        requiredRole: 'superadmin',
        userRole: userRole
      });
    }

    // Log super admin access for security monitoring
    console.log(`Super Admin access granted to user: ${req.user.id || 'unknown'} (${req.user.email || 'unknown'})`);
    
    next();
  } catch (error) {
    console.error('Super Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

/**
 * @desc    Check if user is super admin (non-blocking)
 * @param   {Object} user - User object
 * @returns {Boolean} - True if user is super admin
 */
const isSuperAdmin = (user) => {
  if (!user || !user.role) return false;
  
  const userRole = user.role.toLowerCase();
  return userRole === 'superadmin' || userRole === 'super_admin' || userRole === 'super admin';
};

/**
 * @desc    Require Super Admin or Admin role for access
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object  
 * @param   {Function} next - Express next middleware function
 * @access  Protected routes only
 */
const requireAdminOrSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const userRole = req.user.role?.toLowerCase();
    const isAuthorized = ['superadmin', 'super_admin', 'super admin', 'admin'].includes(userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        requiredRole: 'admin or superadmin',
        userRole: userRole
      });
    }

    next();
  } catch (error) {
    console.error('Admin authorization middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

module.exports = {
  requireSuperAdmin,
  requireAdminOrSuperAdmin,
  isSuperAdmin
};
