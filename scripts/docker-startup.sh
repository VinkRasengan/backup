#!/bin/bash

# Docker Startup Script with Firebase Validation
# This script runs before starting the main application in Docker containers

set -e  # Exit on any error

echo "🐳 Docker Startup Script Starting..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if running in Docker
if [ -f /.dockerenv ] || [ "$DOCKER_CONTAINER" = "true" ]; then
    print_status $BLUE "📦 Running in Docker container"
    IS_DOCKER=true
else
    print_status $YELLOW "💻 Running in local environment"
    IS_DOCKER=false
fi

# Environment check
print_status $BLUE "🔍 Checking environment variables..."

# Required environment variables
REQUIRED_VARS=(
    "NODE_ENV"
    "PORT"
)

# Firebase-specific variables (if Firebase is enabled)
if [ "$DISABLE_FIREBASE" != "true" ]; then
    FIREBASE_VARS=(
        "FIREBASE_PROJECT_ID"
        "FIREBASE_CLIENT_EMAIL"
        "FIREBASE_PRIVATE_KEY"
    )
    REQUIRED_VARS+=("${FIREBASE_VARS[@]}")
fi

# Check required variables
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
        print_status $RED "❌ Missing: $var"
    else
        if [[ "$var" == *"KEY"* ]] || [[ "$var" == *"SECRET"* ]]; then
            print_status $GREEN "✅ $var: SET (hidden)"
        else
            print_status $GREEN "✅ $var: ${!var}"
        fi
    fi
done

# Exit if missing required variables
if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_status $RED "💥 Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    print_status $RED "Please set these variables and restart the container."
    exit 1
fi

# Network connectivity check (Docker only)
if [ "$IS_DOCKER" = true ]; then
    print_status $BLUE "🌐 Testing network connectivity..."
    
    # Test basic connectivity
    if ping -c 1 google.com >/dev/null 2>&1; then
        print_status $GREEN "✅ Internet connectivity: OK"
    else
        print_status $RED "❌ Internet connectivity: FAILED"
        print_status $YELLOW "⚠️  This may cause Firebase connection issues"
    fi
    
    # Test DNS resolution for Firebase
    if nslookup firebase.googleapis.com >/dev/null 2>&1; then
        print_status $GREEN "✅ Firebase DNS resolution: OK"
    else
        print_status $RED "❌ Firebase DNS resolution: FAILED"
    fi
fi

# Firebase connection test (if enabled)
if [ "$DISABLE_FIREBASE" != "true" ] && [ -n "$FIREBASE_PROJECT_ID" ]; then
    print_status $BLUE "🔥 Testing Firebase connection..."
    
    # Run Firebase connection test
    if node /app/scripts/docker-firebase-setup.js; then
        print_status $GREEN "✅ Firebase connection: OK"
    else
        print_status $RED "❌ Firebase connection: FAILED"
        
        # Check if we should continue without Firebase
        if [ "$NODE_ENV" = "development" ]; then
            print_status $YELLOW "⚠️  Continuing in development mode without Firebase"
            export DISABLE_FIREBASE=true
        else
            print_status $RED "💥 Cannot start in production without Firebase"
            exit 1
        fi
    fi
else
    print_status $YELLOW "⚠️  Firebase disabled or not configured"
fi

# Service-specific checks
SERVICE_NAME=${SERVICE_NAME:-"unknown"}
print_status $BLUE "🔧 Service-specific checks for: $SERVICE_NAME"

case "$SERVICE_NAME" in
    "auth-service")
        if [ -z "$JWT_SECRET" ]; then
            print_status $RED "❌ JWT_SECRET required for auth service"
            exit 1
        fi
        print_status $GREEN "✅ Auth service configuration: OK"
        ;;
    "admin-service"|"community-service"|"chat-service")
        if [ "$DISABLE_FIREBASE" = "true" ]; then
            print_status $YELLOW "⚠️  $SERVICE_NAME running without Firebase"
        fi
        ;;
    "link-service")
        print_status $GREEN "✅ Link service configuration: OK"
        ;;
    *)
        print_status $BLUE "ℹ️  Generic service startup"
        ;;
esac

# Redis connectivity check (if Redis is configured)
if [ -n "$REDIS_URL" ] || [ -n "$REDIS_HOST" ]; then
    print_status $BLUE "📦 Testing Redis connectivity..."
    
    # Extract Redis host from URL or use REDIS_HOST
    if [ -n "$REDIS_URL" ]; then
        REDIS_HOST_TO_TEST=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        REDIS_PORT_TO_TEST=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\)$/\1/p')
    else
        REDIS_HOST_TO_TEST=${REDIS_HOST:-"localhost"}
        REDIS_PORT_TO_TEST=${REDIS_PORT:-"6379"}
    fi
    
    # Test Redis connection
    if timeout 5 bash -c "</dev/tcp/$REDIS_HOST_TO_TEST/$REDIS_PORT_TO_TEST" 2>/dev/null; then
        print_status $GREEN "✅ Redis connectivity: OK ($REDIS_HOST_TO_TEST:$REDIS_PORT_TO_TEST)"
    else
        print_status $YELLOW "⚠️  Redis connectivity: FAILED ($REDIS_HOST_TO_TEST:$REDIS_PORT_TO_TEST)"
        print_status $YELLOW "   Service will continue but caching may not work"
    fi
fi

# Wait for dependencies (Docker only)
if [ "$IS_DOCKER" = true ]; then
    print_status $BLUE "⏳ Waiting for dependencies..."
    
    # Wait for Redis if configured
    if [ -n "$REDIS_HOST_TO_TEST" ]; then
        print_status $BLUE "   Waiting for Redis..."
        timeout 30 bash -c "until timeout 1 bash -c '</dev/tcp/$REDIS_HOST_TO_TEST/$REDIS_PORT_TO_TEST'; do sleep 1; done" || {
            print_status $YELLOW "⚠️  Redis not available after 30s, continuing anyway"
        }
    fi
    
    # Wait for other services if needed
    if [ -n "$EVENT_BUS_SERVICE_URL" ]; then
        EVENT_BUS_HOST=$(echo "$EVENT_BUS_SERVICE_URL" | sed -n 's|http://\([^:]*\):.*|\1|p')
        EVENT_BUS_PORT=$(echo "$EVENT_BUS_SERVICE_URL" | sed -n 's|.*:\([0-9]*\)$|\1|p')
        
        if [ -n "$EVENT_BUS_HOST" ] && [ -n "$EVENT_BUS_PORT" ]; then
            print_status $BLUE "   Waiting for Event Bus Service..."
            timeout 30 bash -c "until timeout 1 bash -c '</dev/tcp/$EVENT_BUS_HOST/$EVENT_BUS_PORT'; do sleep 1; done" || {
                print_status $YELLOW "⚠️  Event Bus Service not available after 30s, continuing anyway"
            }
        fi
    fi
fi

# Final startup message
print_status $GREEN "🚀 All checks completed successfully!"
print_status $BLUE "Starting $SERVICE_NAME on port ${PORT:-3000}..."
print_status $BLUE "Environment: ${NODE_ENV:-development}"
print_status $BLUE "Firebase: $([ "$DISABLE_FIREBASE" = "true" ] && echo "DISABLED" || echo "ENABLED")"

echo "=================================="
echo ""

# Execute the main command
exec "$@"
