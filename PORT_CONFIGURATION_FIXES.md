# 🔧 PORT CONFIGURATION FIXES NEEDED

## ❌ Files cần fix port inconsistencies:

### 1. scripts/deploy-local-fixed.sh
```bash
# Line 160: CẬP NHẬT
NEWS_SERVICE_URL=http://localhost:3005  # Fix từ 3003 -> 3005
```

### 2. scripts/deploy-docker-fixed.sh  
```bash
# Line 91: CẬP NHẬT
NEWS_SERVICE_URL=http://news-service:3005  # Fix từ 3003 -> 3005
```

### 3. optimization-backup/scripts/deploy-local-fixed.sh
```bash  
# Line 160: CẬP NHẬT
NEWS_SERVICE_URL=http://localhost:3005  # Fix từ 3003 -> 3005
```

### 4. optimization-backup/scripts/deploy-docker-fixed.sh
```bash
# Line 91: CẬP NHẬT  
NEWS_SERVICE_URL=http://news-service:3005  # Fix từ 3003 -> 3005
```

## ✅ CORRECT PORT MAPPING:
```
PORT 3001: auth-service      ✅
PORT 3002: link-service      ✅  
PORT 3003: community-service ✅
PORT 3004: chat-service      ✅
PORT 3005: news-service      ✅ (KHÔNG PHẢI 3003!)
PORT 3006: admin-service     ✅
PORT 8080: api-gateway       ✅
```

## 🎯 RECOMMENDATION:
Endpoints của bạn hiện tại **ĐÚNG HẾT**! 
Chỉ cần fix các deployment scripts bị nhầm port cho news-service.

## 🚨 POTENTIAL CONFLICT:
Nếu news-service chạy port 3003 thì sẽ conflict với community-service!
Đảm bảo news-service luôn chạy port 3005.
