# Infrastructure

Ce dossier contient les fichiers d'infrastructure pour l'application AccessGate PoC.

## Fichiers

- `init-db.sql` - Script d'initialisation de la base de données PostgreSQL
- `docker-compose.yml` - Orchestration des services Docker pour le développement

## Utilisation

### Démarrage avec Docker Compose
```bash
# Depuis la racine du projet
cd infra
docker-compose up -d

# Ou depuis le dossier deployment
./start-dev.sh        # Linux/Mac
.\start-dev.ps1       # Windows
```

### Services inclus
- **PostgreSQL** - Base de données principale
- **Backend** - API Node.js + Express
- **Frontend** - Application React + Nginx

### Variables d'environnement
Les variables d'environnement sont définies dans le fichier `docker-compose.yml` :
- `JWT_SECRET` - Clé secrète pour les tokens JWT
- `DATABASE_URL` - URL de connexion à la base de données
- `CORS_ORIGINS` - Origines autorisées pour CORS
