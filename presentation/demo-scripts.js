// Demo Scripts cho Hadoop & Spark Presentation
// FactCheck Platform - Big Data Analytics

class HadoopSparkDemo {
    constructor() {
        this.sparkServiceUrl = 'http://localhost:3010';
        this.etlServiceUrl = 'http://localhost:3008';
        this.analyticsServiceUrl = 'http://localhost:3012';
        this.isRunning = false;
    }

    // Demo 1: Spark Job Execution
    async demoSparkJobExecution() {
        console.log('🚀 Starting Spark Job Execution Demo...');
        
        try {
            // Simulate Spark job submission
            const jobConfig = {
                type: 'fake-news-detection',
                params: {
                    articleCount: 100,
                    modelVersion: '1.0.0',
                    confidence: 0.85
                }
            };

            console.log('📝 Submitting job:', jobConfig);
            
            // Simulate job processing
            await this.simulateJobProcessing(jobConfig);
            
            console.log('✅ Spark job completed successfully!');
            return {
                success: true,
                jobId: 'demo-job-' + Date.now(),
                results: {
                    articlesProcessed: 100,
                    fakeNewsDetected: 15,
                    averageConfidence: 0.85,
                    processingTime: '2.1s'
                }
            };
            
        } catch (error) {
            console.error('❌ Spark job failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Demo 2: ETL Pipeline
    async demoETLPipeline() {
        console.log('🔄 Starting ETL Pipeline Demo...');
        
        try {
            // Simulate data extraction from Firestore
            console.log('📤 Extracting data from Firestore...');
            await this.delay(1000);
            
            // Simulate data transformation
            console.log('🔄 Transforming data...');
            await this.delay(1500);
            
            // Simulate data loading to HDFS
            console.log('📥 Loading data to HDFS...');
            await this.delay(2000);
            
            console.log('✅ ETL Pipeline completed!');
            return {
                success: true,
                recordsProcessed: 10000,
                successfulRecords: 9500,
                failedRecords: 500,
                processingTime: '4.5s'
            };
            
        } catch (error) {
            console.error('❌ ETL Pipeline failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Demo 3: Analytics Dashboard
    async demoAnalyticsDashboard() {
        console.log('📊 Starting Analytics Dashboard Demo...');
        
        try {
            // Generate mock analytics data
            const dashboardData = {
                userMetrics: {
                    totalUsers: 1250,
                    activeUsers: 85,
                    newUsers: 23
                },
                contentMetrics: {
                    totalPosts: 3500,
                    verifiedPosts: 2800,
                    fakeNewsDetected: 45
                },
                systemMetrics: {
                    uptime: '99.5%',
                    responseTime: '125ms',
                    errorRate: '0.8%'
                },
                sparkMetrics: {
                    activeJobs: 3,
                    completedJobs: 156,
                    averageProcessingTime: '2.3s',
                    successRate: '96.2%'
                }
            };
            
            console.log('📈 Analytics data generated:', dashboardData);
            
            return {
                success: true,
                data: dashboardData,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Analytics Dashboard failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Demo 4: Real-time Processing
    async demoRealTimeProcessing() {
        console.log('⚡ Starting Real-time Processing Demo...');
        
        try {
            // Simulate real-time event processing
            const events = [
                { type: 'new_post', userId: 'user123', content: 'Sample post content' },
                { type: 'link_analysis', url: 'https://example.com', riskScore: 0.3 },
                { type: 'fake_news_detection', articleId: 'article456', confidence: 0.92 }
            ];
            
            console.log('📡 Processing real-time events...');
            
            for (const event of events) {
                console.log(`🔄 Processing event: ${event.type}`);
                await this.delay(500);
                
                // Simulate ML processing
                const result = await this.processEvent(event);
                console.log(`✅ Event processed:`, result);
            }
            
            console.log('✅ Real-time processing completed!');
            return {
                success: true,
                eventsProcessed: events.length,
                processingTime: '1.5s',
                averageLatency: '500ms'
            };
            
        } catch (error) {
            console.error('❌ Real-time processing failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Demo 5: Hadoop HDFS Operations
    async demoHDFSOperations() {
        console.log('🐘 Starting HDFS Operations Demo...');
        
        try {
            // Simulate HDFS operations
            const operations = [
                { type: 'mkdir', path: '/factcheck/data/raw' },
                { type: 'put', source: 'local_data.json', target: '/factcheck/data/raw/' },
                { type: 'ls', path: '/factcheck/data/' },
                { type: 'get', source: '/factcheck/data/processed/', target: 'local_results/' }
            ];
            
            console.log('📁 Performing HDFS operations...');
            
            for (const op of operations) {
                console.log(`🔄 ${op.type.toUpperCase()}: ${op.path || op.source}`);
                await this.delay(800);
            }
            
            console.log('✅ HDFS operations completed!');
            return {
                success: true,
                operationsCompleted: operations.length,
                totalDataSize: '2.5GB',
                replicationFactor: 3
            };
            
        } catch (error) {
            console.error('❌ HDFS operations failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Demo 6: Machine Learning Pipeline
    async demoMLPipeline() {
        console.log('🤖 Starting ML Pipeline Demo...');
        
        try {
            const mlSteps = [
                { step: 'Data Preprocessing', duration: 1000 },
                { step: 'Feature Extraction', duration: 1500 },
                { step: 'Model Training', duration: 3000 },
                { step: 'Model Evaluation', duration: 1000 },
                { step: 'Model Deployment', duration: 800 }
            ];
            
            console.log('🧠 Running ML Pipeline...');
            
            for (const mlStep of mlSteps) {
                console.log(`🔄 ${mlStep.step}...`);
                await this.delay(mlStep.duration);
            }
            
            const modelMetrics = {
                accuracy: 0.87,
                precision: 0.85,
                recall: 0.89,
                f1Score: 0.87,
                trainingTime: '7.3s'
            };
            
            console.log('✅ ML Pipeline completed!', modelMetrics);
            
            return {
                success: true,
                modelMetrics,
                modelVersion: 'v1.2.0',
                deploymentStatus: 'active'
            };
            
        } catch (error) {
            console.error('❌ ML Pipeline failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Demo 7: Performance Monitoring
    async demoPerformanceMonitoring() {
        console.log('📊 Starting Performance Monitoring Demo...');
        
        try {
            // Simulate performance metrics collection
            const metrics = {
                spark: {
                    executorMemory: '2GB',
                    executorCores: 2,
                    activeExecutors: 4,
                    jobsRunning: 2,
                    jobsCompleted: 45
                },
                hadoop: {
                    hdfsUsed: '1.2TB',
                    hdfsCapacity: '5TB',
                    datanodes: 3,
                    namenodeStatus: 'healthy'
                },
                system: {
                    cpuUsage: '65%',
                    memoryUsage: '78%',
                    diskUsage: '45%',
                    networkIO: '125MB/s'
                }
            };
            
            console.log('📈 Collecting performance metrics...');
            await this.delay(1000);
            
            console.log('✅ Performance monitoring active!', metrics);
            
            return {
                success: true,
                metrics,
                alertThresholds: {
                    cpu: 80,
                    memory: 85,
                    disk: 90
                }
            };
            
        } catch (error) {
            console.error('❌ Performance monitoring failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Demo 8: Complete Workflow
    async demoCompleteWorkflow() {
        console.log('🎯 Starting Complete Workflow Demo...');
        
        try {
            const workflowSteps = [
                { name: 'Data Ingestion', demo: () => this.demoETLPipeline() },
                { name: 'Data Processing', demo: () => this.demoSparkJobExecution() },
                { name: 'ML Analysis', demo: () => this.demoMLPipeline() },
                { name: 'Real-time Scoring', demo: () => this.demoRealTimeProcessing() },
                { name: 'Analytics Dashboard', demo: () => this.demoAnalyticsDashboard() }
            ];
            
            const results = [];
            
            for (const step of workflowSteps) {
                console.log(`🔄 Step: ${step.name}`);
                const result = await step.demo();
                results.push({ step: step.name, result });
                await this.delay(1000);
            }
            
            console.log('✅ Complete workflow finished!');
            
            return {
                success: true,
                workflowSteps: results,
                totalProcessingTime: '15.2s',
                overallSuccess: true
            };
            
        } catch (error) {
            console.error('❌ Complete workflow failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Utility methods
    async simulateJobProcessing(jobConfig) {
        console.log('🔄 Simulating job processing...');
        
        // Simulate different processing stages
        const stages = [
            { stage: 'Initializing', duration: 500 },
            { stage: 'Loading Data', duration: 800 },
            { stage: 'Processing', duration: 1200 },
            { stage: 'Saving Results', duration: 400 }
        ];
        
        for (const stage of stages) {
            console.log(`  📋 ${stage.stage}...`);
            await this.delay(stage.duration);
        }
    }

    async processEvent(event) {
        // Simulate event processing logic
        const processingResults = {
            'new_post': { action: 'content_analysis', risk: 'low' },
            'link_analysis': { action: 'security_scan', risk: event.riskScore > 0.5 ? 'high' : 'low' },
            'fake_news_detection': { action: 'ml_classification', confidence: event.confidence }
        };
        
        return processingResults[event.type] || { action: 'unknown', risk: 'unknown' };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Start demo server
    startDemoServer() {
        console.log('🚀 Starting Hadoop & Spark Demo Server...');
        this.isRunning = true;
        
        // Simulate server startup
        setTimeout(() => {
            console.log('✅ Demo server is running on http://localhost:3020/demo');
            console.log('📊 Spark UI: http://localhost:8080');
            console.log('📊 Spark History: http://localhost:8088');
            console.log('🐘 HDFS UI: http://localhost:9870');
            console.log('📓 Jupyter: http://localhost:8888');
        }, 2000);
    }

    // Stop demo server
    stopDemoServer() {
        console.log('🛑 Stopping Demo Server...');
        this.isRunning = false;
        console.log('✅ Demo server stopped');
    }
}

// Export for use in presentation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HadoopSparkDemo;
} else {
    // Browser environment
    window.HadoopSparkDemo = HadoopSparkDemo;
}

// Auto-start demo if running in browser
if (typeof window !== 'undefined') {
    const demo = new HadoopSparkDemo();
    demo.startDemoServer();
    
    // Make demo available globally
    window.demo = demo;
    
    console.log('🎮 Hadoop & Spark Demo loaded!');
    console.log('Available demos:');
    console.log('- demo.demoSparkJobExecution()');
    console.log('- demo.demoETLPipeline()');
    console.log('- demo.demoAnalyticsDashboard()');
    console.log('- demo.demoRealTimeProcessing()');
    console.log('- demo.demoHDFSOperations()');
    console.log('- demo.demoMLPipeline()');
    console.log('- demo.demoPerformanceMonitoring()');
    console.log('- demo.demoCompleteWorkflow()');
} 