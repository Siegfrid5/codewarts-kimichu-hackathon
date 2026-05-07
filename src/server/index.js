/**
 * GABAYANI — Express Application Entry Point
 * 
 * Loads configuration, connects to the database, mounts routes,
 * and starts the HTTP server.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const db = require('./db');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');
const SCTScheduler = require('./sct/scheduler');
const authRoutes = require('./routes/auth');
const farmRoutes = require('./routes/farms');
const panahonRoutes = require('./routes/panahon');
const consultantRoutes = require('./routes/consultant');
const chatbotRoutes = require('./routes/chatbot');
const educationRoutes = require('./routes/education');

const app = express();

// ------------------------------------
// Security Middleware
// ------------------------------------
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

// ------------------------------------
// Middleware
// ------------------------------------
app.use(cors());
app.use(express.json({ limit: '5mb' })); // GeoJSON polygons can be large
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ------------------------------------
// Health Check
// ------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    // Verify DB connection is alive
    await db.raw('SELECT 1');
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: 'connected',
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: 'disconnected',
      error: err.message,
    });
  }
});

// ------------------------------------
// API Routes
// ------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/panahon', panahonRoutes);
app.use('/api/consultant', consultantRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/education', educationRoutes);

// Apply API rate limiter to all API routes (except auth which has its own)
app.use('/api', apiLimiter);

// ------------------------------------
// SCT Manual Triggers (development only)
// ------------------------------------
if (config.nodeEnv === 'development') {
  app.post('/api/sct/weather-refresh', async (_req, res) => {
    const summary = await SCTScheduler.triggerWeatherRefresh();
    res.json({ success: true, summary });
  });

  app.post('/api/sct/rainfall-refresh', async (_req, res) => {
    const summary = await SCTScheduler.triggerRainfallRefresh();
    res.json({ success: true });
  });

  app.post('/api/sct/satellite-refresh', async (_req, res) => {
    const summary = await SCTScheduler.triggerSatelliteRefresh();
    res.json({ success: true, summary });
  });

  app.post('/api/sct/digest', async (_req, res) => {
    const summary = await SCTScheduler.triggerDigest();
    res.json({ success: true, summary });
  });
}

// ------------------------------------
// 404 handler for unmatched routes
// ------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found' },
  });
});

// ------------------------------------
// Global error handler (must be last)
// ------------------------------------
app.use(errorHandler);

// ------------------------------------
// Start server
// ------------------------------------
const PORT = config.port;

if (require.main === module || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
    ┌─────────────────────────────────────────┐
    │  🌾 GABAYANI Server                     │
    │  Running on http://localhost:${PORT}        │
    │  Environment: ${config.nodeEnv.padEnd(20)}  │
    │  Database: ${config.db.name}@${config.db.host}:${config.db.port}  │
    └─────────────────────────────────────────┘
    `);

    // Start SCT scheduler after server is listening
    if (!process.env.VERCEL) {
      SCTScheduler.start();
    }
  });
}

module.exports = app;
