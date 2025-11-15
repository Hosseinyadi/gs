Write-Host "=== Bil Flow Backend Setup ===" -ForegroundColor Green
Write-Host ""

# Check Node version
Write-Host "Checking Node version..." -ForegroundColor Yellow
$nodeVersion = & node -v 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node is not found in PATH!" -ForegroundColor Red
    Write-Host "Please run in a NEW terminal:" -ForegroundColor Yellow
    Write-Host "  nvm use 22.9.0" -ForegroundColor Cyan
    Write-Host "  cd C:\Users\rose\Desktop\site\server" -ForegroundColor Cyan
    Write-Host "  .\run-backend.ps1" -ForegroundColor Cyan
    pause
    exit 1
}
Write-Host "Node version: $nodeVersion" -ForegroundColor Green

$npmVersion = & npm -v 2>&1
Write-Host "npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
$nodeModules = ".\node_modules"
if (-Not (Test-Path $nodeModules)) {
    Write-Host "node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Yellow
    Write-Host ""
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed!" -ForegroundColor Red
        pause
        exit 1
    }
} else {
    Write-Host "node_modules found. Skipping install." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Starting Backend Server ===" -ForegroundColor Green
Write-Host "Server will run on: http://localhost:8080" -ForegroundColor Yellow
Write-Host "Health check: http://localhost:8080/health" -ForegroundColor Yellow
Write-Host ""

& npm run dev
