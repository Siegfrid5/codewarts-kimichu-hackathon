/**
 * GABAYANI — WeatherCache Model
 * 
 * CRUD operations for the `weather_cache` table.
 * One row per municipality — upserted by SCT cron jobs.
 * 
 * Core rule: Farmer-facing services read from here only.
 */

const db = require('../db');
const { WEATHER_CACHE_TTL_HOURS } = require('../constants/thresholds');

const TABLE = 'weather_cache';

const WeatherCache = {
  /**
   * Upsert weather data for a municipality.
   * Called by SCT cron job after each OpenWeather fetch.
   * @param {string} municipality
   * @param {Object} data - Weather readings
   * @returns {Object} Upserted row
   */
  async upsertByMunicipality(municipality, data) {
    const existing = await db(TABLE).where({ municipality }).first();

    if (existing) {
      const [updated] = await db(TABLE)
        .where({ municipality })
        .update({
          temp_c: data.temp_c,
          humidity_pct: data.humidity_pct,
          rain_1h_mm: data.rain_1h_mm || 0,
          rain_24h_mm: data.rain_24h_mm || 0,
          wind_dir_deg: data.wind_dir_deg,
          wind_speed_ms: data.wind_speed_ms,
          fetched_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');
      return updated;
    }

    const [created] = await db(TABLE)
      .insert({
        municipality,
        temp_c: data.temp_c,
        humidity_pct: data.humidity_pct,
        rain_1h_mm: data.rain_1h_mm || 0,
        rain_24h_mm: data.rain_24h_mm || 0,
        wind_dir_deg: data.wind_dir_deg,
        wind_speed_ms: data.wind_speed_ms,
        fetched_at: new Date(),
      })
      .returning('*');
    return created;
  },

  /**
   * Get cached weather for a municipality.
   * @param {string} municipality
   * @returns {Object|null}
   */
  async findByMunicipality(municipality) {
    return db(TABLE).where({ municipality }).first();
  },

  /**
   * Find municipalities with stale weather data.
   * Used by SCT to determine which municipalities need refreshing.
   * @param {number} ttlHours - Maximum cache age (default: WEATHER_CACHE_TTL_HOURS)
   * @returns {Array<string>} Municipality names with stale/missing data
   */
  async findStale(ttlHours = WEATHER_CACHE_TTL_HOURS) {
    const cutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000);
    const staleRows = await db(TABLE)
      .where('fetched_at', '<', cutoff)
      .select('municipality');
    return staleRows.map((r) => r.municipality);
  },

  /**
   * Get all cached weather entries.
   * @returns {Array}
   */
  async getAll() {
    return db(TABLE).orderBy('municipality');
  },
};

module.exports = WeatherCache;
