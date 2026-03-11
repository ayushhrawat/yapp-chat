# Heroku Backend Deployment Guide

## Prerequisites
- Git installed ✅ (already set up)
- Heroku account (create at https://heroku.com)
- Heroku CLI installed

## Step 1: Install Heroku CLI

### Windows Installation:
Download and install from: https://devcenter.heroku.com/articles/heroku-cli#download-and-install

Or using winget (Windows Package Manager):
```powershell
winget install Heroku.cli
```

Or using Chocolatey:
```powershell
choco install heroku-cli
```

After installation, restart your terminal and verify:
```bash
heroku --version
```

## Step 2: Login to Heroku

```bash
heroku login
```

This will open a browser window for authentication.

## Step 3: Create a New Heroku App

```bash
cd "c:\Users\rawat\Desktop\Yapp\yapp-chat"
heroku create yapp-chat-backend
```

Replace `yapp-chat-backend` with your preferred unique app name.

## Step 4: Set Environment Variables

Copy the values from your `.env` file to Heroku config vars:

```bash
# MongoDB
heroku config:set MONGODB_URI="your_mongodb_connection_string"
heroku config:set VITE_MONGODB_URI="your_mongodb_connection_string"
heroku config:set VITE_MONGODB_DATABASE="yapp-chat"
heroku config:set MONGODB_DATABASE="yapp-chat"

# Clerk
heroku config:set VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
heroku config:set CLERK_SECRET_KEY="sk_test_..."

# Zego
heroku config:set VITE_ZEGO_APP_ID="807266571"
heroku config:set VITE_ZEGO_SERVER_SECRET="7ef3d04cc63d329f3e4cb89425702f5c"

# Server
heroku config:set PORT="3001"
heroku config:set VITE_SERVER_URL="https://yapp-chat-backend.herokuapp.com"

# Supabase (if using)
heroku config:set VITE_SUPABASE_URL="your_supabase_url"
heroku config:set SUPABASE_SERVICE_KEY="your_supabase_service_key"

# Frontend URL (for CORS)
heroku config:set VITE_FRONTEND_URL="http://localhost:5173"
```

## Step 5: Deploy to Heroku

```bash
git push heroku main
```

If your default branch is `master`:
```bash
git branch -M main
git push heroku main
```

## Step 6: Open Your App

```bash
heroku open
```

Or visit: https://yapp-chat-backend.herokuapp.com

Test the health endpoint: https://yapp-chat-backend.herokuapp.com/health

## Step 7: View Logs

```bash
# Real-time logs
heroku logs --tail

# Recent logs
heroku logs --num 100
```

## Useful Commands

```bash
# Check app status
heroku ps

# Restart app
heroku restart

# Open remote shell
heroku run bash

# Access MongoDB shell (if needed)
heroku run mongosh

# Scale dynos (if on paid plan)
heroku ps:scale web=1

# Destroy app (be careful!)
heroku destroy --confirm yapp-chat-backend
```

## Troubleshooting

### Build Fails
1. Check Node.js version in runtime.txt (should be compatible with your code)
2. Verify all dependencies are in package.json
3. Check build logs: `heroku logs --tail`

### App Crashes
1. Check logs: `heroku logs --tail`
2. Verify environment variables are set correctly
3. Test MongoDB connection string
4. Check if port is set correctly (Heroku sets PORT automatically)

### CORS Issues
1. Update VITE_FRONTEND_URL to include your production frontend URL
2. Ensure Socket.IO CORS allows your frontend domain

### MongoDB Connection Issues
1. Verify MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
2. Check connection string credentials
3. Ensure database exists or user has create permissions

## Update Deployment

After making changes:
```bash
git add .
git commit -m "Your changes"
git push heroku main
```

## Production Checklist

✅ All environment variables set
✅ MongoDB Atlas network access configured for 0.0.0.0/0
✅ CORS configured for production URLs
✅ Socket.IO CORS updated for production
✅ Error logging enabled
✅ Health check endpoint working
✅ Webhook endpoints tested

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env` files to Git
- Rotate all API keys and secrets after deployment
- Use strong passwords for MongoDB
- Enable two-factor authentication on Clerk
- Review Heroku's security best practices

## Next Steps

1. Set up continuous deployment (optional):
   - Connect GitHub repo to Heroku for auto-deploy
   
2. Add a custom domain (optional):
   ```bash
   heroku domains:add yourdomain.com
   ```

3. Set up monitoring and alerts

4. Configure automatic backups for MongoDB

---

**Need Help?**
- Heroku DevCenter: https://devcenter.heroku.com/
- Heroku CLI Reference: https://devcenter.heroku.com/articles/heroku-cli
- Support: https://help.heroku.com/
