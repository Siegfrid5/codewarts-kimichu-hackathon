/**
 * GABAYANI — Farm Model
 * 
 * CRUD operations for the `farms` table.
 * Includes spatial queries for BPH spread index (Haversine distance)
 * and municipal grouping for SCT optimization.
 */

const db = require('../db');
const { BPH_SPREAD_RADIUS_KM } = require('../constants/thresholds');

const TABLE = 'farms';

const Farm = {
  /**
   * Create a new farm record.
   * @param {Object} data - Farm registration data
   * @returns {Object} The created farm row
   */
  async create(data) {
    const [farm] = await db(TABLE)
      .insert({
        user_id: data.user_id,
        farmer_name: data.farmer_name,
        phone: data.phone,
        barangay: data.barangay,
        municipality: data.municipality,
        crop: data.crop || 'rice',
        dialect: data.dialect || 'tagalog',
        polygon_geojson: data.polygon_geojson ? JSON.stringify(data.polygon_geojson) : null,
        centroid_lat: data.centroid_lat,
        centroid_lng: data.centroid_lng,
        area_hectares: data.area_hectares,
        elevation_m: data.elevation_m,
        slope_deg: data.slope_deg,
      })
      .returning('*');
    return farm;
  },

  /**
   * Find a farm by ID.
   * @param {string} id - UUID
   * @returns {Object|null}
   */
  async findById(id) {
    return db(TABLE).where({ id }).first();
  },

  /**
   * Find all farms belonging to a user.
   * @param {string} userId - UUID
   * @returns {Array}
   */
  async findByUserId(userId) {
    return db(TABLE).where({ user_id: userId });
  },

  /**
   * Find all farms in a municipality.
   * Used by SCT cron jobs to batch weather data writes.
   * @param {string} municipality
   * @returns {Array}
   */
  async findByMunicipality(municipality) {
    return db(TABLE).where({ municipality });
  },

  /**
   * Get all distinct municipalities with registered farms.
   * Core SCT query — determines how many OpenWeather calls to make.
   * @returns {Array<string>}
   */
  async getAllMunicipalities() {
    const rows = await db(TABLE).distinct('municipality').orderBy('municipality');
    return rows.map((r) => r.municipality);
  },

  /**
   * Find all farms within a radius of a given point (Haversine formula).
   * Used by BPH spread index to identify neighboring farms.
   * 
   * Uses the Haversine formula directly in SQL for efficiency.
   * No external API calls — pure math on stored coordinates.
   * 
   * @param {number} lat - Center latitude
   * @param {number} lng - Center longitude
   * @param {number} radiusKm - Search radius in kilometers (default: BPH_SPREAD_RADIUS_KM)
   * @param {string} excludeFarmId - Farm ID to exclude (the source farm)
   * @returns {Array} Farms within radius, with distance_km column
   */
  async findFarmsWithinRadius(lat, lng, radiusKm = BPH_SPREAD_RADIUS_KM, excludeFarmId = null) {
    let query = db(TABLE)
      .select('*')
      .select(
        db.raw(`
          (6371 * acos(
            cos(radians(?)) * cos(radians(centroid_lat)) *
            cos(radians(centroid_lng) - radians(?)) +
            sin(radians(?)) * sin(radians(centroid_lat))
          )) AS distance_km
        `, [lat, lng, lat])
      )
      .whereNotNull('centroid_lat')
      .whereNotNull('centroid_lng')
      .having(db.raw('distance_km <= ?', [radiusKm]))
      .orderBy('distance_km', 'asc');

    if (excludeFarmId) {
      query = query.whereNot({ id: excludeFarmId });
    }

    return query;
  },

  /**
   * Update farm DEM data (elevation + slope) after SRTM lookup.
   * Called once at registration — never again.
   * @param {string} id - Farm UUID
   * @param {number} elevationM
   * @param {number} slopeDeg
   */
  async updateDemData(id, elevationM, slopeDeg) {
    await db(TABLE)
      .where({ id })
      .update({
        elevation_m: elevationM,
        slope_deg: slopeDeg,
      });
  },

  /**
   * Get all farms with their risk status (joined query).
   * Used by the digest scheduler to build alert messages.
   * @returns {Array}
   */
  async getAllWithRiskStatus() {
    return db(TABLE)
      .select('farms.*', 'farm_risk_status.*')
      .leftJoin('farm_risk_status', 'farms.id', 'farm_risk_status.farm_id');
  },
};

module.exports = Farm;
