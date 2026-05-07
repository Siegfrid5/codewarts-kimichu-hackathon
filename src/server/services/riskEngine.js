/**
 * GABAYANI — Risk Engine (Processing Layer)
 * 
 * Pure functions that compute risk levels from cached data.
 * This module NEVER calls external APIs. It reads from:
 *   - weather_cache
 *   - satellite_cache
 *   - dem_cache (via farms table)
 * And writes to:
 *   - farm_risk_status
 * 
 * All thresholds come from constants/thresholds.js — no magic numbers.
 * Sources: PhilRice / IRRI (BPH, Blast), PAGASA (Flood, Landslide)
 */

const {
  BPH_T_BASE,
  BPH_HATCH_GDD,
  BPH_NDVI_MIN,
  BPH_NDWI_MIN,
  BPH_GDD_APPROACH_RATIO,
  BLAST_TEMP_MIN,
  BLAST_TEMP_MAX,
  BLAST_HUMIDITY_MIN,
  BLAST_WETNESS_HOURS,
  FLOOD_RAIN_1H_THRESHOLD,
  FLOOD_RAIN_24H_THRESHOLD,
  FLOOD_ELEVATION_MAX,
  LANDSLIDE_RAIN_24H_THRESHOLD,
  LANDSLIDE_SLOPE_MIN,
  BPH_SPREAD_RADIUS_KM,
  BPH_WIND_TOLERANCE_DEG,
} = require('../constants/thresholds');

const { computeBearing, isDownwind } = require('../utils/geo');

const RiskEngine = {
  /**
   * Compute daily GDD increment for BPH tracking.
   * GDD = max(0, daily_temp - base_temp)
   * 
   * @param {number} tempC - Current temperature in °C
   * @returns {number} GDD increment for this reading
   */
  computeGddIncrement(tempC) {
    if (tempC == null) return 0;
    return Math.max(0, tempC - BPH_T_BASE);
  },

  /**
   * Compute BPH (Brown Planthopper) risk level.
   * Multi-factor model: GDD + NDVI + NDWI
   * 
   * @param {number} gddAccumulated - Running GDD total
   * @param {Object|null} satellite - { ndvi, ndwi, is_valid }
   * @returns {string} 'low' | 'moderate' | 'high'
   */
  computeBphRisk(gddAccumulated, satellite) {
    const gddReady = gddAccumulated >= BPH_HATCH_GDD;
    const approaching = gddAccumulated >= BPH_HATCH_GDD * BPH_GDD_APPROACH_RATIO;

    // If satellite data is invalid/stale, we can't confirm canopy/moisture
    if (!satellite || !satellite.is_valid) {
      if (gddReady) return 'moderate'; // GDD met but can't confirm vegetation
      if (approaching) return 'moderate';
      return 'low';
    }

    const canopyOk = satellite.ndvi >= BPH_NDVI_MIN;
    const moistureOk = satellite.ndwi >= BPH_NDWI_MIN;

    if (gddReady && canopyOk && moistureOk) return 'high';
    if (gddReady) return 'moderate';
    if (approaching) return 'moderate';
    return 'low';
  },

  /**
   * Compute Rice Blast risk level.
   * Factors: temperature range + sustained high humidity.
   * 
   * @param {number} tempC - Current temperature
   * @param {number} humidityPct - Current relative humidity
   * @param {number} consecutiveWetHours - Hours above BLAST_HUMIDITY_MIN
   * @returns {string} 'low' | 'moderate' | 'high'
   */
  computeBlastRisk(tempC, humidityPct, consecutiveWetHours = 0) {
    if (tempC == null || humidityPct == null) return 'low';

    const tempInRange = tempC >= BLAST_TEMP_MIN && tempC <= BLAST_TEMP_MAX;
    const humidEnough = humidityPct >= BLAST_HUMIDITY_MIN;

    if (tempInRange && consecutiveWetHours >= BLAST_WETNESS_HOURS) return 'high';
    if (tempInRange && humidEnough) return 'moderate';
    return 'low';
  },

  /**
   * Compute Flood risk level.
   * Factors: rainfall intensity + farm elevation.
   * Uses PAGASA thresholds.
   * 
   * @param {number} rain1hMm - Rainfall in last hour (mm)
   * @param {number} rain24hMm - Rainfall in last 24 hours (mm)
   * @param {number} elevationM - Farm elevation from DEM (meters)
   * @returns {string} 'low' | 'moderate' | 'high'
   */
  computeFloodRisk(rain1hMm, rain24hMm, elevationM) {
    const rainfallHeavy = (rain1hMm || 0) > FLOOD_RAIN_1H_THRESHOLD;
    const rainfallFlood = (rain24hMm || 0) > FLOOD_RAIN_24H_THRESHOLD;
    const lowElevation = elevationM != null && elevationM < FLOOD_ELEVATION_MAX;

    if ((rainfallHeavy || rainfallFlood) && lowElevation) return 'high';
    if (rainfallHeavy || rainfallFlood) return 'moderate';
    return 'low';
  },

  /**
   * Compute Landslide risk level.
   * Factors: rainfall intensity + farm slope.
   * 
   * @param {number} rain24hMm - Rainfall in last 24 hours (mm)
   * @param {number} slopeDeg - Farm slope from DEM (degrees)
   * @returns {string} 'low' | 'high'
   */
  computeLandslideRisk(rain24hMm, slopeDeg) {
    const rainfallFlood = (rain24hMm || 0) > LANDSLIDE_RAIN_24H_THRESHOLD;
    const steepSlope = slopeDeg != null && slopeDeg > LANDSLIDE_SLOPE_MIN;

    if (rainfallFlood && steepSlope) return 'high';
    return 'low';
  },

  /**
   * Determine BPH spread targets: which nearby farms are downwind.
   * 
   * @param {Object} sourceFarm - The farm that triggered BPH Red Alert
   * @param {Array} nearbyFarms - Farms within BPH_SPREAD_RADIUS_KM
   * @param {number} windDirDeg - Wind direction (degrees, FROM)
   * @returns {Array} Farms that are downwind and should be warned
   */
  findDownwindFarms(sourceFarm, nearbyFarms, windDirDeg) {
    if (windDirDeg == null || !nearbyFarms.length) return [];

    return nearbyFarms.filter((farm) => {
      const bearing = computeBearing(
        sourceFarm.centroid_lat,
        sourceFarm.centroid_lng,
        farm.centroid_lat,
        farm.centroid_lng
      );
      return isDownwind(windDirDeg, bearing, BPH_WIND_TOLERANCE_DEG);
    });
  },

  /**
   * Check if any risk level qualifies as a Red Alert.
   * Red Alerts bypass the digest schedule and are never paywalled.
   * 
   * @param {Object} risks - { bph_risk, blast_risk, flood_risk }
   * @returns {boolean}
   */
  isRedAlert(risks) {
    return (
      risks.bph_risk === 'high' ||
      risks.blast_risk === 'high' ||
      risks.flood_risk === 'high'
    );
  },

  /**
   * Get which specific threats triggered a Red Alert.
   * @param {Object} risks
   * @returns {Array<string>} e.g. ['bph', 'flood']
   */
  getRedAlertTypes(risks) {
    const types = [];
    if (risks.bph_risk === 'high') types.push('bph');
    if (risks.blast_risk === 'high') types.push('blast');
    if (risks.flood_risk === 'high') types.push('flood');
    return types;
  },
};

module.exports = RiskEngine;
