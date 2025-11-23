# RollScape Deployment Guide

Complete guide for deploying RollScape to production.

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [Domain & SSL](#domain--ssl)
8. [Monitoring & Logging](#monitoring--logging)
9. [Scaling Considerations](#scaling-considerations)
10. [Production Checklist](#production-checklist)
11. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

### Architecture

```
┌─────────────┐
│   Vercel    │  Frontend (Next.js)
│  (Frontend) │  - Static site hosting
└──────┬──────┘  - CDN distribution
       │         - Automatic HTTPS
       │
       ↓
┌─────────────┐
│   Railway   │  Backend (FastAPI)
│  (Backend)  │  - Python API server
└──────┬──────┘  - WebSocket support
       │         - Auto-scaling
       │
       ↓
┌─────────────┐
│  Supabase   │  Database (PostgreSQL)
│ (Database)  │  - Managed PostgreSQL
└─────────────┘  - Automatic backups
       │         - Built-in auth (optional)
       │
       ↓
┌─────────────┐
│   Upstash   │  Redis (Caching)
│   (Redis)   │  - Session management
└─────────────┘  - Rate limiting
```

### Recommended Hosting Providers

| Service | Provider | Cost | Notes |
|---------|----------|------|-------|
| **Frontend** | Vercel | Free - $20/mo | Best Next.js integration |
| **Backend** | Railway | $5 - $20/mo | Easy Python deployment |
| **Database** | Supabase | Free - $25/mo | Managed PostgreSQL + realtime |
| **Redis** | Upstash | Free - $10/mo | Serverless Redis |
| **Storage** | Supabase Storage | Included | For AI-generated images |

### Alternative Options

- **Backend**: Render, Fly.io, DigitalOcean App Platform
- **Frontend**: Netlify, Cloudflare Pages
- **Database**: Neon, AWS RDS, DigitalOcean Managed DB
- **Redis**: Redis Cloud, AWS ElastiCache

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub repository with your code
- ✅ Domain name (optional but recommended)
- ✅ OpenAI API key (for AI features)
- ✅ Accounts on hosting platforms
- ✅ Payment method (for paid tiers)

### Required Accounts

1. **Vercel**: https://vercel.com
2. **Railway**: https://railway.app
3. **Supabase**: https://supabase.com
4. **Upstash**: https://upstash.com (optional)
5. **OpenAI**: https://platform.openai.com

---

## Backend Deployment

### Option 1: Railway (Recommended)

Railway offers the easiest deployment for Python applications.

#### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your RollScape repository
5. Select the `backend` folder as the root

#### Step 2: Configure Build

Railway auto-detects Python apps. If needed, create `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Step 3: Set Environment Variables

In Railway dashboard, go to **Variables** and add:

```env
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-populated if using Railway Postgres

# API Keys
OPENAI_API_KEY=sk-proj-...
JWT_SECRET=your-secure-random-string-here

# Redis (if using Upstash)
REDIS_URL=redis://...

# OpenAI Settings (optional)
OPENAI_USE_MOCK=false
OPENAI_MODEL=gpt-4-turbo-preview

# CORS (important!)
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

#### Step 4: Add PostgreSQL Database

1. In Railway project, click **"New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically connects it
4. Database URL is auto-populated in `DATABASE_URL`

#### Step 5: Run Migrations

Use Railway's CLI or run from your local machine:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run alembic upgrade head
```

#### Step 6: Deploy

Railway automatically deploys on every git push to main branch.

**Manual Deploy**:
```bash
railway up
```

**Deployment URL**: Railway provides a URL like `https://rollscape-backend-production.up.railway.app`

---

### Option 2: Render

#### Step 1: Create Web Service

1. Go to https://render.com
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `backend` directory

#### Step 2: Configure Service

**Settings**:
- **Name**: rollscape-backend
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Step 3: Add Environment Variables

Same as Railway (see above).

#### Step 4: Add PostgreSQL

1. Click **"New"** → **"PostgreSQL"**
2. Choose plan (free tier available)
3. Copy internal database URL
4. Add as `DATABASE_URL` in environment variables

#### Step 5: Deploy

Click **"Create Web Service"**.

Render deploys automatically on git push.

---

### Option 3: Fly.io

For advanced users wanting more control.

#### Step 1: Install Fly CLI

```bash
# Install
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login
```

#### Step 2: Initialize Fly App

```bash
cd backend
fly launch
```

Follow prompts to create app.

#### Step 3: Configure fly.toml

```toml
app = "rollscape-backend"
primary_region = "lax"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8000"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

#### Step 4: Set Secrets

```bash
fly secrets set OPENAI_API_KEY=sk-proj-...
fly secrets set JWT_SECRET=your-secret
fly secrets set DATABASE_URL=postgresql://...
```

#### Step 5: Deploy

```bash
fly deploy
```

---

## Frontend Deployment

### Vercel (Recommended)

Vercel is built by the creators of Next.js and offers the best integration.

#### Step 1: Import Project

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Vercel auto-detects Next.js

#### Step 2: Configure Build

**Root Directory**: Set to `frontend` (or leave blank if frontend is at root)

**Build Settings** (auto-detected):
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### Step 3: Environment Variables

Add in Vercel dashboard under **Settings** → **Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend-url.railway.app/ws
NEXT_PUBLIC_APP_NAME=RollScape
```

**Important**: 
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Never put secrets (API keys, passwords) in `NEXT_PUBLIC_` variables
- Backend URL should NOT have trailing slash

#### Step 4: Deploy

Click **"Deploy"**.

Vercel automatically deploys on every push to the main branch.

**Preview Deployments**: Every pull request gets a unique preview URL.

#### Step 5: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `rollscape.app`)
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL certificate

**DNS Records** (example for Cloudflare):
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

### Alternative: Netlify

#### Step 1: Import Project

1. Go to https://netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub and select repository

#### Step 2: Configure Build

- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/.next`
- **Build settings**: Auto-detected for Next.js

#### Step 3: Environment Variables

Same as Vercel (see above).

#### Step 4: Deploy

Click **"Deploy site"**.

---

## Database Setup

### Supabase (Recommended)

Supabase provides managed PostgreSQL with built-in features.

#### Step 1: Create Project

1. Go to https://supabase.com
2. Click **"New Project"**
3. Choose organization and region (close to your users)
4. Set database password (save this!)

#### Step 2: Get Connection String

1. Go to **Settings** → **Database**
2. Copy **Connection string** under **URI**
3. Replace `[YOUR-PASSWORD]` with your actual password

**Example**:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
```

#### Step 3: Run Migrations

From your local machine:

```bash
cd backend

# Set environment variable
$env:DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Run migrations
alembic upgrade head
```

#### Step 4: Enable Extensions (Optional)

For advanced features:

```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search
```

#### Step 5: Configure Connection Pooling

For production, use connection pooling:

1. In Supabase, go to **Settings** → **Database**
2. Copy **Connection Pooling** string (port 6543)
3. Use this for your backend's `DATABASE_URL`

**Example**:
```
postgresql://postgres.xxxxxxxxxxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

---

### Alternative: Neon

Neon offers serverless Postgres with generous free tier.

#### Step 1: Create Project

1. Go to https://neon.tech
2. Create new project
3. Choose region

#### Step 2: Get Connection String

Copy the connection string from dashboard.

#### Step 3: Run Migrations

Same as Supabase (see above).

---

## Environment Variables

### Backend Environment Variables

Complete list of environment variables for production:

```env
# ===== DATABASE =====
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# ===== REDIS =====
REDIS_URL=redis://default:password@host:6379
REDIS_MAX_CONNECTIONS=50

# ===== JWT / AUTH =====
JWT_SECRET=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# ===== OPENAI =====
OPENAI_API_KEY=sk-proj-...
OPENAI_USE_MOCK=false
OPENAI_MODEL_DM=gpt-4-turbo-preview
OPENAI_MODEL_PLAYER=gpt-4o-mini
OPENAI_MODEL_ASSISTANT=gpt-4-turbo-preview
DALLE_MODEL=dall-e-3

# ===== CORS =====
ALLOWED_ORIGINS=https://rollscape.app,https://www.rollscape.app
ALLOWED_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
ALLOWED_HEADERS=*

# ===== APP SETTINGS =====
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# ===== STORAGE (if using Supabase Storage) =====
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_BUCKET_NAME=rollscape-images

# ===== RATE LIMITING =====
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=100
```

### Frontend Environment Variables

```env
# ===== API ENDPOINTS =====
NEXT_PUBLIC_API_URL=https://api.rollscape.app
NEXT_PUBLIC_WS_URL=wss://api.rollscape.app/ws

# ===== APP CONFIG =====
NEXT_PUBLIC_APP_NAME=RollScape
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=production

# ===== ANALYTICS (optional) =====
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...

# ===== FEATURES FLAGS (optional) =====
NEXT_PUBLIC_ENABLE_AI_IMAGES=true
NEXT_PUBLIC_ENABLE_PDF_IMPORT=true
NEXT_PUBLIC_ENABLE_VOICE=false
```

### Generating Secure Secrets

For `JWT_SECRET` and other secrets:

**PowerShell**:
```powershell
# Generate random 32-character string
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Python**:
```python
import secrets
print(secrets.token_urlsafe(32))
```

**Online**: Use https://randomkeygen.com (Fort Knox Passwords section)

---

## Domain & SSL

### Configuring Custom Domain

#### Step 1: Purchase Domain

Buy domain from:
- Namecheap
- Google Domains
- Cloudflare Registrar

#### Step 2: Configure DNS

**For Vercel Frontend**:

Add these DNS records at your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

**For Railway Backend**:

Add CNAME record:

```
Type: CNAME
Name: api
Value: your-project.up.railway.app
```

#### Step 3: Add Domain to Vercel

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add `rollscape.app` and `www.rollscape.app`
3. Vercel verifies DNS and issues SSL certificate automatically

#### Step 4: Add Custom Domain to Railway

1. In Railway dashboard, go to **Settings** → **Domains**
2. Click **"Add Custom Domain"**
3. Enter `api.rollscape.app`
4. Railway verifies DNS and issues SSL certificate

### SSL Certificates

**Vercel**: Automatic SSL via Let's Encrypt  
**Railway**: Automatic SSL via Let's Encrypt  
**Render**: Automatic SSL via Let's Encrypt  

No manual configuration needed!

---

## Monitoring & Logging

### Application Monitoring

#### Sentry (Error Tracking)

1. Create account at https://sentry.io
2. Create new project (Python for backend, Next.js for frontend)
3. Install Sentry SDK

**Backend** (`requirements.txt`):
```
sentry-sdk[fastapi]==1.40.0
```

**Backend** (`main.py`):
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx",
    integrations=[FastApiIntegration()],
    environment="production",
    traces_sample_rate=0.1,
)
```

**Frontend**:
```bash
npm install @sentry/nextjs
```

Run setup wizard:
```bash
npx @sentry/wizard -i nextjs
```

#### Logging

**Backend Logging** (`main.py`):
```python
import logging
from logging.handlers import RotatingFileHandler

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('app.log', maxBytes=10000000, backupCount=5),
        logging.StreamHandler()
    ]
)
```

**View Logs**:
- **Railway**: Dashboard → Logs tab
- **Render**: Dashboard → Logs tab
- **Vercel**: Dashboard → Functions → Logs

### Performance Monitoring

#### Vercel Analytics

Free analytics built-in for Vercel deployments.

Enable in `next.config.js`:
```javascript
module.exports = {
  analyticsId: process.env.VERCEL_ANALYTICS_ID,
}
```

#### Google Analytics

Add to `app/layout.tsx`:
```typescript
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_TRACKING_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Uptime Monitoring

Use free uptime monitors:
- **UptimeRobot**: https://uptimerobot.com (free, 50 monitors)
- **Better Uptime**: https://betteruptime.com (free tier available)
- **Pingdom**: https://www.pingdom.com

Monitor these endpoints:
- Frontend: `https://rollscape.app`
- Backend: `https://api.rollscape.app/api/status`

---

## Scaling Considerations

### Database Optimization

#### Indexes

Ensure critical indexes exist:

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Campaign queries
CREATE INDEX idx_campaigns_dm_id ON campaigns(dm_id);
CREATE INDEX idx_campaigns_is_public ON campaigns(is_public);

-- Session queries
CREATE INDEX idx_sessions_campaign_id ON game_sessions(campaign_id);
CREATE INDEX idx_sessions_status ON game_sessions(status);

-- Message queries
CREATE INDEX idx_messages_recipient ON messages(recipient_id, read);
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id);
```

#### Connection Pooling

Use connection pooling in production:

```python
# database.py
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)
```

### Caching Strategy

#### Redis Caching

Cache frequently accessed data:

```python
# Example: Cache user data
import redis
import json

redis_client = redis.from_url(REDIS_URL)

def get_user_cached(user_id: str):
    # Try cache first
    cached = redis_client.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)
    
    # Fetch from database
    user = db.query(User).filter(User.id == user_id).first()
    
    # Cache for 1 hour
    redis_client.setex(
        f"user:{user_id}",
        3600,
        json.dumps(user.dict())
    )
    
    return user
```

### CDN for Static Assets

For AI-generated images, use CDN:

**Option 1: Supabase Storage** (built-in CDN)
**Option 2: Cloudflare R2** (S3-compatible, no egress fees)
**Option 3: AWS S3 + CloudFront**

### Auto-Scaling

**Railway**: Automatic scaling included  
**Render**: Configure in dashboard  
**Fly.io**: Use `fly scale` command

```bash
# Scale to 2-5 instances
fly scale count 2-5
```

---

## Production Checklist

Before going live, verify:

### Security
- [ ] JWT secret is strong and unique
- [ ] CORS is configured with specific origins (not `*`)
- [ ] Rate limiting is enabled
- [ ] SQL injection protection (using SQLAlchemy ORM)
- [ ] Input validation on all endpoints
- [ ] HTTPS enabled (SSL certificates)
- [ ] Environment variables are not committed to Git
- [ ] Database credentials are secure
- [ ] API keys are in environment variables, not code

### Performance
- [ ] Database indexes are created
- [ ] Connection pooling is configured
- [ ] Redis caching is enabled
- [ ] Static assets are CDN-hosted
- [ ] Images are compressed
- [ ] Frontend is minified and optimized

### Monitoring
- [ ] Error tracking (Sentry) is configured
- [ ] Logging is enabled
- [ ] Uptime monitoring is set up
- [ ] Analytics are configured
- [ ] Health check endpoint exists (`/api/status`)

### Functionality
- [ ] All tests pass (`pytest`)
- [ ] Frontend builds without errors
- [ ] WebSocket connections work
- [ ] Database migrations are applied
- [ ] API endpoints return correct responses
- [ ] Authentication works
- [ ] File uploads work (PDF import, images)

### Documentation
- [ ] API documentation is complete
- [ ] User guides are written
- [ ] README is updated with production URLs
- [ ] Environment variables are documented
- [ ] Deployment process is documented

### Backup & Recovery
- [ ] Database backups are automated
- [ ] Backup restoration is tested
- [ ] Disaster recovery plan exists
- [ ] Critical data is backed up off-site

---

## Troubleshooting

### Common Deployment Issues

#### Backend Won't Start

**Check logs** for error messages:

```bash
# Railway
railway logs

# Render
# Check dashboard logs tab

# Fly.io
fly logs
```

**Common causes**:
- Missing environment variables
- Database connection failure
- Port binding issues (use `$PORT` variable)
- Migration not run

#### Database Connection Failed

**Verify connection string**:
```bash
# Test connection
psql $DATABASE_URL
```

**Check**:
- Correct host, port, user, password
- Database exists
- Firewall allows connections
- Connection pooling URL (port 6543 for Supabase)

#### Frontend Can't Reach Backend

**Check**:
- `NEXT_PUBLIC_API_URL` is set correctly
- Backend is deployed and running
- CORS allows frontend domain
- No trailing slash in API URL

**Test backend directly**:
```bash
curl https://api.rollscape.app/api/status
```

#### WebSocket Not Connecting

**Common issues**:
- Using `http://` instead of `ws://`
- Using `https://` instead of `wss://`
- Backend doesn't support WebSocket upgrades
- Firewall blocking WebSocket port

**Test WebSocket**:
```javascript
const ws = new WebSocket('wss://api.rollscape.app/ws');
ws.onopen = () => console.log('Connected!');
ws.onerror = (err) => console.error('Error:', err);
```

#### SSL Certificate Errors

**Verify DNS**:
```bash
nslookup rollscape.app
```

**Check certificate** in browser (click padlock icon).

**Wait time**: DNS propagation can take up to 24-48 hours.

#### Build Failures

**Frontend build fails**:
- Check `npm run build` locally first
- Verify all dependencies are in `package.json`
- Check for TypeScript errors
- Ensure environment variables are set

**Backend build fails**:
- Check `pip install -r requirements.txt` locally
- Verify Python version matches (3.11+)
- Check for syntax errors

---

## Post-Deployment

### Initial Testing

1. **Smoke Test**:
   - Register new account
   - Create character
   - Roll dice
   - Generate AI image
   - Import PDF

2. **Load Test**:
   - Simulate multiple users
   - Test concurrent sessions
   - Monitor response times

3. **Security Test**:
   - Run security audit (e.g., OWASP ZAP)
   - Check for exposed secrets
   - Verify rate limiting

### Ongoing Maintenance

**Weekly**:
- Review error logs
- Check uptime reports
- Monitor API usage
- Review user feedback

**Monthly**:
- Update dependencies
- Review database performance
- Optimize slow queries
- Analyze user metrics

**Quarterly**:
- Security audit
- Performance optimization
- Infrastructure cost review
- Disaster recovery drill

---

## Cost Estimation

### Free Tier (Development/Testing)

- **Vercel**: Free (hobby plan)
- **Railway**: $5/month (includes $5 credit)
- **Supabase**: Free (2 projects)
- **Upstash**: Free (10k requests/day)
- **Total**: ~$5/month

### Production (Small Scale, <100 users)

- **Vercel**: $20/month (Pro plan)
- **Railway**: $10-20/month (usage-based)
- **Supabase**: Free tier sufficient
- **Upstash**: Free tier sufficient
- **Domain**: $12/year
- **Total**: ~$30-40/month

### Production (Medium Scale, <1000 users)

- **Vercel**: $20/month
- **Railway**: $30-50/month
- **Supabase**: $25/month (Pro plan)
- **Upstash**: $10/month
- **Sentry**: $26/month
- **Domain**: $12/year
- **Total**: ~$110-130/month

### Production (Large Scale, 1000+ users)

- **Vercel**: $20-50/month
- **Railway**: $100-200/month (or migrate to dedicated)
- **Supabase**: $25-100/month
- **Upstash**: $20-50/month
- **Sentry**: $70/month
- **CDN/Storage**: $20-50/month
- **Total**: ~$255-540/month

**Optimization tip**: As you scale, consider migrating to dedicated infrastructure (AWS, GCP) for cost savings.

---

## Additional Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

**Deployment Guide Version**: 1.0.0  
**Last Updated**: January 2024

Good luck with your deployment! 🚀
