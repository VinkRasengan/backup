const axios = require('axios');
const logger = require('./logger');

class HealthCheck {
  constructor() {
    this.serviceName = 'spark-service';
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

    // Disk space check
    this.checks.set('disk', async () => {
      try {
        const fs = require('fs');
        const stats = fs.statSync('./');
        
        return {
          status: 'healthy',
          available: 'N/A' // Would need additional library for actual disk space
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    });

    // Big Data features check
    this.checks.set('features', async () => {
      return {
        status: 'healthy',
        bigDataProcessing: process.env.ENABLE_BIG_DATA_PROCESSING === 'true',
        mlPipeline: process.env.ENABLE_ML_PIPELINE === 'true',
        batchAnalytics: process.env.ENABLE_BATCH_ANALYTICS === 'true'
      };
    });
  }

  async runChecks() {
    const results = {
      service: this.serviceName,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    let hasUnhealthy = false;
    let hasWarning = false;

    for (const [checkName, checkFunction] of this.checks) {
      try {
        const checkResult = await checkFunction();
        results.checks[checkName] = checkResult;

        if (checkResult.status === 'unhealthy') {
          hasUnhealthy = true;
        } else if (checkResult.status === 'warning') {
          hasWarning = true;
        }
      } catch (error) {
        results.checks[checkName] = {
          status: 'unhealthy',
          error: error.message
        };
        hasUnhealthy = true;
      }
    }

    // Determine overall status
    if (hasUnhealthy) {
      results.status = 'unhealthy';
    } else if (hasWarning) {
      results.status = 'warning';
    }

    return results;
  }

  middleware() {
    return async (req, res) => {
      try {
        const healthStatus = await this.runChecks();
        const statusCode = healthStatus.status === 'healthy' ? 200 : 
                          healthStatus.status === 'warning' ? 200 : 503;
        
        res.status(statusCode).json(healthStatus);
      } catch (error) {
        logger.error('Health check middleware error', { error: error.message });
        res.status(500).json({
          service: this.serviceName,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

module.exports = new HealthCheck();
