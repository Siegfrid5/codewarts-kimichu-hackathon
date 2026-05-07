/**
 * GABAYANI — Database Connection Singleton
 * 
 * Creates a single Knex instance for the application.
 * All models and services import this module to access the DB.
 * 
 * Usage:
 *   const db = require('./db');
 *   const rows = await db('users').where({ phone: '09171234567' });
 */

const knex = require('knex');
const knexConfig = require('./knexfile');

const environment = process.env.NODE_ENV || 'development';
const connectionConfig = knexConfig[environment];

if (!connectionConfig) {
  console.error(`❌ No Knex configuration found for environment: ${environment}`);
  process.exit(1);
}

const db = knex(connectionConfig);

// Test connection on import (non-blocking)
db.raw('SELECT 1')
  .then(() => {
    console.log(`✅ Database connected (${environment}): ${connectionConfig.connection.database}@${connectionConfig.connection.host}`);
  })
  .catch((err) => {
    console.error(`❌ Database connection failed: ${err.message}`);
    console.error('   Make sure PostgreSQL is running. Try: docker compose up -d');
  });

module.exports = db;
