# FactCheck - Anti-Fraud Platform 🛡️

A comprehensive anti-fraud platform that helps users verify the safety and credibility of websites, links, and online content. The platform combines multiple security analysis tools and AI-powered assistance to provide real-time threat detection and security recommendations.

## ✨ Features

### 🔍 **Link Security Analysis**
- **Multi-source verification**: VirusTotal, ScamAdviser integration
- **Real-time scanning**: Instant security assessment
- **Threat detection**: Malware, phishing, and scam identification
- **Security scoring**: Combined security ratings from multiple sources

### 📸 **Website Screenshots**
- **Live screenshots**: Real-time website capture using ScreenshotLayer API
- **Visual verification**: See how websites actually look
- **Interactive display**: Click to view full-size screenshots
- **Fallback system**: Placeholder images when screenshots unavailable

### 🤖 **AI Security Assistant**
- **OpenAI integration**: GPT-powered security advice
- **Contextual help**: Personalized security recommendations
- **Quick replies**: Pre-configured security questions
- **Real-time chat**: Interactive security consultation

### 👥 **Community Features**
- **Voting system**: Community-driven link verification
- **Comments**: User experiences and warnings
- **Reporting**: Flag malicious content
- **Admin dashboard**: Content moderation tools

### 🔐 **Authentication & Security**
- **Firebase Authentication**: Secure user management
- **Email verification**: Mandatory email confirmation
- **JWT tokens**: Secure API access
- **Rate limiting**: API protection

## 🛠️ Technology Stack

### **Frontend**
- **React 18**: Modern UI framework
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **React Hook Form**: Form management
- **Axios**: HTTP client

### **Backend**
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **Firebase Admin**: Backend authentication
- **Firestore**: NoSQL database
- **JWT**: Token-based authentication

### **APIs & Services**
- **VirusTotal API**: Malware detection
- **ScamAdviser API**: Scam detection
- **ScreenshotLayer API**: Website screenshots
- **OpenAI API**: AI-powered assistance
- **Firebase**: Authentication & database

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- API keys for external services

### 1. Clone Repository
```bash
git clone https://github.com/your-username/factcheck.git
cd factcheck
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Install functions dependencies (if using Firebase Functions)
cd ../functions
npm install
```

### 3. Environment Configuration

Create `.env` file in the root directory:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# VirusTotal API
VIRUSTOTAL_API_KEY=your-virustotal-api-key

# ScamAdviser API Configuration (via RapidAPI)
SCAMADVISER_API_KEY=your-rapidapi-key

# ScreenshotLayer API Configuration
SCREENSHOTLAYER_API_KEY=your-screenshotlayer-api-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Download service account key
5. Configure Firebase in your project

### 5. Database Setup

Initialize Firestore with required collections:

```bash
cd scripts
node init-firestore.js
node seed-firestore-data.js
```

## 🚀 Development

### Start Development Servers

```bash
# Start backend server (from server directory)
cd server
npm run dev

# Start frontend development server (from client directory)
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Available Scripts

#### Root Level
- `npm run dev`: Start both frontend and backend
- `npm run build`: Build for production

#### Client
- `npm start`: Start development server
- `npm run build`: Build for production

#### Server
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon

## 🌐 Deployment

### Firebase Hosting + Render Backend

1. **Frontend (Firebase Hosting)**:
```bash
cd client
npm run build
firebase deploy --only hosting
```

2. **Backend (Render)**:
- Connect your GitHub repository to Render
- Set environment variables in Render dashboard
- Deploy automatically on git push

### Environment Variables for Production

Ensure all required environment variables are set in your production environment:

- `OPENAI_API_KEY`
- `VIRUSTOTAL_API_KEY` 
- `SCAMADVISER_API_KEY`
- `SCREENSHOTLAYER_API_KEY`
- `JWT_SECRET`
- `FRONTEND_URL`

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification

### Link Analysis Endpoints
- `POST /api/links/check` - Analyze link security
- `GET /api/links/history` - User's check history

### Chat Endpoints
- `POST /api/chat/openai` - AI security assistant
- `POST /api/chat/widget` - Quick chat responses
- `GET /api/chat/starters` - Conversation starters

### Community Endpoints
- `POST /api/community/vote` - Vote on link safety
- `POST /api/community/comment` - Add comment
- `POST /api/community/report` - Report malicious content

## 🔧 Configuration

### API Rate Limits
- VirusTotal: 4 requests/minute (free tier)
- ScamAdviser: 100 requests/month (free tier)
- ScreenshotLayer: 100 requests/month (free tier)
- OpenAI: Based on your plan

### Security Features
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@factcheck.com or join our Discord community.

## 🙏 Acknowledgments

- [VirusTotal](https://www.virustotal.com/) for malware detection
- [ScamAdviser](https://www.scamadviser.com/) for scam detection
- [ScreenshotLayer](https://screenshotlayer.com/) for website screenshots
- [OpenAI](https://openai.com/) for AI assistance
- [Firebase](https://firebase.google.com/) for authentication and database
