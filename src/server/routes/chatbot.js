/**
 * GABAYANI — Chatbot Routes
 * 
 * POST /api/chatbot/message
 * Handles messages sent from the Farm Consultant UI.
 * Uses Gemini Pro and RAG context from the farm.
 */

const express = require('express');
const Farm = require('../models/Farm');
const GeminiService = require('../services/geminiService');
const { requireAuth, requireSubscription } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/chatbot/message
 * Send a message to Gabayani.
 * Requires Authentication AND Subscription.
 */
router.post('/message', requireAuth, requireSubscription, asyncHandler(async (req, res) => {
  const { farm_id, message } = req.body;

  if (!farm_id || !message) {
    throw new AppError('farm_id and message are required', 400);
  }

  // 1. Verify Farm Ownership & Get Full Context
  const fullFarmList = await Farm.getAllWithRiskStatus();
  const farmContext = fullFarmList.find((f) => f.id === farm_id && f.user_id === req.user.id);

  if (!farmContext) {
    throw new AppError('Farm not found or unauthorized', 404);
  }

  // 2. Query Gemini Pro with Farm Context
  const reply = await GeminiService.consult(message, farmContext);

  res.json({
    success: true,
    data: {
      reply
    }
  });
}));

module.exports = router;
