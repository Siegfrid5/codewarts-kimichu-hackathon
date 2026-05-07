/**
 * Migration: Create dem_cache table
 * 
 * Stores SRTM DEM elevation and slope data.
 * Written ONCE at farm registration, never re-queried.
 * Elevation/slope are static — terrain doesn't change.
 */

exports.up = function (knex) {
  return knex.schema.createTable('dem_cache', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.decimal('lat', 10, 7).notNullable();
    table.decimal('lng', 10, 7).notNullable();
    table.decimal('elevation_m', 8, 2).nullable();
    table.decimal('slope_deg', 5, 2).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Unique constraint on coordinates — one entry per location
    table.unique(['lat', 'lng'], { indexName: 'uq_dem_cache_coordinates' });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('dem_cache');
};
