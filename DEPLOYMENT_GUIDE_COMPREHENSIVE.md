# 🚀 Anti-Fraud Platform - Comprehensive Deployment Guide

## 📋 Tổng quan

Platform Anti-Fraud sử dụng kiến trúc microservices với 8 services chính:

| Service | Port | Mô tả |
|---------|------|-------|
| **API Gateway** | 8080 | Central entry point, routing, authentication |
| **Auth Service** | 3001 | Quản lý user authentication, JWT tokens |
| **Link Service** | 3002 | Xác minh link, security scanning |
| **Community Service** | 3003 | Posts, comments, voting, moderation |
| **Chat Service** | 3004 | AI chatbot, Gemini integration |
| **News Service** | 3005 | News aggregation, content management |
| **Admin Service** | 3006 | Admin dashboard, monitoring |
| **Frontend** | 3000 | React application |

## 🔧 Prerequisites

### Yêu cầu hệ thống:
- **OS**: Windows 10/11, macOS, Linux
- **RAM**: Tối thiểu 8GB (khuyến nghị 16GB)
- **Storage**: Tối thiểu 10GB free space
- **CPU**: Multi-core processor

### Phần mềm cần thiết:
- **Node.js** 18+ và npm
- **Docker Desktop** (cho Docker deployment)
- **kubectl** (cho Kubernetes deployment)
- **Git** (để clone repository)

---

## 🏠 METHOD 1: LOCAL DEVELOPMENT

### 🎯 Ưu điểm:
- ⚡ Hot reload - không cần restart khi code thay đổi
- 🔍 Dễ debug trực tiếp
- 🚀 Nhanh nhất cho development

### 📦 Bước 1: Cài đặt Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd anti-fraud-platform

# Cài đặt dependencies cho tất cả services
npm run install:all

# Hoặc cài thủ công từng service:
cd client && npm install
cd ../services/auth-service && npm install
cd ../api-gateway && npm install
cd ../admin-service && npm install
cd ../chat-service && npm install
cd ../community-service && npm install
cd ../link-service && npm install
cd ../news-service && npm install
```

### 🔐 Bước 2: Cấu hình Environment Variables

```bash
# Copy template
cp .env.template .env

# Chỉnh sửa .env với các thông tin cần thiết:
```

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-32-characters-minimum

# API Keys
GEMINI_API_KEY=your-gemini-api-key
VIRUSTOTAL_API_KEY=your-virustotal-api-key
SCAMADVISER_API_KEY=your-scamadviser-api-key
NEWSAPI_KEY=your-newsapi-key

# External Services
REDIS_URL=redis://localhost:6379
```

### 🚀 Bước 3: Start Services

#### Option A: Sử dụng npm scripts (Khuyến nghị)
```bash
# Start tất cả services với hot reload
npm run dev:full

# Hoặc start chỉ backend services
npm run dev:services

# Hoặc start chỉ frontend
npm run dev:client
```

#### Option B: Start từng service riêng (8 terminals)
```bash
# Terminal 1: API Gateway
cd services/api-gateway && npm run dev

# Terminal 2: Auth Service
cd services/auth-service && npm run dev

# Terminal 3: Link Service
cd services/link-service && npm run dev

# Terminal 4: Community Service
cd services/community-service && npm run dev

# Terminal 5: Chat Service
cd services/chat-service && npm run dev

# Terminal 6: News Service
cd services/news-service && npm run dev

# Terminal 7: Admin Service
cd services/admin-service && npm run dev

# Terminal 8: Frontend
cd client && npm start
```

#### Option C: Sử dụng scripts có sẵn
```bash
# Linux/macOS/Git Bash
./scripts/dev-deploy.sh dev

# Windows CMD
scripts\dev-deploy.bat dev

# Windows PowerShell
.\scripts\dev-deploy.ps1 dev
```

### 🎯 Bước 4: Kiểm tra

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Services**: Các ports từ 3001-3006

---

## 🐳 METHOD 2: DOCKER DEPLOYMENT

### 🎯 Ưu điểm:
- 🔒 Isolated environment
- 📦 Dễ deploy và scale
- 🌐 Gần giống production environment

### 🚀 Bước 1: Quick Deploy (Khuyến nghị)

```bash
# Sử dụng deployment script
./scripts/dev-deploy.sh start

# Hoặc sử dụng Make
make start

# Hoặc Windows
scripts\dev-deploy.bat start
```

### 🔧 Bước 2: Manual Docker Compose

#### Development Mode (với hot reload):
```bash
# Tạo .env file trước (xem phần Local Development)
cp .env.template .env
# Chỉnh sửa .env với thông tin của bạn

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Xem logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

#### Production Mode:
```bash
# Start production environment
docker-compose -f docker-compose.microservices.yml up -d

# Xem logs
docker-compose -f docker-compose.microservices.yml logs -f

# Stop
docker-compose -f docker-compose.microservices.yml down
```

### 📊 Bước 3: Monitoring

Các services monitoring sẽ được start cùng:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3007 (admin/admin)
- **Jaeger**: http://localhost:16686

### 🔍 Bước 4: Health Check

```bash
# Sử dụng script
./scripts/dev-deploy.sh health

# Hoặc manual check
curl http://localhost:8080/health
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Link Service
# ... tương tự cho các services khác
```

### 🛠️ Troubleshooting Docker

```bash
# Xem logs của service cụ thể
docker-compose -f docker-compose.microservices.yml logs -f auth-service

# Restart service cụ thể
docker-compose -f docker-compose.microservices.yml restart auth-service

# Rebuild và restart
docker-compose -f docker-compose.microservices.yml up -d --build

# Clean up containers và images
docker-compose -f docker-compose.microservices.yml down --volumes --rmi all
```

---

## ☸️ METHOD 3: KUBERNETES DEPLOYMENT

### 🎯 Ưu điểm:
- 🚀 Production-ready
- 📈 Auto-scaling
- 🔄 Rolling updates
- 🛡️ High availability

### 📦 Bước 1: Chuẩn bị Kubernetes Cluster

#### Local Kubernetes (Development):
```bash
# Sử dụng Docker Desktop Kubernetes
# Hoặc minikube
minikube start --memory=8192 --cpus=4

# Hoặc kind
kind create cluster --name anti-fraud-platform
```

#### Cloud Kubernetes (Production):
- **Google GKE**: `gcloud container clusters create anti-fraud-cluster`
- **AWS EKS**: `eksctl create cluster --name anti-fraud-cluster`
- **Azure AKS**: `az aks create --name anti-fraud-cluster`

### 🔧 Bước 2: Build và Push Docker Images

```bash
# Build images cho tất cả services
docker build -t your-registry/anti-fraud-platform/auth-service:latest services/auth-service/
docker build -t your-registry/anti-fraud-platform/api-gateway:latest services/api-gateway/
docker build -t your-registry/anti-fraud-platform/link-service:latest services/link-service/
docker build -t your-registry/anti-fraud-platform/community-service:latest services/community-service/
docker build -t your-registry/anti-fraud-platform/chat-service:latest services/chat-service/
docker build -t your-registry/anti-fraud-platform/news-service:latest services/news-service/
docker build -t your-registry/anti-fraud-platform/admin-service:latest services/admin-service/
docker build -t your-registry/anti-fraud-platform/frontend:latest client/

# Push images
docker push your-registry/anti-fraud-platform/auth-service:latest
docker push your-registry/anti-fraud-platform/api-gateway:latest
# ... push tất cả images
```

### 🚀 Bước 3: Deploy to Kubernetes

#### Tạo namespace:
```bash
kubectl apply -f k8s/namespace.yml
```

#### Tạo ConfigMap và Secrets:
```bash
# Tạo ConfigMap
kubectl create configmap app-config \
  --from-literal=NODE_ENV=production \
  --from-literal=REDIS_URL=redis://redis:6379 \
  -n anti-fraud-platform

# Tạo Secret
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=FIREBASE_PROJECT_ID=your-firebase-project-id \
  --from-literal=FIREBASE_CLIENT_EMAIL=your-firebase-email \
  --from-literal=FIREBASE_PRIVATE_KEY="your-firebase-private-key" \
  --from-literal=GEMINI_API_KEY=your-gemini-api-key \
  --from-literal=VIRUSTOTAL_API_KEY=your-virustotal-api-key \
  -n anti-fraud-platform
```

#### Deploy Redis:
```bash
kubectl apply -f k8s/redis.yml
```

#### Deploy Services:
```bash
# Sử dụng script tự động tạo manifests
./scripts/generate-k8s-manifests.sh

# Hoặc tạo thủ công từ template
# Thay thế {{SERVICE_NAME}} và {{PORT}} trong k8s/service-template.yml

# Deploy auth-service
sed 's/{{SERVICE_NAME}}/auth-service/g; s/{{PORT}}/3001/g' k8s/service-template.yml | kubectl apply -f -

# Deploy api-gateway
sed 's/{{SERVICE_NAME}}/api-gateway/g; s/{{PORT}}/8080/g' k8s/service-template.yml | kubectl apply -f -

# Deploy link-service
sed 's/{{SERVICE_NAME}}/link-service/g; s/{{PORT}}/3002/g' k8s/service-template.yml | kubectl apply -f -

# Deploy community-service
sed 's/{{SERVICE_NAME}}/community-service/g; s/{{PORT}}/3003/g' k8s/service-template.yml | kubectl apply -f -

# Deploy chat-service
sed 's/{{SERVICE_NAME}}/chat-service/g; s/{{PORT}}/3004/g' k8s/service-template.yml | kubectl apply -f -

# Deploy news-service
sed 's/{{SERVICE_NAME}}/news-service/g; s/{{PORT}}/3005/g' k8s/service-template.yml | kubectl apply -f -

# Deploy admin-service
sed 's/{{SERVICE_NAME}}/admin-service/g; s/{{PORT}}/3006/g' k8s/service-template.yml | kubectl apply -f -

# Deploy frontend
sed 's/{{SERVICE_NAME}}/frontend/g; s/{{PORT}}/3000/g' k8s/service-template.yml | kubectl apply -f -
```

### 🔍 Bước 4: Verify Deployment

```bash
# Kiểm tra pods
kubectl get pods -n anti-fraud-platform

# Kiểm tra services
kubectl get services -n anti-fraud-platform

# Kiểm tra logs
kubectl logs -l app=auth-service -n anti-fraud-platform

# Port forward để test
kubectl port-forward svc/api-gateway 8080:8080 -n anti-fraud-platform
```

### 🌐 Bước 5: Expose Services

#### Sử dụng LoadBalancer:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-lb
  namespace: anti-fraud-platform
spec:
  type: LoadBalancer
  selector:
    app: api-gateway
  ports:
  - port: 80
    targetPort: 8080
```

#### Sử dụng Ingress:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: anti-fraud-platform-ingress
  namespace: anti-fraud-platform
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: anti-fraud-platform.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 8080
```

---

## 🔥 Development Workflow

### 🚀 Phương pháp không cần rebuild Docker

#### 1. Development Mode với Hot Reload:
```bash
# Start với hot reload (khuyến nghị)
./scripts/dev-deploy.sh dev

# Khi code thay đổi, services sẽ tự động restart
# Không cần rebuild containers
```

#### 2. Restart Service cụ thể:
```bash
# Restart chỉ một service
./scripts/dev-deploy.sh restart --service auth-service

# Sử dụng Make
make restart-service SERVICE=auth-service
```

#### 3. Xem logs real-time:
```bash
# Xem logs tất cả services
./scripts/dev-deploy.sh logs --follow

# Xem logs một service cụ thể
./scripts/dev-deploy.sh logs --service auth-service --follow
```

---

## 🛠️ Troubleshooting

### ❌ Common Issues:

#### 1. Port conflicts:
```bash
# Kiểm tra ports đang sử dụng
netstat -tulpn | grep LISTEN

# Kill process đang sử dụng port
kill -9 $(lsof -ti:3001)
```

#### 2. Docker issues:
```bash
# Cleanup Docker
docker system prune -a -f

# Restart Docker Desktop
```

#### 3. Service health check failed:
```bash
# Kiểm tra logs
docker-compose logs service-name

# Kiểm tra network
docker network ls
docker network inspect anti-fraud-platform_microservices-network
```

#### 4. Environment variables:
```bash
# Kiểm tra .env file
cat .env

# Kiểm tra environment trong container
docker exec -it container-name printenv
```

---

## 📈 Monitoring & Logging

### 📊 Monitoring Stack:
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Jaeger**: Distributed tracing
- **Loki**: Log aggregation (optional)

### 🔍 Log Management:
```bash
# Centralized logging với Docker
docker-compose logs -f --tail=100

# Per-service logging
docker-compose logs -f auth-service

# Kubernetes logging
kubectl logs -f deployment/auth-service -n anti-fraud-platform
```

---

## 🚀 Production Deployment Checklist

### ✅ Pre-deployment:
- [ ] Environment variables configured
- [ ] API keys và secrets secured
- [ ] Database backup completed
- [ ] SSL certificates ready
- [ ] Domain names configured
- [ ] Monitoring setup verified

### 🔒 Security:
- [ ] HTTPS enabled
- [ ] JWT secrets secured
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] Input validation enabled
- [ ] Firewall rules configured

### 📊 Performance:
- [ ] Resource limits set
- [ ] Auto-scaling configured
- [ ] Health checks implemented
- [ ] Load balancing configured
- [ ] CDN configured (if needed)

### 📋 Monitoring:
- [ ] Metrics collection enabled
- [ ] Alerting rules configured
- [ ] Log aggregation setup
- [ ] Dashboard created
- [ ] Backup procedures tested

---

## 🆘 Support

### 📞 Getting Help:
1. Check logs first: `./scripts/dev-deploy.sh logs`
2. Verify health: `./scripts/dev-deploy.sh health`
3. Check documentation: `docs/` directory
4. Review troubleshooting section above

### 🔧 Debug Mode:
```bash
# Start in debug mode
./scripts/dev-deploy.sh debug

# Enable verbose logging
./scripts/dev-deploy.sh start --verbose
```

---

## 📚 Additional Resources

- **API Documentation**: Swagger UI at `/api/docs`
- **Architecture Guide**: `MICROSERVICES_ARCHITECTURE.md`
- **Development Workflow**: `DEVELOPMENT_WORKFLOW_GUIDE.md`
- **Migration Guide**: `MIGRATION_SUMMARY.md`
