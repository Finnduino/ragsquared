# Deployment Guide

This guide covers deploying the AI Auditing System to cloud platforms that support Docker containers with persistent storage.

## ⚠️ Important: Vercel Limitation

**Vercel does NOT support Docker containers or persistent storage.** Vercel is a serverless platform designed for Next.js applications only. For this application, you need a platform that supports:
- Docker containers
- Persistent volumes (for ChromaDB and SQLite)
- Long-running processes

## Recommended Platforms

### 1. Railway (Recommended - Easiest)

**Best for**: Quick deployment, free tier available, automatic HTTPS

**Steps:**

1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub

2. **Create new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure service**:
   - Railway will auto-detect the Dockerfile
   - Add environment variables in the "Variables" tab:
     ```
     OPENROUTER_API_KEY=sk-or-v1-...
     LLM_MODEL_COMPLIANCE=google/gemini-2.5-flash
     EMBEDDING_MODEL=text-embedding-3-large
     DATA_ROOT=/app/data
     DATABASE_URL=sqlite:///data/app.db
     FLASK_ENV=production
     FLASK_DEBUG=0
     BACKEND_URL=http://localhost:5000
     ```
   - **Important**: Set `BACKEND_URL=http://localhost:5000` so the frontend can proxy API calls to the backend (both run in the same container)

4. **Add persistent volume** (CRITICAL for data persistence):
   - Go to "Settings" → "Volumes"
   - Click "+ Add Volume"
   - Mount path: `/app/data` (exactly this path)
   - Size: Based on your plan (Free: 0.5GB, Hobby: 5GB, Pro: 50GB)
   - Click "Add"
   - **📖 See [RAILWAY_SETUP.md](RAILWAY_SETUP.md) for detailed volume setup**

5. **Get HTTPS/TLS** (automatic):
   - **Option A (Easiest)**: After deployment, click "Generate Domain" in the service dashboard
   - **Option B**: Add custom domain in Settings → Networking → Public Networking
   - Railway automatically issues Let's Encrypt SSL certificates
   - **📖 See [RAILWAY_SETUP.md](RAILWAY_SETUP.md) for detailed TLS setup**

6. **Deploy**:
   - Railway will automatically build and deploy
   - Your app will be available at the generated domain with HTTPS

**Cost**: Free tier available, then ~$5-20/month depending on usage

---

### 2. Render (Good Free Tier)

**Best for**: Free tier, easy setup, automatic HTTPS

**📖 For detailed step-by-step instructions, see [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)**

**Quick Steps:**

1. **Sign up**: Go to [render.com](https://render.com) and sign up

2. **Create new Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect your Dockerfile

3. **Configure**:
   - **Environment**: `Docker` (auto-detected)
   - **Dockerfile Path**: `./Dockerfile` (auto-detected)
   - No build/start commands needed - Render uses your Dockerfile

4. **Add environment variables**:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   LLM_MODEL_COMPLIANCE=google/gemini-2.5-flash
   EMBEDDING_MODEL=text-embedding-3-large
   BACKEND_URL=http://localhost:5000
   DATA_ROOT=/app/data
   DATABASE_URL=sqlite:///data/app.db
   ```

5. **Add persistent disk** (CRITICAL!):
   - Go to "Disk" section
   - Click "Add Disk"
   - Mount path: `/app/data`
   - Size: 10GB

6. **Choose plan**: Free tier (spins down) or Starter ($7/month, always-on)

7. **Deploy**: Click "Create Web Service"

**Cost**: Free tier available (with limitations), then ~$7-25/month

**Note**: Render automatically sets the `PORT` environment variable - your entrypoint script handles this.

---

### 3. Fly.io (Pay-as-You-Go)

**Best for**: Global edge deployment, pay-as-you-go pricing

**Steps:**

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Create app**:
   ```bash
   fly launch --name ragsquared-app
   ```

4. **Create `fly.toml`** (if not auto-generated):
   ```toml
   app = "ragsquared-app"
   primary_region = "iad"

   [build]
     dockerfile = "Dockerfile"

   [[services]]
     internal_port = 3000
     protocol = "tcp"

     [[services.ports]]
       port = 80
       handlers = ["http"]
       force_https = true

     [[services.ports]]
       port = 443
       handlers = ["tls", "http"]

   [env]
     DATA_ROOT = "/app/data"
     DATABASE_URL = "sqlite:///data/app.db"
     FLASK_ENV = "production"
     FLASK_DEBUG = "0"

   [[mounts]]
     source = "ragsquared_data"
     destination = "/app/data"
   ```

5. **Create volume**:
   ```bash
   fly volumes create ragsquared_data --size 10 --region iad
   ```

6. **Set secrets**:
   ```bash
   fly secrets set OPENROUTER_API_KEY=sk-or-v1-...
   fly secrets set LLM_MODEL_COMPLIANCE=google/gemini-2.5-flash
   fly secrets set EMBEDDING_MODEL=text-embedding-3-large
   ```

7. **Deploy**:
   ```bash
   fly deploy
   ```

**Cost**: Pay-as-you-go, typically $5-15/month

---

### 4. DigitalOcean App Platform

**Best for**: Reliable, predictable pricing, good documentation

**Steps:**

1. **Sign up**: Go to [digitalocean.com](https://digitalocean.com)

2. **Create App**:
   - Go to "Apps" → "Create App"
   - Connect GitHub repository

3. **Configure**:
   - **Type**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **HTTP Port**: 3000

4. **Add environment variables**:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   LLM_MODEL_COMPLIANCE=google/gemini-2.5-flash
   EMBEDDING_MODEL=text-embedding-3-large
   DATA_ROOT=/app/data
   DATABASE_URL=sqlite:///data/app.db
   BACKEND_URL=http://localhost:5000
   ```

5. **Add persistent storage**:
   - Go to "Components" → "Add Component" → "Database" or "Volume"
   - Create a volume and mount at `/app/data`

6. **Deploy**:
   - Click "Create Resources"
   - DigitalOcean will build and deploy

**Cost**: $5-12/month for basic plan

---

## Environment Variables Checklist

Set these in your platform's environment variables section:

### Required:
```bash
OPENROUTER_API_KEY=sk-or-v1-...  # Or LLM_API_KEY
LLM_MODEL_COMPLIANCE=google/gemini-2.5-flash
EMBEDDING_MODEL=text-embedding-3-large
BACKEND_URL=http://localhost:5000  # Frontend proxies to backend
```

### Optional (have defaults):
```bash
DATA_ROOT=/app/data
DATABASE_URL=sqlite:///data/app.db
FLASK_ENV=production
FLASK_DEBUG=0
PORT=3000  # Frontend port (cloud platforms may set this automatically)
CHUNK_SIZE=800
CHUNK_OVERLAP=80
LOG_LEVEL=INFO
```

---

## Persistent Storage Setup

**Critical**: You MUST configure persistent storage for `/app/data` to preserve:
- ChromaDB vector database (most important!)
- SQLite database
- Uploaded documents
- Cached embeddings

Without this, all data will be lost on container restart!

---

## Post-Deployment

1. **Verify health**: Check `https://your-app-url/healthz`
2. **Test upload**: Upload a test document
3. **Check logs**: Monitor for any errors
4. **Backup strategy**: Set up regular backups of the `/app/data` volume

---

## Cost Comparison

| Platform | Free Tier | Paid Starting | Best For |
|----------|-----------|---------------|----------|
| Railway | ✅ Yes | $5/month | Easiest setup |
| Render | ✅ Yes | $7/month | Free tier |
| Fly.io | ❌ No | ~$5/month | Global edge |
| DigitalOcean | ❌ No | $5/month | Reliability |

---

## Troubleshooting

### Container won't start
- Check logs in platform dashboard
- Verify all environment variables are set
- Ensure persistent volume is mounted

### ChromaDB data lost
- Verify volume is properly mounted at `/app/data`
- Check volume size (may be full)
- Restore from backup if available

### Out of memory
- Increase instance size (2GB+ RAM recommended)
- Check platform resource limits

---

## Recommended: Railway

For the easiest deployment experience, I recommend **Railway**:
- ✅ Automatic Docker detection
- ✅ Easy persistent volumes
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Simple environment variable management
- ✅ GitHub integration

