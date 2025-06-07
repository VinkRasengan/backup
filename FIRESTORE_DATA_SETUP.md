# 🔥 Firestore Data Setup Guide

## 🎯 **Mục tiêu:**
Tạo và quản lý sample data cho tất cả tính năng FactCheck trong Firestore

## 📋 **Bước 1: Cấu hình Render Environment**

### 1.1 Đảm bảo Firebase credentials đã được set:
```env
USE_FIRESTORE=true
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 1.2 Deploy và restart service
- Render Dashboard → Manual Deploy
- Đợi deployment hoàn thành

## 🌱 **Bước 2: Seed Sample Data**

### 2.1 Chạy script seed data:
```bash
# Trong Render Shell hoặc local
npm run db:seed
```

### 2.2 Verify data đã được tạo:
```bash
npm run db:verify
```

## 📊 **Bước 3: Test APIs với Real Data**

### 3.1 Community Posts API:
```
GET https://factcheck-backend.onrender.com/api/community/posts
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "link1",
        "title": "Legitimate Banking Website",
        "content": "Official website of a trusted bank...",
        "status": "safe",
        "votes": { "safe": 2, "unsafe": 0, "suspicious": 0 },
        "author": { "name": "Admin User" },
        "trustScore": 95
      }
    ],
    "pagination": {
      "totalPosts": 5,
      "currentPage": 1
    }
  }
}
```

### 3.2 Community Stats API:
```
GET https://factcheck-backend.onrender.com/api/community/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalPosts": 5,
    "totalUsers": 3,
    "totalVotes": 8,
    "totalComments": 4,
    "statusBreakdown": {
      "safe": 2,
      "unsafe": 2,
      "suspicious": 1
    }
  }
}
```

## 🗄️ **Data Structure trong Firestore:**

### **Collections:**

#### 1. **users** (3 documents)
```javascript
{
  id: 'user1',
  email: 'admin@factcheck.com',
  displayName: 'Admin User',
  isVerified: true,
  stats: { linksChecked: 25, chatMessages: 50 }
}
```

#### 2. **links** (5 documents) 
```javascript
{
  id: 'link1',
  url: 'https://example-safe-banking.com',
  title: 'Legitimate Banking Website',
  status: 'safe', // safe, unsafe, suspicious
  submittedBy: 'user1',
  scanResults: { virusTotal: {...} }
}
```

#### 3. **votes** (8 documents)
```javascript
{
  id: 'vote1',
  linkId: 'link1',
  userId: 'user2', 
  voteType: 'safe' // safe, unsafe, suspicious
}
```

#### 4. **comments** (4 documents)
```javascript
{
  id: 'comment1',
  linkId: 'link1',
  userId: 'user2',
  content: 'I\'ve been using this bank for years...'
}
```

#### 5. **conversations** (2 documents)
```javascript
{
  id: 'conv1',
  userId: 'user1',
  title: 'Security Best Practices'
}
```

#### 6. **chat_messages** (4 documents)
```javascript
{
  id: 'msg1',
  conversationId: 'conv1',
  userId: 'user1',
  content: 'What are the best practices...',
  role: 'user' // user, assistant
}
```

## 🧪 **Testing Features:**

### **1. Community Page:**
- Visit: https://factcheck-frontend.onrender.com/community
- Should show 5 posts with voting buttons
- Posts should have real vote counts
- Comments should be visible

### **2. Voting System:**
- Click vote buttons on posts
- Votes should be saved to Firestore
- Vote counts should update in real-time

### **3. Chat System:**
- Visit chat page
- Previous conversations should load from Firestore
- New messages should be saved

### **4. User Profiles:**
- User stats should reflect real data
- Links checked and chat messages counts

## 🔧 **Management Commands:**

### **Clear all data:**
```bash
npm run db:clear
```

### **Re-seed data:**
```bash
npm run db:clear
npm run db:seed
```

### **Check data integrity:**
```bash
npm run db:verify
```

## 📈 **Expected Results:**

✅ **Community page** hiển thị real posts thay vì mock data
✅ **Voting system** hoạt động với persistent data  
✅ **Comments** được lưu và hiển thị
✅ **Chat history** được maintain
✅ **User stats** reflect actual usage
✅ **Admin features** có real data để quản lý

## 🆘 **Troubleshooting:**

### **Lỗi "Firestore not initialized":**
- Kiểm tra Firebase credentials trong Render
- Verify FIREBASE_PRIVATE_KEY format (có \n)
- Restart service sau khi update env vars

### **Data không hiển thị:**
- Chạy `npm run db:verify` để check data
- Kiểm tra Firestore rules trong Firebase Console
- Check logs trong Render dashboard

### **Performance issues:**
- Firestore có rate limits
- Consider adding indexes cho complex queries
- Monitor usage trong Firebase Console

## 🎉 **Success Indicators:**

Khi setup thành công:
- Community API trả về real data từ Firestore
- Vote counts thay đổi khi user vote
- Comments được lưu và hiển thị
- Chat conversations persist across sessions
- Admin dashboard có meaningful data

**Firestore + Render = Production-ready FactCheck platform! 🚀**
