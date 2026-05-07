/**
 * GABAYANI — Centralized Configuration
 * 
 * Reads from process.env (loaded via dotenv).
 * Validates that all required variables are present at startup.
 * Import this module instead of reading process.env directly.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  // --- Server ---
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // --- Database ---
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'gabayani',
    user: process.env.DB_USER || 'gabayani_user',
    password: process.env.DB_PASSWORD || '',
  },

  // --- Authentication ---
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiry: process.env.JWT_EXPIRY || '7d',
  },

  // --- External APIs ---
  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY || '',
  },
  gee: {
    serviceAccountEmail: process.env.GEE_SERVICE_ACCOUNT_EMAIL || '',
    privateKeyPath: process.env.GEE_PRIVATE_KEY_PATH || '',
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  semaphore: {
    apiKey: process.env.SEMAPHORE_API_KEY || '',
    senderName: process.env.SEMAPHORE_SENDER_NAME || 'GABAYANI',
  },
};

/**
 * Validate that critical environment variables are set.
 * Only DB config is required at startup — API keys are validated
 * when their respective services are first used.
 */
function validateConfig() {
  const required = [
    ['DB_HOST', config.db.host],
    ['DB_NAME', config.db.name],
    ['DB_USER', config.db.user],
    ['DB_PASSWORD', config.db.password],
  ];

  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n` +
      `   Copy .env.example to .env and fill in your values.`
    );
    process.exit(1);
  }
}

validateConfig();

module.exports = config;
