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

## 🚀 Quick Start for Localhost

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for development)
- **Firebase account** (for authentication)

### Option 1: Docker Deployment (Recommended) ⭐

1. **Clone the repository:**
```bash
git clone <repository-url>
cd anti-fraud-platform
```

2. **Deploy all microservices:**
```bash
# Make scripts executable (Linux/Mac)
chmod +x scripts/*.sh

# Deploy all services with Docker
./scripts/deploy-microservices.sh
```

3. **Access the application:**
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Monitoring**: http://localhost:9090 (Prometheus)
- **Grafana**: http://localhost:3007 (admin/admin)

### Option 2: Manual Development Setup

1. **Install dependencies for each service:**
```bash
# Auth Service
cd services/auth-service && npm install

# Link Service
cd ../link-service && npm install

# Community Service
cd ../community-service && npm install

# Chat Service
cd ../chat-service && npm install

# News Service
cd ../news-service && npm install

# Admin Service
cd ../admin-service && npm install

# API Gateway
cd ../api-gateway && npm install

# Frontend
cd ../../client && npm install
```

2. **Start services individually:**
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

## 🔧 Environment Configuration

The deployment script will create a `.env` file automatically. You can customize it with your API keys:

```env
# Service Configuration
NODE_ENV=development

# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# API Keys (Optional - will use mock data if not provided)
GEMINI_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
VIRUSTOTAL_API_KEY=your-virustotal-key
SCAMADVISER_API_KEY=your-scamadviser-key
SCREENSHOTLAYER_API_KEY=your-screenshot-key
NEWSAPI_API_KEY=your-newsapi-key

# Service URLs (Auto-configured for Docker)
AUTH_SERVICE_URL=http://auth-service:3001
LINK_SERVICE_URL=http://link-service:3002
COMMUNITY_SERVICE_URL=http://community-service:3003
CHAT_SERVICE_URL=http://chat-service:3004
NEWS_SERVICE_URL=http://news-service:3005
ADMIN_SERVICE_URL=http://admin-service:3006

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# React App Configuration
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8
```

## 📊 Service Health Monitoring

After deployment, check service health:

```bash
# Check all services status
curl http://localhost:8080/services/status

# Check individual service health
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Link Service
curl http://localhost:3003/health  # Community Service
curl http://localhost:3004/health  # Chat Service
curl http://localhost:3005/health  # News Service
curl http://localhost:3006/health  # Admin Service
```

## 🛠️ Management Commands

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

## 🚀 Production Deployment

### Kubernetes
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment
kubectl get pods -n anti-fraud-platform
```

### Docker Swarm
```bash
# Deploy to Docker Swarm
docker stack deploy -c docker-compose.microservices.yml anti-fraud
```

## 📈 Monitoring & Observability

- **Prometheus**: http://localhost:9090 - Metrics collection
- **Grafana**: http://localhost:3007 - Visualization (admin/admin)
- **Jaeger**: http://localhost:16686 - Distributed tracing

## 🆘 Troubleshooting

### Common Issues

1. **Services not starting**: Check Docker is running and ports are available
2. **Authentication errors**: Verify Firebase configuration in `.env`
3. **API errors**: Check service logs with `docker-compose logs [service-name]`
4. **Frontend not loading**: Ensure API Gateway is running on port 8080

### Debug Commands

```bash
# Check Docker containers
docker ps

# Check service logs
docker-compose -f docker-compose.microservices.yml logs [service-name]

# Check network connectivity
docker network ls
docker network inspect anti-fraud-platform_microservices-network
```

## 📚 Documentation

- **Architecture**: [MICROSERVICES_ARCHITECTURE.md](MICROSERVICES_ARCHITECTURE.md)
- **Individual Services**: Check `services/[service-name]/README.md`
- **Deployment**: [scripts/README.md](scripts/README.md)

## 🛠️ Technology Stack

### **Frontend**
- **React 18**: Modern UI framework with hooks
- **TailwindCSS**: Utility-first CSS framework
- **GSAP**: Professional animations and interactions
- **Axios**: HTTP client for API calls

### **Backend (Microservices)**
- **Node.js 18**: JavaScript runtime
- **Express.js**: Web application framework
- **Firebase/Firestore**: NoSQL database
- **JWT**: Authentication tokens
- **Winston**: Logging framework

### **Infrastructure**
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards
- **Jaeger**: Distributed tracing

### **External APIs**
- **Google Gemini**: AI-powered analysis
- **VirusTotal**: Malware detection
- **ScamAdviser**: Website reputation
- **ScreenshotLayer**: Website screenshots
- **NewsAPI**: News aggregation

---

**🎉 You now have a fully functional microservices-based Anti-Fraud Platform!**
