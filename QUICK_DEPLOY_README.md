# Anti-Fraud Platform - Quick Deployment

## 🚀 Quick Start

1. **Install Docker Desktop**
2. **Run the deployment script:**
   ```bash
   ./scripts/deploy-microservices.sh
   ```
3. **Update the generated .env file with your API keys**
4. **Access your application at http://localhost:3000**

## 📋 What You'll Need

- Firebase project credentials
- API keys for external services (Gemini, VirusTotal, etc.)
- Docker Desktop installed and running

## 📖 Full Documentation

See [`DEPLOYMENT_SETUP.md`](DEPLOYMENT_SETUP.md) for complete setup instructions and troubleshooting.

## 🔧 Service Architecture

This platform deploys the following microservices:

- **API Gateway** (Port 8080) - Main entry point
- **Auth Service** (Port 3001) - User authentication
- **Link Service** (Port 3002) - Link verification
- **Community Service** (Port 3003) - Community features
- **Chat Service** (Port 3004) - Real-time chat
- **News Service** (Port 3005) - News verification
- **Admin Service** (Port 3006) - Administration panel

## 🛡️ Security Features

- JWT-based authentication
- Rate limiting
- CORS protection
- Input validation
- Secure API communication

## 📞 Support

If you encounter any issues during deployment, please refer to the troubleshooting section in the full documentation or contact support.
