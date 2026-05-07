/**
 * GABAYANI — Chatbot Routes
 * 
 * POST /api/chatbot/message
 * Handles messages sent from the Farm Consultant UI.
 * Uses Gemini Pro and RAG context from the farm.
 */

const express = require('express');
const Farm = require('../models/Farm');
const FarmRiskStatus = require('../models/FarmRiskStatus');
const WeatherCache = require('../models/WeatherCache');
const SatelliteCache = require('../models/SatelliteCache');
const GeminiService = require('../services/geminiService');
const { requireAuth } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/chatbot/message
 * Send a message to Gabayani.
 * Requires Authentication.
 */
router.post('/message', requireAuth, asyncHandler(async (req, res) => {
  const { farm_id, message } = req.body;

  if (!farm_id || !message) {
    throw new AppError('farm_id and message are required', 400);
  }

  // 1. Verify Farm Ownership
  const farm = await Farm.findById(farm_id);
  if (!farm || farm.user_id !== req.user.id) {
    throw new AppError('Farm not found or unauthorized', 404);
  }

  // 2. Enrich with all available context
  const riskStatus = await FarmRiskStatus.findByFarmId(farm.id);
  const weather = await WeatherCache.findByMunicipality(farm.municipality);
  const satellite = await SatelliteCache.findByFarmId(farm.id);

  const farmContext = {
    ...farm,
    risk_status: riskStatus || null,
    weather: weather || null,
    satellite: satellite || null,
  };

  // 3. Query Gemini Pro with enriched Farm Context
  const reply = await GeminiService.consult(message, farmContext);

  res.json({
    success: true,
    data: {
      reply
    }
  });
}));

module.exports = router;
