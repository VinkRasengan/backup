const { spawn, exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class SparkManager {
  constructor() {
    this.sparkHome = process.env.SPARK_HOME || '/opt/spark';
    this.sparkMaster = process.env.SPARK_MASTER_URL || 'spark://localhost:7077';
    this.jobsDir = path.join(__dirname, '../jobs');
    this.dataDir = path.join(__dirname, '../data');
    this.runningJobs = new Map();
    this.jobHistory = [];
    this.isInitialized = false;
  }

  async initialize() {
    try {
      logger.info('Initializing Spark Manager...');
      
      // Create necessary directories
      await fs.ensureDir(this.jobsDir);
      await fs.ensureDir(this.dataDir);
      await fs.ensureDir(path.join(__dirname, '../../logs'));
      
      // Check Spark installation (if running locally)
      if (process.env.NODE_ENV !== 'production') {
        await this.checkSparkInstallation();
      }
      
      this.isInitialized = true;
      logger.info('Spark Manager initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Spark Manager:', error);
      throw error;
    }
  }

  async checkSparkInstallation() {
    return new Promise((resolve, reject) => {
      exec('spark-submit --version', (error, stdout, stderr) => {
        if (error) {
          logger.warn('Spark not found locally, assuming Docker/remote setup');
          resolve(false);
        } else {
          logger.info('Spark installation detected:', stdout.split('\n')[0]);
          resolve(true);
        }
      });
    });
  }

  async submitJob(jobConfig) {
    const jobId = uuidv4();
    const startTime = Date.now();
    
    try {
      logger.logJobStart(jobId, jobConfig.type, jobConfig.params);
      
      const job = {
        id: jobId,
        type: jobConfig.type,
        status: 'running',
        startTime,
        params: jobConfig.params,
        config: jobConfig
      };
      
      this.runningJobs.set(jobId, job);
      
      // Execute job based on type
      let result;
      switch (jobConfig.type) {
        case 'fake-news-detection':
          result = await this.runFakeNewsDetection(jobConfig.params);
          break;
        case 'link-analysis':
          result = await this.runLinkAnalysis(jobConfig.params);
          break;
        case 'community-analytics':
          result = await this.runCommunityAnalytics(jobConfig.params);
          break;
        case 'batch-processing':
          result = await this.runBatchProcessing(jobConfig.params);
          break;
        default:
          throw new Error(`Unknown job type: ${jobConfig.type}`);
      }
      
      const duration = Date.now() - startTime;
      job.status = 'completed';
      job.endTime = Date.now();
      job.duration = duration;
      job.result = result;
      
      this.runningJobs.delete(jobId);
      this.jobHistory.push(job);
      
      logger.logJobComplete(jobId, jobConfig.type, duration, result);
      
      return {
        jobId,
        status: 'completed',
        duration,
        result
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const job = this.runningJobs.get(jobId);
      
      if (job) {
        job.status = 'failed';
        job.endTime = Date.now();
        job.duration = duration;
        job.error = error.message;
        
        this.runningJobs.delete(jobId);
        this.jobHistory.push(job);
      }
      
      logger.logJobError(jobId, jobConfig.type, error, jobConfig.params);
      
      throw {
        jobId,
        status: 'failed',
        duration,
        error: error.message
      };
    }
  }

  async runFakeNewsDetection(params) {
    logger.info('Running fake news detection job', params);
    
    // Simulate ML processing
    await this.delay(2000);
    
    const mockResults = {
      articlesProcessed: params.articleCount || 100,
      fakeNewsDetected: Math.floor(Math.random() * 20),
      averageConfidence: (Math.random() * 0.3 + 0.7).toFixed(3),
      processingTime: '2.1s',
      modelVersion: '1.0.0'
    };
    
    return mockResults;
  }

  async runLinkAnalysis(params) {
    logger.info('Running link analysis job', params);
    
    // Simulate link processing
    await this.delay(1500);
    
    const mockResults = {
      linksProcessed: params.linkCount || 500,
      maliciousLinks: Math.floor(Math.random() * 50),
      phishingAttempts: Math.floor(Math.random() * 10),
      averageRiskScore: (Math.random() * 0.4 + 0.1).toFixed(3),
      processingTime: '1.5s',
      patternsFound: ['suspicious-domain', 'url-shortener', 'typosquatting']
    };
    
    return mockResults;
  }

  async runCommunityAnalytics(params) {
    logger.info('Running community analytics job', params);
    
    // Simulate community data processing
    await this.delay(3000);
    
    const mockResults = {
      postsAnalyzed: params.postCount || 1000,
      usersAnalyzed: params.userCount || 200,
      sentimentScore: (Math.random() * 2 - 1).toFixed(3),
      engagementRate: (Math.random() * 0.5 + 0.2).toFixed(3),
      topTopics: ['covid-19', 'politics', 'technology', 'health'],
      processingTime: '3.0s'
    };
    
    return mockResults;
  }

  async runBatchProcessing(params) {
    logger.info('Running batch processing job', params);
    
    // Simulate batch data processing
    await this.delay(5000);
    
    const mockResults = {
      recordsProcessed: params.recordCount || 10000,
      successfulRecords: params.recordCount * 0.95 || 9500,
      failedRecords: params.recordCount * 0.05 || 500,
      processingRate: '2000 records/second',
      processingTime: '5.0s',
      outputPath: '/factcheck/data/processed/' + Date.now()
    };
    
    return mockResults;
  }

  async getJobStatus(jobId) {
    // Check running jobs
    if (this.runningJobs.has(jobId)) {
      return this.runningJobs.get(jobId);
    }
    
    // Check job history
    const historicalJob = this.jobHistory.find(job => job.id === jobId);
    if (historicalJob) {
      return historicalJob;
    }
    
    throw new Error(`Job ${jobId} not found`);
  }

  async cancelJob(jobId) {
    if (!this.runningJobs.has(jobId)) {
      throw new Error(`Job ${jobId} not found or not running`);
    }
    
    const job = this.runningJobs.get(jobId);
    job.status = 'cancelled';
    job.endTime = Date.now();
    job.duration = job.endTime - job.startTime;
    
    this.runningJobs.delete(jobId);
    this.jobHistory.push(job);
    
    logger.info(`Job ${jobId} cancelled`);
    
    return {
      jobId,
      status: 'cancelled',
      message: 'Job cancelled successfully'
    };
  }

  getRunningJobs() {
    return Array.from(this.runningJobs.values());
  }

  getJobHistory(limit = 50) {
    return this.jobHistory
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  getStats() {
    const totalJobs = this.jobHistory.length + this.runningJobs.size;
    const completedJobs = this.jobHistory.filter(job => job.status === 'completed').length;
    const failedJobs = this.jobHistory.filter(job => job.status === 'failed').length;
    const cancelledJobs = this.jobHistory.filter(job => job.status === 'cancelled').length;
    
    return {
      totalJobs,
      runningJobs: this.runningJobs.size,
      completedJobs,
      failedJobs,
      cancelledJobs,
      successRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(2) + '%' : '0%',
      isInitialized: this.isInitialized
    };
  }

  // Utility method for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new SparkManager();
