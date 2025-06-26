# 📊 FactCheck Platform - Monitoring Integration

## 🚀 Quick Start

### Start với Monitoring (Mặc định)
```bash
npm start
```

Lệnh này sẽ khởi động:
- ✅ Tất cả microservices (API Gateway, Auth, Link, Community, Chat, News, Admin)
- ✅ Frontend React app
- ✅ Monitoring stack (Prometheus, Grafana, Alertmanager)
- ✅ Alert webhook service

### Tắt Monitoring (nếu muốn)
```bash
ENABLE_MONITORING=false npm start
```

## 📈 Monitoring URLs

Sau khi start thành công, bạn có thể truy cập:

### 🌐 Main Application
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **API Health**: http://localhost:8080/health

### 📊 Monitoring Dashboards
- **Grafana**: http://localhost:3010 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

### 🔧 Monitoring Tools
- **Node Exporter**: http://localhost:9100
- **cAdvisor**: http://localhost:8081  
- **Webhook Service**: http://localhost:5001

## 🛠️ Monitoring Commands

```bash
# Kiểm tra trạng thái tất cả services
npm run monitoring:health

# Khởi động chỉ monitoring stack
npm run monitoring:start

# Dừng monitoring stack
npm run monitoring:stop

# Restart monitoring
npm run monitoring:restart

# Xem logs monitoring
npm run monitoring:logs

# Kiểm tra status services
npm run status
```

## 📊 Features

### ✨ Automatic Integration
- 🔄 Monitoring tự động start cùng với `npm start`
- 🚀 Không cần config phức tạp
- 📱 Tự động mở Grafana dashboard (sau 5 giây)

### 📈 Metrics Collection
- 📊 Service health checks
- ⏱️ Response times
- 💾 Memory usage
- 🔢 Request counts
- 🚨 Error rates

### 🚨 Alert System
- ⚡ Service down alerts
- 📈 High response time alerts
- 💾 Memory usage alerts
- 🔔 Webhook notifications

## 🎯 Usage Examples

### Check Service Health
```bash
# Detailed health check of all services
npm run monitoring:health
```

### View Metrics
```bash
# View API Gateway metrics (Prometheus format)
curl http://localhost:8080/metrics

# Check individual service health
curl http://localhost:8080/health
curl http://localhost:3001/health
```

### Dashboard Access
1. **Grafana**: http://localhost:3010
   - Login: admin/admin123
   - Import dashboards từ `monitoring/grafana/dashboards/`

2. **Prometheus**: http://localhost:9090
   - Query metrics
   - View targets status

## 🔧 Troubleshooting

### Services không start?
```bash
# Stop tất cả và restart
npm stop
npm start

# Hoặc restart monitoring riêng
npm run monitoring:restart
```

### Docker issues?
```bash
# Check Docker status
docker ps

# Restart Docker monitoring
npm run monitoring:stop
npm run monitoring:start
```

### Port conflicts?
```bash
# Fix port issues
npm run fix-ports
npm start
```

## 📚 Advanced

### Custom Dashboards
- Import/export dashboards từ `monitoring/grafana/dashboards/`
- Tạo custom panels cho business metrics

### Alert Configuration  
- Edit `monitoring/prometheus/alert_rules.yml`
- Configure webhook notifications trong `monitoring/webhook-service/`

### Metrics Enhancement
- Services tự động expose `/health` và `/metrics` endpoints
- Integrate với `prom-client` cho custom metrics

---

🎉 **Happy Monitoring!** 📊
