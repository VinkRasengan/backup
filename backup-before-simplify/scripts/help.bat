@echo off
REM =============================================================================
REM 📚 Help Script - Anti-Fraud Platform Commands
REM =============================================================================

echo.
echo 🚀 Anti-Fraud Platform - Available Commands
echo ============================================
echo.
echo 📦 SETUP & INSTALLATION:
echo   npm run setup              - Install all dependencies
echo   npm run setup:env          - Setup environment variables
echo.
echo 🚀 DEPLOYMENT:
echo   npm run start              - Start all services (full stack)
echo   npm run start:full         - Start all services with frontend
echo   npm run start:safe         - Start with port conflict resolution
echo   npm run deploy             - Quick deploy (Windows)
echo   npm run deploy:local       - Deploy locally (no Docker)
echo   npm run deploy:docker      - Deploy with Docker
echo   npm run deploy:k8s         - Deploy to Kubernetes
echo.
echo 🛑 STOP SERVICES:
echo   npm run stop               - Stop all services
echo   npm run kill:all           - Kill all processes
echo   npm run restart            - Restart all services
echo   npm run restart:safe       - Safe restart with port checks
echo.
echo 🐳 DOCKER COMMANDS:
echo   npm run docker:check       - Check Docker status
echo   npm run docker:up          - Start Docker containers
echo   npm run docker:down        - Stop Docker containers
echo   npm run docker:build       - Build Docker images
echo   npm run docker:logs        - View Docker logs
echo   npm run docker:restart     - Restart Docker containers
echo.
echo ☸️ KUBERNETES COMMANDS:
echo   npm run k8s:apply          - Deploy to Kubernetes
echo   npm run k8s:delete         - Delete from Kubernetes
echo   npm run k8s:status         - Check K8s pod status
echo   npm run k8s:logs           - View K8s logs
echo   npm run k8s:port-forward   - Port forward API Gateway
echo.
echo 🔍 HEALTH & MONITORING:
echo   npm run health             - Check API Gateway health
echo   npm run health:all         - Check all services health
echo   npm run status             - Service status
echo   npm run test:health        - Test all endpoints
echo   npm run test:services      - Test services endpoint
echo   npm run test:api           - Test API Gateway
echo   npm run test:frontend      - Test frontend
echo.
echo 📋 LOGS & DEBUGGING:
echo   npm run logs               - View logs (local)
echo   npm run logs:docker        - View Docker logs
echo   npm run logs:k8s           - View Kubernetes logs
echo.
echo 🧹 CLEANUP:
echo   npm run clean              - Stop services and Docker
echo   npm run clean:all          - Full cleanup with Docker prune
echo.
echo 🌐 QUICK ACCESS:
echo   npm run info               - Show service URLs
echo   npm run open               - Open frontend in browser
echo   npm run open:api           - Open API Gateway in browser
echo.
echo 📚 HELP:
echo   npm run help               - Show this help
echo.
echo 🔗 Service URLs:
echo   Frontend:    http://localhost:3000
echo   API Gateway: http://localhost:8082
echo   Auth:        http://localhost:3001
echo   Link:        http://localhost:3002
echo   Community:   http://localhost:3003
echo   Chat:        http://localhost:3004
echo   News:        http://localhost:3005
echo   Admin:       http://localhost:3006
echo.
