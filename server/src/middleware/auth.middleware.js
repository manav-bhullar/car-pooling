const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const prisma = require('../prisma/client');

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyAccessToken(token);
      req.userId = decoded.id; // Attach user ID to request object
      req.userRole = decoded.role; // Attach role to request object
      req.userEmail = decoded.email; // Attach email to request object
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return error(res, 'Token expired', 401);
      }
      return error(res, 'Invalid token', 401);
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return error(res, 'Internal server error', 500);
  }
};

exports.requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return error(res, 'Authentication required', 401);
      }

      if (!req.userRole) {
        return error(res, 'Invalid token payload', 401);
      }

      if (!allowedRoles.includes(req.userRole)) {
        return error(res, 'Forbidden: Insufficient permissions', 403);
      }

      next();
    } catch (err) {
      console.error('Role middleware error:', err);
      return error(res, 'Internal server error', 500);
    }
  };
};
