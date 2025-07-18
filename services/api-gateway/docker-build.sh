#!/bin/bash

# Docker build script for API Gateway
# Usage: ./docker-build.sh [environment] [tag]
# Environments: development, production, render

set -e

ENVIRONMENT=${1:-production}
TAG=${2:-api-gateway}
BUILD_CONTEXT=${3:-local}

echo "🐳 Building API Gateway Docker image..."
echo "Environment: $ENVIRONMENT"
echo "Tag: $TAG"
echo "Build Context: $BUILD_CONTEXT"

# Set default port based on environment
case $ENVIRONMENT in
  "development")
    DEFAULT_PORT=3001
    ;;
  "render")
    DEFAULT_PORT=10000
    BUILD_CONTEXT="render"
    ;;
  *)
    DEFAULT_PORT=8080
    ;;
esac

# Build the Docker image
docker build \
  --build-arg NODE_ENV=$ENVIRONMENT \
  --build-arg BUILD_CONTEXT=$BUILD_CONTEXT \
  --build-arg DEFAULT_PORT=$DEFAULT_PORT \
  -t $TAG:$ENVIRONMENT \
  .

echo "✅ Docker image built successfully: $TAG:$ENVIRONMENT"
echo "🚀 To run: docker run -p $DEFAULT_PORT:$DEFAULT_PORT $TAG:$ENVIRONMENT"
