# Event Bus Service Dockerfile - Development Mode
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for development
RUN apk add --no-cache \
    curl \
    git \
    && rm -rf /var/cache/apk/*

# Copy package files first (for better caching)
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for development)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Create logs directory with proper permissions
RUN mkdir -p logs && chmod 755 logs

# Expose correct port
EXPOSE 3009

# Health check with longer timeout for development
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:3009/health || exit 1

# Start the service in development mode
CMD ["npm", "start"]
