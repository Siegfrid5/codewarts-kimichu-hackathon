/**
 * Manual script to drop all records from users table
 * Run with: node db/drop_users.js
 */

const db = require('../db');

async function dropAllUsers() {
  try {
    console.log('Dropping all records from users table...');
    
    const result = await db('users').del();
    
    console.log(`✅ Dropped ${result} records from users table`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error dropping users:', err.message);
    process.exit(1);
  }
}

dropAllUsers();
