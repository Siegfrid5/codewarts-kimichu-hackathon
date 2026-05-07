/**
 * GABAYANI — Authentication Routes
 * 
 * POST /api/auth/register — Create new user account
 * POST /api/auth/login    — Authenticate and get JWT
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { validate, userRegistrationSchema, loginSchema } = require('../utils/validation');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/auth/register
 * Create a new user account.
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { error, value } = validate(userRegistrationSchema, req.body);
  if (error) {
    throw new AppError('Validation failed', 400, error.details.map((d) => d.message));
  }

  // Check if phone already registered
  const existing = await User.findByPhone(value.phone);
  if (existing) {
    throw new AppError('Phone number already registered', 409);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(value.password, salt);

  // Create user
  const user = await User.create({
    name: value.name,
    phone: value.phone,
    password_hash,
  });

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, phone: user.phone, tier: user.subscription_tier },
    config.jwt.secret,
    { expiresIn: config.jwt.expiry }
  );

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        subscription_tier: user.subscription_tier,
      },
      token,
    },
  });
}));

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { error, value } = validate(loginSchema, req.body);
  if (error) {
    throw new AppError('Validation failed', 400, error.details.map((d) => d.message));
  }

  // Find user
  const user = await User.findByPhone(value.phone);
  if (!user) {
    throw new AppError('Invalid phone number or password', 401);
  }

  // Verify password
  const validPassword = await bcrypt.compare(value.password, user.password_hash);
  if (!validPassword) {
    throw new AppError('Invalid phone number or password', 401);
  }

  // Update last login
  await User.updateLastLogin(user.id);

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, phone: user.phone, tier: user.subscription_tier },
    config.jwt.secret,
    { expiresIn: config.jwt.expiry }
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        subscription_tier: user.subscription_tier,
      },
      token,
    },
  });
}));

module.exports = router;
