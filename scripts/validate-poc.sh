#!/bin/bash

# AccessGate PoC - Validation End-to-End Script

echo "🚀 Starting AccessGate PoC Validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:8000/api"
FRONTEND_URL="http://localhost:3000"
ADMIN_EMAIL="admin@accessgate.com"
ADMIN_PASSWORD="Admin123!"
MANAGER_EMAIL="manager@accessgate.com"
MANAGER_PASSWORD="Manager123!"
VIEWER_EMAIL="viewer@accessgate.com"
VIEWER_PASSWORD="Viewer123!"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
print_test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local auth_token=$4
    local data=$5
    
    if [ -n "$auth_token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "%{http_code}" -X $method \
                -H "Authorization: Bearer $auth_token" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_BASE_URL$endpoint")
        else
            response=$(curl -s -w "%{http_code}" -X $method \
                -H "Authorization: Bearer $auth_token" \
                "$API_BASE_URL$endpoint")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_BASE_URL$endpoint")
        else
            response=$(curl -s -w "%{http_code}" -X $method \
                "$API_BASE_URL$endpoint")
        fi
    fi
    
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" -eq "$expected_status" ]; then
        return 0
    else
        echo "Expected: $expected_status, Got: $status_code"
        echo "Response: $body"
        return 1
    fi
}

# Function to get auth token
get_auth_token() {
    local email=$1
    local password=$2
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
        "$API_BASE_URL/auth/login")
    
    echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4
}

echo "🔍 Testing API Health..."
test_api_endpoint "GET" "/health" 200
print_test_result $? "API Health Check"

echo "🔐 Testing Authentication..."

# Test admin login
admin_token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
if [ -n "$admin_token" ]; then
    print_test_result 0 "Admin Login"
else
    print_test_result 1 "Admin Login"
fi

# Test manager login
manager_token=$(get_auth_token "$MANAGER_EMAIL" "$MANAGER_PASSWORD")
if [ -n "$manager_token" ]; then
    print_test_result 0 "Manager Login"
else
    print_test_result 1 "Manager Login"
fi

# Test viewer login
viewer_token=$(get_auth_token "$VIEWER_EMAIL" "$VIEWER_PASSWORD")
if [ -n "$viewer_token" ]; then
    print_test_result 0 "Viewer Login"
else
    print_test_result 1 "Viewer Login"
fi

echo "👥 Testing User Management (Admin permissions)..."

# Test get users (admin only)
test_api_endpoint "GET" "/users" 200 "$admin_token"
print_test_result $? "Admin can list users"

# Test get users (manager should fail)
test_api_endpoint "GET" "/users" 403 "$manager_token"
print_test_result $? "Manager cannot list users"

# Test get users (viewer should fail)
test_api_endpoint "GET" "/users" 403 "$viewer_token"
print_test_result $? "Viewer cannot list users"

echo "🎭 Testing Role Management..."

# Test get roles (admin only)
test_api_endpoint "GET" "/roles" 200 "$admin_token"
print_test_result $? "Admin can list roles"

# Test get roles (manager should fail)
test_api_endpoint "GET" "/roles" 403 "$manager_token"
print_test_result $? "Manager cannot list roles"

echo "🔑 Testing Permission Management..."

# Test get permissions (admin only)
test_api_endpoint "GET" "/permissions" 200 "$admin_token"
print_test_result $? "Admin can list permissions"

# Test get permissions (manager should fail)
test_api_endpoint "GET" "/permissions" 403 "$manager_token"
print_test_result $? "Manager cannot list permissions"

echo "🚫 Testing Unauthorized Access..."

# Test access without token
test_api_endpoint "GET" "/users" 401
print_test_result $? "Unauthenticated access blocked"

# Test access with invalid token
test_api_endpoint "GET" "/users" 401 "invalid-token"
print_test_result $? "Invalid token access blocked"

echo "🌐 Testing Frontend Accessibility..."

# Test if frontend is accessible
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$frontend_status" -eq 200 ]; then
    print_test_result 0 "Frontend accessible"
else
    print_test_result 1 "Frontend accessible"
fi

echo "📊 Testing Rate Limiting..."

# Test rate limiting on auth endpoint
for i in {1..6}; do
    test_api_endpoint "POST" "/auth/login" 429 "" '{"email":"test@example.com","password":"wrongpassword"}'
done
print_test_result $? "Rate limiting on auth endpoint"

echo ""
echo "📈 Validation Results:"
echo "======================"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! PoC is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the configuration.${NC}"
    exit 1
fi
