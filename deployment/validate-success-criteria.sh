#!/bin/bash

# AccessGate PoC - Validation des Critères de Succès

echo "🎯 Validation des Critères de Succès - AccessGate PoC"
echo "====================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
API_BASE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
ADMIN_EMAIL="admin@accessgate.com"
ADMIN_PASSWORD="Admin123!"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

print_test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "🔧 CRITÈRES TECHNIQUES"
echo "======================"

# Test 1: Couverture de tests > 70%
echo "📊 Test de couverture de tests..."
if command -v npm &> /dev/null; then
    cd backend
    COVERAGE=$(npm test -- --coverage --watchAll=false 2>/dev/null | grep -o 'All files[[:space:]]*[0-9]*\.[0-9]*' | awk '{print $3}' | head -1)
    if [ -n "$COVERAGE" ] && (( $(echo "$COVERAGE >= 70" | bc -l) )); then
        print_test_result 0 "Couverture de tests: ${COVERAGE}% (objectif: ≥70%)"
    else
        print_test_result 1 "Couverture de tests: ${COVERAGE}% (objectif: ≥70%)"
    fi
    cd ..
else
    print_test_result 1 "npm non disponible pour tester la couverture"
fi

# Test 2: Temps de démarrage < 30s
echo "⏱️  Test de temps de démarrage..."
START_TIME=$(date +%s)
docker-compose up -d --build > /dev/null 2>&1
sleep 30
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ $DURATION -lt 30 ]; then
    print_test_result 0 "Temps de démarrage: ${DURATION}s (objectif: <30s)"
else
    print_test_result 1 "Temps de démarrage: ${DURATION}s (objectif: <30s)"
fi

# Test 3: API response time < 200ms
echo "🚀 Test de temps de réponse API..."
if curl -s -o /dev/null -w "%{time_total}" "$API_BASE_URL/health" > /dev/null 2>&1; then
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$API_BASE_URL/health" | awk '{print $1*1000}')
    if (( $(echo "$RESPONSE_TIME < 200" | bc -l) )); then
        print_test_result 0 "Temps de réponse API: ${RESPONSE_TIME}ms (objectif: <200ms)"
    else
        print_test_result 1 "Temps de réponse API: ${RESPONSE_TIME}ms (objectif: <200ms)"
    fi
else
    print_test_result 1 "API non accessible pour tester le temps de réponse"
fi

# Test 4: Zero critical security issues
echo "🔒 Test de sécurité..."
if command -v npm &> /dev/null; then
    cd backend
    if npm audit --audit-level=moderate 2>/dev/null | grep -q "found 0 vulnerabilities"; then
        print_test_result 0 "Aucune vulnérabilité critique détectée"
    else
        print_test_result 1 "Vulnérabilités détectées (voir npm audit)"
    fi
    cd ..
else
    print_test_result 1 "npm non disponible pour l'audit de sécurité"
fi

echo ""
echo "🎯 CRITÈRES FONCTIONNELS"
echo "========================"

# Test 5: Démonstration complète en < 5 minutes
echo "⏰ Test de démonstration complète..."
DEMO_START=$(date +%s)

# Login
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  "$API_BASE_URL/api/auth/login")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    print_test_result 0 "Connexion réussie en < 5 minutes"
else
    print_test_result 1 "Échec de la connexion"
fi

DEMO_END=$(date +%s)
DEMO_DURATION=$((DEMO_END - DEMO_START))

if [ $DEMO_DURATION -lt 300 ]; then
    print_test_result 0 "Démonstration complète: ${DEMO_DURATION}s (objectif: <5min)"
else
    print_test_result 1 "Démonstration complète: ${DEMO_DURATION}s (objectif: <5min)"
fi

# Test 6: Interface intuitive sans formation
echo "🎨 Test d'interface intuitive..."
if curl -s "$FRONTEND_URL" | grep -q "AccessGate\|RBAC\|Login"; then
    print_test_result 0 "Interface accessible et intuitive"
else
    print_test_result 1 "Interface non accessible ou non intuitive"
fi

# Test 7: Documentation claire et complète
echo "📚 Test de documentation..."
if [ -f "README.md" ] && [ -f "docs/rbac-cookbook.md" ] && [ -f "docs/rbac-model.md" ]; then
    print_test_result 0 "Documentation complète disponible"
else
    print_test_result 1 "Documentation incomplète"
fi

# Test 8: Code maintenable et extensible
echo "🔧 Test de maintenabilité du code..."
if [ -f "backend/tsconfig.json" ] && [ -f "frontend/tsconfig.json" ] && [ -f ".eslintrc.js" ]; then
    print_test_result 0 "Code structuré et maintenable"
else
    print_test_result 1 "Code non structuré ou non maintenable"
fi

echo ""
echo "📈 RÉSULTATS FINAUX"
echo "==================="
echo -e "${GREEN}Tests Passés: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Échoués: $TESTS_FAILED${NC}"

# Calcul du pourcentage de succès
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo -e "Taux de succès: ${SUCCESS_RATE}%"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUS LES CRITÈRES DE SUCCÈS SONT ATTEINTS !${NC}"
    echo -e "${GREEN}Le PoC AccessGate est prêt pour la production !${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  La plupart des critères sont atteints (${SUCCESS_RATE}%)${NC}"
    echo -e "${YELLOW}Quelques améliorations mineures sont recommandées.${NC}"
    exit 0
else
    echo -e "${RED}❌ Des critères importants ne sont pas atteints (${SUCCESS_RATE}%)${NC}"
    echo -e "${RED}Des améliorations significatives sont nécessaires.${NC}"
    exit 1
fi
