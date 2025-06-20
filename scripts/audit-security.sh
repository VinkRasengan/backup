#!/bin/bash
# 🔒 SECURITY AUDIT SCRIPT
# Automated security vulnerability scanner for the microservices platform

set -e

echo "🔍 Starting Security Audit..."
echo "================================"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CRITICAL_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0

# Function to log issues
log_critical() {
    echo -e "${RED}🚨 CRITICAL: $1${NC}"
    ((CRITICAL_ISSUES++))
}

log_medium() {
    echo -e "${YELLOW}⚠️  MEDIUM: $1${NC}"
    ((MEDIUM_ISSUES++))
}

log_low() {
    echo -e "${BLUE}ℹ️  LOW: $1${NC}"
    ((LOW_ISSUES++))
}

log_good() {
    echo -e "${GREEN}✅ GOOD: $1${NC}"
}

echo "1. 🔐 Authentication & Authorization Checks"
echo "----------------------------------------"

# Check for authentication bypasses
echo "Checking for authentication bypasses..."
if grep -r "// authMiddleware.authenticate" services/ --include="*.js" > /dev/null 2>&1; then
    log_critical "Authentication middleware disabled in routes"
    grep -r "// authMiddleware.authenticate" services/ --include="*.js" | head -5
else
    log_good "No disabled authentication middleware found"
fi

# Check for hardcoded credentials
echo "Checking for hardcoded credentials..."
if grep -r -i "password.*=.*['\"]" services/ --include="*.js" | grep -v "req.body.password" > /dev/null 2>&1; then
    log_critical "Hardcoded passwords found"
    grep -r -i "password.*=.*['\"]" services/ --include="*.js" | grep -v "req.body.password" | head -3
else
    log_good "No hardcoded passwords found"
fi

# Check for API keys in code
echo "Checking for exposed API keys..."
if grep -r "AIza[0-9A-Za-z-_]{35}" . --include="*.js" --exclude-dir=node_modules > /dev/null 2>&1; then
    log_critical "Google API keys found in code"
    grep -r "AIza[0-9A-Za-z-_]{35}" . --include="*.js" --exclude-dir=node_modules | head -3
else
    log_good "No exposed Google API keys found"
fi

echo ""
echo "2. 🛡️ Input Validation & Injection Checks"
echo "----------------------------------------"

# Check for SQL/NoSQL injection risks
echo "Checking for injection vulnerabilities..."
if grep -r "query.*where.*req\." services/ --include="*.js" > /dev/null 2>&1; then
    log_medium "Potential injection risks found"
    grep -r "query.*where.*req\." services/ --include="*.js" | head -3
else
    log_good "No obvious injection risks found"
fi

# Check for XSS vulnerabilities
echo "Checking for XSS vulnerabilities..."
if grep -r "innerHTML\|dangerouslySetInnerHTML" client/src/ --include="*.js" --include="*.jsx" > /dev/null 2>&1; then
    log_medium "Potential XSS vulnerabilities found"
    grep -r "innerHTML\|dangerouslySetInnerHTML" client/src/ --include="*.js" --include="*.jsx" | head -3
else
    log_good "No obvious XSS vulnerabilities found"
fi

# Check for eval usage
echo "Checking for dangerous eval usage..."
if grep -r "eval(" . --include="*.js" --exclude-dir=node_modules --exclude-dir=build > /dev/null 2>&1; then
    log_critical "eval() usage found - potential code injection"
    grep -r "eval(" . --include="*.js" --exclude-dir=node_modules --exclude-dir=build | head -3
else
    log_good "No eval() usage found"
fi

echo ""
echo "3. 🔒 Security Headers & CORS"
echo "----------------------------"

# Check for security headers
echo "Checking for security headers..."
if grep -r "helmet" services/ --include="*.js" > /dev/null 2>&1; then
    log_good "Helmet security middleware found"
else
    log_medium "No Helmet security middleware found"
fi

# Check CORS configuration
echo "Checking CORS configuration..."
if grep -r "cors" services/ --include="*.js" > /dev/null 2>&1; then
    log_good "CORS middleware found"
    # Check for overly permissive CORS
    if grep -r "origin.*true\|origin.*\*" services/ --include="*.js" > /dev/null 2>&1; then
        log_medium "Overly permissive CORS configuration found"
    fi
else
    log_medium "No CORS middleware found"
fi

echo ""
echo "4. 🔑 Secret Management"
echo "---------------------"

# Check for .env files in git
echo "Checking for .env files in version control..."
if find . -name ".env" -not -path "./node_modules/*" | grep -v ".env.example" > /dev/null 2>&1; then
    log_critical ".env files found in repository"
    find . -name ".env" -not -path "./node_modules/*" | grep -v ".env.example"
else
    log_good "No .env files in repository"
fi

# Check for secrets in environment variables
echo "Checking for exposed secrets..."
if grep -r "process\.env\." . --include="*.js" --exclude-dir=node_modules | grep -i "secret\|key\|password" > /dev/null 2>&1; then
    log_low "Environment variables with sensitive names found"
    grep -r "process\.env\." . --include="*.js" --exclude-dir=node_modules | grep -i "secret\|key\|password" | head -3
else
    log_good "No obvious secret exposure found"
fi

echo ""
echo "5. 🚦 Rate Limiting & DoS Protection"
echo "-----------------------------------"

# Check for rate limiting
echo "Checking for rate limiting..."
if grep -r "rate.*limit\|express-rate-limit" services/ --include="*.js" > /dev/null 2>&1; then
    log_good "Rate limiting found"
else
    log_medium "No rate limiting found"
fi

# Check for request size limits
echo "Checking for request size limits..."
if grep -r "limit.*size\|express\.json.*limit" services/ --include="*.js" > /dev/null 2>&1; then
    log_good "Request size limits found"
else
    log_medium "No request size limits found"
fi

echo ""
echo "6. 📝 Logging & Monitoring"
echo "-------------------------"

# Check for sensitive data in logs
echo "Checking for sensitive data in logs..."
if grep -r "console\.log.*password\|logger.*password" services/ --include="*.js" > /dev/null 2>&1; then
    log_critical "Passwords being logged"
    grep -r "console\.log.*password\|logger.*password" services/ --include="*.js" | head -3
else
    log_good "No passwords in logs found"
fi

# Check for proper error handling
echo "Checking error handling..."
if grep -r "catch.*console\.log\|catch.*res\.json.*error" services/ --include="*.js" > /dev/null 2>&1; then
    log_medium "Potential information disclosure in error handling"
    grep -r "catch.*console\.log\|catch.*res\.json.*error" services/ --include="*.js" | head -3
else
    log_good "No obvious error information disclosure"
fi

echo ""
echo "7. 🔧 Configuration Security"
echo "---------------------------"

# Check for debug mode in production
echo "Checking for debug configurations..."
if grep -r "debug.*true\|NODE_ENV.*development" . --include="*.js" --include="*.json" --exclude-dir=node_modules > /dev/null 2>&1; then
    log_low "Debug configurations found"
    grep -r "debug.*true\|NODE_ENV.*development" . --include="*.js" --include="*.json" --exclude-dir=node_modules | head -3
else
    log_good "No debug configurations found"
fi

# Check for insecure dependencies
echo "Checking for known vulnerable dependencies..."
if command -v npm &> /dev/null; then
    for service_dir in services/*/; do
        if [ -f "$service_dir/package.json" ]; then
            echo "Auditing $service_dir..."
            cd "$service_dir"
            if npm audit --audit-level=moderate 2>/dev/null | grep -q "vulnerabilities"; then
                log_medium "Vulnerable dependencies found in $service_dir"
            else
                log_good "No vulnerable dependencies in $service_dir"
            fi
            cd - > /dev/null
        fi
    done
else
    log_low "npm not available for dependency audit"
fi

echo ""
echo "================================"
echo "🔍 SECURITY AUDIT SUMMARY"
echo "================================"
echo -e "${RED}Critical Issues: $CRITICAL_ISSUES${NC}"
echo -e "${YELLOW}Medium Issues: $MEDIUM_ISSUES${NC}"
echo -e "${BLUE}Low Issues: $LOW_ISSUES${NC}"

if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo -e "${RED}🚨 CRITICAL ISSUES FOUND - IMMEDIATE ACTION REQUIRED${NC}"
    exit 1
elif [ $MEDIUM_ISSUES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  MEDIUM ISSUES FOUND - SHOULD BE ADDRESSED${NC}"
    exit 1
else
    echo -e "${GREEN}✅ NO CRITICAL SECURITY ISSUES FOUND${NC}"
    exit 0
fi
