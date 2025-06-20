# 🚀 Quick Deploy Guide

## One-Command Deployment

Just pull the source and run - works on any machine!

```bash
# Clone the repository
git clone https://github.com/VinkRasengan/backup.git
cd backup

# Quick start (cross-platform)
npm run quick-start
```

That's it! The system will automatically:
- ✅ Check prerequisites (Node.js, Docker, etc.)
- ✅ Set up environment files
- ✅ Install all dependencies
- ✅ Validate port configuration
- ✅ Build Docker images
- ✅ Start all services

## 🌐 Access Points

After deployment:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## 🛑 Stop Services

```bash
npm run quick-stop
```

## 📋 Service Architecture

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| API Gateway | 8080 | Main entry point |
| Auth Service | 3001 | Authentication & users |
| Link Service | 3002 | URL analysis & security |
| Community Service | 3003 | Posts, comments, votes |
| Chat Service | 3004 | AI chat & conversations |
| News Service | 3005 | News aggregation |
| Admin Service | 3006 | Admin dashboard |
| PhishTank Service | 3007 | PhishTank integration |
| CriminalIP Service | 3008 | CriminalIP integration |
| Redis | 6379 | Caching & sessions |

## 🔧 Manual Setup (if needed)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# At minimum, set Firebase configuration
```

### Alternative Start Methods

#### Docker Development Mode
```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### Local Development Mode
```bash
npm start
```

#### Production Mode
```bash
docker-compose -f docker-compose.microservices.yml up -d
```

## 🔍 Health Checks

Check if all services are running:
```bash
npm run status
```

Individual service health:
```bash
curl http://localhost:8080/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Link Service
# ... etc
```

## 🧪 Testing

Run all tests:
```bash
npm test
```

Test specific services:
```bash
npm run test:api-gateway
npm run test:auth
npm run test:community
# ... etc
```

## 🐛 Troubleshooting

### Port Conflicts
```bash
npm run fix-ports
```

### Clean Restart
```bash
npm run quick-stop
npm run quick-start
```

### Docker Issues
```bash
docker system prune -f
docker-compose down
docker-compose up --build
```

### Check Logs
```bash
docker-compose logs -f
```

## 📚 Additional Documentation

- [Full README](README.md) - Complete documentation
- [API Documentation](docs/) - API endpoints and usage
- [Deployment Guide](docs/deployment/) - Advanced deployment options
- [Architecture Overview](docs/system-architecture-overview.puml) - System design

## 🆘 Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify prerequisites: `node --version`, `docker --version`
3. Clean restart: `npm run quick-stop && npm run quick-start`
4. Check port availability: `npm run status`

## 🔄 CI/CD

The project includes GitHub Actions workflows for:
- ✅ Automated testing on push/PR
- ✅ Docker image building
- ✅ Cross-platform compatibility
- ✅ Security scanning
- ✅ Performance testing

All CI/CD paths are standardized and work across different environments.
