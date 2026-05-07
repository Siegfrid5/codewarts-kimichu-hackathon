/**
 * GABAYANI — Authentication Routes
 * 
 * POST /api/auth/register — Create new user account
 * POST /api/auth/login    — Authenticate and get JWT + refresh token
 * POST /api/auth/refresh  — Refresh access token
 * POST /api/auth/logout   — Invalidate refresh token
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { validate, userRegistrationSchema, loginSchema, refreshTokenSchema } = require('../utils/validation');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Account lockout settings
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * POST /api/auth/register
 * Create a new user account.
 */
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { error, value } = validate(userRegistrationSchema, req.body);
  if (error) {
    throw new AppError('Validation failed', 400, error.details.map((d) => d.message));
  }

  // Check if phone already registered
  const existingPhone = await User.findByPhone(value.phone);
  if (existingPhone) {
    throw new AppError('Phone number already registered', 409);
  }

  // Check if username already taken (if provided)
  if (value.username) {
    const existingUsername = await User.findByUsername(value.username);
    if (existingUsername) {
      throw new AppError('Username already taken', 409);
    }
  }

  // Check if email already taken (if provided)
  if (value.email) {
    const existingEmail = await User.findByEmail(value.email);
    if (existingEmail) {
      throw new AppError('Email already registered', 409);
    }
  }

  // Hash password with increased rounds for security
  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(value.password, salt);

  // Create user - only include username and email if they have values
  const userData = {
    name: value.name,
    phone: value.phone,
    password_hash,
  };

  if (value.username && value.username.trim()) {
    userData.username = value.username.trim();
  }

  if (value.email && value.email.trim()) {
    userData.email = value.email.trim();
  }

  const user = await User.create(userData);

  // Generate access token (short-lived: 15 minutes)
  const accessToken = jwt.sign(
    { id: user.id, phone: user.phone, tier: user.subscription_tier, type: 'access' },
    config.jwt.secret,
    { expiresIn: '15m' }
  );

  // Generate refresh token (long-lived: 7 days)
  const refreshTokenData = await RefreshToken.create(user.id, 7);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        username: user.username,
        email: user.email,
        subscription_tier: user.subscription_tier,
      },
      accessToken,
      refreshToken: refreshTokenData.token,
    },
  });
}));

/**
 * POST /api/auth/login
 * Authenticate user and return JWT + refresh token.
 * Supports login with username, email, or phone.
 */
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { error, value } = validate(loginSchema, req.body);
  if (error) {
    throw new AppError('Validation failed', 400, error.details.map((d) => d.message));
  }

  // Find user by identifier (username, email, or phone)
  const user = await User.findByIdentifier(value.identifier);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if account is locked
  const isLocked = await User.isAccountLocked(user.id);
  if (isLocked) {
    throw new AppError('Account temporarily locked due to too many failed attempts. Please try again later.', 423);
  }

  // Verify password
  const validPassword = await bcrypt.compare(value.password, user.password_hash);
  if (!validPassword) {
    // Increment failed login attempts
    const updatedUser = await User.incrementFailedLogin(user.id);
    
    // Lock account if too many failed attempts
    if (updatedUser.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
      await User.lockAccount(user.id, lockedUntil);
      
      throw new AppError('Account temporarily locked due to too many failed attempts. Please try again later.', 423);
    }
    
    const remainingAttempts = MAX_FAILED_ATTEMPTS - updatedUser.failed_login_attempts;
    throw new AppError(`Invalid credentials. ${remainingAttempts} attempts remaining.`, 401);
  }

  // Reset failed login attempts on successful login
  await User.resetFailedLogin(user.id);

  // Update last login
  await User.updateLastLogin(user.id);

  // Generate access token (short-lived: 15 minutes)
  const accessToken = jwt.sign(
    { id: user.id, phone: user.phone, tier: user.subscription_tier, type: 'access' },
    config.jwt.secret,
    { expiresIn: '15m' }
  );

  // Generate refresh token (long-lived: 7 days)
  const refreshTokenData = await RefreshToken.create(user.id, 7);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        username: user.username,
        email: user.email,
        subscription_tier: user.subscription_tier,
      },
      accessToken,
      refreshToken: refreshTokenData.token,
    },
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token.
 * Implements token rotation (issues new refresh token).
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { error, value } = validate(refreshTokenSchema, req.body);
  if (error) {
    throw new AppError('Validation failed', 400, error.details.map((d) => d.message));
  }

  // Verify refresh token
  const refreshToken = await RefreshToken.verify(value.refreshToken);
  if (!refreshToken) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Get user
  const user = await User.findById(refreshToken.user_id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Revoke old refresh token (token rotation)
  await RefreshToken.revoke(value.refreshToken);

  // Generate new access token
  const accessToken = jwt.sign(
    { id: user.id, phone: user.phone, tier: user.subscription_tier, type: 'access' },
    config.jwt.secret,
    { expiresIn: '15m' }
  );

  // Generate new refresh token
  const newRefreshTokenData = await RefreshToken.create(user.id, 7);

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken: newRefreshTokenData.token,
    },
  });
}));

/**
 * POST /api/auth/logout
 * Invalidate refresh token.
 */
router.post('/logout', asyncHandler(async (req, res) => {
  const { error, value } = validate(refreshTokenSchema, req.body);
  if (error) {
    throw new AppError('Validation failed', 400, error.details.map((d) => d.message));
  }

  // Revoke refresh token
  await RefreshToken.revoke(value.refreshToken);

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}));

module.exports = router;
