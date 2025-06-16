# 🚀 Anti-Fraud Platform - Deployment Summary

## 📋 Platform Overview

**Anti-Fraud Platform** là một hệ thống microservices để phát hiện và ngăn chặn gian lận trực tuyến qua việc xác minh link, báo cáo cộng đồng và phân tích AI.

### 🏗️ Kiến trúc Microservices

| Service | Port | Chức năng |
|---------|------|-----------|
| **API Gateway** | 8080 | Central entry point, routing, authentication |
| **Auth Service** | 3001 | User authentication, JWT management |
| **Link Service** | 3002 | Link verification, security scanning |
| **Community Service** | 3003 | Posts, comments, voting, moderation |
| **Chat Service** | 3004 | AI chatbot, Gemini integration |
| **News Service** | 3005 | News aggregation, content management |
| **Admin Service** | 3006 | Admin dashboard, monitoring |
| **Frontend** | 3000 | React application |

---

## 🚀 3 PHƯƠNG PHÁP DEPLOYMENT

### 1️⃣ LOCAL DEVELOPMENT (Khuyến nghị cho Dev)

**Ưu điểm**: Hot reload, debug dễ dàng, nhanh nhất

#### Quick Start:
```bash
# Setup environment
cp .env.template .env
# Edit .env với API keys của bạn

# Install dependencies
npm run install:all

# Start tất cả services
npm run dev:full

# Hoặc sử dụng script
./scripts/dev-deploy.sh dev
```

#### Services sẽ chạy tại:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Services: 3001-3006

---

### 2️⃣ DOCKER DEPLOYMENT (Khuyến nghị cho Testing)

**Ưu điểm**: Isolated environment, gần giống production

#### Quick Start:
```bash
# Setup environment
cp .env.template .env
# Edit .env với API keys

# Deploy với Docker
./scripts/dev-deploy.sh start

# Hoặc manual
docker-compose -f docker-compose.microservices.yml up -d
```

#### Monitoring:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3007 (admin/admin)
- Jaeger: http://localhost:16686

---

### 3️⃣ KUBERNETES DEPLOYMENT (Production)

**Ưu điểm**: Production-ready, auto-scaling, high availability

#### Quick Start:
```bash
# Generate manifests
./scripts/generate-k8s-manifests.sh

# Build và push images
./scripts/k8s-deploy.bat build  # Windows
# Hoặc manual build

# Deploy to K8s
./k8s/deploy.sh  # Linux/macOS
./scripts/k8s-deploy.bat deploy  # Windows
```

---

## 🔐 ENVIRONMENT SETUP

### Required API Keys:

1. **Firebase** (Required):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create project → Service Accounts → Generate private key
   - Extract: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

2. **JWT Secret** (Required):
   ```bash
   # Generate strong secret (32+ chars)
   JWT_SECRET=your-super-secure-jwt-secret-key-32-characters-minimum
   ```

3. **Gemini AI** (For Chat Service):
   - Get from [Google AI Studio](https://aistudio.google.com/)
   - `GEMINI_API_KEY=your-gemini-api-key`

4. **VirusTotal** (For Link Verification):
   - Sign up at [VirusTotal](https://www.virustotal.com/gui/join-us)
   - `VIRUSTOTAL_API_KEY=your-virustotal-api-key`

### Environment Validation:
```bash
# Validate configuration
./scripts/validate-env.sh

# Windows
bash scripts/validate-env.sh
```

---

## 📱 AVAILABLE SCRIPTS

### Linux/macOS/Git Bash:
```bash
./scripts/dev-deploy.sh [command]
```

### Windows CMD:
```cmd
scripts\dev-deploy.bat [command]
```

### Windows PowerShell:
```powershell
.\scripts\dev-deploy.ps1 [command]
```

### Make (All platforms):
```bash
make [command]
```

### Commands:
- `start/up` - Start all services
- `dev` - Start with hot reload (no rebuild needed)
- `stop/down` - Stop all services
- `restart` - Restart services
- `logs` - View logs
- `health` - Check service health
- `clean` - Clean up containers

---

## 🛠️ DEVELOPMENT WORKFLOW

### Hot Reload Development (Không cần rebuild):
```bash
# Start development mode
./scripts/dev-deploy.sh dev

# Code changes sẽ tự động reload
# Không cần restart containers
```

### Service-specific operations:
```bash
# Restart specific service
./scripts/dev-deploy.sh restart --service auth-service

# View specific service logs
./scripts/dev-deploy.sh logs --service auth-service --follow
```

---

## 🔍 MONITORING & DEBUGGING

### Health Checks:
```bash
# Check all services
./scripts/dev-deploy.sh health

# Manual checks
curl http://localhost:8080/health
curl http://localhost:3001/health
```

### Logs:
```bash
# All services
./scripts/dev-deploy.sh logs --follow

# Specific service
docker-compose logs -f auth-service

# Kubernetes
kubectl logs -l app=auth-service -n anti-fraud-platform
```

### Monitoring Stack:
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Dashboards (port 3007)
- **Jaeger**: Distributed tracing (port 16686)

---

## 🚨 TROUBLESHOOTING

### Common Issues:

1. **Port conflicts**:
   ```bash
   # Check ports
   netstat -tulpn | grep LISTEN
   # Kill process
   kill -9 $(lsof -ti:3001)
   ```

2. **Docker issues**:
   ```bash
   # Clean Docker
   docker system prune -a -f
   # Restart Docker Desktop
   ```

3. **Environment variables**:
   ```bash
   # Validate
   ./scripts/validate-env.sh
   # Check .env file
   cat .env
   ```

4. **Memory issues**:
   - Ensure 8GB+ RAM available
   - Close unnecessary applications
   - Use development mode instead of full Docker

---

## 📚 DOCUMENTATION FILES

Tham khảo các file documentation:

- **DEPLOYMENT_GUIDE_COMPREHENSIVE.md** - Complete deployment guide
- **API_KEYS_SETUP_GUIDE.md** - Detailed API keys setup
- **DEVELOPMENT_WORKFLOW_GUIDE.md** - Development best practices
- **MICROSERVICES_ARCHITECTURE.md** - Architecture details
- **MIGRATION_SUMMARY.md** - Migration from monolith

---

## 🎯 QUICK COMMANDS CHEAT SHEET

### First Time Setup:
```bash
# 1. Setup environment
cp .env.template .env
nano .env  # Edit with your API keys

# 2. Validate configuration
./scripts/validate-env.sh

# 3. Start development
./scripts/dev-deploy.sh dev
```

### Daily Development:
```bash
# Start services
./scripts/dev-deploy.sh dev

# View logs
./scripts/dev-deploy.sh logs --follow

# Health check
./scripts/dev-deploy.sh health

# Stop services
./scripts/dev-deploy.sh stop
```

### Production Deployment:
```bash
# Docker
./scripts/dev-deploy.sh start

# Kubernetes
./scripts/generate-k8s-manifests.sh
./k8s/deploy.sh
```

---

## 🆘 GET HELP

1. **Validate environment**: `./scripts/validate-env.sh`
2. **Check logs**: `./scripts/dev-deploy.sh logs`
3. **Health check**: `./scripts/dev-deploy.sh health`
4. **Debug mode**: `./scripts/dev-deploy.sh debug`
5. **Review documentation** in the `docs/` directory

---

## 🎉 SUCCESS INDICATORS

Khi deployment thành công, bạn sẽ thấy:

✅ All services running on their respective ports  
✅ Health checks returning 200 OK  
✅ Frontend accessible at http://localhost:3000  
✅ API Gateway at http://localhost:8080  
✅ No error logs in service outputs  
✅ Monitoring dashboards working (if using Docker)  

**🚀 Chúc bạn deployment thành công!**
