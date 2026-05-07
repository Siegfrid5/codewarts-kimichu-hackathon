/**
 * Migration: Create alert_log table
 * 
 * Audit log of every SMS/notification sent. Used for:
 * 1. BPH spread index — querying recent Red Alerts from neighbors
 * 2. Web dashboard — showing last alert sent per farm
 * 3. Debugging — tracing what was sent, when, in what language
 */

exports.up = function (knex) {
  return knex.schema.createTable('alert_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
    table
      .enu('alert_type', ['digest', 'panahon', 'red_alert'], {
        useNative: true,
        enumName: 'alert_type_enum',
      })
      .notNullable();
    table
      .enu('risk_level', ['all_clear', 'moderate', 'red'], {
        useNative: true,
        enumName: 'alert_risk_level_enum',
      })
      .notNullable();
    table.text('message_en').nullable(); // English template output
    table.text('message_dialect').nullable(); // Gemini-translated final SMS
    table.timestamp('sent_at').defaultTo(knex.fn.now());

    // Index on farm_id + sent_at for recent-alert queries (BPH spread)
    table.index(['farm_id', 'sent_at'], 'idx_alert_log_farm_sent');
    // Index on alert_type for filtering Red Alerts
    table.index('alert_type', 'idx_alert_log_type');
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('alert_log')
    .then(() => knex.raw('DROP TYPE IF EXISTS alert_type_enum'))
    .then(() => knex.raw('DROP TYPE IF EXISTS alert_risk_level_enum'));
};
