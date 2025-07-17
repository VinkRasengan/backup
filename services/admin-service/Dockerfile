# Multi-stage build for admin-service
FROM node:18-alpine AS base

# Install dumb-init and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy service package files first (for better caching)
COPY package*.json ./

# Install dependencies with timeout and retry
FROM base AS deps
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --only=production --no-audit --no-fund && \
    npm cache clean --force

# Development stage
FROM base AS dev
COPY package*.json ./
RUN npm ci
COPY ../shared/ ./shared/
COPY . ./
USER nodejs
EXPOSE 3006
CMD ["dumb-init", "npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

COPY --chown=nodejs:nodejs . ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3006

# Health check with proper endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3006/health || exit 1

# Start the application
CMD ["dumb-init", "node", "src/app.js"]
