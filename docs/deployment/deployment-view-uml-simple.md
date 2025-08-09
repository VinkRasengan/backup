# Sơ Đồ Góc Nhìn Triển Khai - UML Deployment View (Đơn Giản)

## 🏗️ Sơ Đồ UML Deployment View

```plantuml
@startuml
title Anti-Fraud Platform - Deployment View

package "Client Layer" {
    [React SPA] as client
    [Mobile App] as mobile
    [Admin Panel] as admin
}

package "API Gateway" {
    [Kong/Nginx] as gateway
    note right of gateway
        Load Balancing
        Rate Limiting
        Authentication
        CORS
    end note
}

package "Microservices" {
    [Auth Service] as auth
    [Link Service] as link
    [Community Service] as community
    [Chat Service] as chat
    [News Service] as news
    [Admin Service] as admin_svc
    [CriminalIP Service] as criminalip
    [PhishTank Service] as phishtank
    [Analytics Service] as analytics
    [ETL Service] as etl
    [Spark Service] as spark
    [Event Bus Service] as eventbus
}

package "Data Layer" {
    [Firebase Firestore] as firestore
    [Redis Cache] as redis
    [Hadoop HDFS] as hdfs
    [Apache Spark] as spark_engine
}

package "Monitoring" {
    [Prometheus] as prometheus
    [Grafana] as grafana
    [Alertmanager] as alertmanager
}

package "Infrastructure" {
    [Docker] as docker
    [Kubernetes] as k8s
    [Helm] as helm
}

' Client connections
client --> gateway : HTTPS
mobile --> gateway : HTTPS
admin --> gateway : HTTPS

' Gateway to services
gateway --> auth : HTTP
gateway --> link : HTTP
gateway --> community : HTTP
gateway --> chat : HTTP
gateway --> news : HTTP
gateway --> admin_svc : HTTP
gateway --> criminalip : HTTP
gateway --> phishtank : HTTP
gateway --> analytics : HTTP
gateway --> etl : HTTP
gateway --> spark : HTTP
gateway --> eventbus : HTTP

' Event-driven connections
auth --> redis : Events
link --> redis : Events
community --> redis : Events
chat --> redis : Events
news --> redis : Events
admin_svc --> redis : Events
criminalip --> redis : Events
phishtank --> redis : Events
analytics --> redis : Events
etl --> redis : Events
spark --> redis : Events
eventbus --> redis : Events

' Data connections
auth --> firestore : CRUD
link --> firestore : CRUD
community --> firestore : CRUD
chat --> firestore : CRUD
news --> firestore : CRUD
admin_svc --> firestore : CRUD
criminalip --> firestore : CRUD
phishtank --> firestore : CRUD
analytics --> firestore : CRUD
etl --> firestore : CRUD
spark --> firestore : CRUD
eventbus --> firestore : CRUD

' Big data connections
etl --> hdfs : Data Pipeline
spark --> hdfs : Data Processing
spark --> spark_engine : Job Execution

' Monitoring connections
auth --> prometheus : Metrics
link --> prometheus : Metrics
community --> prometheus : Metrics
chat --> prometheus : Metrics
news --> prometheus : Metrics
admin_svc --> prometheus : Metrics
criminalip --> prometheus : Metrics
phishtank --> prometheus : Metrics
analytics --> prometheus : Metrics
etl --> prometheus : Metrics
spark --> prometheus : Metrics
eventbus --> prometheus : Metrics

prometheus --> grafana : Data Source
prometheus --> alertmanager : Alerts

' Infrastructure
docker --> k8s : Container Runtime
helm --> k8s : Package Management

@enduml
```

## 📊 Sơ Đồ Component View

```plantuml
@startuml
title Anti-Fraud Platform - Component View

package "Deployment Environment" {
    node "Load Balancer" {
        component "NGINX/Kong" as lb
    }
    
    node "API Gateway Cluster" {
        component "Express.js Gateway" as gateway1
        component "Express.js Gateway" as gateway2
        component "Express.js Gateway" as gateway3
    }
    
    node "Microservices Cluster" {
        package "Core Services" {
            component "Auth Service" as auth1
            component "Auth Service" as auth2
            component "Link Service" as link1
            component "Link Service" as link2
            component "Community Service" as comm1
            component "Community Service" as comm2
        }
        
        package "Security Services" {
            component "CriminalIP Service" as crim1
            component "CriminalIP Service" as crim2
            component "PhishTank Service" as phish1
            component "PhishTank Service" as phish2
        }
        
        package "Analytics Services" {
            component "Analytics Service" as anal1
            component "Analytics Service" as anal2
            component "ETL Service" as etl1
            component "ETL Service" as etl2
            component "Spark Service" as spark1
            component "Spark Service" as spark2
        }
    }
    
    node "Data Layer" {
        package "Primary Database" {
            component "Firebase Firestore" as firestore1
            component "Firebase Firestore" as firestore2
        }
        
        package "Cache & Sessions" {
            component "Redis Cache" as redis1
            component "Redis Cache" as redis2
            component "Redis Events" as redis_events
        }
        
        package "Big Data" {
            component "Hadoop NameNode" as namenode
            component "Hadoop DataNode" as datanode1
            component "Hadoop DataNode" as datanode2
            component "Spark Master" as spark_master
            component "Spark Worker" as spark_worker1
            component "Spark Worker" as spark_worker2
        }
    }
    
    node "Monitoring Stack" {
        component "Prometheus" as prom1
        component "Prometheus" as prom2
        component "Grafana" as grafana1
        component "Grafana" as grafana2
        component "Alertmanager" as alert1
        component "Alertmanager" as alert2
    }
}

' Load Balancer connections
lb --> gateway1 : HTTP/HTTPS
lb --> gateway2 : HTTP/HTTPS
lb --> gateway3 : HTTP/HTTPS

' Gateway to Services
gateway1 --> auth1 : HTTP
gateway1 --> auth2 : HTTP
gateway2 --> link1 : HTTP
gateway2 --> link2 : HTTP
gateway3 --> comm1 : HTTP
gateway3 --> comm2 : HTTP

' Event-driven communication
auth1 --> redis_events : Events
auth2 --> redis_events : Events
link1 --> redis_events : Events
link2 --> redis_events : Events
comm1 --> redis_events : Events
comm2 --> redis_events : Events

' Database connections
auth1 --> firestore1 : CRUD
auth2 --> firestore2 : CRUD
link1 --> firestore1 : CRUD
link2 --> firestore2 : CRUD
comm1 --> firestore1 : CRUD
comm2 --> firestore2 : CRUD

' Cache connections
auth1 --> redis1 : Cache
auth2 --> redis2 : Cache
link1 --> redis1 : Cache
link2 --> redis2 : Cache
comm1 --> redis1 : Cache
comm2 --> redis2 : Cache

' Big Data connections
etl1 --> namenode : Data Pipeline
etl2 --> namenode : Data Pipeline
spark1 --> spark_master : Job Submission
spark2 --> spark_master : Job Submission
spark_master --> spark_worker1 : Task Distribution
spark_master --> spark_worker2 : Task Distribution

' Monitoring connections
auth1 --> prom1 : Metrics
auth2 --> prom2 : Metrics
link1 --> prom1 : Metrics
link2 --> prom2 : Metrics
comm1 --> prom1 : Metrics
comm2 --> prom2 : Metrics

prom1 --> grafana1 : Data Source
prom2 --> grafana2 : Data Source
prom1 --> alert1 : Alerts
prom2 --> alert2 : Alerts

@enduml
```

## 🏗️ Sơ Đồ Sequence View

```plantuml
@startuml
title Anti-Fraud Platform - Sequence View

actor User as user
participant "React SPA" as client
participant "API Gateway" as gateway
participant "Auth Service" as auth
participant "Link Service" as link
participant "Redis Cache" as redis
participant "Firebase Firestore" as firestore
participant "Prometheus" as prometheus

user -> client : Access application
client -> gateway : Request authentication
gateway -> auth : Validate token
auth -> redis : Check session
redis -> auth : Session valid
auth -> gateway : Token valid
gateway -> client : Authenticated response

user -> client : Submit URL for analysis
client -> gateway : POST /api/links/analyze
gateway -> link : Forward request
link -> redis : Check cache
redis -> link : Cache miss
link -> firestore : Store link data
firestore -> link : Data stored
link -> redis : Cache result
redis -> link : Cached
link -> gateway : Analysis result
gateway -> client : Response
client -> user : Display result

link -> prometheus : Record metrics
prometheus -> prometheus : Store metrics

@enduml
```

## 🛠️ Bảng Công Nghệ Chi Tiết

| **Layer** | **Technology** | **Version** | **Purpose** | **Deployment** |
|-----------|----------------|-------------|-------------|----------------|
| **Client** | React | 18.x | SPA Frontend | CDN/Static Hosting |
| **Client** | React Native | 0.72.x | Mobile App | App Stores |
| **API Gateway** | Kong | 3.4.x | API Gateway | Kubernetes |
| **API Gateway** | Express.js | 4.18.x | Custom Gateway | Kubernetes |
| **Core Services** | Node.js | 18.x LTS | Runtime | Docker + K8s |
| **Security** | JWT | 9.0.x | Authentication | Embedded |
| **Security** | OAuth 2.0 | - | Authorization | External |
| **Message Broker** | Redis | 7.2.x | Cache + Events | Docker + K8s |
| **Message Broker** | RabbitMQ | 3.12.x | Message Queue | Docker + K8s |
| **Database** | Firebase Firestore | - | Primary DB | Cloud |
| **Database** | Firebase Auth | - | Authentication | Cloud |
| **Database** | Firebase Storage | - | File Storage | Cloud |
| **Big Data** | Hadoop | 3.3.x | Distributed Storage | Docker + K8s |
| **Big Data** | Apache Spark | 3.4.x | Data Processing | Docker + K8s |
| **Monitoring** | Prometheus | 2.45.x | Metrics Collection | Docker + K8s |
| **Monitoring** | Grafana | 10.0.x | Visualization | Docker + K8s |
| **Monitoring** | Alertmanager | 0.25.x | Alert Management | Docker + K8s |
| **Monitoring** | Jaeger | 1.47.x | Distributed Tracing | Docker + K8s |
| **Container** | Docker | 24.x | Containerization | Host |
| **Orchestration** | Kubernetes | 1.28.x | Container Orchestration | Host |
| **Package Manager** | Helm | 3.12.x | K8s Package Manager | Host |
| **Infrastructure** | Terraform | 1.5.x | Infrastructure as Code | CI/CD |
| **CI/CD** | GitHub Actions | - | CI/CD Pipeline | Cloud |
| **CI/CD** | ArgoCD | 2.8.x | GitOps | Docker + K8s |
| **Security** | Let's Encrypt | - | SSL Certificates | External |
| **Security** | CORS | - | Cross-origin | Embedded |

## 📋 Deployment Configuration

### **Kubernetes Resources**
- **Namespaces**: `anti-fraud-platform`
- **Replicas**: 2-3 per service
- **Resource Limits**: 
  - CPU: 500m-1000m
  - Memory: 512Mi-1Gi
- **Health Checks**: Liveness + Readiness probes
- **Auto-scaling**: HPA based on CPU/Memory

### **Network Configuration**
- **Service Mesh**: Istio (optional)
- **Load Balancing**: Round-robin
- **Ingress**: NGINX Ingress Controller
- **SSL/TLS**: Let's Encrypt certificates

### **Storage Configuration**
- **Persistent Volumes**: For stateful services
- **ConfigMaps**: Application configuration
- **Secrets**: Sensitive data (JWT, API keys)
- **Volumes**: Shared storage for logs

### **Monitoring Configuration**
- **Metrics Endpoint**: `/metrics` (Prometheus format)
- **Health Endpoint**: `/health`
- **Logging**: Structured JSON logs
- **Tracing**: OpenTelemetry integration

## 🔄 Deployment Flow

```mermaid
graph TD
    A[Source Code] --> B[GitHub Repository]
    B --> C[GitHub Actions]
    C --> D[Build Docker Images]
    D --> E[Push to Registry]
    E --> F[ArgoCD Detection]
    F --> G[Deploy to Kubernetes]
    G --> H[Service Discovery]
    H --> I[Load Balancer Update]
    I --> J[Health Checks]
    J --> K[Traffic Routing]
    K --> L[Monitoring Setup]
    L --> M[Production Ready]
```

## 🚀 Scaling Strategy

### **Horizontal Scaling**
- **Auto-scaling**: Based on CPU/Memory usage
- **Load Distribution**: Round-robin across replicas
- **Database Scaling**: Read replicas + sharding
- **Cache Scaling**: Redis cluster

### **Vertical Scaling**
- **Resource Optimization**: CPU/Memory limits
- **Performance Tuning**: JVM/Node.js optimization
- **Database Optimization**: Query optimization + indexing

## 🔒 Security Architecture

### **Network Security**
- **VPC Isolation**: Private subnets
- **Network Policies**: Pod-to-pod communication
- **SSL/TLS**: End-to-end encryption
- **API Security**: Rate limiting + authentication

### **Application Security**
- **Input Validation**: Request sanitization
- **Authentication**: JWT + OAuth 2.0
- **Authorization**: RBAC implementation
- **Audit Logging**: Security event tracking

## 📊 Performance Metrics

### **Key Performance Indicators**
- **Response Time**: < 200ms (95th percentile)
- **Throughput**: > 1000 req/sec per service
- **Availability**: > 99.9% uptime
- **Error Rate**: < 0.1%

### **Resource Utilization**
- **CPU Usage**: < 70% average
- **Memory Usage**: < 80% average
- **Disk I/O**: Optimized for workload
- **Network**: Bandwidth monitoring
