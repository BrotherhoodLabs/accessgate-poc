#!/bin/bash

# AccessGate PoC - Kubernetes Performance Test

echo "🚀 Running Performance Tests on Kubernetes..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
NAMESPACE="accessgate-poc"
BACKEND_SERVICE="accessgate-backend-service"
FRONTEND_SERVICE="accessgate-frontend-service"
TEST_DURATION=60  # seconds
CONCURRENT_USERS=10

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo -e "${RED}❌ Namespace $NAMESPACE does not exist${NC}"
    exit 1
fi

# Get service URLs
echo "🔍 Getting service URLs..."

# Port forward to backend
echo "Setting up port forwarding to backend..."
kubectl port-forward -n $NAMESPACE service/$BACKEND_SERVICE 8000:8000 &
BACKEND_PID=$!
sleep 5

# Port forward to frontend
echo "Setting up port forwarding to frontend..."
kubectl port-forward -n $NAMESPACE service/$FRONTEND_SERVICE 3000:3000 &
FRONTEND_PID=$!
sleep 5

# Test URLs
BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

echo "📊 Running Performance Tests..."
echo "==============================="

# Test 1: Backend Health Check Performance
echo "1. Testing Backend Health Check Performance..."
HEALTH_RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BACKEND_URL/health" 2>/dev/null || echo "0")
if (( $(echo "$HEALTH_RESPONSE_TIME < 1.0" | bc -l) )); then
    print_status 0 "Health check response time: ${HEALTH_RESPONSE_TIME}s (target: <1s)"
else
    print_status 1 "Health check response time: ${HEALTH_RESPONSE_TIME}s (target: <1s)"
fi

# Test 2: Frontend Load Time
echo "2. Testing Frontend Load Time..."
FRONTEND_RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$FRONTEND_URL" 2>/dev/null || echo "0")
if (( $(echo "$FRONTEND_RESPONSE_TIME < 2.0" | bc -l) )); then
    print_status 0 "Frontend load time: ${FRONTEND_RESPONSE_TIME}s (target: <2s)"
else
    print_status 1 "Frontend load time: ${FRONTEND_RESPONSE_TIME}s (target: <2s)"
fi

# Test 3: API Authentication Performance
echo "3. Testing API Authentication Performance..."
AUTH_START=$(date +%s.%N)
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@accessgate.com","password":"Admin123!"}' \
  "$BACKEND_URL/api/auth/login" 2>/dev/null)
AUTH_END=$(date +%s.%N)
AUTH_TIME=$(echo "$AUTH_END - $AUTH_START" | bc)

if echo "$LOGIN_RESPONSE" | grep -q "accessToken" && (( $(echo "$AUTH_TIME < 2.0" | bc -l) )); then
    print_status 0 "Authentication time: ${AUTH_TIME}s (target: <2s)"
    AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
    print_status 1 "Authentication failed or too slow: ${AUTH_TIME}s"
    AUTH_TOKEN=""
fi

# Test 4: API Endpoint Performance
if [ -n "$AUTH_TOKEN" ]; then
    echo "4. Testing API Endpoint Performance..."
    
    # Test users endpoint
    USERS_START=$(date +%s.%N)
    USERS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$BACKEND_URL/api/users" 2>/dev/null)
    USERS_END=$(date +%s.%N)
    USERS_TIME=$(echo "$USERS_END - $USERS_START" | bc)
    
    if echo "$USERS_RESPONSE" | grep -q "data" && (( $(echo "$USERS_TIME < 1.0" | bc -l) )); then
        print_status 0 "Users API response time: ${USERS_TIME}s (target: <1s)"
    else
        print_status 1 "Users API response time: ${USERS_TIME}s (target: <1s)"
    fi
    
    # Test roles endpoint
    ROLES_START=$(date +%s.%N)
    ROLES_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$BACKEND_URL/api/roles" 2>/dev/null)
    ROLES_END=$(date +%s.%N)
    ROLES_TIME=$(echo "$ROLES_END - $ROLES_START" | bc)
    
    if echo "$ROLES_RESPONSE" | grep -q "data" && (( $(echo "$ROLES_TIME < 1.0" | bc -l) )); then
        print_status 0 "Roles API response time: ${ROLES_TIME}s (target: <1s)"
    else
        print_status 1 "Roles API response time: ${ROLES_TIME}s (target: <1s)"
    fi
else
    echo "4. Skipping API tests (authentication failed)"
fi

# Test 5: Load Test (if Apache Bench is available)
if command -v ab &> /dev/null; then
    echo "5. Running Load Test..."
    
    # Load test on health endpoint
    echo "Load testing health endpoint..."
    ab -n 100 -c 10 "$BACKEND_URL/health" > /tmp/health_load_test.txt 2>&1
    
    if [ -f /tmp/health_load_test.txt ]; then
        REQUESTS_PER_SECOND=$(grep "Requests per second" /tmp/health_load_test.txt | awk '{print $4}')
        if (( $(echo "$REQUESTS_PER_SECOND > 50" | bc -l) )); then
            print_status 0 "Health endpoint throughput: ${REQUESTS_PER_SECOND} req/s (target: >50 req/s)"
        else
            print_status 1 "Health endpoint throughput: ${REQUESTS_PER_SECOND} req/s (target: >50 req/s)"
        fi
    fi
else
    echo "5. Skipping load test (Apache Bench not available)"
fi

# Test 6: Resource Usage
echo "6. Checking Resource Usage..."
echo "Pod resource usage:"
kubectl top pods -n $NAMESPACE 2>/dev/null || echo "Metrics not available"

echo "Node resource usage:"
kubectl top nodes 2>/dev/null || echo "Metrics not available"

# Test 7: Pod Health
echo "7. Checking Pod Health..."
POD_STATUS=$(kubectl get pods -n $NAMESPACE --no-headers | awk '{print $3}' | grep -v "Running")
if [ -z "$POD_STATUS" ]; then
    print_status 0 "All pods are running"
else
    print_status 1 "Some pods are not running: $POD_STATUS"
fi

# Test 8: Service Connectivity
echo "8. Testing Service Connectivity..."
SERVICES=$(kubectl get services -n $NAMESPACE --no-headers | awk '{print $1}')
for service in $SERVICES; do
    if kubectl get service $service -n $NAMESPACE &> /dev/null; then
        print_status 0 "Service $service is available"
    else
        print_status 1 "Service $service is not available"
    fi
done

# Cleanup
echo "🧹 Cleaning up..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null

echo ""
echo "📈 Performance Test Summary:"
echo "============================"
echo "Backend Health: ${HEALTH_RESPONSE_TIME}s"
echo "Frontend Load: ${FRONTEND_RESPONSE_TIME}s"
if [ -n "$AUTH_TOKEN" ]; then
    echo "Authentication: ${AUTH_TIME}s"
    echo "Users API: ${USERS_TIME}s"
    echo "Roles API: ${ROLES_TIME}s"
fi

echo ""
echo "🎯 Performance Targets:"
echo "======================="
echo "Health Check: < 1s"
echo "Frontend Load: < 2s"
echo "Authentication: < 2s"
echo "API Endpoints: < 1s"
echo "Throughput: > 50 req/s"

echo ""
echo "✅ Performance tests completed!"
