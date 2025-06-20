# 🔍 COMPREHENSIVE SYSTEM AUDIT PROMPT

## Hướng dẫn sử dụng
Copy prompt này và paste vào AI assistant (ChatGPT, Claude, etc.) cùng với code của project để được audit toàn diện.

---

## 🎯 SYSTEM AUDIT PROMPT

```
Bạn là một Senior DevOps/Security Engineer có nhiều năm kinh nghiệm. Hãy thực hiện audit toàn diện hệ thống theo checklist sau:

## 📋 AUDIT CHECKLIST

### 1. 🔗 URL ROUTING ANALYSIS
**Task**: Phân tích tất cả routing patterns và tìm mismatches
**Check**:
- [ ] Client API calls vs Server route definitions
- [ ] API Gateway proxy configurations  
- [ ] Service-to-service communication URLs
- [ ] Environment-specific URL configurations
- [ ] Query parameter format consistency

**Lệnh kiểm tra COMPREHENSIVE**:
```bash
# 🔍 CLIENT API CALLS - Tất cả patterns
echo "=== DIRECT API CALLS ==="
grep -r "api\." client/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

echo "=== FETCH CALLS ==="
grep -r "fetch(" client/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

echo "=== AXIOS CALLS ==="
grep -r "axios\." client/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
grep -r "\.get\|\.post\|\.put\|\.delete\|\.patch" client/src/ --include="*.js" --include="*.jsx"

echo "=== HTTP CLIENT CALLS ==="
grep -r "http\." client/src/ --include="*.js" --include="*.jsx"
grep -r "request(" client/src/ --include="*.js" --include="*.jsx"

echo "=== URL PATTERNS ==="
grep -r "/api/" client/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
grep -r "localhost:" client/src/ --include="*.js" --include="*.jsx"
grep -r "baseURL\|BASE_URL" client/src/ --include="*.js" --include="*.jsx"

echo "=== ASYNC API CALLS ==="
grep -r "await.*fetch\|await.*api\|await.*axios" client/src/ --include="*.js" --include="*.jsx"

echo "=== PROMISE-BASED CALLS ==="
grep -r "\.then(" client/src/ --include="*.js" --include="*.jsx" | grep -i "api\|fetch\|http"

# 🔍 SERVER ROUTE DEFINITIONS - Tất cả patterns
echo "=== EXPRESS ROUTES ==="
grep -r "router\." services/ --include="*.js" --include="*.ts"
grep -r "app\." services/ --include="*.js" --include="*.ts" | grep -E "(get|post|put|delete|patch|use)"

echo "=== ROUTE PATHS ==="
grep -r "'/\|\"/" services/ --include="*.js" --include="*.ts" | grep -E "(get|post|put|delete|patch|use)"

echo "=== PROXY CONFIGURATIONS ==="
grep -r "proxy\|pathRewrite" services/ --include="*.js" --include="*.ts"
grep -r "target.*http" services/ --include="*.js" --include="*.ts"
```

### 2. 🛡️ SECURITY VULNERABILITIES
**Task**: Tìm lỗ hổng bảo mật nghiêm trọng
**Check**:
- [ ] Authentication bypass scenarios
- [ ] Input validation gaps (XSS, SQL Injection)
- [ ] Authorization logic flaws
- [ ] Rate limiting implementation
- [ ] CORS configuration issues
- [ ] Sensitive data exposure in logs/responses

**Patterns cần tìm**:
```javascript
// ❌ Dangerous patterns:
req.body.content  // Without sanitization
if (req.method === 'GET') next()  // Auth bypass
res.json({ error: error.message })  // Info leak
```

### 3. 🚀 PERFORMANCE BOTTLENECKS  
**Task**: Identify performance killing patterns
**Check**:
- [ ] N+1 query problems
- [ ] Memory-intensive operations (loading all data)
- [ ] Missing database indexes
- [ ] Inefficient pagination
- [ ] Blocking synchronous operations
- [ ] Memory leaks in loops

**Red flags**:
```javascript
// ❌ Performance killers:
.get().then(snapshot => snapshot.docs.map(...).sort(...))
for (let i = 0; i < items.length; i++) { await ... }
const allItems = await loadEverything()
```

### 4. 🔄 DATA CONSISTENCY ISSUES
**Task**: Find race conditions and consistency problems  
**Check**:
- [ ] Concurrent update scenarios
- [ ] Missing transaction boundaries
- [ ] Counter synchronization issues
- [ ] Orphaned data after deletions
- [ ] Cascade delete implementations

**Dangerous patterns**:
```javascript
// ❌ Race condition risks:
const count = await getCount()
await updateCount(count + 1)  // Not atomic

// Multiple separate DB operations without transaction
await updateA()
await updateB()  // Can fail leaving inconsistent state
```

### 5. 🐛 BUSINESS LOGIC BUGS
**Task**: Find logic errors and edge cases
**Check**:
- [ ] Edge case handling (empty data, null values)
- [ ] Error propagation chains
- [ ] State machine violations
- [ ] Validation logic completeness
- [ ] Default value assumptions

### 6. 📊 MONITORING & OBSERVABILITY GAPS
**Task**: Identify blind spots in system monitoring
**Check**:
- [ ] Missing error tracking
- [ ] Insufficient logging detail
- [ ] Performance metrics gaps
- [ ] Health check completeness
- [ ] Alert configuration

## 🎯 SPECIFIC FOCUS AREAS

### Comment System Deep Dive:
1. **Flow Analysis**: Map complete user journey from comment creation to display
2. **Error Scenarios**: What happens when Firebase is down? Network issues?
3. **Scale Testing**: How does pagination work with 10k+ comments?
4. **Security**: Can users modify others' comments? Vote manipulation?
5. **Data Integrity**: What if vote count gets out of sync?

### API Gateway Analysis:
1. **Proxy Rules**: Do all pathRewrite rules work correctly?
2. **Failover**: What happens when a service is down?
3. **Load Balancing**: Is traffic distributed properly?
4. **Circuit Breaker**: Are circuit breakers configured correctly?

### Database Analysis:
1. **Indexes**: Are queries using proper indexes?
2. **Transactions**: Are multi-step operations atomic?
3. **Constraints**: Are data integrity rules enforced?
4. **Backup**: Is data backup strategy solid?

## 📝 OUTPUT FORMAT

For each issue found, provide:

```markdown
## 🚨 ISSUE: [Issue Title]
**Severity**: 🔴 Critical / 🟡 Medium / 🟢 Low
**Category**: Security/Performance/Logic/Routing
**Location**: `file:line` or service name
**Description**: What's wrong and why it's dangerous
**Impact**: What can go wrong
**Fix**: Specific code changes needed
**Test**: How to verify the fix works
```

## 🔍 ANALYSIS INSTRUCTIONS

1. **Read ALL code files** - Don't skip any configuration files
2. **Think like an attacker** - How would you exploit this system?
3. **Consider scale** - What breaks at 10x, 100x current load?
4. **Map data flow** - Follow data from input to storage to output
5. **Check error paths** - What happens when things go wrong?
6. **Verify assumptions** - Are default values safe? Are validations complete?

## 🎯 PRIORITY FOCUS

1. **Security vulnerabilities** that could lead to data breach
2. **Performance issues** that could crash the system  
3. **Data corruption** risks that could lose user data
4. **Service connectivity** issues that could cause outages

Please analyze the provided codebase thoroughly and report ALL issues you find, prioritized by risk level.
```

---

## 🛠️ AUTOMATED AUDIT COMMANDS

### Quick Security Scan
```bash
# Find potential security issues
grep -r "eval\|innerHTML\|dangerouslySetInnerHTML" .
grep -r "process\.env\." . | grep -v "\.example"
grep -r "password\|secret\|key" . --include="*.js" | grep -v "\.env"
```

### Performance Red Flags  
```bash
# Find performance anti-patterns
grep -r "\.get()\.then.*\.map.*\.sort" .
grep -r "for.*await" .
grep -r "Promise\.all.*map" .
```

### URL Consistency Check
```bash
# Compare API definitions
grep -r "router\." services/ > server_routes.txt
grep -r "api\." client/src/ > client_calls.txt
diff server_routes.txt client_calls.txt
```

### Database Query Analysis
```bash
# Find potential N+1 queries
grep -r "\.collection.*\.get()" .
grep -r "\.where.*\.get()" .
```

## 🎯 USAGE EXAMPLES

### Example 1: Quick Security Audit
```bash
# Run this command to get security overview
./audit-security.sh | tee security-report.txt
```

### Example 2: Performance Profiling
```bash
# Profile critical paths
./profile-performance.sh comment-flow
```

### Example 3: Integration Testing
```bash
# Test all API endpoints
./test-api-consistency.sh
```

---

## 📋 MANUAL CHECKLIST

### Pre-Production Checklist:
- [ ] All URL mismatches fixed
- [ ] Security vulnerabilities patched  
- [ ] Performance bottlenecks resolved
- [ ] Error handling improved
- [ ] Monitoring implemented
- [ ] Integration tests passing
- [ ] Load testing completed
- [ ] Security penetration testing done

### Post-Deployment Monitoring:
- [ ] Error rates normal
- [ ] Response times acceptable
- [ ] Database performance stable
- [ ] Memory usage within limits
- [ ] No security alerts triggered

---

*Prompt created on June 20, 2025 for comprehensive system audit*
