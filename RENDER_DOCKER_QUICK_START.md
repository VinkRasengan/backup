# Render Docker Migration - Quick Start Guide

## 🎯 Mục tiêu: Chuyển TẤT CẢ services sang Docker

**Tại sao cần chuyển?**
- ✅ Services hiện tại: Auth, Chat, Community, Admin, News (Node.js) - **WORKING**
- ❌ Services bị lỗi: Link, PhishTank, API Gateway, CriminalIP (Node.js) - **FAILED**
- 🎯 Solution: Chuyển TẤT CẢ sang Docker để consistency và reliability

## 🚀 Quick Start - Bắt đầu ngay

### Step 1: Test với CriminalIP Service (Đơn giản nhất)

1. **Vào Render Dashboard** → **Create New Web Service**
2. **Repository**: `https://github.com/VinkRasengan/backup`
3. **Branch**: `main`
4. **Environment**: **Docker** ⚠️ (QUAN TRỌNG!)
5. **Service Name**: `criminalip-service-docker`
6. **Dockerfile Path**: `./services/criminalip-service/Dockerfile.render`
7. **Docker Context**: `.`
8. **Health Check Path**: `/health`

**Environment Variables:**
```
NODE_ENV=production
PORT=10000
FIREBASE_PROJECT_ID=[your-firebase-project-id]
FIREBASE_CLIENT_EMAIL=[your-firebase-client-email]
FIREBASE_PRIVATE_KEY=[your-firebase-private-key]
JWT_SECRET=[your-jwt-secret]
CRIMINALIP_API_KEY=[your-criminalip-key]
```

9. **Click Deploy**
10. **Test**: `curl https://criminalip-service-docker.onrender.com/health`

### Step 2: Nếu CriminalIP thành công → Tiếp tục với PhishTank

**Service Name**: `phishtank-service-docker`
**Dockerfile Path**: `./services/phishtank-service/Dockerfile.render`
**Additional Env**: `PHISHTANK_API_KEY=[your-key]`

### Step 3: Link Service (Phức tạp nhất)

**Service Name**: `link-service-docker`
**Dockerfile Path**: `./services/link-service/Dockerfile.render`
**Additional Env**:
```
VIRUSTOTAL_API_KEY=[your-key]
SCAMADVISER_API_KEY=[your-key]
IPQUALITYSCORE_API_KEY=[your-key]
```

### Step 4: API Gateway (Cuối cùng)

**Service Name**: `api-gateway-docker`
**Dockerfile Path**: `./services/api-gateway/Dockerfile.render`
**Additional Env**:
```
AUTH_SERVICE_URL=https://auth-service-docker.onrender.com
LINK_SERVICE_URL=https://link-service-docker.onrender.com
COMMUNITY_SERVICE_URL=https://community-service-docker.onrender.com
CHAT_SERVICE_URL=https://chat-service-docker.onrender.com
NEWS_SERVICE_URL=https://news-service-docker.onrender.com
ADMIN_SERVICE_URL=https://admin-service-docker.onrender.com
PHISHTANK_SERVICE_URL=https://phishtank-service-docker.onrender.com
CRIMINALIP_SERVICE_URL=https://criminalip-service-docker.onrender.com
CORS_ORIGIN=https://frontend.onrender.com
```

## 🧪 Testing Commands

```bash
# Test failed services after Docker migration
curl https://criminalip-service-docker.onrender.com/health
curl https://phishtank-service-docker.onrender.com/health  
curl https://link-service-docker.onrender.com/health
curl https://api-gateway-docker.onrender.com/health

# Test API Gateway routing
curl https://api-gateway-docker.onrender.com/api/links/health
curl https://api-gateway-docker.onrender.com/api/phishtank/health
```

## 📊 Expected Results

**Before (Node.js):**
- ❌ 4 services failed
- ⏱️ 15+ minute builds
- 💥 Build timeouts
- 🐛 Node modules errors

**After (Docker):**
- ✅ All services working
- ⚡ 5-8 minute builds
- 🔄 Reliable deployments
- 💪 Better performance

## 🔄 Optional: Migrate Working Services

Nếu muốn consistency, cũng có thể migrate các services đang work:

### Auth Service → Docker
```
Service Name: auth-service-docker
Dockerfile Path: ./services/auth-service/Dockerfile.render
```

### Chat Service → Docker
```
Service Name: chat-service-docker
Dockerfile Path: ./services/chat-service/Dockerfile.render
Additional Env: GEMINI_API_KEY=[your-key]
```

### Community Service → Docker
```
Service Name: community-service-docker
Dockerfile Path: ./services/community-service/Dockerfile.render
```

### Admin Service → Docker
```
Service Name: admin-service-docker
Dockerfile Path: ./services/admin-service/Dockerfile.render
```

### News Service → Docker
```
Service Name: news-service-docker
Dockerfile Path: ./services/news-service/Dockerfile.render
Additional Env: NEWSAPI_API_KEY=[your-key]
```

## 🎯 Migration Priority

**Phase 1 (MUST DO - Fix failed services):**
1. CriminalIP Service ← **BẮT ĐẦU TỪ ĐÂY**
2. PhishTank Service
3. Link Service
4. API Gateway

**Phase 2 (OPTIONAL - Consistency):**
5. Auth Service
6. Chat Service  
7. Community Service
8. Admin Service
9. News Service

## 📁 Files Created for You

- ✅ `RENDER_DOCKER_MIGRATION_GUIDE.md` - Chi tiết đầy đủ
- ✅ `DOCKER_MIGRATION_CHECKLIST.md` - Checklist từng bước
- ✅ `render-docker.yaml` - Configuration reference
- ✅ `scripts/deploy-render-docker.js` - Automation script
- ✅ All `Dockerfile.render` files optimized

## 🚨 Important Notes

1. **KHÔNG THỂ change environment type** của service hiện tại
2. **PHẢI TẠO MỚI** service với Docker environment
3. **Test từng service** trước khi delete service cũ
4. **Update service URLs** trong API Gateway sau khi migrate
5. **Deploy theo thứ tự** để tránh dependency issues

## 📞 Next Steps

1. **BẮT ĐẦU NGAY** với CriminalIP Service
2. **Follow** DOCKER_MIGRATION_CHECKLIST.md
3. **Test thoroughly** mỗi service
4. **Update URLs** trong API Gateway
5. **Monitor performance** improvements

---

**🎯 BẮt ĐẦU: Tạo CriminalIP Service Docker ngay bây giờ!**
