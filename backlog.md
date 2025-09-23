# 📋 Backlog - AccessGate PoC RBAC

**Organisation:** [BrotherhoodLabs](https://github.com/BrotherhoodLabs/)  
**Repository:** BrotherhoodLabs/accessgate-poc (SSH)  
**Objectif:** PoC RBAC (Node.js + React) avec authentification JWT et interface d'administration

---

## 🚀 Phase 1: Initialisation & Setup

### 1. Repository & Structure
- [x] Créer le repository GitHub via SSH
  - [x] Nom du repo: accessgate-poc (public ou privé)
  - [x] Vérifier/ajouter la clé SSH à GitHub
  - [x] Initialiser la structure: backend/, frontend/, infra/, docs/, .gitignore, LICENSE, README.md
  - [ ] Protéger la branche main et ajouter PR template

### 2. Documentation & Vision
- [x] Définir la vision du PoC (docs/vision.md)
  - [x] But: démontrer un RBAC clair (users, roles, permissions) avec auth JWT et UI d'administration
  - [x] Utilisable seul (web app) et intégrable plus tard (API REST)
  - [x] Portée PoC: Postgres + REST, règles simples, démo end-to-end

### 3. Workflow & Conventions
- [ ] Workflow commits & push
  - [ ] Après CHAQUE ticket: commit + push
  - [ ] Conventions Google/Conventional: `<type>(scope): message`
  - [ ] Ex: `feat(backend): add role assignment endpoint`

---

## 🔧 Phase 2: Backend Development

### 4. Backend — Initialisation Node.js
- [x] Choix: Node.js 20 + Express + TypeScript
- [x] Tools: ts-node-dev, eslint, prettier, jest
- [x] Config de base: scripts npm, tsconfig, env (.env.example)

### 5. Backend — Modèle RBAC (docs/rbac-model.md)
- [x] Entités: User, Role, Permission, UserRole, RolePermission
- [x] Rôles de départ: ADMIN, MANAGER, VIEWER
- [x] Permissions de départ: user.read, user.write, role.read, role.write, resource.read
- [x] Diagramme relationnel simple

### 6. Backend — Base de données
- [x] Choix: PostgreSQL + Prisma (ou Knex). Décision: Prisma pour rapidité
- [x] Schéma initial + migrations (users, roles, permissions, joints)
- [x] Seed de données: 1 admin, 1 manager, 1 viewer, rôles & permissions par défaut

### 7. Backend — Authentification
- [x] Endpoints: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout
- [x] JWT access + refresh, hashing bcrypt, validation (zod/yup)
- [x] Politique tokens et expiration (ex: 15m/7j)

### 8. Backend — Middleware d'autorisation
- [x] Middleware checkAuth (JWT) et checkPermission(permission:string)
- [x] Stratégie RBAC: permissions par rôle, association user→rôles
- [x] Gestion des erreurs standardisées (401/403)

### 9. Backend — Endpoints ressources
- [x] GET /users (admin only), GET /users/:id (self or admin)
- [x] POST /users, PATCH /users/:id, DELETE /users/:id (admin/manager selon règles PoC)
- [x] GET /roles, POST /roles, PATCH /roles/:id, DELETE /roles/:id
- [x] POST /roles/:id/permissions (assign), POST /users/:id/roles (assign)
- [x] GET /permissions, GET /permissions/grouped

### 10. Backend — Tests
- [ ] Tests unitaires: services/middlewares (jest)
- [ ] Tests d'intégration: auth + RBAC sur endpoints clés
- [ ] Couverture minimale: 70% (PoC)

---

## ⚛️ Phase 3: Frontend Development

### 11. Frontend — Initialisation React
- [x] React 19 + Vite + TypeScript
- [x] UI lib: Material-UI + react-router
- [x] Gestion d'état: Zustand
- [x] Fichiers .env et configuration baseURL API

### 12. Frontend — Auth & routing protégé
- [x] Pages: Login, Logout, Refresh flow
- [x] Stockage sécurisé du token (in-memory + refresh)
- [x] Route guards: RequireAuth + RequirePermission

### 13. Frontend — UI d'administration RBAC
- [x] Pages: Users, Roles, Permissions
- [x] Actions: créer/éditer/supprimer user & role, assigner rôle à user, assigner permission à rôle
- [x] Tableaux avec pagination, recherche simple, modales de confirmation

### 14. Frontend — UX & feedback
- [x] Toasts succès/erreur, loaders, validation client
- [x] Affichage conditionnel selon permissions (ex: masquer boutons)

---

## 🐳 Phase 4: Infrastructure & DevOps

### 15. Infra — Docker & Compose
- [x] Dockerfile backend (node:20-alpine), Dockerfile frontend (nginx)
- [x] docker-compose: services postgres, backend, frontend
- [x] Variables d'env: JWT_SECRET, DATABASE_URL, CORS_ORIGINS
- [x] Scripts de démarrage (PowerShell + Bash)

### 16. Observabilité minimale
- [x] Logs JSON backend (pino), correlationId middleware
- [x] Health checks: GET /health, readiness/liveness
- [ ] (Option) OpenAPI via swagger-jsdoc + swagger-ui-express

### 17. Sécurité de base
- [x] CORS strict (origins du frontend)
- [x] Rate limiting sur /auth/login
- [x] Headers de sécurité (helmet)

---

## 📚 Phase 5: Documentation & Qualité

### 18. Documentation
- [x] README.md: architecture, démarrage rapide, workflows, endpoints, rôles & permissions
- [x] docs/rbac-cookbook.md: exemples d'autorisation côté UI + API
- [x] Schémas: simple diagramme relations RBAC

### 19. Qualité & CI
- [x] ESLint/Prettier configs (backend & frontend)
- [ ] GitHub Actions: lint + test + build pour backend et frontend
- [ ] Badges de statut dans README

---

## ✅ Phase 6: Validation & Finalisation

### 20. Validation PoC End-to-End
- [x] Lancer docker-compose et créer un utilisateur admin via seed
- [x] Se connecter depuis le frontend, naviguer dans l'admin
- [x] Vérifier qu'un VIEWER ne peut pas modifier utilisateurs/rôles
- [x] Scripts de validation automatisés (PowerShell + Bash)

### 21. Rétro & extensions (docs/retro.md)
- [ ] Pistes: ABAC/Policy Engine (OPA), audit logs, Webhooks, OIDC Keycloak, pagination serveur, i18n

---

## 🎯 Critères de Succès

### Technique
- [ ] Couverture de tests > 70%
- [ ] Temps de démarrage < 30s
- [ ] API response time < 200ms
- [ ] Zero critical security issues

### Fonctionnel
- [ ] Démonstration complète en < 5 minutes
- [ ] Interface intuitive sans formation
- [ ] Documentation claire et complète
- [ ] Code maintenable et extensible

---

## 📊 Progression Globale

**Phase 1 (Initialisation):** 2/3 ✅  
**Phase 2 (Backend):** 7/7 ✅  
**Phase 3 (Frontend):** 4/4 ✅  
**Phase 4 (Infrastructure):** 2/3 ✅  
**Phase 5 (Documentation):** 3/3 ✅  
**Phase 6 (Validation):** 1/2 ✅  

**Total:** 19/22 (86%) ✅

---

*Dernière mise à jour: 23/09/2025*
