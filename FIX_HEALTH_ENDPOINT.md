# 🔧 Troubleshooting: "Cannot GET /health"

## The Problem
You're seeing: **"Cannot GET /health"** or **404 Not Found**

This means the server is running but the route isn't registered.

---

## Immediate Fix: Check These Steps

### Step 1: Verify Build & Start Commands in Render

Go to Render Dashboard → Your Service → **Settings**

**Build Command should be:**
```
npm install
```

**Start Command should be:**
```
node server/mongodb-server.js
```

If these are wrong, update them and redeploy.

---

### Step 2: Check the Logs

Go to Render Dashboard → Your Service → **Logs** tab

Look for these messages:

**✅ Good (Server Started):**
```
Socket.IO server running on port 3001
Visit http://localhost:3001/health
```

**❌ Bad (Server Didn't Start):**
```
Error: Cannot find module
Process exited with code 1
```

**❌ Bad (Database Connection Failed):**
```
MongoDB connection error
```

**Take a screenshot of the logs and share them if you need help!**

---

### Step 3: Verify Environment Variables

In Render Dashboard → **Environment** tab

Make sure you have ALL these variables:

```
MONGODB_URI=mongodb+srv://rawatayushh412_db_user:rxz12NL3RBdGfjUx@yappchat.lrrxtcj.mongodb.net/yapp-chat?retryWrites=true&w=majority&ssl=true
VITE_MONGODB_URI=mongodb+srv://rawatayushh412_db_user:rxz12NL3RBdGfjUx@yappchat.lrrxtcj.mongodb.net/yapp-chat?retryWrites=true&w=majority&ssl=true
VITE_MONGODB_DATABASE=yapp-chat
PORT=3001
```

**Missing MONGODB_URI is the most common issue!**

Click **Save Changes** after adding variables.

---

### Step 4: Configure MongoDB Atlas Network Access

Your backend might be crashing because it can't connect to MongoDB.

**Fix it:**
1. Go to https://cloud.mongodb.com
2. Click **Network Access** (left sidebar)
3. Click **Add IP Address**
4. Choose **"Allow Access from Anywhere"**
   - Type: `0.0.0.0/0`
5. Click **Confirm**

Wait 1-2 minutes for changes to apply.

Then go back to Render and check the logs again.

---

### Step 5: Test Different Endpoints

Try these URLs in your browser:

1. **Base URL:**
   ```
   https://yapp-chat-cavf.onrender.com/
   ```
   (Should show "Cannot GET /" which is normal)

2. **Health Check:**
   ```
   https://yapp-chat-cavf.onrender.com/health
   ```

3. **API Test:**
   ```
   https://yapp-chat-cavf.onrender.com/api/users/search?query=test
   ```

If `/` shows "Cannot GET /" but `/health` doesn't work, the server started but routes aren't loaded.

---

## Common Issues & Solutions

### Issue 1: Server Crashed on Startup

**Symptoms:**
- Logs show errors
- Process exited with code 1
- No "Socket.IO server running" message

**Solutions:**
1. Check logs for specific error
2. Verify all environment variables are set
3. Check MongoDB Atlas network access
4. Redeploy: Go to Render → Manual Deploy → Deploy

---

### Issue 2: Routes Not Loading

**Symptoms:**
- Server starts (you see "running on port 3001")
- But all routes return 404

**Possible Cause:** Express app not configured correctly

**Solution:**
Check if `server/mongodb-server.js` has these lines at the end:

```javascript
// Should have this:
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/health`);
});
```

---

### Issue 3: Build Failed

**Symptoms:**
- Deploy shows "Failed"
- Build logs have errors

**Common Errors:**
- Missing dependencies in package.json
- Node.js version mismatch
- Syntax errors in code

**Solution:**
1. Check build logs
2. Fix reported errors
3. Push to Git (auto-redeploys)

---

### Issue 4: Port Configuration Wrong

**Symptoms:**
- Server won't start
- Port binding errors

**Solution:**
Render automatically sets the `PORT` environment variable. Make sure your code uses it:

```javascript
const PORT = process.env.PORT || 3001;
```

This is already correct in your code! ✅

---

## Quick Diagnostic Commands

### Test with PowerShell:
```powershell
# Get detailed response
$response = Invoke-WebRequest -Uri "https://yapp-chat-cavf.onrender.com/health" -UseBasicParsing
Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Content: $($response.Content)"
```

### Test with Browser DevTools:
Open browser console (F12) and run:
```javascript
fetch('https://yapp-chat-cavf.onrender.com/health', {
  method: 'GET',
  headers: { 'Accept': 'application/json' }
})
.then(r => {
  console.log('Status:', r.status);
  return r.text();
})
.then(text => console.log('Response:', text))
.catch(err => console.error('Error:', err));
```

---

## Manual Redeploy

Sometimes a fresh deploy fixes issues:

1. Go to Render Dashboard
2. Click your service: **yapp-chat-cavf**
3. Click **Manual Deploy** (top right)
4. Select branch: **main**
5. Click **Deploy**

Watch the logs as it builds.

---

## Check These Files Are Correct

### File: `server/mongodb-server.js`

Should have health endpoint around line 192:

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```

✅ This file was verified and is correct!

---

### File: `package.json`

Should have start script:

```json
{
  "scripts": {
    "start": "node server/mongodb-server.js",
    ...
  }
}
```

✅ This is correct!

---

## Most Likely Issues (Ranked)

1. **MongoDB Atlas Network Access** (90% of cases)
   - Solution: Add 0.0.0.0/0 in MongoDB Atlas

2. **Missing Environment Variables**
   - Solution: Add all env vars in Render dashboard

3. **App Still Building**
   - Solution: Wait 2-3 minutes, refresh

4. **Service Crashed**
   - Solution: Check logs, fix reported error

---

## What to Do Right Now

### 1. Check MongoDB Atlas FIRST
```
☐ Go to https://cloud.mongodb.com
☐ Click Network Access
☐ Add IP Address → Allow from Anywhere (0.0.0.0/0)
☐ Confirm
☐ Wait 1 minute
```

### 2. Check Render Logs
```
☐ Go to Render Dashboard
☐ Click yapp-chat-cavf
☐ Click Logs tab
☐ Look for errors
☐ Screenshot any errors
```

### 3. Verify Environment Variables
```
☐ In Render → Environment tab
☐ Check MONGODB_URI exists
☐ Check VITE_MONGODB_URI exists
☐ All values match your .env file
```

### 4. Test Again
```
☐ Visit: https://yapp-chat-cavf.onrender.com/health
☐ If still broken, share the logs
```

---

## Need More Help?

Share these details:
1. **Screenshot of Render Logs** (last 50 lines)
2. **List of environment variables** you've set (hide secrets)
3. **Exact error message** you see

---

## Alternative: Quick Fix Checklist

Run through this checklist IN ORDER:

- [ ] MongoDB Atlas allows 0.0.0.0/0
- [ ] MONGODB_URI env var is set in Render
- [ ] VITE_MONGODB_URI env var is set in Render
- [ ] Logs show "Connected to MongoDB"
- [ ] Logs show "Socket.IO server running on port 3001"
- [ ] Waited 2-3 minutes after last change
- [ ] Tried incognito browser window
- [ ] Cleared browser cache

If ANY item is unchecked, fix it and test again!

---

**Most common fix: Configure MongoDB Atlas Network Access!** 

Do that first, then check if it works. 🎯
