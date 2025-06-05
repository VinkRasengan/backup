# 🚀 Render Deployment Guide - FactCheck App

## 📋 Prerequisites

1. **GitHub Repository** với source code
2. **Render Account** (miễn phí tại render.com)
3. **API Keys**:
   - OpenAI API Key
   - VirusTotal API Key
   - Firebase Service Account

---

## 🗄️ Step 1: Setup Database

### 1.1 Create PostgreSQL Database
```bash
# Render Dashboard > New > PostgreSQL
Name: factcheck-db
Database Name: factcheck
User: factcheck_user
Region: Singapore
Plan: Free
```

### 1.2 Get Database URL
```
DATABASE_URL sẽ được tự động tạo:
postgresql://factcheck_user:password@host:port/factcheck
```

---

## 🖥️ Step 2: Deploy Backend

### 2.1 Create Web Service
```bash
# Render Dashboard > New > Web Service
Repository: your-github-repo
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
Copy từ `.env.render` và paste vào Render Dashboard:

```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://factcheck-frontend.onrender.com
DATABASE_URL=[Auto-generated]
OPENAI_API_KEY=sk-proj-your-key
VIRUSTOTAL_API_KEY=your-key
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
JWT_SECRET=your-secret
```

### 2.4 Health Check
```
Health Check Path: /api/health
```

---

## 🌐 Step 3: Deploy Frontend

### 3.1 Create Static Site
```bash
# Render Dashboard > New > Static Site
Repository: your-github-repo
Branch: main
Root Directory: client
```

### 3.2 Build Settings
```bash
Build Command: npm ci && npm run build
Publish Directory: build
```

### 3.3 Redirects & Rewrites
```
# _redirects file in client/public/
/api/* https://factcheck-backend.onrender.com/api/* 200
/* /index.html 200
```

---

## ⚙️ Step 4: Configuration

### 4.1 Update API URLs
Frontend sẽ tự động detect production và dùng:
```
https://factcheck-backend.onrender.com/api
```

### 4.2 CORS Configuration
Backend đã được config để accept:
```javascript
origin: [
  'http://localhost:3000',
  'https://factcheck-frontend.onrender.com',
  process.env.FRONTEND_URL
]
```

---

## 🔧 Step 5: Testing

### 5.1 Backend Health Check
```bash
curl https://factcheck-backend.onrender.com/health
curl https://factcheck-backend.onrender.com/api/health
```

### 5.2 Frontend Test
```
https://factcheck-frontend.onrender.com
```

### 5.3 API Integration Test
```bash
# Test OpenAI API
curl -X POST https://factcheck-backend.onrender.com/api/chat/openai \
  -H "Content-Type: application/json" \
  -d '{"message": "Cách nhận biết phishing?"}'
```

---

## 📊 Step 6: Monitoring

### 6.1 Render Dashboard
- **Logs**: Real-time logs cho cả frontend và backend
- **Metrics**: CPU, Memory, Response time
- **Deployments**: History và rollback

### 6.2 Health Monitoring
```javascript
// Backend health endpoint returns:
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "apis": {
    "openai": true,
    "virustotal": true,
    "firebase": true
  }
}
```

---

## 💰 Cost Estimation

### Free Tier Limits:
- **Static Site**: Unlimited
- **Web Service**: 750 hours/month
- **PostgreSQL**: 1GB storage, 1 million rows
- **Bandwidth**: 100GB/month

### Paid Plans:
- **Starter**: $7/month per service
- **Pro**: $25/month per service

---

## 🚀 Deployment Commands

```bash
# 1. Push to GitHub
git add .
git commit -m "Render deployment ready"
git push origin main

# 2. Render auto-deploys from GitHub
# 3. Check deployment status in dashboard
# 4. Test endpoints
```

---

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails**:
   ```bash
   # Check Node.js version in render.yaml
   # Ensure all dependencies in package.json
   ```

2. **API Calls Fail**:
   ```bash
   # Check CORS configuration
   # Verify environment variables
   # Check API keys validity
   ```

3. **Database Connection**:
   ```bash
   # Verify DATABASE_URL format
   # Check Firestore credentials
   ```

---

## ✅ Success Checklist

- [ ] Backend deployed và health check OK
- [ ] Frontend deployed và accessible
- [ ] Database connected
- [ ] OpenAI API working
- [ ] VirusTotal API working
- [ ] Firebase Auth working
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Custom domains (optional)

**🎉 Deployment hoàn tất! FactCheck App đã sẵn sàng trên Render!**
