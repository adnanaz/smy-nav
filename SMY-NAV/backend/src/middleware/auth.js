import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authorized, no token provided' }
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          agency: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: { message: 'User not found or inactive' }
        });
      }

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: { message: 'Not authorized, invalid token' }
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error in authentication' }
    });
  }
};

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authorized' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: `Role ${req.user.role} is not authorized to access this resource` }
      });
    }

    next();
  };
};

// Agency-based access control
export const authorizeAgency = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authorized' }
      });
    }

    // Super admins can access everything
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check if user has agency access
    const resourceAgencyId = req.params.agencyId || req.body.agencyId;
    
    if (resourceAgencyId && req.user.agencyId !== resourceAgencyId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to access this agency data' }
      });
    }

    next();
  } catch (error) {
    logger.error('Agency authorization error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error in agency authorization' }
    });
  }
};

// Role-based access control
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Not authorized' }
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: { message: 'Insufficient permissions' }
        });
      }

      next();
    } catch (error) {
      logger.error('Role authorization error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Server error in role authorization' }
      });
    }
  };
};