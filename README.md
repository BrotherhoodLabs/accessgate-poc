# AccessGate PoC - RBAC (Role-Based Access Control)

Un Proof of Concept (PoC) démontrant un système RBAC complet avec authentification JWT et interface d'administration.

[![Build Status](https://github.com/BrotherhoodLabs/accessgate-poc/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/BrotherhoodLabs/accessgate-poc/actions)
[![Code Coverage](https://codecov.io/gh/BrotherhoodLabs/accessgate-poc/branch/main/graph/badge.svg)](https://codecov.io/gh/BrotherhoodLabs/accessgate-poc)
[![Security Scan](https://github.com/BrotherhoodLabs/accessgate-poc/workflows/Security%20Scan/badge.svg)](https://github.com/BrotherhoodLabs/accessgate-poc/security)
[![Docker Build](https://github.com/BrotherhoodLabs/accessgate-poc/workflows/Docker%20Build/badge.svg)](https://github.com/BrotherhoodLabs/accessgate-poc/pkgs/container/accessgate-poc)
[![Backend Status](https://img.shields.io/badge/Backend-Ready-brightgreen)](backend/)
[![Frontend Status](https://img.shields.io/badge/Frontend-Ready-brightgreen)](frontend/)
[![Docker Status](https://img.shields.io/badge/Docker-Ready-blue)](docker-compose.yml)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 🎯 Vision

Ce PoC vise à démontrer un système de contrôle d'accès basé sur les rôles (RBAC) clair et fonctionnel, utilisable de manière autonome (application web) et intégrable plus tard via API REST.

## 🏗️ Architecture

- **Backend**: Node.js 20 + Express + TypeScript + PostgreSQL + Prisma
- **Frontend**: React 19 + Vite + TypeScript + Material-UI + Zustand
- **Infrastructure**: Docker + Docker Compose
- **Authentification**: JWT (access + refresh tokens)

## 🚀 Démarrage rapide

### Prérequis

- Docker & Docker Compose
- Git

### Installation et démarrage

1. **Cloner le repository**
```bash
git clone git@github.com:BrotherhoodLabs/accessgate-poc.git
cd accessgate-poc
```

2. **Démarrer avec Docker Compose (Recommandé)**
```bash
# Linux/Mac
./deployment/start-dev.sh

# Windows PowerShell
.\deployment\start-dev.ps1

# Ou manuellement
cd infra
docker-compose up -d
```

3. **Accéder à l'application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Base de données**: localhost:5432

### Comptes de démonstration

| Email | Mot de passe | Rôle | Permissions |
|-------|-------------|------|-------------|
| admin@accessgate.com | Admin123! | ADMIN | Toutes |
| manager@accessgate.com | Manager123! | MANAGER | Gestion utilisateurs |
| viewer@accessgate.com | Viewer123! | VIEWER | Lecture seule |

## 🛠️ Développement local

### Backend
```bash
cd backend
npm install
cp env.example .env
# Configurer .env avec vos paramètres
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp env.example .env
# Configurer .env avec vos paramètres
npm run dev
```

### Base de données
```bash
# Avec Docker
docker-compose up postgres -d

# Ou installer PostgreSQL localement
# Puis configurer DATABASE_URL dans backend/.env
```

## 📋 Rôles et Permissions

### Rôles par défaut
- **ADMIN**: Accès complet à tous les utilisateurs et rôles
- **MANAGER**: Gestion des utilisateurs (lecture/écriture)
- **VIEWER**: Lecture seule des ressources

### Permissions disponibles
- `user.read`, `user.write`, `user.delete`
- `role.read`, `role.write`, `role.delete`
- `resource.read`, `resource.write`, `resource.delete`

## 🔧 Endpoints API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Renouvellement token
- `POST /api/auth/logout` - Déconnexion

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs (admin)
- `GET /api/users/:id` - Détails utilisateur
- `POST /api/users` - Créer utilisateur
- `PATCH /api/users/:id` - Modifier utilisateur
- `DELETE /api/users/:id` - Supprimer utilisateur
- `POST /api/users/:id/roles` - Assigner rôle
- `DELETE /api/users/:id/roles/:roleId` - Retirer rôle

### Rôles
- `GET /api/roles` - Liste des rôles
- `POST /api/roles` - Créer rôle
- `PATCH /api/roles/:id` - Modifier rôle
- `DELETE /api/roles/:id` - Supprimer rôle
- `POST /api/roles/:id/permissions` - Assigner permission
- `DELETE /api/roles/:id/permissions/:permissionId` - Retirer permission

### Santé
- `GET /api/health` - Health check

## 🧪 Tests

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
```

## 📊 Fonctionnalités

### ✅ Implémentées
- [x] Authentification JWT (login/register/refresh)
- [x] Système RBAC complet
- [x] Interface d'administration
- [x] Protection des routes
- [x] Gestion des utilisateurs
- [x] Docker & Docker Compose
- [x] Documentation complète

### 🚧 En cours
- [ ] Gestion des rôles (UI)
- [ ] Tests automatisés
- [ ] CI/CD

### 📋 À venir
- [ ] Audit logs
- [ ] API documentation (Swagger)
- [ ] Monitoring
- [ ] Tests E2E

## 📚 Documentation

- [Vision du projet](docs/vision.md)
- [Modèle RBAC](docs/rbac-model.md)
- [Backlog de développement](backlog.md)

## 🐳 Docker

### Services
- **postgres**: Base de données PostgreSQL
- **backend**: API Node.js
- **frontend**: Interface React

### Commandes utiles
```bash
# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart backend

# Arrêter tous les services
docker-compose down

# Reconstruire les images
docker-compose build --no-cache
```

## 🔒 Sécurité

- Authentification JWT avec refresh tokens
- Hachage des mots de passe (bcrypt)
- Rate limiting sur les endpoints d'auth
- CORS configuré
- Headers de sécurité (Helmet)
- Validation des données (Zod)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'feat(scope): add amazing feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🏢 Organisation

Développé par [BrotherhoodLabs](https://github.com/BrotherhoodLabs/)

---

**Status du projet**: 🟢 Fonctionnel - Prêt pour démonstration
