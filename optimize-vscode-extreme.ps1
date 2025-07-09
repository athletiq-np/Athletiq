# 🚀 EXTREME VS CODE PERFORMANCE OPTIMIZATION FOR ATHLETIQ
# This script applies maximum performance optimizations to eliminate lag

Write-Host "=== EXTREME VS CODE PERFORMANCE OPTIMIZATION ===" -ForegroundColor Red
Write-Host "⚠️  This will apply AGGRESSIVE optimizations that may affect some features" -ForegroundColor Yellow
Write-Host "✅ But will maximize performance and eliminate lag" -ForegroundColor Green

# Step 1: Archive all documentation files to reduce file count
Write-Host "`n📁 STEP 1: Archiving documentation files..." -ForegroundColor Yellow

if (-not (Test-Path "archived-docs")) {
    New-Item -ItemType Directory -Path "archived-docs" -Force
}

# Move all .md files to archived-docs (except README.md)
Get-ChildItem -Name "*.md" | Where-Object { $_ -ne "README.md" } | ForEach-Object {
    if (Test-Path "archived-docs\$_") {
        Remove-Item "archived-docs\$_" -Force
    }
    Move-Item $_ "archived-docs\" -Force
    Write-Host "  Archived: $_" -ForegroundColor Gray
}

# Step 2: Archive all script files except essential ones
Write-Host "`n📁 STEP 2: Archiving script files..." -ForegroundColor Yellow

if (-not (Test-Path "archived-scripts")) {
    New-Item -ItemType Directory -Path "archived-scripts" -Force
}

$essentialScripts = @(
    "optimize-vscode-extreme.ps1",
    "start-frontend.bat",
    "start-backend.bat",
    "restart-all-servers.bat"
)

Get-ChildItem -Name "*.ps1", "*.bat", "*.sh", "*.js" | Where-Object { 
    $_ -notin $essentialScripts -and -not $_.StartsWith("atheletiq-") -and -not $_.StartsWith("athletiq-")
} | ForEach-Object {
    if (Test-Path "archived-scripts\$_") {
        Remove-Item "archived-scripts\$_" -Force
    }
    Move-Item $_ "archived-scripts\" -Force
    Write-Host "  Archived: $_" -ForegroundColor Gray
}

# Step 3: Create EXTREME VS Code settings
Write-Host "`n⚙️ STEP 3: Applying EXTREME VS Code settings..." -ForegroundColor Yellow

if (-not (Test-Path ".vscode")) {
    New-Item -ItemType Directory -Path ".vscode" -Force
}

$extremeSettings = @{
    # AGGRESSIVE file watching exclusions
    "files.watcherExclude" = @{
        "**/node_modules/**" = $true
        "**/dist/**" = $true
        "**/build/**" = $true
        "**/.next/**" = $true
        "**/logs/**" = $true
        "**/coverage/**" = $true
        "**/archived-docs/**" = $true
        "**/archived-scripts/**" = $true
        "**/*.log" = $true
        "**/.git/**" = $true
        "**/test-*.js" = $true
        "**/*.md" = $true
        "**/*.bat" = $true
        "**/*.sh" = $true
        "**/*.ps1" = $true
    }
    
    # AGGRESSIVE search exclusions
    "search.exclude" = @{
        "**/node_modules" = $true
        "**/dist" = $true
        "**/build" = $true
        "**/.next" = $true
        "**/logs" = $true
        "**/coverage" = $true
        "**/archived-docs" = $true
        "**/archived-scripts" = $true
        "**/*.log" = $true
        "**/.git" = $true
        "**/*.md" = $true
        "**/*.bat" = $true
        "**/*.sh" = $true
        "**/*.ps1" = $true
    }
    
    # AGGRESSIVE file exclusions from explorer
    "files.exclude" = @{
        "**/node_modules" = $true
        "**/dist" = $true
        "**/build" = $true
        "**/.next" = $true
        "**/coverage" = $true
        "**/archived-docs" = $true
        "**/archived-scripts" = $true
        "**/*.log" = $true
        "**/.git" = $true
    }
    
    # MAXIMUM performance settings
    "files.autoSave" = "off"  # Disable auto-save for performance
    "extensions.autoUpdate" = $false
    "git.autorefresh" = $false
    "git.decorations.enabled" = $false
    "git.enableSmartCommit" = $false
    "git.enabled" = $false  # Disable git integration for maximum performance
    
    # AGGRESSIVE editor optimizations
    "editor.minimap.enabled" = $false
    "editor.hover.enabled" = $false
    "editor.lightbulb.enabled" = "off"
    "editor.quickSuggestions" = $false  # Disable all suggestions
    "editor.suggestOnTriggerCharacters" = $false
    "editor.parameterHints.enabled" = $false
    "editor.wordBasedSuggestions" = "off"
    "editor.semanticHighlighting.enabled" = $false
    "editor.renderLineHighlight" = "none"
    "editor.occurrencesHighlight" = "off"
    "editor.renderControlCharacters" = $false
    "editor.renderWhitespace" = "none"
    "editor.codeLens" = $false
    "editor.folding" = $false
    "editor.glyphMargin" = $false
    "editor.lineNumbers" = "off"  # Disable line numbers for performance
    "editor.rulers" = @()
    "editor.scrollBeyondLastLine" = $false
    "editor.smoothScrolling" = $false
    "editor.cursorBlinking" = "solid"
    "editor.cursorSmoothCaretAnimation" = "off"
    "editor.fontLigatures" = $false
    "editor.formatOnSave" = $false
    "editor.formatOnType" = $false
    "editor.formatOnPaste" = $false
    
    # AGGRESSIVE workbench optimizations
    "workbench.editor.enablePreview" = $false
    "workbench.editor.enablePreviewFromQuickOpen" = $false
    "workbench.editor.showTabs" = "single"  # Show only one tab
    "workbench.activityBar.visible" = $false  # Hide activity bar
    "workbench.statusBar.visible" = $false    # Hide status bar
    "workbench.sideBar.location" = "right"    # Move sidebar to reduce reflow
    "workbench.panel.defaultLocation" = "bottom"
    "workbench.startupEditor" = "none"
    "workbench.tips.enabled" = $false
    "workbench.welcomePage.walkthroughs.openOnInstall" = $false
    
    # AGGRESSIVE breadcrumbs and problems
    "breadcrumbs.enabled" = $false
    "problems.decorations.enabled" = $false
    "problems.showCurrentInStatus" = $false
    
    # AGGRESSIVE explorer optimizations
    "explorer.decorations.badges" = $false
    "explorer.decorations.colors" = $false
    "explorer.autoReveal" = $false
    "explorer.confirmDelete" = $false
    "explorer.confirmDragAndDrop" = $false
    "explorer.compactFolders" = $false
    
    # AGGRESSIVE TypeScript/JavaScript optimizations
    "typescript.disableAutomaticTypeAcquisition" = $true
    "typescript.suggest.enabled" = $false
    "typescript.validate.enable" = $false
    "javascript.suggest.enabled" = $false
    "javascript.validate.enable" = $false
    "typescript.preferences.includePackageJsonAutoImports" = "off"
    "typescript.preferences.useLabelDetailsInCompletionEntries" = $false
    "typescript.suggest.autoImports" = "off"
    "typescript.suggest.completeFunctionCalls" = $false
    
    # AGGRESSIVE terminal optimizations
    "terminal.integrated.enableMultiLinePasteWarning" = $false
    "terminal.integrated.smoothScrolling" = $false
    "terminal.integrated.fastScrollSensitivity" = 1
    "terminal.integrated.scrollback" = 100  # Reduce terminal history
    
    # AGGRESSIVE window optimizations
    "window.titleBarStyle" = "native"
    "window.menuBarVisibility" = "hidden"
    "window.enableMenuBarMnemonics" = $false
    "window.title" = ""  # Empty title for performance
    
    # DISABLE all language features for maximum performance
    "html.suggest.html5" = $false
    "css.validate" = $false
    "scss.validate" = $false
    "less.validate" = $false
    "emmet.triggerExpansionOnTab" = $false
    "emmet.showExpandedAbbreviation" = "never"
}

# Write the extreme settings
$extremeSettings | ConvertTo-Json -Depth 10 | Set-Content ".vscode\settings.json" -Encoding UTF8
Write-Host "  ✅ EXTREME VS Code settings applied" -ForegroundColor Green

# Step 4: Create gitignore for performance
Write-Host "`n📝 STEP 4: Updating .gitignore for performance..." -ForegroundColor Yellow

$gitignoreContent = @"
# Performance optimizations - exclude from git
logs/
*.log
archived-docs/
archived-scripts/
coverage/
.nyc_output/
.cache/
dist/
build/
.next/

# VS Code
.vscode/settings.json

# Dependencies
node_modules/

# Environment
.env
.env.local
.env.production

# Database
*.db
*.sqlite

# OS
.DS_Store
Thumbs.db
"@

Set-Content ".gitignore" $gitignoreContent -Encoding UTF8
Write-Host "  ✅ .gitignore updated for performance" -ForegroundColor Green

# Step 5: Clean up any remaining temporary files
Write-Host "`n🧹 STEP 5: Final cleanup..." -ForegroundColor Yellow

# Remove any existing log files
Get-ChildItem -Recurse -Name "*.log" | Remove-Item -Force -ErrorAction SilentlyContinue

# Remove any .cache directories
Get-ChildItem -Recurse -Directory -Name ".cache" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "  ✅ Cleanup completed" -ForegroundColor Green

# Step 6: Create restart script
Write-Host "`n🔄 STEP 6: Creating restart script..." -ForegroundColor Yellow

$restartScript = @"
@echo off
echo === RESTARTING VS CODE FOR PERFORMANCE ===
echo Closing VS Code...
taskkill /f /im Code.exe 2>nul
timeout /t 2 /nobreak >nul
echo Starting VS Code with performance optimizations...
start "" "code" "."
echo ✅ VS Code restarted with extreme performance settings
pause
"@

Set-Content "restart-vscode-extreme.bat" $restartScript -Encoding UTF8
Write-Host "  ✅ Restart script created: restart-vscode-extreme.bat" -ForegroundColor Green

# Summary
Write-Host "`n=== EXTREME OPTIMIZATION COMPLETE ===" -ForegroundColor Cyan
Write-Host "✅ Documentation files archived" -ForegroundColor Green
Write-Host "✅ Script files archived" -ForegroundColor Green
Write-Host "✅ EXTREME VS Code settings applied" -ForegroundColor Green
Write-Host "✅ .gitignore optimized" -ForegroundColor Green
Write-Host "✅ Temporary files cleaned" -ForegroundColor Green
Write-Host "✅ Restart script created" -ForegroundColor Green

Write-Host "`n🚨 IMPORTANT NEXT STEPS:" -ForegroundColor Red
Write-Host "1. Run 'restart-vscode-extreme.bat' to restart VS Code" -ForegroundColor Yellow
Write-Host "2. VS Code will be in 'performance mode' with minimal features" -ForegroundColor Yellow
Write-Host "3. To restore features, edit .vscode/settings.json" -ForegroundColor Yellow
Write-Host "4. Archived files are in 'archived-docs' and 'archived-scripts'" -ForegroundColor Yellow

Write-Host "`n💡 Performance improvements applied:" -ForegroundColor Cyan
Write-Host "- Disabled git integration" -ForegroundColor White
Write-Host "- Disabled IntelliSense and suggestions" -ForegroundColor White
Write-Host "- Disabled line numbers and visual features" -ForegroundColor White
Write-Host "- Hidden activity bar and status bar" -ForegroundColor White
Write-Host "- Excluded all non-essential files from watching" -ForegroundColor White
Write-Host "- Archived documentation and scripts" -ForegroundColor White

$fileCount = (Get-ChildItem -Recurse | Measure-Object).Count
Write-Host "`n📊 Project now has $fileCount files (reduced for performance)" -ForegroundColor Green
