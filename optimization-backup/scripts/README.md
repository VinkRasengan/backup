# 🚀 Deployment Scripts - Anti-Fraud Platform

This directory contains deployment scripts for the Anti-Fraud Platform that work across Windows, macOS, and Linux.

## 📋 Available Scripts

### 🎯 Universal Deployment Script
```bash
# Universal deployment interface
bash scripts/deploy.sh [METHOD]

# Available methods:
bash scripts/deploy.sh local      # Local development (recommended)
bash scripts/deploy.sh docker     # Docker containers
bash scripts/deploy.sh k8s        # Kubernetes cluster
bash scripts/deploy.sh stop       # Stop all services
bash scripts/deploy.sh status     # Check service status
bash scripts/deploy.sh help       # Show help
```

### 🏠 Local Deployment (Recommended for Development)
```bash
# Deploy locally without Docker
bash scripts/deploy-local-fixed.sh

# Or use universal script
bash scripts/deploy.sh local
```

**Features:**
- ✅ Windows compatible (Git Bash)
- ✅ Automatic port detection and cleanup
- ✅ Dependency installation
- ✅ Health checks for all services
- ✅ Cross-platform process management

### 🐳 Docker Deployment
```bash
# Deploy using Docker Compose
bash scripts/deploy-docker.sh

# Or use universal script
bash scripts/deploy.sh docker

# Test when Docker Desktop is ready
bash scripts/test-docker-deployment.sh
```

**Features:**
- ✅ Fixed build context for current project structure
- ✅ Proper shared folder mounting
- ✅ Health checks for containers
- ✅ Redis caching included
- ✅ Production-ready configuration

### ☸️ Kubernetes Deployment
```bash
# Deploy to Kubernetes cluster
bash scripts/deploy-k8s.sh

# Or use universal script
bash scripts/deploy.sh k8s
```

**Features:**
- ✅ Automatic image building
- ✅ Secret management from .env
- ✅ Service discovery
- ✅ Horizontal pod autoscaling
- ✅ Production-grade deployment

### 🛑 Stop All Services
```bash
# Stop all services (local, Docker, K8s)
bash scripts/stop-all.sh

# Or use universal script
bash scripts/deploy.sh stop
```

**Features:**
- ✅ Windows compatible process killing
- ✅ Stops Docker containers
- ✅ Cleans up Kubernetes deployments
- ✅ Frees up ports automatically

## 🔧 Prerequisites

### For Local Deployment:
- Node.js 16+ 
- npm 7+
- Git Bash (Windows) or Terminal (macOS/Linux)

### For Docker Deployment:
- Docker Desktop
- Docker Compose (included with Docker Desktop)

### For Kubernetes Deployment:
- kubectl configured with cluster access
- Docker for building images

## 📁 Project Structure

The scripts expect this project structure:
```
project-root/
├── package.json
├── .env
├── services/
│   ├── auth-service/
│   ├── api-gateway/
│   ├── link-service/
│   ├── community-service/
│   ├── chat-service/
│   ├── news-service/
│   └── admin-service/
├── client/
├── shared/
└── scripts/
```

## 🌐 Service URLs

After successful deployment:

| Service | Local Port | Docker Port | Description |
|---------|------------|-------------|-------------|
| Frontend | 3000 | 3000 | React application |
| API Gateway | 8082 | 8080 | Main API endpoint |
| Auth Service | 3001 | 3001 | Authentication |
| Link Service | 3002 | 3002 | Link verification |
| News Service | 3003 | 3003 | News aggregation |
| Chat Service | 3004 | 3004 | AI chat |
| Community | 3005 | 3005 | User community |
| Admin Service | 3006 | 3006 | Administration |
| Redis | - | 6379 | Caching (Docker only) |

## 🔍 Troubleshooting

### Common Issues:

1. **Port conflicts:**
   ```bash
   # Check what's using ports
   netstat -ano | findstr :3000  # Windows
   lsof -i :3000                 # macOS/Linux
   
   # Use stop script to clean up
   bash scripts/stop-all.sh
   ```

2. **Docker not starting:**
   ```bash
   # Check Docker status
   docker info
   
   # Start Docker Desktop manually
   # Then use test script
   bash scripts/test-docker-deployment.sh
   ```

3. **Module not found errors:**
   ```bash
   # Reinstall dependencies
   npm run install:all
   
   # Or manually
   npm install
   cd client && npm install && cd ..
   ```

4. **Permission errors (Linux/macOS):**
   ```bash
   # Make scripts executable
   chmod +x scripts/*.sh
   ```

### Health Checks:

```bash
# Check service status
bash scripts/deploy.sh status

# Check individual services
curl http://localhost:8082/health      # API Gateway
curl http://localhost:3001/health/live # Auth Service
curl http://localhost:3000             # Frontend
```

### Logs:

```bash
# Local deployment logs
npm run logs  # If available

# Docker logs
docker-compose logs -f [service-name]
docker-compose logs -f  # All services

# Kubernetes logs
kubectl logs -f deployment/auth-service -n anti-fraud-platform
```

## 🚀 Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repository>
   cd anti-fraud-platform
   ```

2. **Configure environment:**
   ```bash
   # Copy and edit .env file
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

3. **Deploy locally (recommended for development):**
   ```bash
   bash scripts/deploy.sh local
   ```

4. **Access application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8082

5. **Stop when done:**
   ```bash
   bash scripts/deploy.sh stop
   ```

## 📝 Notes

- All scripts are designed to work on Windows (Git Bash), macOS, and Linux
- Local deployment is recommended for development
- Docker deployment is recommended for testing
- Kubernetes deployment is recommended for production
- Always configure Firebase credentials in .env before deployment
- Use the universal `deploy.sh` script for the best experience
