# 🧹 COMPREHENSIVE ATHLETIQ PROJECT CLEANUP SCRIPT
# This script removes duplicate files, temporary files, test files, and organizes the project structure

Write-Host "🧹 ATHLETIQ PROJECT CLEANUP - Starting comprehensive cleanup..." -ForegroundColor Cyan
Write-Host "⚠️  This will remove test files, duplicates, and temporary files!" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Are you sure you want to proceed with cleanup? Type 'YES' to continue"

if ($confirmation -ne "YES") {
    Write-Host "❌ Cleanup cancelled" -ForegroundColor Yellow
    exit
}

# Track cleanup stats
$filesRemoved = 0
$foldersRemoved = 0
$totalSizeFreed = 0

function Remove-FilesSafely {
    param([string[]]$FilePaths, [string]$Description)
    
    Write-Host "🗑️  Removing $Description..." -ForegroundColor Yellow
    
    foreach ($filePath in $FilePaths) {
        if (Test-Path $filePath) {
            try {
                $size = (Get-Item $filePath).Length
                Remove-Item $filePath -Force -ErrorAction SilentlyContinue
                $script:filesRemoved++
                $script:totalSizeFreed += $size
                Write-Host "   Removed: $(Split-Path $filePath -Leaf)" -ForegroundColor Gray
            } catch {
                Write-Host "   Failed to remove: $(Split-Path $filePath -Leaf)" -ForegroundColor Red
            }
        }
    }
}

function Remove-FoldersSafely {
    param([string[]]$FolderPaths, [string]$Description)
    
    Write-Host "🗑️  Removing $Description..." -ForegroundColor Yellow
    
    foreach ($folderPath in $FolderPaths) {
        if (Test-Path $folderPath) {
            try {
                $size = (Get-ChildItem $folderPath -Recurse | Measure-Object -Property Length -Sum).Sum
                Remove-Item $folderPath -Recurse -Force -ErrorAction SilentlyContinue
                $script:foldersRemoved++
                $script:totalSizeFreed += $size
                Write-Host "   Removed folder: $(Split-Path $folderPath -Leaf)" -ForegroundColor Gray
            } catch {
                Write-Host "   Failed to remove folder: $(Split-Path $folderPath -Leaf)" -ForegroundColor Red
            }
        }
    }
}

Write-Host "🔄 Starting cleanup process..." -ForegroundColor Cyan

# 1. Remove test coverage folders
Write-Host "`n1️⃣ Removing test coverage and generated files..." -ForegroundColor Green
Remove-FoldersSafely @(
    "athletiq-backend\coverage"
) "test coverage folders"

# 2. Remove test files from backend
Write-Host "`n2️⃣ Removing backend test and debug files..." -ForegroundColor Green
Remove-FilesSafely @(
    "athletiq-backend\test-*.js",
    "athletiq-backend\debug-*.js",
    "athletiq-backend\minimal-*.js",
    "athletiq-backend\simple-*.js",
    "athletiq-backend\quick-test.js",
    "athletiq-backend\check-*.js",
    "athletiq-backend\add-*.js",
    "athletiq-backend\create-test-*.js",
    "athletiq-backend\setup-*.js",
    "athletiq-backend\validate-*.js",
    "athletiq-backend\verify-*.js",
    "athletiq-backend\run-*.js",
    "athletiq-backend\restart-*.js",
    "athletiq-backend\server-*.js",
    "athletiq-backend\start-*.js",
    "athletiq-backend\study-*.js",
    "athletiq-backend\enhance-*.js",
    "athletiq-backend\comprehensive-diagnostic.js",
    "athletiq-backend\diagnostic.js",
    "athletiq-backend\emergency-server.js",
    "athletiq-backend\progress-summary.js",
    "athletiq-backend\cors-*.js",
    "athletiq-backend\db-setup.js",
    "athletiq-backend\database-setup.js"
) "backend test and debug files"

# 3. Remove frontend test files
Write-Host "`n3️⃣ Removing frontend test files..." -ForegroundColor Green
Remove-FilesSafely @(
    "atheletiq-frontend\athletiq-web\test-*.js"
) "frontend test files"

# 4. Remove backup files
Write-Host "`n4️⃣ Removing backup files..." -ForegroundColor Green
Remove-FilesSafely @(
    "atheletiq-frontend\athletiq-web\src\components\features\tournament\TournamentSportsStep_backup.jsx"
) "backup files"

# 5. Remove temporary data files
Write-Host "`n5️⃣ Removing temporary data files..." -ForegroundColor Green
Remove-FilesSafely @(
    "athletiq-backend\login-data.json",
    "athletiq-backend\test-login-data.json",
    "athletiq-backend\cookies.txt",
    "athletiq-backend\DATABASE_COMPLETE_ANALYSIS.json"
) "temporary data files"

# 6. Remove root-level test files
Write-Host "`n6️⃣ Removing root-level test files..." -ForegroundColor Green
Remove-FilesSafely @(
    "test-*.js",
    "quick-tournament-test.js",
    "tournament-creation-test.js",
    "start-backend-test.bat",
    "test-all-systems.bat",
    "validate-guardian-registration.js"
) "root-level test files"

# 7. Remove script folders (keep essential ones)
Write-Host "`n7️⃣ Cleaning script folders..." -ForegroundColor Green
Remove-FoldersSafely @(
    "athletiq-backend\scripts"
) "backend scripts folder (non-essential)"

# 8. Remove archived documentation folders
Write-Host "`n8️⃣ Removing archived documentation..." -ForegroundColor Green
Remove-FoldersSafely @(
    "archived-docs",
    "archived-scripts"
) "archived folders"

# 9. Clean up logs folder (keep folder but remove old logs)
Write-Host "`n9️⃣ Cleaning logs folder..." -ForegroundColor Green
if (Test-Path "athletiq-backend\logs") {
    Get-ChildItem "athletiq-backend\logs" -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | ForEach-Object {
        Remove-Item $_.FullName -Force
        $script:filesRemoved++
        Write-Host "   Removed old log: $($_.Name)" -ForegroundColor Gray
    }
}

# 10. Remove duplicate markdown files
Write-Host "`n🔟 Removing duplicate documentation..." -ForegroundColor Green
Remove-FilesSafely @(
    "athletiq-backend\folder-structure.txt",
    "athletiq-backend\GIT-COMMIT-SUMMARY.md",
    "athletiq-backend\PROGRESS_SUMMARY.md",
    "athletiq-backend\NEXT-PHASE-PLAN.md"
) "duplicate documentation files"

# 11. Clean node_modules if they exist (will be reinstalled)
Write-Host "`n1️⃣1️⃣ Checking for unnecessary node_modules..." -ForegroundColor Green
if (Test-Path "node_modules") {
    Write-Host "   Found root node_modules (not needed)" -ForegroundColor Yellow
    Remove-FoldersSafely @("node_modules") "root node_modules"
}

# 12. Remove empty folders
Write-Host "`n1️⃣2️⃣ Removing empty folders..." -ForegroundColor Green
Get-ChildItem -Path . -Recurse -Directory | Where-Object { 
    (Get-ChildItem $_.FullName -Force | Measure-Object).Count -eq 0 
} | ForEach-Object {
    try {
        Remove-Item $_.FullName -Force
        $script:foldersRemoved++
        Write-Host "   Removed empty folder: $($_.Name)" -ForegroundColor Gray
    } catch {
        # Ignore errors for folders that can't be removed
    }
}

# 13. Create organized structure
Write-Host "`n1️⃣3️⃣ Creating organized structure..." -ForegroundColor Green

# Create a maintenance folder for essential scripts
if (-not (Test-Path "maintenance")) {
    New-Item -ItemType Directory -Path "maintenance" -Force | Out-Null
    Write-Host "   Created maintenance folder" -ForegroundColor Gray
}

# Move essential maintenance scripts
$maintenanceScripts = @(
    "clean-git-restore.ps1",
    "restart-all-servers.bat",
    "restart-all-servers.sh",
    "start-backend.bat",
    "start-backend.sh",
    "start-frontend.bat",
    "start-frontend.sh",
    "system-diagnostic.js"
)

foreach ($script in $maintenanceScripts) {
    if (Test-Path $script) {
        try {
            Move-Item $script "maintenance\" -Force
            Write-Host "   Moved $script to maintenance folder" -ForegroundColor Gray
        } catch {
            # If move fails, it's okay
        }
    }
}

# 14. Final cleanup - remove this script after execution
Write-Host "`n1️⃣4️⃣ Final cleanup..." -ForegroundColor Green

# Calculate total size freed in MB
$sizeMB = [math]::Round($totalSizeFreed / 1MB, 2)

Write-Host "`n✅ CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "📊 Cleanup Summary:" -ForegroundColor Cyan
Write-Host "   Files removed: $filesRemoved" -ForegroundColor White
Write-Host "   Folders removed: $foldersRemoved" -ForegroundColor White
Write-Host "   Space freed: $sizeMB MB" -ForegroundColor White
Write-Host ""
Write-Host "📁 Project structure is now clean and organized!" -ForegroundColor Green
Write-Host "🔧 Essential files moved to 'maintenance' folder" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 Ready for development and deployment!" -ForegroundColor Green

# Keep window open to see results
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
