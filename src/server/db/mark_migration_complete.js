/**
 * Manual script to mark migration 012 as completed
 * Run with: node db/mark_migration_complete.js
 */

const db = require('../db');

async function markMigrationComplete() {
  try {
    console.log('Marking migration 012 as completed...');
    
    // Check if migration already exists
    const existing = await db('knex_migrations').where({ name: '012_add_consecutive_wet_hours.js' }).first();
    
    if (existing) {
      console.log('Migration 012 already marked as completed');
    } else {
      await db('knex_migrations').insert({
        name: '012_add_consecutive_wet_hours.js',
        batch: 1,
        migration_time: new Date()
      });
      console.log('✅ Migration 012 marked as completed');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error marking migration:', err.message);
    process.exit(1);
  }
}

markMigrationComplete();
