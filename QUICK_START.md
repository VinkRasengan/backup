# 🚀 Quick Start - FactCheck Platform

## For New Developers

### 📋 Prerequisites
- Docker Desktop (running)
- Node.js 18+ & npm 9+

### 🎯 3-Step Setup

```bash
# 1. Clone repo
git clone <your-repo-url>
cd backup

# 2. Add .env file to root directory
# (Get .env from team lead or copy from .env.example and fill in real values)

# 3. Run full setup
npm run setup:full
```

### 🎮 Daily Commands

```bash
npm start    # Start all services
npm stop     # Stop all services
npm restart  # Restart all services
npm run logs # View logs
```

### 🌐 Access Points

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080
- **Grafana**: http://localhost:3010 (admin/admin123)

### 🔧 Troubleshooting

```bash
npm run health  # Check service health
npm run status  # Quick status check
```

That's it! 🎉

For detailed documentation, see [DOCKER_SETUP_GUIDE.md](./DOCKER_SETUP_GUIDE.md)
