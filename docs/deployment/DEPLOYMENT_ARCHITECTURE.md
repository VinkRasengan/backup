# Sơ đồ Kiến trúc Triển khai Microservices

## 1. Tổng quan Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Web App   │  │ Mobile App  │  │  Admin UI   │  │   API Docs  │          │
│  │ (React/JS)  │  │ (React Native)│ │ (React)     │  │ (Swagger)   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LOAD BALANCER LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                    NGINX / HAProxy / Cloud Load Balancer                   │ │
│  │                    - SSL Termination                                       │ │
│  │                    - Rate Limiting                                         │ │
│  │                    - Health Checks                                         │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           API Gateway Service                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │   Routing   │  │  Auth Proxy │  │ Rate Limit  │  │   Logging   │      │ │
│  │  │             │  │             │  │             │  │             │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │   Caching   │  │   Metrics   │  │   Tracing   │  │   Circuit   │      │ │
│  │  │             │  │             │  │             │  │   Breaker   │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            KUBERNETES CLUSTER                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                              NAMESPACE: anti-fraud-platform                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            MICROSERVICES LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │ Auth Service│  │Community Svc│  │ Link Service│  │ Chat Service│      │ │
│  │  │ Port: 3001  │  │ Port: 3003  │  │ Port: 3004  │  │ Port: 3005  │      │ │
│  │  │ Replicas: 2 │  │ Replicas: 3 │  │ Replicas: 2 │  │ Replicas: 2 │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  │                                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │News Service │  │Admin Service│  │Analytics Svc│  │ETL Service  │      │ │
│  │  │ Port: 3006  │  │ Port: 3007  │  │ Port: 3008  │  │ Port: 3009  │      │ │
│  │  │ Replicas: 2 │  │ Replicas: 1 │  │ Replicas: 2 │  │ Replicas: 1 │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  │                                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │Phishtank Svc│  │CriminalIP Svc│  │Spark Service│  │Event Bus Svc│      │ │
│  │  │ Port: 3010  │  │ Port: 3011  │  │ Port: 3012  │  │ Port: 3013  │      │ │
│  │  │ Replicas: 1 │  │ Replicas: 1 │  │ Replicas: 2 │  │ Replicas: 1 │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │   MongoDB   │  │    Redis    │  │   Firebase  │  │   Hadoop    │      │ │
│  │  │ (Primary DB)│  │   (Cache)   │  │ (Firestore) │  │ (Big Data)  │      │ │
│  │  │ Replicas: 3 │  │ Cluster: 3  │  │ (Cloud)     │  │ NameNode: 1 │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  │                                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │   Spark     │  │  Zeppelin   │  │   Jupyter   │  │   Grafana   │      │ │
│  │  │ (Analytics) │  │ (Notebook)  │  │ (Notebook)  │  │ (Dashboard) │      │ │
│  │  │ Master: 1   │  │ Instance: 1 │  │ Instance: 1 │  │ Instance: 1 │      │ │
│  │  │ Workers: 2  │  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  │  └─────────────┘                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            MONITORING LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │ Prometheus  │  │   Grafana   │  │Alertmanager │  │   Jaeger    │      │ │
│  │  │ (Metrics)   │  │(Visualization)│ │ (Alerts)    │  │ (Tracing)   │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  │                                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │   cAdvisor  │  │Node Exporter│  │Webhook Svc  │  │   ELK Stack │      │ │
│  │  │ (Container) │  │ (System)    │  │ (Alerts)    │  │ (Logging)   │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Chi tiết Triển khai từng Service

### 2.1 API Gateway Service
```yaml
# k8s/api-gateway.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: anti-fraud-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: api-gateway:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8080"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 2.2 Auth Service
```yaml
# k8s/auth-service.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: anti-fraud-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: JWT_SECRET
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 2.3 Community Service
```yaml
# k8s/community-service.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: community-service
  namespace: anti-fraud-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: community-service
  template:
    metadata:
      labels:
        app: community-service
    spec:
      containers:
      - name: community-service
        image: community-service:latest
        ports:
        - containerPort: 3003
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3003"
        - name: MONGODB_URI
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: MONGODB_URI
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## 3. Service Discovery và Load Balancing

### 3.1 Kubernetes Services
```yaml
# k8s/services.yml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: anti-fraud-platform
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: anti-fraud-platform
spec:
  selector:
    app: auth-service
  ports:
  - protocol: TCP
    port: 3001
    targetPort: 3001
  type: ClusterIP
```

### 3.2 Ingress Configuration
```yaml
# k8s/ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: factcheck-ingress
  namespace: anti-fraud-platform
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.factcheck.vn
    secretName: factcheck-tls
  rules:
  - host: api.factcheck.vn
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway-service
            port:
              number: 80
```

## 4. Monitoring và Observability

### 4.1 Prometheus Configuration
```yaml
# monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
      action: replace
      regex: ([^:]+)(?::\d+)?;(\d+)
      replacement: $1:$2
      target_label: __address__
```

### 4.2 Grafana Dashboard
```json
// monitoring/grafana/dashboards/microservices-overview.json
{
  "dashboard": {
    "title": "Microservices Overview",
    "panels": [
      {
        "title": "Service Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"kubernetes-pods\"}",
            "legendFormat": "{{pod}}"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{service}}"
          }
        ]
      }
    ]
  }
}
```

## 5. Security và Networking

### 5.1 Network Policies
```yaml
# k8s/network-policies.yml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-gateway-policy
  namespace: anti-fraud-platform
spec:
  podSelector:
    matchLabels:
      app: api-gateway
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: auth-service
    ports:
    - protocol: TCP
      port: 3001
  - to:
    - podSelector:
        matchLabels:
          app: community-service
    ports:
    - protocol: TCP
      port: 3003
```

### 5.2 Service Mesh (Istio)
```yaml
# k8s/service-mesh/istio-config.yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: api-gateway-vs
  namespace: anti-fraud-platform
spec:
  hosts:
  - api.factcheck.vn
  gateways:
  - factcheck-gateway
  http:
  - route:
    - destination:
        host: api-gateway-service
        port:
          number: 80
      weight: 100
---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: api-gateway-dr
  namespace: anti-fraud-platform
spec:
  host: api-gateway-service
  trafficPolicy:
    loadBalancer:
      simple: ROUND_ROBIN
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 100
        maxRequestsPerConnection: 10
```

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v1
    
    - name: Build and push Docker images
      uses: docker/build-push-action@v2
      with:
        context: ./services/api-gateway
        push: true
        tags: ${{ secrets.DOCKER_REGISTRY }}/api-gateway:${{ github.sha }}
    
    - name: Deploy to Kubernetes
      uses: steebchen/kubectl@v2
      with:
        config: ${{ secrets.KUBE_CONFIG_DATA }}
        command: apply -f k8s/
```

## 7. Kết luận

Kiến trúc triển khai này cung cấp:

1. **Scalability**: Mỗi service có thể scale độc lập
2. **Reliability**: Health checks, circuit breakers, và monitoring
3. **Security**: Network policies, service mesh, và SSL/TLS
4. **Observability**: Prometheus, Grafana, và distributed tracing
5. **Automation**: CI/CD pipeline tự động hóa deployment
6. **Maintainability**: Modular architecture và clear separation of concerns

Hệ thống được thiết kế để xử lý tải cao và đảm bảo tính sẵn sàng 99.9% với các cơ chế backup và recovery. 