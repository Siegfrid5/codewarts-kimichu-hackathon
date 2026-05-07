# Rye's Log (Database & API Architecture)

## Date: 2026-05-07

### Tasks Completed
- **PostgreSQL Schema:** Designed and deployed the entire relational database using Knex.js migrations. Successfully created the `users`, `farms`, `weather_cache`, `satellite_cache`, `farm_risk_status`, `dem_cache`, and `alert_log` tables.
- **GeoJSON Storage:** Configured the `farms` table to securely store Google Maps polygons natively as `JSONB` data.
- **Cache TTL Enforcement:** Built the time-to-live logic inside the cache models. Weather data is rejected if older than 3 hours, and satellite data is skipped if older than 5 days.
- **SRTM DEM Integration:** Set up the architecture for the Google Earth Engine service to extract 30m resolution Elevation and Slope data at the exact moment a farm is registered.
- **Auth Data Layer:** Implemented `bcrypt` password hashing for the `users` table and set up the schema for subscription tier tracking (`freemium` vs `subscribed`).

### Issues Encountered
- **Haversine Math in DB vs Server:** Deciding where to calculate the distance between farms for the BPH spread index.
  - *Fix:* Implemented the Haversine formula as raw SQL inside the `Farm.findFarmsWithinRadius()` model so the database handles the heavy lifting, preventing massive data loads into the Node.js memory space.

### Notes
- Database architecture is fully stabilized. All migrations run smoothly via `npm run db:migrate`.
