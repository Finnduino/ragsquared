# Git Sync Guide - Before and After Commands

This guide provides step-by-step commands for syncing with git, especially when the Flask server is running and may lock database files.

## 🔄 Complete Sync Workflow

### Before Syncing (Pre-Sync Checklist)

#### 1. Check Git Status
```powershell
git status
```
**Purpose:** See what changes you have locally and if you're ahead/behind the remote.

#### 2. Check if Flask Server is Running
```powershell
netstat -ano | findstr :5000
```
**Purpose:** Find the process ID (PID) of the Flask server if it's running on port 5000.

**Expected output if running:**
```
TCP    127.0.0.1:5000         0.0.0.0:0              LISTENING       86412
```
The last number (86412) is the PID.

#### 3. Stop Flask Server (if running)
```powershell
# Option 1: Stop by PID (replace 86412 with actual PID from step 2)
Stop-Process -Id 86412

# Option 2: Stop all Python processes (more aggressive)
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force
```
**Purpose:** Release the database file lock so git can update it.

#### 4. Verify Flask Server is Stopped
```powershell
netstat -ano | findstr :5000
```
**Purpose:** Confirm port 5000 is free (should return nothing if stopped).

---

### During Sync (Git Commands)

#### Pull Changes from Remote

**Basic pull:**
```powershell
git pull origin main
```

**Pull with merge strategy (if branches diverged):**
```powershell
git pull origin main --no-edit
```

**Pull with rebase (alternative to merge):**
```powershell
git pull --rebase origin main
```

**Check what will be pulled (without actually pulling):**
```powershell
git fetch origin
git log HEAD..origin/main
```

#### Push Changes to Remote

**Basic push:**
```powershell
git push origin main
```

**Push with force (⚠️ use with caution, only if you're sure):**
```powershell
git push --force origin main
```

**Check what will be pushed (without actually pushing):**
```powershell
git log origin/main..HEAD
```

---

### After Syncing (Post-Sync Checklist)

#### 1. Verify Git Status
```powershell
git status
```
**Purpose:** Confirm sync completed successfully and check if you're ahead/behind.

#### 2. Check for Merge Conflicts
```powershell
git status
```
**Look for:** "Unmerged paths" or conflict markers in files.

**If conflicts exist:**
```powershell
# See which files have conflicts
git diff --name-only --diff-filter=U

# Resolve conflicts manually, then:
git add <resolved-files>
git commit
```

#### 3. Verify Database File
```powershell
# Check if database file exists and is accessible
Test-Path data/app.db
```
**Purpose:** Ensure database file wasn't corrupted during merge.

#### 4. Restart Flask Server

**Activate conda environment:**
```powershell
conda activate ragsquared
```

**Start Flask server:**
```powershell
# Using full path (if conda activate doesn't work)
C:\Users\Miro\anaconda3\envs\ragsquared\python.exe -m flask --app backend.app run --debug

# Or if python is in PATH after conda activate
python -m flask --app backend.app run --debug
```

#### 5. Verify Flask Server Started
```powershell
# Check if server is listening
netstat -ano | findstr :5000

# Test health endpoint
curl http://localhost:5000/healthz
```

---

## 📋 Quick Reference: Complete Sync Workflow

### Pulling Changes (Getting updates from remote)

```powershell
# 1. Check status
git status

# 2. Stop Flask server
netstat -ano | findstr :5000
Stop-Process -Id <PID>  # Replace <PID> with actual PID

# 3. Pull changes
git pull origin main

# 4. Verify
git status

# 5. Restart Flask server
conda activate ragsquared
C:\Users\Miro\anaconda3\envs\ragsquared\python.exe -m flask --app backend.app run --debug
```

### Pushing Changes (Sending updates to remote)

```powershell
# 1. Check status
git status

# 2. Commit any uncommitted changes (if needed)
git add .
git commit -m "Your commit message"

# 3. Stop Flask server (if running)
netstat -ano | findstr :5000
Stop-Process -Id <PID>

# 4. Push changes
git push origin main

# 5. Verify
git status

# 6. Restart Flask server
conda activate ragsquared
C:\Users\Miro\anaconda3\envs\ragsquared\python.exe -m flask --app backend.app run --debug
```

---

## 🚨 Troubleshooting

### Error: "unable to unlink old 'data/app.db': Invalid argument"

**Cause:** Database file is locked by Flask server or another process.

**Solution:**
```powershell
# 1. Find and stop Flask server
netstat -ano | findstr :5000
Stop-Process -Id <PID>

# 2. Wait a moment for file to unlock
Start-Sleep -Seconds 2

# 3. Try pull again
git pull origin main
```

### Error: "Authentication failed" when pushing

**Cause:** GitHub requires Personal Access Token (PAT) instead of password.

**Solution:**
1. Generate a PAT: https://github.com/settings/tokens
2. Use token as password when prompted
3. Or configure credential helper:
```powershell
git config --global credential.helper wincred
```

### Error: "Your branch and 'origin/main' have diverged"

**Cause:** Local and remote have different commits.

**Solution:**
```powershell
# Option 1: Merge (creates merge commit)
git pull origin main --no-edit

# Option 2: Rebase (cleaner history)
git pull --rebase origin main

# Option 3: See what's different first
git fetch origin
git log HEAD..origin/main  # Remote commits not in local
git log origin/main..HEAD  # Local commits not in remote
```

### Error: "Port 5000 already in use" when restarting

**Cause:** Flask server didn't fully stop or another process is using the port.

**Solution:**
```powershell
# Find all processes using port 5000
netstat -ano | findstr :5000

# Stop all Python processes
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force

# Or use a different port
C:\Users\Miro\anaconda3\envs\ragsquared\python.exe -m flask --app backend.app run --debug --port 5001
```

---

## 💡 Pro Tips

1. **Always check git status first** - Know what you're working with before syncing.

2. **Stop Flask before syncing** - Prevents database lock issues.

3. **Use `git fetch` to preview** - See what will change without actually pulling:
   ```powershell
   git fetch origin
   git log HEAD..origin/main --oneline
   ```

4. **Commit often, sync regularly** - Reduces merge conflicts.

5. **Use descriptive commit messages** - Helps track changes:
   ```powershell
   git commit -m "Add feature X" -m "Detailed description of changes"
   ```

6. **Keep Flask server in separate terminal** - Makes it easier to stop/restart.

7. **Use `--no-edit` for merge commits** - Accepts default merge message automatically.

---

## 🔍 Useful Git Commands Reference

```powershell
# View commit history
git log --oneline --graph --all

# See what files changed
git diff --name-only

# See detailed changes
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main

# See all branches
git branch -a

# Stash changes temporarily
git stash
git stash pop
```

---

## 📝 Notes

- **Database files** (`data/app.db`) are binary and will show as changed even if only metadata changed
- **Conda environment** needs to be activated before running Flask
- **Port 5000** is the default Flask port; change with `--port` flag if needed
- **Git credentials** are stored globally, so you only need to set them once

