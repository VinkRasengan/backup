# KurrentDB Cloud Setup Guide

This guide walks you through setting up KurrentDB Cloud for production Event Sourcing deployment.

## 📋 Prerequisites

- KurrentDB Cloud account (sign up at https://kurrent.io)
- Render account for deployment
- Redis Cloud account (already configured)

## 🚀 KurrentDB Cloud Setup

### Step 1: Create KurrentDB Account

1. Go to https://kurrent.io
2. Sign up for a new account
3. Verify your email address
4. Complete account setup

### Step 2: Create Database

1. Log into KurrentDB Cloud dashboard
2. Click "Create Database"
3. Configure database:
   - **Name**: `factcheck-events-prod`
   - **Region**: Singapore (same as Render)
   - **Plan**: Free tier (for testing)
4. Click "Create Database"

### Step 3: Get Connection Details

After database creation, you'll get:
- **Database URL**: `https://api.kurrent.io`
- **API Key**: `kdb_xxxxxxxxxxxxxxxxxxxxx`
- **Database ID**: `factcheck-events-prod`

## 🔧 Configuration

### Step 1: Update Environment Variables

Add these to your Render service environment variables:

```bash
# KurrentDB Configuration
KURRENTDB_URL=https://api.kurrent.io
KURRENTDB_API_KEY=kdb_xxxxxxxxxxxxxxxxxxxxx
KURRENTDB_DATABASE=factcheck-events-prod
KURRENTDB_ENABLED=true

# Event Sourcing
EVENT_STORE_ENABLED=true
CQRS_ENABLED=true
```

### Step 2: Update Render Deployment

1. Go to Render dashboard
2. Select `factcheck-event-bus` service
3. Go to Environment tab
4. Add/update these variables:
   - `KURRENTDB_URL`: `https://api.kurrent.io`
   - `KURRENTDB_API_KEY`: `kdb_xxxxxxxxxxxxxxxxxxxxx` (mark as secret)
   - `KURRENTDB_DATABASE`: `factcheck-events-prod`
   - `KURRENTDB_ENABLED`: `true`

### Step 3: Update Community Service

1. Go to `factcheck-community` service in Render
2. Add these environment variables:
   - `EVENT_BUS_SERVICE_URL`: `https://factcheck-event-bus.onrender.com`
   - `EVENT_STORE_ENABLED`: `true`
   - `CQRS_ENABLED`: `true`

## 🧪 Testing Connection

### Local Testing

```bash
# Test with development EventStore DB
npm run test

# Test Event Store API
curl http://localhost:3007/api/eventstore/health
```

### Production Testing

```bash
# Test Event Bus Service health
curl https://factcheck-event-bus.onrender.com/health

# Test Event Store API
curl https://factcheck-event-bus.onrender.com/api/eventstore/health

# Test Event Store stats
curl https://factcheck-event-bus.onrender.com/api/eventstore/stats
```

## 📊 Monitoring

### Health Check Endpoints

- **Event Bus Health**: `https://factcheck-event-bus.onrender.com/health`
- **Event Store Health**: `https://factcheck-event-bus.onrender.com/api/eventstore/health`
- **Event Store Stats**: `https://factcheck-event-bus.onrender.com/api/eventstore/stats`

### Expected Responses

**Health Check:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "mode": "eventstore",
    "stats": {
      "eventsAppended": 0,
      "eventsRead": 0,
      "isConnected": true
    }
  }
}
```

**Stats:**
```json
{
  "success": true,
  "data": {
    "eventsAppended": 150,
    "eventsRead": 300,
    "snapshotsTaken": 5,
    "mode": "eventstore",
    "isConnected": true
  }
}
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Connection Failed
```
Error: Failed to connect to KurrentDB
```

**Solutions:**
- Check API key is correct
- Verify database URL
- Ensure database is active
- Check network connectivity

#### 2. Authentication Error
```
Error: Invalid API key
```

**Solutions:**
- Regenerate API key in KurrentDB dashboard
- Update environment variable in Render
- Redeploy service

#### 3. Database Not Found
```
Error: Database 'factcheck-events-prod' not found
```

**Solutions:**
- Check database name spelling
- Verify database exists in KurrentDB dashboard
- Ensure correct region

### Debug Mode

Enable debug logging:

```bash
# Add to environment variables
LOG_LEVEL=debug
KURRENTDB_DEBUG=true
```

### Fallback Mode

If KurrentDB is unavailable, the system will automatically fall back to in-memory storage:

```json
{
  "status": "degraded",
  "mode": "fallback",
  "message": "Using in-memory event store"
}
```

## 🚀 Deployment Process

### Automated Deployment

```bash
# Run deployment script
node scripts/deploy-event-sourcing.js production

# Or skip tests for faster deployment
node scripts/deploy-event-sourcing.js production --skip-tests
```

### Manual Deployment

1. **Deploy Event Bus Service first:**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Add Event Sourcing with KurrentDB"
   git push origin main
   ```

2. **Render will auto-deploy** (if connected to GitHub)

3. **Verify deployment:**
   ```bash
   curl https://factcheck-event-bus.onrender.com/health
   ```

4. **Deploy Community Service:**
   - Update environment variables
   - Trigger redeploy

## 📈 Performance Optimization

### Production Settings

```bash
# Optimized for production
KURRENTDB_BATCH_SIZE=500
KURRENTDB_RETRY_ATTEMPTS=5
KURRENTDB_TIMEOUT=15000
KURRENTDB_SNAPSHOT_FREQUENCY=100
```

### Monitoring Metrics

- **Events per second**
- **Response time**
- **Error rate**
- **Connection status**
- **Memory usage**

## 🔐 Security

### API Key Management

- Store API keys as secrets in Render
- Rotate keys regularly
- Use different keys for different environments
- Monitor API key usage

### Network Security

- KurrentDB uses HTTPS by default
- All connections are encrypted
- API keys are required for all operations

## 📚 Additional Resources

- [KurrentDB Documentation](https://docs.kurrent.io)
- [Event Sourcing Patterns](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS Guide](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [Render Deployment Guide](https://render.com/docs)

## 🆘 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review service logs in Render dashboard
3. Check KurrentDB dashboard for database status
4. Contact KurrentDB support if needed
