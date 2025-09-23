#!/bin/bash
# Script de configuration pour les tests E2E AccessGate PoC

set -e

echo "🚀 Configuration des tests E2E AccessGate PoC"
echo "============================================="

# Vérifier Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé"
    exit 1
fi

echo "✅ Python 3 détecté: $(python3 --version)"

# Vérifier kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl n'est pas installé"
    exit 1
fi

echo "✅ kubectl détecté: $(kubectl version --client --short)"

# Vérifier que le cluster Kubernetes est accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cluster Kubernetes non accessible"
    exit 1
fi

echo "✅ Cluster Kubernetes accessible"

# Installer les dépendances Python
echo "📦 Installation des dépendances Python..."
pip3 install playwright requests asyncio

# Installer les navigateurs Playwright
echo "🌐 Installation des navigateurs Playwright..."
python3 -m playwright install chromium

# Rendre le script exécutable
chmod +x scripts/e2e-test-runner.py

echo "✅ Configuration terminée!"
echo ""
echo "Pour exécuter les tests E2E:"
echo "  python3 scripts/e2e-test-runner.py"
echo ""
echo "Les logs structurés seront sauvegardés dans:"
echo "  - e2e-test-results.jsonl (format JSONL pour Grafana)"
echo "  - Console (affichage en temps réel)"
