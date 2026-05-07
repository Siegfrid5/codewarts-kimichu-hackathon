/**
 * GABAYANI — SMS Service (Semaphore API)
 * 
 * Handles sending actual SMS messages to farmers.
 * If the Semaphore API key is missing, it mocks the network call
 * (printing to console) so the app still functions during demos.
 * 
 * Also logs every sent message to the `alert_log` table for audit
 * and BPH spread index tracking.
 */

const config = require('../config');
const AlertLog = require('../models/AlertLog');

const SEMAPHORE_URL = 'https://api.semaphore.co/api/v4/messages';

const SmsService = {
  /**
   * Send an SMS and log it.
   * 
   * @param {string} phone - Target phone number
   * @param {string} message - Translated message body
   * @param {string} englishTemplate - Original English template (for auditing)
   * @param {string} farmId - Associated farm ID
   * @param {string} alertType - 'digest' | 'panahon' | 'red_alert'
   * @param {string} riskLevel - 'all_clear' | 'moderate' | 'red'
   */
  async send(phone, message, englishTemplate, farmId, alertType, riskLevel) {
    const apiKey = config.semaphore.apiKey;
    const senderName = config.semaphore.senderName;

    // 1. Send the SMS via Semaphore (or mock it)
    if (!apiKey || apiKey === 'your-semaphore-api-key') {
      console.log('\n📱 --- [MOCK SMS DISPATCH] ---');
      console.log(`📱 To: ${phone}`);
      console.log(`📱 Type: ${alertType} (${riskLevel})`);
      console.log(`📱 Message:\n${message}`);
      console.log('📱 ---------------------------\n');
    } else {
      try {
        const formData = new URLSearchParams();
        formData.append('apikey', apiKey);
        formData.append('number', phone);
        formData.append('message', message);
        formData.append('sendername', senderName);

        const response = await fetch(SEMAPHORE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`❌ [SMS] Semaphore error: ${response.status} ${errText}`);
        } else {
          console.log(`📱 [SMS] Sent successfully to ${phone}`);
        }
      } catch (err) {
        console.error(`❌ [SMS] Failed to send SMS: ${err.message}`);
      }
    }

    // 2. Log the alert to the database
    // This is critical — it's how the BPH spread index knows a red alert was sent
    try {
      if (farmId) {
        await AlertLog.create({
          farm_id: farmId,
          alert_type: alertType,
          risk_level: riskLevel,
          message_en: englishTemplate,
          message_dialect: message
        });
      }
    } catch (err) {
      console.error(`❌ [SMS] Failed to log alert to database: ${err.message}`);
    }
  }
};

module.exports = SmsService;
