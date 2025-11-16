# Railway Troubleshooting Guide

## How to See Actual Error Logs

The logs you're seeing in Railway are **HTTP access logs** (from the edge/proxy), not the actual application logs. To see the real error:

### Method 1: Railway Dashboard (Easiest)

1. Go to your Railway project dashboard
2. Click on your service
3. Click on the **"Deployments"** tab
4. Click on the latest deployment
5. Scroll down to see the **"Build Logs"** and **"Deploy Logs"**
6. Look for Python/Flask error messages

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# View logs
railway logs --service your-service-name
```

### Method 3: Railway Service Logs

1. In Railway dashboard, go to your service
2. Click on the **"Logs"** tab (or look for a terminal/logs icon)
3. This shows real-time application logs
4. Filter by searching for "ERROR" or "Exception"

## Common Upload Issues

### Issue: Request Timeout

**Symptoms:**
- Upload starts but fails after ~30-60 seconds
- No error message, just hangs
- Railway shows 504 Gateway Timeout

**Railway Timeout Limits:**
- Free/Hobby: 60 seconds
- Pro: 300 seconds (5 minutes)

**Solution:**
- For large files, Railway may timeout before processing completes
- Consider processing uploads asynchronously (background jobs)
- Or upgrade to Pro plan for longer timeouts

### Issue: File Size Limit

**Symptoms:**
- Error: "Request entity too large"
- Upload fails immediately

**Solution:**
- Check file size (max 50MB configured)
- Railway may have additional limits

### Issue: Permission Errors

**Symptoms:**
- "Permission denied" errors in logs
- Cannot create upload directory

**Solution:**
1. Add environment variable: `RAILWAY_RUN_UID=0`
2. Redeploy service

### Issue: Missing Environment Variables

**Symptoms:**
- "Configuration error" messages
- Missing API key errors

**Solution:**
- Check all required environment variables are set:
  - `OPENROUTER_API_KEY` or `LLM_API_KEY`
  - `EMBEDDING_MODEL`
  - `DATA_ROOT=/app/data`
  - `DATABASE_URL=sqlite:///data/app.db`

## Debugging Steps

1. **Check Service Logs** (not HTTP access logs)
   - Look for Python exceptions, stack traces
   - Search for "ERROR", "Exception", "Traceback"

2. **Check Environment Variables**
   - Verify all required vars are set
   - Check for typos in variable names

3. **Test with Small File First**
   - Try uploading a very small .txt file (< 1KB)
   - If small files work, it's likely a timeout or size issue

4. **Check Volume Mount**
   - Verify volume is mounted at `/app/data`
   - Check volume has available space

5. **Check Railway Service Status**
   - Ensure service is running (not crashed)
   - Check deployment status

## Getting Help

When asking for help, provide:
1. **Actual error logs** from Railway service logs (not HTTP access logs)
2. **File size** you're trying to upload
3. **File type** (.pdf, .txt, etc.)
4. **Environment variables** (mask sensitive values)
5. **Railway plan** (Free, Hobby, Pro)

