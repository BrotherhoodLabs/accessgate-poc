# Script de configuration pour les tests E2E AccessGate PoC (Windows)

Write-Host "🚀 Configuration des tests E2E AccessGate PoC" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Vérifier Python 3
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python détecté: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier kubectl
try {
    $kubectlVersion = kubectl version --client --short 2>&1
    Write-Host "✅ kubectl détecté: $kubectlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier que le cluster Kubernetes est accessible
try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Cluster Kubernetes accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Cluster Kubernetes non accessible" -ForegroundColor Red
    exit 1
}

# Installer les dépendances Python
Write-Host "📦 Installation des dépendances Python..." -ForegroundColor Yellow
pip install playwright requests asyncio

# Installer les navigateurs Playwright
Write-Host "🌐 Installation des navigateurs Playwright..." -ForegroundColor Yellow
python -m playwright install chromium

Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "Pour exécuter les tests E2E:" -ForegroundColor Cyan
Write-Host "  python scripts/e2e-test-runner.py" -ForegroundColor White
Write-Host ""
Write-Host "Les logs structurés seront sauvegardés dans:" -ForegroundColor Cyan
Write-Host "  - e2e-test-results.jsonl (format JSONL pour Grafana)" -ForegroundColor White
Write-Host "  - Console (affichage en temps réel)" -ForegroundColor White
