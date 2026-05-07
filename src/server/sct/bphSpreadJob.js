/**
 * GABAYANI — BPH Spread Index Job
 * 
 * When a farm triggers a BPH Red Alert, this job:
 *   1. Finds all farms within 5km radius (Haversine on centroids)
 *   2. Checks wind direction from weather_cache
 *   3. Identifies downwind farms (±45° tolerance)
 *   4. Elevates their BPH risk by one tier
 *   5. Flags them for neighbor warning SMS
 * 
 * Uses only stored data. Zero API calls.
 */

const Farm = require('../models/Farm');
const WeatherCache = require('../models/WeatherCache');
const FarmRiskStatus = require('../models/FarmRiskStatus');
const RiskEngine = require('../services/riskEngine');
const { BPH_SPREAD_RADIUS_KM } = require('../constants/thresholds');

const BphSpreadJob = {
  /**
   * Process BPH spread for a farm that just triggered a Red Alert.
   * 
   * @param {Object} sourceFarm - The farm with BPH Red Alert
   * @returns {Array} List of affected downwind farms
   */
  async processSpread(sourceFarm) {
    console.log(`🐛 [BPH Spread] Processing spread from farm: ${sourceFarm.farmer_name} (${sourceFarm.municipality})`);

    if (!sourceFarm.centroid_lat || !sourceFarm.centroid_lng) {
      console.warn('⚠️  [BPH Spread] Source farm has no coordinates. Skipping.');
      return [];
    }

    // Step 1: Find nearby farms within radius
    const nearbyFarms = await Farm.findFarmsWithinRadius(
      sourceFarm.centroid_lat,
      sourceFarm.centroid_lng,
      BPH_SPREAD_RADIUS_KM,
      sourceFarm.id // exclude source
    );

    if (nearbyFarms.length === 0) {
      console.log('🐛 [BPH Spread] No nearby farms within 5km radius.');
      return [];
    }

    console.log(`🐛 [BPH Spread] Found ${nearbyFarms.length} farms within ${BPH_SPREAD_RADIUS_KM}km.`);

    // Step 2: Get wind direction from weather cache
    const weather = await WeatherCache.findByMunicipality(sourceFarm.municipality);
    if (!weather || weather.wind_dir_deg == null) {
      console.warn('⚠️  [BPH Spread] No wind data available. Cannot determine downwind farms.');
      return [];
    }

    // Step 3: Filter to downwind farms
    const downwindFarms = RiskEngine.findDownwindFarms(
      sourceFarm,
      nearbyFarms,
      weather.wind_dir_deg
    );

    if (downwindFarms.length === 0) {
      console.log('🐛 [BPH Spread] No downwind farms found.');
      return [];
    }

    console.log(`🐛 [BPH Spread] ${downwindFarms.length} farms are downwind. Elevating risk.`);

    // Step 4: Elevate risk for downwind farms
    const affectedFarms = [];
    for (const farm of downwindFarms) {
      try {
        const currentRisk = await FarmRiskStatus.findByFarmId(farm.id);
        const currentBph = currentRisk?.bph_risk || 'low';

        // Elevate by one tier
        const elevatedBph = BphSpreadJob.elevateTier(currentBph);

        if (elevatedBph !== currentBph) {
          await FarmRiskStatus.upsertByFarmId(farm.id, {
            bph_risk: elevatedBph,
          });

          affectedFarms.push({
            farm_id: farm.id,
            farmer_name: farm.farmer_name,
            phone: farm.phone,
            municipality: farm.municipality,
            dialect: farm.dialect,
            previous_risk: currentBph,
            elevated_risk: elevatedBph,
            distance_km: farm.distance_km,
          });

          console.log(`  ⬆️  ${farm.farmer_name}: ${currentBph} → ${elevatedBph} (${farm.distance_km?.toFixed(1)}km away)`);
        }
      } catch (err) {
        console.error(`❌ [BPH Spread] Error elevating risk for farm ${farm.id}: ${err.message}`);
      }
    }

    return affectedFarms;
  },

  /**
   * Elevate risk by one tier.
   * low → moderate, moderate → high, high → high (no change)
   */
  elevateTier(current) {
    const tiers = { low: 'moderate', moderate: 'high', high: 'high' };
    return tiers[current] || current;
  },
};

module.exports = BphSpreadJob;
