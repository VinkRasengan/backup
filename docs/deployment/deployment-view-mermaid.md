# Sơ Đồ Góc Nhìn Triển Khai - Mermaid Deployment View

## 🏗️ Sơ Đồ Kiến Trúc Tổng Quan

```mermaid
graph TB
    subgraph "Client Layer"
        A[React SPA]
        B[Mobile App]
        C[Admin Panel]
    end
    
    subgraph "API Gateway"
        D[Kong/Nginx]
        E[Express.js Gateway]
    end
    
    subgraph "Microservices"
        F[Auth Service]
        G[Link Service]
        H[Community Service]
        I[Chat Service]
        J[News Service]
        K[Admin Service]
        L[CriminalIP Service]
        M[PhishTank Service]
        N[Analytics Service]
        O[ETL Service]
        P[Spark Service]
        Q[Event Bus Service]
    end
    
    subgraph "Data Layer"
        R[Firebase Firestore]
        S[Redis Cache]
        T[Hadoop HDFS]
        U[Apache Spark]
    end
    
    subgraph "Monitoring"
        V[Prometheus]
        W[Grafana]
        X[Alertmanager]
    end
    
    subgraph "Infrastructure"
        Y[Docker]
        Z[Kubernetes]
        AA[Helm]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
    E --> M
    E --> N
    E --> O
    E --> P
    E --> Q
    
    F --> S
    G --> S
    H --> S
    I --> S
    J --> S
    K --> S
    L --> S
    M --> S
    N --> S
    O --> S
    P --> S
    Q --> S
    
    F --> R
    G --> R
    H --> R
    I --> R
    J --> R
    K --> R
    L --> R
    M --> R
    N --> R
    O --> R
    P --> R
    Q --> R
    
    O --> T
    P --> T
    P --> U
    
    F --> V
    G --> V
    H --> V
    I --> V
    J --> V
    K --> V
    L --> V
    M --> V
    N --> V
    O --> V
    P --> V
    Q --> V
    
    V --> W
    V --> X
    
    Y --> Z
    AA --> Z
```

## 📊 Sơ Đồ Component View

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX/Kong]
    end
    
    subgraph "API Gateway Cluster"
        AG1[Express.js Gateway 1]
        AG2[Express.js Gateway 2]
        AG3[Express.js Gateway 3]
    end
    
    subgraph "Core Services"
        A1[Auth Service 1]
        A2[Auth Service 2]
        L1[Link Service 1]
        L2[Link Service 2]
        C1[Community Service 1]
        C2[Community Service 2]
    end
    
    subgraph "Security Services"
        CR1[CriminalIP Service 1]
        CR2[CriminalIP Service 2]
        PH1[PhishTank Service 1]
        PH2[PhishTank Service 2]
    end
    
    subgraph "Analytics Services"
        AN1[Analytics Service 1]
        AN2[Analytics Service 2]
        ETL1[ETL Service 1]
        ETL2[ETL Service 2]
        SP1[Spark Service 1]
        SP2[Spark Service 2]
    end
    
    subgraph "Data Layer"
        DB1[Firebase Firestore 1]
        DB2[Firebase Firestore 2]
        RC1[Redis Cache 1]
        RC2[Redis Cache 2]
        RE[Redis Events]
        HD[Hadoop HDFS]
        AS[Apache Spark]
    end
    
    subgraph "Monitoring Stack"
        PM1[Prometheus 1]
        PM2[Prometheus 2]
        GF1[Grafana 1]
        GF2[Grafana 2]
        AM1[Alertmanager 1]
        AM2[Alertmanager 2]
    end
    
    LB --> AG1
    LB --> AG2
    LB --> AG3
    
    AG1 --> A1
    AG1 --> A2
    AG2 --> L1
    AG2 --> L2
    AG3 --> C1
    AG3 --> C2
    
    A1 --> RE
    A2 --> RE
    L1 --> RE
    L2 --> RE
    C1 --> RE
    C2 --> RE
    
    A1 --> DB1
    A2 --> DB2
    L1 --> DB1
    L2 --> DB2
    C1 --> DB1
    C2 --> DB2
    
    A1 --> RC1
    A2 --> RC2
    L1 --> RC1
    L2 --> RC2
    C1 --> RC1
    C2 --> RC2
    
    ETL1 --> HD
    ETL2 --> HD
    SP1 --> AS
    SP2 --> AS
    
    A1 --> PM1
    A2 --> PM2
    L1 --> PM1
    L2 --> PM2
    C1 --> PM1
    C2 --> PM2
    
    PM1 --> GF1
    PM2 --> GF2
    PM1 --> AM1
    PM2 --> AM2
```

## 🏗️ Sơ Đồ Sequence View

```mermaid
sequenceDiagram
    participant U as User
    participant C as React SPA
    participant G as API Gateway
    participant A as Auth Service
    participant L as Link Service
    participant R as Redis Cache
    participant F as Firebase Firestore
    participant P as Prometheus
    
    U->>C: Access application
    C->>G: Request authentication
    G->>A: Validate token
    A->>R: Check session
    R->>A: Session valid
    A->>G: Token valid
    G->>C: Authenticated response
    
    U->>C: Submit URL for analysis
    C->>G: POST /api/links/analyze
    G->>L: Forward request
    L->>R: Check cache
    R->>L: Cache miss
    L->>F: Store link data
    F->>L: Data stored
    L->>R: Cache result
    R->>L: Cached
    L->>G: Analysis result
    G->>C: Response
    C->>U: Display result
    
    L->>P: Record metrics
    P->>P: Store metrics
```

## 🔄 Sơ Đồ Deployment Flow

```mermaid
flowchart TD
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
    
    style A fill:#e1f5fe
    style M fill:#c8e6c9
    style C fill:#fff3e0
    style G fill:#f3e5f5
```

## 🚀 Sơ Đồ Scaling Strategy

```mermaid
graph LR
    subgraph "Horizontal Scaling"
        HS1[Auto-scaling]
        HS2[Load Distribution]
        HS3[Database Scaling]
        HS4[Cache Scaling]
    end
    
    subgraph "Vertical Scaling"
        VS1[Resource Optimization]
        VS2[Performance Tuning]
        VS3[Database Optimization]
    end
    
    subgraph "Triggers"
        T1[CPU Usage > 70%]
        T2[Memory Usage > 80%]
        T3[Response Time > 200ms]
        T4[Error Rate > 0.1%]
    end
    
    T1 --> HS1
    T2 --> HS1
    T3 --> HS2
    T4 --> VS1
    
    HS1 --> HS2
    HS2 --> HS3
    HS3 --> HS4
    
    VS1 --> VS2
    VS2 --> VS3
```

## 🔒 Sơ Đồ Security Architecture

```mermaid
graph TB
    subgraph "Network Security"
        NS1[VPC Isolation]
        NS2[Network Policies]
        NS3[SSL/TLS]
        NS4[API Security]
    end
    
    subgraph "Application Security"
        AS1[Input Validation]
        AS2[JWT + OAuth 2.0]
        AS3[RBAC]
        AS4[Audit Logging]
    end
    
    subgraph "Infrastructure Security"
        IS1[Container Security]
        IS2[Secrets Management]
        IS3[Network Policies]
        IS4[Monitoring]
    end
    
    NS1 --> NS2
    NS2 --> NS3
    NS3 --> NS4
    
    AS1 --> AS2
    AS2 --> AS3
    AS3 --> AS4
    
    IS1 --> IS2
    IS2 --> IS3
    IS3 --> IS4
    
    NS4 --> AS1
    AS4 --> IS4
```

## 📊 Sơ Đồ Performance Metrics

```mermaid
graph LR
    subgraph "Key Performance Indicators"
        KPI1[Response Time < 200ms]
        KPI2[Throughput > 1000 req/sec]
        KPI3[Availability > 99.9%]
        KPI4[Error Rate < 0.1%]
    end
    
    subgraph "Resource Utilization"
        RU1[CPU Usage < 70%]
        RU2[Memory Usage < 80%]
        RU3[Disk I/O Optimized]
        RU4[Network Monitoring]
    end
    
    subgraph "Monitoring Tools"
        MT1[Prometheus]
        MT2[Grafana]
        MT3[Alertmanager]
        MT4[Jaeger]
    end
    
    KPI1 --> MT1
    KPI2 --> MT1
    KPI3 --> MT2
    KPI4 --> MT3
    
    RU1 --> MT1
    RU2 --> MT1
    RU3 --> MT2
    RU4 --> MT4
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
