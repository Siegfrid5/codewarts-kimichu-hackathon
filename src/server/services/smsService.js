/**
 * GABAYANI — SMS Service (Traccar)
 *
 * Handles sending actual SMS messages to farmers using Traccar SMS Gateway.
 * If the Traccar configuration is missing, it mocks the network call
 * (printing to console) so the app still functions during demos.
 *
 * Also logs every sent message to the `alert_log` table for audit
 * and BPH spread index tracking.
 *
 * Traccar SMS API: https://www.traccar.org/sms/
 * Supports both token and API key authentication
 */

const config = require('../config');
const AlertLog = require('../models/AlertLog');

const SmsService = {
  /**
   * Send an SMS and log it.
   *
   * @param {string} phone - Target phone number (format: 639XXXXXXXXX)
   * @param {string} message - Translated message body
   * @param {string} englishTemplate - Original English template (for auditing)
   * @param {string} farmId - Associated farm ID
   * @param {string} alertType - 'digest' | 'panahon' | 'red_alert' | 'chatbot'
   * @param {string} riskLevel - 'all_clear' | 'moderate' | 'red'
   */
  async send(phone, message, englishTemplate, farmId, alertType, riskLevel) {
    const apiUrl = config.traccar?.url || 'https://www.traccar.org/sms/';
    const token = config.traccar?.token;

    // 1. Send the SMS via Traccar (or mock it)
    if (!token || token === 'your-traccar-token') {
      console.log('\n📱 --- [MOCK SMS DISPATCH] ---');
      console.log(`📱 To: ${phone}`);
      console.log(`📱 Type: ${alertType} (${riskLevel})`);
      console.log(`📱 Message:\n${message}`);
      console.log('📱 ---------------------------\n');
    } else {
      try {
        // Prepare JSON payload for Traccar SMS Gateway
        const payload = {
          to: phone,
          message: message
        };

        // Prepare headers - Traccar uses Authorization header with token
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': token
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        const result = await response.text();

        if (!response.ok) {
          console.error(`❌ [SMS] Traccar error: ${response.status}`, result);
        } else {
          // Check the response body for actual success/failure
          try {
            const resultJson = JSON.parse(result);
            if (resultJson.successCount > 0 || resultJson.success === true) {
              console.log(`📱 [SMS] Sent successfully to ${phone} via Traccar`);
            } else {
              console.error(`❌ [SMS] Traccar API returned success=false`, result);
            }
          } catch (e) {
            // If response is not JSON, assume success if HTTP status is OK
            console.log(`📱 [SMS] Sent successfully to ${phone} via Traccar`);
          }
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
