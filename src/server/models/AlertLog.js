/**
 * GABAYANI — AlertLog Model
 * 
 * Audit log for every SMS/notification sent.
 * Used by BPH spread index, web dashboard, and debugging.
 */

const db = require('../db');

const TABLE = 'alert_log';

const AlertLog = {
  async create(data) {
    const [entry] = await db(TABLE)
      .insert({
        farm_id: data.farm_id,
        alert_type: data.alert_type,
        risk_level: data.risk_level,
        message_en: data.message_en,
        message_dialect: data.message_dialect,
      })
      .returning('*');
    return entry;
  },

  async findByFarmId(farmId, limit = 20) {
    return db(TABLE)
      .where({ farm_id: farmId })
      .orderBy('sent_at', 'desc')
      .limit(limit);
  },

  async findRecentRedAlerts(farmIds, withinHours = 48) {
    const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000);
    return db(TABLE)
      .whereIn('farm_id', farmIds)
      .where('alert_type', 'red_alert')
      .where('sent_at', '>=', cutoff)
      .orderBy('sent_at', 'desc');
  },

  async findLatest(farmId) {
    return db(TABLE)
      .where({ farm_id: farmId })
      .orderBy('sent_at', 'desc')
      .first();
  },
};

module.exports = AlertLog;
