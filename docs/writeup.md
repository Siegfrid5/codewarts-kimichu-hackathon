# Project Writeup: GABAYANI

## Overview
GABAYANI (Guided Agricultural Bulletin and Advisory for Yield and Nutrition Intelligence) is an SMS-based agricultural intelligence system designed specifically for Filipino rice farmers. It bridges the digital divide by taking high-tech satellite and micro-climate data and delivering it directly to basic feature phones via localized SMS text messages.

## Problem Statement
Filipino rice farmers constantly face unpredictable threats that can decimate a season's yield overnight: 
1. **Pest Outbreaks:** The Brown Planthopper (BPH) and Rice Blast fungal infections spread rapidly under specific micro-climate conditions.
2. **Extreme Weather:** Flash floods and landslides driven by localized torrential rains.
3. **The Digital Divide:** While there are advanced agritech dashboards available, **70% of Philippine rice farmers only use basic feature phones** and lack reliable internet access in the field.

## Solution
GABAYANI acts as a 24/7 autonomous farm consultant. The system continuously ingests satellite imagery (Sentinel-2) and micro-climate weather data, running it through a localized Biological Risk Engine. When thresholds for pests or floods are met, it translates the alert into the farmer's native dialect (Tagalog, Ilocano, Cebuano, or Hiligaynon) using Google Gemini, and instantly dispatches an SMS via Semaphore. 

No smartphone or app installation is required for the farmer—they just need a cell signal.

## Key Features
- **Zero-Internet SMS Delivery:** Farmers receive 12hr daily digests and immediate Red Alerts (BPH, Flood, Blast) via SMS.
- **On-Demand "PANAHON" Command:** Subscribed farmers can text "PANAHON" to get an instant, AI-translated update of their farm's specific micro-climate and risk status.
- **Micro-Climate Risk Engine:** Uses Growing Degree Days (GDD) accumulation and downwind spread analysis to predict pest outbreaks before they happen.
- **Automated Farm Registration via Google Maps:** Extension workers can register farms using a Google Maps Polygon tool that automatically extracts coordinates, calculates area in hectares, and fetches SRTM DEM elevation data.
- **AI Agronomist Chatbot:** A web-based Gemini Pro consultant equipped with RAG (Retrieval-Augmented Generation) that knows the specific weather, NDVI, and risk profile of the farmer's registered land.

## Technology Stack
- **Frontend:** React (Vite), Tailwind-inspired Vanilla CSS (Glassmorphism + Dark Mode), Lucide Icons
- **Backend:** Node.js, Express, `node-cron` (SCT Ingestion)
- **Database:** PostgreSQL (Knex.js), JSONB for GeoJSON polygon storage, Supabase Support
- **External APIs:** 
  - Google Earth Engine (Sentinel-2 NDVI/NDWI, SRTM DEM)
  - OpenWeather API (Hourly micro-climate)
  - Google Maps JavaScript API (Geometry & Polygon Rendering)
  - Semaphore SMS API
  - Google Gemini 1.5 Flash (Dialect Translation) & Gemini 1.5 Pro (Chatbot)

## Challenges Faced
1. **API Rate Limiting & Cost Management:** Fetching weather and satellite data for thousands of farms would instantly exhaust free tiers. We solved this by implementing a caching layer (`weather_cache` and `satellite_cache`) and grouping farms by municipality centroid. No user-facing request ever triggers an external API call.
2. **Google Maps DrawingManager Deprecation:** During development, the official Google Maps Drawing Library was deprecated. We quickly pivoted to building a custom point-and-click polygon rendering tool using the core `GoogleMap` API and `geometry` library to reliably compute farm acreage.
3. **Vercel Serverless Limitations:** Deploying long-running `node-cron` processes on Vercel's ephemeral serverless architecture was a challenge. We decoupled the Express server initialization from the cron startup using `require.main === module` to ensure successful Vercel frontend/API deployment without crashing.

## Future Improvements
- Implement the "Sisyphus Protocol" (A multi-agent swarm system to coordinate deep agricultural research and dynamic response planning).
- Expand crop models to include Corn and Sugarcane.
- Partner with local LGUs to subsidize the Semaphore SMS costs for indigent farmers.

## Team: CodeWarts - Kimichu (UST CICS Hackathon 2026)
- **Nat**
- **Rye**
- **Jim**
- **Sieg**
