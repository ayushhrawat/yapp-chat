# Deploy to Vercel - FREE Backend Deployment Guide

## ✅ Why Vercel?

- **100% Free** - No credit card required
- **Serverless Functions** - Perfect for Express/Node.js backends
- **Auto HTTPS** - SSL certificates included
- **Global CDN** - Fast performance worldwide
- **Easy Deployment** - Git push to deploy

## ⚠️ Important Limitation

**Socket.IO with WebSockets is NOT supported on Vercel Serverless Functions.**

Vercel serverless functions are stateless and don't support persistent WebSocket connections. 

### Solutions:

1. **Use REST API only** (Recommended for Vercel)
   - Your existing REST endpoints work perfectly
   - Remove Socket.IO dependency for backend
   - Use polling or Server-Sent Events (SSE) for real-time updates

2. **Use Alternative Services**:
   - **Render.com** - Free tier with WebSocket support
   - **Railway.app** - $5/month with WebSocket support
   - **Fly.io** - Free tier available with WebSocket support

## Option 1: Deploy REST API to Vercel (Without Socket.IO)

### Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

### Step 2: Login to Vercel

```powershell
vercel login
```

### Step 3: Deploy

```powershell
cd "c:\Users\rawat\Desktop\Yapp\yapp-chat"
vercel --prod
```

### Step 4: Set Environment Variables

Go to your Vercel dashboard:
1. Visit: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from your `.env` file

Or use CLI:
```powershell
vercel env add MONGODB_URI
vercel env add VITE_MONGODB_URI
vercel env add VITE_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add VITE_ZEGO_APP_ID
vercel env add VITE_ZEGO_SERVER_SECRET
vercel env add PORT
```

### Step 5: Redeploy

```powershell
vercel --prod
```

---

## Option 2: Deploy to Render.com (RECOMMENDED - Supports WebSocket)

### Why Render?

- ✅ **Free tier available**
- ✅ **Full WebSocket support** (Socket.IO works!)
- ✅ **PostgreSQL database included**
- ✅ **No credit card required**
- ✅ **Easy Git integration**

### Step-by-Step Guide:

#### 1. Create Render Account
- Visit: https://render.com
- Sign up with GitHub

#### 2. Create New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select `yapp-chat` folder

#### 3. Configure Service

**Basic Settings:**
- **Name:** `yapp-chat-backend`
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** `yapp-chat`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server/mongodb-server.js`

**Environment Variables:**
Click "Advanced" and add all variables from your `.env` file:
```
MONGODB_URI=mongodb+srv://...
VITE_MONGODB_URI=mongodb+srv://...
VITE_MONGODB_DATABASE=yapp-chat
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_ZEGO_APP_ID=807266571
VITE_ZEGO_SERVER_SECRET=7ef3d04cc63d329f3e4cb89425702f5c
PORT=3001
```

#### 4. Choose Free Plan
- Select **"Free"** plan
- Click "Create Web Service"

#### 5. Deploy!
- Render will automatically build and deploy
- You'll get a URL like: `https://yapp-chat-backend.onrender.com`

#### 6. Update Frontend
In your frontend `.env` file:
```
VITE_SERVER_URL=https://yapp-chat-backend.onrender.com
```

---

## Option 3: Deploy to Railway.app

### Steps:

1. **Sign Up**: https://railway.app
2. **New Project** → "Deploy from GitHub repo"
3. **Select Repository**: `yapp-chat`
4. **Add Environment Variables** (same as Render)
5. **Deploy!**

**Pricing:** $5/month for basic usage

---

## Option 4: Deploy to Fly.io

### Steps:

1. **Install Fly CLI**:
   ```powershell
   npm install -g @flydotio/fly
   ```

2. **Login**:
   ```powershell
   fly auth login
   ```

3. **Create App**:
   ```powershell
   cd "c:\Users\rawat\Desktop\Yapp\yapp-chat"
   fly launch --name yapp-chat-backend
   ```

4. **Set Environment Variables**:
   ```powershell
   fly secrets set MONGODB_URI="..."
   fly secrets set VITE_MONGODB_URI="..."
   # ... add all other vars
   ```

5. **Deploy**:
   ```powershell
   fly deploy
   ```

**Free Tier:** Limited but includes WebSocket support

---

## Comparison Table

| Platform | Free Tier | WebSocket Support | Ease | Notes |
|----------|-----------|-------------------|------|-------|
| **Vercel** | ✅ Yes | ❌ No | ⭐⭐⭐⭐⭐ | Best for REST APIs |
| **Render** | ✅ Yes (with limitations) | ✅ Yes | ⭐⭐⭐⭐⭐ | Best overall for your app |
| **Railway** | ❌ $5/month | ✅ Yes | ⭐⭐⭐⭐ | Good alternative |
| **Fly.io** | ⚠️ Limited free | ✅ Yes | ⭐⭐⭐ | More configuration needed |
| **Heroku** | ❌ Paid only | ✅ Yes | ⭐⭐⭐⭐⭐ | Requires payment |

---

## 🎯 Recommendation

**For your Yapp Chat app, I recommend Render.com because:**

1. ✅ **FREE tier available**
2. ✅ **Full Socket.IO support** (critical for your chat features)
3. ✅ **Easy setup** (similar to Heroku)
4. ✅ **No credit card required**
5. ✅ **Your code works without changes!**

---

## Quick Render Deployment Checklist

- [ ] Create Render account at https://render.com
- [ ] Connect GitHub account
- [ ] Create new Web Service from `yapp-chat` repo
- [ ] Set build command: `npm install`
- [ ] Set start command: `node server/mongodb-server.js`
- [ ] Add all environment variables from `.env`
- [ ] Deploy on free plan
- [ ] Get your Render URL
- [ ] Update frontend `VITE_SERVER_URL`

---

## Need Help?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Fly.io Docs: https://fly.io/docs

---

**Ready to deploy? I recommend starting with Render.com!** 🚀
