# ✅ Production CI/CD Deployment Checklist

## 📋 Pre-Deployment Preparation

### 1. Code Quality & Testing
- [ ] All unit tests passing
- [ ] Integration tests completed
- [ ] Code review completed
- [ ] No critical security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Documentation updated

### 2. Environment Configuration
- [ ] `.env.production` file configured
- [ ] All required environment variables defined
- [ ] API keys and secrets validated
- [ ] Firebase configuration verified
- [ ] Service URLs updated for production

### 3. GitHub Repository Setup
- [ ] Code pushed to `main` branch
- [ ] All commits properly tagged
- [ ] Branch protection rules enabled
- [ ] Required status checks configured

## 🔐 GitHub Secrets Configuration

Navigate to: **Repository → Settings → Secrets and variables → Actions**

### Required Secrets
- [ ] `RENDER_API_KEY` - Your Render.com API key
- [ ] `FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `FIREBASE_PRIVATE_KEY` - Firebase service account private key
- [ ] `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- [ ] `JWT_SECRET` - Secure JWT signing secret (64+ characters)
- [ ] `GEMINI_API_KEY` - Google Gemini API key
- [ ] `VIRUSTOTAL_API_KEY` - VirusTotal API key
- [ ] `NEWSAPI_API_KEY` - NewsAPI key
- [ ] `REACT_APP_FIREBASE_API_KEY` - Firebase web API key

### Optional Secrets
- [ ] `SCAMADVISER_API_KEY` - ScamAdviser API key
- [ ] `PHISHTANK_API_KEY` - PhishTank API key
- [ ] `CRIMINALIP_API_KEY` - CriminalIP API key
- [ ] `SENTRY_DSN` - Error tracking DSN

## 🚀 Deployment Process

### Step 1: Pre-Deployment Validation
```bash
# Run validation script
npm run validate:production

# Expected output: "READY FOR PRODUCTION DEPLOYMENT!"
```

### Step 2: Trigger Deployment
```bash
# Push to main branch (triggers automatic deployment)
git push origin main
```

### Step 3: Monitor GitHub Actions
1. Go to **Repository → Actions**
2. Watch "Microservices CI/CD" workflow
3. Monitor each job:
   - [ ] `detect-changes` - Detects modified services
   - [ ] `test-and-build` - Runs tests for each service
   - [ ] `test-frontend` - Tests React application
   - [ ] `build-images` - Builds Docker images
   - [ ] `build-frontend-image` - Builds frontend
   - [ ] `deploy-render-production` - Deploys to Render

### Step 4: Deployment Order Verification
Services deploy in this order:
1. [ ] **Auth Service** → `factcheck-auth-production.onrender.com`
2. [ ] **Link Service** → `factcheck-link-production.onrender.com`
3. [ ] **Community Service** → `factcheck-community-production.onrender.com`
4. [ ] **Chat Service** → `factcheck-chat-production.onrender.com`
5. [ ] **News Service** → `factcheck-news-production.onrender.com`
6. [ ] **Admin Service** → `factcheck-admin-production.onrender.com`
7. [ ] **PhishTank Service** → `factcheck-phishtank-production.onrender.com`
8. [ ] **CriminalIP Service** → `factcheck-criminalip-production.onrender.com`
9. [ ] **API Gateway** → `factcheck-api-gateway-production.onrender.com`
10. [ ] **Frontend** → `factcheck-frontend-production.onrender.com`

## 🔍 Post-Deployment Verification

### Step 1: Automated Health Checks
```bash
# Run production health check
npm run health:production

# Expected: All services showing "healthy" status
```

### Step 2: Manual Service Verification
Test each service individually:

```bash
# Backend Services
curl https://factcheck-auth-production.onrender.com/health
curl https://factcheck-link-production.onrender.com/health
curl https://factcheck-community-production.onrender.com/health
curl https://factcheck-chat-production.onrender.com/health
curl https://factcheck-news-production.onrender.com/health
curl https://factcheck-admin-production.onrender.com/health
curl https://factcheck-phishtank-production.onrender.com/health
curl https://factcheck-criminalip-production.onrender.com/health
curl https://factcheck-api-gateway-production.onrender.com/health

# Frontend
curl https://factcheck-frontend-production.onrender.com
```

### Step 3: Functional Testing
- [ ] **Frontend loads correctly**
  - Visit: https://factcheck-frontend-production.onrender.com
  - Check: Page loads without errors
  - Verify: All UI components render properly

- [ ] **User Authentication**
  - Test: User registration
  - Test: User login
  - Test: JWT token validation
  - Test: Protected routes

- [ ] **API Gateway Routing**
  - Test: `/api/auth/*` routes
  - Test: `/api/links/*` routes  
  - Test: `/api/community/*` routes
  - Test: `/api/chat/*` routes
  - Test: `/api/news/*` routes
  - Test: `/api/admin/*` routes

- [ ] **Core Features**
  - Test: Link verification functionality
  - Test: Community posts and voting
  - Test: AI chat responses
  - Test: News aggregation
  - Test: Admin dashboard access

### Step 4: Performance Verification
- [ ] **Response Times**
  - API Gateway: < 500ms
  - Backend Services: < 1000ms
  - Frontend Load: < 3000ms

- [ ] **Error Rates**
  - 5xx errors: < 1%
  - 4xx errors: < 5%
  - Timeout errors: < 0.1%

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Build Failures
**Symptoms**: GitHub Actions build fails
**Solutions**:
- Check Dockerfile syntax
- Verify all dependencies are listed
- Check for missing environment variables
- Review build logs in Actions tab

#### 2. Service Won't Start
**Symptoms**: Service shows "Build succeeded" but health check fails
**Solutions**:
- Check Render service logs
- Verify environment variables are set
- Ensure health endpoint exists
- Check port configuration

#### 3. 503 Service Unavailable
**Symptoms**: API Gateway returns 503 for backend calls
**Solutions**:
- Wait 2-3 minutes for services to start
- Check if services are sleeping (free tier)
- Verify service URLs in API Gateway config
- Restart affected services

#### 4. CORS Errors
**Symptoms**: Frontend can't connect to API
**Solutions**:
- Check `ALLOWED_ORIGINS` in API Gateway
- Verify `REACT_APP_API_URL` in frontend
- Test CORS endpoint: `/test-cors`

#### 5. Authentication Issues
**Symptoms**: Users can't login/register
**Solutions**:
- Verify Firebase configuration
- Check private key format (newlines as `\n`)
- Ensure Firebase project is active
- Test JWT token generation

### Emergency Rollback Procedure
If critical issues are detected:

1. **Immediate Actions**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   ```

2. **Service-Specific Rollback**
   - Go to Render dashboard
   - Select affected service
   - Click "Rollback" to previous deployment

3. **Communication**
   - Notify team of rollback
   - Document issues encountered
   - Plan fix and re-deployment

## 📊 Monitoring & Maintenance

### Continuous Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Monitor performance metrics
- [ ] Set up alerting for critical issues

### Regular Maintenance
- [ ] **Weekly**: Run health checks
- [ ] **Monthly**: Review performance metrics
- [ ] **Quarterly**: Security audit
- [ ] **As needed**: Dependency updates

### Key Metrics to Track
- Service uptime (target: 99.9%)
- Response times (target: <1s)
- Error rates (target: <1%)
- User satisfaction scores
- Security incident count

## 🎯 Success Criteria

Deployment is considered successful when:
- [ ] All services are healthy (100% success rate)
- [ ] Frontend loads without errors
- [ ] All core features are functional
- [ ] Performance targets are met
- [ ] No critical security issues
- [ ] Monitoring is active

## 📞 Support Contacts

**Technical Issues**:
- Check troubleshooting guide above
- Review service logs in Render dashboard
- Check GitHub Actions workflow logs

**Emergency Contacts**:
- DevOps Team: [contact-info]
- Platform Owner: [contact-info]
- On-call Engineer: [contact-info]

---

## 🎉 Deployment Complete!

Once all checklist items are completed:

**🌐 Production URLs**:
- **Frontend**: https://factcheck-frontend-production.onrender.com
- **API Gateway**: https://factcheck-api-gateway-production.onrender.com

**📊 Monitoring Dashboard**: 
- Health Status: https://factcheck-api-gateway-production.onrender.com/info

**📝 Next Steps**:
1. Monitor services for 24 hours
2. Gather user feedback
3. Plan next iteration
4. Update documentation

**Congratulations on your successful production deployment! 🚀**
