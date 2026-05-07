/**
 * GABAYANI — SCT Weather Job
 * 
 * Runs on the SCT schedule (04:30, 12:00, 15:00, 21:00).
 * 
 * Pipeline:
 *   1. Get all distinct municipalities from farms table
 *   2. For each municipality, get a representative centroid
 *   3. Call OpenWeather API (1 call per municipality)
 *   4. Upsert weather_cache
 *   5. Recompute risk status for all farms in that municipality
 *   6. Detect Red Alerts and flag for immediate dispatch
 * 
 * This is the ONLY path where OpenWeather gets called.
 */

const Farm = require('../models/Farm');
const WeatherCache = require('../models/WeatherCache');
const SatelliteCache = require('../models/SatelliteCache');
const FarmRiskStatus = require('../models/FarmRiskStatus');
const OpenWeatherService = require('../services/openWeatherService');
const RiskEngine = require('../services/riskEngine');
const db = require('../db');

const WeatherJob = {
  /**
   * Execute a full weather refresh cycle.
   * Called by SCT scheduler at the 4 strategic windows.
   * 
   * @returns {Object} Summary of the run
   */
  async runFullRefresh() {
    const startTime = Date.now();
    console.log('🌦️  [SCT] Starting full weather refresh...');

    const summary = {
      municipalities: 0,
      farmsProcessed: 0,
      redAlerts: [],
      errors: [],
    };

    try {
      // Step 1: Get all municipalities with farms
      const municipalities = await Farm.getAllMunicipalities();
      summary.municipalities = municipalities.length;

      if (municipalities.length === 0) {
        console.log('🌦️  [SCT] No farms registered. Skipping weather refresh.');
        return summary;
      }

      console.log(`🌦️  [SCT] Processing ${municipalities.length} municipalities...`);

      // Step 2: Process each municipality
      for (const municipality of municipalities) {
        try {
          await WeatherJob.processMunicipality(municipality, summary);
        } catch (err) {
          console.error(`❌ [SCT] Error processing ${municipality}: ${err.message}`);
          summary.errors.push({ municipality, error: err.message });
        }
      }
    } catch (err) {
      console.error(`❌ [SCT] Fatal error in weather refresh: ${err.message}`);
      summary.errors.push({ municipality: 'GLOBAL', error: err.message });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `🌦️  [SCT] Weather refresh complete in ${elapsed}s. ` +
      `${summary.municipalities} municipalities, ${summary.farmsProcessed} farms, ` +
      `${summary.redAlerts.length} Red Alerts.`
    );

    return summary;
  },

  /**
   * Process a single municipality:
   *   - Get representative coordinates
   *   - Fetch weather from OpenWeather
   *   - Update cache
   *   - Recompute risk for all farms in this municipality
   */
  async processMunicipality(municipality, summary) {
    // Get farms in this municipality for their centroids
    const farms = await Farm.findByMunicipality(municipality);
    if (farms.length === 0) return;

    // Use first farm's centroid as representative point
    // (weather is uniform at municipality scale)
    const repFarm = farms.find((f) => f.centroid_lat && f.centroid_lng);
    if (!repFarm) {
      console.warn(`⚠️  [SCT] No farm with coordinates in ${municipality}. Skipping.`);
      return;
    }

    // Fetch weather (1 API call per municipality)
    const weatherData = await OpenWeatherService.fetchWeather(
      repFarm.centroid_lat,
      repFarm.centroid_lng,
      municipality
    );

    if (!weatherData) {
      console.warn(`⚠️  [SCT] No weather data returned for ${municipality}.`);
      return;
    }

    // Upsert weather cache
    await WeatherCache.upsertByMunicipality(municipality, weatherData);
    console.log(`  ✅ ${municipality}: ${weatherData.temp_c}°C, ${weatherData.humidity_pct}% RH, rain: ${weatherData.rain_1h_mm}mm/1h`);

    // Recompute risk for all farms in this municipality
    for (const farm of farms) {
      try {
        await WeatherJob.recomputeFarmRisk(farm, weatherData, summary);
        summary.farmsProcessed++;
      } catch (err) {
        console.error(`❌ [SCT] Risk recompute failed for farm ${farm.id}: ${err.message}`);
        summary.errors.push({ farm_id: farm.id, error: err.message });
      }
    }
  },

  /**
   * Recompute risk status for a single farm.
   * Reads from cached data only (weather just refreshed, satellite from DB).
   */
  async recomputeFarmRisk(farm, weatherData, summary) {
    // Get satellite data from cache
    const satellite = await SatelliteCache.findByFarmId(farm.id);

    // Get current risk status (for GDD running total)
    const currentRisk = await FarmRiskStatus.findByFarmId(farm.id);
    const currentGdd = parseFloat(currentRisk?.gdd_accumulated || 0);

    // Compute GDD increment from this weather reading
    const gddIncrement = RiskEngine.computeGddIncrement(weatherData.temp_c);
    const newGdd = currentGdd + gddIncrement;

    // Compute all risk levels
    const bphRisk = RiskEngine.computeBphRisk(newGdd, satellite);
    const blastRisk = RiskEngine.computeBlastRisk(
      weatherData.temp_c,
      weatherData.humidity_pct,
      0 // TODO: Track consecutive wetness hours from humidity log
    );
    const floodRisk = RiskEngine.computeFloodRisk(
      weatherData.rain_1h_mm,
      weatherData.rain_24h_mm,
      farm.elevation_m
    );

    // Combine flood and landslide into the flood_risk field
    // (landslide is a subset — both are triggered by rainfall)
    const landslideRisk = RiskEngine.computeLandslideRisk(
      weatherData.rain_24h_mm,
      farm.slope_deg
    );
    const finalFloodRisk =
      floodRisk === 'high' || landslideRisk === 'high' ? 'high' :
      floodRisk === 'moderate' ? 'moderate' : 'low';

    const risks = {
      bph_risk: bphRisk,
      blast_risk: blastRisk,
      flood_risk: finalFloodRisk,
      gdd_accumulated: newGdd,
    };

    // Upsert risk status
    await FarmRiskStatus.upsertByFarmId(farm.id, risks);

    // Check for Red Alert
    if (RiskEngine.isRedAlert(risks)) {
      const alertTypes = RiskEngine.getRedAlertTypes(risks);
      summary.redAlerts.push({
        farm_id: farm.id,
        farmer_name: farm.farmer_name,
        municipality: farm.municipality,
        types: alertTypes,
      });
      console.log(`  🔴 RED ALERT: Farm ${farm.farmer_name} (${farm.municipality}) — ${alertTypes.join(', ')}`);
    }
  },

  /**
   * Execute a rainfall-only micro-refresh.
   * Called hourly by SCT to maintain sub-3hr rainfall resolution.
   * Only updates rain_1h_mm in weather_cache — not the full payload.
   */
  async runRainfallMicroRefresh() {
    console.log('🌧️  [SCT] Starting rainfall micro-refresh...');

    const municipalities = await Farm.getAllMunicipalities();
    let updated = 0;

    for (const municipality of municipalities) {
      try {
        const farms = await Farm.findByMunicipality(municipality);
        const repFarm = farms.find((f) => f.centroid_lat && f.centroid_lng);
        if (!repFarm) continue;

        const rainfall = await OpenWeatherService.fetchRainfallOnly(
          repFarm.centroid_lat,
          repFarm.centroid_lng,
          municipality
        );

        if (rainfall) {
          // Only update rainfall field, keep everything else
          const existing = await WeatherCache.findByMunicipality(municipality);
          if (existing) {
            await WeatherCache.upsertByMunicipality(municipality, {
              ...existing,
              rain_1h_mm: rainfall.rain_1h_mm,
            });
            updated++;
          }
        }
      } catch (err) {
        console.error(`❌ [SCT] Rainfall micro-refresh error for ${municipality}: ${err.message}`);
      }
    }

    console.log(`🌧️  [SCT] Rainfall micro-refresh complete. ${updated}/${municipalities.length} municipalities updated.`);
  },
};

module.exports = WeatherJob;
