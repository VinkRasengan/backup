# FactCheck Platform

A comprehensive microservices-based platform for link verification, community discussions, and AI-powered fact-checking.

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/VinkRasengan/backup.git
   cd backup
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start all services**
   ```bash
   npm start
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

### Required Variables

```env
# Service URLs
AUTH_SERVICE_URL=https://your-auth-service.onrender.com
LINK_SERVICE_URL=https://your-link-service.onrender.com
COMMUNITY_SERVICE_URL=https://your-community-service.onrender.com
CHAT_SERVICE_URL=https://your-chat-service.onrender.com
NEWS_SERVICE_URL=https://your-news-service.onrender.com
ADMIN_SERVICE_URL=https://your-admin-service.onrender.com

# Frontend Configuration
REACT_APP_API_GATEWAY_URL=https://your-api-gateway.onrender.com
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id

# API Keys
GEMINI_API_KEY=your-gemini-api-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
JWT_SECRET=your-jwt-secret
```

## 📚 Documentation

- [Security Guide](docs/SECURITY.md)
- [Maintenance Guide](docs/MAINTENANCE.md)
- [Performance Guide](docs/PERFORMANCE.md)
- [Usage Guide](docs/USAGE-GUIDE.md)
- [Deployment Checklist](docs/RENDER_DEPLOYMENT_CHECKLIST.md)

## 🛠️ Development

### Available Scripts

- `npm start` - Start all services in development mode
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run linting
- `npm run deploy` - Deploy to production

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
