# AccessGate PoC - Kubernetes Deployment Script (PowerShell)

Write-Host "🚀 Deploying AccessGate PoC to Kubernetes..." -ForegroundColor Green

# Configuration
$NAMESPACE = "accessgate-poc"
$BACKEND_IMAGE = "accessgate-backend:latest"
$FRONTEND_IMAGE = "accessgate-frontend:latest"

# Function to print status
function Print-Status {
    param(
        [bool]$Success,
        [string]$Message
    )
    
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
        exit 1
    }
}

# Check if kubectl is available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if minikube is running (for local development)
if (Get-Command minikube -ErrorAction SilentlyContinue) {
    $minikubeStatus = minikube status 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Minikube is not running. Starting minikube..." -ForegroundColor Yellow
        minikube start
        Print-Status $true "Minikube started"
    }
}

Write-Host "🔧 Building Docker images..." -ForegroundColor Cyan

# Build backend image
Write-Host "Building backend image..." -ForegroundColor Yellow
docker build -t $BACKEND_IMAGE ./backend
Print-Status ($LASTEXITCODE -eq 0) "Backend image built successfully"

# Build frontend image
Write-Host "Building frontend image..." -ForegroundColor Yellow
docker build -t $FRONTEND_IMAGE ./frontend
Print-Status ($LASTEXITCODE -eq 0) "Frontend image built successfully"

# Load images into minikube (if using minikube)
if (Get-Command minikube -ErrorAction SilentlyContinue) {
    Write-Host "Loading images into minikube..." -ForegroundColor Yellow
    minikube image load $BACKEND_IMAGE
    minikube image load $FRONTEND_IMAGE
    Print-Status $true "Images loaded into minikube"
}

Write-Host "📦 Deploying to Kubernetes..." -ForegroundColor Cyan

# Create namespace
kubectl apply -f k8s/namespace.yaml
Print-Status ($LASTEXITCODE -eq 0) "Namespace created"

# Apply ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
Print-Status ($LASTEXITCODE -eq 0) "ConfigMap and Secrets applied"

# Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml
Print-Status ($LASTEXITCODE -eq 0) "PostgreSQL deployed"

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
Print-Status ($LASTEXITCODE -eq 0) "PostgreSQL is ready"

# Deploy Backend
kubectl apply -f k8s/backend.yaml
Print-Status ($LASTEXITCODE -eq 0) "Backend deployed"

# Wait for Backend to be ready
Write-Host "⏳ Waiting for Backend to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=accessgate-backend -n $NAMESPACE --timeout=300s
Print-Status ($LASTEXITCODE -eq 0) "Backend is ready"

# Deploy Frontend
kubectl apply -f k8s/frontend.yaml
Print-Status ($LASTEXITCODE -eq 0) "Frontend deployed"

# Wait for Frontend to be ready
Write-Host "⏳ Waiting for Frontend to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=accessgate-frontend -n $NAMESPACE --timeout=300s
Print-Status ($LASTEXITCODE -eq 0) "Frontend is ready"

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml
Print-Status ($LASTEXITCODE -eq 0) "Ingress deployed"

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green

# Show deployment status
Write-Host ""
Write-Host "📊 Deployment Status:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
kubectl get pods -n $NAMESPACE
Write-Host ""
kubectl get services -n $NAMESPACE
Write-Host ""
kubectl get ingress -n $NAMESPACE

# Show access information
Write-Host ""
Write-Host "🌐 Access Information:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

if (Get-Command minikube -ErrorAction SilentlyContinue) {
    $frontendUrl = minikube service accessgate-frontend-service -n $NAMESPACE --url
    $backendUrl = minikube service accessgate-backend-service -n $NAMESPACE --url
    Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Green
    Write-Host "Backend API URL: $backendUrl" -ForegroundColor Green
} else {
    Write-Host "To access the application:" -ForegroundColor Yellow
    Write-Host "1. Port forward to frontend: kubectl port-forward -n $NAMESPACE service/accessgate-frontend-service 3000:3000" -ForegroundColor White
    Write-Host "2. Port forward to backend: kubectl port-forward -n $NAMESPACE service/accessgate-backend-service 8000:8000" -ForegroundColor White
    Write-Host "3. Access frontend at: http://localhost:3000" -ForegroundColor White
    Write-Host "4. Access backend API at: http://localhost:8000" -ForegroundColor White
}

Write-Host ""
Write-Host "🔍 Useful Commands:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "View logs: kubectl logs -f -n $NAMESPACE -l app=accessgate-backend" -ForegroundColor White
Write-Host "Scale backend: kubectl scale deployment accessgate-backend -n $NAMESPACE --replicas=3" -ForegroundColor White
Write-Host "Delete deployment: kubectl delete namespace $NAMESPACE" -ForegroundColor White
Write-Host "View all resources: kubectl get all -n $NAMESPACE" -ForegroundColor White
