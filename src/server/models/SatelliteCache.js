/**
 * GABAYANI — SatelliteCache Model
 * 
 * CRUD operations for the `satellite_cache` table.
 * Stores location-based NDVI/NDWI from GEE Sentinel-2 batch jobs.
 * Uses a grid system (0.01 degree ~ 1km) to share data between nearby farms.
 * 
 * Data integrity rule: If cloud_pct > 40%, is_valid = false.
 * The system always uses last_valid_at to tell farmers when data was last usable.
 */

const db = require('../db');
const { SATELLITE_CLOUD_COVER_MAX } = require('../constants/thresholds');

const TABLE = 'satellite_cache';
const GRID_SIZE = 0.01; // ~1km grid for location-based caching

const SatelliteCache = {
  /**
   * Convert coordinates to grid cell identifier
   * @param {number} lat
   * @param {number} lng
   * @returns {string} Grid cell ID
   */
  coordsToGrid(lat, lng) {
    const latGrid = Math.floor(lat / GRID_SIZE);
    const lngGrid = Math.floor(lng / GRID_SIZE);
    return `${latGrid}_${lngGrid}`;
  },

  /**
   * Upsert satellite data for a location (grid cell).
   * Automatically sets is_valid based on cloud cover threshold.
   * If valid, also updates last_valid_at.
   * 
   * @param {number} lat - Centroid latitude
   * @param {number} lng - Centroid longitude
   * @param {Object} data - { ndvi, ndwi, cloud_pct }
   * @returns {Object} Upserted row
   */
  async upsertByLocation(lat, lng, data) {
    const gridId = this.coordsToGrid(lat, lng);
    const isValid = (data.cloud_pct || 0) <= SATELLITE_CLOUD_COVER_MAX;
    const now = new Date();

    const existing = await db(TABLE).where({ grid_id: gridId }).first();

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
        .where({ grid_id: gridId })
        .update(updateData)
        .returning('*');
      return updated;
    }

    const [created] = await db(TABLE)
      .insert({
        grid_id: gridId,
        center_lat: lat,
        center_lng: lng,
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
   * Get satellite data for a specific farm (backward compatibility).
   * @param {string} farmId - UUID
   * @returns {Object|null}
   */
  async findByFarmId(farmId) {
    // This method is kept for backward compatibility
    // In the future, farms should use findByLocation with their centroid
    const Farm = require('./Farm');
    const farm = await Farm.findById(farmId);
    if (!farm) return null;
    return this.findByLocation(farm.centroid_lat, farm.centroid_lng);
  },

  /**
   * Get satellite data for a specific location.
   * @param {number} lat
   * @param {number} lng
   * @returns {Object|null}
   */
  async findByLocation(lat, lng) {
    const gridId = this.coordsToGrid(lat, lng);
    return db(TABLE).where({ grid_id: gridId }).first();
  },

  /**
   * Find locations with stale or invalid satellite data.
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
