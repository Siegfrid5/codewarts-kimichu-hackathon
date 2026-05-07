/**
 * GABAYANI — Input Validation Schemas (Joi)
 * 
 * Centralized validation for all API inputs.
 * Used by route handlers to validate request bodies.
 */

const Joi = require('joi');

// Valid enum values matching database enums
const CROPS = ['rice', 'corn'];
const DIALECTS = ['tagalog', 'ilocano', 'cebuano', 'hiligaynon'];
const TIERS = ['freemium', 'subscribed'];

/**
 * Password strength validation.
 * Requires: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Farm registration schema.
 * Validates web form submission including polygon GeoJSON.
 */
const farmRegistrationSchema = Joi.object({
  farmer_name: Joi.string().min(2).max(255).required(),
  phone: Joi.string()
    .pattern(/^09\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be a valid PH mobile (09XXXXXXXXX)',
    }),
  barangay: Joi.string().min(2).max(255).required(),
  municipality: Joi.string().min(2).max(255).required(),
  crop: Joi.string().valid(...CROPS).default('rice'),
  dialect: Joi.string().valid(...DIALECTS).default('tagalog'),
  polygon_geojson: Joi.object({
    type: Joi.string().valid('Polygon').required(),
    coordinates: Joi.array()
      .items(
        Joi.array().items(
          Joi.array().length(2).items(Joi.number()).required()
        ).min(4) // Minimum 4 points (3 vertices + closing point)
      )
      .required(),
  }).required(),
  centroid_lat: Joi.number().min(-90).max(90).required(),
  centroid_lng: Joi.number().min(-180).max(180).required(),
  area_hectares: Joi.number().positive().required(),
});

/**
 * User registration schema.
 * Updated to support username and optional email.
 */
const userRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  phone: Joi.string()
    .pattern(/^09\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be a valid PH mobile (09XXXXXXXXX)',
    }),
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Username must contain only letters, numbers, and underscores',
    }),
  email: Joi.string()
    .email()
    .allow('')
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  password: Joi.string()
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    }),
});

/**
 * Login schema.
 * Updated to accept username, email, or phone.
 */
const loginSchema = Joi.object({
  identifier: Joi.string()
    .required()
    .messages({
      'string.empty': 'Please enter your username, email, or phone number',
    }),
  password: Joi.string().required(),
});

/**
 * Refresh token schema.
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

/**
 * PANAHON request schema (from SMS webhook).
 */
const panahonRequestSchema = Joi.object({
  phone: Joi.string().required(),
  message: Joi.string().required(),
});

/**
 * Validate data against a schema.
 * Returns { value, error } — error is null if valid.
 */
function validate(schema, data) {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
}

module.exports = {
  farmRegistrationSchema,
  userRegistrationSchema,
  loginSchema,
  refreshTokenSchema,
  panahonRequestSchema,
  validate,
  CROPS,
  DIALECTS,
  TIERS,
};
