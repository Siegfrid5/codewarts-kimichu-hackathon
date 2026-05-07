# GABAYANI — System Architecture Plan
> SMS-based agricultural intelligence for Filipino rice farmers — from satellite to feature phone

---

## Table of Contents
1. [Architecture Layers](#1-architecture-layers)
2. [SCT — Strategic Call Timing](#2-sct--strategic-call-timing)
3. [PANAHON On-Demand Flow](#3-panahon-on-demand-flow)
4. [Farm Registration Flow](#4-farm-registration-flow)
5. [Web App, Authentication & Subscription Tiers](#5-web-app-authentication--subscription-tiers)
6. [Processing Layer — Triggers & Thresholds](#6-processing-layer--triggers--thresholds)
7. [Biological Thresholds — Named Constants](#7-biological-thresholds--named-constants)
8. [Database Schema](#8-database-schema)
9. [Alert Types & Message Routing](#9-alert-types--message-routing)
10. [Gemini Integration — Translation & Consultant Modes](#10-gemini-integration--translation--consultant-modes)
11. [API Rate Limiting Strategy](#11-api-rate-limiting-strategy)
12. [Full System Flow Summary](#12-full-system-flow-summary)

---

## 1. Architecture Layers

| Layer | Role | External Services |
|---|---|---|
| **1. Ingestion** | SCT cron jobs pull all external data. No farmer action ever touches an API. | OpenWeather, GEE / Sentinel-2, SRTM DEM, PAGASA webhook |
| **2. Processing** | Risk computation from cached data. GDD accumulation, flood trigger, pest spread index. | None — reads DB cache only |
| **3. Decision** | Risk status determines message type and urgency. Template engine builds English strings. Subscription tier gates PANAHON and chatbot. | Gemini 1.5 Flash (translation), Gemini 1.5 Pro (consultant chatbot) |
| **4. Delivery** | Semaphore dispatches SMS. Web app mirrors data and adds subscription features. | Semaphore SMS gateway, web app (React/Next.js) |

**Core rule:** Every farmer-facing service reads from the DB cache only. Only SCT cron jobs call external APIs.

---

## 2. SCT — Strategic Call Timing

The only layer that touches external APIs. Runs silently in the background on a fixed schedule.

| Job | Schedule | Data Fetched | Cache TTL | Notes |
|---|---|---|---|---|
| **Weather refresh** | `04:30, 12:00, 15:00, 21:00` | OpenWeather — 1 call per municipality | ~3 hrs | 4:30 AM run feeds the 5 AM digest with fresh data |
| **Rainfall micro-refresh** | Every 1 hr | `rain.1h` from OpenWeather | 1 hr | Critical — flood trigger requires sub-3hr rainfall resolution |
| **Satellite refresh** | Every 5 days | GEE Sentinel-2 NDVI + NDWI — single batch FeatureCollection covering all farm points | 5 days + cloud delay | Checks `CLOUDY_PIXEL_PERCENTAGE`; flags cache as stale if > 40% |
| **New farm bootstrap** | On web registration (once per farm) | OpenWeather for municipality + GEE zonal extraction using polygon | Joins normal SCT cycle | Triggered by server after form submission — happens exactly once per farm lifetime |

### Municipal grouping logic
```
Farms grouped by municipality → 1 OpenWeather call per municipality per SCT run

Example: 80 farms across 3 municipalities
→ 3 calls per SCT run × 4 runs/day = 12 calls/day
→ vs. 320 calls/day without grouping
```

---

## 3. PANAHON On-Demand Flow

Farmer-triggered query. No external API is ever called. Target response time: **< 5 seconds**.

```
1. Farmer texts "PANAHON"
         ↓
2. Semaphore webhook → hits server
         ↓
3. Server reads DB cache only:
   - weather_cache     (max 3 hrs stale)
   - satellite_cache   (max 5 days stale, timestamp shown to farmer)
   - farm_risk_status  (BPH / Blast / flood computed values)
         ↓
4. Template engine builds English string:
   "[Farm: San Jose] Temp 32°C, Humidity 88%,
    BPH Risk: HIGH. Last satellite: 2 days ago."
         ↓
5. Gemini 1.5 Flash translates to farmer's registered dialect
         ↓
6. Semaphore dispatches SMS reply
         ↓
   ✓ No API call made. Zero additional API cost per request.
```

### Degraded-mode message (when satellite data unavailable)
```
"GABAYANI 5AM: Weather data updated. Satellite imagery
unavailable (cloudy). BPH risk remains MODERATE based
on last reading (3 days ago). Monitor manually today."
```
Silence from the system is the worst outcome. Always send something.

---

## 4. Farm Registration Flow

Registration is handled via the **GABAYANI web app** — not SMS. The farmer or a cooperative extension worker opens the registration page on any browser, fills in farm details, and draws the farm boundary directly on a Google Maps interface.

### Web registration form fields
| Field | Input type | Notes |
|---|---|---|
| Farmer name | Text | |
| Mobile number | Text | Used by Semaphore for SMS delivery |
| Barangay | Text | |
| Municipality | Dropdown | Pre-populates from PH municipality list; used for OpenWeather grouping |
| Crop type | Dropdown | `Rice`, `Corn`, etc. — maps to threat models |
| Dialect | Dropdown | `Filipino/Tagalog`, `Ilocano`, `Bisaya/Cebuano`, `Hiligaynon` |
| Farm polygon | Google Maps drawing | Farmer draws boundary using Maps Drawing Manager |

### Polygon drawing flow
```
1. Farmer opens registration page in browser
         ↓
2. Google Maps loads centered on the farmer's municipality
         ↓
3. Farmer uses Drawing Manager (polygon tool) to trace
   the boundary of their farmland on the satellite view
         ↓
4. On polygon complete:
   - Coordinates array captured from Maps API
   - Farm area computed from polygon (sq meters → hectares)
   - Centroid computed → used as the representative point
     for OpenWeather municipal grouping + GEE extraction
         ↓
5. Farmer reviews details → submits form
         ↓
6. Server receives:
   - Farm metadata (name, phone, barangay, municipality,
     crop, dialect)
   - Polygon GeoJSON (array of lat/lng vertices)
   - Computed centroid lat/lng
   - Computed area in hectares
```

### Server-side after form submission
```
1. Write farm record to farms table
   (polygon stored as GeoJSON, centroid stored as lat/lng)
         ↓
2. SRTM DEM one-time lookup using centroid coordinates
   → store slope + elevation in dem_cache (never re-queried)
         ↓
3. Bootstrap API call (one-time only):
   → OpenWeather call for farm's municipality
   → GEE extraction using polygon geometry (not just a point)
   → Populate weather_cache + satellite_cache
         ↓
4. Farm joins normal SCT cycle from next scheduled run
         ↓
5. Confirmation SMS sent to registered mobile number:
   "Nairehistro na ang iyong farm sa GABAYANI.
    I-text ang PANAHON para sa iyong farm update."
```

### Polygon vs. point — why it matters
With an actual polygon stored in the DB, the GEE satellite extraction changes from a single-point sample to a **zonal statistic** — NDVI and NDWI are averaged across the entire farm boundary rather than sampled at one coordinate. This gives a more accurate picture of crop health across the full plot, especially for irregularly shaped or large farms.

The centroid is still used for OpenWeather (weather is uniform at municipality scale) and for the BPH spread index proximity query (distance between farm centroids).

---

## 5. Web App, Authentication & Subscription Tiers

The GABAYANI web app serves as the primary interface for farmers who have smartphones or computer access. It mirrors all data being sent via SMS and adds subscription-gated features on top.

### Authentication

Login credentials collected at registration:

| Field | Notes |
|---|---|
| Name | Full name — used as display name in the app |
| Mobile number | Primary identifier — links the account to SMS delivery |
| Password | Hashed (bcrypt) before storage — never stored in plaintext |

Session management via JWT tokens. On login, server validates credentials against the `users` table, issues a signed token, and the client stores it in `httpOnly` cookie.

### Subscription Tiers

| Feature | Freemium | Subscribed |
|---|---|---|
| Web app access | ✓ | ✓ |
| Live farm dashboard (weather, risk, NDVI) | ✓ | ✓ |
| 12hr SMS digest (5AM / 5PM push) | ✓ | ✓ |
| Red Alert SMS (immediate) | ✓ | ✓ |
| PANAHON on-demand SMS query | ✗ | ✓ |
| Gemini farm consultant chatbot | ✗ | ✓ |

Freemium farmers receive all outgoing alerts passively — the system pushes to them. The paywall is on **active queries and AI consultation** only.

### Web App Dashboard (both tiers)

The dashboard mirrors exactly what the SMS system already knows — no new data is fetched for the web view. It reads from the same cache the SMS engine uses.

Displayed data per farm:
- Current temperature, humidity, wind speed and direction
- Rainfall (last 1hr and 24hr accumulation)
- BPH risk level with GDD progress indicator
- Rice Blast risk level with humidity/wetness hours counter
- Flood risk level
- NDVI and NDWI values with last satellite timestamp
- Last alert sent (type, time, full message text)
- Farm polygon overlaid on Google Maps satellite view (read-only after registration)

### PANAHON on the web app (subscribed only)

The web app version of PANAHON is a button — "Get My Farm Update Now." It hits the same server endpoint as the SMS keyword but returns the data formatted for the screen (not compressed to 160 characters). The Gemini translation step is skipped for the web version since the farmer is reading on-screen; the English template is rendered directly with visual formatting.

### Gemini Consultant Chatbot (subscribed only)

A chat interface embedded in the web app. Full details in Chapter 10.

---

## 6. Processing Layer — Triggers & Thresholds

### Flood trigger
```
IF rainfall_1hr  > 15mm   (PAGASA "heavy rainfall" threshold)
OR rainfall_24hr > 75mm   (PAGASA flash flood advisory threshold)
AND farm_elevation < 10m  (from SRTM DEM — static lookup)
→ Trigger Red Alert
```

### Landslide trigger
```
IF rainfall_24hr > 75mm
AND farm_slope > 18°      (from SRTM DEM — static lookup)
→ Trigger Red Alert
```

### BPH pest spread index
```
IF farm_X triggers BPH Red Alert:
  1. Query all farms within 5km radius (GPS in farms table — no API)
  2. Check wind direction from weather_cache (OpenWeather)
  3. Farms downwind → elevate threat level by one tier
  4. Append to their next SMS:
     "Nearby farm reported BPH. Monitor closely."
```
Scientifically grounded — BPH spreads via wind-assisted flight. Uses only data the system already has.

---

## 7. Biological Thresholds — Named Constants

```python
# Brown Planthopper (Nilaparvata lugens)
# Source: PhilRice / IRRI
BPH_T_BASE       = 10.0   # °C — base temperature
BPH_HATCH_GDD    = 150.0  # accumulated GDD to egg hatch
BPH_NDVI_MIN     = 0.55   # minimum canopy density to sustain outbreak
BPH_NDWI_MIN     = 0.20   # minimum leaf moisture for breeding

# Rice Blast (Magnaporthe oryzae)
# Source: PhilRice / IRRI
BLAST_TEMP_MIN   = 17.0   # °C — optimal infection range starts
BLAST_TEMP_MAX   = 28.0   # °C — optimal infection range ends
BLAST_HUMIDITY_MIN = 90   # % RH threshold
BLAST_WETNESS_HOURS = 10  # consecutive hours of high humidity needed
```

Hardcoded as named constants in the processing layer — not embedded in logic as magic numbers. Makes the risk checks auditable.

---

## 8. Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | Display name |
| phone | VARCHAR | Links to `farms.phone` — used as login identifier |
| password_hash | VARCHAR | bcrypt hash — never plaintext |
| subscription_tier | ENUM | `freemium`, `subscribed` |
| subscribed_at | TIMESTAMP | Null if freemium |
| last_login_at | TIMESTAMP | |

### `farms`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| farmer_name | VARCHAR | |
| phone | VARCHAR | Farmer's number (Semaphore identifier) |
| barangay | VARCHAR | |
| municipality | VARCHAR | Used for OpenWeather grouping |
| crop | ENUM | `rice`, `corn`, etc. — maps to threat models |
| dialect | ENUM | `tagalog`, `ilocano`, `cebuano`, `hiligaynon` |
| polygon_geojson | JSONB | Full farm boundary from Google Maps Drawing Manager |
| centroid_lat, centroid_lng | DECIMAL | Computed from polygon — used for DEM lookup, proximity queries, OpenWeather grouping |
| area_hectares | DECIMAL | Computed from polygon on form submission |
| elevation_m | DECIMAL | From SRTM DEM using centroid (one-time at registration) |
| slope_deg | DECIMAL | From SRTM DEM using centroid (one-time at registration) |
| registered_at | TIMESTAMP | |

### `weather_cache`
| Column | Type | Notes |
|---|---|---|
| municipality_id | FK | One row per municipality |
| temp_c | DECIMAL | |
| humidity_pct | DECIMAL | |
| rain_1h_mm | DECIMAL | Used for flood trigger |
| rain_24h_mm | DECIMAL | Accumulated — used for flood + landslide |
| wind_dir_deg | DECIMAL | Used for BPH spread index |
| wind_speed_ms | DECIMAL | |
| fetched_at | TIMESTAMP | Max age checked before read |

### `satellite_cache`
| Column | Type | Notes |
|---|---|---|
| farm_id | FK | |
| ndvi | DECIMAL | Canopy density |
| ndwi | DECIMAL | Leaf moisture |
| cloud_pct | DECIMAL | If > 40%, entry flagged as invalid |
| is_valid | BOOLEAN | False when cloud cover too high |
| fetched_at | TIMESTAMP | |
| last_valid_at | TIMESTAMP | Shown to farmer in PANAHON response |

### `farm_risk_status`
| Column | Type | Notes |
|---|---|---|
| farm_id | FK | |
| bph_risk | ENUM | `low`, `moderate`, `high` |
| blast_risk | ENUM | `low`, `moderate`, `high` |
| flood_risk | ENUM | `low`, `moderate`, `high` |
| gdd_accumulated | DECIMAL | Running total for BPH hatch calculation |
| updated_at | TIMESTAMP | Recomputed after each SCT weather run |

### `dem_cache`
| Column | Type | Notes |
|---|---|---|
| lat, lng | DECIMAL | GPS key |
| elevation_m | DECIMAL | |
| slope_deg | DECIMAL | |

One-time write at registration. Never re-queried from SRTM.

### `alert_log`
| Column | Type | Notes |
|---|---|---|
| farm_id | FK | |
| alert_type | ENUM | `digest`, `panahon`, `red_alert` |
| risk_level | ENUM | `all_clear`, `moderate`, `red` |
| message_en | TEXT | English string before translation |
| message_dialect | TEXT | Final translated SMS |
| sent_at | TIMESTAMP | |

Used by pest spread index to query recent Red Alerts from neighboring farms.

---

## 9. Alert Types & Message Routing

### All Clear — 12hr digest
- Scheduled push at **5:00 AM and 5:00 PM**
- Staggered by municipality (2-minute gap) to prevent SMS gateway throttling
- Reads from `farm_risk_status`
- Sent to **both freemium and subscribed** farmers
- Sent even when satellite data unavailable — includes degraded-mode message with last valid timestamp

### On-Demand — PANAHON
- **Subscribed farmers only** — freemium accounts receive a reply prompting them to upgrade
- SMS keyword triggers server read from cache (no API call)
- Web app equivalent: "Get My Farm Update Now" button (also subscribed only)
- Response < 5 seconds
- Weather data: max 3 hrs stale; satellite data: max 5 days stale (timestamp displayed)

### Red Alert — Immediate dispatch
- Triggered when flood, BPH, or blast thresholds are breached
- Bypasses the 12hr push schedule entirely
- Sent to **both freemium and subscribed** farmers — safety alerts are never paywalled
- Route: threshold breach → template engine → Gemini translate → Semaphore → immediate SMS
- BPH Red Alert additionally runs pest spread index → notifies downwind farms within 5km

### SMS stagger schedule (12hr push)
```
05:00 AM — Municipality A batch
05:02 AM — Municipality B batch
05:04 AM — Municipality C batch
(+2 minutes per additional municipality)
```

---

## 10. Gemini Integration — Translation & Consultant Modes

Gemini operates in two distinct modes depending on context and subscription tier.

---

### Mode 1 — Translation (all tiers, SMS delivery)

Gemini receives a **finished, factually correct English string** built by the template engine. It never sees raw sensor data and never generates recommendations. Nothing to hallucinate — only words to translate.

**Prompt structure:**
```
Translate this agricultural SMS to {dialect}.
Keep it under 160 characters.
Do not add or remove any information.
Translate only.

"{FINISHED_ENGLISH_TEMPLATE}"
```

**Example input:**
```
"GABAYANI ALERTO: BPH hatch risk HIGH in 48hrs.
Canopy dense. Drain field water. Apply neem by {date}."
```

**Target dialects (minimum coverage):**
| Dialect | Region coverage |
|---|---|
| Filipino / Tagalog | Central Luzon, Metro Manila |
| Ilocano | Ilocos Region, CAR, Cagayan Valley |
| Bisaya / Cebuano | Visayas, most of Mindanao |
| Hiligaynon | Western Visayas |

**Model:** Gemini 1.5 Flash — translation does not require large-model reasoning capacity.

---

### Mode 2 — Farm Consultant Chatbot (subscribed tier only)

A conversational AI assistant embedded in the web app. The farmer types a question in natural language; Gemini answers using the farm's own data as its knowledge base. No generic advice — every response is grounded in that specific farm's current conditions.

#### System prompt (injected per session)

```
You are GABAYANI, an agricultural consultant for Filipino rice farmers.
You are advising a specific farmer. Use only the farm data below to 
answer their questions. Do not give generic advice — your answers must 
reflect the actual current conditions of this farm.

FARM PROFILE:
- Farmer: {farmer_name}
- Location: {barangay}, {municipality}
- Crop: {crop_type}
- Farm area: {area_hectares} hectares
- Elevation: {elevation_m}m ASL | Slope: {slope_deg}°
- Dialect preference: {dialect}

CURRENT CONDITIONS (as of {data_timestamp}):
- Temperature: {temp_c}°C
- Humidity: {humidity_pct}%
- Rainfall last 1hr: {rain_1h_mm}mm | last 24hr: {rain_24h_mm}mm
- Wind: {wind_dir}° at {wind_speed}m/s

SATELLITE DATA (as of {satellite_timestamp}):
- NDVI: {ndvi} ({ndvi_interpretation})
- NDWI: {ndwi} ({ndwi_interpretation})
- Data validity: {is_valid} | Cloud cover: {cloud_pct}%

RISK STATUS:
- BPH risk: {bph_risk} | GDD accumulated: {gdd_accumulated} / 150
- Rice Blast risk: {blast_risk}
- Flood risk: {flood_risk}

Respond in {dialect}. Be practical and specific. If you are uncertain
about something not covered by the farm data above, say so clearly.
```

#### Chatbot capabilities

**Fertilizer timing and soil inputs**

The chatbot uses GDD and NDVI data already in the system to give timing-specific advice rather than generic schedules.

- "When should I apply Urea?" → answered using GDD stage (vegetative vs. reproductive phase)
- "Should I add 14-14-14 now?" → answered using current NDVI (if NDVI indicates stress, earlier intervention)
- "Why is my yield lower even with the same fertilizer?" → answered by cross-referencing NDWI (moisture stress) and historical rainfall to identify likely nutrient lockout or drought-induced poor uptake

**Crop selection and varietal advice**

- "Which rice variety should I plant this season?" → answered using municipality-level climate data (temperature range, humidity, rainfall pattern) cross-referenced against known variety tolerances (RC222 vs RC160 heat/blast resistance profiles)
- "Should I switch to onions this dry season?" → answered using elevation, slope, and seasonal rainfall forecast to assess feasibility of high-value crop rotation

**What Gemini is not doing in consultant mode**

The chatbot does not generate new risk assessments or override the processing layer. Risk levels (BPH, Blast, Flood) are computed by the rule-based engine and handed to Gemini as facts. Gemini interprets and explains them — it does not recalculate them.

#### Model for consultant mode

Use **Gemini 1.5 Pro** (not Flash) for the chatbot. Consultant queries require multi-step reasoning — connecting GDD stage to fertilizer timing, interpreting NDVI trends, evaluating variety trade-offs. Flash's reduced reasoning capacity is a liability here. The higher cost is acceptable because consultant calls are subscribed-tier only and user-initiated (not automated at scale like translations).

---

## 11. API Rate Limiting Strategy

| Service | Strategy | Effective calls |
|---|---|---|
| **Google Maps JS API** | Used only during web registration (Drawing Manager). Not called by SCT or any background job. | Per registration session only — not a recurring cost |
| **OpenWeather** | Group farms by municipality → 1 call per municipality per SCT run | 3 munis × 4 runs/day = **12 calls/day** (vs 320+ individually) |
| **Google Earth Engine** | Single FeatureCollection batch job covering all farm coordinates simultaneously | **1 GEE job per 5-day cycle** regardless of farm count |
| **SRTM DEM** | One-time lookup at farm registration, stored permanently in `dem_cache` | **1 call per farm ever** — not per cycle |
| **Gemini 1.5 Flash** | Translation mode only — called per outgoing SMS after template is built. Stateless per message. | Proportional to SMS volume only |
| **Gemini 1.5 Pro** | Consultant chatbot — subscribed tier only, user-initiated. Each chat session passes full farm context as system prompt. | Per subscribed-user chat message only |
| **Semaphore** | Staggered 12hr push by municipality (2-min gap). Prevents gateway throttling. | SMS credits only — no API rate concern |

---

## 12. Full System Flow Summary

```
INGESTION (SCT — hits external APIs)
├── Every 3 hrs (4 strategic windows):
│   Query farms DB → group by municipality
│   → 1 OpenWeather call per municipality
│   → Write to weather_cache
│   → Recompute GDD + flood risk
│   → Update farm_risk_status
│
├── Every 1 hr:
│   → rain.1h refresh for flood trigger accuracy
│
├── Every 5 days:
│   Query farms DB → build FeatureCollection of all points
│   → 1 GEE batch job for all farms
│   → Extract NDVI + NDWI per coordinate
│   → Check cloud cover per scene
│   → Write to satellite_cache with timestamp
│   → Flag stale if cloud cover > 40%
│
└── On web registration (one-time):
    → Polygon + farm metadata submitted via web app
    → Centroid + area computed server-side
    → SRTM DEM lookup → store in dem_cache
    → Bootstrap OpenWeather + GEE zonal extraction
    → Farm joins normal SCT cycle

PROCESSING (reads cache only)
├── GDD accumulation          (BPH hatch countdown)
├── Rainfall accumulation     (flood + landslide trigger)
├── DEM slope/elevation check (static — already in DB)
└── BPH spread index          (wind + neighbor GPS query)

DECISION
├── All Clear  → store → 5AM/5PM digest (staggered, all tiers)
├── On-Demand  → check subscription_tier
│               ├── subscribed → cache read → template → Gemini Flash → SMS
│               └── freemium  → "upgrade to use PANAHON" reply
├── Red Alert  → template → Gemini Flash → immediate SMS (all tiers)
│               + BPH spread index → notify downwind farms
└── Chatbot    → subscribed only → farm context injected as system prompt
               → Gemini Pro → web app chat response

DELIVERY
├── Semaphore SMS          → farmer's feature phone (all tiers)
├── Web dashboard          → mirrors SMS data, read-only (all tiers)
├── PANAHON web button     → on-screen formatted response (subscribed)
└── Gemini chatbot panel   → consultant responses (subscribed)
```

---

## Pre-Hackathon Checklist

- [ ] Semaphore inbound SMS activated (keyword PANAHON) — allow 24–48 hrs for setup
- [ ] Google Maps API key enabled with Maps JavaScript API + Drawing Manager
- [ ] Polygon GeoJSON storage tested (PostGIS or JSONB column)
- [ ] Centroid + area computation logic tested on sample polygons
- [ ] GEE zonal statistics query tested (polygon FeatureCollection → mean NDVI/NDWI per farm)
- [ ] GEE project created and Sentinel-2 FeatureCollection query tested
- [ ] OpenWeather API key registered, municipal grouping logic tested
- [ ] SRTM DEM endpoint confirmed (30m resolution via OpenTopography or NASA Earthdata)
- [ ] Gemini 1.5 Flash API key tested — all 4 dialects with sample SMS strings
- [ ] Gemini 1.5 Pro API key tested — consultant system prompt injected with sample farm data
- [ ] Auth system implemented — bcrypt password hashing, JWT session tokens, httpOnly cookies
- [ ] Subscription tier gate implemented — PANAHON endpoint checks `subscription_tier` before responding
- [ ] Web dashboard reads from same cache as SMS engine (no duplicate API calls)
- [ ] `farm_risk_status` recompute triggers wired to run after each SCT weather job
- [ ] Degraded-mode message implemented for satellite cache misses

---

*GABAYANI — Guided Agricultural Bulletin and Advisory for Yield and Nutrition Intelligence*
