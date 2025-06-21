# 🚀 Anti-Fraud Platform - Usage Guide

## 📋 Quick Commands

### **🔧 First Time Setup**
```bash
npm run setup
```
- Installs all dependencies
- Configures tech stack
- Sets up Redis and monitoring
- Creates necessary config files

### **🚀 Development Commands**

#### **Start Full Stack (Recommended)**
```bash
npm start
```
- Starts ALL services + React client
- Equivalent to old `start:full`
- Takes 30-60 seconds to fully start
- Opens everything you need for development

#### **Start Services Only (Backend Development)**
```bash
npm run dev
# or
npm run start:services
```
- Starts ONLY backend services (no client)
- Faster startup
- Good for backend development
- Start client separately: `cd client && npm start`

#### **Stop Everything**
```bash
npm stop
```
- Stops all services and client
- Kills all Node.js processes
- Stops Redis container

#### **Restart Everything**
```bash
npm restart
```
- Stops then starts full stack
- Good for applying config changes

### **🐳 Deployment Commands**

#### **Docker Deployment**
```bash
npm run docker
```
- Builds and starts with Docker Compose
- Includes Redis, monitoring, all services
- Production-like environment

#### **Kubernetes Deployment**
```bash
npm run deploy:k8s
```
- Deploys to Kubernetes cluster
- Requires kubectl configured

### **🧪 Testing Commands**

#### **All Tests**
```bash
npm test
```
- Runs unit + contract + integration tests

#### **Specific Test Types**
```bash
npm run test:unit         # Unit tests only
npm run test:contract     # Contract tests only  
npm run test:integration  # Integration tests only
```

### **📊 Monitoring Commands**

#### **System Status**
```bash
npm run status
```
- Shows status of all services
- Checks tech stack components
- Health check summary

#### **Detailed Health Check**
```bash
npm run health
```
- Same as status but more detailed

#### **View Logs**
```bash
npm run logs
```
- Shows logs from all services
- Works with Docker deployment

### **🛠️ Utility Commands**

#### **Fix Port Conflicts**
```bash
npm run fix-ports
```
- Kills processes using required ports
- Useful when services won't start

#### **Clean Everything**
```bash
npm run clean
```
- Stops all services
- Removes Docker containers
- Cleans up resources

#### **Get Help**
```bash
npm run help
```
- Shows all available commands
- Detailed usage information

---

## 🔄 **Migration from Old Scripts**

### **Old vs New Commands**

| **Old Command** | **New Command** | **Notes** |
|-----------------|-----------------|-----------|
| `npm run start:full` | `npm start` | Full stack startup |
| `npm run start:services` | `npm run dev` | Services only |
| `npm run docker:up` | `npm run docker` | Docker deployment |
| `npm run deploy:local` | `npm start` | Local development |
| `npm run kill:all` | `npm stop` | Stop everything |
| `npm run fix:ports` | `npm run fix-ports` | Fix port conflicts |

---

## 🏗️ **What Each Command Actually Does**

### **`npm start` (Full Stack)**
1. Stops any existing processes
2. Starts Redis (Docker container)
3. Starts all 7 backend services sequentially
4. Waits for services to be ready
5. Starts React client
6. Shows access URLs

**Takes:** 30-60 seconds  
**Opens:** Frontend + All APIs  
**Good for:** Full development, testing, demos  

### **`npm run dev` (Services Only)**
1. Stops any existing processes
2. Starts Redis
3. Starts all backend services with hot reload
4. Does NOT start React client

**Takes:** 15-30 seconds  
**Opens:** Only APIs  
**Good for:** Backend development, API testing  

### **`npm run docker` (Production-like)**
1. Builds Docker images
2. Starts with Docker Compose
3. Includes monitoring stack
4. Production environment variables

**Takes:** 2-5 minutes (first time)  
**Opens:** Full stack in containers  
**Good for:** Production testing, CI/CD  

---

## 🌐 **Access URLs**

After running `npm start`:

- **Frontend:** http://localhost:3000
- **API Gateway:** http://localhost:8080
- **Auth Service:** http://localhost:3001
- **Link Service:** http://localhost:3002
- **Community Service:** http://localhost:3003
- **Chat Service:** http://localhost:3004
- **News Service:** http://localhost:3005
- **Admin Service:** http://localhost:3006
- **Redis:** localhost:6379

---

## 🚨 **Troubleshooting**

### **Services Won't Start**
```bash
npm run fix-ports  # Fix port conflicts
npm run clean      # Clean everything
npm start          # Try again
```

### **Redis Connection Issues**
```bash
# Check if Redis is running
redis-cli ping

# Or restart Redis
docker restart antifraud-redis
```

### **Client Won't Load**
```bash
# Check if API Gateway is running
curl http://localhost:8080/health

# Restart everything
npm restart
```

### **Docker Issues**
```bash
# Clean Docker
docker system prune -f

# Restart Docker deployment
npm run docker
```

---

## 💡 **Pro Tips**

1. **Always use `npm start` for development** - it starts everything you need
2. **Use `npm run dev` only for backend work** - faster when you don't need the client
3. **Run `npm run status` to check what's running** - saves debugging time
4. **Use `npm run fix-ports` before starting** - prevents port conflicts
5. **Check logs with `npm run logs`** - especially useful with Docker

---

## 🎯 **Common Workflows**

### **Daily Development**
```bash
npm start           # Start everything
# ... do development work ...
npm stop            # End of day
```

### **Backend Development**
```bash
npm run dev         # Start services only
cd client && npm start  # Start client separately if needed
```

### **Testing Changes**
```bash
npm restart         # Restart with changes
npm test            # Run tests
npm run status      # Check everything is working
```

### **Production Testing**
```bash
npm run docker      # Test with Docker
npm run logs        # Check logs
npm run status      # Verify deployment
```
