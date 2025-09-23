# Scripts E2E AccessGate PoC

Ce répertoire contient tous les scripts nécessaires pour déployer et tester l'application AccessGate PoC dans Kubernetes avec des tests end-to-end complets.

## 🚀 Démarrage Rapide

### Windows (PowerShell)
```powershell
# Démarrage complet en une commande
.\scripts\start-all.ps1
```

### Linux/macOS (Bash)
```bash
# Démarrage complet en une commande
chmod +x scripts/*.sh
./scripts/start-all.sh
```

## 📋 Prérequis

- **Python 3.8+** avec pip
- **kubectl** configuré et connecté à un cluster Kubernetes
- **Cluster Kubernetes** accessible (local ou distant)
- **Dépendances Python** : `requests`, `playwright` (installées automatiquement)

## 🛠️ Scripts Disponibles

### Scripts Principaux

#### `run-all-k8s-e2e.py`
**Script principal complet** - Déploie tous les composants et exécute les tests E2E
```bash
python scripts/run-all-k8s-e2e.py
```

#### `simple-e2e-test.py`
**Script de test simplifié** - Teste uniquement l'API et l'accès frontend
```bash
python scripts/simple-e2e-test.py
```

#### `e2e-test-runner.py`
**Script de test avancé** - Inclut Playwright pour les tests d'interface
```bash
python scripts/e2e-test-runner.py
```

### Scripts de Configuration

#### `setup-e2e-tests.ps1` / `setup-e2e-tests.sh`
**Configuration des dépendances**
```powershell
# Windows
.\scripts\setup-e2e-tests.ps1

# Linux/macOS
./scripts/setup-e2e-tests.sh
```

#### `deploy-k8s-e2e.sh`
**Déploiement Kubernetes uniquement**
```bash
./scripts/deploy-k8s-e2e.sh
```

#### `cleanup-e2e.sh`
**Nettoyage des ressources**
```bash
./scripts/cleanup-e2e.sh
```

## 📊 Logs et Métriques

### Format des Logs
Tous les scripts génèrent des logs structurés au format JSONL (JSON Lines) compatibles avec Grafana :

```json
{
  "timestamp": "2025-09-23T18:00:24.040125Z",
  "component": "e2e_runner",
  "event_type": "test_suite_start",
  "message": "Démarrage suite de tests E2E",
  "level": "INFO"
}
```

### Fichiers de Logs
- `complete-e2e-results.jsonl` - Logs du script principal
- `e2e-test-results.jsonl` - Logs des tests simples
- Console - Affichage en temps réel

### Métriques Collectées
- **Taux de réussite des tests** (`test_success_rate`)
- **Durée totale des tests** (`test_total_duration`)
- **Uptime du backend** (`backend_uptime`)
- **Compteurs d'utilisateurs** (`users_count`)
- **Succès/échecs d'inscription** (`user_registration_success/failure`)
- **Succès/échecs de connexion** (`user_login_success/failure`)

## 📈 Visualisation Grafana

### Dashboard Grafana
Importez le dashboard fourni : `scripts/grafana-dashboard.json`

### Configuration de la Source de Données
1. Créer une source de données "Loki" ou "JSON"
2. Pointer vers le fichier `complete-e2e-results.jsonl`
3. Configurer les requêtes pour extraire les métriques

### Requêtes Exemple
```promql
# Taux de réussite des tests
sum(rate(test_success_rate[5m]))

# Durée des tests
test_total_duration

# Métriques d'API
rate(user_registration_success[5m])
rate(user_login_success[5m])
```

## 🧪 Tests Inclus

### Tests API
- ✅ **Health Check** - Vérification de la santé du backend
- ✅ **Inscription utilisateur** - Test d'inscription avec validation
- ✅ **Connexion utilisateur** - Test de connexion avec JWT
- ✅ **Endpoints protégés** - Test d'accès aux ressources protégées

### Tests Frontend
- ✅ **Accès à l'interface** - Vérification de l'accessibilité
- ✅ **Validation du contenu** - Vérification du contenu RBAC
- ✅ **Tests Playwright** - Tests d'interface automatisés (script avancé)

### Tests Kubernetes
- ✅ **Déploiement des pods** - Vérification du statut des pods
- ✅ **Port forwarding** - Configuration des accès locaux
- ✅ **Services** - Vérification de la connectivité des services

## 🔧 Configuration Avancée

### Variables d'Environnement
```bash
export K8S_NAMESPACE="accessgate-poc"
export BACKEND_PORT="8001"
export FRONTEND_PORT="3001"
export TEST_TIMEOUT="300"
```

### Personnalisation des Tests
Modifiez les paramètres dans les scripts :
- **Timeout des tests** : `timeout=10` dans les requêtes
- **Données de test** : emails et mots de passe dans les fonctions de test
- **Seuils de réussite** : `success_rate >= 80` dans la validation

## 🐛 Dépannage

### Problèmes Courants

#### Port forwarding échoue
```bash
# Vérifier les pods
kubectl get pods -n accessgate-poc

# Redémarrer le port forwarding
kubectl port-forward service/accessgate-backend-service 8001:8000 -n accessgate-poc
```

#### Tests API échouent
```bash
# Vérifier la santé du backend
curl http://localhost:8001/health

# Vérifier les logs du backend
kubectl logs -l app=accessgate-backend -n accessgate-poc
```

#### Tests Frontend échouent
```bash
# Vérifier l'accès au frontend
curl http://localhost:3001

# Vérifier les logs du frontend
kubectl logs -l app=accessgate-frontend -n accessgate-poc
```

### Logs de Debug
Activez les logs détaillés en modifiant le niveau de logging :
```python
logging.basicConfig(level=logging.DEBUG)
```

## 📚 Exemples d'Utilisation

### Test Rapide
```bash
# Test simple sans déploiement
python scripts/simple-e2e-test.py
```

### Test Complet
```bash
# Déploiement + tests complets
python scripts/run-all-k8s-e2e.py
```

### Test avec Interface
```bash
# Tests avec Playwright (nécessite installation)
pip install playwright
python -m playwright install chromium
python scripts/e2e-test-runner.py
```

## 🎯 Résultats Attendus

### Succès (≥80%)
- ✅ Tous les pods Kubernetes sont prêts
- ✅ Backend répond aux health checks
- ✅ Inscription et connexion utilisateur fonctionnent
- ✅ Frontend est accessible et valide
- ✅ API protégée répond correctement

### Métriques de Performance
- **Durée totale** : < 60 secondes
- **Taux de réussite** : ≥ 80%
- **Uptime backend** : > 0 secondes
- **Temps de réponse API** : < 1 seconde

## 🔄 Maintenance

### Nettoyage Régulier
```bash
# Nettoyer les logs anciens
rm -f *.jsonl

# Nettoyer les ressources Kubernetes
./scripts/cleanup-e2e.sh
```

### Mise à Jour
```bash
# Mettre à jour les dépendances
pip install -r scripts/requirements.txt --upgrade

# Mettre à jour Playwright
python -m playwright install --upgrade
```

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs dans `complete-e2e-results.jsonl`
2. Vérifiez le statut des pods Kubernetes
3. Testez manuellement les endpoints API
4. Consultez la documentation du projet principal
