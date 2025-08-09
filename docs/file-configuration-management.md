# 🔧 Quản Lý Cấu Hình File - Hệ Thống Microservices

## 📋 Tổng Quan

Tài liệu này mô tả chi tiết về hệ thống quản lý cấu hình file trong dự án Anti-Fraud Platform, một kiến trúc microservices với nhiều service độc lập.

## 🏗️ Kiến Trúc Cấu Hình

### **Nguyên Tắc Thiết Kế**

1. **Service Isolation**: Mỗi service có cấu hình riêng biệt
2. **Principle of Least Privilege**: Service chỉ có quyền truy cập vào cấu hình cần thiết
3. **Environment Separation**: Phân tách rõ ràng giữa development, staging, production
4. **Security First**: Bảo vệ thông tin nhạy cảm thông qua secrets management

### **Cấu Trúc Thư Mục**

```
📁 project-root/
├── 📄 .env                          # Cấu hình chung tối thiểu
├── 📁 config/                       # Cấu hình chia sẻ
│   ├── 📄 logging.yml              # Cấu hình logging
│   ├── 📁 hadoop/                  # Cấu hình Hadoop
│   └── 📁 spark/                   # Cấu hình Spark
├── 📁 client/                       # Frontend React
│   └── 📄 .env                     # Cấu hình client
└── 📁 services/                     # Microservices
    ├── 📁 auth-service/
    │   ├── 📄 .env                 # Cấu hình Auth Service
    │   └── 📄 .env.production      # Cấu hình production
    ├── 📁 chat-service/
    │   └── 📄 .env                 # Cấu hình Chat Service
    ├── 📁 link-service/
    │   └── 📄 .env                 # Cấu hình Link Service
    └── 📁 [other-services]/
        └── 📄 .env                 # Cấu hình tương ứng
```

## 🔐 Cấu Hình Service-Specific

### **1. Auth Service** (`services/auth-service/.env`)

```bash
# =============================================================================
# AUTH SERVICE - ENVIRONMENT CONFIGURATION
# =============================================================================
SERVICE_NAME=auth-service
AUTH_SERVICE_PORT=3001

# Firebase Configuration
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
[private key content]
-----END PRIVATE KEY-----

# JWT Configuration
JWT_SECRET=microservices_factcheck_platform_secret_key_development_2024_very_long_secure_key
```

### **2. Chat Service** (`services/chat-service/.env`)

```bash
# =============================================================================
# CHAT SERVICE - ENVIRONMENT CONFIGURATION
# =============================================================================
SERVICE_NAME=chat-service
CHAT_SERVICE_PORT=3004

# Firebase Configuration (shared)
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=[private key]

# JWT Configuration (shared)
JWT_SECRET=[jwt secret]

# AI Configuration (service-specific)
GEMINI_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
```

### **3. Link Service** (`services/link-service/.env`)

```bash
# =============================================================================
# LINK SERVICE - ENVIRONMENT CONFIGURATION
# =============================================================================
SERVICE_NAME=link-service
LINK_SERVICE_PORT=3002

# Firebase Configuration (shared)
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=[private key]

# JWT Configuration (shared)
JWT_SECRET=[jwt secret]

# Security APIs (service-specific)
VIRUSTOTAL_API_KEY=c4f8f7b8a8b9c8d9e8f9g8h9i8j9k8l9m8n9o8p9q8r9s8t9u8v9w8x9y8z9a8b9
GOOGLE_SAFE_BROWSING_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
SCAMADVISER_API_KEY=26a9e8085dmsh56a3ed6cf875fe7p15706jsn3244eb2976af
IPQUALITYSCORE_API_KEY=WfHFgAIrlGZiZb2T8T1cVDoD0nR7BEeq
```

## 🐳 Kubernetes Configuration

### **ConfigMap** (`k8s/configmap.yml`)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: anti-fraud-platform
data:
  # Environment Configuration
  NODE_ENV: "production"

  # Service Discovery
  AUTH_SERVICE_URL: "http://auth-service:3001"
  LINK_SERVICE_URL: "http://link-service:3002"
  COMMUNITY_SERVICE_URL: "http://community-service:3003"
  CHAT_SERVICE_URL: "http://chat-service:3004"
  NEWS_SERVICE_URL: "http://news-service:3005"
  ADMIN_SERVICE_URL: "http://admin-service:3006"
  PHISHTANK_SERVICE_URL: "http://phishtank-service:3007"
  CRIMINALIP_SERVICE_URL: "http://criminalip-service:3008"

  # Redis Configuration
  REDIS_URL: "redis://redis:6379"
  REDIS_HOST: "redis"
  REDIS_PORT: "6379"

  # CORS Configuration
  ALLOWED_ORIGINS: "https://your-frontend.onrender.com,https://your-domain.com"

  # Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: "100"
  RATE_LIMIT_WINDOW_MS: "900000"

  # Logging
  LOG_LEVEL: "info"

  # API Timeouts
  API_TIMEOUT: "30000"
  SECURITY_ANALYSIS_TIMEOUT: "45000"

  # Feature Flags
  ENABLE_RATE_LIMITING: "true"
  USE_MOCK_DATA_FALLBACK: "false"
  CIRCUIT_BREAKER_ENABLED: "true"
  EVENT_BUS_ENABLED: "true"
```

### **Service Mesh Configuration** (`k8s/service-mesh/consul-connect-config.yaml`)

```yaml
# Consul Connect Service Mesh Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: consul-config
  namespace: antifraud
data:
  consul.hcl: |
    datacenter = "antifraud-dc"
    data_dir = "/consul/data"
    log_level = "INFO"
    server = true
    bootstrap_expect = 1
    ui_config {
      enabled = true
    }
    connect {
      enabled = true
    }
    ports {
      grpc = 8502
    }
    acl = {
      enabled = true
      default_policy = "deny"
      enable_token_persistence = true
    }
```

## 📊 Logging Configuration

### **Logging Config** (`config/logging.yml`)

```yaml
# Logging configuration for microservices
log_level: info
log_format: json
log_output: stdout

# Structured logging fields
log_fields:
  service: unknown
  version: 1.0.0
  environment: development

# Log rotation
log_rotation:
  max_size: 100MB
  max_files: 5
  max_age: 7d

# Error tracking
error_tracking:
  enabled: true
  sample_rate: 1.0
  ignore_patterns:
    - "ECONNREFUSED"
    - "ENOTFOUND"
```

## 🔄 Environment Management

### **Environment Switching Script** (`scripts/switch-env.js`)

```javascript
const environments = {
  local: {
    description: 'Local Development',
    file: '.env.local'
  },
  staging: {
    description: 'Staging Environment',
    file: '.env.staging'
  },
  production: {
    description: 'Production Environment',
    file: '.env.production'
  }
};

function switchEnvironment(envType) {
  // Backup current .env
  // Copy template to .env
  // Validate configuration
}
```

### **Validation Scripts**

```bash
# Validate environment configuration
npm run validate:env

# Test individual service configuration
cd services/auth-service
npm start

# Test all services
npm run start:services
```

## 🛡️ Security Best Practices

### **1. Secrets Management**

- **Development**: Sử dụng `.env` files với `.gitignore`
- **Production**: Sử dụng Kubernetes Secrets hoặc platform secrets
- **Rotation**: Định kỳ thay đổi API keys và secrets

### **2. Access Control**

```bash
# File permissions
chmod 600 .env                    # Chỉ owner có quyền đọc/ghi
chmod 644 config/logging.yml      # Public config có thể đọc
```

### **3. Environment Separation**

```bash
# Development
NODE_ENV=development
LOG_LEVEL=debug

# Production
NODE_ENV=production
LOG_LEVEL=info
```

## 🔧 Configuration Loading

### **Service Configuration Loading**

```javascript
// services/auth-service/src/config/firebase.js
const admin = require('firebase-admin');

// Load environment variables
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Clean up the private key
privateKey = privateKey.trim();
privateKey = privateKey.replace(/\\n/g, '\n');

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: privateKey
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});
```

## 📈 Monitoring & Observability

### **Configuration Monitoring**

```yaml
# Prometheus configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'microservices'
    static_configs:
      - targets: ['auth-service:3001', 'link-service:3002', 'chat-service:3004']
```

### **Health Checks**

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    service: process.env.SERVICE_NAME,
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  };
  res.json(health);
});
```

## 🚀 Deployment Configuration

### **Docker Configuration**

```dockerfile
# services/auth-service/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### **Docker Compose**

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  auth-service:
    build: ./services/auth-service
    ports:
      - "3001:3001"
    env_file:
      - ./services/auth-service/.env
    environment:
      - NODE_ENV=development
```

## 📋 Maintenance & Operations

### **Configuration Backup**

```bash
# Backup configuration
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Restore configuration
cp .env.backup.20241201_143022 .env
```

### **Configuration Validation**

```javascript
// Validate required environment variables
const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'JWT_SECRET'
];

const missing = requiredVars.filter(var => !process.env[var]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}
```

## 🔍 Troubleshooting

### **Common Issues**

1. **Missing Environment Variables**
   ```bash
   # Check environment variables
   node -e "console.log(process.env.FIREBASE_PROJECT_ID)"
   ```

2. **Configuration Loading Errors**
   ```bash
   # Check file permissions
   ls -la .env
   
   # Validate JSON/YAML syntax
   node -e "require('yaml').parse(require('fs').readFileSync('config/logging.yml', 'utf8'))"
   ```

3. **Service Discovery Issues**
   ```bash
   # Check service URLs
   curl http://auth-service:3001/health
   ```

### **Debug Commands**

```bash
# View all environment variables
env | grep -E "(FIREBASE|JWT|API)"

# Check service configuration
npm run config:check

# Validate Kubernetes config
kubectl apply --dry-run=client -f k8s/configmap.yml
```

## 📚 References

- [Configuration Refactoring Guide](docs/CONFIGURATION_REFACTOR.md)
- [Deployment Guide](docs/Deployment_Guide.docx.md)
- [Database Management](docs/database-management.md)
- [Kubernetes Configuration](k8s/)

---

**Tài liệu này được cập nhật lần cuối**: Tháng 12/2024
**Phiên bản**: 1.0.0
**Tác giả**: Anti-Fraud Platform Team

