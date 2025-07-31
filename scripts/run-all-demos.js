#!/usr/bin/env node

/**
 * Run All Big Data Demos
 * Comprehensive test suite for Hadoop & Spark functionality
 */

const axios = require('axios');
const chalk = require('chalk');

class BigDataDemoRunner {
    constructor() {
        this.baseUrls = {
            spark: 'http://localhost:3010',
            analytics: 'http://localhost:3012',
            etl: 'http://localhost:3008',
            demo: 'http://localhost:3020'
        };
        
        this.testResults = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const symbols = {
            info: '🔄',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };
        
        const colors = {
            info: chalk.blue,
            success: chalk.green,
            error: chalk.red,
            warning: chalk.yellow
        };
        
        console.log(`${symbols[type]} [${timestamp}] ${colors[type](message)}`);
    }

    async runTest(testName, testFunction) {
        this.log(`Running ${testName}...`);
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name: testName,
                status: 'success',
                duration: `${duration}ms`,
                result
            });
            
            this.log(`${testName} completed in ${duration}ms`, 'success');
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name: testName,
                status: 'failed',
                duration: `${duration}ms`,
                error: error.message
            });
            
            this.log(`${testName} failed: ${error.message}`, 'error');
            return null;
        }
    }

    // Demo 1: Spark Service Health Check
    async testSparkHealth() {
        const response = await axios.get(`${this.baseUrls.spark}/health`);
        return {
            status: response.data.status,
            checks: Object.keys(response.data.checks || {}),
            timestamp: response.data.timestamp
        };
    }

    // Demo 2: Fake News Detection API
    async testFakeNewsDetection() {
        const testData = {
            type: 'fake-news-detection',
            data: {
                articles: [
                    {
                        id: 'demo-1',
                        content: 'This is a test article for fake news detection demo. It contains sample text for ML analysis.'
                    },
                    {
                        id: 'demo-2', 
                        content: 'Breaking: Shocking discovery reveals amazing facts that will surprise you!'
                    }
                ]
            }
        };

        const response = await axios.post(`${this.baseUrls.spark}/api/v1/jobs`, testData);
        return {
            jobId: response.data.data.jobId,
            status: response.data.data.status,
            result: response.data.data.result
        };
    }

    // Demo 3: ML Model Training
    async testMLTraining() {
        const trainingData = {
            modelType: 'fake-news-classifier',
            dataset: 'demo-training-set',
            hyperparameters: {
                epochs: 5,
                batchSize: 16,
                learningRate: 0.001
            }
        };

        const response = await axios.post(`${this.baseUrls.spark}/api/v1/ml/train`, trainingData);
        return {
            trainingId: response.data.data.id,
            modelType: response.data.data.modelType,
            status: response.data.data.status,
            estimatedCompletion: response.data.data.estimatedCompletion
        };
    }

    // Demo 4: Job History and Management
    async testJobManagement() {
        const response = await axios.get(`${this.baseUrls.spark}/api/v1/jobs`);
        return {
            runningJobs: response.data.data.running.length,
            totalJobs: response.data.data.stats.totalJobs,
            completedJobs: response.data.data.stats.completedJobs,
            successRate: response.data.data.stats.successRate
        };
    }

    // Demo 5: Analytics Dashboard
    async testAnalyticsDashboard() {
        const response = await axios.get(`${this.baseUrls.analytics}/api/v1/dashboard/overview`);
        return {
            totalUsers: response.data.data.summary.totalUsers,
            totalPosts: response.data.data.summary.totalPosts,
            systemUptime: response.data.data.summary.systemUptime,
            lastUpdated: response.data.data.lastUpdated
        };
    }

    // Demo 6: Analytics Health Check
    async testAnalyticsHealth() {
        const response = await axios.get(`${this.baseUrls.analytics}/health`);
        return {
            status: response.data.status,
            checks: Object.keys(response.data.checks || {}),
            warnings: response.data.status === 'warning' ? response.data.checks : null
        };
    }

    // Demo 7: Real-time Processing Simulation
    async testRealTimeProcessing() {
        // Simulate multiple concurrent jobs
        const jobs = [
            { type: 'fake-news-detection', articles: 50 },
            { type: 'fake-news-detection', articles: 25 },
            { type: 'fake-news-detection', articles: 75 }
        ];

        const jobPromises = jobs.map(async (job, index) => {
            const jobData = {
                type: job.type,
                data: {
                    articles: Array.from({ length: 5 }, (_, i) => ({
                        id: `batch-${index}-${i}`,
                        content: `Batch ${index} article ${i} for concurrent processing test`
                    }))
                }
            };

            const response = await axios.post(`${this.baseUrls.spark}/api/v1/jobs`, jobData);
            return response.data.data;
        });

        const results = await Promise.all(jobPromises);
        return {
            concurrentJobs: results.length,
            allSuccessful: results.every(r => r.status === 'completed'),
            totalProcessingTime: results.reduce((sum, r) => sum + (r.duration || 0), 0)
        };
    }

    // Demo 8: Demo Server Integration
    async testDemoServerIntegration() {
        const response = await axios.get(`${this.baseUrls.demo}/api/status`);
        return {
            server: response.data.server,
            demo: response.data.demo,
            services: response.data.services
        };
    }

    async runAllDemos() {
        console.log(chalk.bold.blue('\n🚀 Starting Comprehensive Big Data Demo Suite\n'));
        console.log(chalk.yellow('Testing Hadoop & Spark integration with FactCheck Platform...\n'));

        // Run all demo tests
        await this.runTest('Spark Service Health Check', () => this.testSparkHealth());
        await this.runTest('Fake News Detection API', () => this.testFakeNewsDetection());
        await this.runTest('ML Model Training API', () => this.testMLTraining());
        await this.runTest('Job Management API', () => this.testJobManagement());
        await this.runTest('Analytics Dashboard API', () => this.testAnalyticsDashboard());
        await this.runTest('Analytics Health Check', () => this.testAnalyticsHealth());
        await this.runTest('Real-time Processing', () => this.testRealTimeProcessing());
        await this.runTest('Demo Server Integration', () => this.testDemoServerIntegration());

        this.printResults();
    }

    printResults() {
        console.log(chalk.bold.blue('\n📊 Demo Results Summary:\n'));
        
        const successful = this.testResults.filter(r => r.status === 'success');
        const failed = this.testResults.filter(r => r.status === 'failed');
        
        console.log(chalk.green(`✅ Successful: ${successful.length}`));
        console.log(chalk.red(`❌ Failed: ${failed.length}`));
        console.log(chalk.blue(`📈 Success Rate: ${Math.round((successful.length / this.testResults.length) * 100)}%\n`));
        
        // Print detailed results
        this.testResults.forEach(result => {
            const status = result.status === 'success' ? chalk.green('✅') : chalk.red('❌');
            console.log(`${status} ${result.name} (${result.duration})`);
            
            if (result.status === 'success' && result.result) {
                const summary = this.getResultSummary(result.result);
                if (summary) {
                    console.log(`    ${chalk.gray(summary)}`);
                }
            } else if (result.status === 'failed') {
                console.log(`    ${chalk.red(result.error)}`);
            }
        });

        if (successful.length > 0) {
            console.log(chalk.bold.green('\n🎉 Big Data Demo Suite completed successfully!'));
            console.log(chalk.yellow('\n📊 Key Achievements:'));
            
            successful.forEach(result => {
                const achievement = this.getAchievement(result.name, result.result);
                if (achievement) {
                    console.log(`   • ${achievement}`);
                }
            });
        }

        console.log(chalk.bold.blue('\n🔗 Access Points:'));
        console.log(`   • Demo Presentation: http://localhost:3020/demo`);
        console.log(`   • Spark Service: http://localhost:3010/health`);
        console.log(`   • Analytics Service: http://localhost:3012/health`);
        console.log(`   • Frontend: http://localhost:3000`);
    }

    getResultSummary(result) {
        if (result.articlesProcessed) {
            return `Processed ${result.articlesProcessed} articles, detected ${result.fakeNewsDetected} fake news (${result.averageConfidence} confidence)`;
        }
        if (result.totalUsers) {
            return `${result.totalUsers} users, ${result.totalPosts} posts, ${result.systemUptime} uptime`;
        }
        if (result.concurrentJobs) {
            return `${result.concurrentJobs} concurrent jobs, ${result.allSuccessful ? 'all successful' : 'some failed'}`;
        }
        if (result.status) {
            return `Status: ${result.status}`;
        }
        return null;
    }

    getAchievement(testName, result) {
        const achievements = {
            'Fake News Detection API': result?.averageConfidence ? `Fake news detection with ${result.averageConfidence} confidence` : null,
            'ML Model Training API': result?.modelType ? `ML training started for ${result.modelType}` : null,
            'Analytics Dashboard API': result?.totalUsers ? `Dashboard serving ${result.totalUsers} users data` : null,
            'Real-time Processing': result?.concurrentJobs ? `${result.concurrentJobs} concurrent jobs processed` : null
        };
        
        return achievements[testName] || null;
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new BigDataDemoRunner();
    runner.runAllDemos().catch(console.error);
}

module.exports = BigDataDemoRunner;