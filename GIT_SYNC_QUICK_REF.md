# Git Sync Quick Reference

## 🔄 Pull Changes (Get updates from remote)

```powershell
# 1. Check status
git status

# 2. Stop Flask (if running)
$pid = (netstat -ano | findstr :5000 | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
if ($pid) { Stop-Process -Id $pid }

# 3. Pull
git pull origin main

# 4. Restart Flask
conda activate ragsquared
C:\Users\Miro\anaconda3\envs\ragsquared\python.exe -m flask --app backend.app run --debug
```

## ⬆️ Push Changes (Send updates to remote)

```powershell
# 1. Check status
git status

# 2. Commit (if needed)
git add .
git commit -m "Your message"

# 3. Stop Flask (if running)
$pid = (netstat -ano | findstr :5000 | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
if ($pid) { Stop-Process -Id $pid }

# 4. Push
git push origin main

# 5. Restart Flask
conda activate ragsquared
C:\Users\Miro\anaconda3\envs\ragsquared\python.exe -m flask --app backend.app run --debug
```

## 🛑 Stop Flask Server

```powershell
# Find and stop
$pid = (netstat -ano | findstr :5000 | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
if ($pid) { Stop-Process -Id $pid }
```

## ▶️ Start Flask Server

```powershell
conda activate ragsquared
C:\Users\Miro\anaconda3\envs\ragsquared\python.exe -m flask --app backend.app run --debug
```

## 🔍 Check Status

```powershell
# Git status
git status

# Flask running?
netstat -ano | findstr :5000

# Flask health
curl http://localhost:5000/healthz
```

