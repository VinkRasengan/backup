# 🚀 Firestore Setup Guide for Sprint 2

## Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project setup**
   ```bash
   firebase login
   firebase use your-project-id
   ```

3. **Service Account Key** (for production)
   - Download from Firebase Console > Project Settings > Service Accounts
   - Save as `server/serviceAccountKey.json`

## 🔧 Setup Steps

### 1. Initialize Firestore (Development)

**Using Emulator (Recommended for development):**
```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, run initialization
cd scripts
node init-firestore.js
```

**Using Production Firestore:**
```bash
# Make sure serviceAccountKey.json is in server/ directory
cd scripts
node init-firestore.js
```

### 2. Deploy Indexes

**Option A: Using the script (Recommended)**
```bash
chmod +x scripts/deploy-indexes.sh
./scripts/deploy-indexes.sh
```

**Option B: Manual deployment**
```bash
# Replace current indexes with new ones
cp firestore.indexes.new.json firestore.indexes.json

# Deploy to Firebase
firebase deploy --only firestore:indexes
```

### 3. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### 4. Verify Setup

**Check Firestore Console:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database
4. Verify collections exist:
   - `users`
   - `links` 
   - `votes`
   - `comments`
   - `reports`
   - `admin_notifications`

**Check Indexes:**
1. Go to Firestore > Indexes tab
2. Verify new composite indexes are created/building

## 📊 Sample Data Structure

### Users Collection
```javascript
{
  id: "user-1",
  email: "user@example.com",
  firstName: "Nguyen",
  lastName: "Van A",
  role: "user", // or "admin"
  isVerified: true,
  createdAt: "2024-01-15T10:00:00Z",
  profile: {
    avatar: null,
    bio: "Community member"
  }
}
```

### Links Collection (with Community Stats)
```javascript
{
  id: "link-1",
  url: "https://example.com/news",
  title: "News Article Title",
  userId: "user-1",
  credibilityScore: 85,
  checkedAt: "2024-01-15T10:00:00Z",
  communityStats: {
    votes: {
      trusted: 45,
      suspicious: 12,
      untrusted: 8
    },
    totalVotes: 65,
    totalComments: 23,
    totalReports: 2,
    consensus: {
      type: "trusted",
      percentage: 69
    },
    lastVoteAt: "2024-01-15T10:30:00Z",
    lastCommentAt: "2024-01-15T11:45:00Z",
    lastReportAt: "2024-01-14T09:20:00Z"
  }
}
```

### Votes Collection
```javascript
{
  id: "vote-1",
  linkId: "link-1",
  userId: "user-1", 
  voteType: "trusted", // "trusted", "suspicious", "untrusted"
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Comments Collection
```javascript
{
  id: "comment-1",
  linkId: "link-1",
  userId: "user-1",
  content: "This is a helpful comment",
  author: {
    firstName: "Nguyen",
    lastName: "Van A",
    avatar: null
  },
  createdAt: "2024-01-15T11:45:00Z",
  updatedAt: "2024-01-15T11:45:00Z",
  isEdited: false
}
```

### Reports Collection
```javascript
{
  id: "report-1",
  linkId: "link-1",
  userId: "user-1",
  category: "fake_news", // "fake_news", "scam", "malicious_content", "spam", "other"
  description: "This contains false information",
  status: "pending", // "pending", "reviewed", "resolved", "dismissed"
  reporter: {
    firstName: "Nguyen",
    lastName: "Van A",
    email: "user@example.com"
  },
  linkInfo: {
    url: "https://example.com/news",
    title: "News Article Title",
    credibilityScore: 85
  },
  createdAt: "2024-01-15T12:00:00Z",
  updatedAt: "2024-01-15T12:00:00Z",
  reviewedAt: null,
  reviewedBy: null,
  adminNotes: null
}
```

### Admin Notifications Collection
```javascript
{
  id: "notification-1",
  type: "new_report",
  reportId: "report-1",
  linkId: "link-1",
  category: "fake_news",
  reporterName: "Nguyen Van A",
  linkUrl: "https://example.com/news",
  message: "New fake news report submitted",
  isRead: false,
  createdAt: "2024-01-15T12:00:00Z"
}
```

## 🔍 Testing the Setup

### 1. Test API Endpoints

**Vote on a link:**
```bash
curl -X POST http://localhost:3001/api/votes/link-1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"voteType": "trusted"}'
```

**Add a comment:**
```bash
curl -X POST http://localhost:3001/api/comments/link-1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"content": "This is a test comment"}'
```

**Submit a report:**
```bash
curl -X POST http://localhost:3001/api/reports/link-1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"category": "fake_news", "description": "Test report"}'
```

### 2. Test Admin Features

**Get admin notifications:**
```bash
curl -X GET http://localhost:3001/api/admin/notifications \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Get all reports:**
```bash
curl -X GET http://localhost:3001/api/admin/reports \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## 🚨 Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Check Firestore security rules
   - Verify JWT token is valid
   - Ensure user has correct role

2. **"Index not found" errors**
   - Wait for indexes to finish building
   - Check Firebase Console > Firestore > Indexes
   - Redeploy indexes if needed

3. **"Collection not found" errors**
   - Run initialization script again
   - Check if emulator is running
   - Verify project ID is correct

### Reset Firestore Data

**For emulator:**
```bash
firebase emulators:start --import=./emulator-data --export-on-exit
```

**For production (⚠️ DANGEROUS):**
```bash
# This will delete ALL data
firebase firestore:delete --all-collections
node scripts/init-firestore.js
```

## 📈 Performance Monitoring

Monitor these metrics in Firebase Console:

1. **Read/Write Operations**
2. **Index Usage**
3. **Query Performance**
4. **Storage Usage**
5. **Security Rule Evaluations**

## 🔄 Next Steps

1. ✅ Firestore initialized
2. ✅ Indexes deployed
3. ✅ Security rules updated
4. 🔄 Test Sprint 2 features
5. 🔄 Monitor performance
6. 🔄 Optimize based on usage patterns

## 📞 Support

If you encounter issues:
1. Check Firebase Console for errors
2. Review server logs
3. Verify API endpoints with Postman
4. Check network connectivity
5. Ensure proper authentication
