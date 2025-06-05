# FactCheck - Anti-Fraud Platform

FactCheck là một nền tảng chống lừa đảo trực tuyến, giúp người dùng kiểm tra độ tin cậy của thông tin, website và bảo vệ khỏi các mối đe dọa bảo mật.

## 🌟 Tính năng chính

### 🔐 Xác thực & Bảo mật
- **Đăng ký tài khoản** với xác minh email bắt buộc
- **Đăng nhập an toàn** với Firebase Authentication
- **Đổi mật khẩu** với validation mạnh mẽ
- **Quên mật khẩu** qua email reset
- **Profile Settings** với TailwindCSS UI hiện đại

### 🔍 Kiểm tra bảo mật
- **Kiểm tra URL/Website** với phân tích toàn diện
- **VirusTotal Integration** - Quét với 70+ antivirus engines
- **Security Scoring** - Điểm bảo mật từ 0-100
- **Threat Detection** - Phát hiện malware, phishing, scam
- **Real-time Results** - Kết quả hiển thị ngay lập tức

### 🤖 AI Security Assistant
- **Chatbot tư vấn bảo mật** với OpenAI GPT
- **Câu hỏi thông minh** về an toàn mạng
- **Hướng dẫn phòng chống** lừa đảo trực tuyến
- **Quick replies** cho các tình huống phổ biến

### 📊 Dashboard & Analytics
- **Dashboard cá nhân** theo dõi hoạt động
- **Lịch sử kiểm tra** với filter và search
- **Thống kê bảo mật** cá nhân
- **Responsive design** cho mọi thiết bị

## 🏗️ Kiến trúc hệ thống

### Frontend (React + Firebase)

```
client/
├── src/
│   ├── components/
│   │   ├── ModernNavigation.js    # Navigation với dropdown
│   │   ├── ui/                    # UI components
│   │   │   ├── Button.js          # Button component
│   │   │   ├── Input.js           # Input với validation
│   │   │   ├── Card.js            # Card layout
│   │   │   └── ChatInput.js       # Chat input field
│   │   ├── ChatBot/               # Chatbot components
│   │   └── PasswordStrengthIndicator.js
│   ├── pages/
│   │   ├── HomePage.js            # Landing page
│   │   ├── ModernLoginPage.js     # Login với TailwindCSS
│   │   ├── ModernRegisterPage.js  # Register với validation
│   │   ├── ProfilePage.js         # Profile settings
│   │   ├── DashboardPage.js       # User dashboard
│   │   ├── CheckLinkPage.js       # URL checking
│   │   ├── ChatPage.js            # AI chatbot
│   │   └── VerifyEmailPage.js     # Email verification
│   ├── context/
│   │   ├── AuthContext.js         # Firebase Auth
│   │   └── ThemeContext.js        # Dark/Light mode
│   ├── services/
│   │   ├── api.js                 # API client
│   │   └── mockAPI.js             # Fallback API
│   └── config/
│       └── firebase.js            # Firebase config
```

### Backend Options

**Option 1: Firebase Functions** (Recommended)
```
functions/
├── index.js                       # Cloud Functions entry
├── services/
│   └── openaiService.js          # OpenAI integration
└── package.json
```

**Option 2: Express.js Server** (Alternative)
```
server/
├── src/
│   ├── controllers/               # API controllers
│   ├── middleware/                # Auth & validation
│   ├── routes/                    # API routes
│   └── services/                  # External services
└── package.json
```

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 18** - UI framework hiện đại
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **React Hook Form** - Form handling với validation
- **Firebase SDK** - Authentication & Firestore
- **Yup** - Schema validation
- **Lucide React** - Modern icon library
- **React Hot Toast** - Notification system

### Backend & Services
- **Firebase Authentication** - User management
- **Firebase Firestore** - NoSQL database
- **Firebase Hosting** - Static site hosting
- **Firebase Functions** - Serverless backend (optional)
- **OpenAI API** - AI chatbot integration
- **VirusTotal API** - Security scanning
- **Express.js** - Alternative backend option

### Development Tools
- **Vite** - Fast build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Firebase CLI** - Deployment tools

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống

- **Node.js** 18+ và npm 9+
- **Firebase CLI**: `npm install -g firebase-tools`
- **Git** để clone repository

### 🔧 Cài đặt Development

1. **Clone repository:**

```bash
git clone https://github.com/VinkRasengan/backup.git
cd backup
```

2. **Cài đặt dependencies:**

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies (nếu sử dụng Express backend)
cd ../server
npm install

# Install functions dependencies (nếu sử dụng Firebase Functions)
cd ../functions
npm install
```

3. **Cấu hình Firebase:**

```bash
# Login to Firebase
firebase login

# Initialize project (nếu chưa có)
firebase init

# Set project
firebase use your-project-id
```

4. **Cấu hình environment:**

Tạo file `client/.env.local`:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
```

5. **Khởi động development:**

```bash
# Start frontend
cd client
npm start

# Start backend (nếu sử dụng Express)
cd server
npm run dev
```

### 🌐 URLs Development

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000 (nếu sử dụng Express)
- **Firebase Console**: https://console.firebase.google.com

### 🚀 Production Deployment

**Deploy lên Firebase Hosting:**

```bash
# Build và deploy
cd client
npm run build
firebase deploy --only hosting
```

**Deploy Firebase Functions (nếu sử dụng):**

```bash
cd functions
firebase deploy --only functions
```

### 🌍 Production URLs

- **Website**: https://factcheck-1d6e8.web.app
- **API**: https://us-central1-factcheck-1d6e8.cloudfunctions.net/api

## ⚙️ Cấu hình chi tiết

### Firebase Setup

1. **Tạo Firebase Project:**
   - Truy cập [Firebase Console](https://console.firebase.google.com)
   - Tạo project mới hoặc sử dụng project có sẵn
   - Enable Authentication và Firestore Database

2. **Cấu hình Authentication:**
   - Vào Authentication > Sign-in method
   - Enable Email/Password provider
   - Cấu hình domain cho production

3. **Cấu hình Firestore:**
   - Tạo database trong test mode
   - Cập nhật security rules khi deploy production

### API Keys Setup

**OpenAI API (cho chatbot):**
```env
OPENAI_API_KEY=sk-proj-your-openai-api-key
```

**VirusTotal API (cho security scanning):**
```env
VIRUSTOTAL_API_KEY=your-virustotal-api-key
```

### Environment Variables

**Client (.env.local):**
```env
# Firebase Config
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id

# API URLs
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_USE_EMULATOR=false
REACT_APP_OPENAI_ENABLED=true
```

**Functions (.env):**
```env
OPENAI_API_KEY=sk-proj-your-openai-api-key
VIRUSTOTAL_API_KEY=your-virustotal-api-key
```

## 📊 Cấu trúc Database

### Firestore Collections

#### users
```javascript
{
  uid: string,                    // Firebase Auth UID
  email: string,
  firstName: string,
  lastName: string,
  displayName: string,
  emailVerified: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  profile: {
    bio: string,
    avatar: string,
    preferences: {
      theme: 'light' | 'dark',
      notifications: boolean
    }
  },
  stats: {
    linksChecked: number,
    chatMessages: number,
    joinedAt: timestamp,
    lastActive: timestamp
  }
}
```

#### links
```javascript
{
  id: string,
  userId: string,
  url: string,
  domain: string,
  credibilityScore: number,       // 0-100
  securityScore: number,          // 0-100 (VirusTotal)
  overallScore: number,           // Combined score
  status: 'safe' | 'suspicious' | 'malicious',
  analysis: {
    virusTotal: {
      positives: number,
      total: number,
      scanDate: timestamp,
      permalink: string
    },
    threats: string[],            // ['malware', 'phishing', etc.]
    summary: string
  },
  metadata: {
    title: string,
    description: string,
    favicon: string,
    publishDate: timestamp
  },
  checkedAt: timestamp,
  createdAt: timestamp
}
```

#### conversations
```javascript
{
  id: string,
  userId: string,
  title: string,
  messages: [
    {
      id: string,
      role: 'user' | 'assistant',
      content: string,
      timestamp: timestamp
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔗 Tính năng chính

### 🔐 Authentication & Security
- **Firebase Authentication** - Đăng ký, đăng nhập, xác minh email
- **Password Management** - Đổi mật khẩu, quên mật khẩu
- **Profile Settings** - Cập nhật thông tin cá nhân
- **Session Management** - Tự động logout khi hết hạn

### 🔍 URL Security Checking
- **Real-time Analysis** - Kiểm tra URL ngay lập tức
- **VirusTotal Integration** - Quét với 70+ antivirus engines
- **Security Scoring** - Điểm bảo mật từ 0-100
- **Threat Detection** - Phát hiện malware, phishing, scam
- **History Tracking** - Lưu lịch sử kiểm tra

### 🤖 AI Security Assistant
- **OpenAI Integration** - Chatbot tư vấn bảo mật
- **Security Guidance** - Hướng dẫn phòng chống lừa đảo
- **Quick Replies** - Câu trả lời nhanh cho tình huống phổ biến
- **Conversation History** - Lưu lịch sử chat

### 📊 Dashboard & Analytics
- **Personal Dashboard** - Tổng quan hoạt động cá nhân
- **Statistics** - Thống kê links đã kiểm tra, tin nhắn chat
- **Recent Activity** - Hoạt động gần đây
- **Security Insights** - Phân tích xu hướng bảo mật

## 🎨 UI/UX Features

### 🌓 Theme Support
- **Light/Dark Mode** - Chuyển đổi theme tự động
- **Responsive Design** - Tối ưu cho mọi thiết bị
- **Modern UI** - TailwindCSS với animations
- **Accessibility** - Hỗ trợ screen readers

### 📱 Mobile Experience
- **Touch-friendly** - Tối ưu cho mobile
- **Progressive Web App** - Có thể cài đặt như app
- **Offline Support** - Hoạt động khi mất mạng
- **Fast Loading** - Tối ưu performance

## 🧪 Testing & Quality

### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety (optional)
- **Error Boundaries** - Graceful error handling

### Testing Strategy
- **Unit Tests** - Component testing
- **Integration Tests** - API testing
- **E2E Tests** - User flow testing
- **Security Tests** - Vulnerability scanning

## 🚀 Roadmap

### Phase 1 (Completed) ✅
- ✅ User authentication
- ✅ URL security checking
- ✅ AI chatbot integration
- ✅ Modern UI/UX

### Phase 2 (Planned)
- [ ] Advanced threat intelligence
- [ ] Community reporting
- [ ] Browser extension
- [ ] Mobile app

### Phase 3 (Future)
- [ ] Enterprise features
- [ ] API for developers
- [ ] Advanced analytics
- [ ] Machine learning integration

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 📞 Support

- **Website**: [https://factcheck-1d6e8.web.app](https://factcheck-1d6e8.web.app)
- **Issues**: [GitHub Issues](https://github.com/VinkRasengan/backup/issues)
- **Email**: support@factcheck.com

---

**Made with ❤️ by FactCheck Team**
