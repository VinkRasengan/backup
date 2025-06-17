@echo off
REM =============================================================================
REM Help Script - FactCheck Platform Commands (Fixed Font)
REM =============================================================================

echo FactCheck Platform - Available Commands
echo ========================================
echo.

echo PROJECT MANAGEMENT:
echo   npm start                    - Start full application
echo   npm run dev                  - Start in development mode
echo   npm run install:all          - Install all dependencies
echo.

echo DOCKER COMMANDS:
echo   npm run docker:check         - Check Docker status
echo   npm run docker:fix           - Fix Docker issues
echo   npm run docker:status        - Vietnamese status check
echo   npm run docker:monitor       - Monitor Docker continuously
echo   npm run docker:up            - Start containers
echo   npm run docker:down          - Stop containers
echo   npm run docker:logs          - View container logs
echo   npm run docker:restart       - Restart Docker completely
echo.

echo DEPLOYMENT:
echo   npm run deploy               - Quick deploy
echo   npm run deploy:local         - Deploy locally
echo   npm run deploy:docker        - Deploy with Docker
echo   npm run deploy:k8s           - Deploy to Kubernetes
echo.

echo MONITORING:
echo   npm run monitoring:install   - Install monitoring tools
echo   npm run monitoring:start     - Start monitoring
echo   npm run monitoring:stop      - Stop monitoring
echo   npm run monitoring:status    - Check monitoring status
echo.

echo TROUBLESHOOTING:
echo   npm run fix:ports            - Fix port conflicts
echo   npm run validate:ports       - Check port availability
echo   npm run kill:all             - Stop all services
echo   npm run clean                - Clean up everything
echo.

echo HEALTH CHECKS:
echo   npm run health               - Check service health
echo   npm run test:health          - Test all endpoints
echo   npm run status               - Overall system status
echo.

echo For more help, check:
echo   - docs/DOCKER_TROUBLESHOOTING.md
echo   - docs/PORT_MAPPING.md
echo   - README.md
echo.
pause
