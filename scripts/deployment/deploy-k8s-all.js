#!/usr/bin/env node

/**
 * Deploy K8s All - Comprehensive Kubernetes Deployment Script
 * Deploys all services and client to Kubernetes cluster
 */

import { exec, spawn  } from 'child_process';
import path from 'path';
import fs from 'fs';

class KubernetesDeployment {
  constructor() {
    this.rootDir = process.cwd();
    this.namespace = 'factcheck-local';
    this.k8sDir = path.join(this.rootDir, 'k8s');
    this.services = [
      { name: 'redis', manifest: 'redis-local.yml', port: 6379 },
      { name: 'auth-service', manifest: 'auth-service-local.yml', port: 3001 },
      { name: 'link-service', manifest: 'link-service-local.yml', port: 3002 },
      { name: 'community-service', manifest: 'community-service-local.yml', port: 3003 },
      { name: 'chat-service', manifest: 'chat-service-local.yml', port: 3004 },
      { name: 'news-service', manifest: 'news-service-local.yml', port: 3005 },
      { name: 'admin-service', manifest: 'admin-service-local.yml', port: 3006 },
      { name: 'api-gateway', manifest: 'api-gateway-local.yml', port: 8080 },
      { name: 'client', manifest: 'client-local.yml', port: 3000 }
    ];
  }

  /**
   * Main deployment function
   */
  async deploy() {
    console.log('☸️  Starting Kubernetes Deployment - All Services & Client');
    console.log('=' .repeat(60));

    try {
      await this.checkPrerequisites();
      await this.createNamespace();
      await this.createManifests();
      await this.buildAndPushImages();
      await this.deployServices();
      await this.setupIngress();
      await this.healthCheck();
      this.showSummary();
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check Kubernetes prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking Kubernetes prerequisites...');
    
    try {
      // Check kubectl
      const kubectlVersion = await this.execAsync('kubectl version --client --short');
      console.log(`  ✅ kubectl: ${kubectlVersion.trim()}`);
      
      // Check cluster connection
      const clusterInfo = await this.execAsync('kubectl cluster-info');
      console.log('  ✅ Kubernetes cluster is accessible');
      
      // Check Docker (for building images)
      const dockerVersion = await this.execAsync('docker --version');
      console.log(`  ✅ Docker: ${dockerVersion.trim()}`);
      
    } catch (error) {
      throw new Error('kubectl, Docker, or Kubernetes cluster not available. Please check your setup.');
    }

    console.log('✅ Prerequisites check passed');
  }

  /**
   * Create namespace
   */
  async createNamespace() {
    console.log('🏗️  Creating namespace...');
    
    try {
      // Check if namespace exists
      await this.execAsync(`kubectl get namespace ${this.namespace}`);
      console.log(`  ✅ Namespace ${this.namespace} already exists`);
    } catch (error) {
      // Create namespace
      await this.execAsync(`kubectl create namespace ${this.namespace}`);
      console.log(`  ✅ Created namespace ${this.namespace}`);
    }
  }

  /**
   * Create Kubernetes manifests
   */
  async createManifests() {
    console.log('📝 Creating Kubernetes manifests...');
    
    if (!fs.existsSync(this.k8sDir)) {
      fs.mkdirSync(this.k8sDir, { recursive: true });
    }

    // Create ConfigMap
    await this.createConfigMap();
    
    // Create service manifests
    for (const service of this.services) {
      await this.createServiceManifest(service);
    }
    
    console.log('✅ Kubernetes manifests created');
  }

  /**
   * Create ConfigMap for shared configuration
   */
  async createConfigMap() {
    const configMapContent = `apiVersion: v1
kind: ConfigMap
metadata:
  name: factcheck-config
  namespace: ${this.namespace}
data:
  NODE_ENV: "development"
  REDIS_HOST: "redis-service"
  REDIS_PASSWORD: "antifraud123"
  AUTH_SERVICE_URL: "http://auth-service:3001"
  LINK_SERVICE_URL: "http://link-service:3002"
  COMMUNITY_SERVICE_URL: "http://community-service:3003"
  CHAT_SERVICE_URL: "http://chat-service:3004"
  NEWS_SERVICE_URL: "http://news-service:3005"
  ADMIN_SERVICE_URL: "http://admin-service:3006"
  API_GATEWAY_URL: "http://api-gateway:8080"
  REACT_APP_API_URL: "http://localhost:8080"
`;

    const configMapPath = path.join(this.k8sDir, 'configmap-local.yml');
    fs.writeFileSync(configMapPath, configMapContent);
    console.log('  ✅ Created ConfigMap manifest');
  }

  /**
   * Create service manifest
   */
  async createServiceManifest(service) {
    let manifestContent;
    
    if (service.name === 'redis') {
      manifestContent = this.createRedisManifest(service);
    } else if (service.name === 'client') {
      manifestContent = this.createClientManifest(service);
    } else {
      manifestContent = this.createMicroserviceManifest(service);
    }

    const manifestPath = path.join(this.k8sDir, service.manifest);
    fs.writeFileSync(manifestPath, manifestContent);
    console.log(`  ✅ Created ${service.name} manifest`);
  }

  /**
   * Create Redis manifest
   */
  createRedisManifest(service) {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: ${this.namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command: ["redis-server", "--requirepass", "antifraud123", "--appendonly", "yes"]
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: ${this.namespace}
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
`;
  }

  /**
   * Create microservice manifest
   */
  createMicroserviceManifest(service) {
    const serviceName = service.name;
    const port = service.port;
    
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${serviceName}
  namespace: ${this.namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${serviceName}
  template:
    metadata:
      labels:
        app: ${serviceName}
    spec:
      containers:
      - name: ${serviceName}
        image: ${serviceName}:local
        imagePullPolicy: Never
        ports:
        - containerPort: ${port}
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: factcheck-config
              key: NODE_ENV
        - name: PORT
          value: "${port}"
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: factcheck-config
              key: REDIS_HOST
        - name: REDIS_PASSWORD
          valueFrom:
            configMapKeyRef:
              name: factcheck-config
              key: REDIS_PASSWORD
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
            port: ${port}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: ${port}
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ${serviceName}
  namespace: ${this.namespace}
spec:
  selector:
    app: ${serviceName}
  ports:
  - port: ${port}
    targetPort: ${port}
  type: ClusterIP
`;
  }

  /**
   * Create client manifest
   */
  createClientManifest(service) {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: client
  namespace: ${this.namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: client
  template:
    metadata:
      labels:
        app: client
    spec:
      containers:
      - name: client
        image: client:local
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: factcheck-config
              key: NODE_ENV
        - name: PORT
          value: "3000"
        - name: REACT_APP_API_URL
          valueFrom:
            configMapKeyRef:
              name: factcheck-config
              key: REACT_APP_API_URL
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: client
  namespace: ${this.namespace}
spec:
  selector:
    app: client
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
`;
  }

  /**
   * Build and push images to local registry
   */
  async buildAndPushImages() {
    console.log('🔨 Building Docker images for Kubernetes...');
    
    const imagesToBuild = this.services.filter(s => s.name !== 'redis');
    
    for (const service of imagesToBuild) {
      console.log(`  🔨 Building ${service.name}:local...`);
      
      const contextPath = service.name === 'client' ? 
        path.join(this.rootDir, 'client') : 
        path.join(this.rootDir, 'services', service.name);
      
      try {
        await this.execAsync(`docker build -t ${service.name}:local ${contextPath}`);
        console.log(`  ✅ Built ${service.name}:local`);
      } catch (error) {
        console.error(`  ❌ Failed to build ${service.name}:`, error.message);
        throw error;
      }
    }
    
    console.log('✅ All images built successfully');
  }

  /**
   * Deploy services to Kubernetes
   */
  async deployServices() {
    console.log('🚀 Deploying services to Kubernetes...');
    
    // Apply ConfigMap first
    const configMapPath = path.join(this.k8sDir, 'configmap-local.yml');
    await this.execAsync(`kubectl apply -f ${configMapPath}`);
    console.log('  ✅ Applied ConfigMap');
    
    // Deploy services in order
    for (const service of this.services) {
      const manifestPath = path.join(this.k8sDir, service.manifest);
      await this.execAsync(`kubectl apply -f ${manifestPath}`);
      console.log(`  ✅ Deployed ${service.name}`);
      
      // Wait a bit between deployments
      await this.sleep(2000);
    }
    
    console.log('✅ All services deployed');
  }

  /**
   * Setup ingress for external access
   */
  async setupIngress() {
    console.log('🌐 Setting up ingress...');
    
    const ingressContent = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: factcheck-ingress
  namespace: ${this.namespace}
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: localhost
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: client
            port:
              number: 3000
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 8080
`;

    const ingressPath = path.join(this.k8sDir, 'ingress-local.yml');
    fs.writeFileSync(ingressPath, ingressContent);
    
    try {
      await this.execAsync(`kubectl apply -f ${ingressPath}`);
      console.log('  ✅ Ingress configured');
    } catch (error) {
      console.log('  ⚠️  Ingress setup failed (might not be available in local cluster)');
    }
  }

  /**
   * Perform health check
   */
  async healthCheck() {
    console.log('🏥 Performing health checks...');
    
    // Wait for deployments to be ready
    console.log('  ⏱️  Waiting for deployments to be ready...');
    
    for (const service of this.services) {
      try {
        await this.execAsync(`kubectl wait --for=condition=available --timeout=300s deployment/${service.name} -n ${this.namespace}`);
        console.log(`  ✅ ${service.name} deployment is ready`);
      } catch (error) {
        console.log(`  ⚠️  ${service.name} deployment might still be starting`);
      }
    }
    
    console.log('✅ Health checks completed');
  }

  /**
   * Show deployment summary
   */
  showSummary() {
    console.log('\n🎉 Kubernetes Deployment Completed!');
    console.log('=' .repeat(60));
    
    console.log('☸️  Cluster Information:');
    console.log(`  Namespace: ${this.namespace}`);
    
    console.log('\n📋 Deployed Services:');
    this.services.forEach(service => {
      console.log(`  ${service.name.padEnd(20)} Port: ${service.port}`);
    });
    
    console.log('\n📝 Management Commands:');
    console.log(`  View pods:        kubectl get pods -n ${this.namespace}`);
    console.log(`  View services:    kubectl get services -n ${this.namespace}`);
    console.log(`  View logs:        kubectl logs -f deployment/<service-name> -n ${this.namespace}`);
    console.log(`  Port forward:     kubectl port-forward service/<service-name> <local-port>:<service-port> -n ${this.namespace}`);
    console.log(`  Delete all:       kubectl delete namespace ${this.namespace}`);
    
    console.log('\n🌐 Access Services:');
    console.log('  Use port forwarding to access services:');
    console.log(`  kubectl port-forward service/client 3000:3000 -n ${this.namespace}`);
    console.log(`  kubectl port-forward service/api-gateway 8080:8080 -n ${this.namespace}`);
    
    console.log('\n💡 Tips:');
    console.log('  - Services run in isolated pods');
    console.log('  - Use kubectl to monitor and manage deployments');
    console.log('  - Check pod logs if services fail to start');
    console.log('  - Scale deployments with: kubectl scale deployment <name> --replicas=<count>');
  }

  /**
   * Utility functions
   */
  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run deployment
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const deployment = new KubernetesDeployment();
  deployment.deploy().catch(console.error);
}

export default KubernetesDeployment;
