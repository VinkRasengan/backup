# 📊 Grafana Manual Setup Guide

## 🎯 Bước 1: Truy cập Grafana

1. Mở browser và truy cập: http://localhost:3010
2. Login với:
   - **Username**: admin
   - **Password**: admin123

## 🔗 Bước 2: Thêm Prometheus Datasource

1. Click vào **⚙️ Configuration** (gear icon) ở sidebar trái
2. Click **Data Sources**
3. Click **Add data source**
4. Chọn **Prometheus**
5. Điền thông tin:
   - **Name**: Prometheus
   - **URL**: http://prometheus:9090
   - **Access**: Server (default)
6. Click **Save & Test**
7. Bạn sẽ thấy "Data source is working" màu xanh

## 📈 Bước 3: Import Dashboard

### Cách 1: Import từ JSON
1. Click **+** ở sidebar trái
2. Click **Import**
3. Copy paste JSON này:

```json
{
  "dashboard": {
    "id": null,
    "title": "Microservices Monitoring",
    "tags": ["microservices", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Services Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up",
            "legendFormat": "{{job}}"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                { "color": "red", "value": null },
                { "color": "green", "value": 1 }
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{job}} - {{method}}"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 }
      },
      {
        "id": 3,
        "title": "Response Time (95th percentile)",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{job}} - 95th percentile"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 }
      },
      {
        "id": 4,
        "title": "CPU Usage",
        "type": "timeseries",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage - {{instance}}"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

4. Click **Load**
5. Click **Import**

### Cách 2: Tạo Dashboard đơn giản
1. Click **+** ở sidebar trái
2. Click **Dashboard**
3. Click **Add visualization**
4. Chọn **Prometheus** datasource
5. Trong **Metrics browser**, gõ: `up`
6. Click **Run queries**
7. Bạn sẽ thấy status của các services
8. Click **Apply**
9. Click **Save dashboard** ở góc trên phải

## 🎯 Bước 4: Tạo thêm panels

### Panel Service Status:
- **Query**: `up`
- **Legend**: `{{job}}`
- **Visualization**: Stat

### Panel Request Rate:
- **Query**: `rate(http_requests_total[5m])`
- **Legend**: `{{job}} - {{method}}`
- **Visualization**: Time series

### Panel Response Time:
- **Query**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- **Legend**: `{{job}} - 95th percentile`
- **Visualization**: Time series

### Panel CPU Usage:
- **Query**: `100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
- **Legend**: `CPU Usage - {{instance}}`
- **Visualization**: Time series

## 🚀 Bước 5: Test với microservices

1. Start một vài microservices của bạn
2. Truy cập các endpoints có /metrics
3. Refresh Grafana dashboard
4. Bạn sẽ thấy metrics xuất hiện

## 🔧 Troubleshooting

### Nếu không thấy data:
1. Kiểm tra Prometheus targets: http://localhost:9090/targets
2. Đảm bảo services có /metrics endpoints
3. Check network connectivity giữa containers

### Nếu queries không hoạt động:
1. Test queries trực tiếp trong Prometheus: http://localhost:9090
2. Kiểm tra metric names trong Prometheus
3. Adjust time range trong Grafana

## 🎉 Kết quả

Sau khi setup xong, bạn sẽ có:
- ✅ Real-time monitoring dashboard
- ✅ Service health status
- ✅ Performance metrics
- ✅ System monitoring
- ✅ Auto-refresh every 5 seconds
