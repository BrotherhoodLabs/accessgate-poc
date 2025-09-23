# AccessGate PoC - Validation End-to-End Script (PowerShell)

Write-Host "🚀 Starting AccessGate PoC Validation..." -ForegroundColor Green

# Configuration
$API_BASE_URL = "http://localhost:8000/api"
$FRONTEND_URL = "http://localhost:3000"
$ADMIN_EMAIL = "admin@accessgate.com"
$ADMIN_PASSWORD = "Admin123!"
$MANAGER_EMAIL = "manager@accessgate.com"
$MANAGER_PASSWORD = "Manager123!"
$VIEWER_EMAIL = "viewer@accessgate.com"
$VIEWER_PASSWORD = "Viewer123!"

# Test results
$TestsPassed = 0
$TestsFailed = 0

# Function to print test results
function Print-TestResult {
    param(
        [bool]$Success,
        [string]$Message
    )
    
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
        $script:TestsPassed++
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
        $script:TestsFailed++
    }
}

# Function to test API endpoint
function Test-ApiEndpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [int]$ExpectedStatus,
        [string]$AuthToken = $null,
        [string]$Data = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($AuthToken) {
        $headers["Authorization"] = "Bearer $AuthToken"
    }
    
    try {
        if ($Data) {
            $response = Invoke-RestMethod -Uri "$API_BASE_URL$Endpoint" -Method $Method -Headers $headers -Body $Data -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri "$API_BASE_URL$Endpoint" -Method $Method -Headers $headers -ErrorAction Stop
        }
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            return $true
        } else {
            Write-Host "Expected: $ExpectedStatus, Got: $statusCode" -ForegroundColor Yellow
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
            return $false
        }
    }
}

# Function to get auth token
function Get-AuthToken {
    param(
        [string]$Email,
        [string]$Password
    )
    
    $loginData = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$API_BASE_URL/auth/login" -Method POST -Body $loginData -ContentType "application/json" -ErrorAction Stop
        return $response.accessToken
    } catch {
        return $null
    }
}

Write-Host "🔍 Testing API Health..." -ForegroundColor Cyan
$healthTest = Test-ApiEndpoint -Method "GET" -Endpoint "/health" -ExpectedStatus 200
Print-TestResult $healthTest "API Health Check"

Write-Host "🔐 Testing Authentication..." -ForegroundColor Cyan

# Test admin login
$adminToken = Get-AuthToken -Email $ADMIN_EMAIL -Password $ADMIN_PASSWORD
Print-TestResult ($adminToken -ne $null) "Admin Login"

# Test manager login
$managerToken = Get-AuthToken -Email $MANAGER_EMAIL -Password $MANAGER_PASSWORD
Print-TestResult ($managerToken -ne $null) "Manager Login"

# Test viewer login
$viewerToken = Get-AuthToken -Email $VIEWER_EMAIL -Password $VIEWER_PASSWORD
Print-TestResult ($viewerToken -ne $null) "Viewer Login"

Write-Host "👥 Testing User Management (Admin permissions)..." -ForegroundColor Cyan

# Test get users (admin only)
$adminUsersTest = Test-ApiEndpoint -Method "GET" -Endpoint "/users" -ExpectedStatus 200 -AuthToken $adminToken
Print-TestResult $adminUsersTest "Admin can list users"

# Test get users (manager should fail)
$managerUsersTest = Test-ApiEndpoint -Method "GET" -Endpoint "/users" -ExpectedStatus 403 -AuthToken $managerToken
Print-TestResult $managerUsersTest "Manager cannot list users"

# Test get users (viewer should fail)
$viewerUsersTest = Test-ApiEndpoint -Method "GET" -Endpoint "/users" -ExpectedStatus 403 -AuthToken $viewerToken
Print-TestResult $viewerUsersTest "Viewer cannot list users"

Write-Host "🎭 Testing Role Management..." -ForegroundColor Cyan

# Test get roles (admin only)
$adminRolesTest = Test-ApiEndpoint -Method "GET" -Endpoint "/roles" -ExpectedStatus 200 -AuthToken $adminToken
Print-TestResult $adminRolesTest "Admin can list roles"

# Test get roles (manager should fail)
$managerRolesTest = Test-ApiEndpoint -Method "GET" -Endpoint "/roles" -ExpectedStatus 403 -AuthToken $managerToken
Print-TestResult $managerRolesTest "Manager cannot list roles"

Write-Host "🔑 Testing Permission Management..." -ForegroundColor Cyan

# Test get permissions (admin only)
$adminPermissionsTest = Test-ApiEndpoint -Method "GET" -Endpoint "/permissions" -ExpectedStatus 200 -AuthToken $adminToken
Print-TestResult $adminPermissionsTest "Admin can list permissions"

# Test get permissions (manager should fail)
$managerPermissionsTest = Test-ApiEndpoint -Method "GET" -Endpoint "/permissions" -ExpectedStatus 403 -AuthToken $managerToken
Print-TestResult $managerPermissionsTest "Manager cannot list permissions"

Write-Host "🚫 Testing Unauthorized Access..." -ForegroundColor Cyan

# Test access without token
$noAuthTest = Test-ApiEndpoint -Method "GET" -Endpoint "/users" -ExpectedStatus 401
Print-TestResult $noAuthTest "Unauthenticated access blocked"

# Test access with invalid token
$invalidTokenTest = Test-ApiEndpoint -Method "GET" -Endpoint "/users" -ExpectedStatus 401 -AuthToken "invalid-token"
Print-TestResult $invalidTokenTest "Invalid token access blocked"

Write-Host "🌐 Testing Frontend Accessibility..." -ForegroundColor Cyan

# Test if frontend is accessible
try {
    $frontendResponse = Invoke-WebRequest -Uri $FRONTEND_URL -UseBasicParsing -ErrorAction Stop
    $frontendTest = $frontendResponse.StatusCode -eq 200
} catch {
    $frontendTest = $false
}
Print-TestResult $frontendTest "Frontend accessible"

Write-Host ""
Write-Host "📈 Validation Results:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Tests Passed: $TestsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $TestsFailed" -ForegroundColor Red

if ($TestsFailed -eq 0) {
    Write-Host "🎉 All tests passed! PoC is working correctly." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some tests failed. Please check the configuration." -ForegroundColor Red
    exit 1
}
