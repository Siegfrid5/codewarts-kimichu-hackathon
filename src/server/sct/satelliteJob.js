/**
 * GABAYANI — SCT Satellite Job
 * 
 * Runs every 5 days to refresh satellite data from Sentinel-2.
 * 
 * Pipeline:
 *   1. Get all distinct grid cells from satellite_cache
 *   2. For each grid cell, get representative farm polygon
 *   3. Call GEE to fetch NDVI/NDWI for that location
 *   4. Upsert satellite_cache with new data
 *   5. Mark as invalid if cloud cover > 40%
 * 
 * This is the ONLY path where GEE gets called for satellite data.
 */

const Farm = require('../models/Farm');
const SatelliteCache = require('../models/SatelliteCache');
const GeeService = require('../services/geeService');
const { SATELLITE_CLOUD_COVER_MAX } = require('../constants/thresholds');

const SatelliteJob = {
  /**
   * Execute a full satellite refresh cycle.
   * Called by SCT scheduler every 5 days.
   * 
   * @returns {Object} Summary of the run
   */
  async runFullRefresh() {
    const startTime = Date.now();
    console.log('🛰️  [SCT] Starting satellite refresh...');

    const summary = {
      gridCells: 0,
      farmsProcessed: 0,
      validImages: 0,
      invalidImages: 0,
      errors: [],
    };

    try {
      // Step 1: Get all farms to determine grid cells
      const farms = await Farm.getAll();
      if (farms.length === 0) {
        console.log('🛰️  [SCT] No farms registered. Skipping satellite refresh.');
        return summary;
      }

      // Group farms by grid cell (using the same grid system as SatelliteCache)
      const gridMap = new Map();
      for (const farm of farms) {
        if (!farm.polygon_geojson || !farm.centroid_lat || !farm.centroid_lng) continue;

        const gridId = SatelliteCache.coordsToGrid(farm.centroid_lat, farm.centroid_lng);
        if (!gridMap.has(gridId)) {
          gridMap.set(gridId, []);
        }
        gridMap.get(gridId).push(farm);
      }

      summary.gridCells = gridMap.size;
      console.log(`🛰️  [SCT] Processing ${gridMap.size} grid cells...`);

      // Step 2: Process each grid cell
      for (const [gridId, gridFarms] of gridMap) {
        try {
          await SatelliteJob.processGridCell(gridId, gridFarms, summary);
        } catch (err) {
          console.error(`❌ [SCT] Error processing grid ${gridId}: ${err.message}`);
          summary.errors.push({ gridId, error: err.message });
        }
      }
    } catch (err) {
      console.error(`❌ [SCT] Fatal error in satellite refresh: ${err.message}`);
      summary.errors.push({ gridId: 'GLOBAL', error: err.message });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `🛰️  [SCT] Satellite refresh complete in ${elapsed}s. ` +
      `${summary.gridCells} grid cells, ${summary.farmsProcessed} farms, ` +
      `${summary.validImages} valid, ${summary.invalidImages} invalid (cloudy).`
    );

    return summary;
  },

  /**
   * Process a single grid cell:
   *   - Get representative farm polygon
   *   - Fetch satellite data from GEE
   *   - Update cache for all farms in this grid
   */
  async processGridCell(gridId, gridFarms, summary) {
    // Use first farm with valid polygon as representative
    const repFarm = gridFarms.find((f) => f.polygon_geojson);
    if (!repFarm) {
      console.warn(`⚠️  [SCT] No farm with polygon in grid ${gridId}. Skipping.`);
      return;
    }

    // Fetch satellite data from GEE
    const satData = await GeeService.getSatelliteData(repFarm.polygon_geojson);

    if (!satData) {
      console.warn(`⚠️  [SCT] No satellite data returned for grid ${gridId}.`);
      return;
    }

    // Determine validity based on cloud cover
    const isValid = (satData.cloud_pct || 0) <= SATELLITE_CLOUD_COVER_MAX;

    // Upsert satellite cache for this grid cell
    const repLat = repFarm.centroid_lat;
    const repLng = repFarm.centroid_lng;

    await SatelliteCache.upsertByLocation(repLat, repLng, {
      ndvi: satData.ndvi,
      ndwi: satData.ndwi,
      cloud_pct: satData.cloud_pct
    });

    summary.farmsProcessed += gridFarms.length;
    if (isValid) {
      summary.validImages++;
      console.log(`  ✅ Grid ${gridId}: NDVI ${satData.ndvi.toFixed(2)}, NDWI ${satData.ndwi.toFixed(2)}, Cloud ${satData.cloud_pct.toFixed(1)}%`);
    } else {
      summary.invalidImages++;
      console.log(`  ⚠️  Grid ${gridId}: Cloudy (${satData.cloud_pct.toFixed(1)}%), marked as invalid`);
    }
  },

  /**
   * Manually trigger a satellite refresh (for testing/debugging).
   * @returns {Object} Run summary
   */
  async triggerRefresh() {
    console.log('🛰️  [SCT] Manual satellite refresh triggered');
    return SatelliteJob.runFullRefresh();
  },
};

module.exports = SatelliteJob;
