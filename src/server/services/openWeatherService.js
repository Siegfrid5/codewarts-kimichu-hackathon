/**
 * GABAYANI — OpenWeather API Service
 * 
 * Handles all communication with the OpenWeather API.
 * This is the ONLY module that calls OpenWeather — enforcing
 * the SCT architecture rule.
 * 
 * Called exclusively by SCT cron jobs. Never by farmer-facing routes.
 */

const config = require('../config');

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

const OpenWeatherService = {
  /**
   * Fetch current weather for a municipality using its representative coordinates.
   * Returns normalized data matching our weather_cache schema.
   * 
   * @param {number} lat - Municipality centroid latitude
   * @param {number} lng - Municipality centroid longitude
   * @param {string} municipalityName - For logging purposes
   * @returns {Object} Normalized weather data
   */
  async fetchWeather(lat, lng, municipalityName = 'unknown') {
    const apiKey = config.openWeather.apiKey;


    const url = `${BASE_URL}?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`❌ OpenWeather API error for ${municipalityName}: ${response.status} ${errorBody}`);
        return null;
      }

      const data = await response.json();
      return OpenWeatherService.normalize(data);
    } catch (err) {
      console.error(`❌ OpenWeather fetch failed for ${municipalityName}: ${err.message}`);
      return null;
    }
  },

  /**
   * Normalize raw OpenWeather API response to match our cache schema.
   * Extracts only the fields we need — no bloat stored.
   * 
   * @param {Object} raw - Raw OpenWeather API response
   * @returns {Object} Normalized data for weather_cache upsert
   */
  normalize(raw) {
    return {
      temp_c: raw.main?.temp ?? null,
      humidity_pct: raw.main?.humidity ?? null,
      rain_1h_mm: raw.rain?.['1h'] ?? 0,
      rain_24h_mm: raw.rain?.['3h'] ? raw.rain['3h'] * 8 : 0, // Approximate 24h from 3h
      wind_dir_deg: raw.wind?.deg ?? null,
      wind_speed_ms: raw.wind?.speed ?? null,
    };
  },

  /**
   * Fetch only rainfall data (micro-refresh).
   * Uses the same endpoint but we only extract rain fields.
   * 
   * @param {number} lat
   * @param {number} lng
   * @param {string} municipalityName
   * @returns {Object|null} { rain_1h_mm } or null on failure
   */
  async fetchRainfallOnly(lat, lng, municipalityName = 'unknown') {
    const full = await OpenWeatherService.fetchWeather(lat, lng, municipalityName);
    if (!full) return null;

    return {
      rain_1h_mm: full.rain_1h_mm,
    };
  },
};

module.exports = OpenWeatherService;
