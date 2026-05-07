/**
 * GABAYANI — Farm Routes
 * 
 * POST /api/farms/register  — Register a new farm (with polygon)
 * GET  /api/farms/my-farms   — Get farms for authenticated user
 * GET  /api/farms/:id        — Get farm details + risk status
 */

const express = require('express');
const Farm = require('../models/Farm');
const FarmRiskStatus = require('../models/FarmRiskStatus');
const SatelliteCache = require('../models/SatelliteCache');
const WeatherCache = require('../models/WeatherCache');
const DemCache = require('../models/DemCache');
const GeeService = require('../services/geeService');
const WeatherJob = require('../sct/weatherJob');
const { validate, farmRegistrationSchema } = require('../utils/validation');
const { requireAuth } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/farms/register
 * Register a new farm with polygon boundary.
 * Requires authentication.
 */
router.post('/register', requireAuth, asyncHandler(async (req, res) => {
  const { error, value } = validate(farmRegistrationSchema, req.body);
  if (error) {
    throw new AppError('Validation failed', 400, error.details.map((d) => d.message));
  }

  // Create farm linked to the authenticated user
  const farm = await Farm.create({
    user_id: req.user.id,
    farmer_name: value.farmer_name,
    phone: value.phone,
    barangay: value.barangay,
    municipality: value.municipality,
    crop: value.crop,
    dialect: value.dialect,
    polygon_geojson: value.polygon_geojson,
    centroid_lat: value.centroid_lat,
    centroid_lng: value.centroid_lng,
    area_hectares: value.area_hectares,
  });

  // Initialize risk status for the new farm
  await FarmRiskStatus.upsertByFarmId(farm.id, {
    bph_risk: 'low',
    blast_risk: 'low',
    flood_risk: 'low',
    gdd_accumulated: 0,
  });

  // Trigger one-time bootstrap asynchronously
  // We don't await this so the user gets an immediate response.
  (async () => {
    try {
      console.log(`🚀 [Bootstrap] Starting for farm ${farm.id} (${farm.farmer_name})`);
      
      // 1. Initialize GEE
      await GeeService.init();

      // 2. Fetch SRTM DEM Data
      const demData = await GeeService.getDemData(farm.centroid_lat, farm.centroid_lng);
      await Farm.updateDemData(farm.id, demData.elevation_m, demData.slope_deg);
      await DemCache.createOrReturn(farm.centroid_lat, farm.centroid_lng, demData.elevation_m, demData.slope_deg);
      console.log(`  ✅ [Bootstrap] DEM data fetched: ${demData.elevation_m.toFixed(1)}m elevation, ${demData.slope_deg.toFixed(1)}° slope`);

      // 3. Fetch Satellite Data
      if (farm.polygon_geojson) {
        const satData = await GeeService.getSatelliteData(farm.polygon_geojson);
        await SatelliteCache.upsertByLocation(farm.centroid_lat, farm.centroid_lng, {
          ndvi: satData.ndvi,
          ndwi: satData.ndwi,
          cloud_pct: satData.cloud_pct
        });
        console.log(`  ✅ [Bootstrap] Satellite data fetched: NDVI ${satData.ndvi.toFixed(2)}, Cloud ${satData.cloud_pct.toFixed(1)}%`);
      }

      // 4. Bootstrap Weather & Compute Initial Risk
      const summary = { farmsProcessed: 0, redAlerts: [], errors: [] };
      await WeatherJob.processMunicipality(farm.municipality, summary);
      console.log(`  ✅ [Bootstrap] Weather fetched & Risk computed.`);

      // TODO: Phase 3 — Send Confirmation SMS via Semaphore

    } catch (err) {
      console.error(`❌ [Bootstrap] Failed for farm ${farm.id}:`, err);
    }
  })();

  console.log(`🌾 New farm registered: ${farm.farmer_name} in ${farm.municipality} (${farm.area_hectares} ha)`);

  res.status(201).json({
    success: true,
    data: { farm },
    message: 'Farm registered. It will join the next SCT cycle.',
  });
}));

/**
 * GET /api/farms/my-farms
 * Get all farms belonging to the authenticated user.
 */
router.get('/my-farms', requireAuth, asyncHandler(async (req, res) => {
  const farms = await Farm.findByUserId(req.user.id);

  // Enrich each farm with its current risk status
  const enriched = await Promise.all(
    farms.map(async (farm) => {
      const risk = await FarmRiskStatus.findByFarmId(farm.id);
      const satellite = await SatelliteCache.findByFarmId(farm.id);
      const weather = await WeatherCache.findByMunicipality(farm.municipality);
      return {
        ...farm,
        risk_status: risk || null,
        satellite: satellite || null,
        weather: weather || null,
      };
    })
  );

  res.json({
    success: true,
    data: { farms: enriched },
  });
}));

/**
 * GET /api/farms/:id
 * Get full farm details including risk status, weather, and satellite data.
 */
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) {
    throw new AppError('Farm not found', 404);
  }

  // Verify ownership
  if (farm.user_id !== req.user.id) {
    throw new AppError('Not authorized to view this farm', 403);
  }

  const risk = await FarmRiskStatus.findByFarmId(farm.id);
  const satellite = await SatelliteCache.findByFarmId(farm.id);
  const weather = await WeatherCache.findByMunicipality(farm.municipality);

  res.json({
    success: true,
    data: {
      farm,
      risk_status: risk || null,
      satellite: satellite || null,
      weather: weather || null,
    },
  });
}));

module.exports = router;
