# FactCheck - Anti-Fraud Platform 🛡️

FactCheck là một nền tảng chống lừa đảo trực tuyến hiện đại, giúp người dùng kiểm tra độ tin cậy của thông tin, website và bảo vệ khỏi các mối đe dọa bảo mật.

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

### 🤖 Dual Chat System
- **Chat Widget Tự Động** - Trả lời tự động nhanh chóng (góc phải)
- **AI Chat với OpenAI** - Tư vấn bảo mật thông minh với GPT
- **Quick Replies** - Câu trả lời nhanh cho tình huống phổ biến
- **Conversation History** - Lưu lịch sử chat cho AI chat

### 📊 Dashboard & Analytics
- **Dashboard cá nhân** theo dõi hoạt động
- **Lịch sử kiểm tra** với filter và search
- **Thống kê bảo mật** cá nhân
- **Responsive design** cho mọi thiết bị

## 🏗️ Kiến trúc hệ thống

### Frontend (React + TailwindCSS)

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
│   │   ├── ChatBot/               # Chat widget (tự động)
│   │   │   ├── ChatBot.js         # Main widget component
│   │   │   ├── ChatMessage.js     # Message component
│   │   │   ├── ChatInput.js       # Input component
│   │   │   └── QuickReplies.js    # Quick reply buttons
│   │   └── PasswordStrengthIndicator.js
│   ├── pages/
│   │   ├── HomePage.js            # Landing page
│   │   ├── ModernLoginPage.js     # Login với TailwindCSS
│   │   ├── ModernRegisterPage.js  # Register với validation
│   │   ├── ProfilePage.js         # Profile settings
│   │   ├── DashboardPage.js       # User dashboard
│   │   ├── CheckLinkPage.js       # URL checking
│   │   ├── ChatPage.js            # AI chat với OpenAI
│   │   └── VerifyEmailPage.js     # Email verification
│   ├── context/
│   │   ├── AuthContext.js         # Firebase Auth
│   │   └── ThemeContext.js        # Dark/Light mode
│   ├── services/
│   │   ├── api.js                 # API client
│   │   ├── mockAPI.js             # Fallback API
│   │   └── virusTotalService.js   # VirusTotal integration
│   └── config/
│       └── firebase.js            # Firebase config
```

### Backend (Express.js + PostgreSQL)

```
server/
├── src/
│   ├── controllers/
│   │   ├── simpleChatController.js    # Chat controllers
│   │   ├── authController.js          # Authentication
│   │   └── linkController.js          # URL checking
│   ├── middleware/
│   │   ├── auth.js                    # JWT authentication
│   │   └── validation.js              # Input validation
│   ├── routes/
│   │   ├── chat.js                    # Chat endpoints
│   │   ├── auth.js                    # Auth endpoints
│   │   └── links.js                   # Link checking
│   ├── services/
│   │   ├── openaiService.js           # OpenAI integration
│   │   ├── mockOpenaiService.js       # Fallback responses
│   │   └── virusTotalService.js       # VirusTotal API
│   ├── config/
│   │   ├── database.js                # PostgreSQL config
│   │   └── firebase.js                # Firebase config
│   └── app.js                         # Express app
├── .env                               # Environment variables
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
- **Git** để clone repository
- **PostgreSQL** (cho production) hoặc sử dụng in-memory storage (development)

### 🔧 Cài đặt Development (Localhost)

#### 1. Clone repository:

```bash
git clone https://github.com/VinkRasengan/backup.git
cd backup
```

#### 2. Cài đặt dependencies:

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

#### 3. Cấu hình Backend Environment:

Tạo file `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# OpenAI GPT API Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# VirusTotal API Configuration (optional)
VIRUSTOTAL_API_KEY=your-virustotal-api-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### 4. Cấu hình Frontend Environment:

Tạo file `client/.env.local`:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id

# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_USE_MOCK_API=false
```

#### 5. Khởi động Development:

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm start
```

### 🌐 URLs Development

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health
- **Chat Test**: http://localhost:5000/api/chat/test

## 🚀 Production Deployment

### 🌐 Deploy lên Render (Recommended)

Render cung cấp hosting miễn phí cho cả frontend và backend với PostgreSQL database.

#### 1. Chuẩn bị Repository

Đảm bảo code đã được push lên GitHub repository.

#### 2. Deploy Backend lên Render

1. **Tạo Web Service:**
   - Truy cập [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Chọn branch `main`

2. **Cấu hình Build Settings:**
   ```
   Name: factcheck-backend
   Environment: Node
   Region: Oregon (US West)
   Branch: main
   Root Directory: server
   Build Command: npm install
   Start Command: npm start
   ```

3. **Cấu hình Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   OPENAI_API_KEY=sk-proj-your-openai-api-key
   OPENAI_MODEL=gpt-3.5-turbo
   OPENAI_MAX_TOKENS=500
   OPENAI_TEMPERATURE=0.7
   VIRUSTOTAL_API_KEY=your-virustotal-api-key
   JWT_SECRET=your-production-jwt-secret
   JWT_EXPIRE=7d
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ```

4. **Tạo PostgreSQL Database:**
   - Click "New" → "PostgreSQL"
   - Name: `factcheck-db`
   - Copy connection string và thêm vào Environment Variables:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

#### 3. Deploy Frontend lên Render

1. **Tạo Static Site:**
   - Click "New" → "Static Site"
   - Connect cùng GitHub repository
   - Chọn branch `main`

2. **Cấu hình Build Settings:**
   ```
   Name: factcheck-frontend
   Root Directory: client
   Build Command: npm install && npm run build
   Publish Directory: build
   ```

3. **Cấu hình Environment Variables:**
   ```
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   REACT_APP_USE_MOCK_API=false
   ```

### 🌍 Production URLs

- **Frontend**: https://factcheck-frontend.onrender.com
- **Backend API**: https://factcheck-backend.onrender.com
- **API Health**: https://factcheck-backend.onrender.com/health

### 🔄 Auto-Deploy

Render sẽ tự động deploy khi có commit mới lên branch `main`. Để disable auto-deploy:
- Vào Service Settings → Build & Deploy → Auto-Deploy: Off

## 🖥️ Self-Hosting trên PC/Server

Để tự host hoàn toàn trên máy tính cá nhân hoặc server riêng.

### 📋 Yêu cầu hệ thống

- **OS**: Windows 10/11, macOS, hoặc Linux
- **Node.js**: 18+ và npm 9+
- **PostgreSQL**: 13+ (hoặc sử dụng in-memory storage)
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB+)
- **Storage**: Tối thiểu 2GB free space
- **Network**: Port 3000, 5000 available

### 🔧 Cài đặt PostgreSQL (Optional)

#### Windows:
```bash
# Download và cài đặt từ https://www.postgresql.org/download/windows/
# Hoặc sử dụng Chocolatey
choco install postgresql

# Tạo database
createdb factcheck_db
```

#### macOS:
```bash
# Sử dụng Homebrew
brew install postgresql
brew services start postgresql

# Tạo database
createdb factcheck_db
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Tạo database
sudo -u postgres createdb factcheck_db
```

### 🚀 Setup Production trên PC

#### 1. Clone và cài đặt:

```bash
git clone https://github.com/VinkRasengan/backup.git
cd backup

# Install dependencies
cd client && npm install
cd ../server && npm install
```

#### 2. Cấu hình Production Environment:

Tạo file `server/.env.production`:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/factcheck_db

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# VirusTotal API
VIRUSTOTAL_API_KEY=your-virustotal-api-key

# Security
JWT_SECRET=your-super-secure-production-jwt-secret-change-this
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:3000
# Hoặc domain của bạn: https://yourdomain.com

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### 3. Build Frontend:

```bash
cd client

# Tạo production build
npm run build

# Serve static files (option 1: serve package)
npm install -g serve
serve -s build -l 3000

# Hoặc (option 2: copy to server)
cp -r build/* ../server/public/
```

#### 4. Setup Database Schema:

```sql
-- Connect to PostgreSQL và tạo tables
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE links (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  url TEXT NOT NULL,
  domain VARCHAR(255),
  security_score INTEGER,
  status VARCHAR(50),
  analysis JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_links_user_id ON links(user_id);
```

#### 5. Start Production Server:

```bash
cd server

# Start với production config
NODE_ENV=production npm start

# Hoặc sử dụng PM2 (recommended)
npm install -g pm2
pm2 start src/app.js --name "factcheck-api" --env production
pm2 startup
pm2 save
```

### 🌐 Cấu hình Domain (Optional)

#### Sử dụng Nginx làm reverse proxy:

```nginx
# /etc/nginx/sites-available/factcheck
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /path/to/backup/client/build;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/factcheck /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 🔒 SSL Certificate (HTTPS)

```bash
# Sử dụng Certbot cho Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 📊 Monitoring & Maintenance

#### System Monitoring với PM2:

```bash
# Xem status các process
pm2 status

# Xem logs
pm2 logs factcheck-api

# Restart service
pm2 restart factcheck-api

# Monitor real-time
pm2 monit
```

#### Database Backup:

```bash
# Backup PostgreSQL
pg_dump factcheck_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore từ backup
psql factcheck_db < backup_20241206_120000.sql

# Automated backup script
#!/bin/bash
# save as backup.sh
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump factcheck_db > $BACKUP_DIR/factcheck_backup_$DATE.sql
find $BACKUP_DIR -name "factcheck_backup_*.sql" -mtime +7 -delete
```

#### Log Rotation:

```bash
# Cấu hình logrotate
sudo nano /etc/logrotate.d/factcheck

# Nội dung file:
/home/user/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 user user
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 🔧 Performance Optimization

#### 1. Database Optimization:

```sql
-- Analyze và optimize tables
ANALYZE;
VACUUM ANALYZE;

-- Monitor slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### 2. Node.js Optimization:

```bash
# Increase memory limit
node --max-old-space-size=4096 src/app.js

# Enable cluster mode với PM2
pm2 start src/app.js -i max --name "factcheck-api"
```

#### 3. Nginx Caching:

```nginx
# Thêm vào nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /api {
    # API caching cho static responses
    proxy_cache_valid 200 5m;
    proxy_cache_key $request_uri;
}
```

### 🚨 Security Hardening

#### 1. Firewall Setup:

```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 5000   # Block direct API access
```

#### 2. Environment Security:

```bash
# Set proper file permissions
chmod 600 server/.env.production
chown user:user server/.env.production

# Hide sensitive files
echo "*.env*" >> .gitignore
echo "backup_*.sql" >> .gitignore
```

#### 3. Regular Updates:

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js dependencies
cd server && npm audit fix
cd client && npm audit fix

# Update PM2
npm update -g pm2
```

### 📱 Mobile Access

Để truy cập từ mobile devices trong cùng network:

```bash
# Tìm IP address của PC
ip addr show  # Linux
ipconfig      # Windows

# Update CORS trong server/.env.production
FRONTEND_URL=http://192.168.1.100:3000,http://localhost:3000

# Access từ mobile
# http://192.168.1.100:3000
```

### 🔄 Auto-Start on Boot

#### Windows (Task Scheduler):
1. Mở Task Scheduler
2. Create Basic Task → "FactCheck Startup"
3. Trigger: "When computer starts"
4. Action: Start program → `node.exe`
5. Arguments: `C:\path\to\backup\server\src\app.js`

#### Linux (systemd):

```bash
# Tạo service file
sudo nano /etc/systemd/system/factcheck.service

# Nội dung:
[Unit]
Description=FactCheck API Server
After=network.target

[Service]
Type=simple
User=user
WorkingDirectory=/home/user/backup/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/app.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable service
sudo systemctl enable factcheck
sudo systemctl start factcheck
```

## 📊 So sánh các Options Deployment

| Feature | Localhost | Self-Hosting | Render |
|---------|-----------|--------------|--------|
| **Cost** | Free | Server cost | Free tier |
| **Setup Complexity** | Easy | Medium | Easy |
| **Performance** | Good | Excellent | Good |
| **Scalability** | Limited | High | Medium |
| **Maintenance** | None | High | None |
| **Custom Domain** | No | Yes | Yes |
| **SSL Certificate** | No | Manual | Auto |
| **Database** | In-memory | PostgreSQL | PostgreSQL |
| **Uptime** | PC dependent | 24/7 | 99.9% |
| **Backup** | Manual | Manual | Auto |

### 🎯 Khuyến nghị sử dụng:

#### 🏠 **Localhost** - Phù hợp cho:
- Development và testing
- Demo nhanh
- Học tập và thử nghiệm
- Không cần truy cập từ xa

#### 🖥️ **Self-Hosting** - Phù hợp cho:
- Kiểm soát hoàn toàn hệ thống
- Performance cao
- Custom requirements
- Enterprise deployment
- Có kinh nghiệm system admin

#### ☁️ **Render** - Phù hợp cho:
- Production deployment nhanh
- Không muốn quản lý server
- Startup và small business
- Auto-scaling needs
- Beginners

### 🔄 Migration giữa các options:

```bash
# Từ Localhost → Self-Hosting
1. Export database (nếu có)
2. Copy source code lên server
3. Setup production environment
4. Import database

# Từ Self-Hosting → Render
1. Push code lên GitHub
2. Export PostgreSQL database
3. Create Render services
4. Import database to Render PostgreSQL

# Từ Render → Self-Hosting
1. Clone repository
2. Export database từ Render
3. Setup local server
4. Import database
```

## ⚙️ Cấu hình chi tiết

### 🔥 Firebase Setup

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

### 🔑 API Keys Setup

#### OpenAI API (cho AI Chat)
1. Truy cập [OpenAI Platform](https://platform.openai.com)
2. Tạo API key mới
3. Thêm vào environment variables:
```env
OPENAI_API_KEY=sk-proj-your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
```

#### VirusTotal API (cho Security Scanning)
1. Đăng ký tại [VirusTotal](https://www.virustotal.com)
2. Lấy API key từ profile
3. Thêm vào environment variables:
```env
VIRUSTOTAL_API_KEY=your-virustotal-api-key
```

### 🤖 Chat System Configuration

Project có 2 hệ thống chat riêng biệt:

#### 1. Chat Widget (Tự động)
- **Endpoint**: `/api/chat/widget`
- **Tính năng**: Trả lời tự động dựa trên từ khóa
- **Không cần**: OpenAI API key
- **Vị trí**: Widget góc phải màn hình

#### 2. AI Chat (OpenAI)
- **Endpoint**: `/api/chat/openai` và `/api/chat/message`
- **Tính năng**: Sử dụng OpenAI GPT API
- **Cần**: OpenAI API key
- **Vị trí**: Trang Chat riêng biệt

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

## 🧪 Testing & Troubleshooting

### 🔍 API Testing

Test các endpoints sau để đảm bảo hệ thống hoạt động:

```bash
# Health check
curl http://localhost:5000/health

# Chat widget test
curl -X POST http://localhost:5000/api/chat/widget \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'

# OpenAI chat test
curl -X POST http://localhost:5000/api/chat/openai \
  -H "Content-Type: application/json" \
  -d '{"message":"Làm thế nào để tạo mật khẩu mạnh?"}'

# URL check test
curl -X POST http://localhost:5000/api/links/check \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'
```

### 🐛 Common Issues

#### 1. OpenAI API không hoạt động
```bash
# Kiểm tra API key
echo $OPENAI_API_KEY

# Test OpenAI endpoint
curl http://localhost:5000/api/chat/test-openai
```

#### 2. CORS errors
Đảm bảo `FRONTEND_URL` trong server/.env đúng:
```env
FRONTEND_URL=http://localhost:3000
```

#### 3. Firebase connection issues
Kiểm tra Firebase config trong `client/.env.local`

#### 4. Database connection (Production)
Kiểm tra `DATABASE_URL` trong Render environment variables

### 📊 Monitoring

#### Development
- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:5000/health
- **API Docs**: http://localhost:5000/api/chat/test

#### Production
- **Frontend**: https://your-app.onrender.com
- **Backend Health**: https://your-api.onrender.com/health
- **Render Dashboard**: https://dashboard.render.com

## 🚀 Roadmap

### Phase 1 (Completed) ✅
- ✅ User authentication với Firebase
- ✅ URL security checking với VirusTotal
- ✅ Dual chat system (Widget + AI)
- ✅ Modern UI/UX với TailwindCSS
- ✅ Production deployment trên Render

### Phase 2 (In Progress) 🔄
- 🔄 Advanced threat intelligence
- 🔄 Community reporting system
- 🔄 Enhanced security analytics
- 🔄 Performance optimization

### Phase 3 (Planned) 📋
- [ ] Browser extension
- [ ] Mobile app (React Native)
- [ ] Enterprise features
- [ ] API for developers
- [ ] Machine learning integration

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

### 📋 Development Guidelines

- Sử dụng ESLint và Prettier cho code formatting
- Viết commit messages rõ ràng
- Test kỹ trước khi tạo PR
- Cập nhật documentation nếu cần

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 📞 Support & Contact

- **Production Website**: https://factcheck-frontend.onrender.com
- **GitHub Repository**: [VinkRasengan/backup](https://github.com/VinkRasengan/backup)
- **Issues**: [GitHub Issues](https://github.com/VinkRasengan/backup/issues)
- **Developer**: VinkRasengan

### 🆘 Getting Help

1. **Check Documentation**: Đọc README này trước
2. **Search Issues**: Tìm trong GitHub Issues
3. **Create New Issue**: Nếu không tìm thấy giải pháp
4. **Include Details**: Logs, screenshots, environment info

---

**Made with ❤️ by FactCheck Team**

*Bảo vệ bạn khỏi lừa đảo trực tuyến - FactCheck Platform 2024*

## 🚀 Latest Deployment

**Last Deploy:** 2025-06-06T14:35:19.344Z
**Status:** ✅ Ready for Production
**Features:** Community Posts, NewsAPI, Voting System, Enhanced UX

