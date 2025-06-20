# 🚀 Hướng dẫn Deploy Frontend trên Render Dashboard

## Link Deploy: https://dashboard.render.com/static/new

## 📋 THÔNG TIN CẦN ĐIỀN TRÊN RENDER

### 1. Repository Connection
- **Repository**: Chọn GitHub repository của bạn
- **Branch**: `main` hoặc `master`

### 2. Basic Settings
```
Name: factcheck-frontend
Root Directory: ./client
Build Command: npm ci && npm run build
Publish Directory: ./build
```

### 3. Environment Variables (Quan trọng!)
Nhấn "Advanced" để thêm Environment Variables:

```bash
NODE_ENV=production
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8
REACT_APP_FIREBASE_API_KEY=AIzaSyCpeeTLujKruzK14siuDzGmpTadzhfvccI
REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=factcheck-1d6e8.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=583342362302
REACT_APP_FIREBASE_APP_ID=1:583342362302:web:ee97918d159c90e5b8d8ef
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XBLLPBG4HM
GENERATE_SOURCEMAP=false
```

## 🔧 COPY/PASTE READY - CHỈ CẦN THAY THẾ CÁC GIÁ TRỊ SAU:

### Root Directory:
```
./client
```

### Build Command:
```
npm ci && npm run build
```

### Publish Directory:
```
./build
```

### Environment Variables (từng dòng một):

**NODE_ENV**
```
production
```

**REACT_APP_API_URL** (thay đổi URL backend của bạn)
```
https://your-backend-url.onrender.com
```

**REACT_APP_FIREBASE_PROJECT_ID**
```
factcheck-1d6e8
```

**REACT_APP_FIREBASE_API_KEY**
```
AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
```

**REACT_APP_FIREBASE_AUTH_DOMAIN**
```
factcheck-1d6e8.firebaseapp.com
```

**REACT_APP_FIREBASE_STORAGE_BUCKET**
```
factcheck-1d6e8.firebasestorage.app
```

**GENERATE_SOURCEMAP**
```
false
```

## 📱 BƯỚC THỰC HIỆN TRÊN DASHBOARD:

1. Mở link: https://dashboard.render.com/static/new
2. **Connect Repository**: Chọn GitHub repo
3. **Name**: `factcheck-frontend`
4. **Root Directory**: `./client`
5. **Build Command**: `npm ci && npm run build`
6. **Publish Directory**: `./build`
7. Nhấn **"Advanced"** để mở Environment Variables
8. Thêm từng biến environment ở trên
9. Nhấn **"Create Static Site"**

## ⚠️ LƯU Ý QUAN TRỌNG:

1. **REACT_APP_API_URL**: Thay đổi thành URL backend thực của bạn
2. **Firebase Keys**: Đã sử dụng key từ file .env của bạn
3. **Build sẽ mất 2-5 phút**
4. Kiểm tra **Deploy Logs** nếu có lỗi

## 🎯 SAU KHI DEPLOY THÀNH CÔNG:

- URL sẽ có dạng: `https://factcheck-frontend.onrender.com`
- Kiểm tra website hoạt động
- Kiểm tra Firebase connection
- Test các chức năng chính

## 🔄 NẾU GẶP LỖI:

### Build Failed:
- Kiểm tra Build Logs
- Thử thay Build Command thành: `npm install && npm run build`

### Firebase Connection Error:
- Kiểm tra các REACT_APP_FIREBASE_* variables
- Đảm bảo Firebase project đang hoạt động

### Static Files Not Found:
- Kiểm tra Publish Directory = `./build`
- Đảm bảo Root Directory = `./client`
