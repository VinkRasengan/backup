# Community Service - Improved

Dịch vụ cộng đồng đã được cải thiện với tích hợp database chặt chẽ, loại bỏ mock data, và UI/UX tốt hơn.

## 🚀 Tính năng chính

### ✅ Đã cải thiện
- **Loại bỏ hoàn toàn mock data** - Tất cả dữ liệu đều từ Firestore
- **Reddit-style voting system** - Upvote/downvote với score calculation
- **Facebook-style UI** - Giao diện đẹp như Facebook với post cards
- **Comment system nâng cao** - Voting cho comments, replies, edit/delete
- **Database optimization** - Proper indexing, caching, batch operations
- **Sample data generator** - Tạo dữ liệu mẫu cho development
- **Comprehensive testing** - Test script cho tất cả functionality

### 📋 Posts Management
- ✅ Tạo, đọc, cập nhật, xóa posts
- ✅ Search và filter posts
- ✅ Pagination với performance optimization
- ✅ Vote statistics tracking
- ✅ Comment count tracking
- ✅ Trust score calculation

### 💬 Comments System
- ✅ Nested comments (replies)
- ✅ Comment voting (upvote/downvote)
- ✅ Edit và delete comments
- ✅ Facebook-style UI
- ✅ Real-time comment count updates

### 🗳️ Voting System
- ✅ Reddit-style upvote/downvote
- ✅ Vote statistics (total, score)
- ✅ User vote tracking
- ✅ Batch voting operations
- ✅ Optimized vote queries

## 🏗️ Architecture

```
Community Service
├── src/
│   ├── routes/
│   │   ├── posts.js          # Posts CRUD + sample data
│   │   ├── comments.js       # Comments + voting
│   │   ├── votes.js          # Post voting system
│   │   └── reports.js        # Reporting system
│   ├── config/
│   │   └── firebase.js       # Firestore configuration
│   ├── utils/
│   │   └── sampleData.js     # Sample data generator
│   └── app.js               # Express app setup
├── shared/                  # Shared utilities
└── README.md               # This file
```

## 🔧 API Endpoints

### Posts
```
GET    /posts                 # Get posts with filters
POST   /posts                 # Create new post
GET    /posts/:id             # Get single post
POST   /posts/dev/sample-data # Create sample data (dev only)
DELETE /posts/dev/sample-data # Clear sample data (dev only)
```

### Comments
```
GET    /comments/:postId      # Get comments for post
POST   /comments              # Create comment
GET    /comments/:commentId/replies # Get replies
PUT    /comments/:commentId   # Update comment
DELETE /comments/:commentId   # Delete comment
POST   /comments/:commentId/vote # Vote on comment
GET    /comments/:commentId/votes # Get comment votes
```

### Votes
```
POST   /votes/:linkId         # Submit/update vote
GET    /votes/:linkId/stats   # Get vote statistics
GET    /votes/:linkId/user    # Get user's vote
GET    /votes/:linkId/optimized # Get stats + user vote
DELETE /votes/:linkId         # Delete user's vote
POST   /votes/batch           # Batch vote operations
```

## 🗄️ Database Schema

### Posts Collection
```javascript
{
  id: "auto-generated",
  title: "string",
  content: "string",
  author: {
    uid: "string",
    email: "string",
    displayName: "string"
  },
  type: "user_post" | "news",
  category: "string",
  url: "string?",
  tags: ["string"],
  voteStats: {
    upvotes: number,
    downvotes: number,
    total: number,
    score: number
  },
  voteScore: number,
  commentCount: number,
  verified: boolean,
  trustScore: number?,
  searchTerms: ["string"], // For search optimization
  createdAt: Date,
  updatedAt: Date
}
```

### Comments Collection
```javascript
{
  id: "auto-generated",
  postId: "string",
  content: "string",
  author: {
    uid: "string",
    email: "string",
    displayName: "string"
  },
  parentId: "string?", // For replies
  voteStats: {
    upvotes: number,
    downvotes: number,
    total: number,
    score: number
  },
  voteScore: number,
  replyCount: number,
  status: "active" | "deleted",
  isEdited: boolean,
  editHistory: [Date],
  createdAt: Date,
  updatedAt: Date
}
```

### Votes Collection
```javascript
{
  id: "auto-generated",
  linkId: "string", // Post ID
  userId: "string",
  userEmail: "string?",
  voteType: "upvote" | "downvote",
  createdAt: Date,
  updatedAt: Date
}
```

### Comment Votes Collection
```javascript
{
  id: "auto-generated",
  commentId: "string",
  userId: "string",
  voteType: "upvote" | "downvote",
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd services/community-service
npm install
```

### 2. Environment Setup
Đảm bảo file `.env` có cấu hình Firebase:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"
```

### 3. Start Service
```bash
npm start
# Service sẽ chạy trên port 3003
```

### 4. Create Sample Data (Development)
```bash
curl -X POST http://localhost:8080/api/posts/dev/sample-data
```

### 5. Test Service
```bash
node test-community-service.js
```

## 🧪 Testing

### Automated Testing
```bash
# Run comprehensive test suite
node test-community-service.js

# Test specific functionality
node -e "
const { testServiceHealth } = require('./test-community-service.js');
testServiceHealth();
"
```

### Manual Testing
1. **Health Check**: `GET http://localhost:3003/health`
2. **Create Sample Data**: `POST http://localhost:8080/api/posts/dev/sample-data`
3. **Get Posts**: `GET http://localhost:8080/api/posts`
4. **Vote on Post**: `POST http://localhost:8080/api/votes/{postId}`
5. **Add Comment**: `POST http://localhost:8080/api/comments`

## 🎨 Frontend Integration

### UnifiedPostCard Component
- Facebook-style post layout
- Reddit-style voting buttons
- Comment preview with voting
- Responsive design
- Dark mode support

### Key Features
- **Lazy loading** cho performance
- **GSAP animations** cho smooth interactions
- **Real-time updates** cho votes và comments
- **Error handling** với fallback UI
- **Accessibility** với ARIA labels

## 📊 Performance Optimizations

1. **Database Indexing**
   - Composite indexes cho sorting
   - Search optimization với searchTerms array

2. **Caching Strategy**
   - Vote data caching (5 minutes)
   - Comment preview caching
   - Batch operations để reduce API calls

3. **Query Optimization**
   - Parallel queries cho stats và user data
   - Pagination với offset/limit
   - Timeout handling cho slow queries

## 🔒 Security Features

1. **Input Validation**
   - Required field validation
   - Content sanitization
   - Vote type validation

2. **Authorization**
   - User ownership checks
   - JWT token validation
   - Rate limiting

3. **Data Protection**
   - Soft delete cho comments
   - Edit history tracking
   - Status-based filtering

## 🐛 Troubleshooting

### Common Issues

1. **Firestore Connection Failed**
   ```bash
   # Check Firebase configuration
   echo $FIREBASE_PROJECT_ID
   # Verify service account permissions
   ```

2. **Sample Data Creation Failed**
   ```bash
   # Clear existing data first
   curl -X DELETE http://localhost:8080/api/posts/dev/sample-data
   # Then create new sample data
   curl -X POST http://localhost:8080/api/posts/dev/sample-data
   ```

3. **Vote System Not Working**
   ```bash
   # Check vote collection exists
   # Verify user authentication
   # Test with sample data
   ```

## 📈 Monitoring

Service health endpoint: `GET /health`
Metrics endpoint: `GET /metrics`
Logs: Check console output với structured logging

## 🔄 Next Steps

1. **Real-time Features**
   - WebSocket integration cho live comments
   - Push notifications cho new posts

2. **Advanced Features**
   - Image upload cho posts
   - Rich text editor cho comments
   - Advanced search với Algolia

3. **Analytics**
   - User engagement tracking
   - Popular posts analytics
   - Comment sentiment analysis
