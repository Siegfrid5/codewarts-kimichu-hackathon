/**
 * Manual script to add consecutive_wet_hours column to farm_risk_status table
 * Run with: node db/add_column.js
 */

const db = require('../db');

async function addColumn() {
  try {
    console.log('Adding consecutive_wet_hours column to farm_risk_status...');
    
    await db.raw(`
      ALTER TABLE farm_risk_status 
      ADD COLUMN IF NOT EXISTS consecutive_wet_hours INTEGER DEFAULT 0
    `);
    
    console.log('✅ Column added successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error adding column:', err.message);
    process.exit(1);
  }
}

addColumn();
