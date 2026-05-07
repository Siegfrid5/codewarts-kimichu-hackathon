const path = require('path');
const config = require('../config');

// Shared connection logic to handle local vs Supabase (DATABASE_URL)
const getConnection = () => {
  if (config.db.connectionString) {
    // If using Supabase / production URL, SSL is required
    return {
      connectionString: config.db.connectionString,
      ssl: { rejectUnauthorized: false }
    };
  }
  
  // Local development
  return {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  };
};

module.exports = {
  development: {
    client: 'pg',
    connection: getConnection(),
    migrations: {
      directory: path.join(__dirname, 'migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'seeds')
    }
  },

  production: {
    client: 'pg',
    connection: getConnection(),
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.join(__dirname, 'migrations')
    }
  }
};
