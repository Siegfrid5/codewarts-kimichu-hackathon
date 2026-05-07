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

---

## Date: 2026-05-07 - Authentication and Security Overhaul

### Overview
Implemented comprehensive authentication and security overhaul including database indexing, user model expansion, password encryption, session management with refresh tokens, and frontend authentication context.

### Backend Changes

#### Database Migrations
- **Migration 008** (`src/server/db/migrations/008_create_education_videos.js`):
  - Added performance indexes to `education_videos` table:
    - Composite index on (category, created_at)
    - Individual indexes on title, video_id

- **Migration 009** (`src/server/db/migrations/009_update_users_table.js`):
  - Added `username` (VARCHAR(30), unique, nullable)
  - Added `email` (VARCHAR(255), unique, nullable)
  - Added `failed_login_attempts` (INT, default 0)
  - Added `account_locked_until` (TIMESTAMP, nullable)
  - Added `password_changed_at` (TIMESTAMP, default NOW())
  - Added indexes on username and email for fast lookups

- **Migration 010** (`src/server/db/migrations/010_create_refresh_tokens.js`):
  - Created `refresh_tokens` table for session management:
    - `id` (UUID, primary key)
    - `user_id` (UUID, foreign key to users)
    - `token_hash` (VARCHAR(64), SHA-256 hashed token)
    - `expires_at` (TIMESTAMP)
    - `revoked_at` (TIMESTAMP, nullable)
    - `created_at` (TIMESTAMP, default NOW())
    - Index on user_id and expires_at

#### Models
- **User Model** (`src/server/models/User.js`):
  - Added `findByUsername(username)` - Find user by username
  - Added `findByEmail(email)` - Find user by email
  - Added `findByIdentifier(identifier)` - Find user by username, email, or phone
  - Added `incrementFailedLogin(userId)` - Increment failed login counter
  - Added `resetFailedLogin(userId)` - Reset failed login counter
  - Added `lockAccount(userId, minutes)` - Lock account for specified time
  - Added `isAccountLocked(user)` - Check if account is locked
  - Added `updatePassword(userId, newPassword)` - Update user password

- **RefreshToken Model** (`src/server/models/RefreshToken.js`):
  - Added `generateToken()` - Generate secure random token
  - Added `hashToken(token)` - SHA-256 hash token
  - Added `create(userId, expiryDays)` - Create refresh token
  - Added `verify(token)` - Verify and validate refresh token
  - Added `revoke(token)` - Revoke refresh token
  - Added `cleanup()` - Remove expired tokens

#### Validation
- **Validation Schema** (`src/server/utils/validation.js`):
  - Updated `userRegistrationSchema`:
    - Added username validation (3-30 chars, alphanumeric + underscore)
    - Added email validation (optional, valid email format)
    - Added password strength validation (8+ chars, uppercase, lowercase, number, special char)
    - Made username and email optional with empty string handling
  - Updated `loginSchema`:
    - Accepts username, email, or phone as identifier

#### Security Middleware
- **Rate Limiting** (`src/server/middleware/rateLimit.js`):
  - Auth limiter: 5 requests per 15 minutes for /api/auth routes
  - API limiter: 100 requests per minute for general API routes

- **Security Headers** (`src/server/index.js`):
  - Added helmet middleware for security headers
  - Note: express-xss-sanitizer removed due to compatibility issues

#### Authentication Routes
- **Auth Routes** (`src/server/routes/auth.js`):
  - **POST /api/auth/register**:
    - Validates username, email, phone, password
    - Checks for existing username/email/phone
    - Hashes password with bcrypt (12 salt rounds)
    - Creates user with optional username/email
    - Generates access token (15 min expiry)
    - Generates refresh token (7 days expiry)
    - Returns user data, access token, refresh token
    - Includes account lockout logic (5 failed attempts = 15 min lock)

  - **POST /api/auth/login**:
    - Accepts username, email, or phone as identifier
    - Checks account lock status
    - Verifies password with bcrypt
    - Increments failed login attempts on failure
    - Resets failed attempts on success
    - Generates access token (15 min expiry)
    - Generates refresh token (7 days expiry)
    - Returns user data, access token, refresh token

  - **POST /api/auth/refresh**:
    - Verifies refresh token
    - Checks if token is revoked or expired
    - Generates new access token
    - Implements token rotation (issues new refresh token)
    - Revokes old refresh token

  - **POST /api/auth/logout**:
    - Verifies refresh token
    - Revokes refresh token
    - Cleanup expired tokens

- **Auth Middleware** (`src/server/middleware/auth.js`):
  - Updated to verify token type (access vs refresh)
  - Rejects refresh tokens for protected routes
  - Only allows access tokens

### Frontend Changes

#### Authentication Context
- **AuthContext** (`src/client/src/contexts/AuthContext.jsx`):
  - Provides authentication state to entire app
  - Stores access token, refresh token, user data
  - Auto-refreshes access token every 13 minutes
  - Handles login, register, logout functions
  - Provides `apiCall` helper with automatic token refresh
  - Stores tokens in localStorage

#### Components
- **Login Page** (`src/client/src/pages/Login.jsx`):
  - Created login form with username/email/phone input
  - Password input with validation
  - Error handling and display
  - Redirects to dashboard on success

- **Farm Registration** (`src/client/src/pages/FarmRegistration.jsx`):
  - Added username field (optional, 3+ chars)
  - Added email field (optional, valid email format)
  - Added password field (required, 8+ chars with complexity)
  - Updated handleSubmit to:
    - Register user first via /api/auth/register
    - Store tokens in localStorage
    - Register farm via /api/farms/register with auth header
  - Fixed error handling to display validation messages

- **Dashboard** (`src/client/src/pages/Dashboard.jsx`):
  - Updated to fetch data from API instead of hardcoded
  - Uses `apiCall` helper from AuthContext
  - Added loading, error, and empty states
  - Fetches from /api/farms/my-farms

- **App Configuration** (`src/client/src/App.jsx`):
  - Added AuthProvider wrapper
  - Created ProtectedRoute component
  - Protected routes: /dashboard, /consultant
  - Public routes: /, /login, /register, /education
  - Updated Navbar to show auth state
  - Added logout functionality

#### API Configuration
- Updated all API URLs from port 3001 to port 3000:
  - AuthContext.jsx
  - Dashboard.jsx
  - FarmRegistration.jsx
  - Education.jsx

### Configuration Changes

#### Environment Variables
- Updated `.env`:
  - DATABASE_URL: Added Supabase connection string
  - DB_HOST: db.fslnwqojewztccttohun.supabase.co
  - DB_PORT: 5432
  - Added SSL configuration for DATABASE_URL
  - Added Google Maps API key
  - Added OpenWeather API key

#### Server Configuration
- **Config** (`src/server/config/index.js`):
  - Added SSL config for DATABASE_URL
  - Database connection prefers DATABASE_URL over individual DB_* variables

### Current Issues

#### Database Connection
- **Status**: DNS resolution working, connection timing out
- **Error**: ETIMEDOUT when connecting to Supabase
- **Attempted Fixes**:
  - Changed hostname from db.fslnwqojewztccttohun.supabase.co to fslnwqojewztccttohun.supabase.co
  - Tried Session Pooler port 6543 for IPv4 compatibility
  - Reverted to original hostname and port 5432
  - Added SSL configuration
- **Root Cause**: Network connectivity issue - database not accessible from current network
- **Required Action**: User needs to check Supabase dashboard, verify database is active, check firewall/VPN settings

#### Google Maps
- **Status**: API key added to .env
- **Issue**: Map component showing API errors
- **Required Action**: Verify API key is valid and enabled for JavaScript Maps API

### Files Modified

#### Backend
1. `src/server/db/migrations/008_create_education_videos.js` - Added indexes
2. `src/server/db/migrations/009_update_users_table.js` - Added auth fields
3. `src/server/db/migrations/010_create_refresh_tokens.js` - New table
4. `src/server/models/User.js` - Added auth methods
5. `src/server/models/RefreshToken.js` - New model
6. `src/server/utils/validation.js` - Updated schemas
7. `src/server/middleware/rateLimit.js` - New middleware
8. `src/server/middleware/auth.js` - Updated token verification
9. `src/server/routes/auth.js` - Complete rewrite
10. `src/server/index.js` - Added security middleware
11. `src/server/config/index.js` - Added SSL config

#### Frontend
1. `src/client/src/contexts/AuthContext.jsx` - New context
2. `src/client/src/pages/Login.jsx` - New page
3. `src/client/src/pages/FarmRegistration.jsx` - Added auth fields
4. `src/client/src/pages/Dashboard.jsx` - API integration
5. `src/client/src/pages/Education.jsx` - API URL update
6. `src/client/src/App.jsx` - AuthProvider and ProtectedRoute

#### Configuration
1. `.env` - Database URL, SSL, API keys

### Security Features Implemented

1. **Password Security**:
   - Bcrypt hashing with 12 salt rounds
   - Password strength validation
   - Password change tracking

2. **Account Security**:
   - Account lockout after 5 failed attempts
   - 15-minute lockout duration
   - Failed login attempt tracking

3. **Session Management**:
   - JWT access tokens (15 min expiry)
   - JWT refresh tokens (7 days expiry)
   - Token rotation on refresh
   - Token revocation on logout
   - Automatic token refresh (13 min before expiry)

4. **Rate Limiting**:
   - Strict rate limiting for auth endpoints (5/15min)
   - General API rate limiting (100/min)

5. **Security Headers**:
   - Helmet middleware for security headers

### Pending Tasks

1. **Database Connection**: Resolve ETIMEDOUT error - network connectivity issue
2. **Google Maps**: Verify API key and enable JavaScript Maps API
3. **Run Migrations**: Execute pending database migrations once connection is established
4. **Testing**: Complete end-to-end authentication flow testing

### Dependencies Added

Backend:
- `bcrypt` - Password hashing
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers

Note: `express-xss-sanitizer` was installed but removed due to compatibility issues.
