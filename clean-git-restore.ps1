# 🔄 CLEAN GIT RESTORE SCRIPT
# This will restore all files to the last committed state and clean up workspace

Write-Host "🚨 CLEAN GIT RESTORE - This will DELETE all uncommitted changes!" -ForegroundColor Red
Write-Host "⚠️  This action is IRREVERSIBLE!" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Are you sure you want to proceed? Type 'YES' to continue"

if ($confirmation -ne "YES") {
    Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
    exit
}

Write-Host "🔄 Starting clean git restore..." -ForegroundColor Cyan

# 1. Add all changes to track deletions
Write-Host "📋 Staging all changes..." -ForegroundColor Yellow
git add -A

# 2. Show what will be restored
Write-Host "`n📊 Files that will be restored:" -ForegroundColor Yellow
git status --short

Write-Host "`n⏳ Proceeding with restore in 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 3. Hard reset to last commit (WARNING: This deletes all uncommitted changes)
Write-Host "🔄 Performing hard reset to HEAD..." -ForegroundColor Red
git reset --hard HEAD

# 4. Clean untracked files and directories
Write-Host "🧹 Cleaning untracked files..." -ForegroundColor Yellow
git clean -fd

# 5. Reset any submodules (if any)
Write-Host "📦 Resetting submodules..." -ForegroundColor Yellow
git submodule foreach --recursive git reset --hard HEAD
git submodule foreach --recursive git clean -fd

# 6. Pull latest changes from remote
Write-Host "⬇️ Pulling latest changes from remote..." -ForegroundColor Yellow
git pull origin main

# 7. Clean up any remaining build artifacts
Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Yellow
if (Test-Path "athletiq-backend\node_modules") {
    Write-Host "  Removing backend node_modules..." -ForegroundColor Gray
    Remove-Item "athletiq-backend\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path "atheletiq-frontend\athletiq-web\node_modules") {
    Write-Host "  Removing frontend node_modules..." -ForegroundColor Gray
    Remove-Item "atheletiq-frontend\athletiq-web\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path "atheletiq-frontend\athletiq-web\.next") {
    Write-Host "  Removing .next build..." -ForegroundColor Gray
    Remove-Item "atheletiq-frontend\athletiq-web\.next" -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path "atheletiq-frontend\athletiq-web\dist") {
    Write-Host "  Removing dist build..." -ForegroundColor Gray
    Remove-Item "atheletiq-frontend\athletiq-web\dist" -Recurse -Force -ErrorAction SilentlyContinue
}

# 8. Verify clean state
Write-Host "`n🔍 Verifying clean state..." -ForegroundColor Cyan
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "✅ Repository is now clean!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some files still modified:" -ForegroundColor Yellow
    git status --short
}

Write-Host "`n🎉 Clean git restore complete!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Reinstall dependencies: npm install in both backend and frontend" -ForegroundColor Gray
Write-Host "   2. Restart VS Code for best performance" -ForegroundColor Gray
Write-Host "   3. Repository is now in clean state matching the remote" -ForegroundColor Gray