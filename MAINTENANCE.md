# 🔧 System Maintenance Procedures

## 📅 Maintenance Schedule

### Daily Tasks (Automated)
- **Health Checks**: All services status verification
- **Log Rotation**: Archive and compress old logs
- **Backup Verification**: Ensure database backups completed
- **Security Scans**: Automated vulnerability checks
- **Performance Monitoring**: Resource usage tracking

### Weekly Tasks
- **Security Audit**: Run comprehensive security scan
- **Performance Review**: Analyze response times and bottlenecks
- **Dependency Updates**: Check for security updates
- **Database Optimization**: Review slow queries
- **Cache Analysis**: Review cache hit rates and optimization

### Monthly Tasks
- **Full System Audit**: Complete security and performance review
- **Capacity Planning**: Resource usage analysis and forecasting
- **Disaster Recovery Test**: Backup restoration testing
- **Documentation Review**: Update procedures and documentation
- **User Feedback Analysis**: Review support tickets and user reports

### Quarterly Tasks
- **Penetration Testing**: External security assessment
- **Architecture Review**: System design optimization
- **Dependency Audit**: Major version updates and migrations
- **Performance Benchmarking**: Load testing and optimization
- **Business Continuity Planning**: Update disaster recovery procedures

## 🔄 Routine Maintenance Procedures

### 1. Service Health Monitoring

#### Daily Health Check Script
```bash
#!/bin/bash
# daily-health-check.sh

echo "🏥 Daily Health Check - $(date)"
echo "================================"

# Check all services
services=("api-gateway" "auth-service" "community-service" "link-service" "chat-service" "news-service" "admin-service")

for service in "${services[@]}"; do
    echo "Checking $service..."
    
    if curl -f -s "http://localhost:8080/api/${service}/health" > /dev/null; then
        echo "✅ $service is healthy"
    else
        echo "❌ $service is unhealthy"
        # Send alert
        ./scripts/send-alert.sh "$service is down"
    fi
done

# Check database connectivity
echo "Checking database connectivity..."
if node scripts/check-db-connection.js; then
    echo "✅ Database is accessible"
else
    echo "❌ Database connection failed"
    ./scripts/send-alert.sh "Database connection failed"
fi

# Check cache service
echo "Checking Redis cache..."
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is responding"
else
    echo "❌ Redis is not responding"
    ./scripts/send-alert.sh "Redis cache is down"
fi

echo "Health check completed at $(date)"
```

#### Service Restart Procedure
```bash
#!/bin/bash
# restart-service.sh

SERVICE_NAME=$1

if [ -z "$SERVICE_NAME" ]; then
    echo "Usage: $0 <service-name>"
    exit 1
fi

echo "🔄 Restarting $SERVICE_NAME..."

# Graceful shutdown
echo "Sending SIGTERM to $SERVICE_NAME..."
pkill -TERM -f "$SERVICE_NAME"

# Wait for graceful shutdown
sleep 10

# Force kill if still running
if pgrep -f "$SERVICE_NAME" > /dev/null; then
    echo "Force killing $SERVICE_NAME..."
    pkill -KILL -f "$SERVICE_NAME"
fi

# Start service
echo "Starting $SERVICE_NAME..."
cd "services/$SERVICE_NAME"
npm start &

# Verify startup
sleep 5
if curl -f -s "http://localhost:8080/api/$SERVICE_NAME/health" > /dev/null; then
    echo "✅ $SERVICE_NAME restarted successfully"
else
    echo "❌ $SERVICE_NAME failed to start"
    exit 1
fi
```

### 2. Database Maintenance

#### Database Backup Procedure
```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

echo "📦 Starting database backup..."

# Export Firestore data
gcloud firestore export "gs://your-backup-bucket/firestore-backups/$(date +%Y%m%d_%H%M%S)" \
    --project="your-project-id"

# Backup Redis data
redis-cli --rdb "$BACKUP_DIR/redis-dump.rdb"

# Compress backups
tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d_%H%M%S).tar.gz" "$BACKUP_DIR"

echo "✅ Database backup completed"
```

#### Database Optimization
```bash
#!/bin/bash
# optimize-database.sh

echo "🔧 Database optimization started..."

# Analyze Firestore usage
node scripts/analyze-firestore-usage.js

# Check for missing indexes
node scripts/check-missing-indexes.js

# Clean up old data (older than 1 year)
node scripts/cleanup-old-data.js

# Optimize Redis memory
redis-cli MEMORY PURGE

echo "✅ Database optimization completed"
```

### 3. Security Maintenance

#### Security Scan Procedure
```bash
#!/bin/bash
# security-scan.sh

echo "🔒 Security scan started..."

# Run dependency audit
echo "Checking for vulnerable dependencies..."
npm audit --audit-level=moderate

# Check for exposed secrets
echo "Scanning for exposed secrets..."
git secrets --scan

# Validate SSL certificates
echo "Checking SSL certificates..."
./scripts/check-ssl-certs.sh

# Run custom security audit
echo "Running custom security audit..."
./scripts/audit-security.sh

echo "✅ Security scan completed"
```

#### Certificate Renewal
```bash
#!/bin/bash
# renew-certificates.sh

echo "🔐 Certificate renewal started..."

# Check certificate expiration
CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/ssl/certs/domain.crt | cut -d= -f2)
EXPIRY_DATE=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_DATE=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (EXPIRY_DATE - CURRENT_DATE) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "Certificate expires in $DAYS_UNTIL_EXPIRY days, renewing..."
    
    # Renew certificate (example with Let's Encrypt)
    certbot renew --quiet
    
    # Restart services to use new certificate
    systemctl reload nginx
    
    echo "✅ Certificate renewed successfully"
else
    echo "Certificate is valid for $DAYS_UNTIL_EXPIRY more days"
fi
```

### 4. Performance Maintenance

#### Performance Analysis
```bash
#!/bin/bash
# performance-analysis.sh

echo "📊 Performance analysis started..."

# Analyze response times
echo "Analyzing response times..."
node scripts/analyze-response-times.js

# Check memory usage
echo "Checking memory usage..."
free -h
ps aux --sort=-%mem | head -10

# Check disk usage
echo "Checking disk usage..."
df -h

# Analyze slow queries
echo "Analyzing slow queries..."
node scripts/analyze-slow-queries.js

# Generate performance report
node scripts/generate-performance-report.js

echo "✅ Performance analysis completed"
```

#### Cache Maintenance
```bash
#!/bin/bash
# cache-maintenance.sh

echo "🗄️ Cache maintenance started..."

# Check Redis memory usage
REDIS_MEMORY=$(redis-cli INFO memory | grep used_memory_human | cut -d: -f2)
echo "Redis memory usage: $REDIS_MEMORY"

# Clear expired keys
redis-cli --scan --pattern "*" | xargs -L 1000 redis-cli DEL

# Optimize Redis configuration
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Warm up cache with frequently accessed data
node scripts/warm-cache.js

echo "✅ Cache maintenance completed"
```

## 🚨 Emergency Procedures

### Service Outage Response
1. **Immediate Assessment**
   - Check service health endpoints
   - Review recent deployments
   - Check system resources

2. **Containment**
   - Isolate affected services
   - Redirect traffic if possible
   - Enable maintenance mode

3. **Recovery**
   - Restart failed services
   - Rollback recent changes if needed
   - Verify system functionality

4. **Communication**
   - Notify stakeholders
   - Update status page
   - Document incident

### Database Emergency Recovery
```bash
#!/bin/bash
# emergency-db-recovery.sh

echo "🚨 Emergency database recovery started..."

# Stop all services
./scripts/stop-all-services.sh

# Restore from latest backup
LATEST_BACKUP=$(ls -t /backups/ | head -1)
echo "Restoring from backup: $LATEST_BACKUP"

# Restore Firestore
gcloud firestore import "gs://your-backup-bucket/firestore-backups/$LATEST_BACKUP" \
    --project="your-project-id"

# Restore Redis
redis-cli FLUSHALL
redis-cli --rdb "/backups/$LATEST_BACKUP/redis-dump.rdb"

# Start services
./scripts/start-all-services.sh

# Verify recovery
./scripts/verify-system-health.sh

echo "✅ Emergency recovery completed"
```

## 📋 Maintenance Checklists

### Pre-Maintenance Checklist
- [ ] Backup all critical data
- [ ] Notify users of planned maintenance
- [ ] Prepare rollback procedures
- [ ] Test maintenance procedures in staging
- [ ] Ensure emergency contacts are available

### During Maintenance Checklist
- [ ] Monitor system health continuously
- [ ] Document all changes made
- [ ] Test functionality after each change
- [ ] Keep stakeholders informed of progress
- [ ] Be prepared to rollback if issues arise

### Post-Maintenance Checklist
- [ ] Verify all services are operational
- [ ] Run comprehensive health checks
- [ ] Monitor for any performance degradation
- [ ] Update documentation with changes
- [ ] Conduct post-maintenance review

### Monthly Maintenance Checklist
- [ ] Review and update security policies
- [ ] Analyze performance trends
- [ ] Update disaster recovery procedures
- [ ] Review and rotate API keys
- [ ] Update system documentation
- [ ] Plan capacity upgrades if needed
- [ ] Review and update monitoring alerts
- [ ] Conduct security training for team

## 📞 Emergency Contacts

### Technical Team
- **DevOps Lead**: devops-lead@company.com
- **Security Team**: security@company.com
- **Database Admin**: dba@company.com
- **Network Admin**: network@company.com

### Business Contacts
- **Product Manager**: product@company.com
- **Customer Support**: support@company.com
- **Management**: management@company.com

### External Vendors
- **Cloud Provider**: support@cloudprovider.com
- **CDN Provider**: support@cdnprovider.com
- **Security Vendor**: support@securityvendor.com

## 📊 Maintenance Metrics

### Key Metrics to Track
- **System Uptime**: Target 99.9%
- **Mean Time to Recovery (MTTR)**: Target < 30 minutes
- **Mean Time Between Failures (MTBF)**: Target > 720 hours
- **Planned Maintenance Windows**: < 4 hours monthly
- **Security Patch Time**: < 24 hours for critical patches

### Reporting
- **Daily**: Automated health reports
- **Weekly**: Performance and security summaries
- **Monthly**: Comprehensive maintenance reports
- **Quarterly**: Trend analysis and capacity planning
