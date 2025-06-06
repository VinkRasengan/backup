# 🚀 Deploy FactCheck App to Render

## 📋 **Quick Deploy Steps:**

### **1. Access Render Dashboard**
- Visit: https://render.com/
- Login with GitHub account

### **2. Create Blueprint Deployment**
1. Click **"New"** → **"Blueprint"**
2. **Connect Repository**: `VinkRasengan/backup`
3. **Branch**: `main`
4. **Blueprint Name**: `factcheck-app`
5. Click **"Submit"**

### **3. Services Created Automatically:**
- ✅ **Database**: `factcheck-db` (PostgreSQL Free)
- ✅ **Backend**: `factcheck-backend` (Node.js)
- ✅ **Frontend**: `factcheck-frontend` (Static Site)

### **4. Configure Environment Variables**

Go to **Backend Service** → **Environment** and add:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

### **5. Expected URLs:**
- **Frontend**: `https://factcheck-frontend.onrender.com`
- **Backend API**: `https://factcheck-backend.onrender.com`
- **Health Check**: `https://factcheck-backend.onrender.com/health`

### **6. Deployment Features:**
- ✅ **Auto-deploy** on git push
- ✅ **PostgreSQL database** with persistent storage
- ✅ **SSL certificates** (HTTPS)
- ✅ **Global CDN** for frontend
- ✅ **Health monitoring**
- ✅ **Logs & metrics**

### **7. Verify Deployment:**

1. **Backend Health**: 
   ```bash
   curl https://factcheck-backend.onrender.com/health
   ```

2. **Database Status**: Should show `"type": "postgresql"`

3. **Frontend**: Visit frontend URL and test chat functionality

### **8. Post-Deployment:**
- ✅ Chat with AI assistant
- ✅ Check URLs for security
- ✅ User registration/login
- ✅ Community features (votes, comments)
- ✅ All data persisted in PostgreSQL

## 🔧 **Troubleshooting:**

### **Build Fails:**
- Check build logs in Render dashboard
- Verify `package.json` scripts
- Check Node.js version compatibility

### **Database Connection:**
- Verify `DATABASE_URL` is set automatically
- Check PostgreSQL service status
- Review connection logs

### **API Issues:**
- Add `OPENAI_API_KEY` in environment variables
- Check CORS settings for frontend domain
- Verify all required env vars are set

## 🎯 **Success Indicators:**

- ✅ All 3 services show "Live" status
- ✅ Health endpoint returns PostgreSQL connected
- ✅ Frontend loads and chat works
- ✅ Database tables created automatically
- ✅ SSL certificates active (HTTPS)

**🎉 Your FactCheck app is now live on Render with PostgreSQL!**
