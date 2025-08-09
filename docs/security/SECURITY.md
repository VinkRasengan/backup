# 🔒 Security Guidelines

## 🔐 Authentication & Authorization

### JWT Token Management
- **Token Expiration**: 24 hours for user tokens, 1 hour for service tokens
- **Token Refresh**: Automatic refresh 5 minutes before expiration
- **Token Validation**: All endpoints validate JWT signatures and expiration
- **Service-to-Service**: Dedicated service authentication with API keys

### Authentication Endpoints
- **Rate Limiting**: 5 attempts per 15 minutes per IP
- **Account Lockout**: 5 failed attempts locks account for 30 minutes
- **Password Requirements**: Minimum 8 characters, complexity enforced
- **Multi-Factor Authentication**: Supported via Firebase Auth

### Authorization Levels
```javascript
// Role-based access control
const roles = {
  'user': ['read:posts', 'create:posts', 'vote'],
  'moderator': ['user', 'moderate:posts', 'ban:users'],
  'admin': ['moderator', 'manage:system', 'view:analytics']
};
```

## 🛡️ Input Validation & Sanitization

### Request Validation
- **Joi Schemas**: All inputs validated against strict schemas
- **Content Sanitization**: HTML/script tags stripped from user content
- **Length Limits**: Title (200 chars), Content (5000 chars), Comments (1000 chars)
- **File Uploads**: Type validation, size limits, virus scanning

### SQL/NoSQL Injection Prevention
```javascript
// ✅ Safe query pattern
const sanitizedSearch = validateSearchInput(search);
query = query.where('title', '>=', sanitizedSearch)
            .where('title', '<=', sanitizedSearch + '\uf8ff');

// ❌ Dangerous pattern (avoided)
// query = query.where('title', '==', req.body.search); // No validation
```

### XSS Protection
- **Content Security Policy**: Strict CSP headers prevent script injection
- **Input Encoding**: All user content HTML-encoded before display
- **DOM Sanitization**: Client-side sanitization for rich content

## 🔒 Security Headers & CORS

### Helmet.js Configuration
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### CORS Policy
- **Allowed Origins**: Whitelist of trusted domains
- **Credentials**: Enabled for authenticated requests
- **Methods**: GET, POST, PUT, DELETE, OPTIONS only
- **Headers**: Restricted to necessary headers only

## 🚦 Rate Limiting & DDoS Protection

### Rate Limiting Rules
| Endpoint Type | Limit | Window | Action |
|---------------|-------|---------|---------|
| Authentication | 5 requests | 15 minutes | Block IP |
| API Calls | 100 requests | 15 minutes | Throttle |
| File Uploads | 10 requests | 1 hour | Block |
| Search | 50 requests | 5 minutes | Throttle |

### Implementation
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  skipSuccessfulRequests: true
});
```

## 🔐 Environment & Secret Management

### Secret Storage
- **Environment Variables**: All secrets stored in environment variables
- **No Hardcoding**: Zero secrets in source code
- **Rotation Policy**: API keys rotated every 90 days
- **Access Control**: Secrets accessible only to authorized services

### Environment Security
```bash
# ✅ Secure environment variables
JWT_SECRET=randomly-generated-256-bit-key
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
GEMINI_API_KEY=your-secure-api-key

# ❌ Never commit these files
.env
.env.local
.env.production
```

## 📊 Security Monitoring & Logging

### Security Events Logged
- **Authentication**: Login attempts, failures, token refresh
- **Authorization**: Access denials, privilege escalations
- **Input Validation**: Malicious input attempts, injection attempts
- **Rate Limiting**: Rate limit violations, suspicious patterns
- **System**: Service failures, configuration changes

### Log Format
```json
{
  "timestamp": "2025-06-20T10:00:00.000Z",
  "level": "WARN",
  "service": "auth-service",
  "event": "AUTHENTICATION_FAILURE",
  "userId": "user-123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "details": {
    "reason": "invalid_password",
    "attempts": 3
  },
  "correlationId": "req-abc-123"
}
```

### Alerting Rules
- **Critical**: Authentication bypass attempts, SQL injection
- **High**: Multiple failed logins, rate limit violations
- **Medium**: Suspicious user agents, unusual access patterns
- **Low**: Configuration changes, service restarts

## 🔍 Security Testing & Validation

### Automated Security Tests
```bash
# Run security audit
npm run security:audit

# Check for vulnerabilities
npm audit --audit-level=moderate

# Validate configurations
npm run security:validate
```

### Manual Security Checklist
- [ ] All endpoints require authentication
- [ ] Input validation on all user inputs
- [ ] Rate limiting configured correctly
- [ ] Security headers present
- [ ] No secrets in code or logs
- [ ] HTTPS enforced in production
- [ ] Database access restricted
- [ ] Error messages don't leak information

## 🚨 Incident Response

### Security Incident Procedure
1. **Detection**: Automated alerts or manual discovery
2. **Assessment**: Determine scope and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat and vulnerabilities
5. **Recovery**: Restore services safely
6. **Lessons Learned**: Update security measures

### Emergency Contacts
- **Security Team**: security@company.com
- **DevOps Team**: devops@company.com
- **Management**: management@company.com

## 📋 Compliance & Standards

### Security Standards
- **OWASP Top 10**: All vulnerabilities addressed
- **NIST Framework**: Security controls implemented
- **ISO 27001**: Information security management
- **GDPR**: Data protection compliance

### Regular Security Reviews
- **Weekly**: Automated vulnerability scans
- **Monthly**: Security configuration review
- **Quarterly**: Penetration testing
- **Annually**: Full security audit
