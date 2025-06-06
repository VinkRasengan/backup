# 🔥 Firestore Migration Guide

## 🚀 Step 1: Enable Firestore (2 minutes)

### 1.1 Go to Firebase Console
```
https://console.firebase.google.com/project/factcheck-1d6e8/firestore
```

### 1.2 Create Firestore Database
1. Click **"Create database"**
2. Choose **"Start in production mode"**
3. Select location: **asia-southeast1 (Singapore)**
4. Click **"Done"**

## 🔧 Step 2: Update Backend Configuration

### 2.1 Install Firebase Admin (if not installed)
```bash
cd server
npm install firebase-admin
```

### 2.2 Update Environment Variables on Render

Go to Render Dashboard → Backend Service → Environment:

```env
# Keep existing variables and add:
USE_FIRESTORE=true
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----"
```

## 📊 Step 3: Firestore Collections Structure

Firestore will automatically create these collections:

```
📁 users/
  └── {userId}/
      ├── email: string
      ├── displayName: string
      ├── authProvider: string
      ├── createdAt: timestamp
      └── stats: object

📁 conversations/
  └── {conversationId}/
      ├── userId: string
      ├── title: string
      ├── messageCount: number
      └── lastMessage: string

📁 chatMessages/
  └── {messageId}/
      ├── conversationId: string
      ├── userId: string
      ├── role: string
      ├── content: string
      └── createdAt: timestamp

📁 links/
  └── {linkId}/
      ├── url: string
      ├── title: string
      ├── userId: string
      ├── securityScore: number
      └── isSafe: boolean

📁 votes/
  └── {voteId}/
      ├── linkId: string
      ├── userId: string
      ├── voteType: string
      └── createdAt: timestamp

📁 comments/
  └── {commentId}/
      ├── linkId: string
      ├── userId: string
      ├── content: string
      └── createdAt: timestamp

📁 reports/
  └── {reportId}/
      ├── linkId: string
      ├── userId: string
      ├── type: string
      ├── reason: string
      └── status: string
```

## 🎯 Step 4: Deploy and Test

### 4.1 Deploy Backend
```bash
git add .
git commit -m "🔥 Switch to Firestore as primary database"
git push
```

### 4.2 Test Database Connection
```
https://factcheck-backend.onrender.com/api/health
```

Should show:
```json
{
  "database": {
    "status": "connected",
    "type": "firestore",
    "message": "Firestore connection healthy"
  }
}
```

## ✅ Benefits of Firestore

1. **🔥 Real-time Updates** - Perfect for chat and community features
2. **🚀 Auto-scaling** - No connection limits
3. **💰 Cost-effective** - Free tier generous for your use case
4. **🔒 Security Rules** - Built-in security
5. **📱 Offline Support** - Works offline
6. **🔄 Easy Backup** - Automatic backups
7. **🌍 Global CDN** - Fast worldwide access

## 🎉 Migration Complete!

After migration:
- ✅ All features work the same
- ✅ Better performance for real-time features
- ✅ Easier deployment (no PostgreSQL setup)
- ✅ Better integration with Firebase Auth
- ✅ Automatic scaling
