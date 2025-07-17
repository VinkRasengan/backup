# Dockerfile tối ưu cho production - criminalip-service
FROM node:18-alpine

# Cài curl cho healthcheck
RUN apk add --no-cache curl

# Tạo thư mục app
WORKDIR /app

# Tạo user không phải root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package.json và package-lock.json để cache layer cài dependency
COPY package*.json ./

# Cài production dependencies
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --only=production --no-audit --no-fund --prefer-offline && \
    npm cache clean --force

# Copy toàn bộ mã nguồn (chỉ trong thư mục này)
COPY src/ ./src/

# Chuyển quyền cho user nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (mặc định 3008, có thể override bằng PORT)
EXPOSE 3008

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3008}/health || exit 1

# Lệnh chạy service
CMD ["node", "src/app.js"]
