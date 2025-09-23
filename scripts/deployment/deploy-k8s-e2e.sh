#!/bin/bash
# Script de déploiement Kubernetes pour les tests E2E

set -e

echo "🚀 Déploiement Kubernetes pour tests E2E AccessGate PoC"
echo "======================================================"

# Vérifier kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl n'est pas installé"
    exit 1
fi

# Vérifier que le cluster est accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cluster Kubernetes non accessible"
    exit 1
fi

NAMESPACE="accessgate-poc"

echo "📦 Création du namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

echo "🗄️ Déploiement PostgreSQL..."
kubectl apply -f k8s/postgres.yaml -n $NAMESPACE

echo "⏳ Attente de PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s

echo "🔧 Application des migrations de base de données..."
# Attendre que PostgreSQL soit complètement prêt
sleep 10

# Exécuter les migrations via un pod temporaire
kubectl run postgres-migrate --image=postgres:15 --rm -i --restart=Never -n $NAMESPACE -- \
  psql -h postgres-service -U accessgate -d accessgate_poc -c "
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) UNIQUE NOT NULL,
      resource VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, role_id)
    );
    
    CREATE TABLE IF NOT EXISTS role_permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
      permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role_id, permission_id)
    );
    
    -- Insérer des données de test
    INSERT INTO roles (name, description) VALUES 
      ('Admin', 'Administrateur système'),
      ('Manager', 'Gestionnaire d''équipe'),
      ('User', 'Utilisateur standard')
    ON CONFLICT (name) DO NOTHING;
    
    INSERT INTO permissions (name, resource, description) VALUES 
      ('user.read', 'users', 'Lire les utilisateurs'),
      ('user.write', 'users', 'Modifier les utilisateurs'),
      ('role.read', 'roles', 'Lire les rôles'),
      ('role.write', 'roles', 'Modifier les rôles'),
      ('permission.read', 'permissions', 'Lire les permissions'),
      ('permission.write', 'permissions', 'Modifier les permissions')
    ON CONFLICT (name) DO NOTHING;
    
    -- Assigner des permissions aux rôles
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p
    WHERE r.name = 'Admin'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p
    WHERE r.name = 'Manager' AND p.name IN ('user.read', 'role.read')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p
    WHERE r.name = 'User' AND p.name IN ('user.read')
    ON CONFLICT DO NOTHING;
  "

echo "🔧 Déploiement Backend..."
kubectl apply -f k8s/backend.yaml -n $NAMESPACE

echo "⏳ Attente du Backend..."
kubectl wait --for=condition=ready pod -l app=accessgate-backend -n $NAMESPACE --timeout=300s

echo "🌐 Déploiement Frontend..."
kubectl apply -f k8s/frontend.yaml -n $NAMESPACE

echo "⏳ Attente du Frontend..."
kubectl wait --for=condition=ready pod -l app=accessgate-frontend -n $NAMESPACE --timeout=300s

echo "📊 Vérification du statut des pods..."
kubectl get pods -n $NAMESPACE

echo "🔗 Configuration des services..."
kubectl apply -f k8s/services.yaml -n $NAMESPACE

echo "✅ Déploiement terminé!"
echo ""
echo "Pour exécuter les tests E2E:"
echo "  python3 scripts/e2e-test-runner.py"
echo ""
echo "Pour accéder à l'application:"
echo "  kubectl port-forward service/accessgate-frontend-service 3001:3000 -n $NAMESPACE"
echo "  kubectl port-forward service/accessgate-backend-service 8001:8000 -n $NAMESPACE"
