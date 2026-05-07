/**
 * GABAYANI — Geospatial Utility Functions
 * 
 * Pure math functions for geographic calculations.
 * No external API calls — these operate on stored coordinates only.
 */

/**
 * Compute the Haversine distance between two points in km.
 * @param {number} lat1 - Point 1 latitude (degrees)
 * @param {number} lng1 - Point 1 longitude (degrees)
 * @param {number} lat2 - Point 2 latitude (degrees)
 * @param {number} lng2 - Point 2 longitude (degrees)
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Compute the bearing from point 1 to point 2.
 * @returns {number} Bearing in degrees (0-360, clockwise from north)
 */
function computeBearing(lat1, lng1, lat2, lng2) {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Check if a farm is roughly downwind of a source.
 * Wind direction is where wind blows FROM.
 * Downwind = direction wind blows TO = (windDir + 180) % 360
 * 
 * @param {number} windDirDeg - Wind direction (degrees, FROM)
 * @param {number} bearingToFarm - Bearing from source to target farm
 * @param {number} toleranceDeg - Angular tolerance (default 45°)
 * @returns {boolean}
 */
function isDownwind(windDirDeg, bearingToFarm, toleranceDeg = 45) {
  const downwindBearing = (windDirDeg + 180) % 360;
  let diff = Math.abs(bearingToFarm - downwindBearing);
  if (diff > 180) diff = 360 - diff;
  return diff <= toleranceDeg;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

module.exports = {
  haversineDistance,
  computeBearing,
  isDownwind,
};
