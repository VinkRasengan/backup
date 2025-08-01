const axios = require('axios');
const logger = require('./logger');

class HealthCheck {
  constructor() {
    this.checks = new Map();
    this.setupChecks();
  }

  setupChecks() {
    // Spark Master connectivity check
    this.checks.set('spark-master', async () => {
      try {
        const sparkMasterUrl = process.env.SPARK_MASTER_URL || 'spark://localhost:7077';
        const webUIUrl = sparkMasterUrl.replace('spark://', 'http://').replace(':7077', ':8080');
        
        const response = await axios.get(`${webUIUrl}/api/v1/applications`, {
          timeout: 5000
        });
        
        return {
          status: 'healthy',
          responseTime: response.headers['x-response-time'] || 'N/A',
          applications: response.data?.length || 0
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    });

    // HDFS connectivity check
    this.checks.set('hdfs', async () => {
      try {
        const hdfsUrl = process.env.HDFS_NAMENODE_URL || 'hdfs://localhost:9000';
        const webUIUrl = hdfsUrl.replace('hdfs://', 'http://').replace(':9000', ':9870');
        
        const response = await axios.get(`${webUIUrl}/jmx?qry=Hadoop:service=NameNode,name=NameNodeStatus`, {
          timeout: 5000
        });
        
        return {
          status: 'healthy',
          nameNodeStatus: response.data?.beans?.[0]?.State || 'unknown'
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    });

    // Memory usage check
    this.checks.set('memory', async () => {
      const used = process.memoryUsage();
      const total = used.heapTotal;
      const usage = (used.heapUsed / total) * 100;
      
      return {
        status: usage < 90 ? 'healthy' : 'warning',
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
        usage: `${usage.toFixed(2)}%`
      };
    });

    // Job queue check
    this.checks.set('job-queue', async () => {
      try {
        // Simulate job queue check
        return {
          status: 'healthy',
          pendingJobs: 0,
          runningJobs: 0,
          completedJobs: 0
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    });
  }

  async performChecks() {
    const results = {};
    const startTime = Date.now();

    for (const [name, check] of this.checks) {
      try {
        results[name] = await check();
      } catch (error) {
        logger.error(`Health check failed for ${name}:`, error);
        results[name] = {
          status: 'error',
          error: error.message
        };
      }
    }

    const duration = Date.now() - startTime;
    const overallStatus = this.determineOverallStatus(results);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      checks: results
    };
  }

  determineOverallStatus(results) {
    const statuses = Object.values(results).map(r => r.status);
    
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('unhealthy')) return 'unhealthy';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }

  middleware() {
    return async (req, res) => {
      try {
        const health = await this.performChecks();
        
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'warning' ? 200 : 503;

        res.status(statusCode).json(health);
      } catch (error) {
        logger.error('Health check middleware error:', error);
        res.status(503).json({
          status: 'error',
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

module.exports = new HealthCheck();
