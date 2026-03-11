#!/bin/bash

# Heroku Deployment Script for Yapp Chat Backend
# Run this after installing Heroku CLI

echo "🚀 Starting Heroku Deployment..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it first."
    echo "Download from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

echo "✅ Heroku CLI found"

# Login to Heroku
echo "🔐 Logging in to Heroku..."
heroku login

# Create app (you can modify the app name)
APP_NAME="yapp-chat-backend-$(date +%s)"
echo "📱 Creating app: $APP_NAME"
heroku create $APP_NAME

# Set environment variables
echo "⚙️ Setting environment variables..."

# MongoDB
read -p "Enter MongoDB URI: " MONGODB_URI
heroku config:set MONGODB_URI="$MONGODB_URI"
heroku config:set VITE_MONGODB_URI="$MONGODB_URI"
heroku config:set VITE_MONGODB_DATABASE="yapp-chat"
heroku config:set MONGODB_DATABASE="yapp-chat"

# Clerk
read -p "Enter Clerk Publishable Key: " CLERK_PUB_KEY
read -p "Enter Clerk Secret Key: " CLERK_SECRET
heroku config:set VITE_CLERK_PUBLISHABLE_KEY="$CLERK_PUB_KEY"
heroku config:set CLERK_SECRET_KEY="$CLERK_SECRET"

# Zego
read -p "Enter Zego App ID: " ZEGO_APP_ID
read -p "Enter Zego Server Secret: " ZEGO_SECRET
heroku config:set VITE_ZEGO_APP_ID="$ZEGO_APP_ID"
heroku config:set VITE_ZEGO_SERVER_SECRET="$ZEGO_SECRET"

# Server
heroku config:set PORT="3001"
heroku config:set VITE_SERVER_URL="https://$APP_NAME.herokuapp.com"
heroku config:set VITE_FRONTEND_URL="http://localhost:5173"

# Supabase (optional)
read -p "Do you want to set Supabase credentials? (y/n): " SUPABASE_ANSWER
if [ "$SUPABASE_ANSWER" = "y" ]; then
    read -p "Enter Supabase URL: " SUPABASE_URL
    read -p "Enter Supabase Service Key: " SUPABASE_KEY
    heroku config:set VITE_SUPABASE_URL="$SUPABASE_URL"
    heroku config:set SUPABASE_SERVICE_KEY="$SUPABASE_KEY"
fi

# Deploy
echo "🚀 Deploying to Heroku..."
git push heroku main

# Open app
echo "✅ Deployment complete!"
echo "🌐 Opening app..."
heroku open

# Show logs
echo "📊 Showing recent logs..."
heroku logs --tail

echo ""
echo "==================================="
echo "✅ Deployment Successful!"
echo "App URL: https://$APP_NAME.herokuapp.com"
echo "Health Check: https://$APP_NAME.herokuapp.com/health"
echo "==================================="
