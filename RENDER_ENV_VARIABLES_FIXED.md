# 🔧 Render Environment Variables - FIREBASE_PRIVATE_KEY Fixed

## ⚠️ Vấn đề đã sửa:
- **FIREBASE_PRIVATE_KEY** bị xuống hàng → Đã format lại thành single line với `\n`
- **Format cũ**: Multi-line (gây lỗi parse)
- **Format mới**: Single line với escaped newlines

## 🚀 Environment Variables cho Render Dashboard

### 1. **Community Service** (community-service-n3ou.onrender.com)

**Xóa variables cũ trước:**
```
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
```

**Thêm variables mới:**
```
NODE_ENV=production
PORT=10000
SERVICE_NAME=community-service
JWT_SECRET=microservices_factcheck_platform_secret_key_development_2024_very_long_secure_key
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9ThjEoNlmvc1G\n3KmKda7H9SgaT9BGSL8tMI6DPcBJGOOWPCGGWaIFCUFzrivVf1IMHp6evPZ5HxYW\nejOA4VjJIJJDsaeMoMMED0NiPAC1nGJfOWzMHoBBPvZccDPBdeZDR/kvi3aIupHy\sF/9VLgjkfyBYGCxJzyCWOfNamuVp1pViE0MD6DY5aw1WTQvIfVtCgauZ0lFIGjQ\nibsSkN4wWOup49mq4nEuHYK26coTmDUTaiamrAFYynLrnNprvA2JgAoZISw2e30m\nYSsjEWENcXahS4bUrCYrOOyZHgvR1XeQ9eaCAo5elhvM9dfZfXaOgL5ZTVTR7GCp\nMc/hYbvhAgMBAAECggEACOZReN/RmkhgWXO/y7wQt++99cJPubIrVk6vvU2x18eC\nBMepN58vCqFFNx2wPvgFBzLvhNAM672EpN3HXi7mvrcXitoUCElsvNwSPRDL/SQp\ncseCgCeLiSW44GuM+PKLEGaWkv/k1kFxLmS3PcCiuVdgZ91JIAlgb9KJ4uKDkgEI\niGXbRBdX3+lnRIEqB1JPYk/ZUBXqgf/gt24gpZAVv0ET6jpTcyc/4zdPMd9xPOfZ\nblqx4teHAIHoAzAFRGhuDus1I1L8QBe/Y3jjYynkacV0D89aOvIJfR5+HScnoQnw\n/HK+4B090lYDNE+QPFXPdp8LLoHxrfg5GqDKYypULQKBgQD5uLfI/gulpMQSV73T\nM+Jifk1ix9LZxYV+6htjpzoUBlvLshuwXfotfT3dott3/xjMMCJhfWaf/SVGjenc\nXJiCGIGp+TlEKthiPnBxQcA41yq437g9X7dgwoeJP2PmEJrYKM9M7gKO9dVSOZig\pRnR9WGnWAx7GNoU6ekTzUMRzQKBgQDCEIU3NvLH1n8V793/GaOP8IZSvKe0TpR1\n5CaWjyB1D7wglABn5ItAbrsxZ2hEapQYgOSeAs/21vf9e9p61+OsVQQ0Hkihxm7O\nesFuaSCAmbpRnpPHKWXrFK8CTr3EeanChmvk0GIY7XSDTkMVp1JhpZrbu8sWAsdz\nsBIwnjyOZQKBgBYwGmxKXkCOfjlfAGfGoWO88yVGue5NhYn8RQi6sAdddUSJA7rM\n7tCh4yBROwzTZqGl2TguSzMF7AzzyQaiV46fnM28biEnaWh5QcZeYDTssUgR4K3b\nVlDLl/1S245yhT+ViK2+LA4Fu7l9kpkbckrccZvLz/gUAjR/gA0ZXM81AoGAAXyK\n6K9dELbN5mcd9jRGEnYvMTcMuc7YSEblHMYf44WpVT6M+j6/6lBu0qQOImgGlmF2\nXtd6rFNdNu3Z8JLyxYEpNRT+TW7trls2XBgmDZYf3TwvuZjRlQllhckAnx6ndDv/\nW5NVDQfUmqTg0qujb+gK1aAMoDCJQpOYsBKmOBkCgYEA2FLpCjAdzggQ0lgqUKAg\nMqlWkwzPXc2bX7LESv2j4z9acpigcnyeYiX/r0lcC3RDoQYXEmnPOsZwYHk/6dQq\n6BuTSI2d0Ate1sRqV9sBNEtNThUf16ltgSmPZ4tfLVs8ZMN/unvjjOOEzkOWU0fW\nEBQnrBKraXzzY0AzgveHhUg=\n-----END PRIVATE KEY-----"
REDIS_URL=redis://default:fD4PPcE4KVK52JEcpmuncyQODgJcLklI@redis-13831.c83.us-east-1-2.ec2.redns.redis-cloud.com:13831
REDIS_ENABLED=true
AUTH_SERVICE_URL=https://backup-r5zz.onrender.com
COMMUNITY_SERVICE_URL=https://community-service-n3ou.onrender.com
ENABLE_RATE_LIMITING=true
USE_MOCK_DATA_FALLBACK=false
CIRCUIT_BREAKER_ENABLED=true
EVENT_BUS_ENABLED=true
EVENT_BUS_REDIS_ENABLED=true
LOG_LEVEL=info
LOG_FORMAT=json
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true
```

### 2. **Auth Service** (backup-r5zz.onrender.com)

**Variables:**
```
NODE_ENV=production
PORT=10000
SERVICE_NAME=auth-service
JWT_SECRET=microservices_factcheck_platform_secret_key_development_2024_very_long_secure_key
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9ThjEoNlmvc1G\n3KmKda7H9SgaT9BGSL8tMI6DPcBJGOOWPCGGWaIFCUFzrivVf1IMHp6evPZ5HxYW\nejOA4VjJIJJDsaeMoMMED0NiPAC1nGJfOWzMHoBBPvZccDPBdeZDR/kvi3aIupHy\sF/9VLgjkfyBYGCxJzyCWOfNamuVp1pViE0MD6DY5aw1WTQvIfVtCgauZ0lFIGjQ\nibsSkN4wWOup49mq4nEuHYK26coTmDUTaiamrAFYynLrnNprvA2JgAoZISw2e30m\nYSsjEWENcXahS4bUrCYrOOyZHgvR1XeQ9eaCAo5elhvM9dfZfXaOgL5ZTVTR7GCp\nMc/hYbvhAgMBAAECggEACOZReN/RmkhgWXO/y7wQt++99cJPubIrVk6vvU2x18eC\nBMepN58vCqFFNx2wPvgFBzLvhNAM672EpN3HXi7mvrcXitoUCElsvNwSPRDL/SQp\ncseCgCeLiSW44GuM+PKLEGaWkv/k1kFxLmS3PcCiuVdgZ91JIAlgb9KJ4uKDkgEI\niGXbRBdX3+lnRIEqB1JPYk/ZUBXqgf/gt24gpZAVv0ET6jpTcyc/4zdPMd9xPOfZ\nblqx4teHAIHoAzAFRGhuDus1I1L8QBe/Y3jjYynkacV0D89aOvIJfR5+HScnoQnw\n/HK+4B090lYDNE+QPFXPdp8LLoHxrfg5GqDKYypULQKBgQD5uLfI/gulpMQSV73T\nM+Jifk1ix9LZxYV+6htjpzoUBlvLshuwXfotfT3dott3/xjMMCJhfWaf/SVGjenc\nXJiCGIGp+TlEKthiPnBxQcA41yq437g9X7dgwoeJP2PmEJrYKM9M7gKO9dVSOZig\pRnR9WGnWAx7GNoU6ekTzUMRzQKBgQDCEIU3NvLH1n8V793/GaOP8IZSvKe0TpR1\n5CaWjyB1D7wglABn5ItAbrsxZ2hEapQYgOSeAs/21vf9e9p61+OsVQQ0Hkihxm7O\nesFuaSCAmbpRnpPHKWXrFK8CTr3EeanChmvk0GIY7XSDTkMVp1JhpZrbu8sWAsdz\nsBIwnjyOZQKBgBYwGmxKXkCOfjlfAGfGoWO88yVGue5NhYn8RQi6sAdddUSJA7rM\n7tCh4yBROwzTZqGl2TguSzMF7AzzyQaiV46fnM28biEnaWh5QcZeYDTssUgR4K3b\nVlDLl/1S245yhT+ViK2+LA4Fu7l9kpkbckrccZvLz/gUAjR/gA0ZXM81AoGAAXyK\n6K9dELbN5mcd9jRGEnYvMTcMuc7YSEblHMYf44WpVT6M+j6/6lBu0qQOImgGlmF2\nXtd6rFNdNu3Z8JLyxYEpNRT+TW7trls2XBgmDZYf3TwvuZjRlQllhckAnx6ndDv/\nW5NVDQfUmqTg0qujb+gK1aAMoDCJQpOYsBKmOBkCgYEA2FLpCjAdzggQ0lgqUKAg\nMqlWkwzPXc2bX7LESv2j4z9acpigcnyeYiX/r0lcC3RDoQYXEmnPOsZwYHk/6dQq\n6BuTSI2d0Ate1sRqV9sBNEtNThUf16ltgSmPZ4tfLVs8ZMN/unvjjOOEzkOWU0fW\nEBQnrBKraXzzY0AzgveHhUg=\n-----END PRIVATE KEY-----"
REDIS_URL=redis://default:fD4PPcE4KVK52JEcpmuncyQODgJcLklI@redis-13831.c83.us-east-1-2.ec2.redns.redis-cloud.com:13831
REDIS_ENABLED=true
AUTH_SERVICE_URL=https://backup-r5zz.onrender.com
ENABLE_RATE_LIMITING=true
USE_MOCK_DATA_FALLBACK=false
CIRCUIT_BREAKER_ENABLED=true
EVENT_BUS_ENABLED=false
EVENT_BUS_REDIS_ENABLED=false
LOG_LEVEL=info
LOG_FORMAT=json
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true
```

## 🔧 Bước thực hiện:

### 1. **Community Service** (Ưu tiên cao - đang lỗi 502):
1. Vào https://dashboard.render.com
2. Chọn **community-service-n3ou**
3. Tab **Environment** 
4. **Xóa**: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
5. **Thêm** variables từ list trên
6. **Deploy**

### 2. **Kiểm tra sau deploy:**
```bash
curl https://community-service-n3ou.onrender.com/health
curl https://api-gateway-3lr5.onrender.com/community/links
```

### 3. **Logs cần tìm:**
- ✅ `"Redis client connected"`
- ✅ `"Firebase Admin initialized"`
- ✅ `"Service started on port 10000"`

## ⚠️ Lưu ý quan trọng:

1. **FIREBASE_PRIVATE_KEY**: Copy chính xác với quotes và `\n`
2. **Không thêm space thừa** trong Redis URL
3. **Deploy từng service một** và đợi "Live"
4. **Reload page** nếu gặp lỗi "existing environment variable"
