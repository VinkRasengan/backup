class HealthCheck {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.checks = new Map();
    this.startTime = Date.now();
  }

  addCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async runChecks() {
    const results = {};
    const promises = [];

    for (const [name, checkFunction] of this.checks) {
      promises.push(
        Promise.resolve(checkFunction())
          .then(result => ({ name, status: 'healthy', ...result }))
          .catch(error => ({ name, status: 'unhealthy', error: error.message }))
      );
    }

    const checkResults = await Promise.allSettled(promises);
    
    checkResults.forEach((result, index) => {
      const checkName = Array.from(this.checks.keys())[index];
      if (result.status === 'fulfilled') {
        results[checkName] = result.value;
      } else {
        results[checkName] = {
          name: checkName,
          status: 'unhealthy',
          error: result.reason?.message || 'Check failed'
        };
      }
    });

    return results;
  }

  middleware() {
    return async (req, res) => {
      try {
        const checks = await this.runChecks();
        const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
        
        const response = {
          service: this.serviceName,
          status: allHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: Date.now() - this.startTime,
          checks
        };

        res.status(allHealthy ? 200 : 503).json(response);
      } catch (error) {
        res.status(500).json({
          service: this.serviceName,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  liveness() {
    return (req, res) => {
      res.json({
        service: this.serviceName,
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime
      });
    };
  }

  readiness() {
    return async (req, res) => {
      try {
        const checks = await this.runChecks();
        const allReady = Object.values(checks).every(check => check.status === 'healthy');
        
        res.status(allReady ? 200 : 503).json({
          service: this.serviceName,
          status: allReady ? 'ready' : 'not ready',
          timestamp: new Date().toISOString(),
          checks
        });
      } catch (error) {
        res.status(503).json({
          service: this.serviceName,
          status: 'not ready',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

// Common health check functions
const commonChecks = {
  memory: (limitMB = 512) => {
    return () => {
      const usage = process.memoryUsage();
      const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
      
      return {
        memoryUsage: {
          used: `${usedMB}MB`,
          total: `${totalMB}MB`,
          limit: `${limitMB}MB`
        },
        healthy: usedMB < limitMB
      };
    };
  },

  database: (db) => {
    return async () => {
      if (!db) {
        throw new Error('Database not configured');
      }
      
      // Simple ping test
      await db.collection('health_check').limit(1).get();
      return { database: 'connected' };
    };
  },

  externalService: (serviceName, url) => {
    return async () => {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          timeout: 5000 
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return { 
          service: serviceName,
          url,
          status: 'reachable'
        };
      } catch (error) {
        throw new Error(`${serviceName} unreachable: ${error.message}`);
      }
    };
  }
};

module.exports = { HealthCheck, commonChecks };
