# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Anti-Fraud Platform with full monitoring stack.

## 📋 Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured to access your cluster
- At least 4GB RAM and 2 CPU cores available in cluster
- Docker images built for all services

## 🏗️ Architecture

The deployment includes:

### Application Services
- **API Gateway** (8082) - Main entry point
- **Auth Service** (3001) - Authentication & user management
- **Link Service** (3002) - URL analysis & security checks
- **Community Service** (3003) - Community features
- **Chat Service** (3004) - Real-time chat with WebSocket
- **News Service** (3005) - News aggregation
- **Admin Service** (3006) - Administrative functions
- **Frontend** (3000) - React web application
- **Redis** (6379) - Caching layer

### Monitoring Stack
- **Prometheus** (9090) - Metrics collection
- **Grafana** (3000) - Visualization dashboards

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)

**Linux/macOS:**
```bash
cd k8s
chmod +x deploy-all.sh
./deploy-all.sh
```

**Windows:**
```powershell
cd k8s
.\deploy-all.ps1
```

### Option 2: Manual Deployment

1. **Create namespaces:**
```bash
kubectl apply -f monitoring-namespace.yml
```

2. **Deploy configuration:**
```bash
kubectl apply -f configmap.yml
```

3. **Deploy Redis:**
```bash
kubectl apply -f redis.yml
```

4. **Deploy monitoring stack:**
```bash
kubectl apply -f prometheus.yml
kubectl apply -f grafana.yml
```

5. **Deploy microservices:**
```bash
kubectl apply -f auth-service.yml
kubectl apply -f api-gateway.yml
kubectl apply -f microservices.yml
```

6. **Deploy frontend:**
```bash
kubectl apply -f frontend.yml
```

## 🔍 Verification

Check deployment status:
```bash
# Check all pods
kubectl get pods -n anti-fraud-platform
kubectl get pods -n monitoring

# Check services
kubectl get services -n anti-fraud-platform
kubectl get services -n monitoring

# Check logs
kubectl logs -f deployment/api-gateway -n anti-fraud-platform
```

## 🌐 Access Applications

### Using NodePort (if supported)
- **API Gateway:** `http://<node-ip>:<nodeport>`
- **Grafana:** `http://<node-ip>:30300` (admin/admin123)
- **Prometheus:** `http://<node-ip>:30090`

### Using Port Forwarding
```bash
# Access Grafana
kubectl port-forward service/grafana 3000:3000 -n monitoring

# Access Prometheus
kubectl port-forward service/prometheus 9090:9090 -n monitoring

# Access API Gateway
kubectl port-forward service/api-gateway 8082:8082 -n anti-fraud-platform
```

## 📊 Monitoring Setup

### Prometheus Targets
1. Open Prometheus: `http://<cluster-ip>:30090`
2. Go to Status → Targets
3. Verify all services are being scraped

### Grafana Dashboards
1. Open Grafana: `http://<cluster-ip>:30300`
2. Login: admin/admin123
3. Import dashboards from `../monitoring/grafana/dashboards/`

## 🔧 Configuration

### Environment Variables
Edit `configmap.yml` to modify:
- Service URLs
- Redis configuration
- Node environment

### Secrets
Create secrets for sensitive data:
```bash
kubectl create secret generic app-secrets \
  --from-literal=FIREBASE_PROJECT_ID=your-project \
  --from-literal=FIREBASE_PRIVATE_KEY=your-key \
  --from-literal=FIREBASE_CLIENT_EMAIL=your-email \
  -n anti-fraud-platform
```

### Resource Limits
Adjust resource requests/limits in deployment files based on your cluster capacity.

## 🧹 Cleanup

**Automated cleanup:**
```bash
# Linux/macOS
./cleanup.sh

# Windows
.\cleanup.ps1
```

**Manual cleanup:**
```bash
kubectl delete namespace anti-fraud-platform
kubectl delete namespace monitoring
```

## 🐛 Troubleshooting

### Common Issues

1. **Pods stuck in Pending:**
   - Check resource availability: `kubectl describe nodes`
   - Check storage classes: `kubectl get storageclass`

2. **Services not accessible:**
   - Verify NodePort range (30000-32767)
   - Check firewall rules
   - Use port-forward as alternative

3. **Prometheus not scraping:**
   - Check service annotations
   - Verify network policies
   - Check Prometheus logs: `kubectl logs deployment/prometheus -n monitoring`

4. **Database connection issues:**
   - Ensure Redis is running: `kubectl get pods -n anti-fraud-platform | grep redis`
   - Check service DNS: `kubectl exec -it <pod> -- nslookup redis`

### Useful Commands

```bash
# Get all resources
kubectl get all -n anti-fraud-platform
kubectl get all -n monitoring

# Describe problematic pods
kubectl describe pod <pod-name> -n <namespace>

# Check events
kubectl get events -n anti-fraud-platform --sort-by='.lastTimestamp'

# Scale deployments
kubectl scale deployment <deployment-name> --replicas=3 -n anti-fraud-platform

# Update deployments
kubectl rollout restart deployment/<deployment-name> -n anti-fraud-platform
```

## 📝 Notes

- All services include Prometheus metrics endpoints
- Health checks are configured for all services
- Services use ClusterIP by default (internal communication)
- API Gateway uses LoadBalancer for external access
- Monitoring stack uses NodePort for easy access
