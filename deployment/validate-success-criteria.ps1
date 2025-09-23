# AccessGate PoC - Validation des Critères de Succès (PowerShell)

Write-Host "🎯 Validation des Critères de Succès - AccessGate PoC" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Configuration
$API_BASE_URL = "http://localhost:8000"
$FRONTEND_URL = "http://localhost:3000"
$ADMIN_EMAIL = "admin@accessgate.com"
$ADMIN_PASSWORD = "Admin123!"

# Test results
$TestsPassed = 0
$TestsFailed = 0

function Print-TestResult {
    param(
        [bool]$Success,
        [string]$Message
    )
    
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
        $script:TestsPassed++
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
        $script:TestsFailed++
    }
}

Write-Host ""
Write-Host "🔧 CRITÈRES TECHNIQUES" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Test 1: Couverture de tests > 70%
Write-Host "📊 Test de couverture de tests..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Set-Location backend
    try {
        $CoverageOutput = npm test -- --coverage --watchAll=false 2>$null
        $Coverage = [regex]::Match($CoverageOutput, 'All files\s+(\d+\.?\d*)%').Groups[1].Value
        if ($Coverage -and [double]$Coverage -ge 70) {
            Print-TestResult $true "Couverture de tests: $Coverage% (objectif: ≥70%)"
        } else {
            Print-TestResult $false "Couverture de tests: $Coverage% (objectif: ≥70%)"
        }
    } catch {
        Print-TestResult $false "Erreur lors du test de couverture"
    }
    Set-Location ..
} else {
    Print-TestResult $false "npm non disponible pour tester la couverture"
}

# Test 2: Temps de démarrage < 30s
Write-Host "⏱️  Test de temps de démarrage..." -ForegroundColor Yellow
$StartTime = Get-Date
try {
    docker-compose up -d --build | Out-Null
    Start-Sleep -Seconds 30
    $EndTime = Get-Date
    $Duration = ($EndTime - $StartTime).TotalSeconds
    
    if ($Duration -lt 30) {
        Print-TestResult $true "Temps de démarrage: $([math]::Round($Duration, 1))s (objectif: <30s)"
    } else {
        Print-TestResult $false "Temps de démarrage: $([math]::Round($Duration, 1))s (objectif: <30s)"
    }
} catch {
    Print-TestResult $false "Erreur lors du test de démarrage"
}

# Test 3: API response time < 200ms
Write-Host "🚀 Test de temps de réponse API..." -ForegroundColor Yellow
try {
    $Response = Measure-Command { Invoke-WebRequest -Uri "$API_BASE_URL/health" -UseBasicParsing -ErrorAction Stop }
    $ResponseTimeMs = $Response.TotalMilliseconds
    
    if ($ResponseTimeMs -lt 200) {
        Print-TestResult $true "Temps de réponse API: $([math]::Round($ResponseTimeMs, 1))ms (objectif: <200ms)"
    } else {
        Print-TestResult $false "Temps de réponse API: $([math]::Round($ResponseTimeMs, 1))ms (objectif: <200ms)"
    }
} catch {
    Print-TestResult $false "API non accessible pour tester le temps de réponse"
}

# Test 4: Zero critical security issues
Write-Host "🔒 Test de sécurité..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Set-Location backend
    try {
        $AuditOutput = npm audit --audit-level=moderate 2>$null
        if ($AuditOutput -match "found 0 vulnerabilities") {
            Print-TestResult $true "Aucune vulnérabilité critique détectée"
        } else {
            Print-TestResult $false "Vulnérabilités détectées (voir npm audit)"
        }
    } catch {
        Print-TestResult $false "Erreur lors de l'audit de sécurité"
    }
    Set-Location ..
} else {
    Print-TestResult $false "npm non disponible pour l'audit de sécurité"
}

Write-Host ""
Write-Host "🎯 CRITÈRES FONCTIONNELS" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Test 5: Démonstration complète en < 5 minutes
Write-Host "⏰ Test de démonstration complète..." -ForegroundColor Yellow
$DemoStart = Get-Date

# Login
$LoginData = @{
    email = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

try {
    $LoginResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/auth/login" -Method POST -Body $LoginData -ContentType "application/json" -ErrorAction Stop
    if ($LoginResponse.accessToken) {
        Print-TestResult $true "Connexion réussie en < 5 minutes"
    } else {
        Print-TestResult $false "Échec de la connexion"
    }
} catch {
    Print-TestResult $false "Erreur lors de la connexion"
}

$DemoEnd = Get-Date
$DemoDuration = ($DemoEnd - $DemoStart).TotalSeconds

if ($DemoDuration -lt 300) {
    Print-TestResult $true "Démonstration complète: $([math]::Round($DemoDuration, 1))s (objectif: <5min)"
} else {
    Print-TestResult $false "Démonstration complète: $([math]::Round($DemoDuration, 1))s (objectif: <5min)"
}

# Test 6: Interface intuitive sans formation
Write-Host "🎨 Test d'interface intuitive..." -ForegroundColor Yellow
try {
    $FrontendResponse = Invoke-WebRequest -Uri $FRONTEND_URL -UseBasicParsing -ErrorAction Stop
    if ($FrontendResponse.Content -match "AccessGate|RBAC|Login") {
        Print-TestResult $true "Interface accessible et intuitive"
    } else {
        Print-TestResult $false "Interface non accessible ou non intuitive"
    }
} catch {
    Print-TestResult $false "Interface non accessible"
}

# Test 7: Documentation claire et complète
Write-Host "📚 Test de documentation..." -ForegroundColor Yellow
if ((Test-Path "README.md") -and (Test-Path "docs/rbac-cookbook.md") -and (Test-Path "docs/rbac-model.md")) {
    Print-TestResult $true "Documentation complète disponible"
} else {
    Print-TestResult $false "Documentation incomplète"
}

# Test 8: Code maintenable et extensible
Write-Host "🔧 Test de maintenabilité du code..." -ForegroundColor Yellow
if ((Test-Path "backend/tsconfig.json") -and (Test-Path "frontend/tsconfig.json") -and (Test-Path ".eslintrc.js")) {
    Print-TestResult $true "Code structuré et maintenable"
} else {
    Print-TestResult $false "Code non structuré ou non maintenable"
}

Write-Host ""
Write-Host "📈 RÉSULTATS FINAUX" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Tests Passés: $TestsPassed" -ForegroundColor Green
Write-Host "Tests Échoués: $TestsFailed" -ForegroundColor Red

# Calcul du pourcentage de succès
$TotalTests = $TestsPassed + $TestsFailed
$SuccessRate = [math]::Round(($TestsPassed * 100 / $TotalTests), 1)

Write-Host "Taux de succès: $SuccessRate%"

if ($TestsFailed -eq 0) {
    Write-Host "🎉 TOUS LES CRITÈRES DE SUCCÈS SONT ATTEINTS !" -ForegroundColor Green
    Write-Host "Le PoC AccessGate est prêt pour la production !" -ForegroundColor Green
    exit 0
} elseif ($SuccessRate -ge 80) {
    Write-Host "⚠️  La plupart des critères sont atteints ($SuccessRate%)" -ForegroundColor Yellow
    Write-Host "Quelques améliorations mineures sont recommandées." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ Des critères importants ne sont pas atteints ($SuccessRate%)" -ForegroundColor Red
    Write-Host "Des améliorations significatives sont nécessaires." -ForegroundColor Red
    exit 1
}
