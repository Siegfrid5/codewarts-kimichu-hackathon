# Nat's Log (Data & Backend Core)

## Date: 2026-05-07

### Tasks Completed
- **SCT Scheduler:** Implemented the `node-cron` logic in `src/server/sct/scheduler.js` to execute the 4 critical Strategic Call Timing windows (04:30, 12:00, 15:00, 21:00) and the hourly rainfall micro-refresh.
- **OpenWeather Integration:** Built the `openWeatherService.js` to fetch and parse temperature, humidity, and rainfall data.
- **Biological Thresholds:** Translated the biological models into code (`src/server/constants/thresholds.js`), establishing the math for BPH base temperatures and Rice Blast humidity thresholds.
- **BPH Pest Spread Index:** Wrote the `bphSpreadJob.js` logic. It identifies farms within 5km of an outbreak and calculates the wind vector using the Haversine formula to increase risk levels for downwind farms.
- **Risk Engine:** Engineered the pure-function `riskEngine.js` module that processes Growing Degree Days (GDD) and multi-factor biological risks (NDVI + Weather).

### Issues Encountered
- **API Call Limits:** Running an API call per farm would hit OpenWeather rate limits immediately.
  - *Fix:* Cooperated with Rye (DB Architect) to group farms by Municipality. Now, we fetch weather data once per municipality centroid and map it to all farms in that area, drastically cutting down API costs.

### Notes
- The core ingestion engine is robust. No external API calls are made when farmers request data; everything strictly reads from the cache we populate.
