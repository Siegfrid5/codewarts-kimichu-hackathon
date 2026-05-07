/**
 * Migration: Add consecutive_wet_hours to farm_risk_status
 * 
 * Tracks consecutive hours above BLAST_HUMIDITY_MIN for Rice Blast risk calculation.
 */

exports.up = function (knex) {
  return knex.schema.alterTable('farm_risk_status', (table) => {
    table.integer('consecutive_wet_hours').defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('farm_risk_status', (table) => {
    table.dropColumn('consecutive_wet_hours');
  });
};
