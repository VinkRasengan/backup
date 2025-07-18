# Multi-stage Dockerfile for API Gateway
# Supports development, production, and Render deployment
FROM node:18-alpine

# Build arguments for different environments
ARG NODE_ENV=production
ARG BUILD_CONTEXT=local
ARG DEFAULT_PORT=8080

# Install system dependencies
RUN apk add --no-cache dumb-init curl

# Create app directory and non-root user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies based on environment
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    if [ "$NODE_ENV" = "development" ]; then \
        npm ci; \
    else \
        npm install --only=production --no-audit --no-fund --prefer-offline; \
    fi && \
    npm cache clean --force

# Copy application code
COPY . .

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (configurable via build arg)
EXPOSE ${DEFAULT_PORT}

# Health check with configurable port
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-${DEFAULT_PORT}}/health || exit 1

# Start command based on environment
CMD if [ "$NODE_ENV" = "development" ]; then \
        dumb-init npm run dev; \
    else \
        dumb-init node app.js; \
    fi
