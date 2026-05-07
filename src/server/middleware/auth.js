/**
 * GABAYANI — JWT Authentication Middleware
 * 
 * Extracts and verifies JWT from Authorization header.
 * Attaches decoded user data to req.user.
 * Supports access token verification.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('./errorHandler');

/**
 * Require authentication. Returns 401 if no valid JWT.
 */
function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Verify this is an access token (not a refresh token)
    if (decoded.type !== 'access') {
      return next(new AppError('Invalid token type', 401));
    }
    
    req.user = decoded; // { id, phone, tier, type: 'access' }
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
}

/**
 * Require subscribed tier. Must be used AFTER requireAuth.
 * Returns 403 if user is freemium.
 */
function requireSubscription(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.tier !== 'subscribed') {
    return next(new AppError(
      'This feature requires a subscription. Upgrade to access PANAHON and the Farm Consultant.',
      403
    ));
  }

  next();
}

module.exports = { requireAuth, requireSubscription };
