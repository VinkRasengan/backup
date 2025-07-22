# FactCheck Platform

A production-ready microservices platform for real-time link verification, community-driven fact-checking, and AI-powered content analysis.

## 🏗️ Architecture Overview

**Enterprise-grade microservices architecture** with complete service independence and scalability:

- **API Gateway** (Port 8080) - Request routing, rate limiting, authentication
- **Auth Service** (Port 3001) - JWT authentication, user management
- **Link Service** (Port 3002) - URL analysis, threat detection, security scanning
- **Community Service** (Port 3003) - User posts, discussions, content moderation
- **Chat Service** (Port 3004) - AI-powered assistance with Gemini integration
- **News Service** (Port 3005) - News aggregation, fact-checking workflows
- **Admin Service** (Port 3006) - Administrative dashboard, user management
- **Client Application** (Port 3000) - React frontend with modern UI/UX

## 🛠️ Tech Stack

### **Backend Services**
- **Runtime**: Node.js 18+ with Express.js
- **Authentication**: Firebase Auth + JWT tokens
- **Database**: Firebase Firestore (NoSQL)
- **Caching**: Redis for session management and caching
- **Event Sourcing**: KurrentDB for event streaming
- **API Security**: Helmet, CORS, rate limiting
- **Monitoring**: Health checks, logging, metrics

### **Frontend**
- **Framework**: React 18 with modern hooks
- **Styling**: CSS3, responsive design
- **State Management**: React Context + hooks
- **HTTP Client**: Axios for API communication
- **Authentication**: Firebase Auth SDK

### **External Integrations**
- **AI**: Google Gemini API for intelligent responses
- **Security**: VirusTotal, ScamAdviser, IPQualityScore APIs
- **News**: NewsAPI, NewsData for content aggregation
- **Screenshots**: ScreenshotLayer for visual analysis

### **DevOps & Infrastructure**
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **CI/CD**: GitHub Actions with automated testing
- **Deployment**: Render.com for production hosting
- **Monitoring**: Health checks, logging, error tracking

## 🚀 Quick Start for Developers

### **Prerequisites**
- **Node.js** 18+ and npm 9+
- **Docker** and Docker Compose (for local development)
- **Firebase** project (free tier available)
- **API Keys** for external services (optional for basic functionality)

### **Local Development Setup**

1. **Clone and Install**
```bash
git clone https://github.com/VinkRasengan/backup.git
cd backup
npm install
```

2. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Configure required variables in .env:
# - Firebase credentials (project ID, service account)
# - JWT secret for authentication
# - API keys for external services (optional)
```

3. **Start Development Environment**
```bash
# Option 1: Full Docker stack (recommended for production-like testing)
npm run docker:start

# Option 2: Local services with Docker infrastructure
npm run infrastructure:start  # Start Redis + RabbitMQ + KurrentDB
npm run dev                   # Start all services locally

# Option 3: Local development (fastest for development)
npm start                    # Start all services in separate terminals
```

4. **Access Applications**
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Individual Services**: Check respective ports (3001-3007)
- **RabbitMQ Management**: http://localhost:15672 (factcheck/antifraud123)
- **KurrentDB**: http://localhost:2113

### **Development Commands**

```bash
# Environment & Health Checks
npm run env:validate          # Validate environment configuration
npm run health               # Check all services health
npm run status               # Quick status check

# Testing
npm run test:all             # Run all tests
npm run test:services        # Test individual services
npm run test:integration     # Integration tests

# Docker Management
npm run docker:build         # Build all containers
npm run docker:logs          # View container logs
npm run docker:clean         # Clean up containers and volumes

# Production Readiness
npm run test:render          # Test deployment readiness
npm run validate:production  # Production environment validation
```

## 🔧 Configuration Management

### **Environment Setup**

The platform uses a **microservices-first configuration approach** with service isolation:

```bash
# Root configuration (minimal shared config)
.env                          # Basic shared variables

# Service-specific configurations
services/auth-service/.env    # Firebase + JWT configuration
services/chat-service/.env    # AI + Firebase configuration
services/link-service/.env    # Security APIs + Firebase
services/community-service/.env # Community features + Firebase
# ... each service has isolated configuration
```

### **Required Environment Variables**

**Core Services (All require):**
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Authentication
JWT_SECRET=your-secure-jwt-secret-key
```

**Service-Specific Variables:**
```bash
# Chat Service (AI functionality)
GEMINI_API_KEY=your-gemini-api-key

# Link Service (Security analysis)
VIRUSTOTAL_API_KEY=your-virustotal-key
SCAMADVISER_API_KEY=your-scamadviser-key
IPQUALITYSCORE_API_KEY=your-ipqs-key

# News Service (Content aggregation)
NEWSAPI_API_KEY=your-newsapi-key
NEWSDATA_API_KEY=your-newsdata-key
```

### **Getting API Keys**

1. **Firebase**: [Console](https://console.firebase.google.com) → Project Settings → Service Accounts
2. **Gemini AI**: [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **VirusTotal**: [VirusTotal API](https://www.virustotal.com/gui/join-us)
4. **ScamAdviser**: [ScamAdviser API](https://www.scamadviser.com/api)
5. **NewsAPI**: [NewsAPI.org](https://newsapi.org/register)

## 🏗️ Project Structure

```
factcheck-platform/
├── 📁 client/                    # React frontend application
│   ├── src/components/          # Reusable UI components
│   ├── src/pages/              # Page components
│   ├── src/services/           # API service layer
│   └── public/                 # Static assets
├── 📁 services/                # Backend microservices
│   ├── api-gateway/            # Request routing & authentication
│   ├── auth-service/           # User authentication & JWT
│   ├── link-service/           # URL analysis & security
│   ├── community-service/      # Posts & discussions
│   ├── chat-service/           # AI-powered assistance
│   ├── news-service/           # News aggregation
│   └── admin-service/          # Administrative functions
├── 📁 config/                  # Shared configuration
├── 📁 scripts/                 # Development & deployment scripts
├── 📁 docs/                    # Documentation
└── docker-compose.dev.yml     # Local development setup
```

## 🔄 Development Workflow

### **Local Development**

1. **Initial Setup**
   ```bash
   git clone https://github.com/VinkRasengan/backup.git
   cd backup
   npm install                  # Install dependencies
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env        # Copy environment template
   # Edit .env with your API keys and Firebase credentials
   ```

3. **Start Development Environment**
   ```bash
   npm run infrastructure:start # Start Redis & KurrentDB
   npm run dev                 # Start all services
   ```

4. **Development Commands**
   ```bash
   npm run dev:auth            # Start auth service only
   npm run dev:link            # Start link service only
   npm run dev:client          # Start frontend only
   npm run logs                # View all service logs
   ```
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

## ✨ Key Features

### **Core Functionality**
- **🔗 Link Analysis**: Real-time URL security scanning with multiple threat detection APIs
- **🤖 AI Chat Assistant**: Intelligent fact-checking powered by Google Gemini
- **👥 Community Platform**: User-driven discussions, posts, and content verification
- **📰 News Aggregation**: Automated news collection with fact-checking workflows
- **🛡️ Security Analysis**: Multi-layer threat detection (VirusTotal, ScamAdviser, etc.)
- **📊 Admin Dashboard**: Comprehensive management and analytics tools

### **Technical Features**
- **🏗️ Microservices Architecture**: Independent, scalable service deployment
- **🔐 Enterprise Security**: JWT authentication, rate limiting, CORS protection
- **⚡ High Performance**: Redis caching, connection pooling, optimized queries
- **📈 Event Sourcing**: KurrentDB for audit trails and event streaming
- **🔄 Real-time Updates**: Live data synchronization across services
- **🐳 Container Ready**: Docker support for consistent deployments

## 🧪 Testing & Quality

### **Automated Testing**
```bash
npm run test:all           # Complete test suite
npm run test:integration   # Cross-service integration tests
npm run test:e2e          # End-to-end user workflows
npm run test:security     # Security vulnerability scans
```

### **Code Quality Tools**
- **ESLint + Prettier**: Automated code formatting and linting
- **Jest**: Unit and integration testing framework
- **Supertest**: API endpoint testing
- **Coverage Reports**: Minimum 80% test coverage maintained

## 📚 Documentation & Resources

### **Technical Documentation**
- **[API Documentation](docs/api/)** - OpenAPI specifications for all services
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and patterns
- **[Security Guide](docs/SECURITY.md)** - Security implementation details
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

### **Developer Resources**
- **[Contributing Guide](docs/CONTRIBUTING.md)** - Development guidelines
- **[Performance Guide](docs/PERFORMANCE.md)** - Optimization strategies
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Changelog](CHANGELOG.md)** - Version history and updates

## 🤝 Contributing & Community

We welcome contributions from developers of all skill levels!

### **How to Contribute**
1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **✅ Test** your changes thoroughly
4. **📝 Document** your changes
5. **🚀 Submit** a pull request

### **Development Standards**
- **Code Style**: ESLint + Prettier (automatically enforced)
- **Testing**: Comprehensive test coverage required
- **Documentation**: Update relevant docs with changes
- **Commits**: Use conventional commit format

### **Community Guidelines**
- **Be Respectful**: Maintain a welcoming environment
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Allow time for reviews and responses

## 📄 License & Legal

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **Third-Party Services**
- Firebase (Google Cloud Platform Terms)
- Gemini AI (Google AI Terms of Service)
- External APIs (respective terms apply)

## 🆘 Support & Contact

### **Getting Help**
- **📖 Documentation**: Check `/docs` for comprehensive guides
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/VinkRasengan/backup/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/VinkRasengan/backup/discussions)
- **📧 Direct Contact**: Reach out to maintainers for urgent issues

### **Response Times**
- **Bug Reports**: 24-48 hours
- **Feature Requests**: 3-5 business days
- **Security Issues**: Immediate attention

---

<div align="center">

**🚀 Built with modern technologies for scalable, secure fact-checking**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange.svg)](https://firebase.google.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Made with ❤️ by the FactCheck Platform Team**

</div>

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
