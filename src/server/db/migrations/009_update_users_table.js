/**
 * Migration: Update users table for enhanced authentication
 * 
 * Adds username, email fields for flexible login
 * Adds security fields for account lockout and password management
 * Adds indexes for performance
 */

exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    // Add username field (nullable for existing users, will be unique)
    table.string('username', 50).nullable().unique();
    
    // Add email field (nullable, will be unique)
    table.string('email', 255).nullable().unique();
    
    // Security fields for account lockout
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('account_locked_until').nullable();
    
    // Password management
    table.timestamp('password_changed_at').nullable();
    
    // Indexes for login performance
    table.index('username');
    table.index('email');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('username');
    table.dropColumn('email');
    table.dropColumn('failed_login_attempts');
    table.dropColumn('account_locked_until');
    table.dropColumn('password_changed_at');
  });
};
