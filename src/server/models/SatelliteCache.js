/**
 * GABAYANI — SatelliteCache Model
 * 
 * CRUD operations for the `satellite_cache` table.
 * Stores per-farm NDVI/NDWI from GEE Sentinel-2 batch jobs.
 * 
 * Data integrity rule: If cloud_pct > 40%, is_valid = false.
 * The system always uses last_valid_at to tell farmers when data was last usable.
 */

const db = require('../db');
const { SATELLITE_CLOUD_COVER_MAX } = require('../constants/thresholds');

const TABLE = 'satellite_cache';

const SatelliteCache = {
  /**
   * Upsert satellite data for a farm.
   * Automatically sets is_valid based on cloud cover threshold.
   * If valid, also updates last_valid_at.
   * 
   * @param {string} farmId - UUID
   * @param {Object} data - { ndvi, ndwi, cloud_pct }
   * @returns {Object} Upserted row
   */
  async upsertByFarmId(farmId, data) {
    const isValid = (data.cloud_pct || 0) <= SATELLITE_CLOUD_COVER_MAX;
    const now = new Date();

    const existing = await db(TABLE).where({ farm_id: farmId }).first();

    if (existing) {
      const updateData = {
        ndvi: data.ndvi,
        ndwi: data.ndwi,
        cloud_pct: data.cloud_pct,
        is_valid: isValid,
        fetched_at: now,
      };

      // Only update last_valid_at when the data is actually usable
      if (isValid) {
        updateData.last_valid_at = now;
      }

      const [updated] = await db(TABLE)
        .where({ farm_id: farmId })
        .update(updateData)
        .returning('*');
      return updated;
    }

    const [created] = await db(TABLE)
      .insert({
        farm_id: farmId,
        ndvi: data.ndvi,
        ndwi: data.ndwi,
        cloud_pct: data.cloud_pct,
        is_valid: isValid,
        fetched_at: now,
        last_valid_at: isValid ? now : null,
      })
      .returning('*');
    return created;
  },

  /**
   * Get satellite data for a specific farm.
   * @param {string} farmId - UUID
   * @returns {Object|null}
   */
  async findByFarmId(farmId) {
    return db(TABLE).where({ farm_id: farmId }).first();
  },

  /**
   * Find farms with stale or invalid satellite data.
   * Used to generate degraded-mode messages.
   * @returns {Array}
   */
  async findStaleOrInvalid() {
    return db(TABLE)
      .where({ is_valid: false })
      .orWhereNull('last_valid_at');
  },
};

module.exports = SatelliteCache;
