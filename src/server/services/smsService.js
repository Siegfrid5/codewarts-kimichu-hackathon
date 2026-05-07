/**
 * GABAYANI — SMS Service (PhilSMS)
 * 
 * Handles sending actual SMS messages to farmers using PhilSMS.
 * If the PhilSMS configuration is missing, it mocks the network call
 * (printing to console) so the app still functions during demos.
 * 
 * Also logs every sent message to the `alert_log` table for audit
 * and BPH spread index tracking.
 * 
 * PhilSMS API: https://dashboard.philsms.com/api/v3/
 * Send endpoint: https://dashboard.philsms.com/api/v3/sms/send
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
    const apiUrl = config.philsms?.apiUrl || 'https://dashboard.philsms.com/api/v3/';
    const apiToken = config.philsms?.apiToken;
    const senderId = config.philsms?.senderId || 'GABAYANI';
    const sendUrl = `${apiUrl}sms/send`;

    // 1. Send the SMS via PhilSMS (or mock it)
    if (!apiToken || apiToken === 'your-philsms-api-token') {
      console.log('\n📱 --- [MOCK SMS DISPATCH] ---');
      console.log(`📱 To: ${phone}`);
      console.log(`📱 Type: ${alertType} (${riskLevel})`);
      console.log(`📱 Message:\n${message}`);
      console.log('📱 ---------------------------\n');
    } else {
      try {
        // Prepare JSON payload for PhilSMS
        const payload = {
          recipient: phone,
          sender_id: senderId,
          type: 'plain',
          message: message
        };

        // Prepare headers with Bearer token (OAuth 2.0)
        const headers = {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        const response = await fetch(sendUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || result.status !== 'success') {
          console.error(`❌ [SMS] PhilSMS error: ${response.status}`, result);
        } else {
          console.log(`📱 [SMS] Sent successfully to ${phone} via PhilSMS`);
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
