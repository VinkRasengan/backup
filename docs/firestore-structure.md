# 🗄️ Firestore Database Structure - Optimized

## 📋 **Recommended Collections Structure**

### **1. 👥 Users Collection**
```
users/
├── {userId}/
    ├── email: string
    ├── displayName: string
    ├── photoURL: string
    ├── role: string (user|moderator|admin)
    ├── reputation: number
    ├── joinedAt: timestamp
    ├── lastActive: timestamp
    ├── preferences: object
    ├── stats: object
        ├── postsCount: number
        ├── commentsCount: number
        ├── votesGiven: number
        ├── votesReceived: number
    └── verified: boolean
```

### **2. 📝 Posts Collection (Main Content)**
```
posts/
├── {postId}/
    ├── id: string
    ├── title: string
    ├── content: string
    ├── type: string (user_post|news|link_analysis)
    ├── category: string
    ├── author: object
        ├── uid: string
        ├── email: string
        ├── displayName: string
    ├── url: string (optional)
    ├── tags: array
    ├── status: string (active|hidden|deleted)
    ├── voteStats: object
        ├── safe: number
        ├── unsafe: number
        ├── suspicious: number
        ├── total: number
    ├── voteScore: number
    ├── commentCount: number
    ├── viewCount: number
    ├── verified: boolean
    ├── trustScore: number
    ├── source: string (for news)
    ├── createdAt: timestamp
    ├── updatedAt: timestamp
    └── metadata: object
```

### **3. 🗳️ Votes Collection**
```
votes/
├── {voteId}/
    ├── linkId: string (references posts)
    ├── userId: string
    ├── userEmail: string
    ├── voteType: string (safe|unsafe|suspicious)
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

### **4. 💬 Comments Collection**
```
comments/
├── {commentId}/
    ├── postId: string
    ├── parentId: string (for replies)
    ├── author: object
        ├── uid: string
        ├── email: string
        ├── displayName: string
    ├── content: string
    ├── voteScore: number
    ├── status: string (active|hidden|deleted)
    ├── createdAt: timestamp
    ├── updatedAt: timestamp
    └── replies: array (comment IDs)
```

### **5. 🔗 Link Analysis Collection**
```
link_analysis/
├── {linkId}/
    ├── url: string
    ├── domain: string
    ├── title: string
    ├── description: string
    ├── screenshot: string
    ├── securityScores: object
        ├── virusTotal: object
        ├── scamAdviser: object
        ├── phishTank: object
        ├── criminalIP: object
    ├── overallRisk: string (safe|suspicious|dangerous)
    ├── riskScore: number (0-100)
    ├── analysisDate: timestamp
    ├── lastChecked: timestamp
    └── metadata: object
```

### **6. 💬 Chat System**
```
conversations/
├── {conversationId}/
    ├── participants: array
    ├── type: string (direct|group|support)
    ├── title: string
    ├── lastMessage: object
    ├── createdAt: timestamp
    └── updatedAt: timestamp

chat_messages/
├── {messageId}/
    ├── conversationId: string
    ├── senderId: string
    ├── senderName: string
    ├── content: string
    ├── type: string (text|image|file|system)
    ├── readBy: array
    ├── createdAt: timestamp
    └── metadata: object
```

### **7. 🔔 Notifications Collection**
```
notifications/
├── {notificationId}/
    ├── userId: string
    ├── type: string (vote|comment|mention|system)
    ├── title: string
    ├── message: string
    ├── data: object
    ├── read: boolean
    ├── actionUrl: string
    ├── createdAt: timestamp
    └── expiresAt: timestamp
```

### **8. 🛡️ Reports Collection**
```
reports/
├── {reportId}/
    ├── reporterId: string
    ├── targetType: string (post|comment|user)
    ├── targetId: string
    ├── reason: string
    ├── description: string
    ├── status: string (pending|reviewed|resolved)
    ├── moderatorId: string
    ├── moderatorNotes: string
    ├── createdAt: timestamp
    └── resolvedAt: timestamp
```

### **9. 🔐 Auth & Security**
```
verification_tokens/
├── {tokenId}/
    ├── userId: string
    ├── email: string
    ├── token: string
    ├── type: string (email|password_reset)
    ├── used: boolean
    ├── createdAt: timestamp
    └── expiresAt: timestamp

user_sessions/
├── {sessionId}/
    ├── userId: string
    ├── deviceInfo: object
    ├── ipAddress: string
    ├── lastActivity: timestamp
    ├── createdAt: timestamp
    └── expiresAt: timestamp
```

### **10. 📊 Analytics & Metrics**
```
analytics/
├── daily_stats/
    ├── {date}/
        ├── postsCreated: number
        ├── commentsCreated: number
        ├── votesSubmitted: number
        ├── activeUsers: number
        ├── linksAnalyzed: number
        └── timestamp: timestamp

user_activity/
├── {userId}/
    ├── {date}/
        ├── postsCreated: number
        ├── commentsCreated: number
        ├── votesSubmitted: number
        ├── linksAnalyzed: number
        └── lastActivity: timestamp
```

## 🔧 **Migration Strategy**

### **Phase 1: Core Collections**
1. Create `posts` collection
2. Migrate `community_submissions` → `posts`
3. Update `votes` to reference `posts`
4. Update `comments` to reference `posts`

### **Phase 2: Enhanced Features**
1. Create `notifications` collection
2. Create `reports` collection
3. Create `link_analysis` collection
4. Optimize `users` collection

### **Phase 3: Analytics**
1. Create `analytics` collections
2. Set up automated metrics collection
3. Create admin dashboard queries

## 📝 **Firestore Rules Example**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts are readable by all, writable by authenticated users
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.author.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'moderator']);
    }
    
    // Votes are writable by authenticated users
    match /votes/{voteId} {
      allow read: if true;
      allow create, update: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Comments follow similar pattern to posts
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.author.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'moderator']);
    }
  }
}
```

## 🎯 **Benefits of This Structure**

1. **🔄 Consistency**: All content in `posts`, clear separation of concerns
2. **📈 Scalability**: Optimized for queries and indexing
3. **🔒 Security**: Proper access control with Firestore rules
4. **📊 Analytics**: Built-in metrics and reporting
5. **🚀 Performance**: Efficient queries and minimal data duplication
6. **🛠️ Maintainability**: Clear structure, easy to understand and modify
