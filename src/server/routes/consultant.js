/**
 * GABAYANI — Consultant Routes
 * 
 * POST /api/consultant
 * Chatbot endpoint for subscribed users to interact with the AI agronomist.
 */

const express = require('express');
const User = require('../models/User');
const Farm = require('../models/Farm');
const WeatherCache = require('../models/WeatherCache');
const SatelliteCache = require('../models/SatelliteCache');
const FarmRiskStatus = require('../models/FarmRiskStatus');
const GeminiService = require('../services/geminiService');
const { requireAuth, requireSubscription } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/consultant
 * Chat with the AI Farm Consultant (Gemini 1.5 Pro).
 * Only available to subscribed users.
 */
router.post('/', requireAuth, requireSubscription, asyncHandler(async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message) {
    throw new AppError('Message is required', 400);
  }

  // Get user's primary farm
  const farms = await Farm.findByUserId(userId);
  if (farms.length === 0) {
    throw new AppError('No registered farms. Please register a farm to use the consultant.', 400);
  }

  const farm = farms[0];

  // Get farm context (weather, satellite, risk status)
  const weather = await WeatherCache.findByMunicipality(farm.municipality);
  const satellite = await SatelliteCache.findByLocation(farm.centroid_lat, farm.centroid_lng);
  const riskStatus = await FarmRiskStatus.findByFarmId(farm.id);

  // Build farm context for AI
  const farmContext = {
    ...farm,
    weather: weather || {},
    satellite: satellite || {},
    risk_status: riskStatus || {
      bph_risk: 'low',
      blast_risk: 'low',
      flood_risk: 'low',
      gdd_accumulated: 0
    }
  };

  // Get AI response
  const response = await GeminiService.consult(message, farmContext);

  res.json({
    success: true,
    response: response,
    farm_context: {
      municipality: farm.municipality,
      barangay: farm.barangay,
      dialect: farm.dialect
    }
  });
}));

module.exports = router;
