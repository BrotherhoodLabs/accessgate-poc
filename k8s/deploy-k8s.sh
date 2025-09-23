#!/bin/bash

# AccessGate PoC - Kubernetes Deployment Script

echo "🚀 Deploying AccessGate PoC to Kubernetes..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
NAMESPACE="accessgate-poc"
BACKEND_IMAGE="accessgate-backend:latest"
FRONTEND_IMAGE="accessgate-frontend:latest"

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if minikube is running (for local development)
if command -v minikube &> /dev/null; then
    if ! minikube status &> /dev/null; then
        echo -e "${YELLOW}⚠️  Minikube is not running. Starting minikube...${NC}"
        minikube start
    fi
fi

echo "🔧 Building Docker images..."

# Build backend image
echo "Building backend image..."
docker build -t $BACKEND_IMAGE ./backend
print_status $? "Backend image built successfully"

# Build frontend image
echo "Building frontend image..."
docker build -t $FRONTEND_IMAGE ./frontend
print_status $? "Frontend image built successfully"

# Load images into minikube (if using minikube)
if command -v minikube &> /dev/null; then
    echo "Loading images into minikube..."
    minikube image load $BACKEND_IMAGE
    minikube image load $FRONTEND_IMAGE
    print_status $? "Images loaded into minikube"
fi

echo "📦 Deploying to Kubernetes..."

# Create namespace
kubectl apply -f k8s/namespace.yaml
print_status $? "Namespace created"

# Apply ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
print_status $? "ConfigMap and Secrets applied"

# Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml
print_status $? "PostgreSQL deployed"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
print_status $? "PostgreSQL is ready"

# Deploy Backend
kubectl apply -f k8s/backend.yaml
print_status $? "Backend deployed"

# Wait for Backend to be ready
echo "⏳ Waiting for Backend to be ready..."
kubectl wait --for=condition=ready pod -l app=accessgate-backend -n $NAMESPACE --timeout=300s
print_status $? "Backend is ready"

# Deploy Frontend
kubectl apply -f k8s/frontend.yaml
print_status $? "Frontend deployed"

# Wait for Frontend to be ready
echo "⏳ Waiting for Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=accessgate-frontend -n $NAMESPACE --timeout=300s
print_status $? "Frontend is ready"

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml
print_status $? "Ingress deployed"

echo "🎉 Deployment completed successfully!"

# Show deployment status
echo ""
echo "📊 Deployment Status:"
echo "===================="
kubectl get pods -n $NAMESPACE
echo ""
kubectl get services -n $NAMESPACE
echo ""
kubectl get ingress -n $NAMESPACE

# Show access information
echo ""
echo "🌐 Access Information:"
echo "====================="

if command -v minikube &> /dev/null; then
    echo "Frontend URL: $(minikube service accessgate-frontend-service -n $NAMESPACE --url)"
    echo "Backend API URL: $(minikube service accessgate-backend-service -n $NAMESPACE --url)"
else
    echo "To access the application:"
    echo "1. Port forward to frontend: kubectl port-forward -n $NAMESPACE service/accessgate-frontend-service 3000:3000"
    echo "2. Port forward to backend: kubectl port-forward -n $NAMESPACE service/accessgate-backend-service 8000:8000"
    echo "3. Access frontend at: http://localhost:3000"
    echo "4. Access backend API at: http://localhost:8000"
fi

echo ""
echo "🔍 Useful Commands:"
echo "==================="
echo "View logs: kubectl logs -f -n $NAMESPACE -l app=accessgate-backend"
echo "Scale backend: kubectl scale deployment accessgate-backend -n $NAMESPACE --replicas=3"
echo "Delete deployment: kubectl delete namespace $NAMESPACE"
echo "View all resources: kubectl get all -n $NAMESPACE"
