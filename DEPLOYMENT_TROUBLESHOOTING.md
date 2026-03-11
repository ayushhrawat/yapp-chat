# 🔧 Deployment Troubleshooting Guide

## Issues After Deployment

### Issue 1: User Search Not Working on Vercel ❌
### Issue 2: Old Conversations Not Showing ❌

## Root Causes & Solutions

---

## 🔍 Issue 1: User Search Not Working

### Possible Causes:

### Cause 1: Wrong API URL in Environment Variables ⚠️

**Problem:** Frontend can't reach backend API

**Check on Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `VITE_SERVER_URL` is set correctly

**Should be:**
```env
VITE_SERVER_URL=https://your-backend-url.onrender.com
# OR
VITE_SERVER_URL=https://your-backend-url.railway.app
# NOT http://localhost:3001 ❌
```

**How to Fix:**
1. Find your deployed backend URL (Render/Railway/Heroku)
2. Add to Vercel environment variables
3. Redeploy on Vercel

---

### Cause 2: Backend Not Deployed or Offline ⚠️

**Problem:** API endpoint doesn't exist

**Check:**
```bash
# Test if backend is accessible
curl https://your-backend-url.com/api/users/search?query=test&currentUserId=123
```

**Expected Response:**
```json
[]
```

**If Error:**
- Backend is not deployed
- Backend crashed
- Wrong URL

**Solution:**
1. Deploy backend to Render/Railway/Heroku
2. Check backend logs for errors
3. Verify backend is running

---

### Cause 3: CORS Not Configured for Production ⚠️

**Problem:** Browser blocks requests from Vercel domain

**Check Browser Console (F12):**
Look for errors like:
```
Access to fetch at 'https://backend.com' from origin 'https://vercel.app' 
has been blocked by CORS policy
```

**Fix in `server/mongodb-server.js`:**
```javascript
const cors = require('cors');

// Allow both local and production
app.use(cors({
  origin: [
    'http://localhost:5173',      // Local dev
    'https://your-app.vercel.app', // Production
    'https://*.vercel.app'         // All Vercel previews
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### Cause 4: MongoDB Connection String Missing ⚠️

**Problem:** Backend can't connect to database

**Check Backend Logs:**
Look for:
```
❌ Error fetching Clerk users: MongoServerError: bad auth
```

**Fix:**
1. Add `MONGODB_URI` to backend environment variables
2. Use full connection string with password:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yapp-chat?retryWrites=true&w=majority
```

---

## 💬 Issue 2: Old Conversations Not Showing

### Possible Causes:

### Cause 1: Database Has Different Data ⚠️

**Problem:** Production database != Local database

**Check:**
1. Go to MongoDB Atlas → Collections
2. Look at `conversations` collection
3. Do you see your old conversations?

**If NO:**
- You're using a different database in production
- Database was reset during deployment

**Solution:**
```javascript
// Add debug logging to verify connection
console.log('📊 Connected to MongoDB:', db.databaseName);
```

---

### Cause 2: User ID Mismatch ⚠️

**Problem:** Clerk IDs don't match between local and production

**Check:**
1. Login to production app
2. Open browser console
3. Look for user ID logs:
```javascript
console.log('Current User ID:', supabaseUserId);
```

**Compare with Database:**
```javascript
// In MongoDB shell or Atlas
db.users.find({}).forEach(user => {
  print(`User: ${user.username}, Clerk ID: ${user.clerkId}`);
});
```

**If IDs Don't Match:**
- Users were created in different Clerk environments
- Need to re-sync users

**Solution:**
```bash
# Re-sync current user by logging out and back in
# This will trigger the sync process again
```

---

### Cause 3: Query Filtering Out Results ⚠️

**Problem:** Search query too restrictive

**Debug Steps:**

**Add to frontend (`src/pages/ChatPage.jsx`):**
```javascript
const handleSearchUsers = async (query) => {
  setSearchQuery(query);
  
  if (!query.trim()) {
   setSearchResults([]);
   setIsSearching(false);
   return;
  }

  try {
   console.log('🔍 Searching for:', query);
   console.log('API URL:', API_URL);
   console.log('Current User ID:', user.id);
   
   const results = await searchAllClerkUsers(query, user.id);
   
   console.log('✅ Search results:', results.length, 'users found');
   console.log('Results:', results);
   
   const formattedResults = results.map(result => ({
    ...result,
    display_name: result.username || result.email?.split('@')[0] || 'User'
   }));

   setSearchResults(formattedResults);
   setIsSearching(formattedResults.length > 0);
  } catch (error) {
   console.error('❌ Error searching users:', error);
   console.error('Error details:', error.message);
   setSearchResults([]);
   setIsSearching(false);
  }
};
```

**Check Browser Console:**
- What does `API_URL` show?
- Are there any errors?
- How many results returned?

---

## 🛠️ Step-by-Step Debugging

### Step 1: Verify Environment Variables

**On Vercel:**
```
Settings → Environment Variables

Must have:
✅ VITE_SERVER_URL=https://your-backend.com
✅ VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**On Backend (Render/Railway):**
```
Environment → Variables

Must have:
✅ MONGODB_URI=mongodb+srv://...
✅ CLERK_SECRET_KEY=sk_test_...
```

---

### Step 2: Test API Endpoints Directly

**Test User Search:**
```bash
# Replace with your actual backend URL
curl "https://your-backend.com/api/clerk/all-users?query=test&currentUserId=123"
```

**Expected:** JSON array of users

**If Error:**
- Backend issue
- Database connection problem
- CORS blocking

---

### Step 3: Check Network Tab

**In Browser DevTools (F12):**
1. Go to Network tab
2. Search for users
3. Click on the API request
4. Check:
   - **Status Code:** Should be 200
   - **Request URL:** Should be your backend URL
   - **Response:** Should contain users array

**Common Errors:**
- `404 Not Found` → Wrong endpoint
- `500 Server Error` → Backend crashed
- `CORS Error` → Need to configure CORS
- `(failed)` → Network issue or blocked

---

### Step 4: Add Comprehensive Logging

**Frontend Logging:**
```javascript
// src/services/mongodb-client.js
export const searchAllClerkUsers = async (searchTerm, currentUserId) => {
 try {
  if (!searchTerm || !searchTerm.trim()) {
    return [];
   }

  const url = `${API_URL}/api/clerk/all-users?query=${encodeURIComponent(searchTerm)}&currentUserId=${encodeURIComponent(currentUserId)}`;
  
  console.log('🌐 Fetching from URL:', url);
  console.log('📡 API_URL:', API_URL);

  const response = await fetch(url, {
     method: 'GET',
     headers: {
       'Content-Type': 'application/json'
      }
    });

  console.log('📥 Response status:', response.status);

  if (!response.ok) {
   const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
   }

  const results = await response.json();
  console.log('✅ Received results:', results);
    
  return results;
 } catch (error) {
  console.error('❌ Complete error:', error);
  console.error('Stack trace:', error.stack);
  return [];
 }
};
```

**Backend Logging:**
```javascript
// server/mongodb-server.js
app.get('/api/clerk/all-users', async (req, res) => {
 try {
  console.log('=== REQUEST RECEIVED ===');
  console.log('Query:', req.query);
  console.log('Database connected:', !!db);
  
  if (!db) {
    console.error('❌ Database not connected!');
    return res.status(500).json({ error: 'Database not connected' });
   }

  const { query, currentUserId} = req.query;
  
  console.log('🔍 Searching for:', query);
  console.log('Excluding user:', currentUserId);

  // ... rest of code ...
  
  console.log('✅ Sending response:', filteredUsers.length, 'users');
  res.json(filteredUsers);
 } catch (error) {
  console.error('❌ Endpoint error:', error);
  console.error('Stack:', error.stack);
  res.status(500).json({ error: error.message });
 }
});
```

---

## ✅ Quick Fixes

### Fix 1: Update CORS Configuration

**File:** `server/mongodb-server.js`

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'https://yapp-chat.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Add to backend .env:**
```env
ALLOWED_ORIGINS=http://localhost:5173,https://yapp-chat.vercel.app
```

---

### Fix 2: Ensure Proper Error Handling

**File:** `src/services/mongodb-client.js`

```javascript
export const searchAllClerkUsers = async (searchTerm, currentUserId) => {
 try {
  console.group('🔍 Search Execution');
  console.log('Search term:', searchTerm);
  console.log('Current User ID:', currentUserId);
  console.log('API URL:', API_URL);
  
  if (!searchTerm || !searchTerm.trim()) {
    console.log('⚠️ Empty search term');
    return [];
   }

  const url = `${API_URL}/api/clerk/all-users?query=${encodeURIComponent(searchTerm)}&currentUserId=${encodeURIComponent(currentUserId)}`;
  
  console.log('📡 Request URL:', url);

  const response = await fetch(url);
  
  console.log('📥 Response status:', response.status);

  if (!response.ok) {
   const errorText = await response.text();
   console.error('❌ Server error:', errorText);
    throw new Error(`Server responded with ${response.status}: ${errorText}`);
   }

  const results = await response.json();
  console.log('✅ Success! Found', results.length, 'users');
  console.groupEnd();
    
  return results;
 } catch (error) {
  console.error('❌ Search failed:', error.message);
  console.groupEnd();
  return [];
 }
};
```

---

## 📊 Diagnostic Checklist

Run through this checklist:

### Backend Checks:
- [ ] Backend is deployed and running
- [ ] Backend URL is accessible
- [ ] `MONGODB_URI` is set in backend env
- [ ] `CLERK_SECRET_KEY` is set in backend env
- [ ] CORS configured for Vercel domain
- [ ] Backend logs show no errors

### Frontend Checks:
- [ ] `VITE_SERVER_URL` set in Vercel env
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` set in Vercel env
- [ ] Browser console shows correct API URL
- [ ] No CORS errors in console
- [ ] Network tab shows 200 responses

### Database Checks:
- [ ] MongoDB Atlas accessible from backend
- [ ] IP whitelist allows backend (0.0.0.0/0)
- [ ] Database has users data
- [ ] Database has conversations data
- [ ] User IDs match between Clerk and MongoDB

### User Sync Checks:
- [ ] Current user exists in MongoDB
- [ ] `clerkId` field matches Clerk ID
- [ ] Users are syncing on login
- [ ] `/api/users/sync` endpoint working

---

## 🎯 Most Common Solution

**90% of deployment issues are caused by:**

1. **Wrong `VITE_SERVER_URL`** (60%)
   - Fix: Set correct backend URL in Vercel

2. **Missing `MONGODB_URI`** (25%)
   - Fix: Add to backend environment variables

3. **CORS not configured** (10%)
   - Fix: Add Vercel domain to allowed origins

4. **User ID mismatch** (5%)
   - Fix: Re-login to trigger user sync

---

## 📞 Still Not Working?

### Collect This Info:

1. **Frontend Console Logs** (F12)
   - Screenshot of all errors
   - Network tab showing failed requests

2. **Backend Logs** (Render/Railway dashboard)
   - Error messages
   - Database connection status

3. **Environment Variables**
   - List all vars set in Vercel
   - List all vars set in backend

4. **Test Results**
   ```bash
   # Test backend directly
   curl https://your-backend.com/api/clerk/all-users?query=test&currentUserId=123
   
   # Should return JSON array
   ```

---

## Summary

### Most Likely Fix:

```bash
# 1. Set correct backend URL in Vercel
VITE_SERVER_URL=https://your-backend.onrender.com

# 2. Ensure MongoDB URI is set in backend
MONGODB_URI=mongodb+srv://...

# 3. Configure CORS in backend
app.use(cors({
  origin: ['https://your-app.vercel.app'],
  credentials: true
}));

# 4. Redeploy everything
git push origin main
```

Then test search again!

---

**Next Steps:** Run through the diagnostic checklist above and let me know which specific error you're seeing!
