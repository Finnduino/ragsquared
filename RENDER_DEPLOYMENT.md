# Deploying to Render - Step-by-Step Guide

This guide walks you through deploying the AI Auditing System to Render.

## Prerequisites

1. A GitHub account
2. Your code pushed to a GitHub repository
3. A Render account (sign up at [render.com](https://render.com))

## Step 1: Sign Up / Log In to Render

1. Go to [render.com](https://render.com)
2. Sign up or log in (you can use GitHub to sign up)
3. Verify your email if required

## Step 2: Create a New Web Service

1. In your Render dashboard, click **"New +"** in the top right
2. Select **"Web Service"**
3. Connect your GitHub account if you haven't already
4. Select your repository (`ragsquared` or whatever you named it)
5. Click **"Connect"**

## Step 3: Configure the Service

Render should auto-detect your Dockerfile, but here's what to configure:

### Basic Settings

- **Name**: `ragsquared-app` (or any name you prefer)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (or `.` if needed)

### Build & Deploy Settings

- **Environment**: `Docker`
- **Dockerfile Path**: `./Dockerfile` (should auto-detect)
- **Docker Build Context**: `.` (root directory)
- **Docker Command**: Leave empty (uses Dockerfile CMD)

**Note**: Render will automatically:
- Build using your Dockerfile
- Expose port 3000 (the frontend)
- Run the container with your entrypoint script

### Environment Variables

Click **"Add Environment Variable"** and add these one by one:

**Required:**
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
LLM_MODEL_COMPLIANCE=google/gemini-2.5-flash
EMBEDDING_MODEL=text-embedding-3-large
BACKEND_URL=http://localhost:5000
```

**Optional (with defaults):**
```
DATA_ROOT=/app/data
DATABASE_URL=sqlite:///data/app.db
FLASK_ENV=production
FLASK_DEBUG=0
CHUNK_SIZE=800
CHUNK_OVERLAP=80
LOG_LEVEL=INFO
```

**Important Notes:**
- Replace `sk-or-v1-your-key-here` with your actual OpenRouter API key
- If using OpenAI embeddings, also add: `OPENAI_API_KEY=sk-your-key-here`
- The `PORT` variable is automatically set by Render (you don't need to set it)

## Step 4: Add Persistent Disk (CRITICAL!)

This is essential for ChromaDB and database persistence:

1. Scroll down to **"Disk"** section
2. Click **"Add Disk"**
3. Configure:
   - **Name**: `ragsquared-data` (or any name)
   - **Mount Path**: `/app/data`
   - **Size**: Start with `10 GB` (you can increase later)
4. Click **"Save"**

**⚠️ Without this disk, all your data (ChromaDB, database, uploads) will be lost on every deploy!**

## Step 5: Choose a Plan

- **Free Tier**: Good for testing, but has limitations (spins down after inactivity)
- **Starter Plan ($7/month)**: Always-on, better for production
- **Standard Plan ($25/month)**: More resources, better performance

For production use, I recommend **Starter Plan** at minimum.

## Step 6: Deploy

1. Review all settings
2. Click **"Create Web Service"**
3. Render will start building your Docker image
4. Watch the build logs - first build takes 5-10 minutes
5. Once deployed, you'll get a URL like: `https://ragsquared-app.onrender.com`

## Step 7: Verify Deployment

1. **Check Health**: Visit `https://your-app.onrender.com/healthz`
   - Should return JSON with database status

2. **Test Frontend**: Visit `https://your-app.onrender.com`
   - Should show your application

3. **Check Logs**: In Render dashboard → "Logs" tab
   - Look for "AI Auditing System is running!"
   - Check for any errors

## Step 8: Configure Custom Domain (Optional)

1. Go to **"Settings"** → **"Custom Domains"**
2. Add your domain
3. Follow DNS configuration instructions
4. Render will automatically provision SSL certificate

## Troubleshooting

### Build Fails

**Check logs for:**
- Missing environment variables
- Docker build errors
- Out of memory during build

**Solutions:**
- Ensure all required env vars are set
- Check Dockerfile syntax
- Try increasing build resources in plan settings

### Service Won't Start

**Check logs for:**
- Database migration errors
- Port binding issues
- Missing dependencies

**Solutions:**
- Check that persistent disk is mounted at `/app/data`
- Verify environment variables are correct
- Check logs for specific error messages

### ChromaDB Data Lost

**Cause:** Persistent disk not mounted or container restarted without disk

**Solutions:**
- Verify disk is mounted at `/app/data` in Settings
- Check disk size (may be full)
- Restore from backup if available

### Out of Memory

**Symptoms:** Service crashes, slow performance

**Solutions:**
- Upgrade to a plan with more RAM (2GB+ recommended)
- Check logs for memory errors
- Consider optimizing chunk sizes

### Service Spins Down (Free Tier)

**Issue:** Free tier services spin down after 15 minutes of inactivity

**Solutions:**
- Upgrade to Starter plan ($7/month) for always-on
- Use a service like UptimeRobot to ping your service every 10 minutes
- Accept that first request after spin-down will be slow (~30 seconds)

## Monitoring

### View Logs

1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. View real-time logs
4. Download logs if needed

### Metrics

1. Click **"Metrics"** tab
2. View:
   - CPU usage
   - Memory usage
   - Request rate
   - Response times

### Alerts

1. Go to **"Settings"** → **"Alerts"**
2. Configure email alerts for:
   - Service down
   - High error rate
   - High resource usage

## Backup Strategy

### Manual Backup

1. SSH into your service (if enabled)
2. Or use Render's shell access
3. Backup `/app/data` directory

### Automated Backups

Consider setting up:
- Render's scheduled jobs to backup data
- External backup service
- Git-based backup for configuration

## Updating Your Deployment

### Automatic Deploys

Render automatically deploys when you push to your connected branch:
1. Push changes to GitHub
2. Render detects changes
3. Builds new Docker image
4. Deploys automatically

### Manual Deploy

1. Go to your service
2. Click **"Manual Deploy"**
3. Select branch/commit
4. Click **"Deploy"**

## Cost Optimization

### Free Tier Tips

- Use free embeddings: `EMBEDDING_MODEL=all-mpnet-base-v2`
- Accept spin-down delays
- Monitor usage to avoid overages

### Starter Plan Tips

- Always-on service
- Better performance
- More reliable for production

## Environment Variables Reference

### Required for Full Functionality

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | API key for LLM calls | `sk-or-v1-...` |
| `LLM_MODEL_COMPLIANCE` | LLM model name | `google/gemini-2.5-flash` |
| `EMBEDDING_MODEL` | Embedding model | `text-embedding-3-large` |
| `BACKEND_URL` | Backend URL for frontend proxy | `http://localhost:5000` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_ROOT` | `/app/data` | Data directory path |
| `DATABASE_URL` | `sqlite:///data/app.db` | Database connection |
| `FLASK_ENV` | `production` | Flask environment |
| `CHUNK_SIZE` | `800` | Document chunk size |
| `CHUNK_OVERLAP` | `80` | Chunk overlap |
| `LOG_LEVEL` | `INFO` | Logging level |

## Next Steps

1. ✅ Deploy to Render
2. ✅ Verify it's working
3. ✅ Test uploading documents
4. ✅ Test running audits
5. ✅ Set up monitoring/alerts
6. ✅ Configure custom domain (optional)
7. ✅ Set up backups

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Your App Logs**: Check Render dashboard → Logs

---

**Quick Checklist:**

- [ ] GitHub repo connected
- [ ] Web service created
- [ ] Environment variables set
- [ ] Persistent disk mounted at `/app/data`
- [ ] Plan selected (Free/Starter/Standard)
- [ ] Service deployed successfully
- [ ] Health check passes (`/healthz`)
- [ ] Frontend accessible
- [ ] Test upload works
- [ ] Data persists after restart

