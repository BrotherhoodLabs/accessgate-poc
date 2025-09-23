# AccessGate PoC - Development Startup Script (PowerShell)

Write-Host "🚀 Starting AccessGate PoC Development Environment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker-compose is not installed. Please install it and try again." -ForegroundColor Red
    exit 1
}

# Create .env files if they don't exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "📝 Creating backend\.env from template..." -ForegroundColor Yellow
    Copy-Item "backend\env.example" "backend\.env"
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "📝 Creating frontend\.env from template..." -ForegroundColor Yellow
    Copy-Item "frontend\env.example" "frontend\.env"
}

# Start services
Write-Host "🐳 Starting Docker services..." -ForegroundColor Blue
docker-compose up -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Blue

# Check PostgreSQL
try {
    docker-compose exec postgres pg_isready -U accessgate -d accessgate_poc | Out-Null
    Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL is not ready" -ForegroundColor Red
}

# Check Backend
try {
    Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing | Out-Null
    Write-Host "✅ Backend API is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend API is not ready" -ForegroundColor Red
}

# Check Frontend
try {
    Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing | Out-Null
    Write-Host "✅ Frontend is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend is not ready" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 AccessGate PoC is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Services:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "  - Database: localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "👤 Demo accounts:" -ForegroundColor Cyan
Write-Host "  - admin@accessgate.com / Admin123!" -ForegroundColor White
Write-Host "  - manager@accessgate.com / Manager123!" -ForegroundColor White
Write-Host "  - viewer@accessgate.com / Viewer123!" -ForegroundColor White
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Cyan
Write-Host "  - View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "  - Stop services: docker-compose down" -ForegroundColor White
Write-Host "  - Restart services: docker-compose restart" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
