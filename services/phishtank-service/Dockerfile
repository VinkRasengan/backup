# syntax=docker/dockerfile:1

FROM node:18-alpine

# Cài curl cho healthcheck
RUN apk add --no-cache curl

# Tạo thư mục app
WORKDIR /app

# Tạo user không phải root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files trước để cache layer
COPY package*.json ./

# Cài dependencies production
RUN npm ci --only=production

# Copy toàn bộ mã nguồn nội bộ
COPY src/ ./src/
COPY data/ ./data/
COPY jest.config.js ./
COPY jest.setup.js ./

# Chuyển quyền cho user không phải root
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose đúng port app (3008)
EXPOSE 3008

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3008/health || exit 1

# Start app
CMD ["node", "src/app.js"]
