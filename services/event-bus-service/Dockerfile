# Event Bus Service Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create logs directory
RUN mkdir -p logs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S eventbus -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R eventbus:nodejs /app

# Switch to non-root user
USER eventbus

# Expose port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3007/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the service
CMD ["node", "src/app.js"]
