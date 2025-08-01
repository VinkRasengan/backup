# 🚀 Hadoop & Spark Demo - FactCheck Platform

Demo và thuyết trình về tích hợp Hadoop và Spark trong FactCheck Platform cho Big Data Analytics và Machine Learning.

## 📋 Nội dung

### 🎯 Slide Thuyết trình
- **8 slides** chi tiết về kiến trúc và implementation
- **Interactive demo** với real-time updates
- **Responsive design** cho mọi thiết bị
- **Navigation** bằng keyboard và mouse

### 🎮 Demo Features
- **Spark Job Execution** - ML pipeline simulation
- **ETL Pipeline** - Data processing workflow
- **Analytics Dashboard** - Real-time metrics
- **Real-time Processing** - Event streaming
- **HDFS Operations** - File system management
- **ML Pipeline** - Model training & deployment
- **Performance Monitoring** - System metrics
- **Complete Workflow** - End-to-end demo

## 🚀 Quick Start

### 1. Cài đặt Dependencies
```bash
cd presentation
npm install
```

### 2. Chạy Demo Server
```bash
npm start
```

### 3. Mở Presentation
- **Presentation**: http://localhost:3020/demo
- **API Base**: http://localhost:3020/api
- **Health Check**: http://localhost:3020/health

## 📊 Slide Structure

### Slide 1: Title
- Giới thiệu chủ đề
- Overview của platform

### Slide 2: Architecture Overview
- Microservices architecture
- Big Data layer components
- Use cases chính

### Slide 3: Infrastructure
- Hadoop Cluster setup
- Spark Cluster configuration
- Development tools

### Slide 4: Data Flow
- Batch processing flow
- Real-time processing flow
- Feedback loop

### Slide 5: Use Cases
- Fake News Detection
- Link Analysis
- Community Analytics

### Slide 6: Implementation Phases
- Phase 1-4 breakdown
- Timeline và milestones

### Slide 7: Live Demo
- Interactive demo buttons
- Real-time dashboard
- Job execution simulation

### Slide 8: Benefits & Conclusion
- Business benefits
- Technical benefits
- Success metrics
- Next steps

## 🎮 Demo API Endpoints

### Spark Jobs
```bash
# Fake News Detection
curl -X POST http://localhost:3020/api/demo/spark-job

# ETL Pipeline
curl -X POST http://localhost:3020/api/demo/etl-pipeline

# ML Pipeline
curl -X POST http://localhost:3020/api/demo/ml-pipeline
```

### Data Pipeline
```bash
# ETL Pipeline
curl -X POST http://localhost:3020/api/demo/etl-pipeline

# HDFS Operations
curl -X POST http://localhost:3020/api/demo/hdfs-operations

# Real-time Processing
curl -X POST http://localhost:3020/api/demo/real-time-processing
```

### Analytics & Monitoring
```bash
# Analytics Dashboard
curl -X POST http://localhost:3020/api/demo/analytics-dashboard

# Performance Monitoring
curl -X POST http://localhost:3020/api/demo/performance-monitoring
```

### Complete Workflow
```bash
# End-to-end workflow
curl -X POST http://localhost:3020/api/demo/complete-workflow
```

### Real-time Updates
```bash
# Server-Sent Events stream
curl -N http://localhost:3020/api/stream
```

## 🎯 Demo Scenarios

### Scenario 1: Fake News Detection
1. **Data Ingestion**: Extract articles from Firestore
2. **Text Processing**: Preprocess and extract features
3. **ML Classification**: Run fake news detection model
4. **Results**: Return confidence scores and classifications

### Scenario 2: Link Analysis
1. **URL Collection**: Gather historical link data
2. **Pattern Mining**: Analyze URL patterns and domains
3. **Risk Assessment**: Calculate risk scores
4. **Blacklist Update**: Update security blacklists

### Scenario 3: Community Analytics
1. **User Data**: Collect posts, votes, comments
2. **Behavior Analysis**: Cluster users and detect patterns
3. **Spam Detection**: Identify suspicious activities
4. **Moderation**: Generate moderation recommendations

## 🛠️ Development

### File Structure
```
presentation/
├── hadoop-spark-presentation.html  # Main presentation
├── demo-scripts.js                 # Demo logic
├── demo-server.js                  # Express server
├── package.json                    # Dependencies
└── README.md                       # This file
```

### Customization
- **Colors**: Edit CSS variables in presentation HTML
- **Content**: Modify slide content in HTML
- **Demos**: Add new demos in demo-scripts.js
- **API**: Extend endpoints in demo-server.js

### Adding New Demos
1. Add demo method to `HadoopSparkDemo` class
2. Add API endpoint in `DemoServer`
3. Add demo button in presentation HTML
4. Update documentation

## 📈 Performance Metrics

### Expected Results
- **Job Success Rate**: > 95%
- **Processing Latency**: < 30 minutes
- **System Availability**: > 99.5%
- **Detection Accuracy**: > 85%

### Monitoring
- Real-time job status
- Processing times
- Error rates
- Resource utilization

## 🔧 Configuration

### Environment Variables
```bash
DEMO_PORT=3020              # Demo server port
SPARK_SERVICE_URL=3010      # Spark service port
ETL_SERVICE_URL=3008        # ETL service port
ANALYTICS_SERVICE_URL=3012  # Analytics service port
```

### Docker Integration
```bash
# Start Hadoop/Spark cluster
docker-compose -f ../docker-compose.bigdata.yml up -d

# Start demo server
npm start
```

## 🎓 Presentation Tips

### Before Presentation
1. **Test all demos** before presenting
2. **Prepare backup** for live demos
3. **Check network** connectivity
4. **Practice timing** for each slide

### During Presentation
1. **Start with overview** slide
2. **Use keyboard navigation** (arrow keys)
3. **Run live demos** on slide 7
4. **Engage audience** with interactive elements

### After Presentation
1. **Share demo links** with audience
2. **Provide documentation** for follow-up
3. **Collect feedback** for improvements

## 🚨 Troubleshooting

### Common Issues
- **Port conflicts**: Change DEMO_PORT environment variable
- **CORS errors**: Check browser console for details
- **Demo not working**: Verify all services are running
- **Presentation not loading**: Check file paths

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start

# Check server logs
tail -f logs/demo-server.log
```

## 📚 Resources

### Documentation
- [Hadoop Documentation](https://hadoop.apache.org/docs/)
- [Spark Documentation](https://spark.apache.org/docs/)
- [FactCheck Platform Docs](../docs/)

### Related Services
- **Frontend**: http://localhost:3000
- **Spark Service**: http://localhost:3010  
- **ETL Service**: http://localhost:3008
- **Analytics Service**: http://localhost:3012
- **Demo Server**: http://localhost:3020
- **Spark Master UI**: http://localhost:8080
- **Spark History Server**: http://localhost:8088
- **HDFS NameNode UI**: http://localhost:9870

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add new demos or improvements
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Happy Presenting! 🎉** 