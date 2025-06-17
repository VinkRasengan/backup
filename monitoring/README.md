# Monitoring Stack - Prometheus + Grafana

Hệ thống monitoring hoàn chỉnh cho Anti-Fraud Platform với Prometheus, Grafana, Alertmanager và Node Exporter.

## 🚀 Quick Start

### 1. Cài đặt dependencies
```bash
npm run monitoring:install
```

### 2. Khởi động monitoring stack
```bash
npm run monitoring:start
```

### 3. Truy cập các services
- **Grafana**: http://localhost:3010 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Node Exporter**: http://localhost:9100
- **cAdvisor**: http://localhost:8081
- **Webhook Service**: http://localhost:5001

## 📊 Dashboards

### Microservices Overview
- Service health status
- Request rates
- Response times
- CPU và Memory usage
- Error rates

Import dashboard từ: `monitoring/grafana/dashboards/microservices-overview.json`

## 🚨 Alerting

### Alert Rules
- **Service Down**: Khi service không phản hồi > 30s
- **High Response Time**: 95th percentile > 2s
- **High Error Rate**: Error rate > 10%
- **High Memory Usage**: Memory > 80%
- **High CPU Usage**: CPU > 80%
- **Disk Space Low**: Disk < 10%

### Notification Channels
- **Webhook**: http://localhost:5001/webhook
- **Email**: Cấu hình trong `monitoring/alertmanager/alertmanager.yml`
- **Slack/Discord**: Tích hợp trong webhook service

## 📈 Metrics

### Application Metrics
- `http_requests_total`: Tổng số HTTP requests
- `http_request_duration_seconds`: Thời gian phản hồi
- `active_connections`: Số kết nối đang hoạt động
- `database_connection_errors_total`: Lỗi kết nối database
- `redis_connection_errors_total`: Lỗi kết nối Redis
- `websocket_connections_active`: WebSocket connections
- `external_api_calls_total`: External API calls

### System Metrics
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Process metrics

## 🔧 Configuration

### Prometheus
- Config: `monitoring/prometheus/prometheus.yml`
- Alert rules: `monitoring/prometheus/alert_rules.yml`
- Scrape interval: 15s
- Retention: 200h

### Grafana
- Datasource: `monitoring/grafana/provisioning/datasources/`
- Dashboards: `monitoring/grafana/provisioning/dashboards/`
- Default user: admin/admin123

### Alertmanager
- Config: `monitoring/alertmanager/alertmanager.yml`
- Webhook endpoint: http://localhost:5001/webhook
- Email notifications: Cấu hình SMTP

## 🛠️ Commands

```bash
# Cài đặt monitoring dependencies
npm run monitoring:install

# Khởi động monitoring stack
npm run monitoring:start

# Dừng monitoring stack
npm run monitoring:stop

# Kiểm tra trạng thái
npm run monitoring:status

# Xem logs
docker-compose -f docker-compose.monitoring.yml logs -f

# Restart services
docker-compose -f docker-compose.monitoring.yml restart
```

## 📱 Mobile/Remote Access

### Grafana Mobile App
1. Download Grafana mobile app
2. Add server: http://your-server:3001
3. Login với admin/admin123

### API Access
```bash
# Prometheus API
curl http://localhost:9090/api/v1/query?query=up

# Grafana API
curl -u admin:admin123 http://localhost:3001/api/dashboards/home

# Alertmanager API
curl http://localhost:9093/api/v1/alerts
```

## 🔐 Security

### Production Setup
1. Thay đổi default passwords
2. Cấu hình HTTPS
3. Restrict network access
4. Enable authentication
5. Configure firewall rules

### Environment Variables
```bash
# Grafana
GF_SECURITY_ADMIN_PASSWORD=your-secure-password
GF_SERVER_PROTOCOL=https
GF_SERVER_CERT_FILE=/path/to/cert.pem
GF_SERVER_CERT_KEY=/path/to/key.pem

# Alertmanager
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-email-password
```

## 🐛 Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   docker-compose -f docker-compose.monitoring.yml logs
   ```

2. **Metrics not appearing**
   - Check service /metrics endpoints
   - Verify Prometheus targets
   - Check network connectivity

3. **Alerts not firing**
   - Check alert rules syntax
   - Verify Alertmanager config
   - Test webhook endpoint

4. **Grafana dashboards empty**
   - Check Prometheus datasource
   - Verify metric names
   - Check time range

### Health Checks
```bash
# Check all services
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:3001/api/health # Grafana
curl http://localhost:9093/-/healthy  # Alertmanager
curl http://localhost:9100/metrics    # Node Exporter
curl http://localhost:5001/health     # Webhook Service
```

## 📚 Documentation

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Node Exporter Documentation](https://github.com/prometheus/node_exporter)

## 🤝 Support

Nếu gặp vấn đề, hãy:
1. Kiểm tra logs: `docker-compose -f docker-compose.monitoring.yml logs`
2. Verify network connectivity
3. Check configuration files
4. Review alert endpoints: http://localhost:5001/alerts
