# 🚀 Production Database Migration Guide

## 📋 **Overview**
This guide explains how to migrate your production Firebase database to the new optimized structure.

## ⚠️ **Important Warnings**
- **BACKUP YOUR DATA**: Always backup your production database before migration
- **DOWNTIME**: Migration may cause temporary service interruption
- **IRREVERSIBLE**: Some migration steps cannot be undone
- **TEST FIRST**: Always test migration on development/staging environment

## 🔧 **Prerequisites**

### 1. Firebase Service Account Key
You need a Firebase service account key to access production database.

#### **Step 1: Go to Firebase Console**
1. Visit: https://console.firebase.google.com/u/0/project/factcheck-1d6e8/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Download the JSON file
4. Save it as `config/firebase-service-account.json`

#### **Step 2: Verify Project Access**
```bash
# Test connection (dry run)
FIREBASE_SERVICE_ACCOUNT=./config/firebase-service-account.json node scripts/migrate-firestore.js --production --dry-run
```

### 2. Database Backup
```bash
# Export current database (optional but recommended)
firebase firestore:export gs://factcheck-1d6e8.appspot.com/backups/pre-migration-$(date +%Y%m%d)
```

## 🚀 **Migration Steps**

### **Step 1: Prepare Environment**
```bash
# Install dependencies
npm install

# Verify all services are working
npm run health:check
```

### **Step 2: Run Migration (Development Test)**
```bash
# Test migration on emulator first
npm run db:migrate

# Verify results in emulator UI
# http://127.0.0.1:4000/firestore
```

### **Step 3: Run Production Migration**
```bash
# Set service account path
export FIREBASE_SERVICE_ACCOUNT=./config/firebase-service-account.json

# Run production migration (with 5-second safety delay)
npm run db:migrate:production
```

Or run directly:
```bash
FIREBASE_SERVICE_ACCOUNT=./config/firebase-service-account.json node scripts/migrate-firestore.js --production
```

### **Step 4: Verify Migration**
1. **Check Firebase Console**: https://console.firebase.google.com/u/0/project/factcheck-1d6e8/firestore
2. **Verify new collections exist**:
   - `posts` (migrated from `community_submissions`)
   - `link_analysis` (migrated from `links`)
   - `notifications`, `reports`, etc.
3. **Test application functionality**
4. **Check data integrity**

### **Step 5: Update Application Code**
```bash
# Update all services to use new structure
npm run services:restart

# Test frontend
npm run start:client
```

## 📊 **Migration Details**

### **What Gets Migrated:**

#### **1. community_submissions → posts**
- ✅ All user submissions become posts with `type: 'user_post'`
- ✅ Author information preserved
- ✅ Timestamps preserved
- ✅ Vote counts initialized

#### **2. links → link_analysis**
- ✅ URL analysis data preserved
- ✅ Security scores maintained
- ✅ Risk assessments kept

#### **3. votes collection**
- ✅ Structure updated with new fields
- ✅ All existing votes preserved
- ✅ References updated to point to posts

#### **4. New collections created**
- ✅ `notifications` - User notifications
- ✅ `reports` - Content reporting system
- ✅ `user_sessions` - Session management
- ✅ `analytics` - Performance metrics

### **What Gets Cleaned Up:**
- ❌ `knowledge` collection (if empty)
- ❌ Placeholder documents
- ❌ Deprecated fields

## 🔍 **Verification Checklist**

### **Data Integrity**
- [ ] All community submissions migrated to posts
- [ ] All links migrated to link_analysis
- [ ] Vote counts match original data
- [ ] User data preserved
- [ ] Timestamps preserved

### **Application Functionality**
- [ ] Community feed loads correctly
- [ ] Voting system works
- [ ] Comments display properly
- [ ] User authentication works
- [ ] Admin features functional

### **Performance**
- [ ] Page load times acceptable
- [ ] Database queries optimized
- [ ] No console errors
- [ ] API responses fast

## 🚨 **Rollback Plan**

If migration fails or causes issues:

### **Option 1: Restore from Backup**
```bash
# Restore from backup (if created)
firebase firestore:import gs://factcheck-1d6e8.appspot.com/backups/pre-migration-YYYYMMDD
```

### **Option 2: Manual Rollback**
1. **Revert application code** to use old structure
2. **Update service configurations**
3. **Restart all services**

### **Option 3: Partial Rollback**
- Keep new collections but revert application code
- Gradually migrate application features

## 📞 **Support**

### **If Migration Fails:**
1. **Check logs** for specific error messages
2. **Verify service account permissions**
3. **Check network connectivity**
4. **Review Firebase quotas and limits**

### **Common Issues:**

#### **Permission Denied**
```bash
# Solution: Verify service account has Firestore Admin role
# Go to: https://console.cloud.google.com/iam-admin/iam
```

#### **Network Timeout**
```bash
# Solution: Run migration in smaller batches
# Or increase timeout in migration script
```

#### **Quota Exceeded**
```bash
# Solution: Wait for quota reset or request increase
# Check: https://console.cloud.google.com/apis/api/firestore.googleapis.com/quotas
```

## 📈 **Post-Migration Optimization**

### **1. Create Indexes**
```bash
# Create recommended indexes in Firebase Console
# See: docs/firestore-structure.md for index list
```

### **2. Update Security Rules**
```bash
# Deploy new Firestore rules
firebase deploy --only firestore:rules
```

### **3. Monitor Performance**
```bash
# Check application performance
npm run monitor:performance

# Review database usage
# Firebase Console > Usage tab
```

## 🎯 **Success Criteria**

Migration is successful when:
- ✅ All data migrated without loss
- ✅ Application functions normally
- ✅ Performance is maintained or improved
- ✅ No critical errors in logs
- ✅ Users can access all features

## 📝 **Migration Log Template**

```
Migration Date: ___________
Migration Time: ___________
Migrated by: ___________

Pre-migration checks:
[ ] Database backup created
[ ] Service account configured
[ ] Development migration tested
[ ] Team notified

Migration results:
[ ] community_submissions → posts: ___ documents
[ ] links → link_analysis: ___ documents  
[ ] votes updated: ___ documents
[ ] New collections created: ___

Post-migration verification:
[ ] Data integrity verified
[ ] Application functionality tested
[ ] Performance acceptable
[ ] No critical errors

Issues encountered:
___________

Resolution:
___________

Sign-off:
___________
```
