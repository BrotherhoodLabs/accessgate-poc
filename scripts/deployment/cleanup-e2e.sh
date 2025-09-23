#!/bin/bash
# Script de nettoyage pour les tests E2E

echo "🧹 Nettoyage des tests E2E AccessGate PoC"
echo "========================================"

NAMESPACE="accessgate-poc"

# Arrêter les port forwarding
echo "🛑 Arrêt des port forwarding..."
pkill -f "kubectl port-forward" || true

# Supprimer le namespace (optionnel)
read -p "Voulez-vous supprimer le namespace $NAMESPACE ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Suppression du namespace $NAMESPACE..."
    kubectl delete namespace $NAMESPACE
    echo "✅ Namespace supprimé"
else
    echo "ℹ️ Namespace conservé"
fi

# Nettoyer les fichiers de logs
echo "📄 Nettoyage des fichiers de logs..."
rm -f e2e-test-results.jsonl
rm -f playwright-report/
rm -f test-results/

echo "✅ Nettoyage terminé!"
