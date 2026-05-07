/**
 * Migration: Create farms table
 * 
 * Stores farm metadata, polygon boundary (GeoJSON), computed centroid,
 * area, and DEM-derived elevation/slope. One farm per registration,
 * linked to a user account.
 */

exports.up = function (knex) {
  return knex.schema.createTable('farms', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('farmer_name', 255).notNullable();
    table.string('phone', 20).notNullable();
    table.string('barangay', 255).notNullable();
    table.string('municipality', 255).notNullable(); // OpenWeather grouping key
    table
      .enu('crop', ['rice', 'corn'], {
        useNative: true,
        enumName: 'crop_type_enum',
      })
      .defaultTo('rice');
    table
      .enu('dialect', ['tagalog', 'ilocano', 'cebuano', 'hiligaynon'], {
        useNative: true,
        enumName: 'dialect_enum',
      })
      .defaultTo('tagalog');
    table.jsonb('polygon_geojson').nullable(); // Full farm boundary from Google Maps
    table.decimal('centroid_lat', 10, 7).nullable(); // Computed from polygon
    table.decimal('centroid_lng', 10, 7).nullable(); // Computed from polygon
    table.decimal('area_hectares', 10, 4).nullable(); // Computed from polygon
    table.decimal('elevation_m', 8, 2).nullable(); // From SRTM DEM (one-time)
    table.decimal('slope_deg', 5, 2).nullable(); // From SRTM DEM (one-time)
    table.timestamp('registered_at').defaultTo(knex.fn.now());

    // Index on municipality for SCT grouping queries
    table.index('municipality', 'idx_farms_municipality');
    // Index on user_id for user-farm lookups
    table.index('user_id', 'idx_farms_user_id');
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('farms')
    .then(() => knex.raw('DROP TYPE IF EXISTS crop_type_enum'))
    .then(() => knex.raw('DROP TYPE IF EXISTS dialect_enum'));
};
