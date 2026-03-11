# Quick Heroku Deployment Reference

## Prerequisites ✅
- [x] Git initialized
- [x] Procfile created
- [x] package.json updated with start script
- [x] Dependencies moved to correct sections
- [x] CORS configured for production
- [ ] Install Heroku CLI ← **You need to do this**

## Installation (One Time)

### Option 1: Download Installer
1. Go to: https://devcenter.heroku.com/articles/heroku-cli
2. Download Windows installer
3. Run installer
4. Restart terminal

### Option 2: Using Winget
```powershell
winget install Heroku.cli
```

### Option 3: Using Chocolatey
```powershell
choco install heroku-cli
```

## Deploy in 3 Steps

### Step 1: Login
```bash
heroku login
```

### Step 2: Create App
```bash
cd "c:\Users\rawat\Desktop\Yapp\yapp-chat"
heroku create yapp-chat-backend
```

### Step 3: Set Environment Variables
```bash
# Copy from your .env file
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set VITE_MONGODB_URI="mongodb+srv://..."
heroku config:set VITE_MONGODB_DATABASE="yapp-chat"
heroku config:set VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
heroku config:set CLERK_SECRET_KEY="sk_test_..."
heroku config:set VITE_ZEGO_APP_ID="807266571"
heroku config:set VITE_ZEGO_SERVER_SECRET="7ef3d04cc63d329f3e4cb89425702f5c"
heroku config:set PORT="3001"
heroku config:set VITE_SERVER_URL="https://yapp-chat-backend.herokuapp.com"
heroku config:set VITE_FRONTEND_URL="http://localhost:5173"
```

### Step 4: Deploy
```bash
git push heroku main
```

## Automated Deployment

### Using PowerShell Script
```powershell
.\deploy-to-heroku.ps1
```

### Using Bash Script (Git Bash/WSL)
```bash
./deploy-to-heroku.sh
```

## Verify Deployment

### Check Status
```bash
heroku ps
```

### View Logs
```bash
heroku logs --tail
```

### Open App
```bash
heroku open
```

### Test Health Endpoint
Visit: `https://yapp-chat-backend.herokuapp.com/health`

## Common Issues

### Build Fails
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Review logs: `heroku logs --tail`

### App Crashes on Startup
- Verify MongoDB URI is correct
- Check if MongoDB Atlas allows connections from all IPs
- Ensure all required env vars are set

### CORS Errors
- Update `VITE_FRONTEND_URL` with your frontend URL
- For Socket.IO, ensure CORS allows your domain

## Update Deployment

After making changes:
```bash
git add .
git commit -m "Your changes"
git push heroku main
```

## Useful Commands

```bash
# Restart app
heroku restart

# View all config vars
heroku config

# Update a config var
heroku config:set VAR_NAME=new_value

# Remove a config var
heroku config:unset VAR_NAME

# Scale dynos
heroku ps:scale web=1

# Open remote console
heroku run bash

# View detailed logs
heroku logs --num 100
```

## Production Checklist

- [ ] Install Heroku CLI
- [ ] Login to Heroku
- [ ] Create app
- [ ] Set all environment variables
- [ ] Push to Heroku
- [ ] Test health endpoint
- [ ] Check logs for errors
- [ ] Update MongoDB Atlas network access (0.0.0.0/0)
- [ ] Update frontend with backend URL
- [ ] Test Socket.IO connection

## Next Steps After Deployment

1. **Update Frontend**: Point your frontend to the deployed backend URL
2. **MongoDB Atlas**: Whitelist Heroku IPs (0.0.0.0/0)
3. **Custom Domain** (optional): Add custom domain to Heroku app
4. **Monitoring**: Set up uptime monitoring
5. **Backups**: Configure MongoDB backups

## Support

- Full guide: `HEROKU_DEPLOYMENT_GUIDE.md`
- Heroku Docs: https://devcenter.heroku.com/
- Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

---

**Ready to deploy? Start with installing Heroku CLI!** 🚀
