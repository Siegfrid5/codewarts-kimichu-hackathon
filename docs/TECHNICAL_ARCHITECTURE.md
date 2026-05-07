# GABAYANI — Technical Architecture Deep Dive

> For developers. This document explains *why* the system is designed the way it is — not just *what* it does.

---

## 1. The Core Invariant

```
Every farmer-facing service reads from the DB cache only.
Only SCT cron jobs call external APIs.
```

This is the single most important rule in the entire system. Every design decision flows from it. If you ever find yourself writing code where a farmer's action triggers an external API call, you are violating the architecture. Stop. Refactor.

**Why this matters:**
- **Cost predictability.** API costs scale with *municipalities*, not *farmers*. Adding 1,000 farmers to an existing municipality costs exactly $0 in additional API calls.
- **Response time guarantee.** PANAHON (on-demand query) targets < 5 seconds. This is only possible because it's a DB read → template render → Gemini translate → SMS dispatch pipeline. No network round-trips to weather or satellite APIs.
- **Fault isolation.** If OpenWeather goes down, farmers still get responses — they just get slightly staler data. The system degrades gracefully instead of failing completely.

---

## 2. SCT — Strategic Call Timing (The "Why")

### 2.1 Why Four Weather Windows?

The schedule `04:30, 12:00, 15:00, 21:00` is not arbitrary:

| Window | Rationale |
|--------|-----------|
| **04:30** | Feeds the **5:00 AM digest** with the freshest possible data. The 30-minute gap gives the processing layer time to recompute risk statuses before the digest scheduler fires. |
| **12:00** | Captures the **midday temperature peak** — critical for GDD (Growing Degree Days) accumulation accuracy. BPH hatch predictions depend on daily max temperature. |
| **15:00** | Captures the **afternoon humidity shift** — relevant for Rice Blast risk, which requires sustained high humidity. Also catches afternoon rainfall events before the evening digest. |
| **21:00** | Captures **nighttime conditions** — many fungal infections (Blast) progress during cooler, humid nights. This reading also resets the 24hr rainfall accumulator for the next day's flood calculations. |

### 2.2 Why Hourly Rainfall Micro-Refresh?

The flood trigger requires `rain.1h > 15mm` OR `rain_24h > 75mm`. A 3-hour gap between SCT weather runs means we could miss a burst of heavy rainfall that lasts only 30 minutes. The hourly micro-refresh addresses this:

```
Timeline:
04:30 ─── 05:30 ─── 06:30 ─── ... ─── 12:00
  ↑         ↑         ↑                  ↑
  Full      rain.1h   rain.1h            Full
  SCT       only      only               SCT
```

The micro-refresh only pulls `rain.1h` — it does NOT re-fetch the full weather payload. This is a lightweight call specifically to maintain sub-3hr resolution on rainfall data, which is the minimum acceptable granularity for flood trigger accuracy.

### 2.3 Municipal Grouping — The Cost Multiplier

```
Without grouping:  80 farms × 4 runs/day = 320 OpenWeather calls/day
With grouping:      3 municipalities × 4 runs/day = 12 calls/day
                    + 3 municipalities × 24 micro-refreshes = 72 calls/day
                    = 84 total calls/day (74% reduction)
```

**Implementation detail:** The grouping key is the `municipality` column in the `farms` table. When a new farm registers, it inherits the existing municipality's weather cache — no new API call unless it's a *new* municipality entirely.

```sql
-- Pseudo-query: get distinct municipalities for SCT batch
SELECT DISTINCT municipality
FROM farms
WHERE municipality NOT IN (
  SELECT municipality_id FROM weather_cache
  WHERE fetched_at > NOW() - INTERVAL '3 hours'
);
```

Only municipalities with stale or missing cache entries get refreshed. If a municipality's data is still fresh (e.g., updated by a micro-refresh), the full SCT run skips it.

---

## 3. Satellite Data Strategy (GEE/Sentinel-2)

### 3.1 Why Polygon-Based Zonal Statistics?

Most agricultural monitoring systems sample a single GPS coordinate — the farm's centroid. GABAYANI uses the **full polygon boundary** submitted during registration to compute **zonal statistics** (mean NDVI and NDWI across the entire farm area).

**Why this matters:**
- A single-point sample can hit a road, a pond, or a tree — producing a misleading reading.
- Irregularly shaped farms (common in Philippine lowland agriculture) may have varied conditions across the plot.
- Zonal mean over the polygon smooths out noise and gives a representative reading of actual crop health.

**GEE batch strategy:**

```javascript
// Pseudo-code: single GEE batch covering all farms
var farms = ee.FeatureCollection(allFarmPolygons);

var sentinel = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40));

var composite = sentinel.median();

var ndvi = composite.normalizedDifference(['B8', 'B4']).rename('ndvi');
var ndwi = composite.normalizedDifference(['B3', 'B8']).rename('ndwi');

var results = ndvi.addBands(ndwi).reduceRegions({
  collection: farms,
  reducer: ee.Reducer.mean(),
  scale: 10  // Sentinel-2 native resolution
});
```

One GEE job, one API call, all farms processed. The output is a FeatureCollection with per-farm NDVI/NDWI means.

### 3.2 The 40% Cloud Cover Rule

```
IF scene.CLOUDY_PIXEL_PERCENTAGE > 40%:
    satellite_cache.is_valid = FALSE
    satellite_cache.fetched_at = NOW()  // we DID check, just nothing useful
    // satellite_cache.last_valid_at remains unchanged
    → Use last_valid_at in farmer messages: "Last satellite: X days ago"
```

**Why 40%?** This is a widely used threshold in remote sensing for tropical regions. Below 40%, the median composite across available clear pixels still produces usable NDVI/NDWI values. Above 40%, the cloud shadow contamination introduces too much noise for reliable crop health assessment.

**Critical behavior:** When satellite data is stale, the system does NOT go silent. It sends a **degraded-mode message**:

```
"GABAYANI 5AM: Weather data updated. Satellite imagery
unavailable (cloudy). BPH risk remains MODERATE based
on last reading (3 days ago). Monitor manually today."
```

> **Design principle:** Silence from the system is the worst outcome. Always send something.

---

## 4. Processing Layer — Threshold Logic Deep Dive

The processing layer is a **pure function of cached data**. It reads from `weather_cache`, `satellite_cache`, and `dem_cache`, and writes to `farm_risk_status`. No external API calls. No side effects beyond the DB write.

### 4.1 BPH (Brown Planthopper) Risk Assessment

BPH risk uses a multi-factor model grounded in PhilRice/IRRI research:

```python
# Named constants — never use magic numbers in risk logic
BPH_T_BASE    = 10.0   # °C — base development temperature
BPH_HATCH_GDD = 150.0  # GDD threshold for egg hatch
BPH_NDVI_MIN  = 0.55   # Minimum canopy density for outbreak
BPH_NDWI_MIN  = 0.20   # Minimum leaf moisture for breeding

def compute_bph_risk(farm, weather, satellite):
    # Step 1: GDD accumulation (daily)
    daily_gdd = max(0, weather.temp_c - BPH_T_BASE)
    farm.gdd_accumulated += daily_gdd

    # Step 2: Multi-factor risk assessment
    gdd_ready   = farm.gdd_accumulated >= BPH_HATCH_GDD
    canopy_ok   = satellite.ndvi >= BPH_NDVI_MIN if satellite.is_valid else None
    moisture_ok = satellite.ndwi >= BPH_NDWI_MIN if satellite.is_valid else None

    if gdd_ready and canopy_ok and moisture_ok:
        return 'high'     # All conditions met → RED ALERT trigger
    elif gdd_ready and (canopy_ok is None or moisture_ok is None):
        return 'moderate' # GDD threshold met but satellite stale → warn
    elif farm.gdd_accumulated >= BPH_HATCH_GDD * 0.7:
        return 'moderate' # Approaching threshold
    else:
        return 'low'
```

**Why GDD?** Brown Planthopper egg development is temperature-dependent. The insect doesn't hatch on a calendar schedule — it hatches when enough thermal energy has accumulated. GDD (Growing Degree Days) tracks this by summing `max(0, daily_temp - base_temp)` over time. When the sum hits ~150, eggs are ready to hatch.

**Why NDVI + NDWI?** Even if GDD is sufficient, BPH outbreaks require dense canopy (NDVI ≥ 0.55) for shelter and moist leaves (NDWI ≥ 0.20) for feeding. Sparse or dry fields suppress outbreaks regardless of temperature.

### 4.2 Rice Blast Risk Assessment

```python
BLAST_TEMP_MIN      = 17.0   # °C — infection range lower bound
BLAST_TEMP_MAX      = 28.0   # °C — infection range upper bound
BLAST_HUMIDITY_MIN  = 90     # %RH threshold
BLAST_WETNESS_HOURS = 10     # Consecutive high-humidity hours needed

def compute_blast_risk(weather, humidity_log):
    temp_in_range = BLAST_TEMP_MIN <= weather.temp_c <= BLAST_TEMP_MAX
    humid_enough  = weather.humidity_pct >= BLAST_HUMIDITY_MIN

    # Count consecutive hours above 90% RH from humidity log
    consecutive_wet = count_consecutive_above(humidity_log, BLAST_HUMIDITY_MIN)

    if temp_in_range and consecutive_wet >= BLAST_WETNESS_HOURS:
        return 'high'     # RED ALERT trigger
    elif temp_in_range and humid_enough:
        return 'moderate' # Conditions favorable but duration not met
    else:
        return 'low'
```

**Why consecutive hours?** Rice Blast (Magnaporthe oryzae) requires prolonged leaf wetness to establish infection. A brief humid spike doesn't cause disease — the fungal spores need sustained moisture contact. The 10-hour threshold comes from IRRI field studies on tropical lowland rice.

**Implementation note:** The `humidity_log` must track hourly readings. The 4 daily SCT weather runs plus hourly micro-refreshes give us enough data points. Between readings, humidity is interpolated linearly.

### 4.3 Flood & Landslide Triggers

```python
def compute_flood_risk(weather, farm):
    """Uses PAGASA thresholds for heavy rainfall + SRTM DEM elevation."""
    rainfall_heavy = weather.rain_1h_mm > 15    # PAGASA "heavy rainfall"
    rainfall_flood = weather.rain_24h_mm > 75   # PAGASA flash flood advisory
    low_elevation  = farm.elevation_m < 10      # From DEM cache (static)

    if (rainfall_heavy or rainfall_flood) and low_elevation:
        return 'high'  # RED ALERT
    elif rainfall_heavy or rainfall_flood:
        return 'moderate'
    else:
        return 'low'

def compute_landslide_risk(weather, farm):
    """Uses PAGASA thresholds + SRTM DEM slope."""
    rainfall_flood = weather.rain_24h_mm > 75
    steep_slope    = farm.slope_deg > 18  # From DEM cache (static)

    if rainfall_flood and steep_slope:
        return 'high'  # RED ALERT
    else:
        return 'low'
```

**DEM data is static.** Elevation and slope don't change. They are fetched exactly once at farm registration from SRTM (30m resolution) and stored permanently in `dem_cache`. The processing layer reads them from the DB — never re-queries the DEM API.

### 4.4 BPH Spread Index (Geospatial Proximity + Wind Vector)

This is the most complex processing rule. When a farm triggers a BPH Red Alert, the system checks for nearby farms that may be at risk from wind-assisted BPH migration.

```python
BPH_SPREAD_RADIUS_KM = 5.0

def compute_bph_spread(alert_farm, all_farms, weather):
    """
    When farm_X triggers BPH Red Alert:
    1. Find all farms within 5km radius (Haversine on centroids)
    2. Check wind direction from weather_cache
    3. Farms DOWNWIND → elevate threat by one tier
    """
    wind_dir = weather.wind_dir_deg  # Direction wind is blowing FROM
    # BPH travels WITH the wind → vulnerable farms are DOWNWIND
    # i.e., in the direction the wind is blowing TO
    downwind_bearing = (wind_dir + 180) % 360

    nearby = find_farms_within_radius(
        center=alert_farm.centroid,
        radius_km=BPH_SPREAD_RADIUS_KM,
        all_farms=all_farms
    )

    for farm in nearby:
        bearing_to_farm = compute_bearing(
            alert_farm.centroid, farm.centroid
        )
        # Is this farm roughly downwind? (±45° tolerance)
        if abs(bearing_to_farm - downwind_bearing) <= 45:
            elevate_risk(farm, by_one_tier=True)
            append_to_next_sms(farm,
                "Nearby farm reported BPH. Monitor closely."
            )
```

**Key insight:** This entire operation uses only data already in the database — farm centroids from the `farms` table and wind direction from `weather_cache`. Zero additional API calls. The Haversine distance calculation and bearing computation are pure math operations.

---

## 5. Geofencing & Polygon Strategy

### 5.1 What We Store

| Data | Storage | Used For |
|------|---------|----------|
| **Full polygon** (GeoJSON) | `farms.polygon_geojson` (JSONB) | GEE zonal statistics, web dashboard map overlay |
| **Centroid** (lat/lng) | `farms.centroid_lat`, `farms.centroid_lng` | OpenWeather municipal grouping, BPH spread proximity query, DEM lookup |
| **Area** (hectares) | `farms.area_hectares` | Farm profile, chatbot context |

### 5.2 Why Separate Centroid from Polygon?

The polygon is the source of truth. The centroid is a **derived, denormalized field** stored for query performance:

- **Proximity queries** (BPH spread index) need fast distance calculations between farm pairs. Computing centroids from polygons on every query is expensive. Pre-computed centroids enable simple Haversine comparisons.
- **OpenWeather grouping** uses municipality, but within a municipality, the centroid confirms which farms share the same weather cell.
- **DEM lookup** uses a single coordinate — the centroid is the representative point.

### 5.3 Polygon Capture Flow (Client-Side)

```
Google Maps → Drawing Manager (polygon mode) → Satellite base layer
                                ↓
                    farmer draws farm boundary
                                ↓
                    polygoncomplete event fires
                                ↓
                    Extract vertices: polygon.getPath().getArray()
                    Compute area: google.maps.geometry.spherical.computeArea()
                    Compute centroid: average of vertex coordinates
                                ↓
                    Package as GeoJSON + centroid + area
                                ↓
                    Submit with registration form
```

**Satellite base layer** is critical — farmers identify their fields visually from the aerial view. The standard road map is useless for farm boundary tracing.

---

## 6. AI Strategy — Gemini Model Selection

### 6.1 Gemini 1.5 Flash — Translation Mode

**Use case:** Convert finished English SMS templates into farmer's registered dialect.

**Why Flash, not Pro?**
- Translation is a **stateless, single-turn task**. The input is a complete English string; the output is the same string in another language.
- No reasoning required — no data interpretation, no recommendation generation.
- Flash's lower latency and cost make it ideal for high-volume translation (every outgoing SMS passes through it).
- The prompt is engineered to **prevent hallucination**: "Do not add or remove any information. Translate only."

**Safety design:** Gemini never sees raw sensor data in translation mode. It receives a pre-built, factually correct English string from the template engine. The template engine is deterministic — it uses `if/else` logic on `farm_risk_status` values. Gemini's only job is linguistic conversion.

### 6.2 Gemini 1.5 Pro — Consultant Chatbot

**Use case:** Interactive, context-aware farm advisory via the web app.

**Why Pro, not Flash?**
- Consultant queries require **multi-step reasoning**: connecting GDD stage to fertilizer timing, interpreting NDVI trends in the context of rainfall history, evaluating variety trade-offs for specific microclimates.
- The system prompt injects the farm's full data profile as grounding context. Pro's larger context window and stronger reasoning handle this more reliably.
- **Cost is acceptable** because consultant access is:
  1. Subscribed-tier only (paywall)
  2. User-initiated (not automated at scale)
  3. Per-session (not per-farm-per-cycle)

**Grounding principle:** Risk levels are computed by the rule-based processing layer and handed to Gemini as facts. Gemini interprets and explains them — it does NOT recalculate them. This prevents the AI from contradicting the system's own risk assessments.

---

## 7. Data Staleness Model

Every piece of cached data has a defined maximum age. The system explicitly communicates data freshness to the farmer.

| Data | Max Age | Degraded Behavior |
|------|---------|-------------------|
| `weather_cache` | 3 hours | Should never happen — 4 daily SCT runs + hourly micro-refresh. If stale, use last available reading with timestamp. |
| `satellite_cache` | 5 days (valid) | If `is_valid = false`, show `last_valid_at` timestamp to farmer. BPH risk falls back to `moderate` (cannot confirm canopy/moisture). |
| `dem_cache` | ∞ (static) | Never stale. Elevation and slope don't change. |
| `farm_risk_status` | Recomputed after each SCT run | Always current relative to cached inputs. |

**Key design decision:** Staleness is *transparent*. The farmer sees "Last satellite: 3 days ago" in their PANAHON response. The system never pretends to have data it doesn't have.

---

## 8. Red Alert Bypass — Safety Architecture

Red Alerts (flood, landslide, BPH spread) follow a special path that bypasses all scheduling and paywalls:

```
Threshold breach detected (processing layer)
        ↓
    Template engine builds alert string
        ↓
    Gemini Flash translates to dialect
        ↓
    Semaphore dispatches IMMEDIATELY
        ↓
    No schedule check. No tier check. No digest queue.
```

**Rules enforced in code:**
1. Red Alerts are **never** queued for the 12hr digest. They go out immediately.
2. Red Alerts are sent to **all tiers** — freemium and subscribed alike. Safety alerts are never paywalled.
3. BPH Red Alerts additionally trigger the **spread index**, which may generate secondary alerts for neighboring farms.

**Why this matters:** A 6-hour delay (waiting for the next digest window) during a flash flood event could cost lives. The Red Alert path is the fastest pipeline in the system.

---

## 9. SMS Stagger Strategy

The 12hr digest (5:00 AM / 5:00 PM) sends SMS to all registered farmers. Sending them all simultaneously would throttle the Semaphore gateway.

```
05:00 AM — Municipality A batch (all farms in municipality A)
05:02 AM — Municipality B batch
05:04 AM — Municipality C batch
(+2 minutes per additional municipality)
```

**Why 2-minute gaps?** Semaphore's standard SMS gateway has a per-second throughput limit. A 2-minute window per municipality gives enough headroom for even large municipalities (hundreds of farms) without hitting rate limits.

**Implementation:** The stagger is implemented as a simple delay offset based on the municipality's alphabetical index:

```python
municipalities = sorted(get_all_municipalities())
for i, muni in enumerate(municipalities):
    delay_minutes = i * 2
    schedule_batch(muni, base_time + timedelta(minutes=delay_minutes))
```

---

*This document is the ground truth for GABAYANI's architectural decisions. If you find a conflict between this document and the code, the code is wrong.*
