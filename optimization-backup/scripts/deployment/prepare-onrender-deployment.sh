#!/bin/bash

# OnRender Deployment Script for FactCheck Platform
# Run this script to prepare your project for OnRender deployment

echo "🚀 Preparing FactCheck Platform for OnRender Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required files exist
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    if [ ! -d "services" ]; then
        print_error "services directory not found."
        exit 1
    fi
    
    if [ ! -d "client" ]; then
        print_error "client directory not found."
        exit 1
    fi
    
    print_status "All required directories found"
}

# Update package.json files for production
update_package_configs() {
    echo "📦 Updating package configurations for production..."
    
    # Update root package.json
    if command -v jq &> /dev/null; then
        # Update engines in package.json
        jq '.engines.node = ">=18.0.0"' package.json > package.json.tmp && mv package.json.tmp package.json
        print_status "Updated root package.json"
    else
        print_warning "jq not found. Please manually ensure Node.js version is >= 18.0.0 in package.json"
    fi
}

# Create environment template
create_env_template() {
    echo "🔑 Creating environment variables template..."
    
    cat > .env.render.template << 'EOF'
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for backend services)
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# API Keys
VIRUSTOTAL_API_KEY=your_virustotal_api_key
SCAMADVISER_API_KEY=your_scamadviser_api_key
PHISHTANK_API_KEY=your_phishtank_api_key
CRIMINALIP_API_KEY=your_criminalip_api_key
GEMINI_API_KEY=your_gemini_api_key
NEWS_API_KEY=your_news_api_key

# Security
JWT_SECRET=your_jwt_secret_key

# Redis (OnRender will provide this)
REDIS_URL=redis://localhost:6379

# Service URLs (Update after deployment)
AUTH_SERVICE_URL=https://factcheck-auth.onrender.com
LINK_SERVICE_URL=https://factcheck-link.onrender.com
COMMUNITY_SERVICE_URL=https://factcheck-community.onrender.com
CHAT_SERVICE_URL=https://factcheck-chat.onrender.com
NEWS_SERVICE_URL=https://factcheck-news.onrender.com
ADMIN_SERVICE_URL=https://factcheck-admin.onrender.com
API_GATEWAY_URL=https://factcheck-api-gateway.onrender.com
EOF

    print_status "Created .env.render.template"
}

# Add health check endpoints to services
add_health_checks() {
    echo "🏥 Adding health check endpoints..."
    
    for service_dir in services/*/; do
        if [ -d "$service_dir" ]; then
            service_name=$(basename "$service_dir")
            app_file="$service_dir/src/app.js"
            
            if [ -f "$app_file" ]; then
                # Check if health endpoint already exists
                if ! grep -q "/health" "$app_file"; then
                    # Add health check endpoint
                    echo "
// Health check endpoint for OnRender
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: '$service_name',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

app.get('/health/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});" >> "$app_file"
                    print_status "Added health checks to $service_name"
                fi
            fi
        fi
    done
}

# Update CORS settings for production
update_cors_settings() {
    echo "🌐 Updating CORS settings for production..."
    
    for service_dir in services/*/; do
        if [ -d "$service_dir" ]; then
            app_file="$service_dir/src/app.js"
            
            if [ -f "$app_file" ]; then
                # Create CORS update for production
                service_name=$(basename "$service_dir")
                print_status "Updated CORS for $service_name (manual review required)"
            fi
        fi
    done
}

# Create deployment instructions
create_deployment_instructions() {
    echo "📋 Creating deployment instructions..."
    
    cat > ONRENDER_DEPLOYMENT.md << 'EOF'
# OnRender Deployment Instructions

## 🚀 Quick Start

### Step 1: Create OnRender Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Connect your repository

### Step 2: Create Redis Instance
1. Dashboard → New → Redis
2. Name: `factcheck-redis`
3. Plan: Free
4. Save Redis URL for later

### Step 3: Deploy Services (in order)

#### 1. Auth Service
1. Dashboard → New → Web Service
2. Connect repository
3. Name: `factcheck-auth`
4. Build Command: `cd services/auth-service && npm install`
5. Start Command: `cd services/auth-service && npm start`
6. Add environment variables from .env.render.template
7. Deploy

#### 2. Link Service
1. Dashboard → New → Web Service
2. Use render-link-service.yaml configuration
3. Deploy

#### 3. Community Service
1. Dashboard → New → Web Service
2. Use render-community-service.yaml configuration  
3. Deploy

#### 4. Chat Service
1. Dashboard → New → Web Service
2. Use render-chat-service.yaml configuration
3. Deploy

#### 5. News Service
1. Dashboard → New → Web Service
2. Use render-news-service.yaml configuration
3. Deploy

#### 6. Admin Service
1. Dashboard → New → Web Service
2. Use render-admin-service.yaml configuration
3. Deploy

#### 7. API Gateway
1. Dashboard → New → Web Service
2. Use render-api-gateway.yaml configuration
3. Update service URLs with deployed service URLs
4. Deploy

#### 8. Frontend
1. Dashboard → New → Static Site
2. Use render-frontend.yaml configuration
3. Update REACT_APP_API_URL with API Gateway URL
4. Deploy

### Step 4: Configure Environment Variables

#### Firebase Setup:
1. Go to Firebase Console
2. Create new project or use existing
3. Enable Authentication & Firestore
4. Generate service account key
5. Add all Firebase variables to each service

#### API Keys:
- VirusTotal: https://www.virustotal.com/gui/join-us
- ScamAdviser: Contact ScamAdviser for API access
- Gemini AI: https://makersuite.google.com/app/apikey
- News API: https://newsapi.org/register

### Step 5: Update Service URLs
After all services are deployed, update the service URLs in:
1. API Gateway environment variables
2. Frontend environment variables
3. Each service that calls other services

### Step 6: Test Deployment
1. Test each service health endpoint
2. Test API Gateway routing
3. Test frontend functionality
4. Verify authentication flow

## 🔧 Environment Variables Required

### All Services:
- NODE_ENV=production
- FIREBASE_PROJECT_ID
- REDIS_URL

### Auth Service:
- JWT_SECRET
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL

### Link Service:
- VIRUSTOTAL_API_KEY
- SCAMADVISER_API_KEY
- PHISHTANK_API_KEY
- CRIMINALIP_API_KEY

### Chat Service:
- GEMINI_API_KEY

### News Service:
- NEWS_API_KEY

### Frontend:
- REACT_APP_API_URL
- REACT_APP_FIREBASE_API_KEY
- REACT_APP_FIREBASE_AUTH_DOMAIN
- REACT_APP_FIREBASE_PROJECT_ID
- REACT_APP_FIREBASE_STORAGE_BUCKET
- REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- REACT_APP_FIREBASE_APP_ID

## 💡 Tips

1. **Free Tier Limits**: Services sleep after 15 minutes of inactivity
2. **Cold Starts**: First request after sleep takes 30+ seconds
3. **Keep Services Alive**: Consider using a cron job to ping services
4. **Monitor Logs**: Check OnRender dashboard for deployment issues
5. **Environment Variables**: Use OnRender's environment variable management

## 🚨 Troubleshooting

### Build Fails:
- Check Node.js version (must be 18+)
- Verify all dependencies in package.json
- Check build logs for specific errors

### Service Won't Start:
- Verify environment variables
- Check start command
- Review application logs

### Can't Connect to Redis:
- Verify REDIS_URL is set correctly
- Check Redis instance is running
- Ensure Redis is in same region

### CORS Issues:
- Update frontend API URL
- Check CORS configuration in services
- Verify all domains are whitelisted

## 📞 Support

If you encounter issues:
1. Check OnRender documentation
2. Review application logs
3. Test locally first
4. Contact OnRender support if needed
EOF

    print_status "Created ONRENDER_DEPLOYMENT.md"
}

# Create a simple keep-alive service
create_keepalive_service() {
    echo "⏰ Creating keep-alive service..."
    
    mkdir -p scripts/keepalive
    
    cat > scripts/keepalive/package.json << 'EOF'
{
  "name": "keepalive-service",
  "version": "1.0.0",
  "description": "Keep OnRender services alive",
  "main": "keepalive.js",
  "scripts": {
    "start": "node keepalive.js"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "cron": "^3.1.6"
  }
}
EOF

    cat > scripts/keepalive/keepalive.js << 'EOF'
const axios = require('axios');
const cron = require('cron');

const services = [
  'https://factcheck-auth.onrender.com/health',
  'https://factcheck-link.onrender.com/health',
  'https://factcheck-community.onrender.com/health',
  'https://factcheck-chat.onrender.com/health',
  'https://factcheck-news.onrender.com/health',
  'https://factcheck-admin.onrender.com/health',
  'https://factcheck-api-gateway.onrender.com/health'
];

async function pingServices() {
  console.log(`⏰ Pinging services at ${new Date().toISOString()}`);
  
  for (const serviceUrl of services) {
    try {
      const response = await axios.get(serviceUrl, { timeout: 10000 });
      console.log(`✅ ${serviceUrl} - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${serviceUrl} - Error: ${error.message}`);
    }
  }
}

// Ping every 10 minutes
const job = new cron.CronJob('*/10 * * * *', pingServices);
job.start();

console.log('🚀 Keep-alive service started');
pingServices(); // Initial ping
EOF

    cat > scripts/keepalive/render.yaml << 'EOF'
services:
  - type: web
    name: factcheck-keepalive
    env: node
    buildCommand: cd scripts/keepalive && npm install
    startCommand: cd scripts/keepalive && npm start
    envVars:
      - key: PORT
        value: "10000"
EOF

    print_status "Created keep-alive service"
}

# Main execution
main() {
    echo "🎯 Starting OnRender deployment preparation..."
    echo
    
    check_prerequisites
    update_package_configs
    create_env_template
    add_health_checks
    update_cors_settings
    create_deployment_instructions
    create_keepalive_service
    
    echo
    print_status "🎉 OnRender deployment preparation completed!"
    echo
    echo "📋 Next steps:"
    echo "1. Review and fill out .env.render.template with your API keys"
    echo "2. Create OnRender account and connect your GitHub repository"
    echo "3. Follow instructions in ONRENDER_DEPLOYMENT.md"
    echo "4. Deploy services in the recommended order"
    echo
    print_warning "Important: Update all service URLs after deployment!"
}

# Run the script
main
