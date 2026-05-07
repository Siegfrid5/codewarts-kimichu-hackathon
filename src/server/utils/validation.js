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
 */
const userRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  phone: Joi.string()
    .pattern(/^09\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be a valid PH mobile (09XXXXXXXXX)',
    }),
  password: Joi.string().min(8).max(128).required(),
});

/**
 * Login schema.
 */
const loginSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().required(),
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
  panahonRequestSchema,
  validate,
  CROPS,
  DIALECTS,
  TIERS,
};
