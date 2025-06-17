# 🚀 Scripts Reference - Anti-Fraud Platform

## 📋 Quick Commands Overview

### 🎯 Starting Services
```bash
npm start              # Start all services (alias for start:full)
npm run start:full     # Start core services + frontend with delay
npm run start:safe     # Alternative safe start method
npm run start:services # Start all microservices (including optional)
npm run start:services:core # Start only core microservices
```

### 🛑 Stopping Services
```bash
npm run kill:all       # Kill ALL services and processes
npm run kill           # Alias for kill:all
npm run stop           # Alias for kill:all
npm run stop:all       # Stop local services + monitoring
npm run stop:local     # Stop only local services
```

### 🔄 Restarting Services
```bash
npm run restart        # Kill all + start:full
npm run restart:safe   # Kill all + start:safe
```

### 🔍 Monitoring & Health
```bash
npm run validate:ports # Check port status and conflicts
npm run health         # Check API Gateway health
npm run monitoring:start    # Start monitoring stack (Docker)
npm run monitoring:stop     # Stop monitoring stack
npm run monitoring:status   # Check monitoring status
```

### 🔧 Utilities
```bash
npm run fix:ports      # Fix port conflicts automatically
```

## 📊 Detailed Command Reference

### Starting Commands

#### `npm start` / `npm run start:full`
- **Purpose**: Start complete platform
- **What it does**:
  - Starts 7 core microservices
  - Waits 20 seconds
  - Starts React frontend
  - Uses concurrently for parallel execution
- **Ports**: 3000-3006, 8082
- **Best for**: Normal development

#### `npm run start:safe`
- **Purpose**: Alternative safe start method
- **What it does**:
  - Uses custom script with better error handling
  - Starts services sequentially
  - Includes port conflict detection
  - Shows detailed status
- **Best for**: When start:full has issues

#### `npm run start:services:core`
- **Purpose**: Start only core microservices
- **Services**: auth, api-gateway, admin, chat, community, link, news
- **Excludes**: criminalip, phishtank (optional services)
- **Best for**: Core development without optional services

### Stopping Commands

#### `npm run kill:all` (⭐ NEW)
- **Purpose**: Nuclear option - kill everything
- **What it kills**:
  - All processes on platform ports (3000-3012, 8000-8082, 9000-9121)
  - All Node.js processes
  - All npm processes
  - All Docker containers
  - Webhook services
  - Concurrently processes
- **Platforms**: Cross-platform (Windows/Linux/Mac)
- **Best for**: When you want to start fresh

#### `npm run stop:all`
- **Purpose**: Graceful stop
- **What it does**:
  - Runs stop:local script
  - Stops monitoring stack
- **Best for**: Normal shutdown

### Monitoring Commands

#### `npm run validate:ports`
- **Purpose**: Check what's running
- **Output**: 
  - ✅ Running services
  - ⚪ Not running services
  - 🔴 Port conflicts (if any)
  - 📊 Summary statistics

#### `npm run health`
- **Purpose**: Check API Gateway health
- **URL**: http://localhost:8082/services/status
- **Output**: JSON with service statuses

#### `npm run monitoring:start`
- **Purpose**: Start monitoring stack
- **Services**: Prometheus, Grafana, Alertmanager, etc.
- **Requires**: Docker Desktop
- **Ports**: 3010, 5001, 6379, 8081, 9090-9121

## 🎯 Common Workflows

### 🚀 Fresh Start
```bash
npm run kill:all       # Clean slate
npm run start:full     # Start everything
npm run validate:ports # Verify
```

### 🔄 Quick Restart
```bash
npm run restart        # One command restart
```

### 🐛 Debugging Issues
```bash
npm run kill:all       # Stop everything
npm run validate:ports # Check ports are free
npm run start:safe     # Use safe start method
```

### 📊 With Monitoring
```bash
npm run kill:all           # Clean start
npm run monitoring:start   # Start monitoring first
npm run start:full         # Start services
```

### 🧪 Core Services Only
```bash
npm run kill:all
npm run start:services:core  # Skip optional services
cd client && npm start       # Start frontend manually
```

## 🛠️ Alternative Scripts

### Windows Users
```cmd
scripts\kill-all.bat    # Windows batch version
```

### Linux/Mac Users
```bash
./scripts/kill-all.sh   # Shell script version
```

### Manual Port Killing
```bash
node client/scripts/kill-dev-servers.js  # Kill common dev ports
```

## 📋 Port Reference

### Core Services
- **3000**: Frontend (React)
- **3001**: Auth Service
- **3002**: Link Service
- **3003**: Community Service
- **3004**: Chat Service
- **3005**: News Service
- **3006**: Admin Service
- **8082**: API Gateway

### Optional Services
- **3007**: CriminalIP Service
- **3008**: PhishTank Service

### Monitoring Stack
- **3010**: Grafana
- **5001**: Webhook Service
- **6379**: Redis
- **8081**: cAdvisor
- **9090**: Prometheus
- **9093**: Alertmanager
- **9100**: Node Exporter
- **9121**: Redis Exporter

## 🚨 Troubleshooting

### Services Won't Start
1. `npm run kill:all` - Clean everything
2. `npm run validate:ports` - Check ports are free
3. `npm run start:safe` - Use safe start method

### Port Conflicts
1. `npm run validate:ports` - Identify conflicts
2. `npm run fix:ports` - Auto-fix configurations
3. `npm run kill:all` - Force kill conflicting processes

### Frontend Won't Connect
1. Check API Gateway is on port 8082
2. Verify proxy config in `client/src/setupProxy.js`
3. `npm run health` - Check API Gateway health

### Docker Issues
1. Start Docker Desktop
2. `npm run monitoring:stop` then `npm run monitoring:start`
3. Check Docker containers: `docker ps`

## 💡 Pro Tips

1. **Always use `npm run kill:all`** before starting if you have issues
2. **Use `npm run validate:ports`** to check what's running
3. **`npm run restart`** is faster than manual stop/start
4. **Monitor logs** in terminal when services start
5. **Check health endpoint** at http://localhost:8082/health

## 🎉 Success Indicators

When everything works:
```
🟢 Running Services:
✅ Port 3000: Frontend
✅ Port 3001: Auth Service
✅ Port 3002: Link Service
✅ Port 3003: Community Service
✅ Port 3004: Chat Service
✅ Port 3005: News Service
✅ Port 3006: Admin Service
✅ Port 8082: API Gateway

🎉 No port conflicts detected!
📊 Summary: 8 services running, 0 conflicts
```
