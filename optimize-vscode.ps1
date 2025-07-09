# VS Code Performance Optimization Script
# Cleans up temporary files and optimizes workspace

Write-Host "VS Code Performance Optimization Starting..." -ForegroundColor Cyan

# 1. Clean up node_modules in backend (can be reinstalled)
Write-Host "Cleaning backend node_modules..." -ForegroundColor Yellow
if (Test-Path "athletiq-backend\node_modules") {
    Remove-Item "athletiq-backend\node_modules" -Recurse -Force
    Write-Host "✅ Backend node_modules removed" -ForegroundColor Green
}

# 2. Clean up node_modules in frontend (can be reinstalled)
Write-Host "Cleaning frontend node_modules..." -ForegroundColor Yellow
if (Test-Path "atheletiq-frontend\athletiq-web\node_modules") {
    Remove-Item "atheletiq-frontend\athletiq-web\node_modules" -Recurse -Force
    Write-Host "✅ Frontend node_modules removed" -ForegroundColor Green
}

# 3. Clean up log files
Write-Host "Cleaning log files..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Name "*.log" | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item $_ -Force
        Write-Host "  Removed: $_" -ForegroundColor Gray
    }
}

# 4. Clean up test and diagnostic files
Write-Host "Cleaning test files..." -ForegroundColor Yellow
$testFiles = @(
    "athletiq-backend\test-*.js",
    "athletiq-backend\debug-*.js",
    "athletiq-backend\diagnostic*.js",
    "athletiq-backend\comprehensive-*.js",
    "athletiq-backend\minimal-*.js",
    "athletiq-backend\check-*.js"
)

foreach ($pattern in $testFiles) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "  Removed: $($_.Name)" -ForegroundColor Gray
    }
}

# 5. Clean up temporary build files
Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
$buildPaths = @(
    "atheletiq-frontend\athletiq-web\dist",
    "atheletiq-frontend\athletiq-web\.next",
    "atheletiq-frontend\athletiq-web\build"
)

foreach ($path in $buildPaths) {
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force
        Write-Host "  Removed: $path" -ForegroundColor Gray
    }
}

# 6. Create .vscode settings for better performance
Write-Host "Creating VS Code performance settings..." -ForegroundColor Yellow
$vscodeDir = ".vscode"
if (-not (Test-Path $vscodeDir)) {
    New-Item -ItemType Directory -Path $vscodeDir
}

$settings = @{
    "files.watcherExclude" = @{
        "**/node_modules/**" = $true
        "**/dist/**" = $true
        "**/build/**" = $true
        "**/.next/**" = $true
        "**/logs/**" = $true
        "**/coverage/**" = $true
        "**/test-*.js" = $true
    }
    "search.exclude" = @{
        "**/node_modules" = $true
        "**/dist" = $true
        "**/build" = $true
        "**/.next" = $true
        "**/logs" = $true
        "**/coverage" = $true
    }
    "files.exclude" = @{
        "**/node_modules" = $true
        "**/dist" = $true
        "**/build" = $true
        "**/.next" = $true
        "**/coverage" = $true
    }
    "typescript.preferences.includePackageJsonAutoImports" = "off"
    "typescript.disableAutomaticTypeAcquisition" = $true
    "extensions.autoUpdate" = $false
    "git.autorefresh" = $false
    "files.autoSave" = "onWindowChange"
    "editor.quickSuggestions" = @{
        "other" = $false
        "comments" = $false
        "strings" = $false
    }
}

$settingsJson = $settings | ConvertTo-Json -Depth 10
Set-Content -Path "$vscodeDir\settings.json" -Value $settingsJson
Write-Host "✅ VS Code settings optimized" -ForegroundColor Green

Write-Host "Performance optimization complete!" -ForegroundColor Green
Write-Host "Restart VS Code for changes to take effect" -ForegroundColor Cyan
Write-Host "To reinstall dependencies later:" -ForegroundColor Yellow
Write-Host "   Backend: cd athletiq-backend && npm install" -ForegroundColor Gray
Write-Host "   Frontend: cd atheletiq-frontend/athletiq-web && npm install" -ForegroundColor Gray
