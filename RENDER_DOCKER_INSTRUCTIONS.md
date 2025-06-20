# 🐳 Render Docker Deployment Instructions

## 📋 Generated Files:
- `render-docker.yaml` - Complete Render configuration
- `docker-compose.render.yml` - Local testing override
- `deploy-render-docker.ps1` - PowerShell deployment helper

## 🚀 Deployment Steps:

### Option 1: Individual Service Deployment (Recommended)

Deploy each service manually on Render dashboard:

1. **factcheck-auth-docker**
   - Environment: Docker
   - Root Directory: services/auth-service
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   - Health Check: /health

2. **factcheck-link-docker**
   - Environment: Docker
   - Root Directory: services/link-service
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   - Health Check: /health

3. **factcheck-community-docker**
   - Environment: Docker
   - Root Directory: services/community-service
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   - Health Check: /health

4. **factcheck-chat-docker**
   - Environment: Docker
   - Root Directory: services/chat-service
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   - Health Check: /health

5. **factcheck-news-docker**
   - Environment: Docker
   - Root Directory: services/news-service
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   - Health Check: /health

6. **factcheck-admin-docker**
   - Environment: Docker
   - Root Directory: services/admin-service
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   - Health Check: /health

7. **factcheck-phishtank-docker**
   - Environment: Docker
   - Root Directory: services/phishtank-service
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   - Health Check: /health

8. **factcheck-criminalip-docker**
   - Environment: Docker
   - Root Directory: services/criminalip-service
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   - Health Check: /health

9. **factcheck-api-gateway-docker**
   - Environment: Docker
   - Root Directory: services/api-gateway
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   - Health Check: /health

### Option 2: render.yaml Deployment

1. Upload `render-docker.yaml` to your repository root
2. Rename to `render.yaml`
3. Render will auto-deploy all services

## 🔧 Environment Variables:

Each service needs these environment variables (use "Add from .env"):

### Base Variables (all services):
```
PORT=10000
NODE_ENV=production
JWT_SECRET=your-jwt-secret
```

### Firebase Services (auth, community, chat, news, admin):
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

### API Keys (as needed):
```
GEMINI_API_KEY=your-key
VIRUSTOTAL_API_KEY=your-key
SCAMADVISER_API_KEY=your-key
NEWSAPI_API_KEY=your-key
PHISHTANK_API_KEY=your-key
CRIMINALIP_API_KEY=your-key
```

## 🎯 Final URLs:

After deployment:
- Frontend: https://factcheck-frontend-docker.onrender.com
- API Gateway: https://factcheck-api-gateway-docker.onrender.com
- Auth Service: https://factcheck-auth-docker.onrender.com

## 🔍 Testing:

Test each service health endpoint:
```bash
curl https://factcheck-auth-docker.onrender.com/health
curl https://factcheck-api-gateway-docker.onrender.com/health
```

## 💡 Tips:

1. Deploy Auth service first
2. Test health endpoints after each deployment
3. Update service URLs in API Gateway environment
4. Monitor build logs for Docker issues
5. Use Docker layer caching for faster builds
