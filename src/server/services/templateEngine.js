/**
 * GABAYANI — SMS Template Engine
 * 
 * Generates pure English text messages based on risk states.
 * These templates are designed to be short, actionable, and
 * ready for translation by Gemini into the farmer's dialect.
 */

const TemplateEngine = {
  /**
   * General Digest (All Clear)
   * Sent when there are no immediate threats.
   */
  generateDigest(farm) {
    const { weather, risk_status, satellite } = farm;
    
    // Check if satellite data is missing/cloudy
    let satNote = '';
    if (!satellite || !satellite.is_valid) {
      satNote = " (Satellite view blocked by clouds. Will check again soon.)";
    }

    return `[GABAYANI Update] ${farm.municipality}:
Weather: ${weather.temp_c}°C, ${weather.rain_1h_mm}mm rain.
Risks: BPH(${risk_status.bph_risk}), Blast(${risk_status.blast_risk}), Flood(${risk_status.flood_risk}).
All clear. Keep monitoring your field.${satNote}`;
  },

  /**
   * Red Alert — Immediate action required
   * @param {Object} farm
   * @param {Array<string>} alertTypes e.g. ['bph', 'flood']
   */
  generateRedAlert(farm, alertTypes) {
    const alerts = [];
    
    if (alertTypes.includes('bph')) {
      alerts.push("CRITICAL: High BPH risk detected based on temperature and crop canopy. Spray immediately if hoppers are visible.");
    }
    if (alertTypes.includes('blast')) {
      alerts.push("CRITICAL: High Rice Blast risk. Weather is perfect for fungal spread. Consider applying fungicide.");
    }
    if (alertTypes.includes('flood')) {
      alerts.push("CRITICAL: High Flood/Landslide risk due to heavy rain. Secure your equipment and avoid low-lying areas.");
    }

    return `[GABAYANI RED ALERT]
${alerts.join('\n\n')}
Act quickly to protect your farm.`;
  },

  /**
   * BPH Spread Warning
   * Sent to neighbors when a nearby farm triggers a BPH Red Alert.
   */
  generateSpreadWarning(distanceKm) {
    return `[GABAYANI Warning]
A farm ${distanceKm.toFixed(1)}km upwind from you has reported a high risk of Brown Planthopper.
Because of the wind direction, your farm is at risk of spread. Please scout your fields today.`;
  },

  /**
   * PANAHON On-Demand Response
   * Sent when a subscribed user texts "PANAHON"
   */
  generatePanahonResponse(farm) {
    return `[GABAYANI PANAHON]
${farm.farmer_name}, here is the current status for your farm in ${farm.barangay}:
Temp: ${farm.weather.temp_c}°C
Rain (1h): ${farm.weather.rain_1h_mm}mm
GDD: ${farm.risk_status.gdd_accumulated.toFixed(1)}
Risks: BPH(${farm.risk_status.bph_risk}), Blast(${farm.risk_status.blast_risk}), Flood(${farm.risk_status.flood_risk}).
Text a question if you need advice!`;
  },

  /**
   * Freemium Upgrade Prompt
   * Sent when a freemium user texts PANAHON
   */
  generateUpgradePrompt() {
    return `[GABAYANI]
The PANAHON on-demand feature and AI Farm Consultant are for premium subscribers.
To unlock instant weather checks and chat with our AI agronomist, please upgrade your subscription.`;
  }
};

module.exports = TemplateEngine;
