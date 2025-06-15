#!/bin/bash

# Stop microservices

set -e

echo "🛑 Stopping Anti-Fraud Platform Microservices..."

# Stop all services
docker-compose -f docker-compose.microservices.yml down

# Remove unused containers, networks, and images
echo "🧹 Cleaning up..."
docker system prune -f

echo "✅ All microservices stopped and cleaned up!"
