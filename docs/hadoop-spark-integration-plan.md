# Hadoop/Spark Integration Plan for FactCheck Platform

## 🎯 Tổng quan

Tích hợp Hadoop/Spark vào FactCheck Platform để xử lý big data analytics, machine learning, và batch processing cho fact-checking tự động.

## 🏗️ Kiến trúc Tích hợp

### Current Architecture (Real-time)
- ✅ 7 Microservices với Event-Driven Architecture
- ✅ Firestore cho real-time data
- ✅ Redis/RabbitMQ cho event streaming
- ✅ Event Sourcing đã implement

### New Big Data Layer
```
services/
├── spark-service/           # Port 3010 - Spark job management
├── etl-service/            # Port 3011 - Data pipeline
├── analytics-service/      # Port 3012 - Analytics API
└── scheduler-service/      # Port 3013 - Job scheduling
```

## 📊 Use Cases cho Hadoop/Spark

### 1. **Fake News Detection**
```javascript
// Spark ML Pipeline
const fakeNewsDetection = {
  input: "news articles from News Service",
  processing: [
    "Text preprocessing",
    "Feature extraction (TF-IDF, Word2Vec)",
    "ML models (Random Forest, SVM)",
    "Sentiment analysis"
  ],
  output: "Credibility score + classification"
};
```

### 2. **Link Pattern Analysis**
```javascript
// Batch analysis của link patterns
const linkAnalysis = {
  input: "Historical link data from Link Service",
  processing: [
    "URL pattern mining",
    "Domain reputation analysis", 
    "Phishing pattern detection",
    "Network analysis"
  ],
  output: "Risk patterns + blacklist updates"
};
```

### 3. **Community Behavior Analytics**
```javascript
// User behavior analysis
const communityAnalytics = {
  input: "Posts, votes, comments from Community Service",
  processing: [
    "User clustering",
    "Influence analysis",
    "Spam detection",
    "Trend analysis"
  ],
  output: "User insights + moderation recommendations"
};
```

## 🔧 Technical Implementation

### Environment Variables (.env additions)
```env
# =============================================================================
# BIG DATA SERVICES
# =============================================================================
SPARK_SERVICE_PORT=3010
ETL_SERVICE_PORT=3011
ANALYTICS_SERVICE_PORT=3012
SCHEDULER_SERVICE_PORT=3013

SPARK_SERVICE_URL=http://localhost:3010
ETL_SERVICE_URL=http://localhost:3011
ANALYTICS_SERVICE_URL=http://localhost:3012
SCHEDULER_SERVICE_URL=http://localhost:3013

# =============================================================================
# HADOOP/SPARK CONFIGURATION
# =============================================================================
SPARK_MASTER_URL=spark://localhost:7077
HADOOP_HOME=/opt/hadoop
SPARK_HOME=/opt/spark
HDFS_NAMENODE_URL=hdfs://localhost:9000

# Data Storage
HDFS_DATA_PATH=/factcheck/data
SPARK_WAREHOUSE_DIR=/factcheck/warehouse

# Processing Configuration
SPARK_EXECUTOR_MEMORY=2g
SPARK_DRIVER_MEMORY=1g
SPARK_EXECUTOR_CORES=2
BATCH_PROCESSING_INTERVAL=1h
```

### Service Structure
```
services/spark-service/
├── src/
│   ├── jobs/              # Spark job definitions
│   │   ├── fakeNewsDetection.js
│   │   ├── linkAnalysis.js
│   │   └── communityAnalytics.js
│   ├── ml/                # ML models
│   │   ├── textClassifier.py
│   │   ├── linkScorer.py
│   │   └── userClustering.py
│   ├── api/               # REST API
│   │   ├── jobs.js
│   │   ├── results.js
│   │   └── health.js
│   └── config/
│       ├── spark.js
│       └── hadoop.js
├── python/                # Python Spark jobs
├── scala/                 # Scala Spark jobs (optional)
└── docker/
    ├── Dockerfile
    └── docker-compose.spark.yml
```

## 🚀 Implementation Phases

### Phase 1: Infrastructure Setup (Week 1-2)
1. **Docker containers** cho Hadoop/Spark
2. **Spark Service** cơ bản (Port 3010)
3. **ETL Service** cho data export từ Firestore
4. **Basic job scheduling**

### Phase 2: Data Pipeline (Week 3-4)
1. **Firestore → HDFS** data pipeline
2. **Event streaming** từ EventBus → Spark Streaming
3. **Batch processing** jobs
4. **Data validation** và quality checks

### Phase 3: ML & Analytics (Week 5-6)
1. **Fake news detection** model
2. **Link analysis** algorithms
3. **Community analytics** dashboard
4. **Real-time scoring** integration

### Phase 4: Integration (Week 7-8)
1. **API integration** với existing services
2. **Results feedback** vào Firestore
3. **Performance optimization**
4. **Monitoring** và alerting

## 📈 Data Flow

### Batch Processing Flow
```
Firestore → ETL Service → HDFS → Spark Jobs → Results → Analytics Service → API Gateway
```

### Real-time Processing Flow  
```
EventBus → Spark Streaming → ML Models → Real-time Scores → Services
```

### Feedback Loop
```
Analytics Results → Firestore → Services → Improved Decisions
```

## 🔍 Monitoring & Observability

### Metrics to Track
- **Job execution times**
- **Data processing volumes**
- **ML model accuracy**
- **Resource utilization**
- **Error rates**

### Integration với existing monitoring
- **Prometheus** metrics từ Spark services
- **Grafana** dashboards cho big data metrics
- **Event-driven** alerts qua EventBus

## 💡 Benefits

### For FactCheck Platform
1. **Automated fact-checking** với ML models
2. **Pattern detection** cho phishing/scam links
3. **User behavior insights** cho community moderation
4. **Scalable processing** cho large datasets
5. **Historical analysis** và trend detection

### Technical Benefits
1. **Separation of concerns** - Real-time vs Batch processing
2. **Scalability** - Handle growing data volumes
3. **Flexibility** - Easy to add new analytics
4. **Cost efficiency** - Batch processing cho heavy computations

## 🚨 Considerations

### Challenges
1. **Complexity** - Additional infrastructure
2. **Data consistency** - Firestore ↔ HDFS sync
3. **Resource usage** - Memory/CPU intensive
4. **Development overhead** - Multiple languages (JS/Python/Scala)

### Mitigation Strategies
1. **Start small** - Implement core use cases first
2. **Gradual migration** - Keep existing services unchanged
3. **Fallback mechanisms** - Handle Spark failures gracefully
4. **Resource limits** - Configure appropriate limits

## 🎯 Success Metrics

### Technical KPIs
- **Job success rate** > 95%
- **Processing latency** < 30 minutes for batch jobs
- **Data freshness** < 1 hour lag
- **System availability** > 99.5%

### Business KPIs  
- **Fake news detection accuracy** > 85%
- **False positive rate** < 10%
- **Processing cost** reduction vs manual review
- **User satisfaction** with automated recommendations
