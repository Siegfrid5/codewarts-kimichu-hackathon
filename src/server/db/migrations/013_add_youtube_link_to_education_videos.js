/**
 * Migration: Add youtube_link column to education_videos table
 * 
 * Adds a youtube_link column for proper thumbnail and video URL access.
 */

exports.up = function (knex) {
  return knex.schema.alterTable('education_videos', (table) => {
    table.string('youtube_link', 255).nullable(); // Full YouTube URL
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('education_videos', (table) => {
    table.dropColumn('youtube_link');
  });
};
