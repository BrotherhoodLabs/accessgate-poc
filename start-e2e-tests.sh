#!/bin/bash
# Script principal pour démarrer les tests E2E AccessGate PoC
# Utilise les scripts organisés dans les sous-dossiers

set -e

echo "🚀 AccessGate PoC - Tests E2E Complets"
echo "====================================="

# Vérifier les prérequis
echo "🔍 Vérification des prérequis..."

# Vérifier Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python: $PYTHON_VERSION"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    echo "✅ Python: $PYTHON_VERSION"
    PYTHON_CMD="python"
else
    echo "❌ Python non trouvé. Veuillez installer Python 3.8+"
    exit 1
fi

# Vérifier kubectl
if command -v kubectl &> /dev/null; then
    KUBECTL_VERSION=$(kubectl version --client --short 2>&1)
    echo "✅ kubectl: $KUBECTL_VERSION"
else
    echo "❌ kubectl non trouvé. Veuillez installer kubectl"
    exit 1
fi

# Vérifier le cluster Kubernetes
if kubectl cluster-info &> /dev/null; then
    echo "✅ Cluster Kubernetes accessible"
else
    echo "❌ Cluster Kubernetes non accessible"
    echo "   Assurez-vous que votre cluster est démarré et accessible"
    exit 1
fi

# Installer les dépendances si nécessaire
echo "📦 Vérification des dépendances Python..."
if $PYTHON_CMD -c "import requests" 2>/dev/null; then
    echo "✅ requests disponible"
else
    echo "📥 Installation de requests..."
    pip install requests
fi

echo ""
echo "🚀 Lancement des tests E2E..."
echo "   - Déploiement automatique des composants Kubernetes"
echo "   - Configuration du port forwarding"
echo "   - Exécution des tests complets"
echo "   - Génération des logs structurés pour Grafana"
echo ""

# Exécuter le script principal
if $PYTHON_CMD scripts/e2e/run-all-k8s-e2e.py; then
    echo ""
    echo "🎉 TESTS E2E RÉUSSIS!"
    echo ""
    echo "📊 Logs et métriques disponibles:"
    echo "   - complete-e2e-results.jsonl (logs détaillés)"
    echo "   - Console (affichage en temps réel)"
    echo ""
    echo "🌐 Application accessible sur:"
    echo "   - Frontend: http://localhost:3001"
    echo "   - Backend: http://localhost:8001"
    echo "   - Health Check: http://localhost:8001/health"
    echo ""
    echo "📈 Pour visualiser les métriques dans Grafana:"
    echo "   1. Importer le dashboard: scripts/monitoring/grafana-dashboard.json"
    echo "   2. Configurer la source de données pour lire complete-e2e-results.jsonl"
    echo ""
    echo "🧪 Tests exécutés avec succès:"
    echo "   ✅ Health Check Backend"
    echo "   ✅ Inscription Utilisateur"
    echo "   ✅ Connexion Utilisateur"
    echo "   ✅ Accès Frontend"
    echo "   ✅ API Complète"
    echo ""
    echo "🔧 Pour arrêter l'application:"
    echo "   kubectl delete namespace accessgate-poc"
else
    echo ""
    echo "❌ CERTAINS TESTS ONT ÉCHOUÉ"
    echo "📊 Consultez complete-e2e-results.jsonl pour les détails"
    echo ""
    echo "🔧 Pour diagnostiquer:"
    echo "   kubectl get pods -n accessgate-poc"
    echo "   kubectl logs -l app=accessgate-backend -n accessgate-poc"
    echo "   kubectl logs -l app=accessgate-frontend -n accessgate-poc"
    exit 1
fi

echo ""
echo "✨ Script terminé!"
echo "   Merci d'avoir utilisé AccessGate PoC!"
