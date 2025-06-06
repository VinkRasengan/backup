# PostgreSQL Setup Guide for FactCheck Application

## 🔽 **Step 1: Download PostgreSQL**

1. Visit: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Download PostgreSQL 16.x (latest stable version)
4. Run the installer as Administrator

## ⚙️ **Step 2: Installation Configuration**

During installation, configure:

- **Installation Directory**: `C:\Program Files\PostgreSQL\16`
- **Data Directory**: `C:\Program Files\PostgreSQL\16\data`
- **Port**: `5432` (default)
- **Superuser Password**: Choose a strong password (remember this!)
- **Locale**: Default

**Important**: Remember your superuser password!

## 🗄️ **Step 3: Create Database**

After installation, open **pgAdmin** or **SQL Shell (psql)**:

### Option A: Using pgAdmin (GUI)
1. Open pgAdmin
2. Connect to PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Database name: `factcheck_db`
5. Owner: `postgres`
6. Click "Save"

### Option B: Using SQL Shell (Command Line)
```sql
-- Connect as postgres user
psql -U postgres

-- Create database
CREATE DATABASE factcheck_db;

-- Create user (optional)
CREATE USER factcheck_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE factcheck_db TO factcheck_user;

-- Exit
\q
```

## 🔧 **Step 4: Update Environment Variables**

Your `.env` file should already be configured:

```env
# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/factcheck_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=factcheck_db
DB_USER=postgres
DB_PASSWORD=postgres
```

**Update `DB_PASSWORD`** with your actual PostgreSQL password!

## 🚀 **Step 5: Test Connection**

1. Start your server:
```bash
cd server
npm run dev
```

2. Check logs for:
```
✅ PostgreSQL connection successful
✅ Database models synchronized
✅ Database tables created/verified
```

3. Visit: http://localhost:5001/api/health
   - Should show database status as "connected"

## 🔍 **Step 6: Verify Database Tables**

Connect to your database and verify tables were created:

```sql
-- Connect to factcheck_db
\c factcheck_db

-- List all tables
\dt

-- Should show:
-- users, conversations, chat_messages, links, votes, comments, reports
```

## 🛠️ **Troubleshooting**

### Connection Failed
- Check PostgreSQL service is running
- Verify password in .env file
- Check port 5432 is not blocked

### Permission Denied
- Run PostgreSQL installer as Administrator
- Check user permissions on database

### Port Already in Use
- Change port in postgresql.conf
- Update DB_PORT in .env file

## 📊 **Database Schema Overview**

The application will automatically create these tables:

- **users**: User accounts (Firebase + Backend auth)
- **conversations**: Chat conversations
- **chat_messages**: Individual chat messages
- **links**: URLs checked for security
- **votes**: Community votes on links
- **comments**: User comments on links
- **reports**: User reports for moderation

## ✅ **Success Indicators**

You'll know it's working when:

1. ✅ Server starts without database errors
2. ✅ `/api/health` shows PostgreSQL connected
3. ✅ Chat functionality works
4. ✅ Link checking saves to database
5. ✅ User registration/login works

## 🔄 **Migration from In-Memory**

The application will automatically:
- Detect PostgreSQL connection
- Create tables if they don't exist
- Switch from in-memory to PostgreSQL storage
- Preserve existing functionality

No manual migration needed! 🎉
