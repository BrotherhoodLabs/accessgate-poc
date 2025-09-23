# Architecture du Projet AccessGate PoC

## Structure des Dossiers

```
accessgate-poc/
├── backend/                    # Backend Node.js + Express + TypeScript
│   ├── src/
│   │   ├── __tests__/         # Tests unitaires et d'intégration
│   │   ├── config/            # Configuration (Swagger, etc.)
│   │   ├── controllers/       # Contrôleurs API
│   │   ├── middleware/        # Middleware (auth, rate limiting, etc.)
│   │   ├── routes/            # Définition des routes
│   │   ├── services/          # Logique métier
│   │   ├── utils/             # Utilitaires
│   │   └── index.ts           # Point d'entrée
│   ├── prisma/                # Schéma de base de données
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # Frontend React + Vite + TypeScript
│   ├── src/
│   │   ├── components/        # Composants React
│   │   ├── pages/             # Pages de l'application
│   │   ├── services/          # Services API
│   │   ├── store/             # Gestion d'état (Zustand)
│   │   ├── types/             # Types TypeScript
│   │   └── utils/             # Utilitaires
│   ├── Dockerfile
│   └── package.json
├── k8s/                       # Déploiement Kubernetes
│   ├── namespace.yaml         # Namespace
│   ├── configmap.yaml         # Configuration
│   ├── secret.yaml            # Secrets
│   ├── postgres.yaml          # Base de données
│   ├── backend.yaml           # Backend
│   ├── frontend.yaml          # Frontend
│   ├── ingress.yaml           # Ingress
│   ├── deploy-k8s.sh          # Script de déploiement Linux/Mac
│   ├── deploy-k8s.ps1         # Script de déploiement Windows
│   └── k8s-performance-test.sh # Test de performance
├── deployment/                 # Scripts de déploiement et validation
│   ├── validate-poc.sh        # Validation end-to-end Linux/Mac
│   ├── validate-poc.ps1       # Validation end-to-end Windows
│   ├── validate-success-criteria.sh # Validation critères de succès Linux/Mac
│   └── validate-success-criteria.ps1 # Validation critères de succès Windows
├── tests/                      # Tests de performance et smoke
│   ├── performance.test.ts    # Tests de performance
│   └── smoke.test.ts          # Tests smoke
├── infra/                      # Infrastructure
│   ├── init-db.sql            # Script d'initialisation DB
│   ├── docker-compose.yml     # Orchestration Docker
│   └── README.md              # Documentation infrastructure
├── docs/                       # Documentation
│   ├── architecture.md        # Architecture (ce fichier)
│   ├── rbac-model.md          # Modèle RBAC
│   ├── rbac-cookbook.md       # Exemples d'utilisation
│   ├── poc-summary.md         # Résumé du PoC
│   ├── retro.md               # Rétrospective
│   └── vision.md              # Vision du projet
├── deployment/                 # Scripts de déploiement et validation
│   ├── start-dev.sh           # Script de démarrage Linux/Mac
│   ├── start-dev.ps1          # Script de démarrage Windows
│   ├── validate-poc.sh        # Validation end-to-end Linux/Mac
│   ├── validate-poc.ps1       # Validation end-to-end Windows
│   ├── validate-success-criteria.sh # Validation critères de succès Linux/Mac
│   ├── validate-success-criteria.ps1 # Validation critères de succès Windows
│   └── README.md              # Documentation déploiement
├── README.md                  # Documentation principale
├── backlog.md                 # Backlog du projet
└── LICENSE                    # Licence MIT
```

## Architecture Technique

### Backend
- **Framework:** Node.js 20 + Express + TypeScript
- **Base de données:** PostgreSQL + Prisma ORM
- **Authentification:** JWT (access + refresh tokens)
- **Sécurité:** bcrypt, CORS, rate limiting, Helmet
- **Tests:** Jest + Supertest
- **Documentation:** Swagger/OpenAPI

### Frontend
- **Framework:** React 19 + Vite + TypeScript
- **UI:** Material-UI (MUI)
- **État:** Zustand
- **Routing:** React Router
- **HTTP:** Axios

### Infrastructure
- **Conteneurisation:** Docker + Docker Compose
- **Orchestration:** Kubernetes
- **Base de données:** PostgreSQL
- **Reverse Proxy:** Nginx (frontend)

## Flux de Données

1. **Authentification:** Frontend → Backend → JWT → Stockage local
2. **API Calls:** Frontend → Axios → Backend → Prisma → PostgreSQL
3. **Autorisation:** Middleware → Vérification JWT → Vérification permissions
4. **UI:** Composants → Store (Zustand) → API → Backend

## Tests

### Tests Unitaires
- Services backend (auth, user, role, permission)
- Middleware (auth, rate limiting, error handling)
- Composants React (si nécessaire)

### Tests d'Intégration
- Endpoints API complets
- Flux d'authentification
- Gestion des erreurs

### Tests de Performance
- Temps de réponse des endpoints
- Gestion des requêtes concurrentes
- Utilisation mémoire

### Tests Smoke
- Démarrage de l'application
- Fonctionnement des endpoints principaux
- Gestion des erreurs

## Déploiement

### Développement
```bash
# Docker Compose
cd infra
docker-compose up -d

# Ou scripts de démarrage
./deployment/start-dev.sh        # Linux/Mac
.\deployment\start-dev.ps1       # Windows
```

### Production (Kubernetes)
```bash
# Déploiement
./k8s/deploy-k8s.sh   # Linux/Mac
.\k8s\deploy-k8s.ps1  # Windows
```

### Validation
```bash
# Validation end-to-end
./deployment/validate-poc.sh        # Linux/Mac
.\deployment\validate-poc.ps1       # Windows

# Validation critères de succès
./deployment/validate-success-criteria.sh    # Linux/Mac
.\deployment\validate-success-criteria.ps1   # Windows
```

## Sécurité

- **Authentification:** JWT avec refresh tokens
- **Autorisation:** RBAC (Role-Based Access Control)
- **Chiffrement:** bcrypt pour les mots de passe
- **CORS:** Configuration stricte
- **Rate Limiting:** Protection contre les attaques par force brute
- **Headers de sécurité:** Helmet.js
- **Validation:** Zod pour la validation des données

## Monitoring et Observabilité

- **Logs:** Pino (JSON structuré)
- **Correlation ID:** Traçabilité des requêtes
- **Health Checks:** Endpoints de santé
- **Documentation API:** Swagger/OpenAPI
- **Tests de performance:** Monitoring des temps de réponse
