# ✅ Render Docker Deployment Checklist

## 📋 Pre-Deployment Checklist

- [ ] GitHub repository có code mới nhất
- [ ] File .env có đầy đủ API keys
- [ ] Tài khoản Render đã sẵn sàng
- [ ] Đã đọc hướng dẫn chi tiết trong `RENDER_DOCKER_DEPLOYMENT_GUIDE.md`

## 🚀 Deployment Progress

### Services (Deploy theo thứ tự)

- [ ] **1. Auth Service** 
  - Service name: `factcheck-auth-docker`
  - URL: https://factcheck-auth-docker.onrender.com
  - Health check: ✅ https://factcheck-auth-docker.onrender.com/health

- [ ] **2. Link Service**
  - Service name: `factcheck-link-docker`
  - URL: https://factcheck-link-docker.onrender.com
  - Health check: ✅ https://factcheck-link-docker.onrender.com/health

- [ ] **3. Community Service**
  - Service name: `factcheck-community-docker`
  - URL: https://factcheck-community-docker.onrender.com
  - Health check: ✅ https://factcheck-community-docker.onrender.com/health

- [ ] **4. Chat Service**
  - Service name: `factcheck-chat-docker`
  - URL: https://factcheck-chat-docker.onrender.com
  - Health check: ✅ https://factcheck-chat-docker.onrender.com/health

- [ ] **5. News Service**
  - Service name: `factcheck-news-docker`
  - URL: https://factcheck-news-docker.onrender.com
  - Health check: ✅ https://factcheck-news-docker.onrender.com/health

- [ ] **6. Admin Service**
  - Service name: `factcheck-admin-docker`
  - URL: https://factcheck-admin-docker.onrender.com
  - Health check: ✅ https://factcheck-admin-docker.onrender.com/health

- [ ] **7. PhishTank Service**
  - Service name: `factcheck-phishtank-docker`
  - URL: https://factcheck-phishtank-docker.onrender.com
  - Health check: ✅ https://factcheck-phishtank-docker.onrender.com/health

- [ ] **8. CriminalIP Service**
  - Service name: `factcheck-criminalip-docker`
  - URL: https://factcheck-criminalip-docker.onrender.com
  - Health check: ✅ https://factcheck-criminalip-docker.onrender.com/health

- [ ] **9. API Gateway** (Cần update Service URLs trước!)
  - Service name: `factcheck-api-gateway-docker`
  - URL: https://factcheck-api-gateway-docker.onrender.com
  - Health check: ✅ https://factcheck-api-gateway-docker.onrender.com/health

- [ ] **10. Frontend** (Deploy cuối cùng)
  - Service name: `factcheck-frontend-docker`
  - URL: https://factcheck-frontend-docker.onrender.com

## 🔧 Post-Deployment Testing

- [ ] All health endpoints return 200 OK
- [ ] Frontend loads successfully
- [ ] Can login/register through frontend
- [ ] APIs work correctly through frontend
- [ ] All services communicate properly

## 📝 Notes

**Build Times:** Each service takes 5-10 minutes to build

**Common Issues:**
- Build fails → Check Dockerfile and Docker context
- Service doesn't start → Check environment variables
- 503 errors → Service might be starting up (wait 2-3 minutes)

**Service URLs Template:**
```
AUTH_SERVICE_URL=https://factcheck-auth-docker.onrender.com
LINK_SERVICE_URL=https://factcheck-link-docker.onrender.com
COMMUNITY_SERVICE_URL=https://factcheck-community-docker.onrender.com
CHAT_SERVICE_URL=https://factcheck-chat-docker.onrender.com
NEWS_SERVICE_URL=https://factcheck-news-docker.onrender.com
ADMIN_SERVICE_URL=https://factcheck-admin-docker.onrender.com
PHISHTANK_SERVICE_URL=https://factcheck-phishtank-docker.onrender.com
CRIMINALIP_SERVICE_URL=https://factcheck-criminalip-docker.onrender.com
```

## 🎯 Final Result

When complete, you'll have:
- ✅ **Frontend:** https://factcheck-frontend-docker.onrender.com
- ✅ **API Gateway:** https://factcheck-api-gateway-docker.onrender.com
- ✅ **8 Microservices** running independently
- ✅ **Production-ready** Docker containers
- ✅ **Auto-scaling** and load balancing
- ✅ **SSL certificates** automatically
