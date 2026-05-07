/**
 * GABAYANI — SMS Service (Traccar SMS Gateway)
 * 
 * Handles sending actual SMS messages to farmers using Traccar SMS Gateway.
 * If the Traccar configuration is missing, it mocks the network call
 * (printing to console) so the app still functions during demos.
 * 
 * Also logs every sent message to the `alert_log` table for audit
 * and BPH spread index tracking.
 * 
 * Traccar SMS Gateway: https://www.traccar.org/sms-gateway/
 * HTTP API: https://www.traccar.org/http-sms-api/
 */

const config = require('../config');
const AlertLog = require('../models/AlertLog');

const TRACCAR_DEFAULT_URL = 'https://www.traccar.org/sms/';

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
    const traccarUrl = config.traccar?.url || TRACCAR_DEFAULT_URL;
    const traccarToken = config.traccar?.token;
    const traccarApiKey = config.traccar?.apiKey;

    // 1. Send the SMS via Traccar (or mock it)
    if ((!traccarToken && !traccarApiKey) || traccarToken === 'your-traccar-token') {
      console.log('\n📱 --- [MOCK SMS DISPATCH] ---');
      console.log(`📱 To: ${phone}`);
      console.log(`📱 Type: ${alertType} (${riskLevel})`);
      console.log(`📱 Message:\n${message}`);
      console.log('📱 ---------------------------\n');
    } else {
      try {
        // Prepare JSON payload for Traccar
        const payload = {
          to: phone,
          message: message
        };

        // Prepare headers
        const headers = {
          'Content-Type': 'application/json',
        };

        // Use API key if provided (direct phone connection), otherwise use token
        if (traccarApiKey) {
          headers['Authorization'] = traccarApiKey;
        } else if (traccarToken) {
          headers['Authorization'] = traccarToken;
        }

        const response = await fetch(traccarUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`❌ [SMS] Traccar error: ${response.status} ${errText}`);
        } else {
          console.log(`📱 [SMS] Sent successfully to ${phone} via Traccar`);
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
