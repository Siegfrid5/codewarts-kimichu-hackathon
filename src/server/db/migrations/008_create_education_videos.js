/**
 * Migration: Create education_videos table
 * 
 * Stores farming educational videos from YouTube with categories
 * for the education library feature.
 */

exports.up = function (knex) {
  return knex.schema.createTable('education_videos', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('video_id', 50).notNullable().unique(); // YouTube video ID
    table.string('title', 500).notNullable();
    table.text('description').notNullable();
    table.string('duration', 10).notNullable(); // Format: "MM:SS"
    table.string('category', 100).notNullable();
    table.string('channel', 255).nullable(); // YouTube channel name
    table.timestamps(true, true); // created_at, updated_at
    
    // Index for faster filtering by category
    table.index('category');
    // Composite index for category + created_at for sorted filtered queries
    table.index(['category', 'created_at']);
    // Index for search functionality
    table.index('title');
    // Index for video_id lookups
    table.index('video_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('education_videos');
};
