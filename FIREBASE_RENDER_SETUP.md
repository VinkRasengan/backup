# 🔥 Firebase + Render Setup Guide

## 🎯 **Mục tiêu:**
- Host web trên **Render** (miễn phí, auto-deploy)
- Sử dụng **Firestore** làm database (real-time, scalable)

## 📋 **Bước 1: Lấy Firebase Credentials**

### 1.1 Truy cập Firebase Console
1. Vào: https://console.firebase.google.com/
2. Chọn project: **factcheck-1d6e8**
3. Project Settings (⚙️) → **Service accounts**

### 1.2 Generate Service Account Key
1. Click **"Generate new private key"**
2. Download file JSON
3. Mở file và copy các thông tin:

```json
{
  "project_id": "factcheck-1d6e8",
  "client_email": "firebase-adminsdk-xxxxx@factcheck-1d6e8.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
}
```

## 🔧 **Bước 2: Cấu hình Render Environment**

### 2.1 Vào Render Dashboard
1. https://render.com/dashboard
2. **factcheck-backend** service
3. **Environment** tab

### 2.2 Thêm/Sửa Environment Variables

```env
# Database Configuration
USE_FIRESTORE=true

# Firebase Configuration  
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Giữ nguyên các config khác
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://factcheck-frontend.onrender.com
OPENAI_API_KEY=sk-proj-...
VIRUSTOTAL_API_KEY=...
JWT_SECRET=...
```

### 2.3 Xóa PostgreSQL config (optional)
Có thể xóa hoặc giữ làm backup:
```env
# DATABASE_URL=postgresql://... (có thể comment out)
```

## 🚀 **Bước 3: Deploy và Test**

### 3.1 Manual Deploy
1. Render Dashboard → **Manual Deploy**
2. Đợi deployment hoàn thành (~3-5 phút)

### 3.2 Test Firestore Connection
```bash
# Test trong Render Shell
npm run db:test
```

### 3.3 Verify APIs
1. **Health**: https://factcheck-backend.onrender.com/health
2. **Database**: https://factcheck-backend.onrender.com/api/health/database
3. **Community**: https://factcheck-backend.onrender.com/api/community/posts

## 📊 **Expected Results:**

```json
{
  "status": "OK",
  "database": "connected", 
  "dbType": "firestore",
  "timestamp": "2025-01-XX"
}
```

## ✅ **Ưu điểm của setup này:**

### **Render Benefits:**
- ✅ Hosting miễn phí 750h/month
- ✅ Auto-deploy từ GitHub
- ✅ SSL certificates tự động
- ✅ Global CDN
- ✅ Easy scaling

### **Firestore Benefits:**
- ✅ Real-time database
- ✅ Automatic scaling
- ✅ Offline support
- ✅ Security rules
- ✅ No server management
- ✅ Free tier: 50K reads/day

### **Combined Power:**
- ✅ Best of both worlds
- ✅ Cost-effective
- ✅ Production-ready
- ✅ Easy maintenance

## 🔄 **Migration từ PostgreSQL:**

Nếu đã có data trong PostgreSQL:

```bash
# Export PostgreSQL data
pg_dump $DATABASE_URL > backup.sql

# Import vào Firestore (cần script custom)
node scripts/migrate-postgres-to-firestore.js
```

## 🆘 **Troubleshooting:**

### **Lỗi Firebase Auth:**
- Kiểm tra FIREBASE_PRIVATE_KEY format
- Đảm bảo có `\n` trong private key
- Verify service account permissions

### **Lỗi Connection:**
- Check Firebase project ID
- Verify client email
- Test locally trước

### **Performance Issues:**
- Enable Firestore indexes
- Optimize query patterns
- Use pagination

## 🎉 **Kết luận:**

Setup **Render + Firestore** cho bạn:
- **Free hosting** với professional features
- **Scalable database** không cần quản lý
- **Real-time updates** cho community features
- **Easy deployment** và maintenance

**Đây là setup lý tưởng cho FactCheck app! 🚀**
