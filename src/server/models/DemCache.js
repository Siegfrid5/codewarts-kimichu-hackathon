/**
 * GABAYANI — DemCache Model
 * 
 * CRUD operations for the `dem_cache` table.
 * Stores SRTM DEM elevation and slope data.
 * 
 * Write-once pattern: data is fetched exactly once at farm registration
 * and never re-queried. Terrain doesn't change.
 */

const db = require('../db');

const TABLE = 'dem_cache';

const DemCache = {
  /**
   * Upsert DEM data for a coordinate pair.
   * Uses ON CONFLICT to handle duplicate coordinates.
   * @param {Object} data - { lat, lng, elevation_m, slope_deg }
   * @returns {Object} Upserted row
   */
  async upsert(data) {
    const existing = await db(TABLE)
      .where({ lat: data.lat, lng: data.lng })
      .first();

    if (existing) {
      return existing; // DEM data never changes — return existing
    }

    const [created] = await db(TABLE)
      .insert({
        lat: data.lat,
        lng: data.lng,
        elevation_m: data.elevation_m,
        slope_deg: data.slope_deg,
      })
      .returning('*');
    return created;
  },

  /**
   * Find DEM data by coordinates.
   * @param {number} lat
   * @param {number} lng
   * @returns {Object|null}
   */
  async findByCoordinates(lat, lng) {
    return db(TABLE).where({ lat, lng }).first();
  },
};

module.exports = DemCache;
