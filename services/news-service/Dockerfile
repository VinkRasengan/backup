# Dockerfile production cho news-service - chỉ sử dụng file trong thư mục này
FROM node:18-alpine AS base

# Cài đặt các gói cần thiết
RUN apk add --no-cache dumb-init curl

# Tạo thư mục app và user không phải root
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy file package.json và package-lock.json để cài dependencies
COPY package*.json ./

# Cài dependencies production
RUN npm ci --only=production && npm cache clean --force

# Copy mã nguồn (chỉ src và các file cấu hình cần thiết)
COPY src/ ./src/

# Đảm bảo quyền cho user nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port 3005
EXPOSE 3005

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

# Start service
CMD ["dumb-init", "node", "src/app.js"]
