# Script de démarrage rapide pour AccessGate PoC
# Démarre tous les composants Kubernetes et exécute les tests E2E

Write-Host "🚀 Démarrage complet AccessGate PoC" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Vérifier les prérequis
Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Yellow

# Vérifier Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier kubectl
try {
    $kubectlVersion = kubectl version --client --short 2>&1
    Write-Host "✅ kubectl: $kubectlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier le cluster Kubernetes
try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Cluster Kubernetes accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Cluster Kubernetes non accessible" -ForegroundColor Red
    exit 1
}

# Installer les dépendances si nécessaire
Write-Host "📦 Vérification des dépendances Python..." -ForegroundColor Yellow
try {
    python -c "import requests" 2>$null
    Write-Host "✅ requests disponible" -ForegroundColor Green
} catch {
    Write-Host "📥 Installation de requests..." -ForegroundColor Yellow
    pip install requests
}

# Exécuter le script principal
Write-Host "🚀 Lancement du déploiement et des tests..." -ForegroundColor Green
Write-Host ""

try {
    python scripts/run-all-k8s-e2e.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Déploiement et tests réussis!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Logs disponibles dans:" -ForegroundColor Cyan
        Write-Host "   - complete-e2e-results.jsonl" -ForegroundColor White
        Write-Host ""
        Write-Host "🌐 Application accessible sur:" -ForegroundColor Cyan
        Write-Host "   - Frontend: http://localhost:3001" -ForegroundColor White
        Write-Host "   - Backend: http://localhost:8001" -ForegroundColor White
        Write-Host ""
        Write-Host "📈 Pour visualiser les métriques dans Grafana:" -ForegroundColor Cyan
        Write-Host "   1. Importer le dashboard: scripts/grafana-dashboard.json" -ForegroundColor White
        Write-Host "   2. Configurer la source de données pour lire complete-e2e-results.jsonl" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Certains tests ont échoué" -ForegroundColor Red
        Write-Host "📊 Consultez complete-e2e-results.jsonl pour les détails" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "💥 Erreur lors de l'exécution: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Script terminé!" -ForegroundColor Green
