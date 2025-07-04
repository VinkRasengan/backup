# 🗄️ Database Management Guide

## 📋 **Overview**

This guide covers all database management tasks for the FactCheck application, including development, staging, and production environments.

## 🚀 **Quick Start**

### **Development (Emulator)**

```bash
# Start Firestore emulator
firebase emulators:start --only firestore

# Migrate database structure
npm run db:migrate

# Seed with sample data
npm run db:seed

# View data in emulator UI
# http://127.0.0.1:4000/firestore
```

### **Production**

```bash
# 1. Download service account key from Firebase Console
# 2. Save as config/firebase-service-account.json
# 3. Analyze current database
npm run db:analyze

# 4. Run migration (with safety delay)
npm run db:migrate:production
```

## 📊 **Database Structure**

### **Current Optimized Structure**

```
📁 users/                    # User accounts and profiles
📁 posts/                    # Main content (user posts + news)
📁 votes/                    # Voting system
📁 comments/                 # Comment system
📁 link_analysis/            # Security analysis results
📁 conversations/            # Chat conversations
📁 chat_messages/            # Chat messages
📁 notifications/            # User notifications
📁 reports/                  # Content reports
📁 verification_tokens/      # Auth tokens
📁 user_sessions/            # Session management
📁 analytics/                # Performance metrics
📁 user_activity/            # User activity tracking
```

### **Legacy Structure (Pre-Migration)**

```
📁 users/
📁 community_submissions/    # → migrated to posts/
📁 links/                    # → migrated to link_analysis/
📁 votes/                    # → updated structure
📁 comments/
📁 conversations/
📁 chat_messages/
📁 verification_tokens/
📁 knowledge/                # → removed (deprecated)
```

## 🛠️ **Available Scripts**

### **Development Scripts**

```bash
# Database migration (emulator)
npm run db:migrate              # Migrate database structure
npm run db:migrate:dry-run      # Preview migration changes
npm run db:seed                 # Add sample data

# Emulator management
firebase emulators:start --only firestore    # Start emulator
firebase emulators:kill                      # Stop emulator
```

### **Production Scripts**

```bash
# Analysis and migration
npm run db:analyze              # Analyze production database
npm run db:migrate:production   # Migrate production database

# Backup and restore (manual)
firebase firestore:export gs://factcheck-1d6e8.appspot.com/backups/$(date +%Y%m%d)
firebase firestore:import gs://factcheck-1d6e8.appspot.com/backups/YYYYMMDD
```

## 🔧 **Configuration**

### **Environment Variables**

```bash
# Development (automatic)
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080

# Production
FIREBASE_SERVICE_ACCOUNT=./config/firebase-service-account.json
FIREBASE_PROJECT_ID=factcheck-1d6e8
```

### **Service Account Setup**

1. **Go to Firebase Console**: https://console.firebase.google.com/u/0/project/factcheck-1d6e8/settings/serviceaccounts/adminsdk
2. **Generate Key**: Click "Generate new private key"
3. **Save File**: Save as `config/firebase-service-account.json`
4. **Verify**: File should be ignored by git (check .gitignore)

## 📈 **Migration Process**

### **Step 1: Analysis**

```bash
# Analyze current database structure
FIREBASE_SERVICE_ACCOUNT=./config/firebase-service-account.json npm run db:analyze
```

**Output Example:**

```
✅ Existing Collections:
   📁 community_submissions: 25 documents
   📁 links: 12 documents
   📁 votes: 150 documents
   📁 users: 8 documents

❌ Missing Collections:
   📁 posts: Not found
   📁 link_analysis: Not found
   📁 notifications: Not found

🚀 Migration Recommendations:
   ✅ Migrate community_submissions (25 docs) → posts
   ✅ Migrate links (12 docs) → link_analysis
   ✅ Create notifications collection
   ✅ Update votes structure (150 docs)
```

### **Step 2: Migration**

```bash
# Run migration with safety delay
FIREBASE_SERVICE_ACCOUNT=./config/firebase-service-account.json npm run db:migrate:production
```

**Migration Process:**

1. **Safety Delay**: 5-second countdown to cancel
2. **Data Migration**:
   - `community_submissions` → `posts`
   - `links` → `link_analysis`
   - Update `votes` structure
3. **Collection Creation**: New collections for features
4. **Cleanup**: Remove deprecated data
5. **Verification**: Check data integrity

### **Step 3: Verification**

```bash
# Re-analyze to verify migration
npm run db:analyze

# Test application functionality
npm run start:full
```

## 🔍 **Data Models**

### **Posts Collection**

```javascript
{
  id: "post123",
  title: "Website lừa đảo mới",
  content: "Cảnh báo về website...",
  type: "user_post" | "news" | "link_analysis",
  category: "phishing" | "scam" | "malware" | "official_warning",
  author: {
    uid: "user123",
    email: "user@example.com",
    displayName: "User Name"
  },
  url: "https://suspicious-site.com",
  tags: ["phishing", "banking"],
  status: "active" | "hidden" | "deleted",
  voteStats: {
    safe: 5,
    unsafe: 15,
    suspicious: 3,
    total: 23
  },
  voteScore: 10,
  commentCount: 8,
  viewCount: 150,
  verified: true,
  trustScore: 85,
  source: "VnExpress", // for news
  createdAt: Timestamp,
  updatedAt: Timestamp,
  metadata: {}
}
```

#### **Article Models**

```javascript
{
  id: "post123",
  title: 'Cách nhận biết tin giả trên mạng xã hội',
        description: 'Hướng dẫn chi tiết về các dấu hiệu nhận biết tin giả và cách xác minh thông tin trên các nền tảng mạng xã hội.',
        category: 'basics',
        readTime: '5 phút',
        views: 1250,
        featured: true,
        // Store content as a string with image links and text (for easier rendering)
        content: `
## Các dấu hiệu nhận biết tin giả

### 1. Kiểm tra nguồn thông tin
abc
img:https://example.com/image1.jpg
- Xem xét độ uy tín của trang web
- Kiểm tra thông tin về tác giả
- Tìm hiểu lịch sử của nguồn tin

### 2. Phân tích nội dung
img:https://example.com/image2.jpg
- Chú ý đến ngôn ngữ cảm xúc quá mức
- Kiểm tra tính logic của thông tin
- So sánh với các nguồn khác

### 3. Xác minh bằng công cụ
- Sử dụng Google Reverse Image Search
img:https://example.com/image3.jpg
- Kiểm tra trên các trang fact-check
- Tìm kiếm thông tin gốc
  // ...other fields as needed
}
```

### **Votes Collection**

```javascript
{
  linkId: "post123",        // References posts collection
  userId: "user123",
  userEmail: "user@example.com",
  voteType: "safe" | "unsafe" | "suspicious",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **Link Analysis Collection**

```javascript
{
  url: "https://example.com",
  domain: "example.com",
  title: "Page Title",
  description: "Page description",
  screenshot: "https://screenshot-url.com",
  securityScores: {
    virusTotal: { score: 0, details: {} },
    scamAdviser: { score: 85, details: {} },
    phishTank: { isPhishing: false },
    criminalIP: { riskScore: 10 }
  },
  overallRisk: "safe" | "suspicious" | "dangerous",
  riskScore: 15, // 0-100
  analysisDate: Timestamp,
  lastChecked: Timestamp,
  metadata: {}
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Permission Denied**

```bash
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

**Solution:**

1. Verify service account has Firestore Admin role
2. Check project ID matches
3. Ensure service account file is valid JSON

#### **Network Timeout**

```bash
Error: Request timeout
```

**Solution:**

1. Check internet connection
2. Increase timeout in script
3. Run migration in smaller batches

#### **Quota Exceeded**

```bash
Error: Quota exceeded
```

**Solution:**

1. Wait for quota reset (daily/hourly)
2. Request quota increase in Google Cloud Console
3. Optimize queries to use fewer operations

#### **Emulator Connection Failed**

```bash
Error: ECONNREFUSED 127.0.0.1:8080
```

**Solution:**

1. Start Firestore emulator: `firebase emulators:start --only firestore`
2. Check port 8080 is not in use
3. Verify firebase.json configuration

### **Data Recovery**

#### **Restore from Backup**

```bash
# List available backups
gsutil ls gs://factcheck-1d6e8.appspot.com/backups/

# Restore specific backup
firebase firestore:import gs://factcheck-1d6e8.appspot.com/backups/20240618
```

#### **Partial Recovery**

```bash
# Export specific collection
firebase firestore:export --collection-ids=posts gs://factcheck-1d6e8.appspot.com/exports/posts-$(date +%Y%m%d)

# Import to different collection
firebase firestore:import --collection-ids=posts_backup gs://factcheck-1d6e8.appspot.com/exports/posts-20240618
```

## 📊 **Performance Optimization**

### **Recommended Indexes**

Create these indexes in Firebase Console for optimal performance:

```javascript
// Posts collection
posts: [
  { fields: ["type", "createdAt"], order: "desc" },
  { fields: ["category", "createdAt"], order: "desc" },
  { fields: ["author.uid", "createdAt"], order: "desc" },
  { fields: ["status", "voteScore"], order: "desc" },
];

// Votes collection
votes: [
  { fields: ["linkId", "userId"] },
  { fields: ["userId", "createdAt"], order: "desc" },
];

// Comments collection
comments: [
  { fields: ["postId", "createdAt"], order: "desc" },
  { fields: ["author.uid", "createdAt"], order: "desc" },
];
```

### **Query Optimization**

```javascript
// ✅ Good: Use indexes
db.collection("posts")
  .where("type", "==", "user_post")
  .orderBy("createdAt", "desc")
  .limit(20);

// ❌ Bad: No index support
db.collection("posts")
  .where("title", ">=", searchTerm)
  .where("category", "==", "phishing")
  .orderBy("voteScore", "desc");
```

## 🔗 **Related Documentation**

- [Firestore Structure](./firestore-structure.md) - Detailed database schema
- [Production Migration Guide](./production-migration-guide.md) - Step-by-step migration
- [API Documentation](./api-documentation.md) - Service endpoints
- [Security Rules](./security-rules.md) - Firestore security configuration
