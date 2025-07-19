# Redis Cloud Configuration for Render

## Bước 1: Lấy Redis Cloud Connection String

1. Đăng nhập vào Redis Cloud: https://app.redislabs.com/
2. Tạo database mới hoặc sử dụng existing
3. Copy connection string có format:
   ```
   redis://username:password@redis-host:port
   ```

## Bước 2: Cập nhật Environment Variables trên tất cả Render services

### API Gateway (api-gateway-3lr5.onrender.com)
```
REDIS_URL=redis://username:password@your-redis-host:port
REDIS_ENABLED=true
```

### Auth Service (backup-r5zz.onrender.com)
```
REDIS_URL=redis://username:password@your-redis-host:port
REDIS_ENABLED=true
```

### Community Service (community-service-n3ou.onrender.com)
```
REDIS_URL=redis://username:password@your-redis-host:port
REDIS_ENABLED=true
EVENT_BUS_REDIS_ENABLED=true
```

### Chat Service (chat-service-6993.onrender.com)
```
REDIS_URL=redis://username:password@your-redis-host:port
REDIS_ENABLED=true
```

### News Service (news-service-71ni.onrender.com)
```
REDIS_URL=redis://username:password@your-redis-host:port
REDIS_ENABLED=true
```

### Admin Service (admin-service-ttvm.onrender.com)
```
REDIS_URL=redis://username:password@your-redis-host:port
REDIS_ENABLED=true
```

## Bước 3: Remove các variables không cần thiết

Xóa hoặc comment out:
```
# REDIS_HOST=localhost  # Xóa dòng này
# REDIS_PORT=6379       # Xóa dòng này
# REDIS_PASSWORD=...    # Xóa dòng này
```

## Bước 4: Redeploy tất cả services

Sau khi update environment variables, redeploy tất cả services theo thứ tự:
1. Auth Service
2. Community Service  
3. Chat Service
4. News Service
5. Admin Service
6. API Gateway
7. Frontend

## Bước 5: Kiểm tra logs

Sau khi deploy, check logs để xem Redis connection:
- Tìm log: "Redis client connected"
- Tìm log: "Cache manager initialized with Redis"
- Không có error: "Redis client error"

## Ví dụ Redis Cloud URL format:
```
redis://default:your-password@redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345
```

## Troubleshooting:

1. **Connection timeout**: Kiểm tra Redis Cloud firewall settings
2. **Authentication failed**: Kiểm tra username/password
3. **SSL/TLS issues**: Thử thêm `?tls=true` vào cuối URL nếu cần
