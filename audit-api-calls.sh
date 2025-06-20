#!/bin/bash

# 🔍 COMPREHENSIVE API CALL DETECTOR SCRIPT
# Script này sẽ tìm TẤT CẢ API calls trong project

echo "🚀 Starting comprehensive API call detection..."
echo "================================================"

# Create output directory
mkdir -p audit-results
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"
echo ""

# Function to check if directory exists
check_dir() {
    if [ ! -d "$1" ]; then
        echo "❌ Directory $1 not found"
        return 1
    fi
    return 0
}

# 1. CLIENT-SIDE API CALLS
echo "🔍 1. SCANNING CLIENT-SIDE API CALLS..."
echo "========================================"

if check_dir "client/src/"; then
    echo "📋 Direct API object calls:"
    grep -rn "api\." client/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | head -20
    echo ""
    
    echo "📋 Fetch calls:"
    grep -rn "fetch(" client/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | head -20
    echo ""
    
    echo "📋 Axios calls:"
    grep -rn "axios\." client/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | head -10
    echo ""
    
    echo "📋 HTTP method calls (.get, .post, etc.):"
    grep -rn "\.get\|\.post\|\.put\|\.delete\|\.patch" client/src/ --include="*.js" --include="*.jsx" | grep -v "getElementById\|getAttribute" | head -20
    echo ""
    
    echo "📋 URL patterns with /api/:"
    grep -rn "/api/" client/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | head -20
    echo ""
    
    echo "📋 Base URL configurations:"
    grep -rn "baseURL\|BASE_URL\|API_BASE" client/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
    echo ""
    
    echo "📋 Localhost references:"
    grep -rn "localhost:" client/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
    echo ""
else
    echo "❌ Client directory not found, trying alternative paths..."
    # Try alternative paths
    for dir in "frontend" "web" "app" "src"; do
        if [ -d "$dir" ]; then
            echo "✅ Found alternative client directory: $dir"
            grep -rn "api\.\|fetch(\|/api/" "$dir" --include="*.js" --include="*.jsx" | head -10
            break
        fi
    done
fi

echo ""
echo "🔍 2. SCANNING SERVER-SIDE ROUTES..."
echo "===================================="

if check_dir "services/"; then
    echo "📋 Express router definitions:"
    grep -rn "router\." services/ --include="*.js" --include="*.ts" | head -20
    echo ""
    
    echo "📋 App route definitions:"
    grep -rn "app\." services/ --include="*.js" --include="*.ts" | grep -E "(\.get|\.post|\.put|\.delete|\.patch|\.use)" | head -20
    echo ""
    
    echo "📋 Route path patterns:"
    grep -rn "'/\|\"/" services/ --include="*.js" --include="*.ts" | grep -E "(get|post|put|delete|patch|use)" | head -20
    echo ""
    
    echo "📋 Proxy configurations:"
    grep -rn "proxy\|pathRewrite\|target.*http" services/ --include="*.js" --include="*.ts"
    echo ""
else
    echo "❌ Services directory not found, trying alternatives..."
    for dir in "server" "backend" "api" "src"; do
        if [ -d "$dir" ]; then
            echo "✅ Found alternative server directory: $dir"
            grep -rn "router\.\|app\." "$dir" --include="*.js" | grep -E "(get|post|put|delete)" | head -10
            break
        fi
    done
fi

echo ""
echo "🔍 3. SCANNING CONFIGURATION FILES..."
echo "===================================="

echo "📋 Environment files:"
find . -name ".env*" -o -name "*env*" | head -10
echo ""

echo "📋 Docker configurations:"
find . -name "docker-compose*.yml" -o -name "Dockerfile*" | head -10
echo ""

echo "📋 Package.json files:"
find . -name "package.json" | head -10
echo ""

echo "📋 API Gateway configurations:"
find . -name "*gateway*" -o -name "*proxy*" | head -10
echo ""

echo ""
echo "🔍 4. CROSS-REFERENCE ANALYSIS..."
echo "================================="

# Create temporary files for analysis
echo "📋 Extracting all client API calls..."
{
    grep -r "api\." client/src/ --include="*.js" --include="*.jsx" 2>/dev/null || true
    grep -r "fetch(" client/src/ --include="*.js" --include="*.jsx" 2>/dev/null || true
    grep -r "/api/" client/src/ --include="*.js" --include="*.jsx" 2>/dev/null || true
} > audit-results/client-api-calls.txt 2>/dev/null

echo "📋 Extracting all server routes..."
{
    grep -r "router\." services/ --include="*.js" 2>/dev/null || true
    grep -r "app\." services/ --include="*.js" 2>/dev/null | grep -E "(get|post|put|delete|patch|use)" || true
} > audit-results/server-routes.txt 2>/dev/null

echo ""
echo "📊 SUMMARY STATISTICS:"
echo "====================="

if [ -f "audit-results/client-api-calls.txt" ]; then
    client_calls=$(wc -l < audit-results/client-api-calls.txt)
    echo "📈 Total client API calls found: $client_calls"
else
    echo "📈 Total client API calls found: 0"
fi

if [ -f "audit-results/server-routes.txt" ]; then
    server_routes=$(wc -l < audit-results/server-routes.txt)
    echo "📈 Total server routes found: $server_routes"
else
    echo "📈 Total server routes found: 0"
fi

echo ""
echo "🎯 POTENTIAL MISMATCHES TO INVESTIGATE:"
echo "======================================="

# Look for common mismatch patterns
if [ -f "audit-results/client-api-calls.txt" ] && [ -f "audit-results/server-routes.txt" ]; then
    echo "📋 Looking for common mismatch patterns..."
    
    # Check for update/delete patterns
    echo "🔍 UPDATE/DELETE patterns:"
    grep -i "update\|delete" audit-results/client-api-calls.txt | head -5
    
    echo "🔍 Comments endpoints:"
    grep -i "comment" audit-results/client-api-calls.txt | head -5
    
    echo "🔍 Votes endpoints:"
    grep -i "vote" audit-results/client-api-calls.txt | head -5
else
    echo "❌ Cannot perform cross-reference analysis - missing data files"
fi

echo ""
echo "📁 Results saved to: audit-results/"
echo "✅ Audit complete!"
echo ""
echo "🔍 NEXT STEPS:"
echo "=============="
echo "1. Review audit-results/client-api-calls.txt"
echo "2. Review audit-results/server-routes.txt"
echo "3. Cross-check for URL mismatches"
echo "4. Verify all endpoints are properly routed"
echo "5. Test critical API flows"
