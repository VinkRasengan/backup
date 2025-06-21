# 🚨 API Gateway 404 ERROR - DEBUG GUIDE

## ❌ Current Issue: 
API Gateway returns 404 on /health endpoint despite successful deployment

## 🔍 DEBUGGING STEPS:

### 1. Check Render Service Configuration

**CRITICAL RENDER SETTINGS:**
```
Service Type: Web Service
Name: factcheck-api-gateway
Runtime: Node
Root Directory: services/api-gateway
Build Command: npm install
Start Command: npm start
Auto-Deploy: Yes
```

### 2. Verify File Structure

The issue might be that Render can't find the right files. Check if your repository structure is:
```
backup/
├── services/
│   └── api-gateway/
│       ├── package.json
│       ├── simple-app.js  ← NEW simple version
│       └── src/
│           └── app.js     ← Original complex version
```

### 3. Use Simple API Gateway Version

I've created a simplified version (`simple-app.js`) that should work. The package.json now points to this file.

**What's different in simple version:**
- Minimal dependencies
- Basic CORS setup
- Simple endpoints for testing
- Better error logging

### 4. Check Render Logs

Go to Render Dashboard → Your API Gateway Service → Logs

**Look for these patterns:**
```
✅ GOOD: "🚀 Simple API Gateway running on port 8080"
❌ BAD: "Error:", "Cannot find module", "ENOENT"
```

### 5. Environment Variables Check

**Required for API Gateway:**
```
NODE_ENV=production
ALLOWED_ORIGINS=https://frontend-eklp.onrender.com
```

**Optional but recommended:**
```
JWT_SECRET=your-secret
FIREBASE_PROJECT_ID=factcheck-1d6e8
```

### 6. Test Endpoints After Deploy

Try these URLs in order:
1. `https://factcheck-api-gateway.onrender.com/health`
2. `https://factcheck-api-gateway.onrender.com/info`
3. `https://factcheck-api-gateway.onrender.com/test-cors`

### 7. Common Render Issues & Solutions

#### Issue: "No such file or directory"
**Solution:** 
- Check Root Directory is exactly `services/api-gateway`
- Make sure the path exists in your GitHub repo

#### Issue: "Cannot find package.json"
**Solution:**
- Verify package.json exists in `services/api-gateway/` folder
- Check Build Command is `npm install` (not `npm ci`)

#### Issue: "Port already in use"
**Solution:**
- Don't set PORT in environment variables
- Let Render set it automatically

#### Issue: Service keeps restarting
**Solution:**
- Check logs for JavaScript errors
- Verify all required dependencies are in package.json

### 8. Manual Debug Steps

1. **Check GitHub repo structure:**
   - Go to your GitHub repo
   - Navigate to `services/api-gateway/`
   - Verify `package.json` and `simple-app.js` exist

2. **Redeploy with logs:**
   - Go to Render Dashboard
   - Click "Manual Deploy" → "Clear build cache & deploy"
   - Watch the deployment logs in real-time

3. **Test locally first:**
   ```bash
   cd services/api-gateway
   npm install
   npm start
   # Should see: "🚀 Simple API Gateway running on port 8080"
   curl http://localhost:8080/health
   ```

### 9. Quick Fix Commands

**If you need to update quickly:**

```bash
# 1. Commit the simple version
git add services/api-gateway/simple-app.js
git add services/api-gateway/package.json
git commit -m "Add simple API Gateway version for Render"
git push origin main

# 2. Trigger manual deploy on Render
# Go to Dashboard → API Gateway Service → Deploy Latest Commit
```

### 10. Expected Results

**After successful deployment:**
- ✅ Build completes without errors
- ✅ Service shows "Live" status
- ✅ `/health` returns JSON response
- ✅ No 404 errors

**Health check response should be:**
```json
{
  "status": "healthy",
  "service": "api-gateway-simple",
  "timestamp": "2025-06-21T...",
  "port": 8080,
  "environment": "production"
}
```

## 🚀 IMMEDIATE ACTION:

1. **Push the updated code:**
   ```bash
   git add .
   git commit -m "Simple API Gateway for Render deployment"
   git push origin main
   ```

2. **Redeploy on Render** (Manual Deploy → Clear cache)

3. **Test:** https://factcheck-api-gateway.onrender.com/health

4. **If still 404:** Share the Render deployment logs with me

---

The simplified version should resolve the 404 issue and get your API Gateway working!
