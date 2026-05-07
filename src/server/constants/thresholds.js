/**
 * GABAYANI — Biological & Meteorological Threshold Constants
 * 
 * All named constants from the architecture document.
 * These are the ONLY source of truth for risk computation thresholds.
 * Never use magic numbers in processing logic — reference these constants.
 * 
 * Sources: PhilRice / IRRI (BPH, Blast), PAGASA (Flood, Landslide)
 */

// ================================================
// Brown Planthopper (Nilaparvata lugens)
// Source: PhilRice / IRRI
// ================================================

/** Base development temperature for BPH (°C) */
const BPH_T_BASE = 10.0;

/** Accumulated GDD threshold for egg hatch */
const BPH_HATCH_GDD = 150.0;

/** Minimum NDVI (canopy density) to sustain BPH outbreak */
const BPH_NDVI_MIN = 0.55;

/** Minimum NDWI (leaf moisture) for BPH breeding */
const BPH_NDWI_MIN = 0.20;

/** Radius (km) for BPH spread proximity query */
const BPH_SPREAD_RADIUS_KM = 5.0;

/** Wind direction tolerance (degrees) for downwind farm detection */
const BPH_WIND_TOLERANCE_DEG = 45;

/** GDD percentage threshold for "approaching" warning (moderate risk) */
const BPH_GDD_APPROACH_RATIO = 0.7;


// ================================================
// Rice Blast (Magnaporthe oryzae)
// Source: PhilRice / IRRI
// ================================================

/** Minimum temperature for optimal Blast infection (°C) */
const BLAST_TEMP_MIN = 17.0;

/** Maximum temperature for optimal Blast infection (°C) */
const BLAST_TEMP_MAX = 28.0;

/** Relative humidity threshold for Blast (%) */
const BLAST_HUMIDITY_MIN = 90;

/** Consecutive high-humidity hours needed for Blast infection */
const BLAST_WETNESS_HOURS = 10;


// ================================================
// Flood Trigger
// Source: PAGASA thresholds
// ================================================

/** Heavy rainfall threshold — 1hr accumulation (mm) */
const FLOOD_RAIN_1H_THRESHOLD = 15;

/** Flash flood advisory threshold — 24hr accumulation (mm) */
const FLOOD_RAIN_24H_THRESHOLD = 75;

/** Maximum elevation (m) for flood vulnerability */
const FLOOD_ELEVATION_MAX = 10;


// ================================================
// Landslide Trigger
// Source: PAGASA thresholds + SRTM DEM
// ================================================

/** Rainfall threshold for landslide risk — 24hr accumulation (mm) */
const LANDSLIDE_RAIN_24H_THRESHOLD = 75;

/** Minimum slope (degrees) for landslide vulnerability */
const LANDSLIDE_SLOPE_MIN = 18;


// ================================================
// Cache TTLs (Time-to-Live)
// ================================================

/** Weather cache maximum age in hours before considered stale */
const WEATHER_CACHE_TTL_HOURS = 3;

/** Satellite cache refresh interval in days */
const SATELLITE_CACHE_TTL_DAYS = 5;

/** Cloud cover percentage above which satellite data is invalid */
const SATELLITE_CLOUD_COVER_MAX = 40;


// ================================================
// SMS & Scheduling
// ================================================

/** Stagger gap between municipalities in digest push (minutes) */
const DIGEST_STAGGER_MINUTES = 2;

/** Maximum SMS character length (standard SMS) */
const SMS_MAX_CHARS = 160;


module.exports = {
  // BPH
  BPH_T_BASE,
  BPH_HATCH_GDD,
  BPH_NDVI_MIN,
  BPH_NDWI_MIN,
  BPH_SPREAD_RADIUS_KM,
  BPH_WIND_TOLERANCE_DEG,
  BPH_GDD_APPROACH_RATIO,

  // Blast
  BLAST_TEMP_MIN,
  BLAST_TEMP_MAX,
  BLAST_HUMIDITY_MIN,
  BLAST_WETNESS_HOURS,

  // Flood
  FLOOD_RAIN_1H_THRESHOLD,
  FLOOD_RAIN_24H_THRESHOLD,
  FLOOD_ELEVATION_MAX,

  // Landslide
  LANDSLIDE_RAIN_24H_THRESHOLD,
  LANDSLIDE_SLOPE_MIN,

  // Cache
  WEATHER_CACHE_TTL_HOURS,
  SATELLITE_CACHE_TTL_DAYS,
  SATELLITE_CLOUD_COVER_MAX,

  // SMS
  DIGEST_STAGGER_MINUTES,
  SMS_MAX_CHARS,
};
