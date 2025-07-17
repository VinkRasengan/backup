# Optimized Dockerfile for auth-service (chỉ sử dụng file nội bộ, multi-stage build)
FROM node:18-alpine AS base

# Cài đặt các package cần thiết
RUN apk add --no-cache dumb-init curl

# Tạo thư mục app và user không phải root
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Stage cài dependencies production
FROM base AS deps
COPY package*.json ./
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --only=production --no-audit --no-fund --prefer-offline && \
    npm cache clean --force

# Stage dev (cài full dependencies cho phát triển)
FROM base AS dev
COPY package*.json ./
RUN npm ci
COPY . .
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3001
CMD ["dumb-init", "npm", "run", "dev"]

# Stage production
FROM base AS production
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
CMD ["dumb-init", "node", "src/app.js"]
