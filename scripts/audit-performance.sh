#!/bin/bash
# 🚀 PERFORMANCE AUDIT SCRIPT
# Automated performance bottleneck scanner for the microservices platform

set -e

echo "🚀 Starting Performance Audit..."
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

echo "1. 🗄️ Database Query Performance"
echo "-------------------------------"

# Check for N+1 query patterns
echo "Checking for N+1 query patterns..."
if grep -r "\.map.*await\|for.*await.*get()" services/ --include="*.js" > /dev/null 2>&1; then
    log_critical "Potential N+1 query patterns found"
    grep -r "\.map.*await\|for.*await.*get()" services/ --include="*.js" | head -3
else
    log_good "No obvious N+1 query patterns found"
fi

# Check for missing pagination
echo "Checking for missing pagination..."
if grep -r "\.get()" services/ --include="*.js" | grep -v "limit\|startAfter" > /dev/null 2>&1; then
    log_medium "Queries without pagination found"
    grep -r "\.get()" services/ --include="*.js" | grep -v "limit\|startAfter" | head -5
else
    log_good "All queries appear to have pagination"
fi

# Check for inefficient sorting
echo "Checking for inefficient sorting..."
if grep -r "\.sort()" services/ --include="*.js" > /dev/null 2>&1; then
    log_medium "In-memory sorting found - consider database-level sorting"
    grep -r "\.sort()" services/ --include="*.js" | head -3
else
    log_good "No in-memory sorting found"
fi

# Check for missing indexes
echo "Checking for complex queries that may need indexes..."
if grep -r "\.where.*\.where" services/ --include="*.js" > /dev/null 2>&1; then
    log_medium "Complex queries found - ensure proper indexes exist"
    grep -r "\.where.*\.where" services/ --include="*.js" | head -3
else
    log_good "No complex multi-where queries found"
fi

echo ""
echo "2. 🔄 Async/Await Performance"
echo "----------------------------"

# Check for blocking operations
echo "Checking for blocking operations..."
if grep -r "await.*forEach\|for.*await" services/ --include="*.js" > /dev/null 2>&1; then
    log_critical "Sequential async operations found - consider Promise.all"
    grep -r "await.*forEach\|for.*await" services/ --include="*.js" | head -3
else
    log_good "No sequential async operations found"
fi

# Check for missing Promise.all
echo "Checking for opportunities to use Promise.all..."
if grep -r "await.*\n.*await" services/ --include="*.js" > /dev/null 2>&1; then
    log_medium "Sequential awaits found - consider parallelization"
else
    log_good "No obvious sequential await patterns found"
fi

echo ""
echo "3. 💾 Memory Usage Patterns"
echo "--------------------------"

# Check for memory-intensive operations
echo "Checking for memory-intensive operations..."
if grep -r "\.docs\.map\|snapshot\.docs" services/ --include="*.js" > /dev/null 2>&1; then
    log_medium "Loading all documents into memory found"
    grep -r "\.docs\.map\|snapshot\.docs" services/ --include="*.js" | head -3
else
    log_good "No bulk document loading found"
fi

# Check for large object creation
echo "Checking for large object creation..."
if grep -r "new Array.*[0-9]{4,}\|Array.*[0-9]{4,}" services/ --include="*.js" > /dev/null 2>&1; then
    log_medium "Large array creation found"
    grep -r "new Array.*[0-9]{4,}\|Array.*[0-9]{4,}" services/ --include="*.js" | head -3
else
    log_good "No large array creation found"
fi

echo ""
echo "4. 🌐 Network & API Performance"
echo "------------------------------"

# Check for missing request timeouts
echo "Checking for request timeouts..."
if grep -r "fetch\|axios\|request" services/ --include="*.js" | grep -v "timeout" > /dev/null 2>&1; then
    log_medium "HTTP requests without timeouts found"
    grep -r "fetch\|axios\|request" services/ --include="*.js" | grep -v "timeout" | head -3
else
    log_good "All HTTP requests have timeouts"
fi

# Check for missing connection pooling
echo "Checking for connection pooling..."
if grep -r "new.*Client\|createConnection" services/ --include="*.js" > /dev/null 2>&1; then
    log_low "Database connections found - ensure pooling is used"
    grep -r "new.*Client\|createConnection" services/ --include="*.js" | head -3
else
    log_good "No obvious connection creation patterns found"
fi

echo ""
echo "5. 📦 Bundle & Asset Performance"
echo "-------------------------------"

# Check client bundle size
echo "Checking client bundle size..."
if [ -d "client/build/static/js" ]; then
    BUNDLE_SIZE=$(du -sh client/build/static/js | cut -f1)
    echo "Bundle size: $BUNDLE_SIZE"
    
    # Check if bundle is too large (>2MB)
    BUNDLE_SIZE_KB=$(du -sk client/build/static/js | cut -f1)
    if [ $BUNDLE_SIZE_KB -gt 2048 ]; then
        log_medium "Large bundle size detected: $BUNDLE_SIZE"
    else
        log_good "Bundle size is reasonable: $BUNDLE_SIZE"
    fi
else
    log_low "No client build found - run 'npm run build' to check bundle size"
fi

# Check for unused dependencies
echo "Checking for unused dependencies..."
if command -v npx &> /dev/null; then
    cd client
    if npx depcheck --json 2>/dev/null | grep -q "dependencies"; then
        log_low "Unused dependencies found in client"
    else
        log_good "No unused dependencies in client"
    fi
    cd ..
else
    log_low "npx not available for dependency check"
fi

echo ""
echo "6. 🔧 Code Performance Patterns"
echo "------------------------------"

# Check for inefficient loops
echo "Checking for inefficient loops..."
if grep -r "for.*in.*Object\|for.*in.*array" services/ --include="*.js" > /dev/null 2>&1; then
    log_medium "Inefficient for-in loops found"
    grep -r "for.*in.*Object\|for.*in.*array" services/ --include="*.js" | head -3
else
    log_good "No inefficient for-in loops found"
fi

# Check for string concatenation in loops
echo "Checking for string concatenation in loops..."
if grep -r "for.*{.*+=" services/ --include="*.js" > /dev/null 2>&1; then
    log_medium "String concatenation in loops found - consider array join"
    grep -r "for.*{.*+=" services/ --include="*.js" | head -3
else
    log_good "No string concatenation in loops found"
fi

# Check for synchronous file operations
echo "Checking for synchronous file operations..."
if grep -r "readFileSync\|writeFileSync" services/ --include="*.js" > /dev/null 2>&1; then
    log_medium "Synchronous file operations found"
    grep -r "readFileSync\|writeFileSync" services/ --include="*.js" | head -3
else
    log_good "No synchronous file operations found"
fi

echo ""
echo "7. 📊 Monitoring & Metrics"
echo "-------------------------"

# Check for performance monitoring
echo "Checking for performance monitoring..."
if grep -r "performance\|metrics\|timing" services/ --include="*.js" > /dev/null 2>&1; then
    log_good "Performance monitoring found"
else
    log_medium "No performance monitoring found"
fi

# Check for memory leak patterns
echo "Checking for potential memory leaks..."
if grep -r "setInterval\|setTimeout" services/ --include="*.js" | grep -v "clear" > /dev/null 2>&1; then
    log_medium "Timers without cleanup found - potential memory leaks"
    grep -r "setInterval\|setTimeout" services/ --include="*.js" | grep -v "clear" | head -3
else
    log_good "No timer memory leaks found"
fi

echo ""
echo "8. 🏗️ Architecture Performance"
echo "-----------------------------"

# Check for service communication efficiency
echo "Checking service communication patterns..."
if grep -r "http://localhost" services/ --include="*.js" > /dev/null 2>&1; then
    log_low "Hardcoded localhost URLs found - consider service discovery"
    grep -r "http://localhost" services/ --include="*.js" | head -3
else
    log_good "No hardcoded service URLs found"
fi

# Check for caching
echo "Checking for caching implementation..."
if grep -r "cache\|redis\|memcached" services/ --include="*.js" > /dev/null 2>&1; then
    log_good "Caching implementation found"
else
    log_medium "No caching implementation found"
fi

echo ""
echo "================================"
echo "🚀 PERFORMANCE AUDIT SUMMARY"
echo "================================"
echo -e "${RED}Critical Issues: $CRITICAL_ISSUES${NC}"
echo -e "${YELLOW}Medium Issues: $MEDIUM_ISSUES${NC}"
echo -e "${BLUE}Low Issues: $LOW_ISSUES${NC}"

echo ""
echo "📊 PERFORMANCE RECOMMENDATIONS:"
echo "1. Implement database query pagination and limits"
echo "2. Use Promise.all for parallel async operations"
echo "3. Add request timeouts and connection pooling"
echo "4. Implement caching for frequently accessed data"
echo "5. Monitor bundle size and remove unused dependencies"
echo "6. Add performance monitoring and metrics"

if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo -e "${RED}🚨 CRITICAL PERFORMANCE ISSUES FOUND${NC}"
    exit 1
elif [ $MEDIUM_ISSUES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  PERFORMANCE IMPROVEMENTS RECOMMENDED${NC}"
    exit 1
else
    echo -e "${GREEN}✅ NO CRITICAL PERFORMANCE ISSUES FOUND${NC}"
    exit 0
fi
