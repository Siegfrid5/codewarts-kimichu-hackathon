/**
 * GABAYANI — Google Earth Engine Service
 * 
 * Handles authentication and querying of GEE for:
 * 1. SRTM DEM (Elevation and Slope)
 * 2. Sentinel-2 (NDVI, NDWI, Cloud Cover)
 */

const ee = require('@google/earthengine');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let isInitialized = false;

const GeeService = {
  /**
   * Initialize the GEE client using the service account key.
   */
  async init() {
    if (isInitialized) return true;

    const keyPath = path.resolve(__dirname, '../../', config.gee.privateKeyPath || 'config/gee-service-account-key.json');
    
    if (!fs.existsSync(keyPath)) {
      console.warn('⚠️  GEE Service Account key not found. GEE calls will use MOCK data.');
      return false;
    }

    try {
      const privateKey = require(keyPath);
      
      return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
          privateKey,
          () => {
            ee.initialize(
              null, null,
              () => {
                console.log('🌍 [GEE] Google Earth Engine initialized successfully.');
                isInitialized = true;
                resolve(true);
              },
              (err) => {
                console.error('❌ [GEE] Initialization error:', err);
                resolve(false);
              }
            );
          },
          (err) => {
            console.error('❌ [GEE] Authentication error:', err);
            resolve(false);
          }
        );
      });
    } catch (err) {
      console.error('❌ [GEE] Failed to load key file:', err.message);
      return false;
    }
  },

  /**
   * Get DEM data (Elevation and Slope) for a specific centroid.
   * Uses USGS/SRTMGL1_003.
   * 
   * @param {number} lat 
   * @param {number} lng 
   * @returns {Object} { elevation_m, slope_deg }
   */
  async getDemData(lat, lng) {
    if (!isInitialized) {
      // Mock Data Fallback
      return { elevation_m: 15.5, slope_deg: 2.1 };
    }

    return new Promise((resolve, reject) => {
      try {
        const point = ee.Geometry.Point([lng, lat]);
        const srtm = ee.Image('USGS/SRTMGL1_003');
        const elevation = srtm.select('elevation');
        const slope = ee.Terrain.slope(elevation);
        
        // Combine bands and reduce at the point
        const combined = elevation.addBands(slope);
        const dict = combined.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: point,
          scale: 30,
          maxPixels: 1e9
        });

        dict.evaluate((result, err) => {
          if (err) return reject(err);
          resolve({
            elevation_m: result.elevation || 0,
            slope_deg: result.slope || 0
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Get Satellite Data (NDVI, NDWI, Cloud Cover) for a farm polygon.
   * Uses COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 Surface Reflectance).
   * 
   * @param {Object} geoJsonPolygon - GeoJSON Polygon object
   * @returns {Object} { ndvi, ndwi, cloud_pct, valid_date }
   */
  async getSatelliteData(geoJsonPolygon) {
    if (!isInitialized) {
      // Mock Data Fallback (Simulates a clear, vegetated, wet farm)
      return { ndvi: 0.65, ndwi: 0.25, cloud_pct: 10, valid_date: new Date().toISOString() };
    }

    return new Promise((resolve, reject) => {
      try {
        // Convert GeoJSON to EE Geometry
        const coords = geoJsonPolygon.coordinates;
        const polygon = ee.Geometry.Polygon(coords);

        // Get recent images (last 30 days)
        const end = ee.Date(Date.now());
        const start = end.advance(-30, 'day');

        const collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(polygon)
          .filterDate(start, end)
          .sort('CLOUDY_PIXEL_PERCENTAGE'); // Get the least cloudy first

        // Get the best image
        const bestImage = collection.first();

        // Calculate NDVI: (NIR - RED) / (NIR + RED) -> (B8 - B4) / (B8 + B4)
        const ndvi = bestImage.normalizedDifference(['B8', 'B4']).rename('ndvi');
        
        // Calculate NDWI: (GREEN - NIR) / (GREEN + NIR) -> (B3 - B8) / (B3 + B8)
        const ndwi = bestImage.normalizedDifference(['B3', 'B8']).rename('ndwi');

        // Extract cloud cover percentage property
        const cloudPct = bestImage.get('CLOUDY_PIXEL_PERCENTAGE');
        const systemTimeStart = bestImage.get('system:time_start');

        // Combine bands for extraction
        const combined = ndvi.addBands(ndwi);

        const dict = combined.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: polygon,
          scale: 10,
          maxPixels: 1e9
        });

        // Evaluate all values asynchronously
        ee.Dictionary({
          stats: dict,
          cloudPct: cloudPct,
          timestamp: systemTimeStart
        }).evaluate((result, err) => {
          if (err) return reject(err);

          const date = new Date(result.timestamp);
          resolve({
            ndvi: result.stats.ndvi || 0,
            ndwi: result.stats.ndwi || 0,
            cloud_pct: result.cloudPct || 0,
            valid_date: date.toISOString()
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }
};

module.exports = GeeService;
