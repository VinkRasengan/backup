# 🚀 Render Docker Quick Reference

## 📋 Service Configuration Template

**Copy settings này cho mỗi service:**

### Basic Settings
```
Environment: Docker
Docker Context: .
Dockerfile Path: ./Dockerfile
Health Check Path: /health
Auto-Deploy: Yes
```

### Service-Specific Settings

| Service | Name | Root Directory |
|---------|------|----------------|
| Auth | `factcheck-auth-docker` | `services/auth-service` |
| Link | `factcheck-link-docker` | `services/link-service` |
| Community | `factcheck-community-docker` | `services/community-service` |
| Chat | `factcheck-chat-docker` | `services/chat-service` |
| News | `factcheck-news-docker` | `services/news-service` |
| Admin | `factcheck-admin-docker` | `services/admin-service` |
| PhishTank | `factcheck-phishtank-docker` | `services/phishtank-service` |
| CriminalIP | `factcheck-criminalip-docker` | `services/criminalip-service` |
| API Gateway | `factcheck-api-gateway-docker` | `services/api-gateway` |
| Frontend | `factcheck-frontend-docker` | `client` |

## 🔑 Environment Variables

### Base Variables (All Services)
```env
PORT=10000
NODE_ENV=production
JWT_SECRET=your-jwt-secret-here
```

### Firebase Services (auth, community, chat, news, admin)
```env
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
[YOUR_PRIVATE_KEY_HERE]
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@factcheck-1d6e8.iam.gserviceaccount.com
```

### API Gateway Service URLs
```env
AUTH_SERVICE_URL=https://factcheck-auth-docker.onrender.com
LINK_SERVICE_URL=https://factcheck-link-docker.onrender.com
COMMUNITY_SERVICE_URL=https://factcheck-community-docker.onrender.com
CHAT_SERVICE_URL=https://factcheck-chat-docker.onrender.com
NEWS_SERVICE_URL=https://factcheck-news-docker.onrender.com
ADMIN_SERVICE_URL=https://factcheck-admin-docker.onrender.com
PHISHTANK_SERVICE_URL=https://factcheck-phishtank-docker.onrender.com
CRIMINALIP_SERVICE_URL=https://factcheck-criminalip-docker.onrender.com
```

### Frontend Variables
```env
REACT_APP_API_URL=https://factcheck-api-gateway-docker.onrender.com
REACT_APP_FIREBASE_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8
REACT_APP_FIREBASE_STORAGE_BUCKET=factcheck-1d6e8.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
GENERATE_SOURCEMAP=false
```

### Service-Specific API Keys

**Link Service:**
```env
VIRUSTOTAL_API_KEY=your-virustotal-key
SCAMADVISER_API_KEY=your-scamadviser-key
IPQUALITYSCORE_API_KEY=WfHFgAIrlGZiZb2T8T1cVDoD0nR7BEeq
```

**News Service:**
```env
NEWSAPI_API_KEY=your-newsapi-key
GEMINI_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
```

**PhishTank Service:**
```env
PHISHTANK_API_KEY=your-phishtank-key
```

**CriminalIP Service:**
```env
CRIMINALIP_API_KEY=your-criminalip-key
```

## 🧪 Health Check Commands

```bash
# Test individual services
curl https://factcheck-auth-docker.onrender.com/health
curl https://factcheck-link-docker.onrender.com/health
curl https://factcheck-community-docker.onrender.com/health
curl https://factcheck-chat-docker.onrender.com/health
curl https://factcheck-news-docker.onrender.com/health
curl https://factcheck-admin-docker.onrender.com/health
curl https://factcheck-phishtank-docker.onrender.com/health
curl https://factcheck-criminalip-docker.onrender.com/health

# Test API Gateway
curl https://factcheck-api-gateway-docker.onrender.com/health

# Test Frontend
curl https://factcheck-frontend-docker.onrender.com
```

## ⚡ Deployment Order

1. **Auth Service** → Wait for deploy complete
2. **Link Service** → Wait for deploy complete  
3. **Community Service** → Wait for deploy complete
4. **Chat Service** → Wait for deploy complete
5. **News Service** → Wait for deploy complete
6. **Admin Service** → Wait for deploy complete
7. **PhishTank Service** → Wait for deploy complete
8. **CriminalIP Service** → Wait for deploy complete
9. **API Gateway** → Update service URLs first!
10. **Frontend** → Deploy last

## 🔍 Troubleshooting

**Build Failed:**
- Check Docker context is set to `.`
- Verify Dockerfile path is `./Dockerfile`
- Check repository connection

**Service Won't Start:**
- Check environment variables
- Verify all required variables are set
- Check service logs in Render dashboard

**503 Errors:**
- Wait 2-3 minutes for service to fully start
- Check if service is sleeping (free tier)
- Verify health endpoint

**API Gateway Issues:**
- Ensure all backend services are deployed first
- Double-check service URLs in environment variables
- Test individual service health endpoints

## 🎯 Final URLs
- **Frontend:** https://factcheck-frontend-docker.onrender.com
- **API Gateway:** https://factcheck-api-gateway-docker.onrender.com
