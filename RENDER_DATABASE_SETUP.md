# 🗄️ Render PostgreSQL Database Setup

## 🚀 Quick Setup (5 minutes)

### Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**
   ```
   https://dashboard.render.com
   ```

2. **Click "New +"** → **PostgreSQL**

3. **Database Configuration:**
   ```
   Name: factcheck-db
   Database Name: factcheck
   User: factcheck_user
   Region: Singapore
   Plan: Free
   ```

4. **Click "Create Database"**

### Step 2: Get Database URL

After creation, Render will provide:
```
DATABASE_URL=postgresql://factcheck_user:password@host:port/factcheck
```

**Copy this URL!** You'll need it for environment variables.

### Step 3: Update Backend Environment Variables

1. **Go to Backend Service** (factcheck-backend)
2. **Environment** tab
3. **Add/Update:**
   ```
   DATABASE_URL=postgresql://factcheck_user:password@host:port/factcheck
   ```

### Step 4: Redeploy Backend

1. **Manual Deploy** or **Push to GitHub**
2. **Check Logs** for database connection success

## 🔍 Troubleshooting

### Database Connection Failed?

1. **Check DATABASE_URL format:**
   ```
   postgresql://user:password@host:port/database
   ```

2. **Verify database is running:**
   - Render Dashboard → PostgreSQL service → Status

3. **Check backend logs:**
   ```
   ✅ PostgreSQL connection successful
   ✅ Database models synchronized
   ```

### Database Not Created?

1. **Free tier limits:** Check if you've exceeded free PostgreSQL limit
2. **Region issues:** Try different region (Oregon, Frankfurt)
3. **Account verification:** Ensure Render account is verified

## 🎯 Expected Results

After successful setup:

1. **Database Status:** Connected
2. **Health Check:** 
   ```
   https://factcheck-backend.onrender.com/api/health
   ```
   Should show:
   ```json
   {
     "database": {
       "status": "connected",
       "type": "postgresql"
     }
   }
   ```

3. **Tables Created:** All 7 tables automatically created
4. **Sample Data:** Demo data inserted

## 🆘 If PostgreSQL Fails

### Alternative: Use Firestore

If PostgreSQL continues to fail, we can quickly switch to Firestore:

1. **Enable Firestore** in Firebase Console
2. **Update backend** to use Firestore
3. **Deploy** with Firestore configuration

**But try PostgreSQL first - it's better for your use case!**
