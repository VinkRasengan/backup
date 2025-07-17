# Optimized Dockerfile for Render deployment - phishtank-service
# This Dockerfile is designed to work with only files in the service directory

# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Dependencies stage
FROM base AS deps

# Copy package files for dependency installation
COPY package*.json ./

# Install production dependencies with optimizations
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --only=production --no-audit --no-fund --prefer-offline && \
    npm cache clean --force

# Development stage
FROM base AS dev

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy all source code
COPY . .

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3007

# Development command with hot reload
CMD ["dumb-init", "npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy all application code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user for security
USER nodejs

# Expose port
EXPOSE 3007

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3007/health || exit 1

# Start the application with proper signal handling
CMD ["dumb-init", "node", "src/app.js"]
