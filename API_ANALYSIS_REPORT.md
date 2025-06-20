# API Endpoint Analysis Report
# Generated: ${new Date().toISOString()}

## 🌐 API URL MAPPING ANALYSIS

### 📊 External API Calls Found

**HTTP/HTTPS URLs:**
- Test environments: http://localhost:8080, http://localhost:3003
- Example URLs: https://example.com/test
- News sources: https://vnexpress.net/, https://tuoitre.vn/

### 🔗 Internal Service URLs (from Environment Variables)

**Primary Services:**
- AUTH_SERVICE_URL: http://localhost:3001 (backup: :3011)
- LINK_SERVICE_URL: http://localhost:3002  
- COMMUNITY_SERVICE_URL: http://localhost:3003
- CHAT_SERVICE_URL: http://localhost:3004
- NEWS_SERVICE_URL: http://localhost:3005
- ADMIN_SERVICE_URL: http://localhost:3006
- CRIMINALIP_SERVICE_URL: http://localhost:3007
- PHISHTANK_SERVICE_URL: http://localhost:3008

**Infrastructure:**
- REDIS_HOST/PORT: Redis caching
- PACT_BROKER_URL: Contract testing
- FIRESTORE_EMULATOR_HOST: Database emulator

---

## 🎯 COMMUNITY SERVICE API ENDPOINTS

### 📝 Posts Endpoints
```
GET /posts                    # List posts with filters
POST /posts                   # Create new post  
GET /posts/:id                # Get single post
POST /posts/dev/sample-data   # Create test data
DELETE /posts/dev/sample-data # Clear test data
```

### 💬 Comments Endpoints  
```
GET /comments/:postId         # Get comments for post
POST /comments                # Create comment
GET /comments/:commentId/replies # Get replies
PUT /comments/:commentId      # Update comment
DELETE /comments/:commentId   # Delete comment
POST /comments/:commentId/vote # Vote on comment
GET /comments/:commentId/votes # Get comment votes
```

### 🗳️ Votes Endpoints
```
POST /votes/:linkId           # Submit/update vote
GET /votes/:linkId/stats      # Get vote statistics  
GET /votes/:linkId/user       # Get user's vote
GET /votes/:linkId/optimized  # Get combined vote data
DELETE /votes/:linkId         # Remove user's vote
POST /votes/batch             # Batch vote operations
```

### 📊 Reports Endpoints
```
GET /reports                  # List reports
POST /reports                 # Create report
```

### 🔧 System Endpoints
```
GET /health                   # Health check
GET /health/live              # Liveness probe
GET /health/ready             # Readiness probe
GET /metrics                  # Prometheus metrics
GET /info                     # Service information
```

---

## ⚠️ POTENTIAL API SECURITY RISKS

### 🚨 High Risk Issues
1. **Hardcoded URLs in tests** - localhost URLs exposed
2. **Missing URL validation** - No validation for external URLs
3. **Environment variable exposure** - Service URLs in plaintext

### 🔍 Medium Risk Issues  
1. **No API rate limiting per endpoint** - Could be abused
2. **Missing HTTPS enforcement** - HTTP URLs in development
3. **No API versioning** - Breaking changes risk

### 📋 Recommendations
1. **Implement URL validation** for external links
2. **Add API versioning** (e.g., /api/v1/)
3. **Enforce HTTPS** in production
4. **Add endpoint-specific rate limiting**
5. **Mask sensitive URLs** in logs

---

## 🔄 API DEPENDENCIES FLOW

```
Client -> API Gateway (8080) -> Community Service (3003)
                              -> Auth Service (3001)
                              -> Link Service (3002)
                              -> Other Services...
```

**Critical Dependencies:**
- Firebase (Database)
- Redis (Caching) 
- Auth Service (Authentication)
- External APIs (VirusTotal, etc.)

---

## 📈 API USAGE PATTERNS

**Most Called Endpoints:**
1. `/votes/*` - High frequency voting operations
2. `/comments/*` - Social interaction features  
3. `/posts/*` - Content management
4. `/health` - System monitoring

**Authentication Required:**
- All POST/PUT/DELETE operations
- User-specific GET operations
- Admin endpoints

**Public Endpoints:**
- Health checks
- Metrics (Prometheus)
- Public post listings
