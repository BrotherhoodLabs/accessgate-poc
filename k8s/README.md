# Kubernetes Deployment

Ce dossier contient tous les fichiers de déploiement Kubernetes pour l'application AccessGate PoC.

## Fichiers

- `namespace.yaml` - Définit le namespace Kubernetes
- `configmap.yaml` - Configuration de l'application
- `secret.yaml` - Secrets et clés de chiffrement
- `postgres.yaml` - Déploiement de la base de données PostgreSQL
- `backend.yaml` - Déploiement du backend Node.js
- `frontend.yaml` - Déploiement du frontend React
- `ingress.yaml` - Configuration de l'ingress pour l'exposition des services
- `deploy-k8s.sh` - Script de déploiement pour Linux/Mac
- `deploy-k8s.ps1` - Script de déploiement pour Windows
- `k8s-performance-test.sh` - Script de test de performance Kubernetes

## Déploiement

### Linux/Mac
```bash
./deploy-k8s.sh
```

### Windows
```powershell
.\deploy-k8s.ps1
```

## Test de performance
```bash
./k8s-performance-test.sh
```
