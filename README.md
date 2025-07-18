# FactCheck Platform

A comprehensive microservices-based platform for link verification, community discussions, and AI-powered fact-checking.

## 🚀 Quick Start for New Developers

**🎯 CRITICAL: Only 3 steps needed!**

```bash
# 1. Clone repository
git clone https://github.com/VinkRasengan/backup.git
cd backup

# 2. Create .env file
cp .env.example .env
# Edit .env with your Firebase credentials

# 3. Run complete setup and start
npm run setup:full
npm start
```

**✅ This exact workflow is tested in CI/CD on multiple platforms**

Then open http://localhost:3000

### 🔧 Validation Commands

```bash
npm run env:validate     # Validate environment configuration
npm run test:new-dev     # Test new developer experience
npm run test:workflow    # Test complete workflow
npm run test:render      # Test Render deployment readiness
npm run test:all         # Run all tests
```

### ⚠️ Important Configuration Notes

- **NO localhost in production**: Use actual service URLs or service names
- **Docker/K8s**: Use service names (e.g., `http://auth-service:3001`)
- **Always validate**: Run `npm run env:validate` before deployment
- **CI/CD tested**: New developer workflow tested on Ubuntu, Windows, macOS

## 📋 Requirements

- Node.js 18+, npm 9+
- Firebase account (free)
- Gemini AI API key (free)

## 🎯 Full Development Setup

### Local Development

1. **Clone and Setup**
   ```bash
   git clone https://github.com/VinkRasengan/backup.git
   cd backup
   npm run setup  # Handles everything automatically
   ```

2. **Configure Environment**
   ```bash
   # .env file is auto-created, just add your credentials:
   # Firebase: Get from Firebase Console > Project Settings > Service Accounts
   # Gemini: Get from https://makersuite.google.com/app/apikey
   ```

3. **Start Development**
   ```bash
   npm start     # Start all services
   npm stop      # Stop all services
   npm restart   # Restart everything
   ```

### Production Deployment (Render)

1. **Deploy API Gateway**
   - Service Type: Web Service
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: See [Environment Variables](#environment-variables)

2. **Deploy Frontend**
   - Service Type: Static Site
   - Build Command: `npm run build`
   - Publish Directory: `build`

## 🏗️ Architecture

### Microservices

- **API Gateway** (Port 8080) - Central routing and load balancing
- **Auth Service** (Port 3001) - User authentication and authorization
- **Link Service** (Port 3002) - URL analysis and verification
- **Community Service** (Port 3003) - Posts, comments, and voting
- **Chat Service** (Port 3004) - AI-powered chat interface
- **News Service** (Port 3005) - News aggregation and analysis
- **Admin Service** (Port 3006) - Administrative functions

### Frontend

- **React Application** - Modern responsive UI with TailwindCSS
- **Firebase Auth** - User authentication
- **Real-time Updates** - Live data synchronization

## 🔧 Environment Variables

### ⚠️ Critical Configuration Rules

1. **NO localhost in production** - Use actual URLs or service names
2. **Docker/K8s** - Use service names: `http://service-name:port`
3. **Always validate** - Run `node scripts/validate-env-config.js`

### Configuration by Environment

#### 🏠 Local Development
```env
AUTH_SERVICE_URL=http://localhost:3001
REACT_APP_API_URL=http://localhost:8080
```

#### 🐳 Docker/Docker-Compose
```env
AUTH_SERVICE_URL=http://auth-service:3001
REACT_APP_API_URL=http://api-gateway:8080
```

#### ☸️ Kubernetes
```env
AUTH_SERVICE_URL=http://auth-service:3001
REACT_APP_API_URL=http://api-gateway:8080
```

#### 🚀 Production (Render/Cloud)
```env
AUTH_SERVICE_URL=https://your-auth-service.onrender.com
REACT_APP_API_URL=https://your-api-gateway.onrender.com
```

### Required Variables (All Environments)
```env
# Firebase (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key

# Security (Required)
JWT_SECRET=your-jwt-secret-32-chars-minimum

# API Keys (Optional)
GEMINI_API_KEY=your-gemini-api-key
```

**📖 See [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md) for complete configuration guide**

## 🚀 CI/CD & Deployment

### Comprehensive CI/CD Testing

Our CI/CD pipeline tests both new developer experience and individual service deployment:

#### 🆕 New Developer Workflow Testing
- **Multi-platform**: Ubuntu, Windows, macOS
- **Multi-version**: Node.js 18, 20
- **Complete workflow**: .env → npm run setup:full → npm start
- **Automated validation**: Environment, dependencies, service startup

#### 🐳 Individual Service Deployment Testing
- **Render-ready**: Each service tested for individual deployment
- **Docker validation**: All Dockerfiles built and tested
- **Environment validation**: Production environment variables
- **Service isolation**: Each microservice deploys independently

### Render Deployment

#### Individual Service Deployment
Each service in `services/[service-name]/` can be deployed individually:

1. **Create Web Service** on Render
2. **Repository**: `https://github.com/VinkRasengan/backup`
3. **Root Directory**: `services/[service-name]`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`

#### Client Deployment
Deploy React client as static site:

1. **Create Static Site** on Render
2. **Root Directory**: `client`
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `build`

### CI/CD Workflows

- **`.github/workflows/comprehensive-ci-cd.yml`**: Complete testing pipeline
- **Daily validation**: Automated testing to catch environment drift
- **PR validation**: Automatic testing of changes
- **Multi-platform support**: Ensures consistency across development environments

### Testing Commands

```bash
npm run test:new-dev     # Test new developer experience
npm run test:render      # Test Render deployment readiness
npm run test:workflow    # Test complete workflow
npm run test:all         # Run all CI/CD tests locally
```

## 📚 Documentation

- [Security Guide](docs/SECURITY.md)
- [Maintenance Guide](docs/MAINTENANCE.md)
- [Performance Guide](docs/PERFORMANCE.md)
- [Usage Guide](docs/USAGE-GUIDE.md)
- [Deployment Checklist](docs/RENDER_DEPLOYMENT_CHECKLIST.md)

## 🛠️ Development

### Available Scripts

#### Core Development
- `npm start` - Start all services (cross-platform)
- `npm run dev` - Start all services in development mode
- `npm stop` - Stop all services
- `npm restart` - Restart all services
- `npm run status` - Check service status

#### Setup & Installation
- `npm run setup` - Install dependencies and setup environment
- `npm run setup:full` - Complete setup with validation
- `npm run env:setup` - Setup environment variables
- `npm run generate:jwt` - Generate JWT secret

#### Testing
- `npm test` - Run all tests
- `npm run test:services` - Test all microservices
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests

#### Deployment
- `npm run deploy` - Deploy with Docker
- `npm run deploy:render` - Deploy to Render
- `npm run deploy:k8s` - Deploy to Kubernetes

#### Monitoring & Production
- `npm run health:production` - Check production health
- `npm run dashboard:production` - Open production dashboard
- `npm run monitoring:start` - Start monitoring stack

### Project Structure

```
├── client/                 # React frontend
├── services/              # Microservices
│   ├── api-gateway/       # API Gateway
│   ├── auth-service/      # Authentication
│   ├── link-service/      # Link verification
│   ├── community-service/ # Community features
│   ├── chat-service/      # AI Chat
│   ├── news-service/      # News aggregation
│   └── admin-service/     # Admin panel
├── docs/                  # Documentation
├── scripts/               # Utility scripts
└── k8s/                   # Kubernetes configs
```

## 🔒 Security

- JWT-based authentication
- Firebase security rules
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention

## 🚀 Features

- **Link Verification** - Multi-source security analysis
- **Community Discussions** - Reddit-style voting and comments
- **AI Chat** - Powered by Google Gemini
- **Real-time Updates** - Live data synchronization
- **Admin Dashboard** - Comprehensive management tools
- **Mobile Responsive** - Works on all devices

## 📊 Monitoring

- Health checks for all services
- Performance monitoring
- Error tracking
- Real-time metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please check the documentation in the `docs/` folder or create an issue.
