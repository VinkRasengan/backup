# 🛡️ Anti-Fraud Platform

A comprehensive microservices-based platform for detecting and preventing online fraud, fake news, and malicious links.

## 🚀 Quick Start

### Local Development
```bash
# First time setup
npm run setup

# Start all services
npm start

# Check status
npm run status

# Stop all services
npm stop
```

### 🐳 Production Deployment (Render Docker)
```bash
# Run deployment helper
.\deploy-render-docker.ps1

# Follow the step-by-step guide
# See: RENDER_DOCKER_DEPLOYMENT_GUIDE.md
```

## 📚 Documentation

### 📖 Deployment Guides
- **[Render Docker Deployment Guide](RENDER_DOCKER_DEPLOYMENT_GUIDE.md)** - Complete step-by-step deployment
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Track your deployment progress  
- **[Quick Reference](RENDER_QUICK_REFERENCE.md)** - Copy-paste configurations
- **[Docker Instructions](RENDER_DOCKER_INSTRUCTIONS.md)** - Technical Docker details

### 🛠️ Development Docs
- **[API Documentation](docs/)** - API endpoints and usage
- **[Architecture Guide](docs/architecture.md)** - System architecture overview
- **[Security Guide](SECURITY.md)** - Security best practices

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Complete setup and installation |
| `npm start` | Start all services locally |
| `npm run dev` | Start in development mode |
| `npm stop` | Stop all services |
| `npm restart` | Restart all services |
| `npm run status` | Check service status |
| `npm run health` | Health check all services |
| `npm test` | Run all tests |
| `npm run docker` | Deploy with Docker |
| `npm run deploy:k8s` | Deploy to Kubernetes |
| `npm run help` | Show help information |

## 🏗️ Architecture

### Core Services
- **Frontend** (3000) - React web interface
- **API Gateway** (8080) - Single entry point for all requests
- **Auth Service** (3001) - User authentication and authorization
- **Link Service** (3002) - URL verification and security analysis
- **Community Service** (3003) - Posts, comments, and community features
- **Chat Service** (3004) - Real-time messaging and AI chat
- **News Service** (3005) - News aggregation and fact-checking
- **Admin Service** (3006) - Administrative dashboard

### Infrastructure
- **Redis** (6379) - Caching and session storage
- **Prometheus** (9090) - Metrics collection
- **Grafana** (3010) - Monitoring dashboards

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Core Configuration
NODE_ENV=development
REACT_APP_API_URL=http://localhost:8080

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"

# API Keys (Optional)
GEMINI_API_KEY=your-gemini-api-key
VIRUSTOTAL_API_KEY=your-virustotal-api-key
NEWSAPI_API_KEY=your-newsapi-api-key
```

### Service URLs
```bash
AUTH_SERVICE_URL=http://localhost:3001
LINK_SERVICE_URL=http://localhost:3002
COMMUNITY_SERVICE_URL=http://localhost:3003
CHAT_SERVICE_URL=http://localhost:3004
NEWS_SERVICE_URL=http://localhost:3005
ADMIN_SERVICE_URL=http://localhost:3006
```

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3010

## 🔍 Features

### Link Verification
- Real-time URL security analysis
- Multiple security API integrations
- Threat detection and scoring
- Historical scan results

### Community Platform
- User-generated content sharing
- Voting and commenting system
- Fact-checking collaboration
- Community moderation

### AI-Powered Chat
- Google Gemini AI integration
- Real-time assistance
- Security recommendations
- Educational content

### News Monitoring
- Automated news aggregation
- Fact-checking alerts
- Trending topic analysis
- Source credibility scoring

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (optional)
- Git

### Local Development
```bash
# Clone repository
git clone <repository-url>
cd anti-fraud-platform

# Install dependencies
npm run setup

# Start development environment
npm run dev

# Run tests
npm test
```

### Docker Deployment
```bash
# Build and start with Docker
npm run docker

# Stop Docker services
npm run docker:stop
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes
npm run deploy:k8s

# Check deployment status
kubectl get pods -n anti-fraud-platform
```

## 📊 Monitoring

### Health Checks
- Service health endpoints: `/health/live` and `/health/ready`
- Prometheus metrics: `/metrics`
- Status dashboard: `npm run status`

### Logging
- Centralized logging with correlation IDs
- Error tracking and alerting
- Performance monitoring

## 🔒 Security

### Authentication
- Firebase Authentication integration
- JWT token management
- Role-based access control

### API Security
- Rate limiting
- CORS configuration
- Input validation
- Security headers

### Data Protection
- Encrypted data transmission
- Secure API key management
- Privacy compliance

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific service tests
npm run test:auth
npm run test:link
npm run test:community

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Link Verification Endpoints
- `POST /api/links/check` - Verify URL security
- `GET /api/links/history` - Get scan history
- `POST /api/links/report` - Report malicious link

### Community Endpoints
- `GET /api/community/posts` - Get community posts
- `POST /api/community/posts` - Create new post
- `POST /api/community/vote` - Vote on post

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Run `npm run help`
- Create an issue on GitHub

---

**Built with ❤️ for a safer internet**