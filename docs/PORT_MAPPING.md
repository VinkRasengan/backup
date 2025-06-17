# 🔌 Port Mapping & Conflict Resolution

## 📊 Current Port Allocation

### 🎯 Core Services
| Service | Port | Status | Notes |
|---------|------|--------|-------|
| Frontend (React) | 3000 | ✅ Active | Main web interface |
| Auth Service | 3001 | ✅ Active | User authentication |
| Link Service | 3002 | ✅ Active | URL verification |
| Community Service | 3003 | ✅ Active | Posts & comments |
| Chat Service | 3004 | ✅ Active | Real-time messaging |
| News Service | 3005 | ✅ Active | News aggregation |
| Admin Service | 3006 | ✅ Active | Admin dashboard |
| CriminalIP Service | 3007 | 🔄 Planned | Security analysis |
| PhishTank Service | 3008 | 🔄 Planned | Phishing detection |

### 🚪 API Gateway
| Service | Port | Status | Conflict |
|---------|------|--------|---------|
| API Gateway (Docker) | 8080 | ❌ Conflict | cAdvisor uses 8080 |
| API Gateway (Local) | 8082 | ✅ Fixed | New port assignment |

### 📊 Monitoring Stack
| Service | Port | Status | Notes |
|---------|------|--------|-------|
| Prometheus | 9090 | ✅ Active | Metrics collection |
| Grafana | 3010 | ✅ Active | Dashboards |
| Alertmanager | 9093 | ✅ Active | Alert management |
| Node Exporter | 9100 | ✅ Active | System metrics |
| cAdvisor | 8081 | ✅ Active | Container metrics |
| Redis Exporter | 9121 | ✅ Active | Redis metrics |
| Webhook Service | 5001 | ✅ Active | Alert notifications |

### 🗄️ Database & Cache
| Service | Port | Status | Notes |
|---------|------|--------|-------|
| Redis | 6379 | ✅ Active | Caching & sessions |

### 🔍 Additional Services
| Service | Port | Status | Notes |
|---------|------|--------|-------|
| Jaeger | 16686 | 🔄 Optional | Distributed tracing |
| Jaeger Collector | 14268 | 🔄 Optional | Trace collection |

## ⚠️ Identified Conflicts

### 1. API Gateway Port Conflict
**Problem**: Docker containers use port 8080, but cAdvisor also uses 8080
**Solution**: 
- Docker: Change API Gateway to 8082
- Local: Already using 8082
- Update all references

### 2. Grafana Port Inconsistency
**Problem**: Different Grafana ports in different configs
- Monitoring stack: 3010
- Microservices: 3007
**Solution**: Standardize on 3010

### 3. Service Port Mismatches
**Problem**: Prometheus config has wrong service ports
- Community Service: Config shows 3003, should be 3005
- News Service: Config shows 3003, should be 3005

## 🔧 Port Rules & Standards

### Port Range Allocation
- **3000-3099**: Frontend & Core Services
- **5000-5099**: Webhook & Notification Services  
- **6000-6999**: Databases & Cache
- **8000-8099**: API Gateways & Proxies
- **9000-9199**: Monitoring & Metrics
- **16000+**: Distributed Tracing

### Naming Convention
- Production: Use standard ports
- Development: Add +1000 offset if needed
- Testing: Add +2000 offset if needed

### Environment Variables
All services should use:
```bash
PORT=${PORT:-default_port}
```

## 🚀 Quick Fix Commands

### Stop All Services
```bash
npm run stop:all
```

### Fix Port Conflicts
```bash
npm run fix:ports
```

### Restart with New Ports
```bash
npm run start:fixed
```

## 📝 Files to Update

### Docker Compose Files
- `docker-compose.dev.yml` - Line 11: Change 8080 to 8082
- `docker-compose.microservices.yml` - Line 10: Change 8080 to 8082
- `docker-compose.monitoring.yml` - Already correct

### Prometheus Config
- `monitoring/prometheus/prometheus.yml` - Fix service ports

### Scripts
- `scripts/stop-local.bat` - Line 35: Add 8082, remove 8080
- `scripts/stop-local.sh` - Line 102: Add 8082, remove 8080
- `client/scripts/kill-dev-servers.js` - Line 14: Add 8082

### Package.json
- Line 42: Update health check URL to 8082

### Environment Files
- `.env.template` - Update PORT documentation
- Service `.env.example` files - Verify port consistency

## 🎯 Next Steps

1. ✅ Update all Docker Compose files
2. ✅ Fix Prometheus configuration  
3. ✅ Update stop scripts
4. ✅ Fix package.json health check
5. ⏳ Test all services with new ports
6. ⏳ Update documentation
7. ⏳ Create port validation script
