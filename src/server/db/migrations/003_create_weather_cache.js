/**
 * Migration: Create weather_cache table
 * 
 * Stores OpenWeather data keyed by municipality.
 * One row per municipality — upserted by SCT cron jobs.
 * Core rule: farmer-facing services read from here, never call APIs.
 */

exports.up = function (knex) {
  return knex.schema.createTable('weather_cache', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('municipality', 255).unique().notNullable();
    table.decimal('temp_c', 5, 2).nullable();
    table.decimal('humidity_pct', 5, 2).nullable();
    table.decimal('rain_1h_mm', 8, 2).defaultTo(0); // Flood trigger input
    table.decimal('rain_24h_mm', 8, 2).defaultTo(0); // Flood + landslide trigger
    table.decimal('wind_dir_deg', 5, 2).nullable(); // BPH spread index input
    table.decimal('wind_speed_ms', 5, 2).nullable();
    table.timestamp('fetched_at').notNullable(); // Max age checked before read
    table.timestamps(true, true);

    // Index on fetched_at for stale-check queries
    table.index('fetched_at', 'idx_weather_cache_fetched_at');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('weather_cache');
};
