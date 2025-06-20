# 🔍 AUDIT QUICK REFERENCE GUIDE

## 🚀 Quick Start

### Run Complete Audit
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run comprehensive audit
./scripts/run-full-audit.sh
```

### Apply Critical Fixes
```bash
# Apply automated security fixes
./scripts/apply-security-fixes.sh

# Re-run audit to verify fixes
./scripts/audit-security.sh
```

---

## 🚨 CRITICAL ISSUES FOUND

### 1. Authentication Bypass ⚠️ IMMEDIATE FIX REQUIRED
**File**: `services/auth-service/src/routes/users.js:38-49`
```bash
# Quick fix:
sed -i 's|// authMiddleware.authenticate,|authMiddleware.authenticate,|g' services/auth-service/src/routes/users.js
```

### 2. API Gateway Port Mismatch ⚠️ IMMEDIATE FIX REQUIRED
**Issue**: Services configured on different ports (8080 vs 8082)
```bash
# Quick fix:
find . -name "*.js" -type f -exec sed -i 's|:8082|:8080|g' {} \;
```

### 3. N+1 Query Performance Issue ⚠️ HIGH PRIORITY
**File**: `services/community-service/src/routes/posts.js`
```javascript
// Add pagination:
.limit(20)
.startAfter(lastDoc)
```

---

## 📊 AUDIT SCRIPTS OVERVIEW

| Script | Purpose | Runtime |
|--------|---------|---------|
| `run-full-audit.sh` | Complete system audit | 2-3 min |
| `audit-security.sh` | Security vulnerabilities | 30 sec |
| `audit-performance.sh` | Performance bottlenecks | 45 sec |
| `apply-security-fixes.sh` | Automated security fixes | 1 min |

---

## 🎯 PRIORITY MATRIX

### 🔴 CRITICAL (Fix Today)
- [ ] Re-enable authentication on dashboard
- [ ] Standardize API Gateway port
- [ ] Remove hardcoded secrets
- [ ] Add query pagination

### 🟡 HIGH (Fix This Week)
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Create database indexes
- [ ] Fix API routing mismatches

### 🟢 MEDIUM (Fix This Month)
- [ ] Enhance error logging
- [ ] Add monitoring
- [ ] Security headers
- [ ] Documentation updates

---

## 🛠️ MANUAL FIXES REQUIRED

### Security Fixes
```javascript
// 1. Add rate limiting
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts'
});

// 2. Input sanitization
const sanitizeInput = (input) => {
  return input.trim().replace(/[^\w\s-]/gi, '').substring(0, 100);
};

// 3. Security headers
app.use(helmet());
```

### Performance Fixes
```javascript
// 1. Add pagination
const query = db.collection('posts')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .startAfter(lastDoc);

// 2. Use Promise.all for parallel operations
const results = await Promise.all([
  fetchUserData(),
  fetchPosts(),
  fetchComments()
]);

// 3. Add database indexes
// Create composite indexes in Firestore console
```

---

## 🧪 TESTING COMMANDS

### Security Testing
```bash
# Test authentication
curl -X GET http://localhost:8080/api/users/dashboard
# Should return 401 Unauthorized

# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Performance Testing
```bash
# Load test
ab -n 1000 -c 10 http://localhost:8080/api/community/posts

# Memory usage
docker stats --no-stream
```

---

## 📋 VERIFICATION CHECKLIST

### After Applying Fixes
- [ ] All services start without errors
- [ ] Authentication works on all protected routes
- [ ] API Gateway routes correctly to all services
- [ ] Rate limiting blocks excessive requests
- [ ] Search queries are sanitized
- [ ] Database queries use pagination
- [ ] No secrets in client build files
- [ ] Security headers are present

### Testing Commands
```bash
# 1. Start all services
npm run start:all

# 2. Test health endpoints
curl http://localhost:8080/health

# 3. Test authentication
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 4. Test rate limiting
# (Run login request 6 times quickly)

# 5. Test API routing
curl http://localhost:8080/api/community/posts
curl http://localhost:8080/api/links/test
```

---

## 🚨 EMERGENCY PROCEDURES

### If Services Won't Start
```bash
# 1. Kill all processes
npm run kill:all

# 2. Check ports
npm run validate:ports

# 3. Start safely
npm run start:safe
```

### If Authentication Fails
```bash
# 1. Check auth service logs
docker logs auth-service

# 2. Verify JWT secret
echo $JWT_SECRET

# 3. Test auth service directly
curl http://localhost:3001/health
```

### If Database Queries Fail
```bash
# 1. Check Firestore connection
# 2. Verify indexes in Firebase console
# 3. Check service account permissions
```

---

## 📞 SUPPORT CONTACTS

### Critical Issues
- **Security**: Immediate escalation required
- **Performance**: Monitor and optimize
- **Database**: Check indexes and queries

### Resources
- [Security Documentation](./SECURITY.md)
- [Performance Guide](./PERFORMANCE.md)
- [Audit Reports](./audit-reports/)

---

## 🔄 REGULAR MAINTENANCE

### Daily
- [ ] Check service health
- [ ] Monitor error rates
- [ ] Review security logs

### Weekly
- [ ] Run security audit
- [ ] Check dependency updates
- [ ] Review performance metrics

### Monthly
- [ ] Full system audit
- [ ] Update dependencies
- [ ] Review and update documentation

---

*Last updated: June 20, 2025*
