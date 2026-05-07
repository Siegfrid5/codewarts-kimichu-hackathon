/**
 * Manual script to drop all records from education_videos table
 * Run with: node db/drop_education_videos.js
 */

const db = require('../db');

async function dropAllRecords() {
  try {
    console.log('Dropping all records from education_videos table...');
    
    const result = await db('education_videos').del();
    
    console.log(`✅ Dropped ${result} records from education_videos`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error dropping records:', err.message);
    process.exit(1);
  }
}

dropAllRecords();
