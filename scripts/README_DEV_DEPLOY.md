# 🚀 Development Deployment Script

A comprehensive deployment script for easy development and debugging of the Anti-Fraud Platform microservices.

## Features

- **🎯 One-command deployment** - Start all services with a single command
- **🔧 Smart building** - Only rebuilds when necessary, saves time
- **📊 Health monitoring** - Automatic health checks and service status
- **🐛 Debug mode** - Detailed logging and system information
- **🎛️ Service management** - Start, stop, restart individual services
- **🧹 Cleanup utilities** - Easy cleanup of containers and images
- **💻 Cross-platform** - Works on Linux, macOS, and Windows

## Quick Start

### Linux/macOS
```bash
# Make executable (first time only)
chmod +x scripts/dev-deploy.sh

# Start all services
./scripts/dev-deploy.sh

# Or with specific commands
./scripts/dev-deploy.sh start
./scripts/dev-deploy.sh setup    # First-time setup
./scripts/dev-deploy.sh health   # Check service health
```

### Windows
```cmd
# Start all services
scripts\dev-deploy.bat

# Or with specific commands
scripts\dev-deploy.bat start
scripts\dev-deploy.bat setup    # First-time setup
scripts\dev-deploy.bat health   # Check service health
```

## Commands

### Core Commands
- `start`, `up`, `deploy` - Start all services (default)
- `stop`, `down` - Stop all services
- `restart` - Restart all services
- `rebuild` - Force rebuild and start all services

### Management Commands
- `logs` - Show logs for all services
- `status`, `ps` - Show service status and resource usage
- `health` - Check service health endpoints
- `clean` - Clean up containers, images, and volumes

### Utility Commands
- `setup` - Initial setup and environment validation
- `debug` - Start in debug mode with detailed logging
- `help` - Show usage information

## Options

- `--service <name>` - Target specific service (e.g., `auth`, `api-gateway`)
- `--no-build` - Skip building, use existing images
- `--force` - Force action without confirmation
- `--verbose` - Enable verbose output
- `--follow` - Follow logs in real-time

## Examples

### Basic Usage
```bash
# Start all services
./scripts/dev-deploy.sh start

# Stop all services
./scripts/dev-deploy.sh stop

# Restart all services
./scripts/dev-deploy.sh restart
```

### Service-Specific Operations
```bash
# Restart only the auth service
./scripts/dev-deploy.sh restart --service auth-service

# Show logs for API gateway
./scripts/dev-deploy.sh logs --service api-gateway

# Follow logs for community service
./scripts/dev-deploy.sh logs --service community-service --follow
```

### Development Workflow
```bash
# Initial setup
./scripts/dev-deploy.sh setup

# Start development environment
./scripts/dev-deploy.sh start

# Check if everything is working
./scripts/dev-deploy.sh health

# View logs when debugging
./scripts/dev-deploy.sh logs --follow

# Force rebuild after code changes
./scripts/dev-deploy.sh rebuild --force

# Clean up when done
./scripts/dev-deploy.sh clean
```

### Debug and Troubleshooting
```bash
# Start in debug mode
./scripts/dev-deploy.sh debug

# Check service status
./scripts/dev-deploy.sh status

# Check health of all services
./scripts/dev-deploy.sh health

# View recent logs
./scripts/dev-deploy.sh logs

# Clean everything and start fresh
./scripts/dev-deploy.sh clean --force
./scripts/dev-deploy.sh rebuild
```

## Service URLs

After successful deployment, you can access:

### Main Application
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Admin Panel**: http://localhost:3006

### Individual Services
- **Auth Service**: http://localhost:3001
- **Link Service**: http://localhost:3002
- **Community Service**: http://localhost:3003
- **Chat Service**: http://localhost:3004
- **News Service**: http://localhost:3005

### Monitoring & Debugging
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3007 (admin/admin)
- **Jaeger Tracing**: http://localhost:16686
- **Redis**: localhost:6379

## Prerequisites

### Required Software
- **Docker Desktop** (latest version)
- **Docker Compose** (included with Docker Desktop)
- **Git Bash** (Windows users)
- **curl** (for health checks)

### System Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space minimum
- **CPU**: Multi-core processor recommended

## Environment Setup

The script will automatically create a `.env` template file on first run. You need to configure:

### Required Configuration
1. **Firebase Settings**
   - Project ID, service account email, private key
   - Web app configuration for React

2. **JWT Secret**
   - Strong secret key (32+ characters)

3. **API Keys**
   - Gemini AI, VirusTotal, ScamAdviser
   - ScreenshotLayer, NewsAPI, NewsData

### Configuration Files
- `.env` - Environment variables (created automatically)
- `docker-compose.microservices.yml` - Service definitions
- `DEPLOYMENT_SETUP.md` - Detailed setup instructions

## Troubleshooting

### Common Issues

#### Docker not running
```bash
# Error: Cannot connect to Docker daemon
# Solution: Start Docker Desktop
```

#### Port conflicts
```bash
# Error: Port already in use
# Solution: Stop conflicting services or change ports in docker-compose.yml
```

#### Environment validation failed
```bash
# Error: Missing required environment variables
# Solution: Update .env file with correct values
./scripts/dev-deploy.sh setup
```

#### Out of memory
```bash
# Error: Container killed due to memory
# Solution: Increase Docker memory in Docker Desktop settings
```

#### Services not responding
```bash
# Check logs for specific service
./scripts/dev-deploy.sh logs --service auth-service

# Check overall status
./scripts/dev-deploy.sh status

# Restart problematic service
./scripts/dev-deploy.sh restart --service auth-service
```

### Debug Commands
```bash
# System information and debug mode
./scripts/dev-deploy.sh debug

# Check Docker resources
docker system df
docker stats

# View all containers
docker ps -a

# Check networks
docker network ls
```

## Advanced Usage

### Custom Docker Compose
```bash
# Use different compose file
COMPOSE_FILE=docker-compose.prod.yml ./scripts/dev-deploy.sh start
```

### Environment Variables
```bash
# Override specific variables
VERBOSE=true ./scripts/dev-deploy.sh start
```

### Integration with IDEs
Add to your IDE's run configurations:
```bash
# VS Code tasks.json
{
    "label": "Start Dev Environment",
    "type": "shell",
    "command": "./scripts/dev-deploy.sh start"
}
```

## Contributing

When modifying the deployment script:

1. Test on multiple platforms (Linux, macOS, Windows)
2. Update this README with new features
3. Ensure backward compatibility
4. Add appropriate error handling
5. Update the Windows batch file equivalent

## Support

For issues with the deployment script:

1. Check the troubleshooting section above
2. Run `./scripts/dev-deploy.sh debug` for detailed information
3. Check Docker logs: `docker-compose logs [service-name]`
4. Verify environment configuration in `.env`
5. Ensure system meets minimum requirements
