#!/usr/bin/env node

/**
 * Demo Spark Service APIs
 * Comprehensive test of Spark ML and job processing capabilities
 */

const axios = require('axios');
const chalk = require('chalk');

class SparkDemoRunner {
    constructor() {
        this.baseUrl = 'http://localhost:3010';
        this.results = [];
    }

    log(message, type = 'info') {
        const symbols = { info: '🔄', success: '✅', error: '❌', warning: '⚠️' };
        const colors = { info: chalk.blue, success: chalk.green, error: chalk.red, warning: chalk.yellow };
        console.log(`${symbols[type]} ${colors[type](message)}`);
    }

    async runDemo() {
        console.log(chalk.bold.red('\n🔥 Spark Service Demo - FactCheck Platform\n'));

        // Demo 1: Health Check
        await this.testHealthCheck();
        
        // Demo 2: Fake News Detection
        await this.testFakeNewsDetection();
        
        // Demo 3: ML Model Training
        await this.testMLTraining();
        
        // Demo 4: Batch Processing
        await this.testBatchProcessing();
        
        // Demo 5: Job Management
        await this.testJobManagement();

        this.printSummary();
    }

    async testHealthCheck() {
        this.log('Testing Spark Service Health...');
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            const data = response.data;
            
            console.log(`   Status: ${data.status}`);
            console.log(`   Checks: ${Object.keys(data.checks).join(', ')}`);
            console.log(`   Memory Usage: ${data.checks.memory?.usage || 'N/A'}`);
            
            this.results.push({ test: 'Health Check', status: 'success', data });
            this.log('Health check completed', 'success');
        } catch (error) {
            this.log(`Health check failed: ${error.message}`, 'error');
            this.results.push({ test: 'Health Check', status: 'failed', error: error.message });
        }
    }

    async testFakeNewsDetection() {
        this.log('Testing Fake News Detection API...');
        try {
            const testData = {
                type: 'fake-news-detection',
                data: {
                    articles: [
                        {
                            id: 'test-1',
                            content: 'Researchers at leading universities have published peer-reviewed studies showing the effectiveness of new renewable energy technologies.',
                            metadata: { source: 'academic', category: 'science' }
                        },
                        {
                            id: 'test-2', 
                            content: 'SHOCKING: Scientists HATE this one weird trick that makes you IMMORTAL! Click now before government BANS it!',
                            metadata: { source: 'unknown', category: 'health' }
                        },
                        {
                            id: 'test-3',
                            content: 'Breaking: Local mayor announces new infrastructure project to improve city transportation system based on citizen feedback.',
                            metadata: { source: 'municipal', category: 'politics' }
                        }
                    ]
                }
            };

            const response = await axios.post(`${this.baseUrl}/api/v1/jobs`, testData);
            const result = response.data.data;
            
            console.log(`   Job ID: ${result.jobId}`);
            console.log(`   Articles Processed: ${result.result.articlesProcessed}`);
            console.log(`   Fake News Detected: ${result.result.fakeNewsDetected}`);
            console.log(`   Average Confidence: ${result.result.averageConfidence}`);
            console.log(`   Processing Time: ${result.result.processingTime}`);
            console.log(`   Model Version: ${result.result.modelVersion}`);
            
            this.results.push({ test: 'Fake News Detection', status: 'success', data: result });
            this.log('Fake news detection completed', 'success');
        } catch (error) {
            this.log(`Fake news detection failed: ${error.message}`, 'error');
            this.results.push({ test: 'Fake News Detection', status: 'failed', error: error.message });
        }
    }

    async testMLTraining() {
        this.log('Testing ML Model Training API...');
        try {
            const trainingData = {
                modelType: 'fake-news-classifier',
                dataset: 'factcheck-training-v2',
                hyperparameters: {
                    epochs: 10,
                    batchSize: 32,
                    learningRate: 0.001,
                    dropout: 0.2,
                    hiddenLayers: [128, 64, 32]
                },
                features: ['text_length', 'sentiment_score', 'source_credibility', 'tf_idf'],
                validationSplit: 0.2
            };

            const response = await axios.post(`${this.baseUrl}/api/v1/ml/train`, trainingData);
            const result = response.data.data;
            
            console.log(`   Training ID: ${result.id}`);
            console.log(`   Model Type: ${result.modelType}`);
            console.log(`   Status: ${result.status}`);
            console.log(`   Progress: ${result.progress}%`);
            console.log(`   Estimated Completion: ${new Date(result.estimatedCompletion).toLocaleString()}`);
            
            this.results.push({ test: 'ML Training', status: 'success', data: result });
            this.log('ML training started successfully', 'success');
        } catch (error) {
            this.log(`ML training failed: ${error.message}`, 'error');
            this.results.push({ test: 'ML Training', status: 'failed', error: error.message });
        }
    }

    async testBatchProcessing() {
        this.log('Testing Batch Processing...');
        try {
            // Simulate large batch of articles
            const batchData = {
                type: 'batch-analysis',
                data: {
                    articles: Array.from({ length: 20 }, (_, i) => ({
                        id: `batch-${i}`,
                        content: `Article ${i}: ${this.generateSampleContent(i)}`,
                        metadata: { batch: true, index: i }
                    }))
                }
            };

            const response = await axios.post(`${this.baseUrl}/api/v1/jobs`, batchData);
            const result = response.data.data;
            
            console.log(`   Batch Job ID: ${result.jobId}`);
            console.log(`   Batch Size: ${batchData.data.articles.length} articles`);
            console.log(`   Processing Status: ${result.status}`);
            
            this.results.push({ test: 'Batch Processing', status: 'success', data: result });
            this.log('Batch processing completed', 'success');
        } catch (error) {
            this.log(`Batch processing failed: ${error.message}`, 'error');
            this.results.push({ test: 'Batch Processing', status: 'failed', error: error.message });
        }
    }

    async testJobManagement() {
        this.log('Testing Job Management APIs...');
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/jobs`);
            const data = response.data.data;
            
            console.log(`   Running Jobs: ${data.running.length}`);
            console.log(`   Total Jobs: ${data.stats.totalJobs}`);
            console.log(`   Completed Jobs: ${data.stats.completedJobs}`);
            console.log(`   Success Rate: ${data.stats.successRate}`);
            console.log(`   Service Initialized: ${data.stats.isInitialized}`);
            
            if (data.history.length > 0) {
                const lastJob = data.history[0];
                console.log(`   Last Job: ${lastJob.type} (${lastJob.status})`);
                console.log(`   Duration: ${lastJob.duration}ms`);
            }
            
            this.results.push({ test: 'Job Management', status: 'success', data });
            this.log('Job management APIs tested', 'success');
        } catch (error) {
            this.log(`Job management test failed: ${error.message}`, 'error');
            this.results.push({ test: 'Job Management', status: 'failed', error: error.message });
        }
    }

    generateSampleContent(index) {
        const contents = [
            'Scientific study reveals new insights into climate change mitigation strategies.',
            'MIRACLE cure discovered! Doctors are SHOCKED by this simple remedy!',
            'Government announces new policy to support small businesses during economic recovery.',
            'BREAKING: Celebrity spotted doing normal human activities!',
            'University researchers publish findings on sustainable agriculture practices.',
            'You won\'t believe what happened next in this CRAZY story!',
            'Local community organizes fundraiser for hospital equipment.',
            'URGENT: Forward this message or face terrible consequences!',
            'Technology company releases quarterly earnings report showing steady growth.',
            'Secret technique that THEY don\'t want you to know about!'
        ];
        return contents[index % contents.length];
    }

    printSummary() {
        console.log(chalk.bold.red('\n🔥 Spark Demo Results Summary:\n'));
        
        const successful = this.results.filter(r => r.status === 'success');
        const failed = this.results.filter(r => r.status === 'failed');
        
        console.log(chalk.green(`✅ Successful Tests: ${successful.length}`));
        console.log(chalk.red(`❌ Failed Tests: ${failed.length}`));
        console.log(chalk.blue(`📊 Success Rate: ${Math.round((successful.length / this.results.length) * 100)}%\n`));
        
        if (successful.length > 0) {
            console.log(chalk.bold.green('🎯 Key Achievements:'));
            successful.forEach(result => {
                console.log(`   • ${result.test}: ${this.getAchievementSummary(result)}`);
            });
        }
        
        if (failed.length > 0) {
            console.log(chalk.bold.red('\n⚠️  Failed Tests:'));
            failed.forEach(result => {
                console.log(`   • ${result.test}: ${result.error}`);
            });
        }
        
        console.log(chalk.bold.blue('\n🔗 Spark Service Endpoints:'));
        console.log(`   • Health Check: GET ${this.baseUrl}/health`);
        console.log(`   • Submit Job: POST ${this.baseUrl}/api/v1/jobs`);
        console.log(`   • Train Model: POST ${this.baseUrl}/api/v1/ml/train`);
        console.log(`   • Job History: GET ${this.baseUrl}/api/v1/jobs`);
    }

    getAchievementSummary(result) {
        if (result.test === 'Fake News Detection' && result.data.result) {
            return `${result.data.result.articlesProcessed} articles, ${result.data.result.averageConfidence} confidence`;
        }
        if (result.test === 'ML Training' && result.data) {
            return `${result.data.modelType} training started`;
        }
        if (result.test === 'Job Management' && result.data.stats) {
            return `${result.data.stats.successRate} success rate`;
        }
        return 'Completed successfully';
    }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const demo = new SparkDemoRunner();
    demo.runDemo().catch(console.error);
}

export default SparkDemoRunner;