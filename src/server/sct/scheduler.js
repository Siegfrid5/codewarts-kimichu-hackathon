/**
 * GABAYANI — SCT Scheduler
 * 
 * Strategic Call Timing — the only layer that triggers external API calls.
 * Runs silently in the background on fixed schedules.
 * 
 * Schedule:
 *   - Weather full refresh:   04:30, 12:00, 15:00, 21:00
 *   - Rainfall micro-refresh: Every hour (on the hour)
 *   - Satellite refresh:      Every 5 days (handled separately via GEE)
 * 
 * All times are in Asia/Manila (UTC+8).
 */

const cron = require('node-cron');
const WeatherJob = require('./weatherJob');
const SatelliteJob = require('./satelliteJob');
const DigestJob = require('./digestJob');

// Timezone for all SCT schedules
const TIMEZONE = 'Asia/Manila';

const SCTScheduler = {
  /**
   * Initialize and start all SCT cron jobs.
   * Call this once during server startup.
   */
  start() {
    console.log('⏰ [SCT] Initializing scheduler (Asia/Manila timezone)...');

    // ---- Weather Full Refresh (4 strategic windows) ----
    // 04:30 — feeds the 5:00 AM digest with fresh data
    cron.schedule('30 4 * * *', async () => {
      console.log('\n⏰ [SCT] 04:30 weather refresh triggered');
      await WeatherJob.runFullRefresh();
    }, { timezone: TIMEZONE });

    // 12:00 — captures midday temperature peak (critical for GDD)
    cron.schedule('0 12 * * *', async () => {
      console.log('\n⏰ [SCT] 12:00 weather refresh triggered');
      await WeatherJob.runFullRefresh();
    }, { timezone: TIMEZONE });

    // 15:00 — captures afternoon humidity shift (Blast risk)
    cron.schedule('0 15 * * *', async () => {
      console.log('\n⏰ [SCT] 15:00 weather refresh triggered');
      await WeatherJob.runFullRefresh();
    }, { timezone: TIMEZONE });

    // 21:00 — captures nighttime conditions (fungal progression)
    cron.schedule('0 21 * * *', async () => {
      console.log('\n⏰ [SCT] 21:00 weather refresh triggered');
      await WeatherJob.runFullRefresh();
    }, { timezone: TIMEZONE });

    // ---- Rainfall Micro-Refresh (every hour) ----
    // Maintains sub-3hr rainfall resolution for flood trigger accuracy
    cron.schedule('0 * * * *', async () => {
      await WeatherJob.runRainfallMicroRefresh();
    }, { timezone: TIMEZONE });

    // ---- Satellite Refresh (every 5 days) ----
    // Refresh Sentinel-2 NDVI/NDWI data for all farm locations
    cron.schedule('0 0 */5 * *', async () => {
      console.log('\n⏰ [SCT] Satellite refresh triggered');
      await SatelliteJob.runFullRefresh();
    }, { timezone: TIMEZONE });

    // ---- SMS Digest (05:00 and 17:00) ----
    // Send daily digests to all farmers (freemium benefit)
    cron.schedule('0 5 * * *', async () => {
      console.log('\n⏰ [SCT] 05:00 digest triggered');
      await DigestJob.runDigest();
    }, { timezone: TIMEZONE });

    cron.schedule('0 17 * * *', async () => {
      console.log('\n⏰ [SCT] 17:00 digest triggered');
      await DigestJob.runDigest();
    }, { timezone: TIMEZONE });

    console.log('⏰ [SCT] Scheduler started:');
    console.log('   🌦️  Weather refresh:   04:30, 12:00, 15:00, 21:00');
    console.log('   🌧️  Rainfall refresh:  Every hour');
    console.log('   🛰️  Satellite refresh: Every 5 days');
    console.log('   📋 SMS Digest:        05:00, 17:00');
  },

  /**
   * Manually trigger a full weather refresh (for testing/debugging).
   * @returns {Object} Run summary
   */
  async triggerWeatherRefresh() {
    console.log('⏰ [SCT] Manual weather refresh triggered');
    return WeatherJob.runFullRefresh();
  },

  /**
   * Manually trigger a rainfall micro-refresh (for testing/debugging).
   */
  async triggerRainfallRefresh() {
    console.log('⏰ [SCT] Manual rainfall refresh triggered');
    return WeatherJob.runRainfallMicroRefresh();
  },

  /**
   * Manually trigger a satellite refresh (for testing/debugging).
   * @returns {Object} Run summary
   */
  async triggerSatelliteRefresh() {
    console.log('⏰ [SCT] Manual satellite refresh triggered');
    return SatelliteJob.runFullRefresh();
  },

  /**
   * Manually trigger a digest cycle (for testing/debugging).
   * @returns {Object} Run summary
   */
  async triggerDigest() {
    console.log('⏰ [SCT] Manual digest cycle triggered');
    return DigestJob.runDigest();
  },
};

module.exports = SCTScheduler;
