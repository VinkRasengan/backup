# syntax=docker/dockerfile:1

FROM node:18-alpine

# Cài đặt dumb-init để xử lý tín hiệu tốt hơn
RUN apk add --no-cache dumb-init curl

# Tạo thư mục app và user không phải root
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy file package để cache layer dependencies
COPY package*.json ./

# Cài đặt dependencies production
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --only=production --no-audit --no-fund --prefer-offline && \
    npm cache clean --force

# Copy toàn bộ mã nguồn vào image (chỉ nội bộ)
COPY . .

# Tạo thư mục logs và phân quyền
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

# Chạy bằng user không phải root
USER nodejs

# Expose port (mặc định 8080, có thể override qua biến môi trường)
EXPOSE 8080

# Healthcheck (endpoint /health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Lệnh khởi động app
CMD ["dumb-init", "node", "app.js"]
