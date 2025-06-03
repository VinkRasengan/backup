# 🚀 Hướng Dẫn Deploy Nhanh - FactCheck với Firebase Auth

## 📋 Chuẩn Bị

### 1. Cài đặt Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Tạo Firebase Project
1. Vào [Firebase Console](https://console.firebase.google.com)
2. Tạo project mới
3. Enable các services:
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Cloud Functions**
   - **Hosting**

### 3. Cấu hình Authentication
1. Vào **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Thêm domain của bạn vào **Authorized domains**

## 🔧 Cấu Hình Project

### 1. Cập nhật Firebase Config
Sửa file `.firebaserc`:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### 2. Cập nhật Client Config
Sửa file `client/src/config/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 3. Cấu hình Server (Tùy chọn)
Nếu muốn sync data với backend, tạo file `server/.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

## 🚀 Deploy

### Cách 1: Deploy Tự Động (Khuyến nghị)
```bash
# Cài đặt dependencies
npm run install:all

# Build và deploy
npm run deploy
```

### Cách 2: Deploy Từng Bước
```bash
# 1. Cài đặt dependencies
npm run install:all

# 2. Build client
npm run build

# 3. Deploy Firestore rules
firebase deploy --only firestore

# 4. Deploy Functions
firebase deploy --only functions

# 5. Deploy Hosting
firebase deploy --only hosting
```

## ✅ Kiểm Tra

### 1. Xem thông tin deployment
```bash
firebase hosting:channel:list
firebase functions:list
```

### 2. Test ứng dụng
- Mở URL hosting được hiển thị
- Test đăng ký/đăng nhập
- Kiểm tra Firebase Console

## 🔧 Troubleshooting

### Lỗi thường gặp:

**1. Firebase CLI không login:**
```bash
firebase logout
firebase login
```

**2. Project ID sai:**
- Kiểm tra `.firebaserc`
- Kiểm tra `client/src/config/firebase.js`

**3. Functions deploy lỗi:**
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

**4. Client build lỗi:**
```bash
cd client
npm install
npm run build
cd ..
```

**5. Authentication không hoạt động:**
- Kiểm tra Firebase config trong client
- Kiểm tra Authentication settings trong Firebase Console
- Kiểm tra Authorized domains

## 📱 Sử Dụng

### Authentication Flow:
1. **Đăng ký**: Firebase Auth tự động tạo user và gửi email verification
2. **Đăng nhập**: Firebase Auth xác thực và trả về ID token
3. **API calls**: Frontend gửi Firebase ID token trong header
4. **Backend**: Verify token và sync user data (tùy chọn)

### Các tính năng:
- ✅ Đăng ký/Đăng nhập với email/password
- ✅ Email verification tự động
- ✅ Password reset
- ✅ Secure API authentication
- ✅ User data sync với Firestore

## 🔗 Links Hữu Ích

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra Firebase Console logs
2. Kiểm tra browser console
3. Xem file `DEPLOYMENT.md` để biết thêm chi tiết
4. Kiểm tra file `FIREBASE_AUTH_UNIFICATION.md` để hiểu về authentication flow

---

**Lưu ý**: Với Firebase Auth đã được thống nhất, authentication được xử lý hoàn toàn bởi Firebase, backend chỉ cần để sync user data (tùy chọn).
