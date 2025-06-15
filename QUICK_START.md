# Quick Start Guide 🚀

## 🎯 Get Started in 3 Steps

### Step 1: Deploy with Docker (Recommended)
```bash
# Clone and navigate to project
git clone <repository-url>
cd anti-fraud-platform

# Deploy all microservices
./scripts/deploy-microservices.sh
```

### Step 2: Access the Application
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Monitoring**: http://localhost:9090 (Prometheus)
- **Dashboards**: http://localhost:3007 (Grafana - admin/admin)

### Step 3: Test the Platform
1. **Register/Login** at http://localhost:3000
2. **Check a link** using the link verification feature
3. **Chat with AI** for security advice
4. **Browse community** posts and discussions

## 🔧 Alternative: Manual Development

If you prefer to run services individually:

```bash
# Install dependencies for all services
cd services/auth-service && npm install
cd ../link-service && npm install
cd ../community-service && npm install
cd ../chat-service && npm install
cd ../news-service && npm install
cd ../admin-service && npm install
cd ../api-gateway && npm install
cd ../../client && npm install

# Start services (in separate terminals)
cd services/api-gateway && npm run dev      # Terminal 1
cd services/auth-service && npm run dev     # Terminal 2
cd services/link-service && npm run dev     # Terminal 3
cd services/community-service && npm run dev # Terminal 4
cd services/chat-service && npm run dev     # Terminal 5
cd services/news-service && npm run dev     # Terminal 6
cd services/admin-service && npm run dev    # Terminal 7
cd client && npm start                      # Terminal 8
```

## 📊 Health Checks

After deployment, verify all services are running:

```bash
# Check all services
curl http://localhost:8080/services/status

# Check individual services
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Link Service
curl http://localhost:3003/health  # Community Service
curl http://localhost:3004/health  # Chat Service
curl http://localhost:3005/health  # News Service
curl http://localhost:3006/health  # Admin Service
```

## 🛠️ Common Commands

```bash
# View logs
docker-compose -f docker-compose.microservices.yml logs -f

# Restart a service
docker-compose -f docker-compose.microservices.yml restart auth-service

# Stop all services
docker-compose -f docker-compose.microservices.yml down

# Rebuild and restart
./scripts/deploy-microservices.sh
```

## 🔑 Environment Setup

The deployment script creates a `.env` file automatically. Update it with your API keys:

```env
# Required for Firebase
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# Optional API keys (will use mock data if not provided)
GEMINI_API_KEY=your-gemini-key
VIRUSTOTAL_API_KEY=your-virustotal-key
SCAMADVISER_API_KEY=your-scamadviser-key
```

## 🆘 Troubleshooting

### Services not starting?
1. Check Docker is running: `docker info`
2. Check ports are available: `netstat -an | grep :3000`
3. View service logs: `docker-compose logs [service-name]`

### Frontend not loading?
1. Ensure API Gateway is running on port 8080
2. Check CORS settings in `.env`
3. Verify React app environment variables

### Authentication errors?
1. Verify Firebase configuration in `.env`
2. Check Firebase project settings
3. Ensure email verification is enabled

## 📚 Next Steps

- **Read the full documentation**: [README.md](README.md)
- **Understand the architecture**: [MICROSERVICES_ARCHITECTURE.md](MICROSERVICES_ARCHITECTURE.md)
- **Learn about the migration**: [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)
- **Explore individual services**: Check `services/[service-name]/README.md`

---

**🎉 You're ready to go! The Anti-Fraud Platform is now running with microservices architecture.**
