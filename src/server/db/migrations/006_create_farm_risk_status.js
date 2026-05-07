/**
 * Migration: Create farm_risk_status table
 * 
 * Stores computed risk levels per farm. Recomputed after each SCT
 * weather run. This is the table that drives alert decisions.
 * 
 * Core rule: Processing layer writes here from cached data only.
 */

exports.up = function (knex) {
  // Create the shared risk_level_enum type first, then use raw SQL
  // for columns that reuse it, since Knex's existingType option
  // doesn't reliably resolve native enum names.
  return knex.raw(`
    DO $$ BEGIN
      CREATE TYPE risk_level_enum AS ENUM ('low', 'moderate', 'high');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `).then(() => {
    return knex.schema.createTable('farm_risk_status', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table
        .uuid('farm_id')
        .references('id')
        .inTable('farms')
        .onDelete('CASCADE')
        .unique();
      table.specificType('bph_risk', 'risk_level_enum').defaultTo('low');
      table.specificType('blast_risk', 'risk_level_enum').defaultTo('low');
      table.specificType('flood_risk', 'risk_level_enum').defaultTo('low');
      table.decimal('gdd_accumulated', 8, 2).defaultTo(0);
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index('farm_id', 'idx_farm_risk_status_farm_id');
    });
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('farm_risk_status')
    .then(() => knex.raw('DROP TYPE IF EXISTS risk_level_enum'));
};
