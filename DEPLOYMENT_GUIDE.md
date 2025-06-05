# Deployment Guide - FactCheck Platform

## 🚀 Hoàn toàn sử dụng API (No Localhost)

### 1. Deploy Backend lên Vercel

#### Bước 1: Chuẩn bị Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

#### Bước 2: Deploy Backend
```bash
cd server
vercel --prod
```

#### Bước 3: Cấu hình Environment Variables trên Vercel
Truy cập [Vercel Dashboard](https://vercel.com/dashboard) → Project → Settings → Environment Variables

Thêm các biến sau:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# VirusTotal Configuration
VIRUSTOTAL_API_KEY=your-virustotal-api-key

# Other Configuration
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
```

### 2. Cập nhật Frontend Configuration

#### Bước 1: Cập nhật API URL
File `client/.env.production`:
```env
REACT_APP_API_URL=https://your-vercel-app.vercel.app/api
REACT_APP_USE_EMULATOR=false
```

#### Bước 2: Build và Deploy Frontend
```bash
cd client
npm run build
firebase deploy --only hosting
```

### 3. Firebase Configuration

#### Sử dụng Firebase Production (Không cần emulator)

**Frontend**: Đã cấu hình sử dụng Firebase Auth API trực tiếp
**Backend**: Sử dụng Firebase Admin SDK với service account

#### Lấy Firebase Service Account:
1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Generate new private key
4. Copy thông tin vào Vercel environment variables

### 4. API Endpoints

Sau khi deploy, API sẽ có sẵn tại:

```
Base URL: https://your-vercel-app.vercel.app/api

Authentication:
POST /auth/login
POST /auth/register
POST /auth/verify-email
POST /auth/forgot-password
POST /auth/reset-password

Users:
GET /users/profile
PUT /users/profile
GET /users/dashboard
DELETE /users/account

Links:
POST /links/check
GET /links/history
GET /links/:id
DELETE /links/:id

Chat (GPT):
POST /chat/message
GET /chat/conversations
GET /chat/conversations/:id
DELETE /chat/conversations/:id
GET /chat/starters
GET /chat/tips
```

### 5. Authentication Flow

#### Hoàn toàn sử dụng Firebase Auth API:

1. **Registration**:
   - Frontend: Firebase Auth `createUserWithEmailAndPassword()`
   - Email verification: Firebase `sendEmailVerification()`
   - Backend: Tự động tạo user record khi login lần đầu

2. **Login**:
   - Frontend: Firebase Auth `signInWithEmailAndPassword()`
   - Token: Firebase ID Token (auto-refresh)
   - Backend: Verify Firebase ID Token

3. **API Calls**:
   - Header: `Authorization: Bearer <firebase-id-token>`
   - Auto-refresh token trong interceptor

### 6. Testing Production Setup

#### Test Backend API:
```bash
# Health check
curl https://your-vercel-app.vercel.app/health

# Test authentication (cần token)
curl -H "Authorization: Bearer <firebase-id-token>" \
     https://your-vercel-app.vercel.app/api/users/profile
```

#### Test Frontend:
1. Truy cập https://your-firebase-app.web.app
2. Đăng ký tài khoản mới
3. Xác minh email
4. Đăng nhập
5. Test các tính năng:
   - Link checking
   - Chat với AI
   - Dashboard

### 7. Monitoring & Logs

#### Vercel Logs:
```bash
vercel logs your-project-name
```

#### Firebase Logs:
- Firebase Console → Functions → Logs
- Authentication → Users

#### Error Handling:
- Frontend: Toast notifications
- Backend: Structured error responses
- Fallback: Mock services khi API fail

### 8. Cost Optimization

#### OpenAI API:
- Model: gpt-3.5-turbo (cost-effective)
- Max tokens: 500
- Fallback: Mock service khi hết quota

#### VirusTotal API:
- Free tier: 4 requests/minute
- Rate limiting: 15s delay
- Caching: Lưu kết quả để giảm API calls

#### Vercel:
- Free tier: 100GB bandwidth/month
- Serverless functions: 100GB-hours/month

### 9. Security

#### API Security:
- Firebase ID Token verification
- CORS configuration
- Rate limiting
- Input validation

#### Environment Variables:
- Stored securely in Vercel
- Not exposed to frontend
- Separate dev/prod configs

### 10. Troubleshooting

#### Common Issues:

**API 401 Unauthorized**:
- Check Firebase ID token
- Verify token expiration
- Check Vercel environment variables

**OpenAI Quota Exceeded**:
- Add billing to OpenAI account
- System auto-fallback to mock service

**CORS Errors**:
- Check API URL in frontend config
- Verify Vercel deployment

**Firebase Auth Errors**:
- Check Firebase project configuration
- Verify email verification flow

#### Debug Commands:
```bash
# Check Vercel deployment
vercel ls

# View environment variables
vercel env ls

# Check logs
vercel logs --follow
```

### 11. Production Checklist

- [ ] Backend deployed to Vercel
- [ ] Environment variables configured
- [ ] Frontend built and deployed to Firebase Hosting
- [ ] Firebase Auth configured for production
- [ ] OpenAI API key with sufficient quota
- [ ] VirusTotal API key configured
- [ ] CORS settings updated
- [ ] Error monitoring setup
- [ ] Performance testing completed

### 12. Maintenance

#### Regular Tasks:
- Monitor API usage and costs
- Update dependencies
- Check error logs
- Backup Firestore data
- Review security settings

#### Updates:
```bash
# Update backend
cd server
git pull
vercel --prod

# Update frontend  
cd client
git pull
npm run build
firebase deploy --only hosting
```

## 🎉 Kết quả

Sau khi hoàn thành, bạn sẽ có:
- ✅ Backend API hoàn toàn cloud-based
- ✅ Frontend sử dụng Firebase Auth API
- ✅ Không cần localhost cho bất kỳ service nào
- ✅ Auto-scaling và high availability
- ✅ Professional production setup
