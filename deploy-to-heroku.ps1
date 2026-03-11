# Heroku Deployment Script for Yapp Chat Backend (PowerShell)
# Run this after installing Heroku CLI

Write-Host "🚀 Starting Heroku Deployment..." -ForegroundColor Cyan

# Check if Heroku CLI is installed
try {
    $herokuVersion = heroku --version 2>&1
    Write-Host "✅ Heroku CLI found: $herokuVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Yellow
    exit 1
}

# Login to Heroku
Write-Host "`n🔐 Logging in to Heroku..." -ForegroundColor Cyan
heroku login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login failed" -ForegroundColor Red
    exit 1
}

# Create app
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$APP_NAME = "yapp-chat-backend-$timestamp"
Write-Host "`n📱 Creating app: $APP_NAME" -ForegroundColor Cyan
heroku create $APP_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create app" -ForegroundColor Red
    exit 1
}

# Set environment variables
Write-Host "`n⚙️ Setting environment variables..." -ForegroundColor Cyan

# MongoDB
$MONGODB_URI = Read-Host "Enter MongoDB URI"
heroku config:set MONGODB_URI="$MONGODB_URI"
heroku config:set VITE_MONGODB_URI="$MONGODB_URI"
heroku config:set VITE_MONGODB_DATABASE="yapp-chat"
heroku config:set MONGODB_DATABASE="yapp-chat"

# Clerk
$CLERK_PUB_KEY = Read-Host "Enter Clerk Publishable Key"
$CLERK_SECRET = Read-Host "Enter Clerk Secret Key"
heroku config:set VITE_CLERK_PUBLISHABLE_KEY="$CLERK_PUB_KEY"
heroku config:set CLERK_SECRET_KEY="$CLERK_SECRET"

# Zego
$ZEGO_APP_ID = Read-Host "Enter Zego App ID"
$ZEGO_SECRET = Read-Host "Enter Zego Server Secret"
heroku config:set VITE_ZEGO_APP_ID="$ZEGO_APP_ID"
heroku config:set VITE_ZEGO_SERVER_SECRET="$ZEGO_SECRET"

# Server
heroku config:set PORT="3001"
heroku config:set VITE_SERVER_URL="https://$APP_NAME.herokuapp.com"
heroku config:set VITE_FRONTEND_URL="http://localhost:5173"

# Supabase (optional)
$SUPABASE_ANSWER = Read-Host "Do you want to set Supabase credentials? (y/n)"
if ($SUPABASE_ANSWER -eq "y") {
    $SUPABASE_URL = Read-Host "Enter Supabase URL"
    $SUPABASE_KEY = Read-Host "Enter Supabase Service Key"
    heroku config:set VITE_SUPABASE_URL="$SUPABASE_URL"
    heroku config:set SUPABASE_SERVICE_KEY="$SUPABASE_KEY"
}

# Deploy
Write-Host "`n🚀 Deploying to Heroku..." -ForegroundColor Cyan
git push heroku main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Open app
Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Opening app..." -ForegroundColor Cyan
Start-Process "https://$APP_NAME.herokuapp.com"

# Show health check
Write-Host "`n🏥 Testing health endpoint..." -ForegroundColor Cyan
Start-Process "https://$APP_NAME.herokuapp.com/health"

Write-Host "`n===================================" -ForegroundColor Green
Write-Host "✅ Deployment Successful!" -ForegroundColor Green
Write-Host "App URL: https://$APP_NAME.herokuapp.com" -ForegroundColor Cyan
Write-Host "Health Check: https://$APP_NAME.herokuapp.com/health" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Green

Write-Host "`n📊 Showing recent logs..." -ForegroundColor Cyan
heroku logs --num 50
