# FactCheck - Software Architecture

## 📋 Tổng quan

FactCheck là một ứng dụng web full-stack được xây dựng với kiến trúc microservices, sử dụng React cho frontend và Express.js cho backend, với Firebase Firestore làm database.

## 🏗️ Kiến trúc tổng thể

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│  (Express.js)   │◄──►│   (Firestore)   │
│   Port: 3000    │    │   Port: 5000    │    │   (Firebase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static Files  │    │  External APIs  │    │   File Storage  │
│   (Nginx)       │    │ (Crawler API)   │    │   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Sprint 1 - Tính năng đã implement

### ✅ Authentication & User Management
- **User Registration**: Đăng ký tài khoản với email/password
- **Email Verification**: Xác minh email qua link được gửi
- **User Login**: Đăng nhập với JWT authentication
- **Password Reset**: Quên mật khẩu và đặt lại qua email
- **Profile Management**: Chỉnh sửa thông tin cá nhân

### ✅ Link Checking System
- **URL Validation**: Kiểm tra format URL hợp lệ
- **Crawler Integration**: Tích hợp với external crawler API
- **Credibility Scoring**: Tính điểm tin cậy từ 0-100
- **Result Storage**: Lưu trữ kết quả kiểm tra
- **History Tracking**: Theo dõi lịch sử kiểm tra của user

### ✅ Dashboard & UI
- **Personal Dashboard**: Trang tổng quan cá nhân
- **Statistics Display**: Hiển thị thống kê hoạt động
- **Responsive Design**: Giao diện responsive cho mobile
- **Real-time Notifications**: Thông báo real-time với toast

## 🔧 Tech Stack Chi tiết

### Frontend Stack
```javascript
{
  "framework": "React 18",
  "routing": "React Router v6",
  "state": "React Context + React Query",
  "styling": "Styled Components",
  "forms": "React Hook Form + Yup",
  "icons": "Lucide React",
  "notifications": "React Hot Toast",
  "http": "Axios"
}
```

### Backend Stack
```javascript
{
  "framework": "Express.js",
  "database": "Firebase Firestore",
  "authentication": "JWT + bcryptjs",
  "validation": "Joi",
  "email": "Nodemailer",
  "security": "Helmet + CORS",
  "logging": "Morgan",
  "rateLimit": "express-rate-limit"
}
```

## 📁 Cấu trúc thư mục

### Backend Structure
```
server/
├── src/
│   ├── app.js                 # Main application entry
│   ├── config/
│   │   └── firebase.js        # Firebase configuration
│   ├── controllers/           # Business logic handlers
│   │   ├── authController.js  # Authentication logic
│   │   ├── userController.js  # User management
│   │   └── linkController.js  # Link checking logic
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # JWT authentication
│   │   ├── validation.js     # Request validation
│   │   └── errorHandler.js   # Global error handling
│   ├── routes/               # API route definitions
│   │   ├── auth.js           # /api/auth routes
│   │   ├── users.js          # /api/users routes
│   │   └── links.js          # /api/links routes
│   └── services/             # External service integrations
│       ├── emailService.js   # Email sending service
│       └── crawlerService.js # Link crawling service
├── package.json
├── .env.example
└── Dockerfile
```

### Frontend Structure
```
client/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Navbar.js        # Navigation component
│   │   ├── ProtectedRoute.js # Route protection
│   │   └── LoadingSpinner.js # Loading states
│   ├── pages/               # Page components
│   │   ├── HomePage.js      # Landing page
│   │   ├── LoginPage.js     # Login form
│   │   ├── RegisterPage.js  # Registration form
│   │   ├── DashboardPage.js # User dashboard
│   │   ├── CheckLinkPage.js # Link checking interface
│   │   ├── ProfilePage.js   # Profile management
│   │   └── [auth pages]     # Email verification, password reset
│   ├── context/             # React Context providers
│   │   └── AuthContext.js   # Authentication state
│   ├── services/            # API communication
│   │   └── api.js          # Axios configuration & endpoints
│   ├── App.js              # Main app component
│   └── index.js            # React app entry point
├── public/
├── package.json
└── Dockerfile
```

## 🔐 Security Implementation

### Authentication Flow
```
1. User Registration
   ├── Password hashing (bcrypt, 12 rounds)
   ├── Email verification token generation
   └── Verification email sending

2. Email Verification
   ├── Token validation (24h expiry)
   ├── Account activation
   └── Token cleanup

3. User Login
   ├── Credential validation
   ├── JWT token generation (7d expiry)
   └── Secure cookie storage

4. Password Reset
   ├── Reset token generation (1h expiry)
   ├── Reset email sending
   ├── New password validation
   └── Token cleanup
```

### Security Measures
- **Password Hashing**: bcrypt với 12 salt rounds
- **JWT Tokens**: Secure, httpOnly cookies với expiration
- **Rate Limiting**: 100 requests/15 minutes per IP
- **Input Validation**: Joi schemas cho tất cả endpoints
- **CORS Protection**: Configured cho specific origins
- **Helmet**: Security headers protection
- **Environment Variables**: Sensitive data protection

## 📊 Database Schema

### Firestore Collections

#### users
```javascript
{
  id: "auto-generated",
  email: "user@example.com",
  password: "hashed_password",
  firstName: "John",
  lastName: "Doe",
  isVerified: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  lastLoginAt: "2024-01-01T00:00:00Z",
  profile: {
    bio: "User bio",
    avatar: "avatar_url"
  },
  stats: {
    linksChecked: 10,
    joinedAt: "2024-01-01T00:00:00Z"
  }
}
```

#### links
```javascript
{
  id: "auto-generated",
  userId: "user_id_reference",
  url: "https://example.com/article",
  credibilityScore: 85,
  status: "completed",
  summary: "Analysis summary",
  sources: [
    {
      name: "Source Name",
      url: "https://source.com",
      credibility: "high"
    }
  ],
  metadata: {
    title: "Article Title",
    domain: "example.com",
    publishDate: "2024-01-01T00:00:00Z",
    author: "Author Name"
  },
  checkedAt: "2024-01-01T00:00:00Z"
}
```

#### verification_tokens
```javascript
{
  id: "auto-generated",
  userId: "user_id_reference",
  token: "random_token_string",
  email: "user@example.com",
  expiresAt: "2024-01-02T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z"
}
```

#### password_reset_tokens
```javascript
{
  id: "auto-generated",
  userId: "user_id_reference",
  token: "random_token_string",
  email: "user@example.com",
  expiresAt: "2024-01-01T01:00:00Z",
  createdAt: "2024-01-01T00:00:00Z"
}
```

## 🌐 API Endpoints

### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### User Management Endpoints
```
GET    /api/users/profile      # Get user profile
PUT    /api/users/profile      # Update user profile
GET    /api/users/dashboard    # Get dashboard data
DELETE /api/users/account      # Delete user account
```

### Link Checking Endpoints
```
POST   /api/links/check        # Check new link
GET    /api/links/history      # Get check history
GET    /api/links/:linkId      # Get specific result
DELETE /api/links/:linkId      # Delete result
```

## 🚀 Deployment Architecture

### Development Environment
```
Frontend: http://localhost:3000
Backend:  http://localhost:5000
Database: Firebase Firestore (cloud)
```

### Production Environment (Docker)
```
Frontend: Nginx container (port 3000)
Backend:  Node.js container (port 5000)
Database: Firebase Firestore (cloud)
Cache:    Redis container (optional)
```

## 📈 Performance Considerations

### Frontend Optimizations
- **Code Splitting**: React.lazy() cho route-based splitting
- **Caching**: React Query cho API response caching
- **Memoization**: React.memo cho expensive components
- **Bundle Optimization**: Webpack optimizations

### Backend Optimizations
- **Database Indexing**: Firestore composite indexes
- **Rate Limiting**: Prevent API abuse
- **Compression**: Gzip compression cho responses
- **Caching**: Redis caching cho frequent queries (future)

## 🔄 Data Flow

### User Registration Flow
```
1. User submits registration form
2. Frontend validates input (Yup)
3. API validates request (Joi)
4. Password hashed (bcrypt)
5. User saved to Firestore
6. Verification token generated
7. Email sent via Nodemailer
8. User receives verification email
9. User clicks verification link
10. Token validated and user activated
```

### Link Checking Flow
```
1. User submits URL
2. Frontend validates URL format
3. API validates request
4. Check for recent duplicate
5. Call external crawler API
6. Process crawler response
7. Calculate credibility score
8. Save result to Firestore
9. Update user statistics
10. Return result to frontend
```

## 🧪 Testing Strategy

### Unit Tests
- Controller logic testing
- Service function testing
- Component rendering tests
- Utility function tests

### Integration Tests
- API endpoint testing
- Database operation testing
- Authentication flow testing
- Email service testing

### E2E Tests
- User registration flow
- Login/logout flow
- Link checking flow
- Profile management flow

## 📋 Future Enhancements (Sprint 2+)

### Planned Features
- **Community Features**: User comments, ratings
- **Advanced Analytics**: Detailed credibility analysis
- **Expert Verification**: Human expert review system
- **Chatbot Integration**: AI-powered assistance
- **Mobile App**: React Native implementation
- **Admin Panel**: Content moderation tools
- **API Rate Plans**: Tiered access levels
- **Real-time Updates**: WebSocket integration

### Technical Improvements
- **Microservices**: Split into smaller services
- **Caching Layer**: Redis implementation
- **CDN Integration**: Static asset optimization
- **Monitoring**: Application performance monitoring
- **CI/CD Pipeline**: Automated deployment
- **Load Balancing**: Multiple server instances
- **Database Optimization**: Query optimization
- **Security Enhancements**: Advanced threat protection
