/**
 * Service Authentication Manager
 * Manages service-to-service authentication with individual keys and rotation
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Redis = require('redis');

class ServiceAuthManager {
  constructor(options = {}) {
    this.redisClient = null;
    this.masterSecret = options.masterSecret || process.env.SERVICE_MASTER_SECRET || 'default-master-secret';
    this.keyRotationInterval = options.keyRotationInterval || 24 * 60 * 60 * 1000; // 24 hours
    this.keyValidityPeriod = options.keyValidityPeriod || 48 * 60 * 60 * 1000; // 48 hours
    this.services = new Map();
    this.rotationTimer = null;
    
    this.initializeRedis(options.redis);
    this.initializeServices();
    this.startKeyRotation();
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis(redisConfig = {}) {
    try {
      this.redisClient = Redis.createClient({
        host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
        port: redisConfig.port || process.env.REDIS_PORT || 6379,
        password: redisConfig.password || process.env.REDIS_PASSWORD,
        db: redisConfig.db || 1 // Use different DB for security
      });

      this.redisClient.on('error', (err) => {
        console.error('Redis error in ServiceAuthManager:', err);
      });

      await this.redisClient.connect();
      console.log('ServiceAuthManager connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }

  /**
   * Initialize service configurations
   */
  initializeServices() {
    const serviceConfigs = [
      {
        name: 'api-gateway',
        permissions: ['route', 'proxy', 'health-check'],
        priority: 1
      },
      {
        name: 'auth-service',
        permissions: ['authenticate', 'authorize', 'user-management'],
        priority: 1
      },
      {
        name: 'link-service',
        permissions: ['scan-links', 'security-analysis', 'threat-detection'],
        priority: 2
      },
      {
        name: 'community-service',
        permissions: ['manage-posts', 'manage-comments', 'voting'],
        priority: 2
      },
      {
        name: 'chat-service',
        permissions: ['chat-management', 'ai-processing'],
        priority: 3
      },
      {
        name: 'news-service',
        permissions: ['news-management', 'content-aggregation'],
        priority: 3
      },
      {
        name: 'admin-service',
        permissions: ['admin-operations', 'system-monitoring', 'user-moderation'],
        priority: 1
      }
    ];

    serviceConfigs.forEach(config => {
      this.services.set(config.name, {
        ...config,
        currentKey: null,
        previousKey: null,
        keyGeneratedAt: null,
        keyExpiresAt: null
      });
    });
  }

  /**
   * Generate service key
   */
  generateServiceKey(serviceName) {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const serviceData = `${serviceName}:${timestamp}:${randomBytes}`;
    
    return {
      keyId: crypto.createHash('sha256').update(serviceData).digest('hex').substring(0, 16),
      key: crypto.createHmac('sha256', this.masterSecret).update(serviceData).digest('hex'),
      generatedAt: timestamp,
      expiresAt: timestamp + this.keyValidityPeriod
    };
  }

  /**
   * Rotate keys for a specific service
   */
  async rotateServiceKey(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    const newKey = this.generateServiceKey(serviceName);
    
    // Store previous key for grace period
    service.previousKey = service.currentKey;
    service.currentKey = newKey;
    service.keyGeneratedAt = newKey.generatedAt;
    service.keyExpiresAt = newKey.expiresAt;

    // Store in Redis
    await this.storeServiceKey(serviceName, newKey);
    
    console.log(`Key rotated for service: ${serviceName}, keyId: ${newKey.keyId}`);
    
    return newKey;
  }

  /**
   * Store service key in Redis
   */
  async storeServiceKey(serviceName, keyData) {
    if (!this.redisClient) return;

    const keyInfo = {
      keyId: keyData.keyId,
      key: keyData.key,
      serviceName,
      generatedAt: keyData.generatedAt,
      expiresAt: keyData.expiresAt,
      permissions: this.services.get(serviceName)?.permissions || []
    };

    await this.redisClient.setEx(
      `service_key:${serviceName}:${keyData.keyId}`,
      Math.floor(this.keyValidityPeriod / 1000),
      JSON.stringify(keyInfo)
    );

    // Store current key reference
    await this.redisClient.setEx(
      `service_current_key:${serviceName}`,
      Math.floor(this.keyValidityPeriod / 1000),
      keyData.keyId
    );
  }

  /**
   * Get service key from Redis
   */
  async getServiceKey(serviceName, keyId = null) {
    if (!this.redisClient) return null;

    try {
      let targetKeyId = keyId;
      
      if (!targetKeyId) {
        // Get current key ID
        targetKeyId = await this.redisClient.get(`service_current_key:${serviceName}`);
      }

      if (!targetKeyId) return null;

      const keyData = await this.redisClient.get(`service_key:${serviceName}:${targetKeyId}`);
      return keyData ? JSON.parse(keyData) : null;
    } catch (error) {
      console.error('Error getting service key:', error);
      return null;
    }
  }

  /**
   * Validate service authentication
   */
  async validateServiceAuth(serviceName, providedKey, keyId = null) {
    const service = this.services.get(serviceName);
    if (!service) {
      return { valid: false, reason: 'Unknown service' };
    }

    // Try to get key from Redis first
    let keyData = await this.getServiceKey(serviceName, keyId);
    
    // Fallback to in-memory if Redis unavailable
    if (!keyData && service.currentKey) {
      keyData = service.currentKey;
    }

    if (!keyData) {
      return { valid: false, reason: 'No key found' };
    }

    // Check if key is expired
    if (Date.now() > keyData.expiresAt) {
      return { valid: false, reason: 'Key expired' };
    }

    // Validate key
    if (keyData.key !== providedKey) {
      // Try previous key during rotation grace period
      if (service.previousKey && service.previousKey.key === providedKey) {
        if (Date.now() <= service.previousKey.expiresAt) {
          return { 
            valid: true, 
            service: serviceName, 
            permissions: service.permissions,
            keyId: service.previousKey.keyId,
            isGracePeriod: true
          };
        }
      }
      return { valid: false, reason: 'Invalid key' };
    }

    return { 
      valid: true, 
      service: serviceName, 
      permissions: service.permissions,
      keyId: keyData.keyId || keyData.keyId,
      isGracePeriod: false
    };
  }

  /**
   * Generate service JWT token
   */
  generateServiceToken(serviceName, permissions = null) {
    const service = this.services.get(serviceName);
    if (!service || !service.currentKey) {
      throw new Error(`Cannot generate token for service: ${serviceName}`);
    }

    const payload = {
      service: serviceName,
      permissions: permissions || service.permissions,
      keyId: service.currentKey.keyId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + 3600000) / 1000) // 1 hour
    };

    return jwt.sign(payload, service.currentKey.key, { algorithm: 'HS256' });
  }

  /**
   * Verify service JWT token
   */
  async verifyServiceToken(token) {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) {
        return { valid: false, reason: 'Invalid token format' };
      }

      const { service, keyId } = decoded.payload;
      const keyData = await this.getServiceKey(service, keyId);
      
      if (!keyData) {
        return { valid: false, reason: 'Key not found' };
      }

      const verified = jwt.verify(token, keyData.key);
      return { 
        valid: true, 
        payload: verified,
        service: verified.service,
        permissions: verified.permissions
      };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Start automatic key rotation
   */
  startKeyRotation() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    // Initial key generation for all services
    this.services.forEach(async (service, serviceName) => {
      if (!service.currentKey) {
        await this.rotateServiceKey(serviceName);
      }
    });

    // Set up rotation timer
    this.rotationTimer = setInterval(async () => {
      console.log('Starting scheduled key rotation...');
      
      for (const [serviceName] of this.services) {
        try {
          await this.rotateServiceKey(serviceName);
        } catch (error) {
          console.error(`Failed to rotate key for ${serviceName}:`, error);
        }
      }
      
      console.log('Scheduled key rotation completed');
    }, this.keyRotationInterval);

    console.log('Key rotation started with interval:', this.keyRotationInterval);
  }

  /**
   * Stop key rotation
   */
  stopKeyRotation() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      console.log('Key rotation stopped');
    }
  }

  /**
   * Get service authentication status
   */
  getAuthStatus() {
    const status = {};
    
    this.services.forEach((service, serviceName) => {
      status[serviceName] = {
        hasCurrentKey: !!service.currentKey,
        hasPreviousKey: !!service.previousKey,
        keyGeneratedAt: service.keyGeneratedAt,
        keyExpiresAt: service.keyExpiresAt,
        permissions: service.permissions,
        priority: service.priority
      };
    });

    return {
      services: status,
      rotationInterval: this.keyRotationInterval,
      keyValidityPeriod: this.keyValidityPeriod,
      redisConnected: !!this.redisClient
    };
  }

  /**
   * Force key rotation for all services
   */
  async forceKeyRotation() {
    console.log('Forcing key rotation for all services...');
    
    for (const [serviceName] of this.services) {
      try {
        await this.rotateServiceKey(serviceName);
      } catch (error) {
        console.error(`Failed to force rotate key for ${serviceName}:`, error);
      }
    }
    
    console.log('Force key rotation completed');
  }

  /**
   * Get service key for external use (for service startup)
   */
  async getServiceCredentials(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    if (!service.currentKey) {
      await this.rotateServiceKey(serviceName);
    }

    return {
      serviceName,
      keyId: service.currentKey.keyId,
      key: service.currentKey.key,
      permissions: service.permissions,
      expiresAt: service.currentKey.expiresAt
    };
  }

  /**
   * Cleanup expired keys
   */
  async cleanupExpiredKeys() {
    if (!this.redisClient) return;

    try {
      const keys = await this.redisClient.keys('service_key:*');
      let cleanedCount = 0;

      for (const key of keys) {
        const keyData = await this.redisClient.get(key);
        if (keyData) {
          const parsed = JSON.parse(keyData);
          if (Date.now() > parsed.expiresAt) {
            await this.redisClient.del(key);
            cleanedCount++;
          }
        }
      }

      console.log(`Cleaned up ${cleanedCount} expired service keys`);
    } catch (error) {
      console.error('Error cleaning up expired keys:', error);
    }
  }

  /**
   * Disconnect
   */
  async disconnect() {
    this.stopKeyRotation();
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

module.exports = ServiceAuthManager;
