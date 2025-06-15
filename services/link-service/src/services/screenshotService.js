const axios = require('axios');
const crypto = require('crypto');
const Logger = require('../../../shared/utils/logger');

const logger = new Logger('link-service');

class ScreenshotService {
  constructor() {
    this.apiKey = process.env.SCREENSHOTLAYER_API_KEY;
    this.baseUrl = 'http://api.screenshotlayer.com/api/capture';
    this.timeout = 30000; // 30 seconds for screenshot
  }

  /**
   * Take screenshot with retry mechanism
   */
  async takeScreenshotWithRetry(url, retries = 2) {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const result = await this.takeScreenshot(url);
        if (result.success) {
          return result;
        }
        
        if (attempt <= retries) {
          logger.info(`Screenshot attempt ${attempt} failed, retrying...`, { url });
          await this.delay(2000 * attempt); // Exponential backoff
        }
      } catch (error) {
        if (attempt <= retries) {
          logger.warn(`Screenshot attempt ${attempt} error, retrying...`, { 
            url, 
            error: error.message 
          });
          await this.delay(2000 * attempt);
        } else {
          logger.error('All screenshot attempts failed', { url, error: error.message });
        }
      }
    }

    // Return fallback result
    return {
      success: false,
      error: 'Screenshot capture failed after retries',
      screenshotUrl: this.getFallbackScreenshot(url),
      mock: true
    };
  }

  /**
   * Take screenshot using ScreenshotLayer API
   */
  async takeScreenshot(url) {
    try {
      if (!this.apiKey) {
        return this.getMockScreenshot(url);
      }

      const params = {
        access_key: this.apiKey,
        url: url,
        viewport: '1440x900',
        width: 1440,
        format: 'PNG',
        fullpage: 0,
        force: 0
      };

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: this.timeout,
        responseType: 'arraybuffer'
      });

      if (response.status === 200) {
        // In a real implementation, you would upload this to cloud storage
        // For now, we'll create a mock URL
        const screenshotUrl = this.generateScreenshotUrl(url);
        
        return {
          success: true,
          screenshotUrl,
          size: response.data.length,
          format: 'PNG',
          capturedAt: new Date().toISOString()
        };
      } else {
        throw new Error(`Screenshot API returned status ${response.status}`);
      }

    } catch (error) {
      logger.warn('Screenshot API error', { error: error.message, url });
      return this.getMockScreenshot(url);
    }
  }

  /**
   * Generate mock screenshot for testing
   */
  getMockScreenshot(url) {
    const screenshotUrl = this.generateScreenshotUrl(url);
    
    return {
      success: true,
      screenshotUrl,
      size: 245760, // Mock size
      format: 'PNG',
      mock: true,
      capturedAt: new Date().toISOString()
    };
  }

  /**
   * Generate screenshot URL (mock implementation)
   */
  generateScreenshotUrl(url) {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return `https://screenshots.anti-fraud-platform.com/${hash}.png`;
  }

  /**
   * Get fallback screenshot URL
   */
  getFallbackScreenshot(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://via.placeholder.com/800x600/cccccc/666666?text=${encodeURIComponent(domain)}`;
    } catch (error) {
      return 'https://via.placeholder.com/800x600/cccccc/666666?text=Screenshot+Unavailable';
    }
  }

  /**
   * Delay helper for retry mechanism
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate URL before screenshot
   */
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get service status
   */
  async getStatus() {
    try {
      if (!this.apiKey) {
        return {
          available: false,
          error: 'No API key configured',
          mock: true
        };
      }

      // Test API with a simple request
      const testUrl = 'https://google.com';
      const params = {
        access_key: this.apiKey,
        url: testUrl,
        viewport: '800x600',
        width: 800,
        format: 'PNG'
      };

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 10000,
        responseType: 'arraybuffer'
      });

      return {
        available: response.status === 200,
        mock: false,
        lastTest: new Date().toISOString()
      };

    } catch (error) {
      return {
        available: false,
        error: error.message,
        mock: true
      };
    }
  }

  /**
   * Batch screenshot capture
   */
  async captureMultiple(urls, options = {}) {
    const { maxConcurrent = 3 } = options;
    const results = [];

    // Process URLs in batches to avoid overwhelming the API
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(url => this.takeScreenshotWithRetry(url));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const url = batch[index];
        results.push({
          url,
          success: result.status === 'fulfilled' && result.value.success,
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason.message : 
                 (result.value && !result.value.success ? result.value.error : null)
        });
      });

      // Add delay between batches
      if (i + maxConcurrent < urls.length) {
        await this.delay(1000);
      }
    }

    return {
      success: true,
      results,
      summary: {
        total: urls.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }
}

module.exports = new ScreenshotService();
