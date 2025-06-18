# OnRender Deployment Guide - FactCheck Platform

## 🎯 Overview
OnRender deployment strategy for microservices architecture. Each service will be deployed separately.

## 📋 Services to Deploy

| Service | Type | Port | Priority |
|---------|------|------|----------|
| Frontend | Static Site | 3000 | High |
| API Gateway | Web Service | 8082 | High |
| Auth Service | Web Service | 3001 | High |
| Link Service | Web Service | 3002 | Medium |
| Community Service | Web Service | 3003 | Medium |
| Chat Service | Web Service | 3004 | Medium |
| News Service | Web Service | 3005 | Low |
| Admin Service | Web Service | 3006 | Low |

## 🔧 Step 1: Repository Structure

Since OnRender deploys one service per repository, you have two options:

### Option A: Monorepo (Recommended)
Keep current structure but create render.yaml for each service

### Option B: Split Repositories  
Create separate repositories for each service

## 🌐 Step 2: OnRender Configuration Files

### For each service, create render.yaml:

#### Frontend (Static Site)
```yaml
services:
  - type: web
    name: factcheck-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./build
    envVars:
      - key: REACT_APP_API_URL
        value: https://your-api-gateway.onrender.com
      - key: REACT_APP_FIREBASE_API_KEY
        fromDatabase: FIREBASE_API_KEY
```

#### API Gateway (Web Service)
```yaml
services:
  - type: web
    name: factcheck-api-gateway
    env: node
    buildCommand: cd services/api-gateway && npm install
    startCommand: cd services/api-gateway && npm start
    envVars:
      - key: PORT
        value: 8082
      - key: NODE_ENV
        value: production
      - key: AUTH_SERVICE_URL
        value: https://factcheck-auth.onrender.com
      - key: LINK_SERVICE_URL
        value: https://factcheck-link.onrender.com
```

#### Auth Service
```yaml
services:
  - type: web
    name: factcheck-auth
    env: node
    buildCommand: cd services/auth-service && npm install
    startCommand: cd services/auth-service && npm start
    envVars:
      - key: PORT
        value: 3001
      - key: FIREBASE_ADMIN_SDK
        fromDatabase: FIREBASE_ADMIN_SDK
```

## 🔑 Step 3: Environment Variables

### Required Environment Variables:
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID
- FIREBASE_ADMIN_SDK (JSON)
- VIRUSTOTAL_API_KEY
- SCAMADVISER_API_KEY
- GEMINI_API_KEY

## 📦 Step 4: Database Setup

### Redis (OnRender Redis)
1. Create Redis instance on OnRender
2. Get connection URL
3. Update all services with REDIS_URL

### Firebase Setup
1. Create Firebase project
2. Enable Authentication
3. Enable Firestore
4. Download service account key
5. Add to environment variables

## 🚀 Step 5: Deployment Order

1. **Redis** - Create Redis instance first
2. **Auth Service** - Deploy authentication first
3. **Other Services** - Deploy in any order
4. **API Gateway** - Deploy after all services
5. **Frontend** - Deploy last, update API URLs

## 🔧 Step 6: Service Configuration Updates

Update service URLs in each service's environment:

### API Gateway Updates:
```javascript
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'https://factcheck-auth.onrender.com',
  link: process.env.LINK_SERVICE_URL || 'https://factcheck-link.onrender.com',
  community: process.env.COMMUNITY_SERVICE_URL || 'https://factcheck-community.onrender.com',
  chat: process.env.CHAT_SERVICE_URL || 'https://factcheck-chat.onrender.com',
  news: process.env.NEWS_SERVICE_URL || 'https://factcheck-news.onrender.com',
  admin: process.env.ADMIN_SERVICE_URL || 'https://factcheck-admin.onrender.com'
};
```

## 📋 Step 7: Health Checks

Ensure all services have health check endpoints:

```javascript
// Add to each service
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'service-name',
    timestamp: new Date().toISOString() 
  });
});
```

## 🌍 Step 8: CORS Configuration

Update CORS settings for production:

```javascript
const corsOptions = {
  origin: [
    'https://your-frontend-domain.onrender.com',
    'https://factcheck-platform.onrender.com'
  ],
  credentials: true
};
```

## 📊 Step 9: Monitoring Setup

- Configure logging for production
- Set up error tracking (Sentry recommended)
- Monitor service health
- Set up alerts

## 🔐 Step 10: Security Checklist

- [ ] All API keys in environment variables
- [ ] HTTPS only in production
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Authentication middleware working

## 💡 Tips for OnRender Deployment

1. **Free Tier Limitations**: Services sleep after 15 minutes of inactivity
2. **Cold Starts**: First request after sleep takes longer
3. **Build Time**: Keep builds under 20 minutes
4. **Memory**: Free tier has 512MB RAM limit
5. **Disk Space**: Temporary storage only

## 🚨 Common Issues & Solutions

### Issue: Service Connection Timeouts
**Solution**: Implement retry logic and health checks

### Issue: Environment Variables Not Loading  
**Solution**: Double-check variable names and restart services

### Issue: Build Failures
**Solution**: Check Node.js version compatibility, clear build cache

### Issue: CORS Errors
**Solution**: Update frontend API URL and backend CORS settings

## 📱 Post-Deployment Testing

1. Test each service health endpoint
2. Verify API Gateway routing
3. Test frontend functionality
4. Check authentication flow
5. Verify database connections
6. Test real-time features

## 🔄 Continuous Deployment

Set up auto-deployment from GitHub:
1. Connect GitHub repository
2. Set branch for auto-deploy
3. Configure build settings
4. Set up environment variables
5. Enable auto-deploy on push
