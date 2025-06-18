# Multi-stage build for link-service
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy service package files first (for better caching)
COPY services/link-service/package*.json ./

# Install dependencies
FROM base AS deps
RUN npm install --only=production && npm cache clean --force

# Development stage
FROM base AS dev
# Copy service package files
COPY services/link-service/package*.json ./
RUN npm ci
# Copy shared utilities first
COPY shared/ ./shared/
# Copy service-specific code
COPY services/link-service/ ./
USER nodejs
EXPOSE 3002
CMD ["dumb-init", "npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy shared utilities first
COPY --chown=nodejs:nodejs shared/ ./shared/

# Copy service-specific code
COPY --chown=nodejs:nodejs services/link-service/ ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health/live || exit 1

# Start the application
CMD ["dumb-init", "node", "src/app.js"]
