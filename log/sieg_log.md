# Sieg's Log

## Date: 2026-05-07

### Tasks Completed
- **Frontend Architecture Setup:** Initialized the React/Vite client application inside `src/client`.
- **Premium UI Implementation:** Built a modern, glassmorphism-inspired dark mode UI system from scratch using `index.css`.
- **Routing & Pages:** Created `App.jsx` with `react-router-dom` and built the 4 core pages: Landing Page, Dashboard, Chatbot, and Farm Registration.
- **Google Maps Integration:** Replaced the placeholder mapping UI with the actual Google Maps API. Overcame the `DrawingManager` deprecation issue by building a robust, custom point-and-click polygon drawing tool that calculates the farm's Hectares and geometric centroid dynamically.
- **Production Readiness & Linting:** Resolved 8 ESLint unused variable errors (`React`, `DrawingManager`) to ensure a clean build pipeline.
- **Mobile Responsiveness:** Updated `index.html` viewport meta tags (`viewport-fit=cover`, `user-scalable=no`) to ensure the dashboard functions smoothly as an Android PWA.
- **Deployment Configuration:** Wrote `vercel.json` to seamlessly route Vercel traffic to both the Vite static build (`/`) and the Node.js Serverless Functions (`/api/*`). Configured `src/server/index.js` to export the Express app correctly for serverless environments.
- **Database Scalability:** Updated `knexfile.js` to support Supabase (`DATABASE_URL`) with forced SSL injection.

### Issues Encountered
- **Vercel Ephemeral Functions:** Realized `node-cron` (our SCT Scheduler) would die on Vercel Serverless. Added environment variable checks (`process.env.VERCEL`) to prevent cron initialization when deployed on Vercel, delegating cron execution to manual webhook triggers or external servers.
- **Google Maps Drawing Deprecation:** The official Drawing Library threw a deprecation warning and failed to load on newer API versions.
  - *Fix:* Rewrote the map component to push coordinates to an array `onClick` and rendered a standard `<Polygon>` instead. Used the `geometry.spherical` namespace to compute acreage manually.

### Notes
- The Web App and Registration Flow (Chapter 4, 5, 12 of the Architecture Plan) is 100% complete and integrated with the backend cache.
- The prototype is officially ready for the hackathon pitch!
