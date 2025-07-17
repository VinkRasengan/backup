# Dockerfile production cho link-service (độc lập, không phụ thuộc ngoài)
FROM node:18-alpine AS base

# Cài curl để healthcheck
RUN apk add --no-cache curl dumb-init

# Tạo thư mục app
WORKDIR /app

# Tạo user không phải root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files trước để cache
COPY package*.json ./

# Cài dependencies production
RUN npm install --only=production && npm cache clean --force

# Copy toàn bộ mã nguồn service (chỉ nội bộ)
COPY src/ ./src/
COPY jest.config.js ./
COPY jest.setup.js ./

# Đổi quyền thư mục cho user nodejs
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port đúng với app (3002)
EXPOSE 3002

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3002/health/live || exit 1

# Entrypoint production
CMD ["dumb-init", "node", "src/app.js"]
