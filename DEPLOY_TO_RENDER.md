# 🚀 Deploy FactCheck App to Render - Step by Step

## 📋 **Prerequisites**
- ✅ GitHub repository: https://github.com/VinkRasengan/backup
- ✅ Render account (free): https://render.com
- ✅ API Keys (optional for basic functionality):
  - OpenAI API Key
  - NewsAPI Key
  - NewsData.io API Key
  - VirusTotal API Key

---

## 🗄️ **Step 1: Create PostgreSQL Database**

### 1.1 Go to Render Dashboard
1. Login to https://render.com
2. Click **"New"** → **"PostgreSQL"**

### 1.2 Database Configuration
```
Name: factcheck-db
Database Name: factcheck
User: factcheck_user
Region: Singapore (or closest to you)
Plan: Free
```

### 1.3 Create Database
- Click **"Create Database"**
- Wait for database to be ready (2-3 minutes)
- Copy the **Internal Database URL** (starts with `postgresql://`)

---

## 🖥️ **Step 2: Deploy Backend API**

### 2.1 Create Web Service
1. Click **"New"** → **"Web Service"**
2. Connect GitHub repository: `VinkRasengan/backup`
3. Configure:
   ```
   Name: factcheck-backend
   Branch: main
   Root Directory: server
   Environment: Node
   Region: Singapore
   Plan: Free
   ```

### 2.2 Build & Start Commands
```bash
Build Command: npm ci
Start Command: npm start
```

### 2.3 Environment Variables
Add these environment variables in Render dashboard:

**Required:**
```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://factcheck-frontend.onrender.com
DATABASE_URL=[Paste from Step 1.3]
JWT_SECRET=[Generate random string]
```

**Optional (for full functionality):**
```env
OPENAI_API_KEY=sk-proj-your-openai-key
NEWSAPI_KEY=your-newsapi-key
NEWSDATA_API_KEY=your-newsdata-key
VIRUSTOTAL_API_KEY=your-virustotal-key
```

**Firebase (if using Firebase Auth):**
```env
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

### 2.4 Health Check
```
Health Check Path: /health
```

### 2.5 Deploy Backend
- Click **"Create Web Service"**
- Wait for deployment (5-10 minutes)
- Check logs for any errors

---

## 🌐 **Step 3: Deploy Frontend**

### 3.1 Create Static Site
1. Click **"New"** → **"Static Site"**
2. Connect same GitHub repository: `VinkRasengan/backup`
3. Configure:
   ```
   Name: factcheck-frontend
   Branch: main
   Root Directory: client
   ```

### 3.2 Build Settings
```bash
Build Command: npm ci && npm run build
Publish Directory: build
```

### 3.3 Redirects & Rewrites
Create file `client/public/_redirects`:
```
/api/* https://factcheck-backend.onrender.com/api/* 200
/* /index.html 200
```

### 3.4 Deploy Frontend
- Click **"Create Static Site"**
- Wait for deployment (3-5 minutes)

---

## 🔧 **Step 4: Test Deployment**

### 4.1 Backend Health Check
```bash
# Test backend health
curl https://factcheck-backend.onrender.com/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2025-06-06T...",
  "database": "connected",
  "apis": {...}
}
```

### 4.2 Test Community API
```bash
# Test community posts
curl https://factcheck-backend.onrender.com/api/community/posts

# Expected: JSON with community posts
```

### 4.3 Frontend Test
1. Visit: https://factcheck-frontend.onrender.com
2. Check all pages load correctly:
   - ✅ Homepage
   - ✅ Check page (/check)
   - ✅ Community page (/community)
   - ✅ Login/Register

### 4.4 Full Integration Test
1. Go to Community page
2. Check posts display correctly
3. Try voting on posts
4. Test search and filtering

---

## 📊 **Step 5: Monitor & Optimize**

### 5.1 Check Render Dashboard
- **Logs**: Monitor real-time logs
- **Metrics**: CPU, Memory usage
- **Deployments**: Track deployment history

### 5.2 Performance Tips
```bash
# Free tier limitations:
- Backend: 750 hours/month (sleeps after 15min inactivity)
- Database: 1GB storage, 1 million rows
- Bandwidth: 100GB/month

# Keep backend awake (optional):
# Use external monitoring service to ping every 10 minutes
```

---

## 🎯 **Step 6: Add API Keys (Optional)**

### 6.1 OpenAI API (for AI Chat)
1. Get API key from: https://platform.openai.com/api-keys
2. Add to Render environment variables:
   ```
   OPENAI_API_KEY=sk-proj-your-key
   ```

### 6.2 NewsAPI (for Real News)
1. Get free API key from: https://newsapi.org/register
2. Add to environment variables:
   ```
   NEWSAPI_KEY=your-newsapi-key
   ```

### 6.3 NewsData.io (Alternative News)
1. Get free API key from: https://newsdata.io/register
2. Add to environment variables:
   ```
   NEWSDATA_API_KEY=your-newsdata-key
   ```

### 6.4 VirusTotal (for URL Scanning)
1. Get free API key from: https://www.virustotal.com/gui/join-us
2. Add to environment variables:
   ```
   VIRUSTOTAL_API_KEY=your-virustotal-key
   ```

---

## ✅ **Success Checklist**

- [ ] ✅ PostgreSQL database created and connected
- [ ] ✅ Backend deployed and health check passes
- [ ] ✅ Frontend deployed and accessible
- [ ] ✅ Community posts display correctly
- [ ] ✅ Voting system works
- [ ] ✅ Search and filtering functional
- [ ] ✅ API integrations working (if keys provided)
- [ ] ✅ No console errors in browser
- [ ] ✅ Mobile responsive design works

---

## 🔗 **Final URLs**

After successful deployment, your app will be available at:

**Frontend (Main App):**
```
https://factcheck-frontend.onrender.com
```

**Backend API:**
```
https://factcheck-backend.onrender.com
```

**API Endpoints:**
```
https://factcheck-backend.onrender.com/api/community/posts
https://factcheck-backend.onrender.com/api/news/latest
https://factcheck-backend.onrender.com/api/chat/openai
```

---

## 🚨 **Troubleshooting**

### Common Issues:

1. **Backend Build Fails:**
   - Check Node.js version compatibility
   - Verify all dependencies in package.json
   - Check build logs in Render dashboard

2. **Database Connection Error:**
   - Verify DATABASE_URL is correct
   - Check database is running
   - Ensure database user has permissions

3. **Frontend API Calls Fail:**
   - Check CORS configuration in backend
   - Verify API URLs in frontend
   - Check network tab in browser dev tools

4. **Environment Variables:**
   - Ensure all required env vars are set
   - Check for typos in variable names
   - Verify API keys are valid

---

**🎉 Deployment Complete! Your FactCheck app is now live on Render!**

Share your app: https://factcheck-frontend.onrender.com
