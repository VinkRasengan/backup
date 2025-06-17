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

Before deploying, ensure you have the appropriate tools for your chosen deployment method:

### For All Deployments
- **Git** (for cloning repository)
- **Firebase account** (for authentication and database)

### For Local Deployment (Method 1)
- **Node.js 18+** and **npm**

### For Docker Deployment (Method 2)
- **Docker Desktop** or **Docker Engine**
- **Docker Compose**

### For Kubernetes Deployment (Method 3)
- **kubectl** (Kubernetes CLI)
- **Access to a Kubernetes cluster** (local, cloud, or managed)
- **Docker** (for building images, optional)

## 🚀 Quick Start - Choose Your Deployment Method

We provide **three simple deployment methods** that work on any machine or device:

| Method | Best For | Command | Time to Deploy |
|--------|----------|---------|----------------|
| **🖥️ Local** | Development, debugging | `./scripts/deploy-local.sh` | ~5 minutes |
| **🐳 Docker** | Production-like environment | `./scripts/deploy-docker.sh` | ~10 minutes |
| **☸️ Kubernetes** | Scalable production | `./scripts/deploy-k8s.sh` | ~15 minutes |

---

## 📦 Method 1: Local Deployment (No Docker)

**Best for**: Development, debugging, and testing individual services.

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd anti-fraud-platform

# Run the deployment script
./scripts/deploy-local.sh

# For Windows users
scripts\deploy-local.bat
```

### Manual Steps (if needed)

#### Step 1: Install Dependencies

```bash
# Install all dependencies
npm run install:all
```

#### Step 2: Configure Environment

The deployment script will create a `.env` file automatically. Edit it with your configuration:

```env
# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# API Keys (Optional)
GEMINI_API_KEY=your-gemini-api-key
VIRUSTOTAL_API_KEY=your-virustotal-api-key
```

#### Step 3: Start Services

```bash
# Start all services
npm start

# Or start individual services for debugging
npm run dev:services
```

#### Step 4: Access Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Individual Services**: http://localhost:300X (where X is service port)

#### Stop Services

```bash
# Stop all services
./scripts/stop-local.sh

# For Windows
scripts\stop-local.bat
```

---

## 🐳 Method 2: Docker Deployment

**Best for**: Production-like environment, easy setup, and consistent deployment across all platforms.

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd anti-fraud-platform

# Run the deployment script
./scripts/deploy-docker.sh

# For Windows users
scripts\deploy-docker.bat
```

### Manual Steps (if needed)

#### Step 1: Install Docker

- **Windows/Mac**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Install Docker Engine and Docker Compose

#### Step 2: Configure Environment

The deployment script will create a `.env` file automatically. Edit it with your configuration:

```env
# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# API Keys (Optional)
GEMINI_API_KEY=your-gemini-api-key
VIRUSTOTAL_API_KEY=your-virustotal-api-key
```

#### Step 3: Deploy Services

```bash
# Build and start all services
docker-compose up --build -d

# Check container status
docker ps
```

#### Step 4: Access Application

- **Frontend**: <http://localhost:3000>
- **API Gateway**: <http://localhost:8080>
- **Redis**: <http://localhost:6379>

#### Management Commands

```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f auth-service

# Restart specific service
docker-compose restart auth-service

# Stop all services
./scripts/stop-docker.sh

# Scale specific service
docker-compose up --scale auth-service=3 -d
```

---

## ☸️ Method 3: Kubernetes Deployment

**Best for**: Production environments, high availability, and auto-scaling.

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd anti-fraud-platform

# Run the deployment script
./scripts/deploy-k8s.sh

# For Windows users
scripts\deploy-k8s.bat
```

### Manual Steps (if needed)

#### Step 1: Install Prerequisites

- **kubectl**: [Install kubectl](https://kubernetes.io/docs/tasks/tools/)
- **Kubernetes cluster**: Local (minikube, kind) or cloud (GKE, EKS, AKS)
- **Docker** (optional, for building images)

#### Step 2: Configure Environment

The deployment script will create a `.env` file automatically. Edit it with your configuration:

```env
# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# API Keys (Optional)
GEMINI_API_KEY=your-gemini-api-key
VIRUSTOTAL_API_KEY=your-virustotal-api-key
```

#### Step 3: Deploy Services

```bash
# Create namespace
kubectl apply -f k8s/namespace.yml

# Create secrets and config
kubectl apply -f k8s/configmap.yml

# Deploy all services
kubectl apply -f k8s/
```

#### Step 4: Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n anti-fraud-platform

# Check services
kubectl get services -n anti-fraud-platform

# Check deployment status
kubectl get deployments -n anti-fraud-platform
```

#### Step 5: Access Application

```bash
# Port forward to access locally
kubectl port-forward service/api-gateway 8080:8080 -n anti-fraud-platform
kubectl port-forward service/frontend 3000:3000 -n anti-fraud-platform

# Or get LoadBalancer IPs (if supported)
kubectl get services -n anti-fraud-platform
```

#### Management Commands

```bash
# View logs for specific service
kubectl logs -f deployment/auth-service -n anti-fraud-platform

# Scale deployment
kubectl scale deployment auth-service --replicas=3 -n anti-fraud-platform

# Update deployment
kubectl rollout restart deployment/auth-service -n anti-fraud-platform

# Stop all services
./scripts/stop-k8s.sh

# Delete all resources
kubectl delete namespace anti-fraud-platform
```

---

## 🔧 Environment Configuration

All deployment scripts automatically create a `.env` file template. You need to edit it with your actual credentials:

### Required Configuration

```env
# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# API Keys (Optional - will use mock data if not provided)
GEMINI_API_KEY=your-gemini-api-key
VIRUSTOTAL_API_KEY=your-virustotal-api-key
SCAMADVISER_API_KEY=your-scamadviser-api-key
SCREENSHOTLAYER_API_KEY=your-screenshotlayer-api-key
NEWSAPI_API_KEY=your-newsapi-api-key

# React App Configuration
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=your-firebase-web-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

### Getting API Keys

1. **Firebase**: Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts
2. **Gemini AI**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **VirusTotal**: Register at [VirusTotal](https://www.virustotal.com/gui/join-us)
4. **ScamAdviser**: Contact [ScamAdviser API](https://www.scamadviser.com/api)
5. **ScreenshotLayer**: Sign up at [ScreenshotLayer](https://screenshotlayer.com/)
6. **NewsAPI**: Register at [NewsAPI](https://newsapi.org/register)

---

## 🆘 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Port conflicts** | Use deployment scripts - they automatically handle port conflicts |
| **Docker not starting** | Ensure Docker Desktop is running |
| **Kubernetes connection failed** | Check `kubectl cluster-info` |
| **Firebase connection error** | Verify Firebase credentials in `.env` file |
| **Services not responding** | Wait 30-60 seconds for services to fully start |

### Quick Fixes

```bash
# Check service health
curl http://localhost:8080/services/status

# View logs (Docker)
docker-compose logs -f [service-name]

# View logs (Kubernetes)
kubectl logs -f deployment/[service-name] -n anti-fraud-platform

# Restart services (Local)
./scripts/stop-local.sh && ./scripts/deploy-local.sh

# Restart services (Docker)
docker-compose restart [service-name]

# Restart services (Kubernetes)
kubectl rollout restart deployment/[service-name] -n anti-fraud-platform
```

### Getting Help

If you encounter issues:

1. **Check the logs** using the commands above
2. **Verify your `.env` file** has correct Firebase credentials
3. **Ensure all prerequisites** are installed for your deployment method
4. **Wait for services to start** - initial startup can take 1-2 minutes

---

## 📊 Service Health Monitoring

After deployment, verify all services are running:

```bash
# Check all services status
curl http://localhost:8080/services/status

# Check individual services
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Link Service
curl http://localhost:3003/health  # Community Service
curl http://localhost:3004/health  # Chat Service
curl http://localhost:3005/health  # News Service
curl http://localhost:3006/health  # Admin Service
```

---

## 🔗 API Endpoints

### API Gateway
- `GET /health` - Gateway health
- `GET /services/status` - All services status
- `GET /info` - Gateway information

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /users/profile` - Get user profile

### Link Verification
- `POST /links/check` - Check single link
- `POST /links/bulk-check` - Check multiple links
- `GET /links/history` - User's check history

### Community
- `GET /community/posts` - Get community posts
- `POST /community/posts` - Create new post
- `POST /community/posts/:id/comments` - Add comment

### Chat
- `POST /chat/message` - Send chat message
- `GET /conversations` - Get conversations

### News
- `GET /news/feed` - Get news feed
- `GET /news/trending` - Get trending news

### Admin
- `GET /admin/dashboard` - Admin dashboard data
- `GET /admin/users` - User management

---

## 📚 Quick Reference

### Deployment Commands Summary

| Method | Command | Access | Time |
|--------|---------|--------|------|
| **Local** | `./scripts/deploy-local.sh` | <http://localhost:3000> | ~5 min |
| **Docker** | `./scripts/deploy-docker.sh` | <http://localhost:3000> | ~10 min |
| **Kubernetes** | `./scripts/deploy-k8s.sh` | Port-forward or LoadBalancer | ~15 min |

### Stop Commands

| Method | Command |
|--------|---------|
| **Local** | `./scripts/stop-local.sh` |
| **Docker** | `./scripts/stop-docker.sh` |
| **Kubernetes** | `./scripts/stop-k8s.sh` |

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Auth | 3001 | Authentication service |
| Link | 3002 | Link verification service |
| Community | 3003 | Community posts and comments |
| Chat | 3004 | AI chat service |
| News | 3005 | News aggregation service |
| Admin | 3006 | Admin dashboard service |
| API Gateway | 8080 | Central API gateway |
| Redis | 6379 | Caching and sessions |

### Essential Commands

```bash
# Health checks
curl http://localhost:8080/services/status

# View logs (Docker)
docker-compose logs -f [service-name]

# View logs (Kubernetes)
kubectl logs -f deployment/[service-name] -n anti-fraud-platform

# Scale services (Kubernetes)
kubectl scale deployment [service-name] --replicas=3 -n anti-fraud-platform
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
- **Redis**: Caching and session storage

### External APIs
- **Google Gemini**: AI-powered analysis
- **VirusTotal**: Malware detection
- **ScamAdviser**: Website reputation
- **ScreenshotLayer**: Website screenshots
- **NewsAPI**: News aggregation

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

If you encounter any issues:

1. **Check the troubleshooting section** above
2. **Review the logs** using the provided commands
3. **Verify your environment configuration**
4. **Create an issue** with detailed error information

---

**🎉 You now have a fully functional microservices-based Anti-Fraud Platform!**

Choose the deployment method that best fits your needs:

- **🖥️ Local Development**: Fast iteration and debugging with `./scripts/deploy-local.sh`
- **🐳 Docker**: Production-like environment with `./scripts/deploy-docker.sh`
- **☸️ Kubernetes**: Scalable production deployment with `./scripts/deploy-k8s.sh`

All deployment methods work on **Windows**, **macOS**, and **Linux** with simple one-command deployment!
