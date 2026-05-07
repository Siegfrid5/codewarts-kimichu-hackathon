/**
 * GABAYANI — SCT Digest Job
 * 
 * Runs at 05:00 and 17:00 to send daily digests to all farmers.
 * 
 * Pipeline:
 *   1. Get all farms with their risk status
 *   2. Get weather and satellite data for each farm
 *   3. Generate digest message using TemplateEngine
 *   4. Translate to farmer's dialect
 *   5. Send SMS via PhilSMS
 * 
 * This is a freemium benefit — all tiers receive digests.
 */

const Farm = require('../models/Farm');
const User = require('../models/User');
const WeatherCache = require('../models/WeatherCache');
const SatelliteCache = require('../models/SatelliteCache');
const FarmRiskStatus = require('../models/FarmRiskStatus');
const TemplateEngine = require('../services/templateEngine');
const SmsService = require('../services/smsService');
const GeminiService = require('../services/geminiService');

const DigestJob = {
  /**
   * Execute a full digest cycle.
   * Called by SCT scheduler at 05:00 and 17:00.
   * 
   * @returns {Object} Summary of the run
   */
  async runDigest() {
    const startTime = Date.now();
    console.log('📋 [SCT] Starting digest cycle...');

    const summary = {
      farmsProcessed: 0,
      messagesSent: 0,
      errors: [],
    };

    try {
      // Get all farms with their risk status
      const farms = await Farm.getAllWithRiskStatus();
      
      if (farms.length === 0) {
        console.log('📋 [SCT] No farms registered. Skipping digest.');
        return summary;
      }

      console.log(`📋 [SCT] Processing ${farms.length} farms...`);

      // Process each farm
      for (const farm of farms) {
        try {
          await DigestJob.processFarm(farm, summary);
        } catch (err) {
          console.error(`❌ [SCT] Error processing farm ${farm.id}: ${err.message}`);
          summary.errors.push({ farm_id: farm.id, error: err.message });
        }
      }
    } catch (err) {
      console.error(`❌ [SCT] Fatal error in digest cycle: ${err.message}`);
      summary.errors.push({ farm_id: 'GLOBAL', error: err.message });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `📋 [SCT] Digest cycle complete in ${elapsed}s. ` +
      `${summary.farmsProcessed} farms, ${summary.messagesSent} messages sent.`
    );

    return summary;
  },

  /**
   * Process a single farm:
   *   - Get weather and satellite data
   *   - Generate digest message
   *   - Translate and send SMS
   */
  async processFarm(farm, summary) {
    // Get weather data for farm's municipality
    const weather = await WeatherCache.findByMunicipality(farm.municipality);
    if (!weather) {
      console.warn(`⚠️  [SCT] No weather data for ${farm.municipality}`);
      return;
    }

    // Get satellite data for farm's location
    const satellite = await SatelliteCache.findByLocation(farm.centroid_lat, farm.centroid_lng);

    // Build farm context for template engine
    const farmContext = {
      ...farm,
      weather: weather || {},
      satellite: satellite || {},
      risk_status: {
        bph_risk: farm.bph_risk || 'low',
        blast_risk: farm.blast_risk || 'low',
        flood_risk: farm.flood_risk || 'low',
        gdd_accumulated: farm.gdd_accumulated || 0,
        consecutive_wet_hours: farm.consecutive_wet_hours || 0
      }
    };

    // Generate digest message
    const englishTemplate = TemplateEngine.generateDigest(farmContext);

    // Translate to farmer's dialect
    const translated = await GeminiService.translateForSms(englishTemplate, farm.dialect || 'tagalog');

    // Send SMS
    await SmsService.send(
      farm.phone,
      translated,
      englishTemplate,
      farm.id,
      'digest',
      farmContext.risk_status.bph_risk === 'high' || 
      farmContext.risk_status.blast_risk === 'high' || 
      farmContext.risk_status.flood_risk === 'high' ? 'red' : 'all_clear'
    );

    summary.farmsProcessed++;
    summary.messagesSent++;
    console.log(`  ✅ Digest sent to ${farm.phone} (${farm.municipality})`);
  },

  /**
   * Manually trigger a digest cycle (for testing/debugging).
   * @returns {Object} Run summary
   */
  async triggerDigest() {
    console.log('📋 [SCT] Manual digest cycle triggered');
    return DigestJob.runDigest();
  },
};

module.exports = DigestJob;
