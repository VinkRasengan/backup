# Docker Migration Checklist

## 📋 Pre-Migration Checklist

- [ ] All Dockerfile.render files exist and are optimized
- [ ] Environment variables documented for each service
- [ ] Current service URLs and configurations backed up
- [ ] render-docker.yaml configuration reviewed

## 🚀 Migration Steps

### Phase 1: Failed Services (Priority)

#### CriminalIP Service
- [ ] Create new Docker service: `criminalip-service-docker`
- [ ] Configure Dockerfile path: `./services/criminalip-service/Dockerfile.render`
- [ ] Set environment variables
- [ ] Deploy and test: `curl https://criminalip-service-docker.onrender.com/health`
- [ ] Delete old service after success

#### PhishTank Service  
- [ ] Create new Docker service: `phishtank-service-docker`
- [ ] Configure Dockerfile path: `./services/phishtank-service/Dockerfile.render`
- [ ] Set environment variables
- [ ] Deploy and test: `curl https://phishtank-service-docker.onrender.com/health`
- [ ] Delete old service after success

#### Link Service
- [ ] Create new Docker service: `link-service-docker`
- [ ] Configure Dockerfile path: `./services/link-service/Dockerfile.render`
- [ ] Set environment variables (VIRUSTOTAL_API_KEY, etc.)
- [ ] Deploy and test: `curl https://link-service-docker.onrender.com/health`
- [ ] Delete old service after success

#### API Gateway
- [ ] Create new Docker service: `api-gateway-docker`
- [ ] Configure Dockerfile path: `./services/api-gateway/Dockerfile.render`
- [ ] Update service URLs to point to Docker services
- [ ] Set environment variables
- [ ] Deploy and test: `curl https://api-gateway-docker.onrender.com/health`
- [ ] Delete old service after success

### Phase 2: Working Services (Optional)

#### Auth Service
- [ ] Create new Docker service: `auth-service-docker`
- [ ] Migrate configuration
- [ ] Test and switch traffic

#### Chat Service
- [ ] Create new Docker service: `chat-service-docker`
- [ ] Migrate configuration
- [ ] Test and switch traffic

#### Community Service
- [ ] Create new Docker service: `community-service-docker`
- [ ] Migrate configuration
- [ ] Test and switch traffic

#### Admin Service
- [ ] Create new Docker service: `admin-service-docker`
- [ ] Migrate configuration
- [ ] Test and switch traffic

#### News Service
- [ ] Create new Docker service: `news-service-docker`
- [ ] Migrate configuration
- [ ] Test and switch traffic

## 🧪 Post-Migration Testing

- [ ] All health endpoints responding
- [ ] API Gateway routing working
- [ ] Frontend connecting to new API Gateway
- [ ] All external API integrations working
- [ ] Performance monitoring shows improvements

## 🔄 Final Steps

- [ ] Update DNS/domain configurations if needed
- [ ] Update CI/CD pipeline to use Docker deployment
- [ ] Update documentation with new service URLs
- [ ] Monitor services for 24-48 hours
- [ ] Clean up old failed services

## 📊 Success Metrics

- [ ] Build times reduced to 5-8 minutes
- [ ] Zero build failures
- [ ] All services healthy and responding
- [ ] Consistent deployment process across all services
