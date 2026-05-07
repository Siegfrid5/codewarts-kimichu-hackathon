/**
 * Migration: Create users table
 * 
 * Stores farmer/user accounts with authentication credentials
 * and subscription tier. Phone number is the login identifier.
 */

exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('phone', 20).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table
      .enu('subscription_tier', ['freemium', 'subscribed'], {
        useNative: true,
        enumName: 'subscription_tier_enum',
      })
      .defaultTo('freemium');
    table.timestamp('subscribed_at').nullable();
    table.timestamp('last_login_at').nullable();
    table.timestamps(true, true); // created_at, updated_at
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('users')
    .then(() => knex.raw('DROP TYPE IF EXISTS subscription_tier_enum'));
};
