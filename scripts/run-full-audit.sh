#!/bin/bash
# 🔍 COMPREHENSIVE SYSTEM AUDIT
# Master script that runs all audit checks and generates a complete report

set -e

echo "🔍 COMPREHENSIVE SYSTEM AUDIT"
echo "============================="
echo "Date: $(date)"
echo "System: Anti-Fraud Platform Microservices"
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Create audit report directory
AUDIT_DIR="audit-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="$AUDIT_DIR/$TIMESTAMP"
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}📁 Audit reports will be saved to: $REPORT_DIR${NC}"
echo ""

# Function to run audit and capture output
run_audit() {
    local audit_name=$1
    local script_path=$2
    local output_file="$REPORT_DIR/${audit_name}_report.txt"
    
    echo -e "${PURPLE}🔍 Running $audit_name Audit...${NC}"
    echo "========================================"
    
    if [ -f "$script_path" ]; then
        # Make script executable
        chmod +x "$script_path"
        
        # Run audit and capture output
        if "$script_path" > "$output_file" 2>&1; then
            echo -e "${GREEN}✅ $audit_name audit completed successfully${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  $audit_name audit found issues${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ $audit_name audit script not found: $script_path${NC}"
        return 1
    fi
}

# Initialize counters
TOTAL_AUDITS=0
PASSED_AUDITS=0
FAILED_AUDITS=0

echo "🔒 SECURITY AUDIT"
echo "================="
((TOTAL_AUDITS++))
if run_audit "security" "scripts/audit-security.sh"; then
    ((PASSED_AUDITS++))
else
    ((FAILED_AUDITS++))
fi
echo ""

echo "🚀 PERFORMANCE AUDIT"
echo "==================="
((TOTAL_AUDITS++))
if run_audit "performance" "scripts/audit-performance.sh"; then
    ((PASSED_AUDITS++))
else
    ((FAILED_AUDITS++))
fi
echo ""

echo "🔗 API CONSISTENCY AUDIT"
echo "======================="
((TOTAL_AUDITS++))

# Create API consistency audit script on the fly
cat > scripts/audit-api-consistency.sh << 'EOF'
#!/bin/bash
echo "🔗 API Consistency Audit"
echo "========================"

# Check client API calls vs server routes
echo "Extracting client API calls..."
grep -r "api\." client/src/ --include="*.js" --include="*.jsx" | grep -o "/api/[^'\"]*" | sort | uniq > /tmp/client_apis.txt

echo "Extracting server routes..."
grep -r "router\." services/ --include="*.js" | grep -o "'/[^']*'" | tr -d "'" | sort | uniq > /tmp/server_routes.txt

echo "Checking for mismatches..."
echo "Client API calls not found in server routes:"
comm -23 /tmp/client_apis.txt /tmp/server_routes.txt

echo ""
echo "Server routes not called by client:"
comm -13 /tmp/client_apis.txt /tmp/server_routes.txt

# Clean up
rm -f /tmp/client_apis.txt /tmp/server_routes.txt

echo "✅ API consistency check completed"
EOF

chmod +x scripts/audit-api-consistency.sh
if run_audit "api-consistency" "scripts/audit-api-consistency.sh"; then
    ((PASSED_AUDITS++))
else
    ((FAILED_AUDITS++))
fi
echo ""

echo "🗄️ DATABASE AUDIT"
echo "================"
((TOTAL_AUDITS++))

# Create database audit script
cat > scripts/audit-database.sh << 'EOF'
#!/bin/bash
echo "🗄️ Database Audit"
echo "================"

echo "Checking for potential database issues..."

# Check for missing indexes
echo "1. Checking for complex queries that may need indexes..."
if grep -r "\.where.*\.where" services/ --include="*.js" > /dev/null 2>&1; then
    echo "⚠️  Complex queries found - ensure proper indexes exist:"
    grep -r "\.where.*\.where" services/ --include="*.js" | head -5
else
    echo "✅ No complex multi-where queries found"
fi

# Check for missing pagination
echo ""
echo "2. Checking for queries without pagination..."
if grep -r "\.get()" services/ --include="*.js" | grep -v "limit\|startAfter" > /dev/null 2>&1; then
    echo "⚠️  Queries without pagination found:"
    grep -r "\.get()" services/ --include="*.js" | grep -v "limit\|startAfter" | head -5
else
    echo "✅ All queries appear to have pagination"
fi

# Check for transaction usage
echo ""
echo "3. Checking for transaction usage..."
if grep -r "transaction\|batch" services/ --include="*.js" > /dev/null 2>&1; then
    echo "✅ Transaction usage found"
else
    echo "⚠️  No transaction usage found - consider for data consistency"
fi

echo ""
echo "✅ Database audit completed"
EOF

chmod +x scripts/audit-database.sh
if run_audit "database" "scripts/audit-database.sh"; then
    ((PASSED_AUDITS++))
else
    ((FAILED_AUDITS++))
fi
echo ""

echo "📦 DEPENDENCY AUDIT"
echo "=================="
((TOTAL_AUDITS++))

# Create dependency audit script
cat > scripts/audit-dependencies.sh << 'EOF'
#!/bin/bash
echo "📦 Dependency Audit"
echo "=================="

echo "Checking for vulnerable dependencies..."

if command -v npm &> /dev/null; then
    for service_dir in services/*/; do
        if [ -f "$service_dir/package.json" ]; then
            service_name=$(basename "$service_dir")
            echo "Auditing $service_name..."
            cd "$service_dir"
            
            # Run npm audit
            if npm audit --audit-level=moderate 2>/dev/null | grep -q "vulnerabilities"; then
                echo "⚠️  Vulnerabilities found in $service_name"
                npm audit --audit-level=moderate | head -10
            else
                echo "✅ No vulnerabilities in $service_name"
            fi
            
            cd - > /dev/null
        fi
    done
    
    # Check client dependencies
    if [ -f "client/package.json" ]; then
        echo "Auditing client dependencies..."
        cd client
        if npm audit --audit-level=moderate 2>/dev/null | grep -q "vulnerabilities"; then
            echo "⚠️  Vulnerabilities found in client"
            npm audit --audit-level=moderate | head -10
        else
            echo "✅ No vulnerabilities in client"
        fi
        cd ..
    fi
else
    echo "⚠️  npm not available for dependency audit"
fi

echo ""
echo "✅ Dependency audit completed"
EOF

chmod +x scripts/audit-dependencies.sh
if run_audit "dependencies" "scripts/audit-dependencies.sh"; then
    ((PASSED_AUDITS++))
else
    ((FAILED_AUDITS++))
fi
echo ""

# Generate comprehensive report
echo "📊 GENERATING COMPREHENSIVE REPORT"
echo "================================="

SUMMARY_REPORT="$REPORT_DIR/audit_summary.md"

cat > "$SUMMARY_REPORT" << EOF
# 🔍 COMPREHENSIVE AUDIT SUMMARY

**Date**: $(date)  
**System**: Anti-Fraud Platform Microservices  
**Total Audits**: $TOTAL_AUDITS  
**Passed**: $PASSED_AUDITS  
**Failed**: $FAILED_AUDITS  

## 📊 Audit Results

| Audit Type | Status | Report File |
|------------|--------|-------------|
| Security | $([ -f "$REPORT_DIR/security_report.txt" ] && echo "✅ Completed" || echo "❌ Failed") | security_report.txt |
| Performance | $([ -f "$REPORT_DIR/performance_report.txt" ] && echo "✅ Completed" || echo "❌ Failed") | performance_report.txt |
| API Consistency | $([ -f "$REPORT_DIR/api-consistency_report.txt" ] && echo "✅ Completed" || echo "❌ Failed") | api-consistency_report.txt |
| Database | $([ -f "$REPORT_DIR/database_report.txt" ] && echo "✅ Completed" || echo "❌ Failed") | database_report.txt |
| Dependencies | $([ -f "$REPORT_DIR/dependencies_report.txt" ] && echo "✅ Completed" || echo "❌ Failed") | dependencies_report.txt |

## 🎯 Priority Actions

### 🚨 Critical Issues (Fix Immediately)
EOF

# Extract critical issues from security report
if [ -f "$REPORT_DIR/security_report.txt" ]; then
    echo "#### Security Critical Issues" >> "$SUMMARY_REPORT"
    grep "🚨 CRITICAL:" "$REPORT_DIR/security_report.txt" | head -5 >> "$SUMMARY_REPORT" || echo "None found" >> "$SUMMARY_REPORT"
    echo "" >> "$SUMMARY_REPORT"
fi

# Extract critical issues from performance report
if [ -f "$REPORT_DIR/performance_report.txt" ]; then
    echo "#### Performance Critical Issues" >> "$SUMMARY_REPORT"
    grep "🚨 CRITICAL:" "$REPORT_DIR/performance_report.txt" | head -5 >> "$SUMMARY_REPORT" || echo "None found" >> "$SUMMARY_REPORT"
    echo "" >> "$SUMMARY_REPORT"
fi

cat >> "$SUMMARY_REPORT" << EOF

### ⚠️ Medium Priority Issues
- Review all medium priority items in individual reports
- Plan fixes for next sprint
- Monitor for impact on system performance

### 📋 Recommended Actions
1. **Immediate**: Fix all critical security and performance issues
2. **This Week**: Address medium priority security and performance issues
3. **This Month**: Implement monitoring improvements and documentation updates

## 📁 Report Files
All detailed reports are available in this directory:
- \`security_report.txt\` - Detailed security audit results
- \`performance_report.txt\` - Performance bottleneck analysis
- \`api-consistency_report.txt\` - API routing consistency check
- \`database_report.txt\` - Database optimization recommendations
- \`dependencies_report.txt\` - Dependency vulnerability scan

## 🛠️ Next Steps
1. Review individual audit reports for detailed findings
2. Run \`scripts/apply-security-fixes.sh\` to apply automated fixes
3. Implement manual fixes for complex issues
4. Re-run audits to verify fixes
5. Update monitoring and alerting based on findings

---
*Generated by Comprehensive System Audit v1.0*
EOF

echo -e "${GREEN}✅ Comprehensive audit report generated: $SUMMARY_REPORT${NC}"

# Display summary
echo ""
echo "================================"
echo "🔍 AUDIT SUMMARY"
echo "================================"
echo -e "Total Audits: ${BLUE}$TOTAL_AUDITS${NC}"
echo -e "Passed: ${GREEN}$PASSED_AUDITS${NC}"
echo -e "Failed: ${RED}$FAILED_AUDITS${NC}"
echo ""
echo -e "📁 Reports saved to: ${BLUE}$REPORT_DIR${NC}"
echo -e "📊 Summary report: ${BLUE}$SUMMARY_REPORT${NC}"

if [ $FAILED_AUDITS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Some audits found issues. Review the reports and run fixes.${NC}"
    echo -e "${BLUE}💡 Run 'scripts/apply-security-fixes.sh' to apply automated fixes${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}✅ All audits passed successfully!${NC}"
    exit 0
fi
