const express = require('express');
const cors = require('cors');
const path = require('path');
const { HadoopSparkDemo } = require('./demo-scripts');

class DemoServer {
    constructor() {
        this.app = express();
        this.port = process.env.DEMO_PORT || 3000;
        this.demo = new HadoopSparkDemo();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // CORS for cross-origin requests
        this.app.use(cors());
        
        // JSON parsing
        this.app.use(express.json());
        
        // Static files
        this.app.use(express.static(path.join(__dirname)));
        
        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Hadoop & Spark Demo Server',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Demo routes
        this.app.get('/demo', (req, res) => {
            res.sendFile(path.join(__dirname, 'hadoop-spark-presentation.html'));
        });

        // API routes for demos
        this.app.post('/api/demo/spark-job', async (req, res) => {
            try {
                const result = await this.demo.demoSparkJobExecution();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/etl-pipeline', async (req, res) => {
            try {
                const result = await this.demo.demoETLPipeline();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/analytics-dashboard', async (req, res) => {
            try {
                const result = await this.demo.demoAnalyticsDashboard();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/real-time-processing', async (req, res) => {
            try {
                const result = await this.demo.demoRealTimeProcessing();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/hdfs-operations', async (req, res) => {
            try {
                const result = await this.demo.demoHDFSOperations();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/ml-pipeline', async (req, res) => {
            try {
                const result = await this.demo.demoMLPipeline();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/performance-monitoring', async (req, res) => {
            try {
                const result = await this.demo.demoPerformanceMonitoring();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/complete-workflow', async (req, res) => {
            try {
                const result = await this.demo.demoCompleteWorkflow();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Status endpoints
        this.app.get('/api/status', (req, res) => {
            res.json({
                server: 'running',
                demo: this.demo.isRunning ? 'active' : 'inactive',
                services: {
                    spark: 'http://localhost:3010',
                    etl: 'http://localhost:3011',
                    analytics: 'http://localhost:3012',
                    sparkUI: 'http://localhost:8088',
                    hdfsUI: 'http://localhost:9870',
                    jupyter: 'http://localhost:8888'
                }
            });
        });

        // WebSocket-like real-time updates
        this.app.get('/api/stream', (req, res) => {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            const sendEvent = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            // Send periodic updates
            const interval = setInterval(() => {
                sendEvent({
                    type: 'status_update',
                    timestamp: new Date().toISOString(),
                    metrics: {
                        activeJobs: Math.floor(Math.random() * 5),
                        completedJobs: Math.floor(Math.random() * 100),
                        processingTime: (Math.random() * 5 + 1).toFixed(1) + 's'
                    }
                });
            }, 2000);

            req.on('close', () => {
                clearInterval(interval);
            });
        });

        // Error handling
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({
                error: 'Internal Server Error',
                message: err.message
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.path} not found`
            });
        });
    }

    start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log('🚀 Hadoop & Spark Demo Server started!');
                console.log(`📊 Presentation: http://localhost:${this.port}/demo`);
                console.log(`🔧 API Base: http://localhost:${this.port}/api`);
                console.log(`💚 Health Check: http://localhost:${this.port}/health`);
                console.log('');
                console.log('🎮 Available Demo Endpoints:');
                console.log(`  POST /api/demo/spark-job`);
                console.log(`  POST /api/demo/etl-pipeline`);
                console.log(`  POST /api/demo/analytics-dashboard`);
                console.log(`  POST /api/demo/real-time-processing`);
                console.log(`  POST /api/demo/hdfs-operations`);
                console.log(`  POST /api/demo/ml-pipeline`);
                console.log(`  POST /api/demo/performance-monitoring`);
                console.log(`  POST /api/demo/complete-workflow`);
                console.log('');
                console.log('📡 Real-time Updates: GET /api/stream');
                console.log('📈 Status: GET /api/status');
                console.log('');
                
                this.demo.startDemoServer();
                resolve();
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('🛑 Demo Server stopped');
                    this.demo.stopDemoServer();
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// CLI interface
if (require.main === module) {
    const server = new DemoServer();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down demo server...');
        await server.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down demo server...');
        await server.stop();
        process.exit(0);
    });

    // Start server
    server.start().catch(console.error);
}

module.exports = DemoServer; 