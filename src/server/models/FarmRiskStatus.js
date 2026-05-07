/**
 * GABAYANI — FarmRiskStatus Model
 * 
 * CRUD operations for the `farm_risk_status` table.
 * This table is the output of the Processing Layer (Phase 2).
 * It drives all alert decisions — digest, PANAHON, and Red Alert.
 * 
 * Core rule: Only the processing layer writes to this table.
 * It reads from weather_cache + satellite_cache + dem_cache.
 */

const db = require('../db');

const TABLE = 'farm_risk_status';

const FarmRiskStatus = {
  /**
   * Upsert risk status for a farm.
   * Called after each SCT weather run triggers risk recomputation.
   * @param {string} farmId - UUID
   * @param {Object} data - { bph_risk, blast_risk, flood_risk, gdd_accumulated, consecutive_wet_hours }
   * @returns {Object} Upserted row
   */
  async upsertByFarmId(farmId, data) {
    const existing = await db(TABLE).where({ farm_id: farmId }).first();

    if (existing) {
      const updateData = {
        bph_risk: data.bph_risk || existing.bph_risk,
        blast_risk: data.blast_risk || existing.blast_risk,
        flood_risk: data.flood_risk || existing.flood_risk,
        gdd_accumulated: data.gdd_accumulated !== undefined
          ? data.gdd_accumulated
          : existing.gdd_accumulated,
        updated_at: new Date(),
      };

      // Only include consecutive_wet_hours if column exists
      if (data.consecutive_wet_hours !== undefined) {
        try {
          updateData.consecutive_wet_hours = data.consecutive_wet_hours;
        } catch (err) {
          // Column doesn't exist yet, skip it
          console.warn('⚠️  consecutive_wet_hours column not found, skipping');
        }
      }

      const [updated] = await db(TABLE)
        .where({ farm_id: farmId })
        .update(updateData)
        .returning('*');
      return updated;
    }

    const createData = {
      farm_id: farmId,
      bph_risk: data.bph_risk || 'low',
      blast_risk: data.blast_risk || 'low',
      flood_risk: data.flood_risk || 'low',
      gdd_accumulated: data.gdd_accumulated || 0,
    };

    // Only include consecutive_wet_hours if column exists
    if (data.consecutive_wet_hours !== undefined) {
      try {
        createData.consecutive_wet_hours = data.consecutive_wet_hours;
      } catch (err) {
        // Column doesn't exist yet, skip it
        console.warn('⚠️  consecutive_wet_hours column not found, skipping');
      }
    }

    const [created] = await db(TABLE)
      .insert(createData)
      .returning('*');
    return created;
  },

  /**
   * Get risk status for a specific farm.
   * @param {string} farmId - UUID
   * @returns {Object|null}
   */
  async findByFarmId(farmId) {
    return db(TABLE).where({ farm_id: farmId }).first();
  },

  /**
   * Find all farms with any risk level at 'high'.
   * Used to detect Red Alert triggers after risk recomputation.
   * @returns {Array}
   */
  async findHighRisk() {
    return db(TABLE)
      .where('bph_risk', 'high')
      .orWhere('blast_risk', 'high')
      .orWhere('flood_risk', 'high');
  },

  /**
   * Get all risk statuses.
   * @returns {Array}
   */
  async getAll() {
    return db(TABLE).orderBy('updated_at', 'desc');
  },
};

module.exports = FarmRiskStatus;
