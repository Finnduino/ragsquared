# Railway Setup Guide - Volumes & TLS

This guide covers the two essential setup steps for Railway: **Data Persistence** and **TLS Certificates**.

## 1. Data Persistence (Volumes)

### Why You Need This

Your application stores critical data in `/app/data`:
- **ChromaDB** vector database (all embeddings)
- **SQLite** database (all metadata)
- **Uploaded documents**
- **Cached embeddings**

Without a volume, all this data is lost on every deployment!

### Setup Steps

1. **Go to your Railway service**
   - Open your service in Railway dashboard
   - Click on the **"Settings"** tab

2. **Add a Volume**
   - Scroll down to **"Volumes"** section
   - Click **"+ Add Volume"**
   - Configure:
     - **Mount Path**: `/app/data` (exactly this path)
     - **Size**: 
       - Free/Trial: 0.5GB (default, can't change)
       - Hobby: 5GB (default)
       - Pro: 50GB (default, can grow to 250GB)
   - Click **"Add"**

3. **Verify**
   - The volume should appear in the Volumes section
   - Mount path should show `/app/data`
   - Your next deployment will use this volume

### That's It!

Your application is already configured to use `/app/data` - no code changes needed. Railway will automatically mount the volume at that path.

### Important Notes

- **First deployment**: The volume will be empty, so you'll start fresh
- **Subsequent deployments**: All data persists automatically
- **Backups**: Railway supports manual and automated backups (see Railway docs)
- **Size limits**: Based on your plan (see Railway docs for details)

---

## 2. TLS Certificate (HTTPS)

### Why You Need This

Railway automatically provides HTTPS for all domains. You just need to set up a domain.

### Option A: Railway-Provided Domain (Easiest)

1. **Deploy your service first**
   - Make sure your service is deployed and running
   - Railway will detect if your app is listening correctly

2. **Generate Domain**
   - In your service dashboard, look for the prompt: **"Generate Domain"**
   - Or go to **Settings** → **Networking** → **Public Networking**
   - Click **"Generate Domain"**
   - Railway will create a domain like: `your-app-name.up.railway.app`

3. **That's It!**
   - Railway automatically:
     - Issues a Let's Encrypt SSL certificate
     - Enables HTTPS
     - Your app is accessible at `https://your-app-name.up.railway.app`

### Option B: Custom Domain (For Production)

1. **Add Custom Domain**
   - Go to **Settings** → **Networking** → **Public Networking**
   - Click **"+ Custom Domain"**
   - Enter your domain (e.g., `example.com` or `app.example.com`)

2. **Configure DNS**
   - Railway will show you a CNAME value (e.g., `abc123.up.railway.app`)
   - Go to your DNS provider (Cloudflare, Namecheap, etc.)
   - Add a CNAME record:
     - **Name**: `@` (for root domain) or `app` (for subdomain)
     - **Target**: The CNAME value Railway provided
     - **TTL**: Auto or 3600

3. **Wait for Verification**
   - Railway will verify your DNS (usually 1-5 minutes)
   - You'll see a green checkmark when verified

4. **Automatic SSL**
   - Railway automatically issues a Let's Encrypt certificate
   - Your domain is accessible at `https://yourdomain.com`

### Important Notes

- **No code changes needed**: Your app already handles the `PORT` variable correctly
- **Automatic HTTPS**: Railway handles SSL certificates automatically
- **Cloudflare users**: If using Cloudflare proxy (orange cloud), set SSL/TLS to **"Full"** (not "Full Strict")
- **DNS propagation**: Can take up to 72 hours, but usually works in minutes

---

## Quick Checklist

### Data Persistence
- [ ] Service deployed on Railway
- [ ] Volume added at `/app/data`
- [ ] Volume size appropriate for your plan
- [ ] Verified data persists after redeploy

### TLS Certificate
- [ ] Service deployed and running
- [ ] Railway-provided domain generated OR custom domain added
- [ ] DNS configured (if custom domain)
- [ ] Domain verified (green checkmark)
- [ ] HTTPS working (test in browser)

---

## Troubleshooting

### Volume Issues

**Problem**: Data lost after deployment
- **Solution**: Verify volume is mounted at `/app/data` in Settings → Volumes

**Problem**: Permission errors when uploading files
- **Symptoms**: 
  - "Permission denied" errors when uploading documents or legislation
  - Errors like "Permission denied creating upload directory" or "Permission denied writing file"
- **Solution**: 
  1. Go to your Railway service → **Settings** → **Variables**
  2. Add environment variable: `RAILWAY_RUN_UID=0`
  3. Redeploy your service
  4. This allows the container to run as root, which is needed for writing to Railway volumes

**Problem**: Volume full
- **Solution**: Upgrade plan or contact Railway support to increase size

### TLS Issues

**Problem**: Domain not working
- **Solution**: 
  - Check DNS propagation: `dig yourdomain.com` or use online DNS checker
  - Verify CNAME record is correct
  - Wait a few minutes for DNS to propagate

**Problem**: SSL certificate not issued
- **Solution**: 
  - Wait 5-10 minutes after domain verification
  - Check Railway dashboard for certificate status
  - Railway issues certificates automatically - no manual action needed

**Problem**: Cloudflare ERR_TOO_MANY_REDIRECTS
- **Solution**: 
  - Ensure Cloudflare proxy (orange cloud) is enabled
  - Set SSL/TLS mode to **"Full"** (not "Full Strict")
  - Or disable Cloudflare proxy and use DNS-only (grey cloud)

---

## Summary

**Data Persistence**: Add volume at `/app/data` in Railway settings - that's it!

**TLS Certificate**: Generate Railway domain or add custom domain - Railway handles SSL automatically!

No code changes needed - your Docker setup already works perfectly with Railway.

