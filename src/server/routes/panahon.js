/**
 * GABAYANI — PANAHON Routes
 * 
 * POST /api/panahon
 * Webhook endpoint for Traccar when a user texts "PANAHON" to the system number.
 */

const express = require('express');
const User = require('../models/User');
const Farm = require('../models/Farm');
const TemplateEngine = require('../services/templateEngine');
const GeminiService = require('../services/geminiService');
const SmsService = require('../services/smsService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/panahon/test
 * Test endpoint to verify SMS gateway configuration.
 * Sends a test SMS to the provided number.
 */
router.post('/test', asyncHandler(async (req, res) => {
  const { number } = req.body;

  if (!number) {
    throw new AppError('Phone number is required', 400);
  }

  await SmsService.send(
    number,
    "GABAYANI SMS Gateway Test - Configuration verified successfully!",
    "SMS Gateway Test",
    null,
    'test',
    'all_clear'
  );

  res.json({ success: true, message: 'Test SMS sent successfully' });
}));

/**
 * POST /api/panahon
 * Received from Traccar when a user sends an SMS to the gateway.
 * Payload usually contains: { number, message }
 */
router.post('/', asyncHandler(async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    throw new AppError('Invalid webhook payload', 400);
  }

  // Acknowledge webhook immediately
  res.json({ success: true });

  try {
    // 1. Identify User
    const user = await User.findByPhone(number);
    if (!user) {
      // User not registered.
      await SmsService.send(
        number,
        "You are not registered with GABAYANI. Please visit our website to register your farm.",
        "Not registered.",
        null,
        'panahon',
        'all_clear'
      );
      return;
    }

    // 2. Enforce Subscription Tier
    if (user.subscription_tier !== 'subscribed') {
      const template = TemplateEngine.generateUpgradePrompt();
      const translated = await GeminiService.translateForSms(template, 'tagalog');
      await SmsService.send(number, translated, template, null, 'panahon', 'all_clear');
      return;
    }

    // 3. Get User's Primary Farm (For simplicity, pick the first one)
    const farms = await Farm.findByUserId(user.id);
    if (farms.length === 0) {
      await SmsService.send(number, "You have no registered farms.", "No farms.", null, 'panahon', 'all_clear');
      return;
    }

    const farmId = farms[0].id;
    // Get full farm context
    const fullFarmList = await Farm.getAllWithRiskStatus();
    const farmContext = fullFarmList.find((f) => f.id === farmId);

    if (!farmContext) return;

    // 4. Routing: PANAHON Command vs Chatbot Query
    const command = message.trim().toUpperCase();
    
    if (command.startsWith('PANAHON')) {
      // --- PANAHON Digest Flow ---
      const template = TemplateEngine.generatePanahonResponse(farmContext);
      const translated = await GeminiService.translateForSms(template, farmContext.dialect);

      await SmsService.send(
        number,
        translated,
        template,
        farmId,
        'panahon',
        farmContext.bph_risk === 'high' || farmContext.blast_risk === 'high' || farmContext.flood_risk === 'high' ? 'red' : 'all_clear'
      );
    } else {
      // --- AI Chatbot Flow ---
      const reply = await GeminiService.consult(message, farmContext);
      
      await SmsService.send(
        number,
        reply,
        "Chatbot Response",
        farmId,
        'chatbot',
        'all_clear'
      );
    }

  } catch (err) {
    console.error(`❌ [SMS Webhook] Processing failed:`, err);
  }
}));

module.exports = router;
