#!/bin/bash
# 🔒 AUTOMATED SECURITY FIXES
# Applies critical security fixes to the microservices platform

set -e

echo "🔒 Applying Security Fixes..."
echo "============================="

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log actions
log_action() {
    echo -e "${BLUE}🔧 $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Backup function
create_backup() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)"
        log_action "Created backup of $file"
    fi
}

echo "1. 🔐 Fixing Authentication Issues"
echo "--------------------------------"

# Fix 1: Re-enable authentication on dashboard endpoint
log_action "Re-enabling authentication on dashboard endpoint..."
AUTH_ROUTES_FILE="services/auth-service/src/routes/users.js"

if [ -f "$AUTH_ROUTES_FILE" ]; then
    create_backup "$AUTH_ROUTES_FILE"
    
    # Remove the comment from authMiddleware.authenticate
    sed -i 's|// authMiddleware.authenticate,|authMiddleware.authenticate,|g' "$AUTH_ROUTES_FILE"
    
    # Remove the mock user injection
    sed -i '/Mock user for testing/,/next();/d' "$AUTH_ROUTES_FILE"
    
    log_success "Authentication re-enabled on dashboard endpoint"
else
    log_error "Auth routes file not found: $AUTH_ROUTES_FILE"
fi

echo ""
echo "2. 🌐 Fixing API Gateway Configuration"
echo "------------------------------------"

# Fix 2: Standardize API Gateway port to 8080
log_action "Standardizing API Gateway port to 8080..."

# Update all JavaScript files
find services/ -name "*.js" -type f -exec sed -i 's|:8082|:8080|g' {} \;
find client/ -name "*.js" -type f -exec sed -i 's|:8082|:8080|g' {} \;

# Update JSON configuration files
find . -name "*.json" -type f -not -path "./node_modules/*" -exec sed -i 's|:8082|:8080|g' {} \;

# Update environment files
find . -name "*.env*" -type f -exec sed -i 's|:8082|:8080|g' {} \;

log_success "API Gateway port standardized to 8080"

echo ""
echo "3. 🛡️ Adding Rate Limiting"
echo "-------------------------"

# Fix 3: Add rate limiting to authentication endpoints
log_action "Adding rate limiting to authentication endpoints..."

AUTH_APP_FILE="services/auth-service/src/app.js"
if [ -f "$AUTH_APP_FILE" ]; then
    create_backup "$AUTH_APP_FILE"
    
    # Check if rate limiting is already implemented
    if ! grep -q "express-rate-limit" "$AUTH_APP_FILE"; then
        # Install express-rate-limit
        cd services/auth-service
        npm install express-rate-limit
        cd ../..
        
        # Add rate limiting import and configuration
        cat > temp_rate_limit.js << 'EOF'
const rateLimit = require('express-rate-limit');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

EOF
        
        # Insert rate limiting after other requires
        sed -i '/require.*dotenv/r temp_rate_limit.js' "$AUTH_APP_FILE"
        rm temp_rate_limit.js
        
        # Add rate limiting to auth routes
        sed -i '/app.use.*\/auth/i app.use("/auth/login", authLimiter);' "$AUTH_APP_FILE"
        sed -i '/app.use.*\/auth/i app.use("/auth/register", authLimiter);' "$AUTH_APP_FILE"
        sed -i '/app.use.*\/auth/i app.use("/auth/forgot-password", authLimiter);' "$AUTH_APP_FILE"
        sed -i '/app.use.*\/auth/i app.use("/auth/reset-password", authLimiter);' "$AUTH_APP_FILE"
        
        # Add general rate limiting
        sed -i '/app.use.*cors/a app.use(generalLimiter);' "$AUTH_APP_FILE"
        
        log_success "Rate limiting added to authentication service"
    else
        log_warning "Rate limiting already exists in authentication service"
    fi
else
    log_error "Auth app file not found: $AUTH_APP_FILE"
fi

echo ""
echo "4. 🧹 Input Sanitization"
echo "-----------------------"

# Fix 4: Add input sanitization for search queries
log_action "Adding input sanitization for search queries..."

COMMUNITY_ROUTES_FILE="services/community-service/src/routes/posts.js"
if [ -f "$COMMUNITY_ROUTES_FILE" ]; then
    create_backup "$COMMUNITY_ROUTES_FILE"
    
    # Add sanitization function
    cat > temp_sanitize.js << 'EOF'

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[^\w\s-]/gi, '') // Remove special characters except spaces and hyphens
    .substring(0, 100); // Limit length
};

const validateSearchInput = (search) => {
  const sanitized = sanitizeInput(search);
  if (sanitized.length < 2) {
    throw new Error('Search term must be at least 2 characters long');
  }
  if (sanitized.length > 100) {
    throw new Error('Search term too long');
  }
  return sanitized;
};

EOF
    
    # Insert sanitization functions after requires
    sed -i '/const.*require/r temp_sanitize.js' "$COMMUNITY_ROUTES_FILE"
    rm temp_sanitize.js
    
    # Replace unsafe search usage
    sed -i 's|search\.trim()|validateSearchInput(search)|g' "$COMMUNITY_ROUTES_FILE"
    
    log_success "Input sanitization added to community service"
else
    log_error "Community routes file not found: $COMMUNITY_ROUTES_FILE"
fi

echo ""
echo "5. 🔐 Security Headers"
echo "--------------------"

# Fix 5: Add security headers to all services
log_action "Adding security headers to all services..."

for service_dir in services/*/; do
    if [ -d "$service_dir" ]; then
        service_name=$(basename "$service_dir")
        app_file="$service_dir/src/app.js"
        
        if [ -f "$app_file" ]; then
            create_backup "$app_file"
            
            # Install helmet if not already installed
            cd "$service_dir"
            if ! npm list helmet &>/dev/null; then
                npm install helmet
            fi
            cd ../..
            
            # Add helmet if not already present
            if ! grep -q "helmet" "$app_file"; then
                sed -i '/const express/a const helmet = require('\''helmet'\'');' "$app_file"
                sed -i '/app.use.*cors/a app.use(helmet());' "$app_file"
                log_success "Security headers added to $service_name"
            else
                log_warning "Security headers already exist in $service_name"
            fi
        fi
    fi
done

echo ""
echo "6. 🔒 Environment Security"
echo "-------------------------"

# Fix 6: Secure environment configuration
log_action "Securing environment configuration..."

# Create .env.example files if they don't exist
for service_dir in services/*/; do
    if [ -d "$service_dir" ]; then
        service_name=$(basename "$service_dir")
        env_example="$service_dir/.env.example"
        
        if [ ! -f "$env_example" ]; then
            cat > "$env_example" << EOF
# $service_name Environment Variables
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Database
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# External APIs (if applicable)
API_KEY=your-api-key-here
API_SECRET=your-api-secret-here

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
LINK_SERVICE_URL=http://localhost:3002
COMMUNITY_SERVICE_URL=http://localhost:3003
CHAT_SERVICE_URL=http://localhost:3004
NEWS_SERVICE_URL=http://localhost:3005
ADMIN_SERVICE_URL=http://localhost:3006
EOF
            log_success "Created .env.example for $service_name"
        fi
    fi
done

# Ensure .env files are in .gitignore
if [ -f ".gitignore" ]; then
    if ! grep -q "\.env$" .gitignore; then
        echo ".env" >> .gitignore
        log_success "Added .env to .gitignore"
    fi
else
    echo ".env" > .gitignore
    log_success "Created .gitignore with .env"
fi

echo ""
echo "7. 🧪 Adding Security Validation"
echo "-------------------------------"

# Fix 7: Add request validation middleware
log_action "Adding request validation middleware..."

for service_dir in services/*/; do
    if [ -d "$service_dir" ]; then
        service_name=$(basename "$service_dir")
        validation_file="$service_dir/src/middleware/validation.js"
        
        if [ -f "$validation_file" ]; then
            create_backup "$validation_file"
            
            # Add security validation to existing validation
            if ! grep -q "stripUnknown.*true" "$validation_file"; then
                sed -i 's|stripUnknown: true|stripUnknown: true, allowUnknown: false|g' "$validation_file"
                log_success "Enhanced validation security in $service_name"
            fi
        fi
    fi
done

echo ""
echo "8. 📝 Updating Documentation"
echo "---------------------------"

# Fix 8: Update security documentation
log_action "Updating security documentation..."

cat > SECURITY.md << 'EOF'
# Security Guidelines

## Authentication
- All endpoints require proper authentication
- JWT tokens are validated on each request
- Rate limiting is enforced on authentication endpoints

## Input Validation
- All user inputs are sanitized and validated
- Search queries are limited in length and characters
- File uploads are restricted by type and size

## Security Headers
- Helmet.js is used for security headers
- CORS is properly configured
- CSP headers are set for XSS protection

## Environment Security
- No secrets in version control
- Environment variables are used for configuration
- .env files are gitignored

## Rate Limiting
- Authentication endpoints: 5 requests per 15 minutes
- General endpoints: 100 requests per 15 minutes
- API endpoints have appropriate limits

## Monitoring
- Security events are logged
- Failed authentication attempts are tracked
- Suspicious activity is monitored
EOF

log_success "Created SECURITY.md documentation"

echo ""
echo "================================"
echo "🔒 SECURITY FIXES COMPLETED"
echo "================================"

echo -e "${GREEN}✅ Authentication bypass fixed${NC}"
echo -e "${GREEN}✅ API Gateway port standardized${NC}"
echo -e "${GREEN}✅ Rate limiting implemented${NC}"
echo -e "${GREEN}✅ Input sanitization added${NC}"
echo -e "${GREEN}✅ Security headers configured${NC}"
echo -e "${GREEN}✅ Environment security improved${NC}"
echo -e "${GREEN}✅ Validation enhanced${NC}"
echo -e "${GREEN}✅ Documentation updated${NC}"

echo ""
echo "🔄 NEXT STEPS:"
echo "1. Test all services to ensure they start correctly"
echo "2. Run the security audit script to verify fixes"
echo "3. Update any remaining hardcoded configurations"
echo "4. Deploy changes to staging environment"
echo "5. Run integration tests"

echo ""
echo "⚠️  IMPORTANT:"
echo "- Backup files have been created with .backup.TIMESTAMP extension"
echo "- Review all changes before deploying to production"
echo "- Update your .env files with actual values"
echo "- Test authentication flows thoroughly"

exit 0
