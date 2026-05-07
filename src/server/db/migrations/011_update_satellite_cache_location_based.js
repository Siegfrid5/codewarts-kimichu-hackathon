/**
 * Migration: Update satellite_cache table for location-based caching
 * 
 * Adds grid_id, center_lat, and center_lng columns to support
 * location-based satellite data sharing between nearby farms.
 * Uses a grid system (0.01 degree ~ 1km) to categorize data by location.
 */

exports.up = function (knex) {
  return knex.schema
    .table('satellite_cache', (table) => {
      // Add grid_id column for location-based indexing
      table.string('grid_id').nullable();
      
      // Add center coordinates for the grid cell
      table.decimal('center_lat', 10, 6).nullable();
      table.decimal('center_lng', 10, 6).nullable();
      
      // Add index on grid_id for faster location-based lookups
      table.index('grid_id', 'idx_satellite_cache_grid_id');
    })
    .then(() => {
      // Migrate existing data: calculate grid_id from farm centroid
      return knex.raw(`
        UPDATE satellite_cache sc
        SET 
          grid_id = CONCAT(FLOOR(f.centroid_lat / 0.01), '_', FLOOR(f.centroid_lng / 0.01)),
          center_lat = f.centroid_lat,
          center_lng = f.centroid_lng
        FROM farms f
        WHERE sc.farm_id = f.id
      `);
    });
};

exports.down = function (knex) {
  return knex.schema
    .table('satellite_cache', (table) => {
      // Drop the new columns and index
      table.dropIndex('idx_satellite_cache_grid_id');
      table.dropColumn('grid_id');
      table.dropColumn('center_lat');
      table.dropColumn('center_lng');
    });
};
