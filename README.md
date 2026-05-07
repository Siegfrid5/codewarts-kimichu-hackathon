# 🌾 GABAYANI

**Guided Agricultural Bulletin and Advisory for Yield and Nutrition Intelligence**

> SMS-based agricultural intelligence for Filipino rice farmers — from satellite to feature phone.

[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Status](https://img.shields.io/badge/status-hackathon--build-orange.svg)]()
[![Platform](https://img.shields.io/badge/platform-SMS%20%2B%20Web-blue.svg)]()

---

## What is GABAYANI?

GABAYANI is an early warning and farm advisory system that combines **satellite imagery**, **weather data**, and **biological pest models** to deliver actionable intelligence to Filipino rice farmers — even those with only a basic feature phone.

The system monitors crop health, weather patterns, and pest risk 24/7, and delivers SMS alerts in the farmer's own dialect (Tagalog, Ilocano, Cebuano, or Hiligaynon).

### The Problem

Filipino rice farmers face unpredictable pest outbreaks (Brown Planthopper, Rice Blast), flash floods, and landslides. Most farm advisory systems require smartphones, internet access, or manual monitoring. **70% of Philippine rice farmers use feature phones** — they need intelligence delivered over SMS.

### The Solution

GABAYANI bridges the gap:

- 🛰️ **Satellite monitoring** — Sentinel-2 NDVI/NDWI tracks crop health every 5 days
- 🌦️ **Weather intelligence** — OpenWeather data refreshed 4x/day with hourly rainfall tracking
- 🐛 **Pest prediction** — GDD-based BPH hatch countdown + wind-vector spread analysis
- 📱 **SMS delivery** — All alerts sent via Semaphore in the farmer's dialect
- 🌐 **Web dashboard** — Full farm visualization for smartphone users
- 🤖 **AI consultant** — Gemini-powered chatbot for personalized farm advice

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js / Express |
| **Frontend** | React / Next.js |
| **Database** | PostgreSQL (with JSONB for GeoJSON) |
| **SMS Gateway** | Semaphore (PH) |
| **Weather** | OpenWeather API |
| **Satellite** | Google Earth Engine (Sentinel-2) |
| **Elevation** | SRTM DEM (30m resolution) |
| **AI Translation** | Gemini 1.5 Flash |
| **AI Consultant** | Gemini 1.5 Pro |
| **Maps** | Google Maps JavaScript API + Drawing Manager |
| **Auth** | bcrypt + JWT (httpOnly cookies) |

---

## Architecture Overview

GABAYANI follows a **4-layer architecture** with a strict separation between API ingestion and farmer-facing services:

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1 — INGESTION (SCT Cron Jobs)                    │
│  Only layer that calls external APIs                    │
│  OpenWeather │ GEE/Sentinel-2 │ SRTM DEM │ PAGASA      │
└──────────────────────┬──────────────────────────────────┘
                       │ writes to DB cache
                       ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 2 — PROCESSING                                   │
│  Reads DB cache only. Computes risk from cached data.   │
│  GDD accumulation │ Flood trigger │ BPH spread index    │
└──────────────────────┬──────────────────────────────────┘
                       │ writes to farm_risk_status
                       ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 3 — DECISION                                     │
│  Template engine → Gemini translation → routing         │
│  Digest (5AM/5PM) │ Red Alert (immediate) │ PANAHON     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 4 — DELIVERY                                     │
│  Semaphore SMS │ Web Dashboard │ Chatbot                │
└─────────────────────────────────────────────────────────┘
```

> **Core Rule:** Every farmer-facing service reads from the DB cache only. Only SCT cron jobs call external APIs.

---

## Subscription Tiers

| Feature | Freemium | Subscribed |
|---------|:--------:|:----------:|
| Web app access | ✅ | ✅ |
| Live farm dashboard (weather, risk, NDVI) | ✅ | ✅ |
| 12hr SMS digest (5AM / 5PM push) | ✅ | ✅ |
| 🔴 Red Alert SMS (immediate — flood, BPH, blast) | ✅ | ✅ |
| PANAHON on-demand SMS query | ❌ | ✅ |
| Gemini farm consultant chatbot | ❌ | ✅ |

> **Safety first:** Red Alerts (flood, landslide, BPH spread) are **never paywalled** and bypass the 12hr digest schedule. All farmers receive them immediately.

---

## SMS Commands

### `PANAHON` — On-Demand Farm Update

**Available to:** Subscribed farmers only

Text `PANAHON` to the GABAYANI number. The system responds in < 5 seconds with your farm's current status:

```
📱 Farmer texts: PANAHON
         ↓
🖥️ Server reads DB cache (no API calls):
   • weather_cache (max 3hrs stale)
   • satellite_cache (max 5 days stale)
   • farm_risk_status
         ↓
📝 Template engine builds English string
         ↓
🌐 Gemini 1.5 Flash translates to farmer's dialect
         ↓
📱 SMS reply delivered via Semaphore
```

**Example response (Tagalog):**
```
GABAYANI: [San Jose] Temp 32°C, Humidity 88%.
BPH Risk: MATAAS. Huling satellite: 2 araw na ang nakalipas.
I-drain ang tubig sa palayan.
```

**Freemium farmers** who text PANAHON receive a reply prompting them to upgrade.

---

## Alert Types

### 📋 12hr Digest (5AM / 5PM)
- Scheduled push to all farmers (both tiers)
- Staggered by municipality (2-minute gaps) to prevent SMS gateway throttling
- Includes weather summary, risk levels, and satellite status

### 🔴 Red Alert (Immediate)
- Triggered by threshold breaches: flood, landslide, BPH outbreak
- **Bypasses** the 12hr schedule — sent immediately
- Sent to **ALL** farmers regardless of tier
- BPH alerts additionally notify downwind farms within 5km

### 📱 PANAHON (On-Demand)
- Farmer-initiated via SMS keyword
- Subscribed tier only
- < 5 second response time
- Zero additional API cost (reads DB cache only)

---

## Farm Registration

Registration is handled via the **GABAYANI web app** (not SMS). A farmer or cooperative extension worker:

1. Opens the registration page in any browser
2. Fills in farm details (name, phone, municipality, crop, dialect)
3. **Draws the farm boundary** on Google Maps using the polygon drawing tool
4. Submits — the system automatically:
   - Computes centroid and area from the polygon
   - Looks up elevation/slope from SRTM DEM (one-time)
   - Bootstraps weather and satellite data
   - Sends a confirmation SMS

---

## Supported Dialects

| Dialect | Region Coverage |
|---------|----------------|
| Filipino / Tagalog | Central Luzon, Metro Manila |
| Ilocano | Ilocos Region, CAR, Cagayan Valley |
| Bisaya / Cebuano | Visayas, most of Mindanao |
| Hiligaynon | Western Visayas |

All SMS alerts are translated by **Gemini 1.5 Flash** into the farmer's registered dialect.

---

## Project Structure

```
codewarts-kimichu-hackathon/
├── docs/                         # Architecture & design documents
│   ├── GABAYANI_Architecture.md  # Master architecture plan
│   ├── TECHNICAL_ARCHITECTURE.md # Developer deep-dive
│   └── prompts/                  # AI prompt templates
├── src/                          # Application source code
├── tests/                        # Test suites
├── log/                          # Application logs
├── assets/                       # Static assets
└── README.md                     # ← You are here
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- API Keys:
  - OpenWeather API
  - Google Earth Engine (service account)
  - Google Maps JavaScript API
  - Gemini API (1.5 Flash + 1.5 Pro)
  - Semaphore SMS (PH)

### Setup

```bash
# Clone the repository
git clone https://github.com/Siegfrid5/codewarts-kimichu-hackathon.git
cd codewarts-kimichu-hackathon

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Initialize database
npm run db:migrate

# Start development server
npm run dev
```

See [docs/SETUP.md](docs/SETUP.md) for detailed environment configuration.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture Plan](docs/GABAYANI_Architecture.md) | Master system architecture — the source of truth |
| [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) | Developer deep-dive — the "why" behind every decision |
| [Implementation Log](log/IMPLEMENTATION_LOG.md) | Phased roadmap with status tracking |
| [Setup Guide](docs/SETUP.md) | Environment and dependency configuration |

---

## Team

**Kimichu** — UST CodeWarts CICS Hackathon 2026

---

## License

This project is built for the UST CodeWarts CICS Hackathon.

---

<p align="center">
  <em>🌾 GABAYANI — Because every Filipino farmer deserves satellite-grade intelligence, even on a feature phone.</em><br>
  <small>Last updated: May 2026 (Maintenance Update)</small>
</p>
