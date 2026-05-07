/**
 * Migration: Create refresh_tokens table
 * 
 * Stores refresh tokens for session management.
 * Enables token rotation and revocation.
 */

exports.up = function (knex) {
  return knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('revoked_at').nullable();
    
    // Indexes for performance
    table.index('user_id');
    table.index('token_hash');
    table.index('expires_at');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('refresh_tokens');
};
