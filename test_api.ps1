# Azzuna API Test Script
# Run this in PowerShell to test all endpoints

Write-Host "🧪 Testing Azzuna Backend API" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1️⃣ Testing Health Endpoint..." -ForegroundColor Yellow
$health = curl.exe -s http://localhost:3000/api/health | ConvertFrom-Json
if ($health.success) {
    Write-Host "✅ Health check passed!" -ForegroundColor Green
    Write-Host "   Message: $($health.message)`n" -ForegroundColor Gray
} else {
    Write-Host "❌ Health check failed!`n" -ForegroundColor Red
}

# Test 2: Get Flowers
Write-Host "2️⃣ Testing Flowers Endpoint..." -ForegroundColor Yellow
try {
    $flowers = curl.exe -s http://localhost:3000/api/flowers | ConvertFrom-Json
    if ($flowers.success) {
        Write-Host "✅ Flowers endpoint working!" -ForegroundColor Green
        Write-Host "   Found $($flowers.data.Count) flowers" -ForegroundColor Gray
        if ($flowers.data.Count -gt 0) {
            Write-Host "   First flower: $($flowers.data[0].name) - `$$($flowers.data[0].price)`n" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Flowers endpoint failed: $($flowers.message)`n" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Flowers endpoint error: $_`n" -ForegroundColor Red
}

# Test 3: Login with Test Account
Write-Host "3️⃣ Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "cliente@azzuna.com"
    password = "password123"
} | ConvertTo-Json

try {
    $login = curl.exe -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d $loginBody | ConvertFrom-Json
    if ($login.success) {
        Write-Host "✅ Login successful!" -ForegroundColor Green
        Write-Host "   User: $($login.data.user.first_name) $($login.data.user.last_name)" -ForegroundColor Gray
        Write-Host "   Role: $($login.data.user.role)" -ForegroundColor Gray
        Write-Host "   Token: $($login.data.access_token.Substring(0, 30))...`n" -ForegroundColor Gray
        $token = $login.data.access_token
    } else {
        Write-Host "❌ Login failed: $($login.message)`n" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Login error: $_`n" -ForegroundColor Red
}

# Test 4: Register New User
Write-Host "4️⃣ Testing Registration..." -ForegroundColor Yellow
$registerBody = @{
    email = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
    password = "Test123!"
    first_name = "Test"
    last_name = "User"
    role = "client"
} | ConvertTo-Json

try {
    $register = curl.exe -s -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d $registerBody | ConvertFrom-Json
    if ($register.success) {
        Write-Host "✅ Registration successful!" -ForegroundColor Green
        Write-Host "   New user: $($register.data.user.email)`n" -ForegroundColor Gray
    } else {
        Write-Host "❌ Registration failed: $($register.message)`n" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Registration error: $_`n" -ForegroundColor Red
}

# Test 5: Get Current User (Protected Route)
if ($token) {
    Write-Host "5️⃣ Testing Protected Route (Get Current User)..." -ForegroundColor Yellow
    try {
        $me = curl.exe -s http://localhost:3000/api/auth/me -H "Authorization: Bearer $token" | ConvertFrom-Json
        if ($me.success) {
            Write-Host "✅ Protected route working!" -ForegroundColor Green
            Write-Host "   User: $($me.data.email)`n" -ForegroundColor Gray
        } else {
            Write-Host "❌ Protected route failed: $($me.message)`n" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Protected route error: $_`n" -ForegroundColor Red
    }
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 Testing Complete!`n" -ForegroundColor Cyan

# Frontend Info
Write-Host "📱 Frontend: http://localhost:4200" -ForegroundColor Magenta
Write-Host "🔧 Backend: http://localhost:3000" -ForegroundColor Magenta
Write-Host "`nTest Credentials:" -ForegroundColor Yellow
Write-Host "  Email: cliente@azzuna.com" -ForegroundColor Gray
Write-Host "  Password: password123`n" -ForegroundColor Gray
