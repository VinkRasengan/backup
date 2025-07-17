# syntax=docker/dockerfile:1

FROM node:18-alpine

# Cài curl để healthcheck
RUN apk add --no-cache curl

# Tạo thư mục app và user không phải root
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package.json và package-lock.json vào trước để cache layer dependencies
COPY package*.json ./

# Cài đặt dependencies production
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --only=production --no-audit --no-fund --prefer-offline && \
    npm cache clean --force

# Copy toàn bộ mã nguồn vào image
COPY . .

# Chown thư mục cho user nodejs
RUN chown -R nodejs:nodejs /app

# Chạy bằng user không phải root
USER nodejs

# Expose port đúng với app (3003)
EXPOSE 3003

# Healthcheck đúng endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Lệnh khởi động app
CMD ["node", "src/app.js"]
