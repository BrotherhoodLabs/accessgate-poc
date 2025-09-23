# 🧪 Tests E2E AccessGate PoC

Ce document décrit l'organisation et l'utilisation des tests end-to-end (E2E) pour l'application AccessGate PoC.

## 📁 Organisation des Fichiers

```
scripts/
├── e2e/                          # Tests E2E
│   ├── run-all-k8s-e2e.py       # Script principal complet
│   ├── simple-e2e-test.py       # Tests simplifiés
│   ├── e2e-test-runner.py       # Tests avancés avec Playwright
│   └── requirements.txt         # Dépendances Python
├── deployment/                   # Scripts de déploiement
│   ├── deploy-k8s-e2e.sh        # Déploiement Kubernetes
│   └── cleanup-e2e.sh           # Nettoyage des ressources
├── monitoring/                   # Monitoring et métriques
│   └── grafana-dashboard.json   # Dashboard Grafana
└── README-E2E.md                # Documentation détaillée
```

## 🚀 Démarrage Rapide

### Windows (PowerShell)
```powershell
# Démarrage complet en une commande
.\start-e2e-tests.ps1
```

### Linux/macOS (Bash)
```bash
# Rendre le script exécutable
chmod +x start-e2e-tests.sh

# Démarrage complet
./start-e2e-tests.sh
```

### Script Python Direct
```bash
# Test simple
python scripts/e2e/simple-e2e-test.py

# Test complet
python scripts/e2e/run-all-k8s-e2e.py
```

## 📋 Prérequis

- **Python 3.8+** avec pip
- **kubectl** configuré et connecté à un cluster Kubernetes
- **Cluster Kubernetes** accessible (local ou distant)
- **Dépendances Python** : `requests` (installées automatiquement)

## 🧪 Types de Tests

### 1. Tests API
- ✅ **Health Check** - Vérification de la santé du backend
- ✅ **Inscription utilisateur** - Test d'inscription avec validation
- ✅ **Connexion utilisateur** - Test de connexion avec JWT
- ✅ **Endpoints protégés** - Test d'accès aux ressources protégées

### 2. Tests Frontend
- ✅ **Accès à l'interface** - Vérification de l'accessibilité
- ✅ **Validation du contenu** - Vérification du contenu RBAC
- ✅ **Tests Playwright** - Tests d'interface automatisés (optionnel)

### 3. Tests Kubernetes
- ✅ **Déploiement des pods** - Vérification du statut des pods
- ✅ **Port forwarding** - Configuration des accès locaux
- ✅ **Services** - Vérification de la connectivité des services

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
Importez le dashboard fourni : `scripts/monitoring/grafana-dashboard.json`

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

## 🔧 Scripts Disponibles

### Scripts Principaux

#### `start-e2e-tests.ps1` / `start-e2e-tests.sh`
**Scripts de démarrage principal** - Interface utilisateur complète
- Vérification des prérequis
- Installation automatique des dépendances
- Exécution des tests E2E
- Affichage des résultats et instructions

#### `scripts/e2e/run-all-k8s-e2e.py`
**Script principal complet** - Déploie tous les composants et exécute les tests E2E
- Déploiement automatique Kubernetes
- Configuration du port forwarding
- Tests API et frontend complets
- Génération des logs structurés

#### `scripts/e2e/simple-e2e-test.py`
**Script de test simplifié** - Teste uniquement l'API et l'accès frontend
- Tests rapides sans déploiement
- Vérification de la connectivité
- Tests d'inscription et connexion

#### `scripts/e2e/e2e-test-runner.py`
**Script de test avancé** - Inclut Playwright pour les tests d'interface
- Tests d'interface automatisés
- Simulation d'utilisateur
- Tests de navigation RBAC

### Scripts de Déploiement

#### `scripts/deployment/deploy-k8s-e2e.sh`
**Déploiement Kubernetes uniquement**
- Création du namespace
- Déploiement PostgreSQL
- Déploiement Backend et Frontend
- Configuration des services

#### `scripts/deployment/cleanup-e2e.sh`
**Nettoyage des ressources**
- Arrêt des port forwarding
- Suppression du namespace (optionnel)
- Nettoyage des fichiers de logs

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
python scripts/e2e/simple-e2e-test.py
```

### Test Complet
```bash
# Déploiement + tests complets
python scripts/e2e/run-all-k8s-e2e.py
```

### Test avec Interface
```bash
# Tests avec Playwright (nécessite installation)
pip install playwright
python -m playwright install chromium
python scripts/e2e/e2e-test-runner.py
```

## 🔄 Maintenance

### Nettoyage Régulier
```bash
# Nettoyer les logs anciens
rm -f *.jsonl

# Nettoyer les ressources Kubernetes
./scripts/deployment/cleanup-e2e.sh
```

### Mise à Jour
```bash
# Mettre à jour les dépendances
pip install -r scripts/e2e/requirements.txt --upgrade

# Mettre à jour Playwright
python -m playwright install --upgrade
```

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs dans `complete-e2e-results.jsonl`
2. Vérifiez le statut des pods Kubernetes
3. Testez manuellement les endpoints API
4. Consultez la documentation du projet principal

## 🎉 Fonctionnalités Implémentées

- ✅ **Déploiement automatique** des composants Kubernetes
- ✅ **Tests E2E complets** avec validation API et frontend
- ✅ **Logs structurés** compatibles Grafana
- ✅ **Métriques de performance** en temps réel
- ✅ **Scripts de nettoyage** automatique
- ✅ **Interface utilisateur** intuitive
- ✅ **Documentation complète** et exemples
- ✅ **Support multi-plateforme** (Windows/Linux/macOS)
