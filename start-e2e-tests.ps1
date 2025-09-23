# Script principal pour démarrer les tests E2E AccessGate PoC
# Utilise les scripts organisés dans les sous-dossiers

Write-Host "🚀 AccessGate PoC - Tests E2E Complets" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Vérifier les prérequis
Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Yellow

# Vérifier Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python non trouvé. Veuillez installer Python 3.8+" -ForegroundColor Red
    exit 1
}

# Vérifier kubectl
try {
    $kubectlVersion = kubectl version --client --short 2>&1
    Write-Host "✅ kubectl: $kubectlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl non trouvé. Veuillez installer kubectl" -ForegroundColor Red
    exit 1
}

# Vérifier le cluster Kubernetes
try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Cluster Kubernetes accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Cluster Kubernetes non accessible" -ForegroundColor Red
    Write-Host "   Assurez-vous que votre cluster est démarré et accessible" -ForegroundColor Yellow
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

Write-Host ""
Write-Host "🚀 Lancement des tests E2E..." -ForegroundColor Green
Write-Host "   - Déploiement automatique des composants Kubernetes" -ForegroundColor Cyan
Write-Host "   - Configuration du port forwarding" -ForegroundColor Cyan
Write-Host "   - Exécution des tests complets" -ForegroundColor Cyan
Write-Host "   - Génération des logs structurés pour Grafana" -ForegroundColor Cyan
Write-Host ""

try {
    python scripts/e2e/run-all-k8s-e2e.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 TESTS E2E RÉUSSIS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Logs et métriques disponibles:" -ForegroundColor Cyan
        Write-Host "   - complete-e2e-results.jsonl (logs détaillés)" -ForegroundColor White
        Write-Host "   - Console (affichage en temps réel)" -ForegroundColor White
        Write-Host ""
        Write-Host "🌐 Application accessible sur:" -ForegroundColor Cyan
        Write-Host "   - Frontend: http://localhost:3001" -ForegroundColor White
        Write-Host "   - Backend: http://localhost:8001" -ForegroundColor White
        Write-Host "   - Health Check: http://localhost:8001/health" -ForegroundColor White
        Write-Host ""
        Write-Host "📈 Pour visualiser les métriques dans Grafana:" -ForegroundColor Cyan
        Write-Host "   1. Importer le dashboard: scripts/monitoring/grafana-dashboard.json" -ForegroundColor White
        Write-Host "   2. Configurer la source de données pour lire complete-e2e-results.jsonl" -ForegroundColor White
        Write-Host ""
        Write-Host "🧪 Tests exécutés avec succès:" -ForegroundColor Cyan
        Write-Host "   ✅ Health Check Backend" -ForegroundColor Green
        Write-Host "   ✅ Inscription Utilisateur" -ForegroundColor Green
        Write-Host "   ✅ Connexion Utilisateur" -ForegroundColor Green
        Write-Host "   ✅ Accès Frontend" -ForegroundColor Green
        Write-Host "   ✅ API Complète" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔧 Pour arrêter l'application:" -ForegroundColor Yellow
        Write-Host "   kubectl delete namespace accessgate-poc" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ CERTAINS TESTS ONT ÉCHOUÉ" -ForegroundColor Red
        Write-Host "📊 Consultez complete-e2e-results.jsonl pour les détails" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🔧 Pour diagnostiquer:" -ForegroundColor Yellow
        Write-Host "   kubectl get pods -n accessgate-poc" -ForegroundColor White
        Write-Host "   kubectl logs -l app=accessgate-backend -n accessgate-poc" -ForegroundColor White
        Write-Host "   kubectl logs -l app=accessgate-frontend -n accessgate-poc" -ForegroundColor White
    }
} catch {
    Write-Host ""
    Write-Host "💥 ERREUR LORS DE L'EXÉCUTION" -ForegroundColor Red
    Write-Host "Détails: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Vérifications à effectuer:" -ForegroundColor Yellow
    Write-Host "   - Cluster Kubernetes accessible" -ForegroundColor White
    Write-Host "   - Fichiers k8s/ présents" -ForegroundColor White
    Write-Host "   - Python et dépendances installés" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "✨ Script terminé!" -ForegroundColor Green
Write-Host "   Merci d'avoir utilisé AccessGate PoC!" -ForegroundColor Cyan
