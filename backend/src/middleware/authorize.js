'use strict';

/**
 * authorize(...roles) — Role-based access control middleware.
 * Must be used AFTER verifyToken.
 * Returns 403 if the authenticated user's role is not in the allowed list.
 *
 * Usage: router.get('/admin-only', verifyToken, authorize('admin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      errors: [],
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
      errors: [],
    });
  }

  next();
};

module.exports = authorize;

