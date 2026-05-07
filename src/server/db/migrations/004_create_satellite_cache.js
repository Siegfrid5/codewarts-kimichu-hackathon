/**
 * Migration: Create satellite_cache table
 * 
 * Stores GEE Sentinel-2 NDVI/NDWI data per farm.
 * Entries flagged invalid when cloud cover > 40%.
 * Tracks both fetched_at (last attempt) and last_valid_at (last usable data).
 */

exports.up = function (knex) {
  return knex.schema.createTable('satellite_cache', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').references('id').inTable('farms').onDelete('CASCADE');
    table.decimal('ndvi', 6, 4).nullable(); // Canopy density
    table.decimal('ndwi', 6, 4).nullable(); // Leaf moisture
    table.decimal('cloud_pct', 5, 2).nullable(); // Scene cloud cover
    table.boolean('is_valid').defaultTo(true); // False when cloud > 40%
    table.timestamp('fetched_at').notNullable(); // When we last checked
    table.timestamp('last_valid_at').nullable(); // Shown to farmer in responses
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Index on farm_id for per-farm lookups
    table.index('farm_id', 'idx_satellite_cache_farm_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('satellite_cache');
};
