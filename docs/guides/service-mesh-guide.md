# Service Mesh Implementation Guide

This guide provides comprehensive instructions for implementing service mesh solutions for the Anti-Fraud Platform microservices architecture.

## Overview

A service mesh provides infrastructure layer for service-to-service communication, offering features like:
- **Traffic Management**: Load balancing, routing, traffic splitting
- **Security**: mTLS, authentication, authorization policies
- **Observability**: Metrics, logging, distributed tracing
- **Resilience**: Circuit breaking, retries, timeouts

## Service Mesh Options

### 1. Istio (Recommended for Production)

**Pros:**
- ✅ Comprehensive feature set
- ✅ Strong security with automatic mTLS
- ✅ Advanced traffic management
- ✅ Excellent observability
- ✅ Large community and ecosystem

**Cons:**
- ❌ Complex setup and configuration
- ❌ Higher resource overhead
- ❌ Steep learning curve

**Best for:** Production environments, complex microservices, enterprise requirements

### 2. Consul Connect (Recommended for Simplicity)

**Pros:**
- ✅ Simpler setup and configuration
- ✅ Lower resource overhead
- ✅ Good integration with existing Consul deployments
- ✅ Multi-platform support

**Cons:**
- ❌ Less comprehensive than Istio
- ❌ Smaller ecosystem
- ❌ Limited advanced features

**Best for:** Smaller deployments, existing Consul users, simpler requirements

## Deployment Instructions

### Option 1: Istio Deployment

#### Prerequisites
```bash
# Install Istio CLI
curl -L https://istio.io/downloadIstio | sh -
export PATH=$PWD/istio-*/bin:$PATH

# Verify Kubernetes cluster
kubectl cluster-info
```

#### Installation Steps

1. **Install Istio**
```bash
# Install Istio with demo profile
istioctl install --set values.defaultRevision=default

# Enable automatic sidecar injection
kubectl label namespace antifraud istio-injection=enabled
```

2. **Deploy Configuration**
```bash
# Apply Istio configuration
kubectl apply -f k8s/service-mesh/istio-config.yaml

# Verify installation
kubectl get pods -n istio-system
kubectl get pods -n antifraud
```

3. **Deploy Services with Istio**
```bash
# Deploy services (they will automatically get sidecars)
kubectl apply -f k8s/deployments/
```

4. **Configure Observability**
```bash
# Install Kiali, Jaeger, Prometheus, Grafana
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/kiali.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/jaeger.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/grafana.yaml
```

5. **Access Dashboards**
```bash
# Kiali Dashboard
istioctl dashboard kiali

# Jaeger Tracing
istioctl dashboard jaeger

# Grafana Metrics
istioctl dashboard grafana
```

### Option 2: Consul Connect Deployment

#### Prerequisites
```bash
# Install Consul CLI
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install consul
```

#### Installation Steps

1. **Deploy Consul Server**
```bash
# Create namespace
kubectl create namespace antifraud

# Deploy Consul
kubectl apply -f k8s/service-mesh/consul-connect-config.yaml
```

2. **Verify Consul Installation**
```bash
# Check Consul pods
kubectl get pods -n antifraud -l app=consul-server

# Port forward to access UI
kubectl port-forward -n antifraud svc/consul-server 8500:8500
# Access UI at http://localhost:8500
```

3. **Deploy Services with Connect**
```bash
# Services will automatically get Connect sidecars
kubectl apply -f k8s/deployments/
```

## Configuration Examples

### Traffic Management

#### Canary Deployment (Istio)
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: auth-service-canary
spec:
  hosts:
  - auth-service
  http:
  - match:
    - headers:
        x-canary: {exact: "true"}
    route:
    - destination:
        host: auth-service
        subset: v2
  - route:
    - destination:
        host: auth-service
        subset: v1
      weight: 90
    - destination:
        host: auth-service
        subset: v2
      weight: 10
```

#### Circuit Breaking (Istio)
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: auth-service-cb
spec:
  host: auth-service
  trafficPolicy:
    circuitBreaker:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
```

### Security Policies

#### mTLS Policy (Istio)
```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT
```

#### Authorization Policy (Istio)
```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: auth-service-policy
spec:
  selector:
    matchLabels:
      app: auth-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/antifraud/sa/api-gateway"]
```

## Monitoring and Observability

### Key Metrics to Monitor

1. **Service Metrics**
   - Request rate (RPS)
   - Error rate (%)
   - Response time (P50, P95, P99)
   - Success rate (%)

2. **Infrastructure Metrics**
   - CPU and memory usage
   - Network latency
   - Connection pool utilization
   - Circuit breaker status

3. **Security Metrics**
   - mTLS certificate status
   - Authorization policy violations
   - Failed authentication attempts

### Dashboards

#### Istio Dashboards
- **Kiali**: Service topology and traffic flow
- **Jaeger**: Distributed tracing
- **Grafana**: Metrics and performance
- **Prometheus**: Raw metrics and alerting

#### Consul Connect Dashboards
- **Consul UI**: Service discovery and health
- **Prometheus**: Metrics collection
- **Grafana**: Custom dashboards

## Troubleshooting

### Common Issues

1. **Sidecar Injection Not Working**
```bash
# Check namespace labels
kubectl get namespace antifraud --show-labels

# Check injection status
kubectl get pods -n antifraud -o jsonpath='{.items[*].spec.containers[*].name}'
```

2. **mTLS Issues**
```bash
# Check certificates (Istio)
istioctl proxy-config secret <pod-name> -n antifraud

# Check service intentions (Consul)
consul intention check auth-service api-gateway
```

3. **Traffic Not Routing**
```bash
# Check virtual services (Istio)
kubectl get virtualservices -n antifraud

# Check service configuration (Consul)
consul catalog services
```

### Debug Commands

#### Istio
```bash
# Check proxy configuration
istioctl proxy-config cluster <pod-name> -n antifraud

# Check listeners
istioctl proxy-config listener <pod-name> -n antifraud

# Check routes
istioctl proxy-config route <pod-name> -n antifraud

# Analyze configuration
istioctl analyze -n antifraud
```

#### Consul Connect
```bash
# Check service registration
consul catalog services

# Check service health
consul health service auth-service

# Check intentions
consul intention list

# Check proxy configuration
consul connect proxy-config auth-service
```

## Performance Considerations

### Resource Requirements

#### Istio
- **Control Plane**: 2 CPU, 4GB RAM minimum
- **Sidecar Proxy**: 100m CPU, 128MB RAM per pod
- **Additional Overhead**: ~10-15% latency, ~5-10% CPU

#### Consul Connect
- **Consul Server**: 1 CPU, 2GB RAM minimum
- **Sidecar Proxy**: 50m CPU, 64MB RAM per pod
- **Additional Overhead**: ~5-10% latency, ~3-5% CPU

### Optimization Tips

1. **Reduce Sidecar Resources**
```yaml
# Istio sidecar resource limits
annotations:
  sidecar.istio.io/proxyCPU: "100m"
  sidecar.istio.io/proxyMemory: "128Mi"
```

2. **Optimize Telemetry**
```yaml
# Reduce telemetry collection
telemetry:
  v2:
    prometheus:
      configOverride:
        metric_relabeling_configs:
        - source_labels: [__name__]
          regex: 'istio_request_duration_milliseconds_bucket'
          action: drop
```

3. **Use Resource Quotas**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: service-mesh-quota
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
```

## Migration Strategy

### Phase 1: Preparation
1. Set up monitoring and observability
2. Create service mesh configuration
3. Test in development environment

### Phase 2: Gradual Rollout
1. Start with non-critical services
2. Enable sidecar injection per service
3. Monitor performance and stability

### Phase 3: Full Deployment
1. Enable mesh for all services
2. Configure security policies
3. Implement advanced traffic management

### Phase 4: Optimization
1. Fine-tune performance settings
2. Implement custom policies
3. Set up alerting and automation

## Conclusion

Choose the service mesh solution based on your requirements:

- **Use Istio** for comprehensive features, enterprise requirements, and complex traffic management needs
- **Use Consul Connect** for simpler deployments, lower overhead, and existing Consul infrastructure

Both solutions provide significant benefits for microservices communication, security, and observability.
