# 🔄 ATHLETIQ - COMPLETE GITHUB RESTORE AUTOMATION

## 🎯 Overview
This folder contains automated scripts to completely restore your Athletiq project from GitHub, removing all local changes and getting a fresh copy with all dependencies installed.

## 🚀 Quick Start (Recommended)

### Option 1: One-Click Restore
**Just double-click:** `quick-restore.bat`
- ✅ Fastest method
- ✅ Automatic execution
- ✅ No prompts needed
- ✅ Backs up changes automatically

### Option 2: Interactive Restore
**Double-click:** `complete-github-restore.bat`
- ✅ Step-by-step progress
- ✅ Confirmation prompts
- ✅ Detailed error messages
- ✅ Full status reporting

### Option 3: PowerShell (Advanced)
**Right-click → Run with PowerShell:** `complete-github-restore.ps1`
- ✅ Most robust error handling
- ✅ Colored output
- ✅ Advanced features
- ✅ Detailed logging

## 📋 What Each Script Does

### 🔄 All scripts perform these actions:
1. **📦 Backup** - Saves your current changes to git stash
2. **📥 Fetch** - Downloads latest code from GitHub
3. **🔄 Reset** - Resets your local code to match GitHub exactly
4. **🧹 Clean** - Removes all untracked files
5. **📦 Install** - Installs backend dependencies (`npm install`)
6. **📦 Install** - Installs frontend dependencies (`npm install`)
7. **✅ Verify** - Confirms everything is set up correctly

## ⚠️ Important Warnings

### 🚨 **THIS WILL DELETE ALL LOCAL CHANGES!**
- Any uncommitted changes will be lost
- Modified files will be overwritten
- New files will be deleted
- **BUT**: Your changes are backed up in git stash first

### 💾 **Your Changes Are Safe**
Even though local changes are deleted, they're preserved in git stash:
```bash
git stash list          # See all stashed changes
git stash show -p       # View what was stashed
git stash pop           # Restore your changes (if needed)
```

## 🔧 System Requirements

- ✅ **Git** installed and configured
- ✅ **Node.js** and npm installed
- ✅ **Internet connection** for GitHub access
- ✅ **GitHub repository** set up as remote

## 🛠️ Troubleshooting

### ❌ "Git is not installed"
**Solution:** Install Git from https://git-scm.com/download/win

### ❌ "Not in a git repository"
**Solution:** Navigate to your Athletiq project folder first

### ❌ "No remote repository found"
**Solution:** Set up your GitHub remote:
```bash
git remote add origin https://github.com/yourusername/athletiq.git
```

### ❌ "Failed to fetch from remote"
**Solutions:**
- Check internet connection
- Verify GitHub repository URL
- Check if you have access to the repository
- Try: `git remote -v` to see current remotes

### ❌ "npm install failed"
**Solutions:**
- Check if Node.js is installed
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and try again

## 📊 File Structure After Restore

```
e:\Athletiq\
├── athletiq-backend/
│   ├── src/
│   ├── node_modules/        ← Installed automatically
│   ├── package.json
│   └── ...
├── atheletiq-frontend/
│   └── athletiq-web/
│       ├── src/
│       ├── node_modules/    ← Installed automatically
│       ├── package.json
│       └── ...
├── complete-github-restore.bat
├── complete-github-restore.ps1
├── quick-restore.bat
└── ...
```

## 🚀 After Restore - Start Development

### 1. **Check Environment Files**
```bash
# Backend
cp athletiq-backend/.env.example athletiq-backend/.env
# Edit .env with your settings

# Frontend (if needed)
cp atheletiq-frontend/athletiq-web/.env.example atheletiq-frontend/athletiq-web/.env
```

### 2. **Start Backend Server**
```bash
cd athletiq-backend
npm start
```

### 3. **Start Frontend Server** (new terminal)
```bash
cd atheletiq-frontend\athletiq-web
npm start
```

### 4. **Verify Everything Works**
- Backend should start on port 5000
- Frontend should start on port 3000
- Try logging in and using features

## 🔍 Verification Commands

After restore, run these to verify everything is working:

```bash
# Check git status
git status

# Check node_modules exist
dir athletiq-backend\node_modules
dir atheletiq-frontend\athletiq-web\node_modules

# Check if servers can start
cd athletiq-backend && npm test
cd atheletiq-frontend\athletiq-web && npm test
```

## 📞 Support

If you encounter issues:
1. **Check the error messages** in the script output
2. **Review the troubleshooting section** above
3. **Try the manual commands** from `MANUAL_RESTORE_COMMANDS.md`
4. **Check your GitHub repository** is accessible

## 🎉 Success!

After a successful restore:
- ✅ Your project matches GitHub exactly
- ✅ All dependencies are installed
- ✅ Ready for immediate development
- ✅ Your previous changes are safely stashed
- ✅ Clean, fresh development environment

---

**Remember:** These scripts are designed to be run from your Athletiq project root directory!
