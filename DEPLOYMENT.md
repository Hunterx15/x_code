# Deployment Guide — 14Dev

This guide covers deploying the 14Dev LeetCode-style coding platform to production.

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Frontend (SPA) │────▶│  Backend (API)  │────▶│  MongoDB Atlas   │
│  Vercel/Netlify │     │  Node.js host   │     └──────────────────┘
└─────────────────┘     └────────┬────────┘     ┌──────────────────┐
                                 ├─────────────▶│  Redis Cloud     │
                                 │              └──────────────────┘
                                 ├─────────────▶ Judge0 (RapidAPI)
                                 ├─────────────▶ Google Gemini API
                                 └─────────────▶ Cloudinary
```

---

## Frontend Deployment

### Option A: Vercel (Recommended)

1. **Push to GitHub/GitLab**
2. **Import to Vercel**: https://vercel.com/new
3. **Configure build**:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. **Set environment variables**:
   - `VITE_API_URL` = `https://api.yourdomain.com`
5. **Deploy** — Vercel automatically handles SPA routing via `vercel.json`

### Option B: Netlify

1. **Push to GitHub/GitLab**
2. **Import to Netlify**: https://app.netlify.com/start
3. **Configure build**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Set environment variables**:
   - `VITE_API_URL` = `https://api.yourdomain.com`
5. **Add SPA redirect** — create `public/_redirects`:
   ```
   /*    /index.html   200
   ```

### Option C: Static Hosting (S3 + CloudFront)

1. Build locally:
   ```bash
   cd frontend
   VITE_API_URL=https://api.yourdomain.com npm run build
   ```
2. Upload `dist/` to S3
3. Configure CloudFront with custom error response: 404 → /index.html (200)

### Post-Deploy Verification
- Visit `https://app.yourdomain.com` — should load the login page
- Open DevTools → Network → confirm API calls go to `https://api.yourdomain.com`
- Test Google OAuth — should redirect to Google and back successfully

---

## Backend Deployment

### Option A: Railway (Recommended)

1. **Push to GitHub/GitLab**
2. **Import to Railway**: https://railway.app/new
3. **Configure**:
   - Start command: `npm start`
   - Port: Railway auto-detects from `PORT` env var
4. **Set ALL environment variables** (see [Backend Environment Variables](#backend-environment-variables) below)
5. **Deploy**

### Option B: Render

1. **Push to GitHub/GitLab**
2. **Create Web Service**: https://dashboard.render.com/select?type=web
3. **Configure**:
   - Build command: `npm install`
   - Start command: `npm start`
4. **Set ALL environment variables**
5. **Deploy**

### Option C: VPS (DigitalOcean / AWS EC2)

1. **SSH into your server**
2. **Install Node.js 18+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. **Clone & install**:
   ```bash
   git clone <your-repo-url> /opt/14dev
   cd /opt/14dev/backend
   npm install --omit=dev
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   nano .env  # fill in real values
   ```
5. **Use PM2 for process management**:
   ```bash
   sudo npm install -g pm2
   pm2 start src/index.js --name 14dev-backend
   pm2 startup
   pm2 save
   ```
6. **Set up Nginx reverse proxy**:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
7. **Install SSL with Certbot**:
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Post-Deploy Verification
- `curl https://api.yourdomain.com/user/check` — should return 401 (no token)
- Check headers: `curl -I https://api.yourdomain.com/user/check` — should include Helmet security headers
- Test login endpoint with valid credentials

---

## Database Setup (MongoDB Atlas)

### Create Cluster
1. Go to https://cloud.mongodb.com
2. Create a free M0 cluster (512 MB — sufficient for development)
3. Choose a region close to your backend host

### Configure Access
1. **Database User**: Add a user with read/write permissions
2. **Network Access**: Whitelist your backend server's IP
   - For Railway/Render: use `0.0.0.0/0` (all IPs) — the database requires auth anyway
   - For VPS: add the VPS public IP

### Get Connection String
1. Click "Connect" → "Drivers" → Node.js
2. Copy the connection string: `mongodb+srv://USER:PASS@CLUSTER/DBNAME`
3. Set as `DB_CONNECT_STRING` in backend `.env`

### Index Migration (CRITICAL)

After deploying the backend code, you MUST drop the legacy `problemSolved` unique index:

```bash
mongosh "mongodb+srv://YOUR_CONNECTION_STRING"
```

```javascript
use Leetcode  // or your database name

// Check existing indexes
db.users.getIndexes()

// Drop the unique index on problemSolved (was a bug — prevented multi-user solving)
db.users.dropIndex("problemSolved_1")

// Verify it's gone
db.users.getIndexes()
```

**Why?** The original schema had `unique: true` on the `problemSolved` array, creating a multikey unique index that prevented any user from solving a problem another user had already solved. The code fix removed `unique: true`, but Mongoose doesn't auto-drop existing indexes — you must do it manually.

---

## Redis Setup

### Option A: Redis Cloud (Recommended)
1. Go to https://redis.com
2. Create a free 30 MB database (sufficient for token blocklist)
3. Copy host, port, and password to `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASS`

### Option B: Self-hosted (VPS only)
```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
# Host: 127.0.0.1, Port: 6379, no password (or configure one)
```

### Verification
The backend connects to Redis on boot. If Redis is unreachable, the server still starts but:
- Logout won't blocklist tokens (cookie is still cleared — Bug #4 fix)
- Token invalidation relies on natural JWT expiry (1 hour)

---

## Authentication Setup

### Email/Password
Already built-in. Just set:
- `JWT_KEY` — generate with `openssl rand -hex 32`

### Google OAuth 2.0

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Create OAuth consent screen**:
   - User type: External
   - App name: 14Dev
   - Authorized domains: `yourdomain.com`
   - Add scopes: `openid`, `email`, `profile`
3. **Create OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/user/auth/google/callback` (development)
     - `https://api.yourdomain.com/user/auth/google/callback` (production)
4. **Set environment variables**:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=https://api.yourdomain.com/user/auth/google/callback
   ```

**Important**: `GOOGLE_REDIRECT_URI` is required (not optional). The OAuth controller refuses to start the flow if it's unset — this prevents open-redirect attacks via spoofed `X-Forwarded-Host` headers.

---

## Backend Environment Variables

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `NODE_ENV` | Yes | `production` | Error handler verbosity |
| `PORT` | Yes | `3000` | Express listen port |
| `CLIENT_URL` | Yes | `https://app.yourdomain.com` | CORS origin + OAuth redirect target |
| `DB_CONNECT_STRING` | Yes | `mongodb+srv://...` | MongoDB connection string |
| `REDIS_HOST` | Yes | `redis-xxxx.cloud.redislabs.com` | Redis host |
| `REDIS_PORT` | Yes | `18045` | Redis port |
| `REDIS_PASS` | Yes | `your-password` | Redis password |
| `JWT_KEY` | Yes | `b903a0516a488eb7...` | JWT signing secret |
| `CLOUDINARY_CLOUD_NAME` | Yes | `dovzymczy` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | `443221776392495` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | `cAKmpfrzrJKKea_...` | Cloudinary API secret |
| `JUDGE0_KEY` | Yes | `53bdfec218msh2dfcd...` | RapidAPI key for Judge0 |
| `GEMINI_KEY` | Yes | `AQ.Ab8RN6K5YuCwNgjn...` | Google Gemini API key |
| `GOOGLE_CLIENT_ID` | Yes* | `xxxx.apps.googleusercontent.com` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes* | `GOCSPX-xxxx` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Yes* | `https://api.yourdomain.com/user/auth/google/callback` | OAuth callback URL |
| `COOKIE_SECURE` | Yes | `true` (prod) | Secure flag on auth cookie |
| `COOKIE_SAMESITE` | Yes | `none` (prod) | SameSite attribute |
| `COOKIE_MAX_AGE` | Optional | `3600000` | Cookie lifetime (ms) |
| `RATE_LIMIT_AUTH_WINDOW_MS` | Optional | `900000` | Auth rate-limit window |
| `RATE_LIMIT_AUTH_MAX` | Optional | `10` | Max auth attempts per window |
| `RATE_LIMIT_OAUTH_WINDOW_MS` | Optional | `900000` | OAuth rate-limit window |
| `RATE_LIMIT_OAUTH_MAX` | Optional | `10` | Max OAuth attempts per window |
| `RATE_LIMIT_AI_WINDOW_MS` | Optional | `60000` | AI chat rate-limit window |
| `RATE_LIMIT_AI_MAX` | Optional | `20` | Max AI requests per window |

*Google OAuth variables are required only if you want Google login. Email/password works without them.

---

## Production Checklist

### Before Deploying
- [ ] All environment variables set in backend `.env`
- [ ] `VITE_API_URL` set in frontend build environment
- [ ] `NODE_ENV=production` in backend `.env`
- [ ] `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none` in backend `.env`
- [ ] `GOOGLE_REDIRECT_URI` set to production callback URL
- [ ] `CLIENT_URL` set to production frontend URL
- [ ] HTTPS configured on both frontend and backend
- [ ] MongoDB Atlas IP whitelist includes backend server IP
- [ ] Redis instance accessible from backend
- [ ] Judge0 RapidAPI subscription active
- [ ] Google Gemini API key valid
- [ ] Cloudinary account configured

### After Deploying
- [ ] Drop legacy `problemSolved_1` unique index (see [Index Migration](#index-migration-critical))
- [ ] Test email/password login
- [ ] Test Google OAuth login
- [ ] Test problem run + submit (Judge0 integration)
- [ ] Test AI chat (Gemini integration)
- [ ] Test video editorial upload (admin only, Cloudinary)
- [ ] Verify Helmet headers: `curl -I https://api.yourdomain.com/user/check`
- [ ] Verify rate limiting: 11 rapid login attempts → 11th returns 429
- [ ] Verify CORS: frontend can make authenticated API calls
- [ ] Verify cookie: `Set-Cookie: token=...; HttpOnly; Secure; SameSite=None`

### Security Verification
- [ ] `NODE_ENV=production` — error responses return generic "Internal server error" (no stack traces)
- [ ] Rate limiting active (auth, OAuth, AI endpoints)
- [ ] Helmet headers present (HSTS, X-Frame-Options, CSP, etc.)
- [ ] Admin routes return 401 for non-admin users
- [ ] Reference solutions hidden until accepted submission
- [ ] Mass-assignment protection (can't inject `role`, `problemSolved`, etc.)
- [ ] `trust proxy` set correctly for your deployment topology

---

## Troubleshooting

### Backend won't start
**Error**: `Error: GOOGLE_REDIRECT_URI environment variable is required`
**Fix**: Set `GOOGLE_REDIRECT_URI` in `.env`. This is required (not optional) to prevent OAuth open-redirect attacks.

**Error**: `MongoServerError: Authentication failed`
**Fix**: Check `DB_CONNECT_STRING` — username/password must be URL-encoded. `@` becomes `%40`.

**Error**: `Redis connection refused`
**Fix**: Check `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASS`. The server starts even if Redis is down, but logout won't blocklist tokens.

### Frontend can't reach backend
**Error**: CORS errors in browser console
**Fix**: Ensure `CLIENT_URL` in backend `.env` matches the frontend URL exactly (including protocol).

**Error**: Cookie not being set
**Fix**: 
- Local dev: `COOKIE_SECURE=false`, `COOKIE_SAMESITE=lax`
- Production: `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`
- Both must be HTTPS in production for `SameSite=None` to work

### Google OAuth fails
**Error**: `redirect_uri_mismatch`
**Fix**: The `GOOGLE_REDIRECT_URI` env var must EXACTLY match a URI in the Google Cloud Console's "Authorized redirect URIs" list.

**Error**: `invalid_client`
**Fix**: Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct.

### Judge0 fails
**Error**: `Judge0 timed out waiting for submission results`
**Fix**: Check `JUDGE0_KEY` is valid and your RapidAPI subscription is active. The timeout is 60 seconds — if Judge0 is degraded, submissions will fail with this error.

**Error**: `Judge0 returned an invalid response`
**Fix**: RapidAPI quota exhausted. Check your usage on the RapidAPI dashboard.

### AI Chat fails
**Error**: `Internal server error` from `/ai/chat`
**Fix**: Check `GEMINI_KEY` is valid. The Gemini API has rate limits — if you exceed them, requests fail.

### Video upload fails
**Error**: Cloudinary upload error
**Fix**: Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Video files must be under 100 MB.

### Rate limiting issues
**Error**: `429 Too Many Requests`
**Fix**: The rate limiters use `req.ip`. If behind a reverse proxy, ensure `app.set('trust proxy', 1)` is set (it is, by default). Adjust the `RATE_LIMIT_*_MAX` env vars if your users legitimately need more attempts.

### Database index issues
**Error**: `E11000 duplicate key error` on `problemSolved`
**Fix**: You haven't dropped the legacy unique index. See [Index Migration](#index-migration-critical) above.
