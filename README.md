# Anti-Fraud Platform - Microservices Architecture 🛡️

A comprehensive platform for detecting and preventing online fraud through link verification, community reporting, and AI-powered analysis. **Built with modern microservices architecture for scalability and maintainability.**

## 🏗️ Architecture Overview

This platform uses a **microservices architecture** with the following services:

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **API Gateway** | 8080 | Central entry point, routing, authentication | ✅ Ready |
| **Auth Service** | 3001 | User authentication and management | ✅ Ready |
| **Link Service** | 3002 | Link verification and security scanning | ✅ Ready |
| **Community Service** | 3003 | Posts, comments, voting, moderation | ✅ Ready |
| **Chat Service** | 3004 | AI chatbot and conversations | ✅ Ready |
| **News Service** | 3005 | News aggregation and content management | ✅ Ready |
| **Admin Service** | 3006 | Administrative functions and monitoring | ✅ Ready |
| **Frontend** | 3000 | React application | ✅ Ready |

## ✨ Features

- **🔗 Link Verification**: Multi-provider security scanning (VirusTotal, ScamAdviser, etc.)
- **👥 Community Reporting**: User-driven fraud reporting and verification
- **🤖 AI Analysis**: Gemini AI-powered content analysis and risk assessment
- **💬 Real-time Chat**: AI chatbot for instant fraud detection assistance
- **📰 News Integration**: Latest fraud alerts and security news
- **⚙️ Admin Dashboard**: Comprehensive management and analytics tools
- **🔒 Security**: JWT authentication, rate limiting, input validation
- **📊 Monitoring**: Health checks, metrics, distributed tracing

## 📋 Prerequisites

Before deploying, ensure you have:

- **Node.js 18+** (for local development)
- **Docker & Docker Compose** (for containerized deployment)
- **Kubernetes cluster** (for K8s deployment)
- **Firebase account** (for authentication and database)
- **Git** (for cloning repository)

## 🚀 Deployment Options

Choose your preferred deployment method based on your environment and requirements:

### 📦 Method 1: Local Development (No Docker)

**Best for**: Development, debugging, and testing individual services.

#### Step 1: Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd anti-fraud-platform

# Install dependencies for all services
npm run install:all
```

#### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# See Environment Configuration section below
```

#### Step 3: Start Firebase Emulator (Optional)

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Start Firebase emulator
firebase emulators:start
```

#### Step 4: Start All Services

```bash
# Option A: Start all services with one command
npm run dev:services

# Option B: Start services individually (for debugging)
# Terminal 1: Auth Service
cd services/auth-service && npm run dev

# Terminal 2: Link Service
cd services/link-service && npm run dev

# Terminal 3: Community Service
cd services/community-service && npm run dev

# Terminal 4: Chat Service
cd services/chat-service && npm run dev

# Terminal 5: News Service
cd services/news-service && npm run dev

# Terminal 6: Admin Service
cd services/admin-service && npm run dev

# Terminal 7: API Gateway
cd services/api-gateway && npm run dev

# Terminal 8: Frontend
cd client && npm start
```

#### Step 5: Access Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Individual Services**: http://localhost:300X (where X is service port)

---

### 🐳 Method 2: Docker Deployment (Recommended)

**Best for**: Production-like environment, easy setup, and consistent deployment.

#### Step 1: Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd anti-fraud-platform
```

#### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Docker will automatically use these variables
```

#### Step 3: Deploy with Docker Compose

```bash
# Make scripts executable (Linux/Mac)
chmod +x scripts/*.sh

# Deploy all services with Docker
./scripts/deploy-microservices.sh

# Or manually with docker-compose
docker-compose -f docker-compose.microservices.yml up -d
```

#### Step 4: Verify Deployment

```bash
# Check all containers are running
docker ps

# Check service health
curl http://localhost:8080/services/status
```

#### Step 5: Access Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Monitoring**: http://localhost:9090 (Prometheus)
- **Grafana**: http://localhost:3007 (admin/admin)

#### Docker Management Commands

```bash
# View logs for all services
docker-compose -f docker-compose.microservices.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.microservices.yml logs -f auth-service

# Restart specific service
docker-compose -f docker-compose.microservices.yml restart auth-service

# Stop all services
./scripts/stop-microservices.sh

# Scale specific service
docker-compose -f docker-compose.microservices.yml up --scale auth-service=3 -d
```

---

### ☸️ Method 3: Kubernetes Deployment

**Best for**: Production environments, high availability, and auto-scaling.

#### Step 1: Prerequisites

```bash
# Ensure you have kubectl and a Kubernetes cluster
kubectl version --client
kubectl cluster-info

# Install Helm (optional, for easier management)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

#### Step 2: Create Namespace

```bash
# Create dedicated namespace
kubectl create namespace anti-fraud-platform

# Set as default namespace (optional)
kubectl config set-context --current --namespace=anti-fraud-platform
```

#### Step 3: Configure Secrets

```bash
# Create secret for environment variables
kubectl create secret generic app-secrets \
  --from-literal=FIREBASE_PROJECT_ID=your-project-id \
  --from-literal=FIREBASE_PRIVATE_KEY="your-private-key" \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=GEMINI_API_KEY=your-gemini-key \
  --namespace=anti-fraud-platform
```

#### Step 4: Deploy Services

```bash
# Deploy all services
kubectl apply -f k8s/ -n anti-fraud-platform

# Or deploy individually
kubectl apply -f k8s/auth-service/ -n anti-fraud-platform
kubectl apply -f k8s/link-service/ -n anti-fraud-platform
kubectl apply -f k8s/community-service/ -n anti-fraud-platform
kubectl apply -f k8s/chat-service/ -n anti-fraud-platform
kubectl apply -f k8s/news-service/ -n anti-fraud-platform
kubectl apply -f k8s/admin-service/ -n anti-fraud-platform
kubectl apply -f k8s/api-gateway/ -n anti-fraud-platform
kubectl apply -f k8s/frontend/ -n anti-fraud-platform
```

#### Step 5: Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n anti-fraud-platform

# Check services
kubectl get services -n anti-fraud-platform

# Check ingress (if configured)
kubectl get ingress -n anti-fraud-platform
```

#### Step 6: Access Application

```bash
# Port forward to access locally (for testing)
kubectl port-forward service/api-gateway 8080:8080 -n anti-fraud-platform
kubectl port-forward service/frontend 3000:3000 -n anti-fraud-platform

# Or access via LoadBalancer/Ingress (production)
kubectl get service frontend -n anti-fraud-platform
```

#### Kubernetes Management Commands

```bash
# View logs for specific pod
kubectl logs -f deployment/auth-service -n anti-fraud-platform

# Scale deployment
kubectl scale deployment auth-service --replicas=3 -n anti-fraud-platform

# Update deployment
kubectl set image deployment/auth-service auth-service=your-registry/auth-service:v2 -n anti-fraud-platform

# Delete all resources
kubectl delete namespace anti-fraud-platform
```

#### Production Considerations

```bash
# Enable horizontal pod autoscaling
kubectl autoscale deployment auth-service --cpu-percent=70 --min=2 --max=10 -n anti-fraud-platform

# Configure resource limits (edit k8s manifests)
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

# Set up monitoring with Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

---

## 🔧 Environment Configuration

All deployment methods require proper environment configuration. Create a `.env` file in the project root:

### Required Configuration

```env
# Service Configuration
NODE_ENV=development

# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=your-client-email@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# API Keys (Optional - will use mock data if not provided)
GEMINI_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
VIRUSTOTAL_API_KEY=your-virustotal-api-key
SCAMADVISER_API_KEY=your-scamadviser-api-key
SCREENSHOTLAYER_API_KEY=your-screenshotlayer-api-key
NEWSAPI_API_KEY=your-newsapi-api-key

# React App Configuration
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=your-firebase-web-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8
```

### Deployment-Specific Configuration

#### For Local Development (Method 1)

```env
# Service URLs (localhost)
AUTH_SERVICE_URL=http://localhost:3001
LINK_SERVICE_URL=http://localhost:3002
COMMUNITY_SERVICE_URL=http://localhost:3003
CHAT_SERVICE_URL=http://localhost:3004
NEWS_SERVICE_URL=http://localhost:3005
ADMIN_SERVICE_URL=http://localhost:3006

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Database
USE_FIREBASE_EMULATOR=true
FIREBASE_EMULATOR_HOST=localhost:8080
```

#### For Docker Deployment (Method 2)

```env
# Service URLs (Docker internal network)
AUTH_SERVICE_URL=http://auth-service:3001
LINK_SERVICE_URL=http://link-service:3002
COMMUNITY_SERVICE_URL=http://community-service:3003
CHAT_SERVICE_URL=http://chat-service:3004
NEWS_SERVICE_URL=http://news-service:3005
ADMIN_SERVICE_URL=http://admin-service:3006

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Database
USE_FIREBASE_EMULATOR=false
```

#### For Kubernetes Deployment (Method 3)

```env
# Service URLs (Kubernetes internal DNS)
AUTH_SERVICE_URL=http://auth-service.anti-fraud-platform.svc.cluster.local:3001
LINK_SERVICE_URL=http://link-service.anti-fraud-platform.svc.cluster.local:3002
COMMUNITY_SERVICE_URL=http://community-service.anti-fraud-platform.svc.cluster.local:3003
CHAT_SERVICE_URL=http://chat-service.anti-fraud-platform.svc.cluster.local:3004
NEWS_SERVICE_URL=http://news-service.anti-fraud-platform.svc.cluster.local:3005
ADMIN_SERVICE_URL=http://admin-service.anti-fraud-platform.svc.cluster.local:3006

# CORS (adjust for your domain)
ALLOWED_ORIGINS=https://your-domain.com,https://api.your-domain.com

# Database
USE_FIREBASE_EMULATOR=false
```

### Getting API Keys

1. **Firebase**: Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts
2. **Gemini AI**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **VirusTotal**: Register at [VirusTotal](https://www.virustotal.com/gui/join-us)
4. **ScamAdviser**: Contact [ScamAdviser API](https://www.scamadviser.com/api)
5. **ScreenshotLayer**: Sign up at [ScreenshotLayer](https://screenshotlayer.com/)
6. **NewsAPI**: Register at [NewsAPI](https://newsapi.org/register)

---

## 📊 Service Health Monitoring

After deployment, verify all services are running properly:

### Health Check Commands

```bash
# Check all services status via API Gateway
curl http://localhost:8080/services/status

# Check individual service health
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Link Service
curl http://localhost:3003/health  # Community Service
curl http://localhost:3004/health  # Chat Service
curl http://localhost:3005/health  # News Service
curl http://localhost:3006/health  # Admin Service
```

### For Kubernetes Deployment

```bash
# Check pod status
kubectl get pods -n anti-fraud-platform

# Check service endpoints
kubectl get endpoints -n anti-fraud-platform

# Test service connectivity
kubectl exec -it deployment/api-gateway -n anti-fraud-platform -- curl http://auth-service:3001/health
```

## 🔗 API Endpoints

### API Gateway (http://localhost:8080)
- `GET /health` - Gateway health
- `GET /services/status` - All services status
- `GET /info` - Gateway information

### Authentication (via Gateway)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /users/profile` - Get user profile

### Link Verification (via Gateway)
- `POST /links/check` - Check single link
- `POST /links/bulk-check` - Check multiple links
- `GET /links/history` - User's check history

### Community (via Gateway)
- `GET /community/posts` - Get community posts
- `POST /community/posts` - Create new post
- `POST /community/posts/:id/comments` - Add comment

### Chat (via Gateway)
- `POST /chat/message` - Send chat message
- `GET /conversations` - Get conversations

### News (via Gateway)
- `GET /news/feed` - Get news feed
- `GET /news/trending` - Get trending news

### Admin (via Gateway)
- `GET /admin/dashboard` - Admin dashboard data
- `GET /admin/users` - User management

---

## 📈 Monitoring & Observability

### Available Monitoring Tools

- **Prometheus**: <http://localhost:9090> - Metrics collection and alerting
- **Grafana**: <http://localhost:3007> - Visualization dashboards (admin/admin)
- **Jaeger**: <http://localhost:16686> - Distributed tracing (Docker only)

### Custom Metrics

Each service exposes metrics at `/metrics` endpoint:

```bash
# View service metrics
curl http://localhost:3001/metrics  # Auth Service metrics
curl http://localhost:8080/metrics  # API Gateway metrics
```

---

## 🆘 Troubleshooting

### Common Issues by Deployment Method

#### Local Development Issues

| Issue | Solution |
|-------|----------|
| Port conflicts | Check if ports 3000-3006, 8080 are free |
| Node.js version | Use Node.js 18+ |
| Firebase connection | Verify Firebase config in `.env` |
| Service startup order | Start API Gateway last |

```bash
# Check port usage
netstat -tulpn | grep :3000
lsof -i :8080

# Kill processes on specific ports
kill -9 $(lsof -t -i:3000)
```

#### Docker Issues

| Issue | Solution |
|-------|----------|
| Container not starting | Check `docker logs [container-name]` |
| Network connectivity | Verify Docker network: `docker network ls` |
| Volume permissions | Check file permissions for mounted volumes |
| Memory issues | Increase Docker memory limit |

```bash
# Debug Docker containers
docker ps -a
docker logs auth-service
docker exec -it auth-service /bin/sh

# Check Docker resources
docker system df
docker system prune -f
```

#### Kubernetes Issues

| Issue | Solution |
|-------|----------|
| Pod not starting | Check `kubectl describe pod [pod-name]` |
| Service discovery | Verify service DNS resolution |
| Resource limits | Check resource quotas and limits |
| ConfigMap/Secret | Verify configuration is properly mounted |

```bash
# Debug Kubernetes deployment
kubectl get events -n anti-fraud-platform
kubectl describe pod [pod-name] -n anti-fraud-platform
kubectl logs [pod-name] -n anti-fraud-platform

# Test service connectivity
kubectl exec -it [pod-name] -n anti-fraud-platform -- nslookup auth-service
```

### Performance Optimization

#### For Local Development

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Use nodemon for faster restarts
npm install -g nodemon
```

#### For Docker

```bash
# Optimize Docker build
docker build --no-cache -t service-name .

# Use multi-stage builds (already implemented)
# Monitor resource usage
docker stats
```

#### For Kubernetes

```bash
# Set resource requests and limits
kubectl patch deployment auth-service -p '{"spec":{"template":{"spec":{"containers":[{"name":"auth-service","resources":{"requests":{"memory":"256Mi","cpu":"250m"},"limits":{"memory":"512Mi","cpu":"500m"}}}]}}}}'

# Enable horizontal pod autoscaling
kubectl autoscale deployment auth-service --cpu-percent=70 --min=2 --max=10
```

---

## 📚 Quick Reference

### Deployment Commands Summary

| Method | Command | Access |
|--------|---------|--------|
| **Local** | `npm run dev:services` | <http://localhost:3000> |
| **Docker** | `./scripts/deploy-microservices.sh` | <http://localhost:3000> |
| **Kubernetes** | `kubectl apply -f k8s/` | Port-forward or Ingress |

### Service Ports

| Service | Local | Docker | Kubernetes |
|---------|-------|--------|------------|
| Frontend | 3000 | 3000 | 3000 |
| Auth | 3001 | 3001 | 3001 |
| Link | 3002 | 3002 | 3002 |
| Community | 3003 | 3003 | 3003 |
| Chat | 3004 | 3004 | 3004 |
| News | 3005 | 3005 | 3005 |
| Admin | 3006 | 3006 | 3006 |
| API Gateway | 8080 | 8080 | 8080 |

### Essential Commands

```bash
# Health checks
curl http://localhost:8080/services/status

# View logs (Docker)
docker-compose -f docker-compose.microservices.yml logs -f

# View logs (Kubernetes)
kubectl logs -f deployment/auth-service -n anti-fraud-platform

# Scale services (Kubernetes)
kubectl scale deployment auth-service --replicas=3 -n anti-fraud-platform
```

---

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern UI framework with hooks
- **TailwindCSS**: Utility-first CSS framework
- **GSAP**: Professional animations and interactions
- **Axios**: HTTP client for API calls

### Backend (Microservices)
- **Node.js 18**: JavaScript runtime
- **Express.js**: Web application framework
- **Firebase/Firestore**: NoSQL database
- **JWT**: Authentication tokens
- **Winston**: Logging framework

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Kubernetes**: Container orchestration platform
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards
- **Jaeger**: Distributed tracing

### External APIs
- **Google Gemini**: AI-powered analysis
- **VirusTotal**: Malware detection
- **ScamAdviser**: Website reputation
- **ScreenshotLayer**: Website screenshots
- **NewsAPI**: News aggregation

---

## 📚 Additional Documentation

- **Architecture**: [MICROSERVICES_ARCHITECTURE.md](MICROSERVICES_ARCHITECTURE.md)
- **Individual Services**: Check `services/[service-name]/README.md`
- **Deployment Scripts**: [scripts/README.md](scripts/README.md)
- **Kubernetes Manifests**: [k8s/README.md](k8s/README.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)

---

**🎉 You now have a fully functional microservices-based Anti-Fraud Platform with multiple deployment options!**

Choose the deployment method that best fits your needs:
- **Local Development**: Fast iteration and debugging
- **Docker**: Production-like environment with easy setup
- **Kubernetes**: Scalable production deployment with high availability
